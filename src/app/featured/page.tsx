import type { Metadata } from "next"
import { getProducts, getProductTags } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import { getSiteSettings, getFeaturedPageText, getFeaturedClassifieds } from "@/lib/payload"
import FeaturedPage from "./FeaturedPage"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Featured Collection",
  description: "Hand-selected pieces from the Luxus Collection — exceptional firearms chosen for provenance, craftsmanship, and rarity.",
}

// Include tags and type so mapMedusaProduct can populate is_firearm and tags[]
const PRODUCT_FIELDS = "*variants,*variants.prices,*variants.inventory_quantity,*images,+metadata,*attribute_values,*attribute_values.attribute_type,*tags,*type"

export default async function Page() {
  const [settingsRes, textRes, classifiedsRes, tagsRes] = await Promise.allSettled([
    getSiteSettings(),
    getFeaturedPageText(),
    getFeaturedClassifieds(),
    getProductTags(),
  ])

  const settings    = settingsRes.status    === "fulfilled" ? settingsRes.value    : await getSiteSettings()
  const text        = textRes.status        === "fulfilled" ? textRes.value        : {}
  const classifieds = classifiedsRes.status === "fulfilled" ? classifiedsRes.value : []
  const allTags     = tagsRes.status        === "fulfilled" ? tagsRes.value.product_tags : []

  // Find the "Featured" tag (case-insensitive)
  const featuredTag = allTags.find(t => t.value.toLowerCase() === "featured")

  // Fetch products by tag if it exists, fall back to the "featured" collection
  const [tagProductsRes, collectionProductsRes] = await Promise.allSettled([
    featuredTag
      ? getProducts({ "tag_id[]": featuredTag.id, limit: "24", fields: PRODUCT_FIELDS })
      : Promise.resolve({ products: [], count: 0 }),
    // Collection kept as fallback for any products not yet tagged
    getProducts({ "collection_id[]": "pcol_01KS5MQFJD42W72T6B0BH903YD", limit: "24", fields: PRODUCT_FIELDS }),
  ])

  const tagProducts        = tagProductsRes.status        === "fulfilled" ? tagProductsRes.value.products        ?? [] : []
  const collectionProducts = collectionProductsRes.status === "fulfilled" ? collectionProductsRes.value.products ?? [] : []

  // Merge, deduped by id. Tag results take priority position.
  const seen = new Set<string>()
  const merged = [...tagProducts, ...collectionProducts].filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  const products = merged.map(mapMedusaProduct).filter(p => !p.is_backroom_hidden)

  return <FeaturedPage settings={settings} text={text} products={products} classifieds={classifieds} />
}
