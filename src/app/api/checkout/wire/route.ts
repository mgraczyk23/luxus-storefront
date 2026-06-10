import { NextRequest, NextResponse } from 'next/server'
import { getSiteSettings } from '@/lib/payload'

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const FROM = 'Luxus Collection <noreply@luxus-collection.com>'
const SALES = 'sales@luxus-collection.com'

type OrderItem = { title: string; quantity: number; price: number }

type WireBody = {
  orderRef: string
  amount: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  buyerPhone?: string
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
  notes?: string
  items: OrderItem[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

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

function itemRowsHtml(items: OrderItem[]) {
  return items.map(i => `
    <tr>
      <td style="padding:8px 16px;font-size:12px;color:#1a1a1a;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8">${i.title.replace(/</g, '&lt;')}</td>
      <td style="padding:8px 16px;font-size:12px;color:#1a1a1a;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8;text-align:center">${i.quantity}</td>
      <td style="padding:8px 16px;font-size:12px;color:#1a1a1a;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8;text-align:right">${fmt(i.price * i.quantity)}</td>
    </tr>`).join('')
}

function itemsTableHtml(itemRows: string, total: number) {
  return `
    <div style="padding:20px 28px 4px">
      <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;margin:0 0 12px">Items Ordered</p>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <th style="padding:8px 16px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;border-bottom:1px solid #e8e4df;text-align:left">Item</th>
          <th style="padding:8px 16px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;border-bottom:1px solid #e8e4df;text-align:center">Qty</th>
          <th style="padding:8px 16px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;border-bottom:1px solid #e8e4df;text-align:right">Price</th>
        </tr>
        ${itemRows}
      </table>
    </div>
    <div style="padding:16px 28px 28px;text-align:right">
      <span style="font-size:16px;font-weight:500;color:#1a1a1a;font-family:Georgia,serif">Total Due: ${fmt(total)}</span>
    </div>`
}

async function sendEmail(to: string, subject: string, html: string) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, reply_to: to === SALES ? undefined : SALES, subject, html }),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as WireBody | null
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  if (!RESEND_API_KEY) return NextResponse.json({ error: 'Email not configured' }, { status: 500 })

  const settings = await getSiteSettings()
  const banking = settings.banking

  const phone = body.buyerPhone || body.phone || ''
  const itemRows = itemRowsHtml(body.items)

  const buyerAddrLine = [body.buyerAddress1, body.buyerCity, body.buyerState, body.buyerZip].filter(Boolean).join(', ')

  const fflNameLine = body.fflDealerName || ''
  const fflAddrLine = [body.fflDealerAddress1, body.fflDealerCity, body.fflDealerState, body.fflDealerZip].filter(Boolean).join(', ')
  const fflContactParts = [body.fflContactName, body.fflContactPhone, body.fflContactEmail].filter(Boolean)
  const fflContactLine = fflContactParts.join(' · ')

  // ── Sales notification ──────────────────────────────────────────────────────
  const salesFields = [
    ['Order Reference', body.orderRef],
    ['Payment Method', 'Wire Transfer / Check — PENDING'],
    ['Amount Due', fmt(body.amount)],
    ['Customer', `${body.firstName} ${body.lastName}`],
    ['Email', body.email],
    ['Phone', phone || '—'],
    ['Buyer Address', buyerAddrLine || '—'],
    ['FFL Dealer', fflNameLine || '—'],
    ...(fflAddrLine ? [['FFL Address', fflAddrLine]] : []),
    ...(fflContactLine ? [['FFL Contact', fflContactLine]] : []),
    ['Notes', body.notes || '—'],
  ].map(([label, value]) => `
    <tr>
      <td style="padding:9px 16px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;white-space:nowrap;border-bottom:1px solid #f0ede8;vertical-align:top;width:160px">${label}</td>
      <td style="padding:9px 16px;font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;line-height:1.6;border-bottom:1px solid #f0ede8">${String(value).replace(/</g, '&lt;')}</td>
    </tr>`).join('')

  const salesHtml = emailWrap(`
    <div style="background:#1a1a1a;padding:20px 28px">
      <span style="font-size:9px;letter-spacing:0.26em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;font-weight:500">Luxus Collection</span>
      <span style="font-size:11px;color:#c9a96e;font-family:Arial,sans-serif;margin-left:16px;font-weight:500">WIRE/CHECK ORDER — ${body.orderRef}</span>
    </div>
    <div style="padding:28px 28px 8px">
      <h2 style="font-size:22px;font-weight:400;color:#1a1a1a;margin:0 0 4px;font-family:Georgia,serif">New Wire/Check Order</h2>
      <p style="font-size:12px;color:#9e9994;font-family:Arial,sans-serif;margin:0 0 24px">Payment pending. Hold order for 5 business days. Ship once funds are confirmed received.</p>
    </div>
    <table style="width:100%;border-collapse:collapse">${salesFields}</table>
    ${itemsTableHtml(itemRows, body.amount)}`)

  // ── Customer wire instructions ──────────────────────────────────────────────
  const wireRows = [
    ['Bank', banking.bankName ?? ''],
    ['Account Name', banking.accountName ?? ''],
    ['Routing Number', banking.routingNumber ?? ''],
    ['Account Number', banking.accountNumber ?? ''],
    ...(banking.swiftCode ? [['SWIFT / BIC', banking.swiftCode]] : []),
    ['Memo / Reference', body.orderRef + ' (required)'],
  ].filter(([, v]) => v).map(([label, value]) => `
    <tr>
      <td style="padding:9px 16px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;white-space:nowrap;border-bottom:1px solid #f0ede8;vertical-align:top;width:180px">${label}</td>
      <td style="padding:9px 16px;font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;line-height:1.6;border-bottom:1px solid #f0ede8;font-weight:${label === 'Memo / Reference' ? '600' : '400'}">${String(value).replace(/</g, '&lt;')}</td>
    </tr>`).join('')

  const fflSection = fflNameLine ? `
    <div style="margin:0 28px 20px;padding:14px 16px;background:#f5f3ef;border-left:2px solid #c9a96e">
      <p style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;font-weight:500;margin:0 0 5px">Your FFL Transfer Dealer</p>
      <p style="font-size:13px;font-weight:500;color:#1a1a1a;font-family:Arial,sans-serif;margin:0 0 3px">${fflNameLine.replace(/</g, '&lt;')}</p>
      ${fflAddrLine ? `<p style="font-size:12px;color:#555;font-family:Arial,sans-serif;margin:0">${fflAddrLine.replace(/</g, '&lt;')}</p>` : ''}
    </div>` : ''

  const customerHtml = emailWrap(`
    <div style="background:#1a1a1a;padding:20px 28px">
      <span style="font-size:9px;letter-spacing:0.26em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;font-weight:500">Luxus Collection</span>
    </div>
    <div style="padding:28px 28px 20px">
      <h2 style="font-size:24px;font-weight:400;color:#1a1a1a;margin:0 0 8px;font-family:Georgia,serif">Order Received</h2>
      <p style="font-size:13px;color:#555;font-family:Arial,sans-serif;margin:0 0 4px">Thank you, ${body.firstName.replace(/</g, '&lt;')}. Your order has been received and is reserved pending payment.</p>
      <p style="font-size:12px;color:#9e9994;font-family:Arial,sans-serif;margin:0">Order Reference: <strong style="color:#1a1a1a;letter-spacing:0.05em">${body.orderRef}</strong></p>
    </div>
    <div style="margin:0 28px 24px;padding:20px;background:#1a1a1a">
      <p style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;font-weight:500;margin:0 0 14px">Wire Transfer Instructions</p>
      <p style="font-size:11px;color:#aaa;font-family:Arial,sans-serif;margin:0 0 16px">Please wire <strong style="color:#fff">${fmt(body.amount)}</strong> within 5 business days to hold your order.</p>
      <table style="width:100%;border-collapse:collapse">
        ${[
          ['Bank', banking.bankName ?? ''],
          ['Account Name', banking.accountName ?? ''],
          ['Routing Number', banking.routingNumber ?? ''],
          ['Account Number', banking.accountNumber ?? ''],
          ...(banking.swiftCode ? [['SWIFT / BIC', banking.swiftCode]] : []),
          ['Memo / Reference', body.orderRef],
        ].filter(([, v]) => v).map(([label, value]) => `
        <tr>
          <td style="padding:6px 0;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#888;font-family:Arial,sans-serif;width:160px;vertical-align:top">${label}</td>
          <td style="padding:6px 0;font-size:13px;color:${label === 'Memo / Reference' ? '#c9a96e' : '#fff'};font-family:Arial,sans-serif;font-weight:${label === 'Memo / Reference' ? '600' : '400'}">${value.replace(/</g, '&lt;')}</td>
        </tr>`).join('')}
      </table>
      <p style="font-size:11px;color:#c9a96e;font-family:Arial,sans-serif;margin:16px 0 0;font-weight:500">&#9888; Include your order reference in the wire memo field.</p>
    </div>
    ${fflSection}
    ${itemsTableHtml(itemRows, body.amount)}
    <div style="padding:0 28px 28px">
      <p style="font-size:11px;color:#9e9994;font-family:Arial,sans-serif;line-height:1.7;margin:0 0 8px">Your order will be processed and shipped once we confirm receipt of funds, typically 3–5 business days after your transfer.</p>
      <p style="font-size:11px;color:#9e9994;font-family:Arial,sans-serif;line-height:1.7;margin:0">Questions? Contact us at <a href="mailto:${SALES}" style="color:#c9a96e">${SALES}</a></p>
    </div>`)

  const [salesRes, customerRes] = await Promise.all([
    sendEmail(SALES, `Wire/Check Order ${body.orderRef} — ${body.firstName} ${body.lastName} — ${fmt(body.amount)}`, salesHtml),
    sendEmail(body.email, `Order Received — Payment Instructions for ${body.orderRef}`, customerHtml),
  ])

  if (!salesRes.ok) {
    console.error('[checkout/wire] sales email failed:', await salesRes.text())
    return NextResponse.json({ error: 'Email send failed' }, { status: 502 })
  }
  if (!customerRes.ok) {
    console.error('[checkout/wire] customer email failed:', await customerRes.text())
  }

  return NextResponse.json({ ok: true })
}
