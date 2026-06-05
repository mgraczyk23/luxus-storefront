import Medusa from "@medusajs/js-sdk"

export const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "https://api.luxus-collection.com",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "",
})

export type MappedProduct = {
  id: string
  handle: string
  title: string
  subtitle: string | null
  brand: string | null
  sku: string | null
  variant_id: string | null
  price: number | null
  contact_for_pricing: boolean
  in_stock: boolean
  images: string[]
  thumbnail: string | null
  categories: string[]
  primary_category: string | null
  collection_id: string | null
  collection_handle: string | null
  short_description: string | null
  overview: string | null
  engraver: string | null
  highlights: { title: string; body: string }[]
  specifications: Record<string, string>
  in_the_box: string[]
  // attributes: display strings (joined if multi-value, e.g. "9mm / .40 S&W")
  attributes: {
    brand: string | null
    model: string | null
    caliber: string | null
    action: string | null
    barrel_length: string | null
    frame_color: string | null
    magazine_capacity: string | null
  }
  // attribute_lists: full arrays for filter matching (always string[])
  attribute_lists: {
    brand: string[]
    model: string[]
    caliber: string[]
    action: string[]
    barrel_length: string[]
    frame_color: string[]
    magazine_capacity: string[]
  }
  details: {
    primary_category: string | null
  }
  tags:       string[]   // raw tag values, e.g. ["Featured"]
  is_firearm: boolean    // true when product type === "Firearm"
  seo_meta_title: string | null
  seo_meta_description: string | null
}

// Build a map of attribute_type.slug → values[] from the attribute_values module.
// This is the authoritative source when products are fetched with
// *attribute_values,*attribute_values.attribute_type in the fields selector.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAttrMap(p: any): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const av of (p.attribute_values ?? [])) {
    const slug: string | undefined = av.attribute_type?.slug
    if (!slug || av.value == null) continue
    const val = String(av.value).trim()
    if (!val) continue
    if (!map[slug]) map[slug] = []
    if (!map[slug].includes(val)) map[slug].push(val)
  }
  return map
}

// Prefer the attribute_values module (authoritative), fall back to metadata.
// Tries slug as-is plus hyphen/underscore variants (e.g. "barrel-length" and "barrel_length").
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickAttr(attrMap: Record<string, string[]>, slug: string, metaVal: any): { display: string | null; list: string[] } {
  const variants = [slug, slug.replace(/-/g, '_'), slug.replace(/_/g, '-')]
  for (const s of variants) {
    if (attrMap[s]?.length) return readAttr(attrMap[s])
  }
  return readAttr(metaVal)
}

// Normalise a metadata attribute value: may be stored as a plain string,
// a JSON array string '["A","B"]', or a real string[].
// Returns display string (joined with " / ") and the full list for filtering.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readAttr(val: any): { display: string | null; list: string[] } {
  if (val === null || val === undefined) return { display: null, list: [] }

  // Real array from the API
  if (Array.isArray(val)) {
    const strs = val
      .map(v => String(v).trim())
      .filter(v => v && v !== "null" && v !== "undefined")
    return { display: strs.join(" / ") || null, list: strs }
  }

  const s = String(val).trim()
  if (!s || s === "null" || s === "undefined") return { display: null, list: [] }

  // JSON-stringified array e.g. '["Heckler & Koch","10-8 Performance"]'
  if (s.startsWith("[")) {
    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) {
        const strs = parsed
          .map((v: unknown) => String(v).trim())
          .filter((v: string) => v && v !== "null" && v !== "undefined")
        if (strs.length > 0) return { display: strs.join(" / ") || null, list: strs }
      }
    } catch {
      // Not valid JSON — fall through
    }
  }

  // Comma-separated string e.g. "Heckler & Koch, 10-8 Performance"
  if (s.includes(",")) {
    const strs = s.split(",").map(v => v.trim()).filter(v => v && v !== "null" && v !== "undefined")
    if (strs.length > 1) return { display: strs.join(" / ") || null, list: strs }
  }

  return { display: s, list: [s] }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMedusaProduct(p: any): MappedProduct {
  const attrMap = buildAttrMap(p)

  const brand             = pickAttr(attrMap, "brand",             p.metadata?.brand)
  const model             = pickAttr(attrMap, "model",             p.metadata?.model)
  const caliber           = pickAttr(attrMap, "caliber",           p.metadata?.caliber)
  const action            = pickAttr(attrMap, "action",            p.metadata?.action)
  const barrel_length     = pickAttr(attrMap, "barrel-length",     p.metadata?.barrel_length)
  const frame_color       = pickAttr(attrMap, "frame-color",       p.metadata?.frame_color)
  const magazine_capacity = pickAttr(attrMap, "magazine-capacity", p.metadata?.magazine_capacity)

  return {
    id:                 p.id,
    handle:             p.handle,
    title:              p.title,
    subtitle:           p.subtitle ?? null,
    brand:              brand.display,
    sku:                p.variants?.[0]?.sku ?? null,
    variant_id:         p.variants?.[0]?.id ?? null,
    price:              p.variants?.[0]?.prices?.[0]?.amount
                          ? p.variants[0].prices[0].amount / 100
                          : null,
    contact_for_pricing: p.metadata?.contact_for_pricing === "true",
    in_stock:           p.variants?.[0]?.manage_inventory === false
                          ? true
                          : (p.variants?.[0]?.inventory_quantity ?? 0) > 0,
    images:             p.images?.map((i: { url: string }) => i.url) ?? [],
    thumbnail:          p.thumbnail ?? null,
    categories:         p.categories?.map((c: { name: string }) => c.name) ?? [],
    primary_category:   p.metadata?.primary_category ?? null,
    collection_id:      p.collection?.id ?? null,
    collection_handle:  p.collection?.handle ?? null,
    short_description:  p.metadata?.short_description ?? null,
    overview:           p.description ?? null,
    engraver:           p.metadata?.engraver ?? null,
    highlights:         p.metadata?.highlights ?? [],
    specifications:     p.metadata?.specifications ?? {},
    in_the_box:         p.metadata?.in_the_box ?? [],
    attributes: {
      brand:             brand.display,
      model:             model.display,
      caliber:           caliber.display,
      action:            action.display,
      barrel_length:     barrel_length.display,
      frame_color:       frame_color.display,
      magazine_capacity: magazine_capacity.display,
    },
    attribute_lists: {
      brand:             brand.list,
      model:             model.list,
      caliber:           caliber.list,
      action:            action.list,
      barrel_length:     barrel_length.list,
      frame_color:       frame_color.list,
      magazine_capacity: magazine_capacity.list,
    },
    details: {
      primary_category: p.metadata?.primary_category ?? null,
    },
    tags:       (p.tags ?? []).map((t: { value: string }) => t.value),
    is_firearm: p.type?.value?.toLowerCase() === "firearm",
    seo_meta_title:       null,
    seo_meta_description: null,
  }
}
