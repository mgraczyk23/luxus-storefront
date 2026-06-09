import { NextRequest, NextResponse } from 'next/server'

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'https://api.luxus-collection.com'

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get('state') ?? ''
  try {
    const res = await fetch(`${MEDUSA_URL}/store/checkout/rates?state=${encodeURIComponent(state)}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    // Fallback if Medusa is unreachable — no shipping cost, no tax
    return NextResponse.json({ shippingCost: 0, shippingLabel: 'Shipping', taxRate: 0, taxApplies: false })
  }
}
