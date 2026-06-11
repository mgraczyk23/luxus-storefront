import { NextRequest, NextResponse } from 'next/server'

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'https://api.luxus-collection.com'
const MEDUSA_PK  = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''
const ELAVON_PROXY_SECRET = process.env.ELAVON_PROXY_SECRET ?? ''

// Called by the checkout page after PayWithConverge fires onApproval.
// Acts as a server-side proxy so ELAVON_PROXY_SECRET never touches the browser.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.cartId) return NextResponse.json({ error: 'cartId required' }, { status: 400 })

  const res = await fetch(`${MEDUSA_URL}/store/elavon/finalize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-publishable-api-key': MEDUSA_PK,
      'x-elavon-proxy-secret': ELAVON_PROXY_SECRET,
    },
    body: JSON.stringify({
      cartId:              body.cartId,
      ssl_result:          body.ssl_result          ?? '',
      ssl_txn_id:          body.ssl_txn_id           ?? '',
      ssl_approval_code:   body.ssl_approval_code    ?? '',
      ssl_amount:          body.ssl_amount           ?? '',
      ssl_result_message:  body.ssl_result_message   ?? '',
    }),
  })

  const data = await res.json().catch(() => ({ error: 'Invalid response from payment server' }))
  if (!res.ok || data.error) {
    console.error('[elavon/finalize] Medusa error:', data.error)
    return NextResponse.json({ error: data.error ?? 'Could not complete order' }, { status: 500 })
  }

  return NextResponse.json(data)
}
