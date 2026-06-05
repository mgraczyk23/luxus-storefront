import { revalidatePath, revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { warmCache, TAG_PAGES } from "@/lib/warm-cache"

const STATIC_TAGS = new Set(
  Object.keys(TAG_PAGES).filter(k => !k.endsWith("-"))
)
const DYNAMIC_PREFIXES = Object.keys(TAG_PAGES).filter(k => k.endsWith("-"))

function isAllowedTag(tag: string): boolean {
  if (STATIC_TAGS.has(tag)) return true
  return DYNAMIC_PREFIXES.some(p => tag.startsWith(p))
}

function checkSecret(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  return process.env.REVALIDATE_SECRET && secret === process.env.REVALIDATE_SECRET
}

// GET — called by Payload hooks (site-settings, posts, etc.)
export async function GET(req: NextRequest) {
  if (!checkSecret(req)) return new NextResponse('Unauthorized', { status: 401 })

  const tag = req.nextUrl.searchParams.get('tag')
  if (!tag || !isAllowedTag(tag)) {
    return NextResponse.json({ error: 'Invalid or missing tag' }, { status: 400 })
  }

  revalidateTag(tag, {})
  warmCache(tag).catch(() => {})

  return NextResponse.json({ revalidated: true, tag, ts: Date.now() })
}

// POST — called by Medusa webhooks / product changes
export async function POST(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: "Invalid secret" }, { status: 401 })

  revalidateTag("products", {})
  revalidatePath("/", "layout")
  warmCache("products").catch(() => {})

  return NextResponse.json({ revalidated: true })
}
