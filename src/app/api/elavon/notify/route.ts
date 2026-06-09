import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const FROM = 'Luxus Collection <noreply@luxus-collection.com>'
const SALES = 'sales@luxus-collection.com'

type OrderItem = { title: string; quantity: number; price: number }

type NotifyBody = {
  orderRef: string
  approvalCode: string
  txnId: string
  amount: number
  firstName: string
  lastName: string
  email: string
  phone: string
  fflDealerName: string
  fflDealerCity: string
  fflDealerState: string
  notes: string
  items: OrderItem[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as NotifyBody | null
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  if (!RESEND_API_KEY) return NextResponse.json({ error: 'Email not configured' }, { status: 500 })

  const itemRows = body.items.map(i => `
    <tr>
      <td style="padding:8px 16px;font-size:12px;color:#1a1a1a;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8">${i.title}</td>
      <td style="padding:8px 16px;font-size:12px;color:#1a1a1a;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8;text-align:center">${i.quantity}</td>
      <td style="padding:8px 16px;font-size:12px;color:#1a1a1a;font-family:Arial,sans-serif;border-bottom:1px solid #f0ede8;text-align:right">${fmt(i.price * i.quantity)}</td>
    </tr>`).join('')

  const rows = [
    ['Order Reference', body.orderRef],
    ['Approval Code', body.approvalCode],
    ['Transaction ID', body.txnId],
    ['Total Charged', fmt(body.amount)],
    ['Customer', `${body.firstName} ${body.lastName}`],
    ['Email', body.email],
    ['Phone', body.phone || '—'],
    ['FFL Dealer', body.fflDealerName || '—'],
    ['FFL City/State', [body.fflDealerCity, body.fflDealerState].filter(Boolean).join(', ') || '—'],
    ['Notes', body.notes || '—'],
  ].map(([label, value]) => `
    <tr>
      <td style="padding:9px 16px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;white-space:nowrap;border-bottom:1px solid #f0ede8;vertical-align:top;width:160px">${label}</td>
      <td style="padding:9px 16px;font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;line-height:1.6;border-bottom:1px solid #f0ede8">${String(value).replace(/</g, '&lt;')}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px 0;background:#f0ede8;font-family:Arial,sans-serif">
  <div style="max-width:640px;margin:0 auto;background:#faf9f7;border:1px solid #e8e4df">
    <div style="background:#1a1a1a;padding:20px 28px;display:flex;align-items:center;gap:16px">
      <span style="font-size:9px;letter-spacing:0.26em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;font-weight:500">Luxus Collection</span>
      <span style="font-size:11px;color:#c9a96e;font-family:Arial,sans-serif;margin-left:auto;font-weight:500">NEW ORDER — ${body.orderRef}</span>
    </div>
    <div style="padding:28px 28px 8px">
      <h2 style="font-size:22px;font-weight:400;color:#1a1a1a;margin:0 0 4px;font-family:Georgia,serif">Order Approved</h2>
      <p style="font-size:12px;color:#9e9994;font-family:Arial,sans-serif;margin:0 0 24px">Payment was approved by Elavon Converge. Contact the customer to arrange FFL transfer and shipping.</p>
    </div>
    <table style="width:100%;border-collapse:collapse">${rows}</table>
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
      <span style="font-size:16px;font-weight:500;color:#1a1a1a;font-family:Georgia,serif">Total: ${fmt(body.amount)}</span>
    </div>
    <div style="padding:20px 28px;border-top:1px solid #e8e4df;font-size:10px;color:#c9a96e;font-family:Arial,sans-serif;letter-spacing:0.1em;text-transform:uppercase">
      Luxus Collection — Order Notification
    </div>
  </div>
</body></html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: SALES,
      reply_to: body.email,
      subject: `New Order ${body.orderRef} — ${body.firstName} ${body.lastName} — ${fmt(body.amount)}`,
      html,
    }),
  })

  if (!res.ok) {
    console.error('[elavon/notify] resend error:', await res.text())
    return NextResponse.json({ error: 'Email send failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
