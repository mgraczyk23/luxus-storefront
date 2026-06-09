import { NextRequest, NextResponse } from 'next/server'

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'https://api.luxus-collection.com'

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

  const proxySecret = process.env.ELAVON_PROXY_SECRET
  if (!proxySecret) {
    return NextResponse.json({ error: 'Payment proxy not configured' }, { status: 500 })
  }

  let medusaRes: Response
  let data: { token?: string; hostedUrl?: string; error?: string }
  try {
    medusaRes = await fetch(`${MEDUSA_URL}/store/elavon/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-elavon-proxy-secret': proxySecret,
      },
      body: JSON.stringify({ amount, invoiceRef, firstName, lastName, email, returnUrl }),
    })
    data = await medusaRes.json()
  } catch (err) {
    console.error('[elavon/token] medusa proxy error:', err)
    return NextResponse.json({ error: 'Could not reach payment servers' }, { status: 502 })
  }

  if (!medusaRes.ok || !data.hostedUrl) {
    return NextResponse.json({ error: data.error ?? 'Payment server error' }, { status: 502 })
  }

  return NextResponse.json({ token: data.token, hostedUrl: data.hostedUrl })
}
