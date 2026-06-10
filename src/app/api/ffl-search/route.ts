import { NextRequest, NextResponse } from "next/server"

const MEILI_URL = process.env.MEILISEARCH_HOST
  ?? process.env.NEXT_PUBLIC_MEILI_URL
  ?? "http://localhost:7700"

const MEILI_KEY = process.env.MEILISEARCH_API_KEY
  ?? process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY
  ?? ""

export type FflDealer = {
  id:          string
  licenseType: string
  licenseNum:  string
  bizName:     string
  licName:     string
  street:      string
  city:        string
  state:       string
  zip5:        string
  phone:       string
}

export async function GET(req: NextRequest) {
  const params  = req.nextUrl.searchParams
  const zip     = params.get("zip")?.trim().slice(0, 5) ?? ""
  const state   = params.get("state")?.trim().toUpperCase() ?? ""
  const q       = params.get("q")?.trim() ?? ""
  const limit   = Math.min(Number(params.get("limit") ?? "30"), 100)

  if (!zip && !q && !state) {
    return NextResponse.json({ dealers: [], query: "" })
  }

  // Build filter: always restrict to dealer types; optionally by state and/or zip
  const filters: string[] = ['licenseType IN ["01", "02", "09"]']
  if (zip)   filters.push(`zip5 = "${zip}"`)
  if (state && !zip) filters.push(`state = "${state}"`)

  const body: Record<string, unknown> = {
    q:     q || "",
    limit,
    filter: filters.join(" AND "),
    attributesToRetrieve: [
      "id", "licenseType", "licenseNum", "bizName", "licName",
      "street", "city", "state", "zip5", "phone",
    ],
  }

  // If searching by zip with no text query, sort alphabetically
  if (zip && !q) {
    body.sort = ["bizName:asc"]
  }

  try {
    const res = await fetch(`${MEILI_URL}/indexes/ffls/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MEILI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      // Index doesn't exist yet — return empty rather than erroring
      return NextResponse.json({ dealers: [], query: q || zip })
    }

    const data = await res.json()
    return NextResponse.json({
      dealers: (data.hits ?? []) as FflDealer[],
      query:   q || zip,
    })
  } catch {
    return NextResponse.json({ dealers: [], query: q || zip })
  }
}
