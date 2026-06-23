import { revalidatePath, revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { warmCache } from "@/lib/warm-cache"

// Medusa webhook endpoint — called automatically when products, inventory, or
// orders change in Medusa. Invalidates the "products" cache so the storefront
// reflects the change immediately (price, stock, new products, etc.).
//
// Configure in Medusa admin → Settings → Webhooks:
//   URL:    https://luxus-collection.com/api/medusa-hook
//   Events: subscribe the product.*, product-variant.*, product-category.*,
//           product-collection.*, inventory-item.*, inventory-level.*,
//           reservation-item.*, and order.placed / order.canceled /
//           order.completed events (full list in REVALIDATE_EVENTS below).
//   The inventory/order events are what make a sold-out item flip to
//   out-of-stock instantly; without them stock still self-heals on the
//   5-minute ISR cycle, just not immediately.
//
// Optionally protect with REVALIDATE_SECRET:
//   URL:    https://luxus-collection.com/api/medusa-hook?secret=YOUR_SECRET

const REVALIDATE_EVENTS = new Set([
  // Catalog
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
  // Inventory — stock level / availability changes
  "inventory-item.created",
  "inventory-item.updated",
  "inventory-item.deleted",
  "inventory-level.created",
  "inventory-level.updated",
  "inventory-level.deleted",
  "reservation-item.created",
  "reservation-item.updated",
  "reservation-item.deleted",
  // Orders — a sale reserves/decrements stock; a cancel releases it
  "order.placed",
  "order.canceled",
  "order.completed",
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

  // Only revalidate for catalog / inventory / order events. Ignore everything else.
  if (!REVALIDATE_EVENTS.has(eventName) && eventName !== "unknown") {
    return NextResponse.json({ skipped: true, event: eventName })
  }

  revalidateTag("products", { expire: 0 })
  revalidatePath("/", "layout")
  warmCache("products").catch(() => {})

  return NextResponse.json({ revalidated: true, event: eventName })
}
