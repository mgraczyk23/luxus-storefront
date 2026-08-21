import { getProducts } from "@/lib/api"
import { mapMedusaProduct, sortForDefaultListing, SCHEMA_ITEM_LIST_SIZE } from "@/lib/medusa"
import ShopPage from "./ShopPage"
import type { Metadata } from "next"
import { getPageSeo } from "@/lib/payload"
import { ogMeta } from "@/lib/og"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  const title = seo.shop?.title || "Shop Collectible Firearms"
  const description = seo.shop?.description || "Browse the Luxus Collection — rare, collectible, and historically significant firearms."
  return {
    title,
    description,
    ...ogMeta(title, description, { url: '/shop' }),
    alternates: { canonical: '/shop' },
  }
}

export const revalidate = false

const PRODUCT_FIELDS = "id,title,handle,subtitle,thumbnail,created_at,*variants,*variants.prices,*variants.inventory_quantity,categories.id,categories.name,categories.handle,collection.id,collection.handle,+metadata,*tags,*type"
const PAGE_SIZE = 100

async function getAllProducts(): Promise<ReturnType<typeof mapMedusaProduct>[]> {
  const first = await getProducts({ limit: String(PAGE_SIZE), offset: "0", fields: PRODUCT_FIELDS })
  const total = first.count ?? 0
  const raw = [...(first.products ?? [])]

  if (total > raw.length) {
    const extraPages = Math.ceil((total - PAGE_SIZE) / PAGE_SIZE)
    const pages = await Promise.all(
      Array.from({ length: extraPages }, (_, i) =>
        getProducts({ limit: String(PAGE_SIZE), offset: String((i + 1) * PAGE_SIZE), fields: PRODUCT_FIELDS })
      )
    )
    for (const page of pages) raw.push(...(page.products ?? []))
  }

  return raw.map(mapMedusaProduct).filter(p => !p.is_backroom_hidden && p.tags.includes('Collectibles Firearms'))
}

export default async function Shop() {
  let products: ReturnType<typeof mapMedusaProduct>[] = []
  try {
    products = await getAllProducts()
  } catch {
    // Products will be empty array — ShopPage shows empty state
  }

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Shop Collectible Firearms — Luxus Collection',
    description: 'Browse the Luxus Collection — rare, collectible, and historically significant firearms.',
    url: `${SITE}/shop`,
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE}/shop` },
    ],
  }
  const visibleProducts = sortForDefaultListing(products).slice(0, SCHEMA_ITEM_LIST_SIZE)
  const itemListJsonLd = visibleProducts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Collectible Firearms',
    numberOfItems: visibleProducts.length,
    itemListElement: visibleProducts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE}/product/${p.handle}`,
      name: p.title,
    })),
  } : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {itemListJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />}
      <ShopPage products={products} />
    </>
  )
}
