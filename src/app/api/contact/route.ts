import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const FROM = 'Luxus Collection <noreply@luxus-collection.com>'

const MAILBOXES: Record<string, string> = {
  info:    'info@luxus-collection.com',
  support: 'support@luxus-collection.com',
  sales:   'sales@luxus-collection.com',
}

const LABELS: Record<string, string> = {
  firstName:     'First Name',
  lastName:      'Last Name',
  email:         'Email',
  phone:         'Phone',
  company:       'Company',
  topic:         'Topic',
  orderNumber:   'Order Number',
  inquiryType:   'Inquiry Type',
  make:          'Make',
  model:         'Model',
  estimatedValue:'Estimated Value',
  product:       'Product',
  message:       'Message',
  fflConsent:    'FFL Acknowledged',
  newsletter:    'Newsletter Opt-in',
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { mailbox, subject, ...fields } = body as Record<string, string>

  const to = MAILBOXES[mailbox]
  if (!to) return NextResponse.json({ error: 'Invalid mailbox' }, { status: 400 })
  if (!fields.email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
  if (!RESEND_API_KEY) return NextResponse.json({ error: 'Email not configured' }, { status: 500 })

  const rows = Object.entries(fields)
    .filter(([, v]) => v && v !== 'false')
    .map(([k, v]) => {
      const label = LABELS[k] ?? k
      const value = v === 'true' ? 'Yes' : v
      return `
        <tr>
          <td style="padding:9px 16px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9e9994;font-family:Arial,sans-serif;white-space:nowrap;border-bottom:1px solid #f0ede8;vertical-align:top;width:140px">${label}</td>
          <td style="padding:9px 16px;font-size:13px;color:#1a1a1a;font-family:Arial,sans-serif;line-height:1.6;border-bottom:1px solid #f0ede8">${String(value).replace(/</g, '&lt;')}</td>
        </tr>`
    }).join('')

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px 0;background:#f0ede8;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#faf9f7;border:1px solid #e8e4df">
    <div style="background:#1a1a1a;padding:20px 28px;display:flex;align-items:center;gap:16px">
      <span style="font-size:9px;letter-spacing:0.26em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;font-weight:500">Luxus Collection</span>
      <span style="font-size:9px;color:#555;font-family:Arial,sans-serif;margin-left:auto">→ ${to}</span>
    </div>
    <div style="padding:28px 28px 8px">
      <h2 style="font-size:20px;font-weight:400;color:#1a1a1a;margin:0 0 4px;font-family:Georgia,serif">${(subject ?? 'New Inquiry').replace(/</g, '&lt;')}</h2>
      <p style="font-size:11px;color:#9e9994;font-family:Arial,sans-serif;margin:0 0 20px">Reply to this email to respond directly to ${fields.email}</p>
    </div>
    <table style="width:100%;border-collapse:collapse">
      ${rows}
    </table>
    <div style="padding:20px 28px;border-top:1px solid #e8e4df;font-size:10px;color:#c9a96e;font-family:Arial,sans-serif;letter-spacing:0.1em;text-transform:uppercase">
      Luxus Collection — Internal Notification
    </div>
  </div>
</body></html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, reply_to: fields.email, subject: subject ?? `New inquiry from ${fields.firstName ?? ''} ${fields.lastName ?? ''}`.trim(), html }),
  })

  if (!res.ok) return NextResponse.json({ error: 'Send failed' }, { status: 502 })
  return NextResponse.json({ ok: true })
}
