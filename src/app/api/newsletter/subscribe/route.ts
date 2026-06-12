import { NextRequest, NextResponse } from 'next/server'
import { klaviyoSubscribe } from '@/lib/klaviyo'

const PAYLOAD_URL = process.env.PAYLOAD_CMS_URL ?? 'https://api.luxus-collection.com/cms'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const { email, name, source } = body as { email: string; name?: string; source?: string }
  const trimmedEmail = email.trim()
  const firstName = name?.trim().split(' ')[0] || undefined

  // Primary: subscribe to Klaviyo
  await klaviyoSubscribe(trimmedEmail, firstName)

  // Fallback: also save to Payload for existing weekly email cron
  let duplicate = false
  try {
    const res = await fetch(`${PAYLOAD_URL}/api/subscribers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmedEmail, name: name?.trim() || undefined, source: source ?? 'web' }),
    })
    if (res.status === 400) {
      const json = await res.json().catch(() => ({}))
      const msg = (json?.errors?.[0]?.message ?? '').toLowerCase()
      duplicate = msg.includes('already subscribed') || msg.includes('unique')
    }
  } catch {}

  // Klaviyo is idempotent on duplicates; only surface duplicate if Payload is the sole path
  return NextResponse.json({ ok: true, duplicate })
}
