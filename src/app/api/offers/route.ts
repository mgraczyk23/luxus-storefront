import { NextRequest, NextResponse } from 'next/server'

export type OfferPayload = {
  product_id:     string
  product_handle: string
  product_title:  string
  first_name:     string
  last_name:      string | null
  email:          string
  phone:          string | null
  offer_amount:   number
  message:        string | null
}

// Basic validation
function validate(body: unknown): body is OfferPayload {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  return (
    typeof b.product_id     === 'string' && b.product_id.length > 0 &&
    typeof b.product_handle === 'string' && b.product_handle.length > 0 &&
    typeof b.product_title  === 'string' && b.product_title.length > 0 &&
    typeof b.first_name     === 'string' && b.first_name.length > 0 &&
    typeof b.email          === 'string' && b.email.includes('@') &&
    typeof b.offer_amount   === 'number' && b.offer_amount > 0
  )
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!validate(body)) {
    return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 422 })
  }

  // TODO: persist offer to Medusa custom offers module once built
  // const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_URL ?? 'http://localhost:9000'
  // await fetch(`${medusaUrl}/store/offers`, { method: 'POST', body: JSON.stringify(body), ... })

  // TODO: send admin notification email via Resend once wired

  // Temporary: log to server console so offers are visible in Vercel logs
  console.log('[offer]', JSON.stringify({
    product:  body.product_title,
    handle:   body.product_handle,
    name:     `${body.first_name} ${body.last_name ?? ''}`.trim(),
    email:    body.email,
    amount:   body.offer_amount,
    message:  body.message,
    received: new Date().toISOString(),
  }))

  return NextResponse.json({ success: true }, { status: 201 })
}
