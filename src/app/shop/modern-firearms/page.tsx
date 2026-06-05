import { Suspense } from "react"
import { getProducts } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import ListingPage from "@/app/shop/ListingPage"
import type { Metadata } from "next"

export const revalidate = false

export const metadata: Metadata = {
  title: "Modern Firearms",
  description: "Browse modern high-end firearms curated by the Luxus Collection.",
}

const PRODUCT_FIELDS = "id,title,handle,subtitle,thumbnail,*variants,*variants.prices,*variants.inventory_quantity,categories.id,categories.name,categories.handle,collection.id,collection.handle,+metadata,*tags"
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

  return (
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
  )
}
