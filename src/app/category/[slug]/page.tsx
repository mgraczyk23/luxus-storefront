import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getProducts } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import ListingPage from "@/app/shop/ListingPage"
import type { Metadata } from "next"

const PRODUCT_FIELDS = "*variants,*variants.prices,*variants.inventory_quantity,*images,*categories,*collection,+metadata,*attribute_values,*attribute_values.attribute_type"
const PAGE_SIZE = 100

function toSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

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

function getCategoryName(slug: string, products: ReturnType<typeof mapMedusaProduct>[]) {
  return [...new Set(products.flatMap(p => p.categories))].find(c => toSlug(c) === slug)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  let name = slug
  try {
    const products = await getAllProducts()
    name = getCategoryName(slug, products) ?? slug
  } catch {}
  return {
    title: `${name} — Luxus Collection`,
    description: `Browse ${name} firearms at the Luxus Collection.`,
  }
}

export const revalidate = 60

function Loading() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", color: "#9a9a9a", fontSize: "11px", letterSpacing: "0.1em" }}>
      Loading…
    </div>
  )
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let allProducts: ReturnType<typeof mapMedusaProduct>[] = []
  try { allProducts = await getAllProducts() } catch {}

  const categoryName = getCategoryName(slug, allProducts)
  if (!categoryName && allProducts.length > 0) notFound()

  const name = categoryName ?? slug
  const products = allProducts.filter(p => p.categories.includes(name))

  return (
    <Suspense fallback={<Loading />}>
      <ListingPage
        products={products}
        title={name}
        eyebrow="Category"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: name },
        ]}
        hideCategoryFilter
        basePath={`/category/${slug}`}
      />
    </Suspense>
  )
}
