import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const FROM = 'Luxus Collection <noreply@luxus-collection.com>'
const SALES = 'sales@luxus-collection.com'

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

  // Parse form-encoded body from Elavon
  let fields: Record<string, string> = {}
  try {
    const text = await req.text()
    fields = Object.fromEntries(new URLSearchParams(text))
  } catch {
    return NextResponse.redirect(`${origin}/checkout?error=bad_response`)
  }

  const sslResult       = fields.ssl_result ?? ''
  const orderRef        = fields.ssl_invoice_number ?? ''
  const approvalCode    = fields.ssl_approval_code ?? ''
  const txnId           = fields.ssl_txn_id ?? ''
  const rawAmount       = fields.ssl_amount ?? '0'
  const amount          = parseFloat(rawAmount.replace(/,/g, ''))
  const firstName       = fields.ssl_first_name ?? ''
  const lastName        = fields.ssl_last_name ?? ''
  const email           = fields.ssl_email ?? ''
  const resultMessage   = fields.ssl_result_message ?? ''

  // Recover order details from cookie (set by checkout page before redirect)
  let pendingOrder: {
    phone?: string
    fflDealerName?: string
    fflDealerCity?: string
    fflDealerState?: string
    notes?: string
    items?: Array<{ title: string; quantity: number; price: number }>
  } = {}

  try {
    const raw = req.cookies.get('lxs_pending')?.value
    if (raw) pendingOrder = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'))
  } catch { /* cookie missing or malformed — proceed without extra details */ }

  // Declined or error
  if (sslResult !== '0') {
    const msg = resultMessage || 'Payment was declined. Please try again or use a different card.'
    const res = NextResponse.redirect(`${origin}/checkout?declined=${encodeURIComponent(msg)}`)
    res.cookies.delete('lxs_pending')
    return res
  }

  // ── Approved ────────────────────────────────────────────────────────────────
  const { phone = '', fflDealerName = '', fflDealerCity = '', fflDealerState = '', notes = '', items = [] } = pendingOrder
  const fflLine = [fflDealerName, fflDealerCity, fflDealerState].filter(Boolean).join(', ')

  const itemRowsHtml = items.map(i => `
    <tr>
      <td style="padding:8px 16px;font-size:12px;color:#1a1a1a;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8">${i.title.replace(/</g, '&lt;')}</td>
      <td style="padding:8px 16px;font-size:12px;color:#1a1a1a;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8;text-align:center">${i.quantity}</td>
      <td style="padding:8px 16px;font-size:12px;color:#1a1a1a;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8;text-align:right">${fmt(i.price * i.quantity)}</td>
    </tr>`).join('')

  const itemsBlock = items.length > 0 ? `
    <div style="padding:20px 28px 4px">
      <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;margin:0 0 12px">Items Ordered</p>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <th style="padding:8px 16px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;border-bottom:1px solid #e8e4df;text-align:left">Item</th>
          <th style="padding:8px 16px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;border-bottom:1px solid #e8e4df;text-align:center">Qty</th>
          <th style="padding:8px 16px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;border-bottom:1px solid #e8e4df;text-align:right">Price</th>
        </tr>
        ${itemRowsHtml}
      </table>
    </div>
    <div style="padding:12px 28px 24px;text-align:right">
      <span style="font-size:15px;font-weight:500;color:#1a1a1a;font-family:Georgia,serif">Total: ${fmt(amount)}</span>
    </div>` : ''

  // Sales email
  const salesFields = [
    ['Order Reference', orderRef],
    ['Approval Code', approvalCode],
    ['Transaction ID', txnId],
    ['Total Charged', fmt(amount)],
    ['Customer', `${firstName} ${lastName}`],
    ['Email', email],
    ['Phone', phone || '—'],
    ['FFL Dealer', fflLine || '—'],
    ['Notes', notes || '—'],
  ].map(([label, value]) => `
    <tr>
      <td style="padding:9px 16px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;white-space:nowrap;border-bottom:1px solid #f0ede8;vertical-align:top;width:160px">${label}</td>
      <td style="padding:9px 16px;font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;line-height:1.6;border-bottom:1px solid #f0ede8">${String(value).replace(/</g, '&lt;')}</td>
    </tr>`).join('')

  const salesHtml = emailWrap(`
    <div style="background:#1a1a1a;padding:20px 28px">
      <span style="font-size:9px;letter-spacing:0.26em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;font-weight:500">Luxus Collection</span>
      <span style="font-size:11px;color:#c9a96e;font-family:Arial,sans-serif;margin-left:16px;font-weight:500">NEW ORDER — ${orderRef}</span>
    </div>
    <div style="padding:28px 28px 8px">
      <h2 style="font-size:22px;font-weight:400;color:#1a1a1a;margin:0 0 4px;font-family:Georgia,serif">Order Approved</h2>
      <p style="font-size:12px;color:#9e9994;font-family:Arial,sans-serif;margin:0 0 24px">Payment approved via Elavon Converge Hosted Payments. Contact customer to arrange FFL transfer and shipping.</p>
    </div>
    <table style="width:100%;border-collapse:collapse">${salesFields}</table>
    ${itemsBlock}`)

  // Customer email
  const fflSection = fflLine ? `
    <div style="margin:0 28px 20px;padding:14px 16px;background:#f5f3ef;border-left:2px solid #c9a96e">
      <p style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;font-weight:500;margin:0 0 5px">FFL Transfer Dealer</p>
      <p style="font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;margin:0">${fflLine.replace(/</g, '&lt;')}</p>
      <p style="font-size:11px;color:#9e9994;font-family:Arial,sans-serif;margin:6px 0 0">We will ship directly to this dealer. They will contact you when your firearm arrives for pickup.</p>
    </div>` : `
    <div style="margin:0 28px 20px;padding:14px 16px;background:#f5f3ef;border-left:2px solid #c9a96e">
      <p style="font-size:11px;color:#9e9994;font-family:Arial,sans-serif;margin:0">We will contact you to confirm your FFL transfer dealer before shipping.</p>
    </div>`

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
        <td style="padding:9px 16px;font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8;font-weight:500;letter-spacing:0.05em">${orderRef}</td>
      </tr>
      <tr>
        <td style="padding:9px 16px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8;width:160px">Total Charged</td>
        <td style="padding:9px 16px;font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8">${fmt(amount)}</td>
      </tr>
    </table>
    ${itemsBlock}
    ${fflSection}
    <div style="padding:0 28px 28px">
      <p style="font-size:11px;color:#9e9994;font-family:Arial,sans-serif;line-height:1.7;margin:0">We will be in touch within one business day to confirm shipping details.</p>
    </div>`)

  // Fire emails (non-blocking — order is already approved)
  const emailPromises = [
    sendEmail(SALES, `New Order ${orderRef} — ${firstName} ${lastName} — ${fmt(amount)}`, salesHtml, email),
  ]
  if (email) {
    emailPromises.push(sendEmail(email, `Order Confirmed — ${orderRef}`, customerHtml, SALES))
  }
  await Promise.allSettled(emailPromises)

  // Clear pending cookie and redirect to confirmation
  const res = NextResponse.redirect(
    `${origin}/order-confirmation?ref=${encodeURIComponent(orderRef)}&name=${encodeURIComponent(firstName)}&method=card`
  )
  res.cookies.delete('lxs_pending')
  return res
}

// Some versions of Elavon use GET for the return — handle both
export async function GET(req: NextRequest) {
  return POST(req)
}
