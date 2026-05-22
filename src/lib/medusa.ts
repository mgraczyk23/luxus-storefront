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
  short_description: string | null
  overview: string | null
  engraver: string | null
  highlights: { title: string; body: string }[]
  specifications: Record<string, string>
  in_the_box: string[]
  attributes: {
    brand: string | null
    model: string | null
    caliber: string | null
    action: string | null
    barrel_length: string | null
  }
  details: {
    primary_category: string | null
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMedusaProduct(p: any): MappedProduct {
  return {
    id:                 p.id,
    handle:             p.handle,
    title:              p.title,
    subtitle:           p.subtitle ?? null,
    brand:              p.metadata?.brand ?? null,
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
    short_description:  p.metadata?.short_description ?? null,
    overview:           p.description ?? null,
    engraver:           p.metadata?.engraver ?? null,
    highlights:         p.metadata?.highlights ?? [],
    specifications:     p.metadata?.specifications ?? {},
    in_the_box:         p.metadata?.in_the_box ?? [],
    attributes: {
      brand:         p.metadata?.brand ?? null,
      model:         p.metadata?.model ?? null,
      caliber:       p.metadata?.caliber ?? null,
      action:        p.metadata?.action ?? null,
      barrel_length: p.metadata?.barrel_length ?? null,
    },
    details: {
      primary_category: p.metadata?.primary_category ?? null,
    },
  }
}
