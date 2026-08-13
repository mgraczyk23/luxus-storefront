import { NextRequest, NextResponse } from 'next/server'

// Fetches the Klaviyo onsite script and rewrites its internal API domain so
// all subsequent Klaviyo API calls go through our first-party proxy path
// (/proxy/kl/*) instead of directly to a.klaviyo.com. Cached 1 hour.
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('company_id') ?? ''

  const upstream = await fetch(
    `https://static.klaviyo.com/onsite/js/${encodeURIComponent(companyId)}/klaviyo.js?company_id=${encodeURIComponent(companyId)}`,
    { next: { revalidate: 3600 } }
  )

  if (!upstream.ok) {
    return new NextResponse('', { status: upstream.status })
  }

  const host = request.nextUrl.host
  // Route static assets (JS bundles) and API calls to separate proxy paths
  // so each goes to the correct upstream origin. Any unrecognised subdomain
  // falls back to the API proxy.
  const script = (await upstream.text())
    .replace(/static\.klaviyo\.com/gi, `${host}/proxy/kl-s`)
    .replace(/a\.klaviyo\.com/gi, `${host}/proxy/kl-a`)
    .replace(/[\w-]+\.klaviyo\.com/gi, `${host}/proxy/kl-a`)

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
