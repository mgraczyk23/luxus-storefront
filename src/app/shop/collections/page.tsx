import { getProducts, getCollections } from "@/lib/api"
import { getShopTileImages, getPageSeo } from "@/lib/payload"
import ShopByDirectory from "../ShopByDirectory"
import type { DirectoryItem } from "../ShopByDirectory"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  return {
    title:       seo.collections?.title       || "Shop by Collection",
    description: seo.collections?.description || "Browse all collections at the Luxus Collection.",
    alternates: { canonical: '/shop/collections' },
  }
}

export const revalidate = false

export default async function CollectionsDirectory() {
  const [collectionsRes, tileImagesRes, countRes] = await Promise.allSettled([
    getCollections(),
    getShopTileImages(),
    getProducts({ limit: "500", fields: "id,*collection" }),
  ])

  const tileImages = tileImagesRes.status === 'fulfilled'
    ? tileImagesRes.value
    : { collections: {} as Record<string,string>, categories: {} as Record<string,string>, models: {} as Record<string,string> }

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

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Shop by Collection — Luxus Collection',
    description: 'Browse all collections at the Luxus Collection.',
    url: `${SITE}/shop/collections`,
    numberOfItems: items.length || undefined,
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Shop by Collection' },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ShopByDirectory type="collection" title="Shop by Collection" items={items} />
    </>
  )
}
