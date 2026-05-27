import { getProducts, getCategories } from "@/lib/api"
import { getShopTileImages } from "@/lib/payload"
import ShopByDirectory from "../ShopByDirectory"
import type { DirectoryItem } from "../ShopByDirectory"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shop by Category",
  description: "Browse all categories at the Luxus Collection.",
}

export const revalidate = 60

export default async function CategoriesDirectory() {
  const [categoriesRes, tileImagesRes, countRes] = await Promise.allSettled([
    getCategories(),
    getShopTileImages(),
    getProducts({ limit: "500", fields: "id,*categories" }),
  ])

  const tileImages = tileImagesRes.status === 'fulfilled'
    ? tileImagesRes.value
    : { collections: {}, categories: {} }

  const countMap: Record<string, number> = {}
  if (countRes.status === 'fulfilled') {
    for (const p of (countRes.value.products ?? [])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const cat of ((p as any).categories ?? [])) {
        const catId = (cat as { id?: string }).id
        if (catId) countMap[catId] = (countMap[catId] ?? 0) + 1
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allCategories: any[] = categoriesRes.status === 'fulfilled'
    ? (categoriesRes.value.product_categories ?? [])
    : []

  const items: DirectoryItem[] = allCategories
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((c: any) => !c.parent_category_id && c.handle)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((c: any) => ({
      name: (c.name ?? '') as string,
      href: `/category/${c.handle as string}`,
      count: (countMap[c.id as string] ?? 0) as number,
      imageUrl: tileImages.categories[c.handle as string] ?? undefined,
    }))
    .filter((c: DirectoryItem) => !!c.name)
    .sort((a: DirectoryItem, b: DirectoryItem) => b.count - a.count || a.name.localeCompare(b.name))

  return <ShopByDirectory type="category" title="Shop by Category" items={items} />
}
