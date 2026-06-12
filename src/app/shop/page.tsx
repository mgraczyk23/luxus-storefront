import { Suspense } from "react"
import { getProducts } from "@/lib/api"
import { mapMedusaProduct, } from "@/lib/medusa"
import ShopPage from "./ShopPage"
import type { Metadata } from "next"
import { getPageSeo } from "@/lib/payload"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  return {
    title:       seo.shop?.title       || "All Firearms",
    description: seo.shop?.description || "Browse the Luxus Collection — the world's finest production and custom pistols.",
    alternates: { canonical: '/shop' },
  }
}

export const revalidate = false

const PRODUCT_FIELDS = "id,title,handle,subtitle,thumbnail,*variants,*variants.prices,*variants.inventory_quantity,categories.id,categories.name,categories.handle,collection.id,collection.handle,+metadata,*tags,*type"
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

  return raw.map(mapMedusaProduct).filter(p => !p.is_backroom_hidden)
}

function ShopLoading() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", color: "#9a9a9a", fontSize: "11px", letterSpacing: "0.1em" }}>
      Loading…
    </div>
  )
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
    name: 'All Firearms — Luxus Collection',
    description: 'Browse the Luxus Collection — fine, collectible, and modern firearms.',
    url: `${SITE}/shop`,
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Shop' },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={<ShopLoading />}>
        <ShopPage products={products} />
      </Suspense>
    </>
  )
}
