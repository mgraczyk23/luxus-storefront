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
  if (!postsRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 502 })
  }
  const postsData = await postsRes.json()
  const posts: PostDoc[] = postsData?.docs ?? []

  if (posts.length === 0) {
    return NextResponse.json({ sent: 0, reason: 'no new articles this week' })
  }

  // Active subscribers — requires admin API key
  const subsRes = await fetch(
    `${PAYLOAD_URL}/api/subscribers?where[status][equals]=active&limit=1000&pagination=false`,
    { headers: { 'Content-Type': 'application/json', 'Authorization': `users API-Key ${PAYLOAD_API_KEY}` } }
  )
  if (!subsRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 502 })
  }
  const subsData = await subsRes.json()
  const subscribers: { email: string }[] = subsData?.docs ?? []

  if (subscribers.length === 0) {
    return NextResponse.json({ sent: 0, reason: 'no active subscribers' })
  }

  const articleListHtml = posts.map(post => `
    <div style="border-top:1px solid #e8e4df;padding:28px 0">
      <p style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c9a96e;font-family:'Arial',sans-serif;margin:0 0 8px">${escHtml(post.category ?? 'Editorial')}</p>
      <h2 style="font-size:22px;font-weight:400;color:#1a1a1a;font-family:'Georgia',serif;margin:0 0 10px;line-height:1.25">${escHtml(post.title)}</h2>
      <p style="font-size:14px;font-style:italic;color:#6b6560;line-height:1.7;margin:0 0 14px;font-family:'Georgia',serif">${escHtml(post.excerpt ?? '')}</p>
      <a href="${SITE_URL}/article/${post.slug}" style="font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#c9a96e;font-family:'Arial',sans-serif;font-weight:600;text-decoration:none;border-bottom:1px solid #c9a96e55;padding-bottom:2px">Read Article →</a>
    </div>
  `).join('')

  const subject = posts.length === 1
    ? `New Article: ${posts[0].title}`
    : `${posts.length} New Articles from Luxus Collection`

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
        html: `
          <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;color:#1a1a1a;padding:0 16px">
            <div style="border-bottom:1px solid #e8e4df;padding:32px 0 24px;text-align:center;margin-bottom:36px">
              <span style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#c9a96e;font-family:'Arial',sans-serif">Luxus Collection</span>
            </div>
            <p style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a96e;font-family:'Arial',sans-serif;margin:0 0 10px">The Collector's Circle</p>
            <h1 style="font-size:28px;font-weight:400;line-height:1.2;margin:0 0 6px;color:#1a1a1a">
              ${posts.length === 1 ? 'A new article for you' : 'What you missed this week'}
            </h1>
            <p style="font-size:14px;color:#9e9994;font-family:'Arial',sans-serif;margin:0 0 32px">
              ${posts.length === 1 ? '1 new article' : `${posts.length} new articles`} published since last week
            </p>
            ${articleListHtml}
            <div style="margin-top:8px;padding-top:28px;border-top:1px solid #e8e4df;font-size:10px;color:#9e9994;font-family:'Arial',sans-serif;line-height:1.9">
              You're receiving this because you subscribed to the Luxus Collection newsletter.<br>
              <a href="${unsubUrl}" style="color:#c9a96e">Unsubscribe</a>
            </div>
          </div>
        `,
      }),
    }).catch(() => null)
    if (res?.ok) sent++
  }

  return NextResponse.json({ sent, articles: posts.length })
}

type PostDoc = { title: string; slug: string; excerpt?: string; category?: string }

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
