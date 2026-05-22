import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "https://api.luxus-collection.com"
const PK      = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""
const FIELDS   = "*variants,*variants.prices,*images,*categories,*collection,+metadata"

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
    id:     p.id,
    handle: p.handle,
    title:  p.title,
    status: p.status,
    // Raw metadata — exactly what Medusa is storing
    metadata: p.metadata ?? null,
    categories: (p.categories ?? []).map((c: any) => c.name),
  }))

  // Unique brand values — flatten arrays and JSON array strings
  const allBrandVals = raw.flatMap(p => {
    const v = p.metadata?.brand
    if (!v) return []
    if (Array.isArray(v)) return v.map(String)
    const s = String(v).trim()
    if (s.startsWith("[")) { try { const a = JSON.parse(s); if (Array.isArray(a)) return a.map(String) } catch {} }
    return [s]
  })
  const uniqueBrands = [...new Set(allBrandVals)].sort()

  return NextResponse.json(
    { total_returned: raw.length, total_in_medusa: total, unique_brands: uniqueBrands, products },
    { headers: { "Cache-Control": "no-store" } }
  )
}
