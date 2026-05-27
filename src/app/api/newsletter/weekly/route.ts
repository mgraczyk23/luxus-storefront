import { NextRequest, NextResponse } from 'next/server'

const PAYLOAD_URL = process.env.PAYLOAD_CMS_URL ?? 'https://api.luxus-collection.com/cms'
const PAYLOAD_API_KEY = process.env.PAYLOAD_API_KEY ?? ''
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const CRON_SECRET = process.env.CRON_SECRET ?? ''
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  if (!RESEND_API_KEY || !PAYLOAD_API_KEY) {
    return NextResponse.json({ error: 'Missing required env vars' }, { status: 500 })
  }

  // Posts published in the last 7 days
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const postsRes = await fetch(
    `${PAYLOAD_URL}/api/posts?where[status][equals]=published&where[publishedAt][greater_than]=${encodeURIComponent(since)}&sort=-publishedAt&limit=20&depth=1`,
    { headers: { 'Content-Type': 'application/json' } }
  )
  if (!postsRes.ok) return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 502 })

  const postsData = await postsRes.json()
  const posts: PostDoc[] = postsData?.docs ?? []
  if (posts.length === 0) return NextResponse.json({ sent: 0, reason: 'no new articles this week' })

  // Active subscribers — requires admin API key
  const subsRes = await fetch(
    `${PAYLOAD_URL}/api/subscribers?where[status][equals]=active&limit=1000&pagination=false`,
    { headers: { 'Content-Type': 'application/json', 'Authorization': `users API-Key ${PAYLOAD_API_KEY}` } }
  )
  if (!subsRes.ok) return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 502 })

  const subsData = await subsRes.json()
  const subscribers: { email: string }[] = subsData?.docs ?? []
  if (subscribers.length === 0) return NextResponse.json({ sent: 0, reason: 'no active subscribers' })

  const subject = posts.length === 1
    ? `New Article: ${posts[0].title}`
    : `${posts.length} New Articles — The Collector's Circle`

  let sent = 0
  for (const sub of subscribers) {
    const unsubUrl = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(sub.email)}`
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Luxus Collection <noreply@luxus-collection.com>',
        to: sub.email,
        subject,
        html: buildNewsletterHtml(posts, unsubUrl, SITE_URL),
      }),
    }).catch(() => null)
    if (res?.ok) sent++
  }

  return NextResponse.json({ sent, articles: posts.length })
}

export function buildNewsletterHtml(posts: PostDoc[], unsubUrl: string, siteUrl: string) {
  const weekOf = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const articlesHtml = posts.map((post, i) => {
    const imgHtml = post.img
      ? `<img src="${post.img}" alt="${escHtml(post.title)}" width="600" style="width:100%;max-width:600px;height:auto;display:block;margin-bottom:0">`
      : ''
    const hasDivider = i > 0

    return `
      ${hasDivider ? '<div style="height:1px;background:#e8e4df;margin:0 32px"></div>' : ''}
      ${imgHtml ? `<div style="margin:0 0 0">${imgHtml}</div>` : ''}
      <div style="padding:${imgHtml ? '28px' : '0'} 32px 32px">
        <p style="font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;font-weight:500;margin:0 0 12px">${escHtml(post.category ?? 'Editorial')}</p>
        <h2 style="font-size:${i === 0 ? '26px' : '22px'};font-weight:400;line-height:1.2;color:#1a1a1a;font-family:Georgia,serif;margin:0 0 14px">${escHtml(post.title)}</h2>
        <p style="font-size:14px;font-style:italic;color:#6b6560;line-height:1.75;font-family:Georgia,serif;margin:0 0 22px">${escHtml(post.excerpt ?? '')}</p>
        <a href="${siteUrl}/article/${post.slug}" style="display:inline-block;background:#c9a96e;color:#ffffff;padding:12px 28px;text-decoration:none;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:600">Read Article</a>
      </div>
    `
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Collector's Circle — Luxus Collection</title></head>
<body style="margin:0;padding:20px 0;background:#f0ede8;font-family:Georgia,serif;color:#1a1a1a">
  <div style="max-width:600px;margin:0 auto;background:#faf9f7;border:1px solid #e8e4df">

    <!-- Header -->
    <div style="background:#1a1a1a;padding:32px;text-align:center">
      <div style="font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;font-weight:500;margin-bottom:8px">The Collector's Circle</div>
      <div style="font-size:24px;font-weight:400;color:#faf9f7;letter-spacing:0.08em;font-family:Georgia,serif">Luxus Collection</div>
      <div style="width:40px;height:1px;background:#c9a96e;margin:14px auto 0"></div>
    </div>

    <!-- Intro bar -->
    <div style="background:#c9a96e;padding:12px 32px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#fff;font-family:Arial,sans-serif;font-weight:600">
        ${posts.length === 1 ? '1 New Article' : `${posts.length} New Articles`}
      </span>
      <span style="font-size:9px;letter-spacing:0.1em;color:#fff;font-family:Arial,sans-serif;opacity:0.85">${weekOf}</span>
    </div>

    <!-- Articles -->
    ${articlesHtml}

    <!-- Footer -->
    <div style="background:#1a1a1a;padding:28px 32px;text-align:center">
      <div style="font-size:9px;letter-spacing:0.24em;text-transform:uppercase;color:#c9a96e;font-family:Arial,sans-serif;margin-bottom:14px">Luxus Collection</div>
      <p style="font-size:11px;color:#9e9994;font-family:Arial,sans-serif;margin:0 0 14px;line-height:1.8">
        Collector guides, brand spotlights, and editorial features — every Friday.<br>
        You're receiving this because you subscribed to the Collector's Circle.
      </p>
      <a href="${unsubUrl}" style="font-size:10px;color:#c9a96e;font-family:Arial,sans-serif;text-decoration:none;border-bottom:1px solid #c9a96e55;padding-bottom:1px">Unsubscribe</a>
    </div>

  </div>
</body>
</html>`
}

export type PostDoc = {
  title: string
  slug: string
  excerpt?: string
  category?: string
  img?: string | null
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
