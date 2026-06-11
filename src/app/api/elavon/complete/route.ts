import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'https://api.luxus-collection.com'
const MEDUSA_PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''
const ELAVON_PROXY_SECRET = process.env.ELAVON_PROXY_SECRET ?? ''
const FROM = 'Luxus Collection <noreply@luxus-collection.com>'
const SALES = 'sales@luxus-collection.com'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)

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

async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  if (!RESEND_API_KEY) return
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, reply_to: replyTo, subject, html }),
  })
}

// Elavon POSTs payment result to this route after the customer pays on their hosted page.
export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin

  // ── Verify callback signature ────────────────────────────────────────────────
  // The return URL was signed with HMAC-SHA256(ELAVON_PROXY_SECRET, cartId) when
  // the token was created. Reject any POST that doesn't carry a valid sig — this
  // prevents fake callbacks from creating orders without real payment.
  const urlCart = req.nextUrl.searchParams.get('cart')
  const urlSig  = req.nextUrl.searchParams.get('sig')

  if (!urlCart || !urlSig || !ELAVON_PROXY_SECRET) {
    console.warn('[elavon/complete] missing cart/sig in return URL')
    return NextResponse.redirect(`${origin}/checkout?error=invalid_callback`)
  }

  const expectedSig = crypto
    .createHmac('sha256', ELAVON_PROXY_SECRET)
    .update(urlCart)
    .digest('hex')
    .slice(0, 32)

  if (expectedSig !== urlSig) {
    console.warn('[elavon/complete] callback signature mismatch — possible forged request')
    return NextResponse.redirect(`${origin}/checkout?error=invalid_callback`)
  }

  // Cart ID is now verified — use it as the authoritative source (more reliable than cookie)
  const cartId = urlCart

  // Parse form-encoded body from Elavon
  let fields: Record<string, string> = {}
  try {
    const text = await req.text()
    fields = Object.fromEntries(new URLSearchParams(text))
  } catch {
    return NextResponse.redirect(`${origin}/checkout?error=bad_response`)
  }

  const sslResult     = fields.ssl_result ?? ''
  const approvalCode  = fields.ssl_approval_code ?? ''
  const txnId         = fields.ssl_txn_id ?? ''
  const rawAmount     = fields.ssl_amount ?? '0'
  const amount        = parseFloat(rawAmount.replace(/,/g, ''))
  const firstName     = fields.ssl_first_name ?? ''
  const lastName      = fields.ssl_last_name ?? ''
  const email         = fields.ssl_email ?? ''
  const resultMessage = fields.ssl_result_message ?? ''

  // Declined or error — redirect back to checkout
  if (sslResult !== '0') {
    const msg = resultMessage || 'Payment was declined. Please try again or use a different card.'
    const res = NextResponse.redirect(`${origin}/checkout?declined=${encodeURIComponent(msg)}`)
    res.cookies.delete('lxs_cart')
    return res
  }

  // Call Medusa to update payment session and complete the cart → creates a Medusa order
  let orderId: string | undefined
  let displayId: string | number | undefined

  try {
    const finalizeRes = await fetch(`${MEDUSA_URL}/store/elavon/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': MEDUSA_PK,
        'x-elavon-proxy-secret': ELAVON_PROXY_SECRET,
      },
      body: JSON.stringify({
        cartId,
        ssl_result: sslResult,
        ssl_txn_id: txnId,
        ssl_approval_code: approvalCode,
        ssl_amount: rawAmount,
        ssl_result_message: resultMessage,
      }),
    })

    const finalizeData = await finalizeRes.json()

    if (!finalizeRes.ok || finalizeData.error) {
      console.error('[elavon/complete] finalize failed:', finalizeData.error)
      // Payment WAS approved by Elavon — flag for follow-up rather than showing an error
      const res = NextResponse.redirect(
        `${origin}/order-confirmation?ref=${encodeURIComponent(approvalCode || cartId)}&name=${encodeURIComponent(firstName)}&method=card&warn=1`
      )
      res.cookies.delete('lxs_cart')
      return res
    }

    orderId   = finalizeData.orderId
    displayId = finalizeData.displayId
  } catch (err) {
    console.error('[elavon/complete] finalize fetch error:', err)
    const res = NextResponse.redirect(
      `${origin}/order-confirmation?ref=${encodeURIComponent(approvalCode || cartId)}&name=${encodeURIComponent(firstName)}&method=card&warn=1`
    )
    res.cookies.delete('lxs_cart')
    return res
  }

  const orderRef = String(displayId ?? orderId ?? cartId)

  // ── Send emails (non-blocking — order is already in Medusa) ─────────────────
  const salesRows = [
    ['Medusa Order', `#${orderRef}`],
    ['Approval Code', approvalCode],
    ['Transaction ID', txnId],
    ['Total Charged', fmt(amount)],
    ['Customer', `${firstName} ${lastName}`],
    ['Email', email],
  ].map(([label, value]) => `
    <tr>
      <td style="padding:9px 16px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;white-space:nowrap;border-bottom:1px solid #f0ede8;vertical-align:top;width:160px">${label}</td>
      <td style="padding:9px 16px;font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;line-height:1.6;border-bottom:1px solid #f0ede8">${String(value).replace(/</g, '&lt;')}</td>
    </tr>`).join('')

  const salesHtml = emailWrap(`
    <div style="background:#1a1a1a;padding:20px 28px">
      <span style="font-size:9px;letter-spacing:0.26em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;font-weight:500">Luxus Collection</span>
      <span style="font-size:11px;color:#c9a96e;font-family:Arial,sans-serif;margin-left:16px;font-weight:500">NEW ORDER — #${orderRef}</span>
    </div>
    <div style="padding:28px 28px 8px">
      <h2 style="font-size:22px;font-weight:400;color:#1a1a1a;margin:0 0 4px;font-family:Georgia,serif">Order Approved</h2>
      <p style="font-size:12px;color:#9e9994;font-family:Arial,sans-serif;margin:0 0 24px">Payment approved via Elavon Converge. Full order details in Medusa Admin. Contact customer to arrange FFL transfer and shipping.</p>
    </div>
    <table style="width:100%;border-collapse:collapse">${salesRows}</table>`)

  const customerHtml = emailWrap(`
    <div style="background:#1a1a1a;padding:20px 28px">
      <span style="font-size:9px;letter-spacing:0.26em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;font-weight:500">Luxus Collection</span>
    </div>
    <div style="padding:28px 28px 8px">
      <h2 style="font-size:24px;font-weight:400;color:#1a1a1a;margin:0 0 8px;font-family:Georgia,serif">Order Confirmed</h2>
      <p style="font-size:13px;color:#555;font-family:Arial,sans-serif;margin:0 0 4px">Thank you, ${firstName.replace(/</g, '&lt;')}. Your payment has been approved and your order is confirmed.</p>
      <p style="font-size:12px;color:#9e9994;font-family:Arial,sans-serif;margin:0 0 24px">Questions? Reply to this email or contact us at <a href="mailto:${SALES}" style="color:#c9a96e">${SALES}</a></p>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:9px 16px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8;width:160px">Order Reference</td>
        <td style="padding:9px 16px;font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8;font-weight:500;letter-spacing:0.05em">#${orderRef}</td>
      </tr>
      <tr>
        <td style="padding:9px 16px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8;width:160px">Total Charged</td>
        <td style="padding:9px 16px;font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8">${fmt(amount)}</td>
      </tr>
    </table>
    <div style="margin:20px 28px;padding:14px 16px;background:#f5f3ef;border-left:2px solid #c9a96e">
      <p style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;font-weight:500;margin:0 0 5px">Next Steps</p>
      <p style="font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;margin:0 0 6px">We will contact you within one business day to confirm your FFL transfer dealer and arrange shipping.</p>
      <p style="font-size:11px;color:#9e9994;font-family:Arial,sans-serif;margin:0">All firearms require FFL transfer to a licensed dealer near you.</p>
    </div>`)

  await Promise.allSettled([
    sendEmail(SALES, `New Order #${orderRef} — ${firstName} ${lastName} — ${fmt(amount)}`, salesHtml, email || undefined),
    ...(email ? [sendEmail(email, `Order Confirmed — #${orderRef}`, customerHtml, SALES)] : []),
  ])

  const res = NextResponse.redirect(
    `${origin}/order-confirmation?ref=${encodeURIComponent(orderRef)}&oid=${encodeURIComponent(orderId ?? '')}&name=${encodeURIComponent(firstName)}&method=card`
  )
  res.cookies.delete('lxs_cart')
  return res
}

// Elavon may POST or GET for the return URL — handle both
export async function GET(req: NextRequest) {
  return POST(req)
}
