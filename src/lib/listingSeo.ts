import type { MappedProduct } from './medusa'

const fmtPrice = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const BRAND_LINE = 'Rare, collectible, and historically significant firearms.'
const MAX_DESCRIPTION = 160

// Shared title/description template for brand, category, model, and collection
// listing pages — these all follow the same "browse {name} firearms" shape and
// previously used a static, near-identical one-liner with no "for sale"/"shop"
// language and no per-page differentiation. This generates both from real
// product data (name + live stock/price), so every page is unique without
// anyone maintaining copy by hand.
//
// `bareNoun`: pass true when `heading` already reads as a plural noun on its
// own (category names like "Rifles", "Handguns") — false when it needs
// "firearms" appended to read naturally (brand names, model numbers).
export function buildListingMeta(heading: string, products: MappedProduct[], opts?: { bareNoun?: boolean }) {
  const subject = opts?.bareNoun ? heading : `${heading} firearms`

  const inStock = products.filter(p => p.in_stock)
  const priced = inStock.filter(p => !p.contact_for_pricing && p.price != null)

  let stockClause = ''
  if (inStock.length > 0) {
    const countText = `${inStock.length} ${inStock.length === 1 ? 'piece' : 'pieces'} in stock`
    stockClause = priced.length > 0
      ? ` — ${countText}, from ${fmtPrice(Math.min(...priced.map(p => p.price!)))}`
      : ` — ${countText}`
  }

  const title = `${heading} | Luxus Collection Firearms for Sale`
  const lead = `Shop ${subject} for sale at Luxus Collection${stockClause}.`
  const description = `${lead} ${BRAND_LINE}`.length <= MAX_DESCRIPTION ? `${lead} ${BRAND_LINE}` : lead

  return { title, description }
}
