import { NextResponse } from 'next/server'
import { getSellerListings } from '@/lib/gunbroker'

// Cache the edge response for 5 minutes so the GunBroker API isn't hammered
// on every page load, but auction data stays reasonably fresh.
export const revalidate = 300

export async function GET() {
  try {
    const listings = await getSellerListings(8)
    return NextResponse.json({ listings })
  } catch {
    return NextResponse.json({ listings: [] })
  }
}
