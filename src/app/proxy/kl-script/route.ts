import { NextRequest, NextResponse } from 'next/server'

// Fetches the Klaviyo onsite script and rewrites its internal API domain so
// all subsequent Klaviyo API calls go through our first-party proxy path
// (/proxy/kl/*) instead of directly to a.klaviyo.com. Cached 1 hour.
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('company_id') ?? ''

  const upstream = await fetch(
    `https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${encodeURIComponent(companyId)}`,
    { next: { revalidate: 3600 } }
  )

  if (!upstream.ok) {
    return new NextResponse('', { status: upstream.status })
  }

  const host = request.nextUrl.host
  const script = (await upstream.text()).replaceAll('a.klaviyo.com', `${host}/proxy/kl`)

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
