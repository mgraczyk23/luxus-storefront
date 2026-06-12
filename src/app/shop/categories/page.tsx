import { getProducts, getCategories } from "@/lib/api"
import { getShopTileImages, getPageSeo } from "@/lib/payload"
import ShopByDirectory from "../ShopByDirectory"
import type { DirectoryItem } from "../ShopByDirectory"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  return {
    title:       seo.categories?.title       || "Shop by Category",
    description: seo.categories?.description || "Browse all categories at the Luxus Collection.",
    alternates: { canonical: '/shop/categories' },
  }
}

export const revalidate = false

export default async function CategoriesDirectory() {
  const [categoriesRes, tileImagesRes, countRes] = await Promise.allSettled([
    getCategories(),
    getShopTileImages(),
    getProducts({ limit: "500", fields: "id,*categories" }),
  ])

  const tileImages = tileImagesRes.status === 'fulfilled'
    ? tileImagesRes.value
    : { collections: {} as Record<string,string>, categories: {} as Record<string,string>, models: {} as Record<string,string> }

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

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Shop by Category — Luxus Collection',
    description: 'Browse all firearm categories at the Luxus Collection.',
    url: `${SITE}/shop/categories`,
    numberOfItems: items.length || undefined,
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Shop by Category' },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ShopByDirectory type="category" title="Shop by Category" items={items} />
    </>
  )
}
