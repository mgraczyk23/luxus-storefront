import { revalidatePath, revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

const ALLOWED_TAGS = new Set(['site-settings', 'posts', 'comments', 'subscribers', 'products'])

function checkSecret(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  return process.env.REVALIDATE_SECRET && secret === process.env.REVALIDATE_SECRET
}

// GET — called by Payload hooks (site-settings, posts, etc.)
export async function GET(req: NextRequest) {
  if (!checkSecret(req)) return new NextResponse('Unauthorized', { status: 401 })

  const tag = req.nextUrl.searchParams.get('tag')
  if (!tag || !ALLOWED_TAGS.has(tag)) {
    return NextResponse.json({ error: 'Invalid or missing tag' }, { status: 400 })
  }

  revalidateTag(tag, {})
  return NextResponse.json({ revalidated: true, tag, ts: Date.now() })
}

// POST — called by Medusa webhooks / product changes
export async function POST(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: "Invalid secret" }, { status: 401 })

  revalidateTag("products", {})
  revalidatePath("/", "layout")

  return NextResponse.json({ revalidated: true })
}
