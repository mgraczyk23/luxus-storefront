import { Suspense }   from "react"
import { notFound }   from "next/navigation"
import { getProduct, getProducts, getProductDetails, getProductSpecs } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import { getSiteSettings } from "@/lib/payload"
import ProductDetailPage from "@/app/product/[handle]/ProductDetailPage"
import type { Metadata } from "next"

const ROOM_NAMES: Record<string, string> = {
  master:   "Private Collection",
  backroom: "The Backroom",
  vip:      "VIP Collection",
  reserve:  "Reserve Collection",
  special:  "Special Collection",
  unicorn:  "The Unicorn Room",
}
const VALID = Object.keys(ROOM_NAMES)

export const revalidate = false

export async function generateMetadata(
  { params }: { params: Promise<{ room: string; handle: string }> }
): Promise<Metadata> {
  const { handle } = await params
  try {
    const res = await getProduct(handle)
    const p   = res.products?.[0]
    if (!p) return {}
    const mapped = mapMedusaProduct(p)
    return {
      title: mapped.title,
      robots: "noindex, nofollow",
    }
  } catch {
    return { robots: "noindex, nofollow" }
  }
}

const RELATED_FIELDS = "*variants,*variants.prices,*variants.inventory_quantity,*images,+metadata,*attribute_values,*attribute_values.attribute_type"

export default async function BackroomProductPage(
  { params }: { params: Promise<{ room: string; handle: string }> }
) {
  const { room, handle } = await params
  if (!VALID.includes(room)) notFound()

  const res = await getProduct(handle).catch(() => null)
  const raw = res?.products?.[0]
  if (!raw) notFound()

  const product = mapMedusaProduct(raw)

  // Product must be a backroom item — prevent direct URL access to public products via this route
  if (!product.is_backroom_hidden) notFound()

  const [detailRes, relRes, settings, specsRes] = await Promise.all([
    getProductDetails(raw.id).catch(() => null),
    getProducts({ limit: "20", fields: RELATED_FIELDS }).catch(() => null),
    getSiteSettings(),
    getProductSpecs(raw.id).catch(() => null),
  ])

  const detail = detailRes?.product_detail
  if (detail) {
    product.seo_meta_title       = detail.seo_meta_title ?? null
    product.seo_meta_description = detail.seo_meta_description ?? null
  }

  // Related products within the same room, same brand
  const allMapped = (relRes?.products ?? []).map(mapMedusaProduct)
  const relatedProducts = allMapped
    .filter(p =>
      p.id !== product.id &&
      p.is_backroom_hidden &&
      p.attributes.brand === product.attributes.brand
    )
    .slice(0, 4)

  const serverSpecs = specsRes?.specs ?? null

  return (
    <Suspense>
      {/* Breadcrumb / back link */}
      <div style={{ padding: "20px 40px 0", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        <a
          href={`/private/${room}`}
          style={{ color: "#aaa", textDecoration: "none" }}
        >
          ← {ROOM_NAMES[room]}
        </a>
      </div>
      <ProductDetailPage
        product={product}
        relatedProducts={relatedProducts}
        settings={settings}
        serverSpecs={serverSpecs}
      />
    </Suspense>
  )
}
