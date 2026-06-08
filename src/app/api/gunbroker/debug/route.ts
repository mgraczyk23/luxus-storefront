import { NextResponse } from 'next/server'

// Debug route — returns raw GunBroker API response without caching.
// Remove this file before going to production.
export const dynamic = 'force-dynamic'

const SANDBOX    = process.env.GUNBROKER_SANDBOX === 'true'
const BASE       = SANDBOX
  ? 'https://api.sandbox.gunbroker.com/v1'
  : 'https://api.gunbroker.com/v1'
const DEV_KEY    = process.env.GUNBROKER_DEV_KEY ?? ''
const USER_AGENT = 'LuxusStorefront/LuxusCollection/1.0/AuctionSync'

export async function GET() {
  const config = {
    sandbox:     SANDBOX,
    base:        BASE,
    hasDevKey:   !!DEV_KEY,
    hasUsername: !!process.env.GUNBROKER_USERNAME,
    hasPassword: !!process.env.GUNBROKER_PASSWORD,
  }

  if (!DEV_KEY || !process.env.GUNBROKER_USERNAME || !process.env.GUNBROKER_PASSWORD) {
    return NextResponse.json({ config, error: 'Missing env vars' })
  }

  // 1. Auth
  let authStatus: number | null = null
  let authBody: unknown = null
  let token = ''
  try {
    const authRes = await fetch(`${BASE}/Users/AccessToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DevKey': DEV_KEY,
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify({
        Username: process.env.GUNBROKER_USERNAME,
        Password: process.env.GUNBROKER_PASSWORD,
      }),
      cache: 'no-store',
    })
    authStatus = authRes.status
    authBody = await authRes.json()
    token = (authBody as Record<string, string>)?.AccessToken ?? ''
  } catch (e) {
    return NextResponse.json({ config, authError: String(e) })
  }

  if (!token) {
    return NextResponse.json({ config, authStatus, authBody: JSON.stringify(authBody), error: 'No token' })
  }

  // 2. Fetch listings
  const endpoints = [
    `/ItemsSelling?PageSize=8&PageIndex=0`,
    `/Items/Selling?PageSize=8&PageIndex=0`,
    `/Items?SellerName=${encodeURIComponent(process.env.GUNBROKER_USERNAME!)}&PageSize=8&PageIndex=0`,
  ]

  const results: Record<string, unknown> = {}

  for (const ep of endpoints) {
    try {
      const r = await fetch(`${BASE}${ep}`, {
        headers: {
          'X-DevKey': DEV_KEY,
          'X-AccessToken': token,
          'User-Agent': USER_AGENT,
        },
        cache: 'no-store',
      })
      const body = await r.text()
      let parsed: unknown
      try { parsed = JSON.parse(body) } catch { parsed = body }
      results[ep] = { status: r.status, body: parsed }
    } catch (e) {
      results[ep] = { error: String(e) }
    }
  }

  return NextResponse.json({ config, authStatus, token: `${token.slice(0, 8)}…`, results })
}
