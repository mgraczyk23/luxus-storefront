import { NextResponse } from 'next/server'
import { getSellerListings } from '@/lib/gunbroker'

// force-dynamic so this route always runs fresh — the GunBroker fetch inside
// getSellerListings already has next: { revalidate: 300 } for a 5-min fetch cache.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const listings = await getSellerListings(8)
    return NextResponse.json({ listings })
  } catch {
    return NextResponse.json({ listings: [] })
  }
}
