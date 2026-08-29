import { notFound, permanentRedirect } from "next/navigation"
import { getProducts, getCollection, getCollections } from "@/lib/api"
import { mapMedusaProduct, sortForDefaultListing, SCHEMA_ITEM_LIST_SIZE } from "@/lib/medusa"
import ListingPage from "@/components/ListingPage"
import type { Metadata } from "next"
import { ogMeta } from "@/lib/og"
import { buildCollectionMeta } from "@/lib/listingSeo"

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
  return raw.map(mapMedusaProduct).filter(p => !p.is_backroom_hidden)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  let name = slug
  try {
    const res = await getCollection(slug)
    name = res.collections?.[0]?.title ?? slug
  } catch {}
  const { title, description } = buildCollectionMeta(name)
  return {
    title,
    description,
    ...ogMeta(title, description, { url: `/collection/${slug}` }),
    alternates: { canonical: `/collection/${slug}` },
  }
}

export const revalidate = false

export async function generateStaticParams() {
  try {
    const res = await getCollections()
    return (res.collections ?? []).map((c: any) => ({ slug: c.handle }))
  } catch { return [] }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (slug !== slug.toLowerCase()) permanentRedirect(`/collection/${slug.toLowerCase()}`)

  let collectionTitle = slug
  let collectionId: string | null = null

  try {
    const res = await getCollection(slug)
    const col = res.collections?.[0]
    if (col) {
      collectionTitle = col.title ?? slug
      collectionId = col.id ?? null
    }
  } catch {}

  let allProducts: ReturnType<typeof mapMedusaProduct>[] = []
  try { allProducts = await getAllProducts() } catch {}

  if (!collectionId && allProducts.length > 0) notFound()

  const products = collectionId
    ? allProducts.filter(p => p.collection_id === collectionId)
    : allProducts

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
  const { description: collectionDescription } = buildCollectionMeta(collectionTitle)
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${collectionTitle} — Luxus Collection`,
    description: collectionDescription,
    url: `${SITE}/collection/${slug}`,
    numberOfItems: products.length || undefined,
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE}/shop` },
      { '@type': 'ListItem', position: 3, name: collectionTitle, item: `${SITE}/collection/${slug}` },
    ],
  }
  const visibleProducts = sortForDefaultListing(products).slice(0, SCHEMA_ITEM_LIST_SIZE)
  const itemListJsonLd = visibleProducts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: collectionTitle,
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
      <ListingPage
        products={products}
        title={collectionTitle}
        eyebrow="Collection"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: collectionTitle },
        ]}
        hideBrandFilter
        basePath={`/collection/${slug}`}
      />
    </>
  )
}
