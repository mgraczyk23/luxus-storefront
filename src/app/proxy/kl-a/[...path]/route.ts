import { NextRequest, NextResponse } from 'next/server'

// Proxies Klaviyo API calls (a.klaviyo.com) through our first-party domain.
// Needed because kl-script rewrites all a.klaviyo.com references to /proxy/kl-a.
// Handles both GET (tracking beacons, form config) and POST (subscriptions, events).

const UPSTREAM = 'https://a.klaviyo.com'

function upstreamUrl(path: string[], search: string) {
  return `${UPSTREAM}/${path.join('/')}${search}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const upstream = await fetch(upstreamUrl(path, request.nextUrl.search), {
    headers: { 'User-Agent': request.headers.get('user-agent') ?? '' },
  })

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
  const body = await upstream.arrayBuffer()

  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const body = await request.arrayBuffer()

  const upstream = await fetch(upstreamUrl(path, request.nextUrl.search), {
    method: 'POST',
    headers: {
      'Content-Type': request.headers.get('content-type') ?? 'application/json',
      'User-Agent': request.headers.get('user-agent') ?? '',
    },
    body,
  })

  const contentType = upstream.headers.get('content-type') ?? 'application/json'
  const responseBody = await upstream.arrayBuffer()

  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
