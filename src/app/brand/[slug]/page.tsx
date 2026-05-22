import { Suspense } from "react"
import { getProducts } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import ListingPage from "@/app/shop/ListingPage"
import type { Metadata } from "next"

const PRODUCT_FIELDS = "*variants,*variants.prices,*images,*categories,*collection,+metadata"
const PAGE_SIZE = 100

// Normalise a brand name to a URL slug.
// Treats "&" and "and" as equivalent so "Smith & Wesson" and
// "Smith and Wesson" both produce "smith-wesson".
function toSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/\s*&\s*/g, '-')
    .replace(/\s+and\s+/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
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

function getBrandName(slug: string, products: ReturnType<typeof mapMedusaProduct>[]) {
  return [...new Set(products.flatMap(p => p.attribute_lists.brand))].find(b => toSlug(b) === slug)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  let name = slug
  try {
    const products = await getAllProducts()
    name = getBrandName(slug, products) ?? slug
  } catch {}
  return {
    title: `${name} Firearms`,
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

  const brandName = getBrandName(slug, allProducts)
  const name = brandName ?? slug
  const products = brandName
    ? allProducts.filter(p => p.attribute_lists.brand.includes(brandName))
    : []

  return (
    <Suspense fallback={<Loading />}>
      <ListingPage
        products={products}
        title={name}
        eyebrow="Brand"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: name },
        ]}
        hideBrandFilter
        basePath={`/brand/${slug}`}
      />
    </Suspense>
  )
}
