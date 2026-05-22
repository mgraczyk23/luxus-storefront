import { Suspense } from "react"
import { getProducts } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import ShopPage from "./ShopPage"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "All Firearms",
  description: "Browse the Luxus Collection — the world's finest production and custom pistols.",
}

export const revalidate = 60

const PRODUCT_FIELDS = "*variants,*variants.prices,*images,*categories,+metadata"

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
    const res = await getProducts({ limit: "200", fields: PRODUCT_FIELDS })
    products = (res.products ?? []).map(mapMedusaProduct)
  } catch {
    // Products will be empty array — ShopPage shows empty state
  }

  return (
    <Suspense fallback={<ShopLoading />}>
      <ShopPage products={products} />
    </Suspense>
  )
}
