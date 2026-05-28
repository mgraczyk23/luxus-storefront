import { getProducts } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import { getBrand, getPostsByBrand } from "@/lib/payload"
import BrandHubPage from "./BrandHubPage"
import type { Metadata } from "next"

const PRODUCT_FIELDS = "*variants,*variants.prices,*images,*categories,*collection,+metadata,*attribute_values,*attribute_values.attribute_type"
const PAGE_SIZE = 100

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
  const [brand, allProducts] = await Promise.allSettled([getBrand(slug), getAllProducts()])
  const brandData  = brand.status === 'fulfilled' ? brand.value : null
  const products   = allProducts.status === 'fulfilled' ? allProducts.value : []
  const brandName  = brandData?.name ?? getBrandName(slug, products) ?? slug
  const title      = brandData?.seoTitle ?? `${brandName} Firearms`
  const description = brandData?.seoDescription ?? brandData?.tagline ?? brandData?.description ?? `Browse ${brandName} firearms at the Luxus Collection.`
  return { title, description }
}

export const revalidate = 60

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [brand, allProducts] = await Promise.allSettled([
    getBrand(slug),
    getAllProducts(),
  ])

  const brandData  = brand.status === 'fulfilled' ? brand.value : null
  const allProds   = allProducts.status === 'fulfilled' ? allProducts.value : []

  // Find display name from Medusa if Payload brand not found
  const brandName  = brandData?.name ?? getBrandName(slug, allProds)

  // Filter to just this brand's products
  const brandProds = brandName
    ? allProds.filter(p => p.attribute_lists.brand.some(b => toSlug(b) === slug))
    : []

  // Fetch articles linked to this brand (requires brand ID from Payload)
  const articles = brandData
    ? await getPostsByBrand(brandData.id).catch(() => [])
    : []

  return (
    <BrandHubPage
      brand={brandData}
      articles={articles}
      products={brandProds}
      slug={slug}
    />
  )
}
