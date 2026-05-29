import { getProducts } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import { getShopTileImages } from "@/lib/payload"
import ShopByDirectory from "../ShopByDirectory"
import type { DirectoryItem } from "../ShopByDirectory"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shop by Model",
  description: "Browse all firearm models at the Luxus Collection.",
}

export const revalidate = 60

function toSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/\s*&\s*/g, '-')
    .replace(/\s+and\s+/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default async function ModelsDirectory() {
  const [rawRes, tileImagesRes] = await Promise.allSettled([
    getProducts({ limit: "500", fields: "id,*attribute_values,*attribute_values.attribute_type" }),
    getShopTileImages(),
  ])

  const modelNames = new Map<string, string>() // slug → display name
  const countMap: Record<string, number> = {}

  if (rawRes.status === 'fulfilled') {
    for (const p of (rawRes.value.products ?? [])) {
      const mapped = mapMedusaProduct(p)
      for (const model of mapped.attribute_lists.model) {
        const slug = toSlug(model)
        if (!modelNames.has(slug)) modelNames.set(slug, model)
        countMap[slug] = (countMap[slug] ?? 0) + 1
      }
    }
  }

  const tileImages = tileImagesRes.status === 'fulfilled'
    ? tileImagesRes.value
    : { collections: {}, categories: {}, models: {} }

  const items: DirectoryItem[] = [...modelNames.entries()]
    .map(([slug, name]) => ({
      name,
      href: `/shop/model/${slug}`,
      count: countMap[slug] ?? 0,
      imageUrl: tileImages.models[slug],
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  return <ShopByDirectory type="model" title="Shop by Model" items={items} />
}
