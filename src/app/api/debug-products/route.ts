import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "https://api.luxus-collection.com"
const PK      = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""
const FIELDS        = "*variants,*variants.prices,*images,*categories,*collection,*tags,+metadata"
const FIELDS_ATTRS  = "*variants,*variants.prices,*images,*categories,*collection,*tags,+metadata,*attribute_values,*attribute_values.attribute_type"

// Fetches directly from Medusa with no Next.js caching — always fresh.
async function fetchFresh(offset: number) {
  const url = `${BACKEND}/store/products?limit=100&offset=${offset}&fields=${encodeURIComponent(FIELDS)}`
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PK,
    },
  })
  if (!res.ok) throw new Error(`Medusa ${res.status}: ${url}`)
  return res.json() as Promise<{ products: any[]; count: number }>
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const first  = await fetchFresh(0)
  const total  = first.count ?? 0
  const raw    = [...(first.products ?? [])]

  if (total > raw.length) {
    const extra = Math.ceil((total - 100) / 100)
    const pages = await Promise.all(
      Array.from({ length: extra }, (_, i) => fetchFresh((i + 1) * 100))
    )
    for (const page of pages) raw.push(...(page.products ?? []))
  }

  // Show every product with the raw metadata values
  const products = raw.map(p => ({
    id:         p.id,
    handle:     p.handle,
    title:      p.title,
    status:     p.status,
    metadata:   p.metadata ?? null,
    categories: (p.categories ?? []).map((c: any) => c.name),
    tags:       (p.tags ?? []).map((t: any) => t.value ?? t),
  }))

  // Test: can we expand attribute_values in the main products query?
  let attrFieldExpansionTest: any = null
  try {
    const hiltonYamId = raw.find(p => p.handle?.includes("hilton-yam"))?.id
    if (hiltonYamId) {
      const url = `${BACKEND}/store/products?id[]=${hiltonYamId}&fields=${encodeURIComponent(FIELDS_ATTRS)}`
      const r = await fetch(url, { cache: "no-store", headers: { "Content-Type": "application/json", "x-publishable-api-key": PK } })
      const d = r.ok ? await r.json() : { error: r.status }
      const p = d?.products?.[0]
      attrFieldExpansionTest = {
        works: Array.isArray(p?.attribute_values),
        attribute_values: p?.attribute_values ?? null,
        raw_keys: p ? Object.keys(p) : null,
      }
    }
  } catch (e: any) {
    attrFieldExpansionTest = { error: e.message }
  }

  // Fetch attributes for several products to build a full attribute_type_id → name map
  const sampleHandles = ["hilton-yam-custom-delta", "colt-ace-trial", "korth-ratzeburg-combat-4"]
  const sampleProducts = raw.filter(p => sampleHandles.some(h => p.handle?.includes(h))).slice(0, 3)
  const hiltonYam = raw.find(p => p.handle?.includes("hilton-yam"))

  const attrFetches = await Promise.all(
    sampleProducts.map(async (p) => {
      try {
        const r = await fetch(
          `${BACKEND}/store/products/${p.id}/attributes?fields=*attribute_values,*attribute_values.attribute_type`,
          { cache: "no-store", headers: { "Content-Type": "application/json", "x-publishable-api-key": PK } }
        )
        return { handle: p.handle, data: r.ok ? await r.json() : { error: r.status } }
      } catch (e: any) {
        return { handle: p.handle, data: { error: e.message } }
      }
    })
  )
  const hiltonYamAttributes = attrFetches.find(f => f.handle?.includes("hilton-yam"))?.data ?? null

  // Unique brand values — handles real arrays, JSON arrays, and comma-separated strings
  const allBrandVals = raw.flatMap(p => {
    const v = p.metadata?.brand
    if (!v) return []
    if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean)
    const s = String(v).trim()
    if (!s) return []
    if (s.startsWith("[")) { try { const a = JSON.parse(s); if (Array.isArray(a)) return a.map(String).map(x => x.trim()).filter(Boolean) } catch {} }
    if (s.includes(",")) { const parts = s.split(",").map(x => x.trim()).filter(Boolean); if (parts.length > 1) return parts }
    return [s]
  })
  const uniqueBrands = [...new Set(allBrandVals)].sort()

  return NextResponse.json(
    { total_returned: raw.length, total_in_medusa: total, unique_brands: uniqueBrands, attr_field_expansion_test: attrFieldExpansionTest, hilton_yam_attributes: hiltonYamAttributes, sample_attributes: attrFetches, products },
    { headers: { "Cache-Control": "no-store" } }
  )
}
