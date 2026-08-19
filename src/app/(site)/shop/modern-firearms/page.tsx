import { Suspense } from "react"
import { getProducts } from "@/lib/api"
import { mapMedusaProduct, sortForDefaultListing, SCHEMA_ITEM_LIST_SIZE } from "@/lib/medusa"
import { getPageSeo } from "@/lib/payload"
import { ogMeta } from "@/lib/og"
import ListingPage from "@/components/ListingPage"
import type { Metadata } from "next"

export const revalidate = false

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  const title = seo.modernFirearms?.title || "Modern Firearms"
  const description = seo.modernFirearms?.description || "Browse modern high-end firearms curated by the Luxus Collection."
  return {
    title,
    description,
    ...ogMeta(title, description, { url: '/shop/modern-firearms' }),
    alternates: { canonical: '/shop/modern-firearms' },
  }
}

const PRODUCT_FIELDS = "id,title,handle,subtitle,thumbnail,created_at,*variants,*variants.prices,*variants.inventory_quantity,categories.id,categories.name,categories.handle,collection.id,collection.handle,+metadata,*tags"
const PAGE_SIZE = 100

async function getAllProducts() {
  const first = await getProducts({ limit: String(PAGE_SIZE), offset: "0", fields: PRODUCT_FIELDS })
  const total = first.count ?? 0
  const raw = [...(first.products ?? [])]
  if (total > raw.length) {
    const extra = Math.ceil((total - PAGE_SIZE) / PAGE_SIZE)
    const pages = await Promise.all(
      Array.from({ length: extra }, (_, i) =>
        getProducts({ limit: String(PAGE_SIZE), offset: String((i + 1) * PAGE_SIZE), fields: PRODUCT_FIELDS })
      )
    )
    for (const page of pages) raw.push(...(page.products ?? []))
  }
  return raw.map(mapMedusaProduct).filter(p => !p.is_backroom_hidden && p.tags.includes('Modern Firearms'))
}

export default async function ModernFirearmsPage() {
  let products: ReturnType<typeof mapMedusaProduct>[] = []
  try {
    products = await getAllProducts()
  } catch {}

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Modern Firearms — Luxus Collection',
    description: 'Browse modern high-end firearms curated by the Luxus Collection.',
    url: `${SITE}/shop/modern-firearms`,
    numberOfItems: products.length || undefined,
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',           item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Shop',           item: `${SITE}/shop` },
      { '@type': 'ListItem', position: 3, name: 'Modern Firearms', item: `${SITE}/shop/modern-firearms` },
    ],
  }
  const visibleProducts = sortForDefaultListing(products).slice(0, SCHEMA_ITEM_LIST_SIZE)
  const itemListJsonLd = visibleProducts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Modern Firearms',
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
      <Suspense>
        <ListingPage
          products={products}
          title="Modern Firearms"
          eyebrow="Shop"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Shop All", href: "/shop" },
            { label: "Modern Firearms" },
          ]}
          basePath="/shop/modern-firearms"
        />
      </Suspense>
    </>
  )
}
