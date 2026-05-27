import { getProducts, getCollections } from "@/lib/api"
import { getShopTileImages } from "@/lib/payload"
import ShopByDirectory from "../ShopByDirectory"
import type { DirectoryItem } from "../ShopByDirectory"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shop by Collection",
  description: "Browse all collections at the Luxus Collection.",
}

export const revalidate = 60

export default async function CollectionsDirectory() {
  const [collectionsRes, tileImagesRes, countRes] = await Promise.allSettled([
    getCollections(),
    getShopTileImages(),
    getProducts({ limit: "500", fields: "id,*collection" }),
  ])

  const tileImages = tileImagesRes.status === 'fulfilled'
    ? tileImagesRes.value
    : { collections: {}, categories: {} }

  const countMap: Record<string, number> = {}
  if (countRes.status === 'fulfilled') {
    for (const p of (countRes.value.products ?? [])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const colId = (p as any).collection?.id as string | undefined
      if (colId) countMap[colId] = (countMap[colId] ?? 0) + 1
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allCollections: any[] = collectionsRes.status === 'fulfilled'
    ? (collectionsRes.value.collections ?? [])
    : []

  const items: DirectoryItem[] = allCollections
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((c: any) => (c.title ?? c.name ?? '').toLowerCase() !== 'featured' && c.handle)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((c: any) => ({
      name: (c.title ?? c.name ?? '') as string,
      href: `/collection/${c.handle as string}`,
      count: (countMap[c.id as string] ?? 0) as number,
      imageUrl: tileImages.collections[c.handle as string] ?? undefined,
    }))
    .filter((c: DirectoryItem) => !!c.name)
    .sort((a: DirectoryItem, b: DirectoryItem) => b.count - a.count || a.name.localeCompare(b.name))

  return <ShopByDirectory type="collection" title="Shop by Collection" items={items} />
}
