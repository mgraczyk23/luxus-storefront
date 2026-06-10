import { NextRequest, NextResponse } from 'next/server'
import { getSiteSettings } from '@/lib/payload'

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const FROM  = 'Luxus Collection <noreply@luxus-collection.com>'
const SALES = 'sales@luxus-collection.com'
const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'https://api.luxus-collection.com'
const PK         = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

type OfferCheckoutBody = {
  checkoutToken: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  buyerAddress1?: string
  buyerCity?: string
  buyerState?: string
  buyerZip?: string
  fflDealerName?: string
  fflDealerAddress1?: string
  fflDealerCity?: string
  fflDealerState?: string
  fflDealerZip?: string
  fflContactName?: string
  fflContactPhone?: string
  fflContactEmail?: string
  paymentMethod?: string
  notes?: string
}

function emailWrap(content: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px 0;background:#f0ede8;font-family:Arial,sans-serif">
  <div style="max-width:640px;margin:0 auto;background:#faf9f7;border:1px solid #e8e4df">
    ${content}
    <div style="padding:20px 28px;border-top:1px solid #e8e4df;font-size:10px;color:#c9a96e;font-family:Arial,sans-serif;letter-spacing:0.1em;text-transform:uppercase">
      Luxus Collection — luxus-collection.com
    </div>
  </div>
</body></html>`
}

async function sendEmail(to: string, subject: string, html: string) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, reply_to: to === SALES ? undefined : SALES, subject, html }),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as OfferCheckoutBody | null
  if (!body?.checkoutToken) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  if (!RESEND_API_KEY)      return NextResponse.json({ error: 'Email not configured' }, { status: 500 })

  // Validate the checkout token with Medusa
  const redeemRes = await fetch(`${MEDUSA_URL}/store/offers/redeem/${body.checkoutToken}`, {
    headers: { 'x-publishable-api-key': PK },
    cache: 'no-store',
  })
  if (!redeemRes.ok) {
    const err = await redeemRes.json().catch(() => ({}))
    return NextResponse.json({ error: (err as any).error ?? 'Invalid checkout link' }, { status: redeemRes.status })
  }
  const { offer } = await redeemRes.json()

  const settings  = await getSiteSettings()
  const banking   = settings.banking
  const orderRef  = `OFFER-${offer.id.slice(-8).toUpperCase()}`
  const amount    = offer.counter_amount ?? offer.offer_amount
  const payMethod = body.paymentMethod || 'Wire Transfer'

  const buyerAddrLine = [body.buyerAddress1, body.buyerCity, body.buyerState, body.buyerZip].filter(Boolean).join(', ')
  const fflNameLine   = body.fflDealerName || ''
  const fflAddrLine   = [body.fflDealerAddress1, body.fflDealerCity, body.fflDealerState, body.fflDealerZip].filter(Boolean).join(', ')
  const fflContact    = [body.fflContactName, body.fflContactPhone, body.fflContactEmail].filter(Boolean).join(' · ')

  // ── Sales notification ──────────────────────────────────────────────────────
  const salesFields = [
    ['Order Reference',  orderRef],
    ['Payment Method',   `${payMethod} — PENDING`],
    ['Amount Due',       fmt(amount)],
    ['Customer',         `${body.firstName} ${body.lastName}`],
    ['Email',            body.email],
    ['Phone',            body.phone || '—'],
    ['Buyer Address',    buyerAddrLine || '—'],
    ['FFL Dealer',       fflNameLine || '—'],
    ...(fflAddrLine   ? [['FFL Address',  fflAddrLine]] : []),
    ...(fflContact    ? [['FFL Contact',  fflContact]] : []),
    ['Notes',            body.notes || '—'],
    ['Product',          offer.product_title],
    ['Original Offer',   fmt(offer.offer_amount)],
    ...(offer.counter_amount ? [['Counter Offer', fmt(offer.counter_amount)]] : []),
  ].map(([label, value]) => `
    <tr>
      <td style="padding:9px 16px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;white-space:nowrap;border-bottom:1px solid #f0ede8;vertical-align:top;width:160px">${label}</td>
      <td style="padding:9px 16px;font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;line-height:1.6;border-bottom:1px solid #f0ede8">${String(value).replace(/</g, '&lt;')}</td>
    </tr>`).join('')

  const salesHtml = emailWrap(`
    <div style="background:#1a1a1a;padding:20px 28px">
      <span style="font-size:9px;letter-spacing:0.26em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;font-weight:500">Luxus Collection</span>
      <span style="font-size:11px;color:#c9a96e;font-family:Arial,sans-serif;margin-left:16px;font-weight:500">ACCEPTED OFFER CHECKOUT — ${orderRef}</span>
    </div>
    <div style="padding:28px 28px 8px">
      <h2 style="font-size:22px;font-weight:400;color:#1a1a1a;margin:0 0 4px;font-family:Georgia,serif">Offer Checkout Submitted</h2>
      <p style="font-size:12px;color:#9e9994;font-family:Arial,sans-serif;margin:0 0 24px">Buyer has submitted checkout for an accepted offer. Hold item and await payment.</p>
    </div>
    <table style="width:100%;border-collapse:collapse">${salesFields}</table>`)

  // ── Customer wire instructions ──────────────────────────────────────────────
  const wireRows = [
    ['Bank',            banking.bankName      ?? ''],
    ['Account Name',    banking.accountName   ?? ''],
    ['Routing Number',  banking.routingNumber ?? ''],
    ['Account Number',  banking.accountNumber ?? ''],
    ...(banking.swiftCode ? [['SWIFT / BIC', banking.swiftCode]] : []),
    ['Memo / Reference', `${orderRef} (required)`],
  ].filter(([, v]) => v).map(([label, value]) => `
    <tr>
      <td style="padding:6px 0;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#888;font-family:Arial,sans-serif;width:160px;vertical-align:top">${label}</td>
      <td style="padding:6px 0;font-size:13px;color:${label === 'Memo / Reference' ? '#c9a96e' : '#fff'};font-family:Arial,sans-serif;font-weight:${label === 'Memo / Reference' ? '600' : '400'}">${value.replace(/</g, '&lt;')}</td>
    </tr>`).join('')

  const fflSection = fflNameLine ? `
    <div style="margin:0 28px 20px;padding:14px 16px;background:#f5f3ef;border-left:2px solid #c9a96e">
      <p style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;font-weight:500;margin:0 0 5px">Your FFL Transfer Dealer</p>
      <p style="font-size:13px;font-weight:500;color:#1a1a1a;font-family:Arial,sans-serif;margin:0 0 3px">${fflNameLine.replace(/</g, '&lt;')}</p>
      ${fflAddrLine ? `<p style="font-size:12px;color:#555;font-family:Arial,sans-serif;margin:0">${fflAddrLine.replace(/</g, '&lt;')}</p>` : ''}
    </div>` : ''

  const itemHtml = `
    <div style="padding:20px 28px 4px">
      <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;margin:0 0 12px">Your Purchase</p>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px 16px;font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8">${offer.product_title.replace(/</g, '&lt;')}</td>
          <td style="padding:8px 16px;font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8;text-align:right;font-weight:500">${fmt(amount)}</td>
        </tr>
      </table>
    </div>
    <div style="padding:16px 28px 28px;text-align:right">
      <span style="font-size:16px;font-weight:500;color:#1a1a1a;font-family:Georgia,serif">Total Due: ${fmt(amount)}</span>
    </div>`

  const customerHtml = emailWrap(`
    <div style="background:#1a1a1a;padding:20px 28px">
      <span style="font-size:9px;letter-spacing:0.26em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;font-weight:500">Luxus Collection</span>
    </div>
    <div style="padding:28px 28px 20px">
      <h2 style="font-size:24px;font-weight:400;color:#1a1a1a;margin:0 0 8px;font-family:Georgia,serif">Checkout Confirmed</h2>
      <p style="font-size:13px;color:#555;font-family:Arial,sans-serif;margin:0 0 4px">Thank you, ${body.firstName.replace(/</g, '&lt;')}. We've received your checkout details and your item is held pending payment.</p>
      <p style="font-size:12px;color:#9e9994;font-family:Arial,sans-serif;margin:0">Reference: <strong style="color:#1a1a1a;letter-spacing:0.05em">${orderRef}</strong></p>
    </div>
    <div style="margin:0 28px 24px;padding:20px;background:#1a1a1a">
      <p style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;font-weight:500;margin:0 0 14px">${payMethod === 'Check' ? 'Check Payment Instructions' : 'Wire Transfer Instructions'}</p>
      <p style="font-size:11px;color:#aaa;font-family:Arial,sans-serif;margin:0 0 16px">Please ${payMethod === 'Check' ? 'mail a check' : 'wire'} <strong style="color:#fff">${fmt(amount)}</strong> within 5 business days to hold your item.</p>
      <table style="width:100%;border-collapse:collapse">${wireRows}</table>
      <p style="font-size:11px;color:#c9a96e;font-family:Arial,sans-serif;margin:16px 0 0;font-weight:500">&#9888; Include your reference number with your payment.</p>
    </div>
    ${fflSection}
    ${itemHtml}
    <div style="padding:0 28px 28px">
      <p style="font-size:11px;color:#9e9994;font-family:Arial,sans-serif;line-height:1.7;margin:0">Questions? Contact us at <a href="mailto:${SALES}" style="color:#c9a96e">${SALES}</a></p>
    </div>`)

  const [salesRes, customerRes] = await Promise.all([
    sendEmail(SALES, `Offer Checkout ${orderRef} — ${body.firstName} ${body.lastName} — ${fmt(amount)}`, salesHtml),
    sendEmail(body.email, `Checkout Confirmed — ${offer.product_title} — ${orderRef}`, customerHtml),
  ])

  if (!salesRes.ok) {
    console.error('[checkout/offer] sales email failed:', await salesRes.text())
    return NextResponse.json({ error: 'Email send failed' }, { status: 502 })
  }
  if (!customerRes.ok) {
    console.error('[checkout/offer] customer email failed:', await customerRes.text())
  }

  return NextResponse.json({ ok: true, orderRef })
}
