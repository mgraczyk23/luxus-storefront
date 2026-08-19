import { Suspense } from "react"
import { permanentRedirect } from "next/navigation"
import { getProducts } from "@/lib/api"
import { mapMedusaProduct, sortForDefaultListing, SCHEMA_ITEM_LIST_SIZE } from "@/lib/medusa"
import ListingPage from "@/components/ListingPage"
import type { Metadata } from "next"
import { ogMeta } from "@/lib/og"
import { toSlug } from "@/lib/slug"
import { getBrand } from "@/lib/payload"

const PRODUCT_FIELDS = "id,title,handle,subtitle,thumbnail,created_at,*variants,*variants.prices,*variants.inventory_quantity,categories.id,categories.name,categories.handle,collection.id,collection.handle,+metadata,*attribute_values,*attribute_values.attribute_type"
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
  return raw.map(mapMedusaProduct).filter(p => !p.is_backroom_hidden)
}

function getBrandName(slug: string, products: ReturnType<typeof mapMedusaProduct>[]) {
  return [...new Set(products.flatMap(p => p.attribute_lists.brand))].find(b => toSlug(b) === slug)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const normalized = toSlug(slug)
  let name = normalized
  try {
    const products = await getAllProducts()
    name = getBrandName(normalized, products) ?? normalized
  } catch {}
  const title = `${name} Firearms`
  const description = `Browse ${name} firearms at the Luxus Collection.`
  return {
    title,
    description,
    ...ogMeta(title, description, { url: `/brand/${normalized}` }),
    alternates: { canonical: `/brand/${normalized}` },
  }
}

export const revalidate = false
export const dynamicParams = true

function Loading() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", color: "#9a9a9a", fontSize: "11px", letterSpacing: "0.1em" }}>
      Loading…
    </div>
  )
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const normalized = toSlug(slug)
  if (normalized !== slug) permanentRedirect(`/brand/${normalized}`)

  const [allProducts, brandPayload] = await Promise.allSettled([
    getAllProducts(),
    getBrand(slug),
  ])
  const allProductsArr = allProducts.status === 'fulfilled' ? allProducts.value : []
  const tagline = brandPayload.status === 'fulfilled' ? (brandPayload.value?.tagline ?? null) : null

  const brandName = getBrandName(slug, allProductsArr)
  const name = brandName ?? slug
  const products = brandName
    ? allProductsArr.filter(p => p.attribute_lists.brand.includes(brandName))
    : []

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${name} Firearms — Luxus Collection`,
    description: `Browse ${name} firearms at the Luxus Collection.`,
    url: `${SITE}/brand/${slug}`,
    numberOfItems: products.length || undefined,
    about: { '@type': 'Brand', name },
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE}/shop` },
      { '@type': 'ListItem', position: 3, name: name, item: `${SITE}/brand/${slug}` },
    ],
  }

  const visibleProducts = sortForDefaultListing(products).slice(0, SCHEMA_ITEM_LIST_SIZE)
  const itemListJsonLd = visibleProducts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${name} Firearms`,
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
      <Suspense fallback={<Loading />}>
        <ListingPage
          products={products}
          title={name}
          eyebrow="Brand"
          description={tagline ?? undefined}
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            { label: name },
          ]}
          hideBrandFilter
          basePath={`/brand/${slug}`}
        />
      </Suspense>
    </>
  )
}
