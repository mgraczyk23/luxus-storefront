import { NextRequest, NextResponse } from "next/server"
import { getProducts } from "@/lib/api"

const PRODUCT_FIELDS = "*variants,*variants.prices,*images,*categories,*collection,+metadata"
const PAGE_SIZE = 100

// Temporary debug endpoint — requires REVALIDATE_SECRET to access.
// Returns raw brand/metadata values from Medusa to diagnose missing filter entries.
// Remove this file once the issue is resolved.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const first = await getProducts({ limit: String(PAGE_SIZE), offset: "0", fields: PRODUCT_FIELDS })
  const total = first.count ?? 0
  const raw = [...(first.products ?? [])]

  if (total > raw.length) {
    const extra = Math.ceil((total - PAGE_SIZE) / PAGE_SIZE)
    const pages = await Promise.all(
      Array.from({ length: extra }, (_, i) =>
        getProducts({ limit: String(PAGE_SIZE), offset: String((i + 1) * PAGE_SIZE), fields: PRODUCT_FIELDS })
      )
    )
    for (const page of pages) raw.push(...(page.products ?? []))
  }

  const summary = raw.map(p => ({
    id:     p.id,
    handle: p.handle,
    title:  p.title,
    status: p.status,
    metadata_brand:    p.metadata?.brand    ?? null,
    metadata_caliber:  p.metadata?.caliber  ?? null,
    metadata_action:   p.metadata?.action   ?? null,
    categories: (p.categories ?? []).map((c: { name: string }) => c.name),
  }))

  // Also return unique brand values to see exactly what's in the data
  const uniqueBrands = [...new Set(
    raw.map(p => p.metadata?.brand).filter(Boolean)
  )].sort()

  return NextResponse.json({
    total_returned: raw.length,
    total_in_medusa: total,
    unique_brands: uniqueBrands,
    products: summary,
  }, {
    headers: { "Cache-Control": "no-store" },
  })
}
