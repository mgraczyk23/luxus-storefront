import { NextRequest, NextResponse } from 'next/server'

// Converge POSTs to the cancel URL when the customer clicks Cancel on the HPP.
// Accept both POST and GET, then redirect back to checkout.
export async function POST(req: NextRequest) {
  return NextResponse.redirect(`${req.nextUrl.origin}/checkout?cancelled=1`, 303)
}

export async function GET(req: NextRequest) {
  return NextResponse.redirect(`${req.nextUrl.origin}/checkout?cancelled=1`, 303)
}
