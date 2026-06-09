import { NextRequest, NextResponse } from 'next/server'

const BASE =
  process.env.ELAVON_ENV === 'production'
    ? 'https://api.convergepay.com/hosted-payments'
    : 'https://api.demo.convergepay.com/hosted-payments'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { amount, invoiceRef, firstName, lastName, email, returnUrl } = body as {
    amount: number
    invoiceRef: string
    firstName: string
    lastName: string
    email: string
    returnUrl: string
  }

  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  if (!returnUrl) return NextResponse.json({ error: 'returnUrl required' }, { status: 400 })

  const merchantId = process.env.ELAVON_MERCHANT_ID
  const userId = process.env.ELAVON_USER_ID
  const pin = process.env.ELAVON_PIN

  if (!merchantId || !userId || !pin) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 500 })
  }

  const params = new URLSearchParams({
    ssl_merchant_id: merchantId,
    ssl_user_id: userId,
    ssl_pin: pin,
    ssl_transaction_type: 'ccsale',
    ssl_amount: amount.toFixed(2),
    ssl_invoice_number: invoiceRef,
    ssl_first_name: firstName,
    ssl_last_name: lastName,
    ssl_email: email,
    ssl_return_url: returnUrl,
    ssl_show_form: 'true',
  })

  let res: Response
  let text: string
  try {
    res = await fetch(`${BASE}/transaction_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    text = await res.text()
  } catch (err) {
    console.error('[elavon/token] network error:', err)
    return NextResponse.json({ error: 'Could not reach payment servers' }, { status: 502 })
  }

  // HTML response = Elavon returned an error page (e.g. 401 bad credentials, 404, 500)
  if (!res.ok || text.trimStart().startsWith('<')) {
    const code = res.status
    console.error(`[elavon/token] HTTP ${code} — response:`, text.slice(0, 300))
    const label = code === 401 ? 'Payment credentials rejected (401)' : `Payment server error (${code})`
    return NextResponse.json({ error: label }, { status: 502 })
  }

  // Key=value error response from Elavon
  if (text.includes('ssl_result_message')) {
    const parsed = Object.fromEntries(new URLSearchParams(text))
    const msg = parsed.ssl_result_message ?? 'Token request failed'
    console.error('[elavon/token] error response:', msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  // Response is a raw token string or encoded as ssl_txn_auth_token=xxx
  let token = text.trim()
  if (token.includes('=')) {
    token = new URLSearchParams(token).get('ssl_txn_auth_token') ?? token
  }

  if (!token) return NextResponse.json({ error: 'No token returned' }, { status: 502 })

  return NextResponse.json({ token, hostedUrl: `${BASE}/${token}` })
}
