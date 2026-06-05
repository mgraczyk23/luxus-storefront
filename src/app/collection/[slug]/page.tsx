import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getProducts, getCollection, getCollections } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import ListingPage from "@/app/shop/ListingPage"
import type { Metadata } from "next"

const PRODUCT_FIELDS = "id,title,handle,subtitle,thumbnail,*variants,*variants.prices,*variants.inventory_quantity,categories.id,categories.name,categories.handle,collection.id,collection.handle,+metadata"
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
  return {
    title: `${name} — Luxus Collection`,
    description: `Browse the ${name} collection at the Luxus Collection.`,
  }
}

export const revalidate = false

export async function generateStaticParams() {
  try {
    const res = await getCollections()
    return (res.collections ?? []).map((c: any) => ({ slug: c.handle }))
  } catch { return [] }
}

function Loading() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", color: "#9a9a9a", fontSize: "11px", letterSpacing: "0.1em" }}>
      Loading…
    </div>
  )
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

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

  return (
    <Suspense fallback={<Loading />}>
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
    </Suspense>
  )
}
