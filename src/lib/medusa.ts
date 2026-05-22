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
  }
  // attribute_lists: full arrays for filter matching (always string[])
  attribute_lists: {
    brand: string[]
    model: string[]
    caliber: string[]
    action: string[]
    barrel_length: string[]
  }
  details: {
    primary_category: string | null
  }
}

// Normalise a metadata attribute value: may be stored as string (legacy) or string[]
// Returns display string (joined) and the full list for filtering.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readAttr(val: any): { display: string | null; list: string[] } {
  if (!val) return { display: null, list: [] }
  if (Array.isArray(val)) {
    const strs = val.filter(Boolean).map(String)
    return { display: strs.join(" / ") || null, list: strs }
  }
  const s = String(val)
  return { display: s || null, list: s ? [s] : [] }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMedusaProduct(p: any): MappedProduct {
  const brand        = readAttr(p.metadata?.brand)
  const model        = readAttr(p.metadata?.model)
  const caliber      = readAttr(p.metadata?.caliber)
  const action       = readAttr(p.metadata?.action)
  const barrel_length = readAttr(p.metadata?.barrel_length)

  return {
    id:                 p.id,
    handle:             p.handle,
    title:              p.title,
    subtitle:           p.subtitle ?? null,
    brand:              brand.display,
    sku:                p.variants?.[0]?.sku ?? null,
    price:              p.variants?.[0]?.prices?.[0]?.amount
                          ? p.variants[0].prices[0].amount / 100
                          : null,
    contact_for_pricing: p.metadata?.contact_for_pricing === "true",
    in_stock:           p.variants?.[0]?.manage_inventory === false
                          ? true
                          : (p.variants?.[0]?.inventory_quantity ?? 1) > 0,
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
      brand:         brand.display,
      model:         model.display,
      caliber:       caliber.display,
      action:        action.display,
      barrel_length: barrel_length.display,
    },
    attribute_lists: {
      brand:         brand.list,
      model:         model.list,
      caliber:       caliber.list,
      action:        action.list,
      barrel_length: barrel_length.list,
    },
    details: {
      primary_category: p.metadata?.primary_category ?? null,
    },
  }
}
