import { revalidatePath, revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

// Medusa webhook endpoint — called automatically when products are
// created, updated, or deleted in the Medusa admin.
//
// Configure in Medusa admin → Settings → Webhooks:
//   URL:    https://dev.luxus-collection.com/api/medusa-hook
//   Events: product.created, product.updated, product.deleted
//
// Optionally protect with REVALIDATE_SECRET:
//   URL:    https://dev.luxus-collection.com/api/medusa-hook?secret=YOUR_SECRET

const PRODUCT_EVENTS = new Set([
  "product.created",
  "product.updated",
  "product.deleted",
  "product-variant.created",
  "product-variant.updated",
  "product-variant.deleted",
  "product-category.created",
  "product-category.updated",
  "product-category.deleted",
  "product-collection.created",
  "product-collection.updated",
  "product-collection.deleted",
])

export async function POST(req: NextRequest) {
  // Optional secret check — if REVALIDATE_SECRET is set, the request
  // must include it as a query param or x-revalidate-secret header.
  const secret = process.env.REVALIDATE_SECRET
  if (secret) {
    const qsSecret  = req.nextUrl.searchParams.get("secret")
    const hdrSecret = req.headers.get("x-revalidate-secret")
    if (qsSecret !== secret && hdrSecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  // Read the Medusa event payload. Medusa v2 sends { event_name, data }.
  let eventName = "unknown"
  try {
    const body = await req.json()
    eventName = body?.event_name ?? body?.eventName ?? "unknown"
  } catch {
    // Body parsing failure is non-fatal — still revalidate
  }

  // Only revalidate for product-related events. Ignore everything else.
  if (!PRODUCT_EVENTS.has(eventName) && eventName !== "unknown") {
    return NextResponse.json({ skipped: true, event: eventName })
  }

  revalidateTag("products", { expire: 0 })
  revalidatePath("/", "layout")

  return NextResponse.json({ revalidated: true, event: eventName })
}
