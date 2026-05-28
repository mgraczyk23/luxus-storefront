import { getProducts } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import { getBrand, getPostsByBrand } from "@/lib/payload"
import ResourcesBrandPage from "./ResourcesBrandPage"
import type { Metadata } from "next"

const PRODUCT_FIELDS = "*variants,*variants.prices,*images,*categories,*collection,+metadata,*attribute_values,*attribute_values.attribute_type"
const PAGE_SIZE = 100

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const brand = await getBrand(slug).catch(() => null)
  const name = brand?.name ?? slug
  return {
    title: brand?.seoTitle ?? `${name} — Resources on Guns | Luxus Collection`,
    description: brand?.seoDescription ?? brand?.tagline ?? brand?.description ?? `History, engineering, and craftsmanship of ${name} firearms.`,
  }
}

export const revalidate = 60

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [brand, allProducts] = await Promise.allSettled([
    getBrand(slug),
    getAllProducts(),
  ])

  const brandData = brand.status === 'fulfilled' ? brand.value : null
  const allProds  = allProducts.status === 'fulfilled' ? allProducts.value : []

  // Products from Medusa for this brand slug
  const brandProds = allProds.filter(p =>
    p.attribute_lists.brand.some(b => toSlug(b) === slug)
  )

  // Articles linked to this brand in Payload
  const articles = brandData
    ? await getPostsByBrand(brandData.id).catch(() => [])
    : []

  return (
    <ResourcesBrandPage
      brand={brandData}
      articles={articles}
      products={brandProds}
      slug={slug}
    />
  )
}
