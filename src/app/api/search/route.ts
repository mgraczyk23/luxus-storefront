import { NextRequest, NextResponse } from "next/server"

const MEILI_URL = process.env.MEILISEARCH_HOST ?? process.env.NEXT_PUBLIC_MEILI_URL ?? "http://localhost:7700"
const MEILI_KEY = process.env.MEILISEARCH_API_KEY ?? process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY ?? ""

export async function GET(req: NextRequest) {
  const q     = req.nextUrl.searchParams.get("q")?.trim() ?? ""
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "6"), 12)

  if (!q || q.length < 2) {
    return NextResponse.json({ hits: [], query: q })
  }

  try {
    const res = await fetch(`${MEILI_URL}/indexes/products/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MEILI_KEY}`,
        "Content-Type": "application/json",
      },
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

    if (!res.ok) return NextResponse.json({ hits: [], query: q })
    const data = await res.json()
    return NextResponse.json({ hits: data.hits ?? [], estimatedTotalHits: data.estimatedTotalHits ?? 0, query: q })
  } catch {
    return NextResponse.json({ hits: [], query: q })
  }
}
