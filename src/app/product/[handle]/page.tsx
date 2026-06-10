import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getProduct, getProducts, getProductDetails, getProductSpecs } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import { getSiteSettings } from "@/lib/payload"
import ProductDetailPage from "./ProductDetailPage"
import type { Metadata } from "next"

export const revalidate = false

export async function generateStaticParams() {
  // Pre-build only the 50 most recent products at deploy time — keeps build fast.
  // All other product pages render on first visit and are then cached indefinitely.
  try {
    const res = await getProducts({ limit: "50", fields: "id,handle" })
    return (res.products ?? []).map((p: any) => ({ handle: p.handle }))
  } catch { return [] }
}

const RELATED_FIELDS = "*variants,*variants.prices,*variants.inventory_quantity,*images,+metadata,*attribute_values,*attribute_values.attribute_type"

export async function generateMetadata(
  { params }: { params: Promise<{ handle: string }> }
): Promise<Metadata> {
  const { handle } = await params
  try {
    const res = await getProduct(handle)
    const p = res.products?.[0]
    if (!p) return {}
    const mapped = mapMedusaProduct(p)
    const detailRes = await getProductDetails(p.id).catch(() => null)
    const detail = detailRes?.product_detail
    return {
      title: detail?.seo_meta_title || mapped.title,
      description: detail?.seo_meta_description || mapped.short_description || mapped.overview?.slice(0, 160) || undefined,
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

  // Fetch product details (SEO fields + extra module data) and related products in parallel
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

  const relatedProducts = (relRes?.products ?? [])
    .map(mapMedusaProduct)
    .filter(p => p.id !== product.id && p.attributes.brand === product.attributes.brand)
    .slice(0, 4)

  const serverSpecs = specsRes?.specs ?? null

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
  const inStock = product.in_stock || product.contact_for_pricing
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.short_description || product.overview?.slice(0, 200) || undefined,
    url: `${SITE}/product/${product.handle}`,
    image: product.thumbnail ? [product.thumbnail] : undefined,
    brand: product.attributes.brand
      ? { '@type': 'Brand', name: product.attributes.brand }
      : undefined,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      url: `${SITE}/product/${product.handle}`,
      priceCurrency: 'USD',
      ...(product.price && !product.contact_for_pricing
        ? { price: (product.price / 100).toFixed(2) }
        : {}),
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Luxus Collection' },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense>
        <ProductDetailPage product={product} relatedProducts={relatedProducts} settings={settings} serverSpecs={serverSpecs} />
      </Suspense>
    </>
  )
}
