import type { Metadata } from "next"
import { getProducts } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import { getSiteSettings, getFeaturedPageText, getFeaturedClassifieds } from "@/lib/payload"
import FeaturedPage from "./FeaturedPage"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Featured Collection",
  description: "Hand-selected pieces from the Luxus Collection — exceptional firearms chosen for provenance, craftsmanship, and rarity.",
}

const PRODUCT_FIELDS = "*variants,*variants.prices,*images,+metadata,*attribute_values,*attribute_values.attribute_type"

export default async function Page() {
  const [settingsRes, textRes, classifiedsRes, collectionRes, categoryRes] = await Promise.allSettled([
    getSiteSettings(),
    getFeaturedPageText(),
    getFeaturedClassifieds(),
    // Primary source: "featured" collection
    getProducts({ "collection_id[]": "pcol_01KS5MQFJD42W72T6B0BH903YD", limit: "24", fields: PRODUCT_FIELDS }),
    // Secondary source: "featured" category (many-to-many — use this going forward for multi-collection support)
    getProducts({ "category_id[]": "pcat_featured", limit: "24", fields: PRODUCT_FIELDS }).catch(() => ({ products: [], count: 0 })),
  ])

  const settings   = settingsRes.status === "fulfilled"    ? settingsRes.value    : await getSiteSettings()
  const text       = textRes.status === "fulfilled"        ? textRes.value        : {}
  const classifieds = classifiedsRes.status === "fulfilled" ? classifiedsRes.value : []

  // Merge collection + category products, deduped by id
  const collectionProducts = collectionRes.status === "fulfilled" ? (collectionRes.value.products ?? []) : []
  const categoryProducts   = categoryRes.status === "fulfilled"   ? (categoryRes.value as any).products ?? [] : []
  const seen = new Set<string>()
  const allRaw = [...collectionProducts, ...categoryProducts].filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
  const products = allRaw.map(mapMedusaProduct)

  return <FeaturedPage settings={settings} text={text} products={products} classifieds={classifieds} />
}
