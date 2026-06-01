import { NextRequest, NextResponse } from "next/server"

const MEILI_URL = process.env.MEILISEARCH_HOST ?? process.env.NEXT_PUBLIC_MEILI_URL ?? "http://localhost:7700"
const MEILI_KEY = process.env.MEILISEARCH_API_KEY ?? process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY ?? ""

// Normalize query: "ar15" ↔ "ar-15" ↔ "AR 15" all find each other.
// Strategy: strip separators so we can compare apples to apples,
// then also try with separators replaced by spaces for Meilisearch tokenization.
function buildQueries(raw: string): string[] {
  const queries = new Set<string>()
  queries.add(raw)
  // Strip hyphens, dots, slashes → "ar-15" → "ar15"
  const stripped = raw.replace(/[-./]/g, "")
  if (stripped !== raw) queries.add(stripped)
  // Replace separators with spaces → "ar15" becomes "ar 15" (only if it looks like a compound)
  const spaced = raw.replace(/[-./]/g, " ").replace(/\s+/g, " ").trim()
  if (spaced !== raw) queries.add(spaced)
  return [...queries]
}

async function searchOne(q: string, limit: number) {
  const res = await fetch(`${MEILI_URL}/indexes/products/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${MEILI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      q,
      limit,
      attributesToHighlight: ["title", "brand"],
      highlightPreTag: "<mark>",
      highlightPostTag: "</mark>",
      attributesToRetrieve: [
        "id", "handle", "title", "brand", "caliber", "action",
        "price", "contact_for_pricing", "thumbnail", "in_stock",
      ],
    }),
  })
  if (!res.ok) return { hits: [], estimatedTotalHits: 0 }
  return res.json()
}

export async function GET(req: NextRequest) {
  const q     = req.nextUrl.searchParams.get("q")?.trim() ?? ""
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "6"), 200)

  if (!q || q.length < 2) return NextResponse.json({ hits: [], query: q })

  try {
    const queries = buildQueries(q)

    // Run all query variants in parallel, merge and deduplicate by id
    const results = await Promise.all(queries.map(qv => searchOne(qv, limit)))

    const seen = new Set<string>()
    const hits: unknown[] = []
    let estimatedTotalHits = 0

    for (const r of results) {
      if (r.estimatedTotalHits > estimatedTotalHits) estimatedTotalHits = r.estimatedTotalHits
      for (const hit of (r.hits ?? [])) {
        if (!seen.has((hit as { id: string }).id)) {
          seen.add((hit as { id: string }).id)
          hits.push(hit)
        }
      }
    }

    return NextResponse.json({ hits: hits.slice(0, limit), estimatedTotalHits, query: q })
  } catch {
    return NextResponse.json({ hits: [], query: q })
  }
}
