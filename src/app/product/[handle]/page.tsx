import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getProduct, getProducts } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import ProductDetailPage from "./ProductDetailPage"
import type { Metadata } from "next"

export const revalidate = 60

const FIELDS = "*variants,*variants.prices,*images,*categories,*collection,+metadata"
const RELATED_FIELDS = "*variants,*variants.prices,*images,+metadata"

export async function generateMetadata(
  { params }: { params: Promise<{ handle: string }> }
): Promise<Metadata> {
  const { handle } = await params
  try {
    const res = await getProduct(handle)
    const p = res.products?.[0]
    if (!p) return {}
    const mapped = mapMedusaProduct(p)
    return {
      title: mapped.title,
      description: mapped.short_description ?? mapped.overview?.slice(0, 160) ?? undefined,
      openGraph: mapped.thumbnail ? { images: [mapped.thumbnail] } : undefined,
    }
  } catch {
    return {}
  }
}

export default async function ProductPage(
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params

  const res = await getProduct(handle).catch(() => null)
  const raw = res?.products?.[0]
  if (!raw) notFound()

  const product = mapMedusaProduct(raw)

  // Fetch related products: same brand, exclude self, take up to 4
  let relatedProducts: ReturnType<typeof mapMedusaProduct>[] = []
  try {
    const relRes = await getProducts({ limit: "20", fields: RELATED_FIELDS })
    relatedProducts = (relRes.products ?? [])
      .map(mapMedusaProduct)
      .filter(p => p.id !== product.id && p.attributes.brand === product.attributes.brand)
      .slice(0, 4)
  } catch { /* leave empty */ }

  return (
    <Suspense>
      <ProductDetailPage product={product} relatedProducts={relatedProducts} />
    </Suspense>
  )
}
