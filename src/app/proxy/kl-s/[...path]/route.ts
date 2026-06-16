import { NextRequest, NextResponse } from 'next/server'

// Proxies all Klaviyo static assets (JS bundles etc.) from static.klaviyo.com
// and rewrites internal domain references so no request ever goes to *.klaviyo.com.
// This handles the second-stage bundle that klaviyo.js bootstraps.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathStr = path.join('/')
  const search = request.nextUrl.search

  const upstream = await fetch(
    `https://static.klaviyo.com/${pathStr}${search}`,
    { next: { revalidate: 3600 } }
  )

  if (!upstream.ok) {
    return new NextResponse('', { status: upstream.status })
  }

  const contentType = upstream.headers.get('content-type') ?? ''

  if (contentType.includes('javascript')) {
    const host = request.nextUrl.host
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

  // Non-JS assets (images, etc.) — stream through as-is
  const body = await upstream.arrayBuffer()
  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
