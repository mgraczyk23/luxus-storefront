import { Suspense } from "react"
import { permanentRedirect } from "next/navigation"
import { getProducts } from "@/lib/api"
import { mapMedusaProduct, sortForDefaultListing, SCHEMA_ITEM_LIST_SIZE } from "@/lib/medusa"
import ListingPage from "@/components/ListingPage"
import type { Metadata } from "next"
import { ogMeta } from "@/lib/og"
import { toSlug } from "@/lib/slug"
import { buildListingMeta } from "@/lib/listingSeo"

// If every product under this model slug shares one brand, lead with it
// ("Korth Model 48-4") — a much stronger match for "<brand> <model> for sale"
// searches than the bare model number alone, derived from data with no
// per-model manual entry.
function singleBrand(products: ReturnType<typeof mapMedusaProduct>[]): string | null {
  const brands = new Set(products.flatMap(p => p.attribute_lists.brand))
  return brands.size === 1 ? [...brands][0] : null
}

const PRODUCT_FIELDS = "id,title,handle,subtitle,thumbnail,created_at,*variants,*variants.prices,*variants.inventory_quantity,categories.id,categories.name,categories.handle,collection.id,collection.handle,+metadata"
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
  return raw.map(mapMedusaProduct)
}

function getModelName(slug: string, products: ReturnType<typeof mapMedusaProduct>[]) {
  return [...new Set(products.flatMap(p => p.attribute_lists.model))].find(m => toSlug(m) === slug)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const normalized = toSlug(slug)
  let name = normalized
  let modelProducts: ReturnType<typeof mapMedusaProduct>[] = []
  try {
    const products = await getAllProducts()
    name = getModelName(normalized, products) ?? normalized
    modelProducts = products.filter(p => p.attribute_lists.model.includes(name))
  } catch {}
  const brand = singleBrand(modelProducts)
  const heading = brand ? `${brand} ${name}` : name
  const { title, description } = buildListingMeta(heading, modelProducts)
  return {
    title,
    description,
    ...ogMeta(title, description, { url: `/shop/model/${normalized}` }),
    alternates: { canonical: `/shop/model/${normalized}` },
  }
}

export const revalidate = false

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
  if (normalized !== slug) permanentRedirect(`/shop/model/${normalized}`)

  let allProducts: ReturnType<typeof mapMedusaProduct>[] = []
  try { allProducts = await getAllProducts() } catch {}

  const modelName = getModelName(slug, allProducts)
  const name = modelName ?? slug
  const products = modelName
    ? allProducts.filter(p => p.attribute_lists.model.some(m => toSlug(m) === slug))
    : []

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
  const modelHeading = singleBrand(products) ? `${singleBrand(products)} ${name}` : name
  const { description: modelDescription } = buildListingMeta(modelHeading, products)
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${modelHeading} — Luxus Collection`,
    description: modelDescription,
    url: `${SITE}/shop/model/${slug}`,
    numberOfItems: products.length || undefined,
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE}/shop` },
      { '@type': 'ListItem', position: 3, name: name, item: `${SITE}/shop/model/${slug}` },
    ],
  }

  const visibleProducts = sortForDefaultListing(products).slice(0, SCHEMA_ITEM_LIST_SIZE)
  const itemListJsonLd = visibleProducts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
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
          eyebrow="Model Series"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            { label: name },
          ]}
          basePath={`/shop/model/${slug}`}
        />
      </Suspense>
    </>
  )
}
