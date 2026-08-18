import { Suspense } from "react"
import { notFound, permanentRedirect } from "next/navigation"
import { getProduct, getProducts, getProductDetails, getProductSpecs } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import { getSiteSettings, getProductMedia } from "@/lib/payload"
import { ogMeta } from "@/lib/og"
import { toSlug } from "@/lib/slug"
import ProductDetailPage from "@/components/ProductDetailPage"
import type { Metadata } from "next"

export const revalidate = false

export async function generateStaticParams() {
  // Pre-build only the 50 most recent public products at deploy time — keeps build fast.
  // All other product pages render on first visit and are then cached indefinitely.
  try {
    const res = await getProducts({ limit: "50", fields: "id,handle,+metadata" })
    return (res.products ?? []).map((p: any) => ({ handle: p.handle }))
  } catch { return [] }
}

const RELATED_FIELDS = "*variants,*variants.prices,*variants.inventory_quantity,*images,+metadata,*attribute_values,*attribute_values.attribute_type"

export async function generateMetadata(
  { params }: { params: Promise<{ handle: string }> }
): Promise<Metadata> {
  const { handle } = await params
  const normalized = toSlug(handle)
  try {
    const res = await getProduct(normalized)
    const p = res.products?.[0]
    if (!p) return {}
    const mapped = mapMedusaProduct(p)
    const detailRes = await getProductDetails(p.id).catch(() => null)
    const detail = detailRes?.product_detail
    const title = detail?.seo_meta_title || mapped.title
    const description = detail?.seo_meta_description || mapped.short_description || mapped.overview?.slice(0, 160) || undefined
    return {
      title,
      description,
      ...ogMeta(title, description, mapped.thumbnail),
      alternates: { canonical: `/product/${normalized}` },
    }
  } catch {
    return {}
  }
}

export default async function ProductPage(
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  const normalized = toSlug(handle)
  if (normalized !== handle) permanentRedirect(`/product/${normalized}`)

  const res = await getProduct(normalized).catch(() => null)
  const raw = res?.products?.[0]
  if (!raw) notFound()

  const product = mapMedusaProduct(raw)

  // Fetch product details (SEO fields + extra module data) and related products in parallel
  const [detailRes, relRes, settings, specsRes, productMedia] = await Promise.all([
    getProductDetails(raw.id).catch(() => null),
    getProducts({ limit: "20", fields: RELATED_FIELDS }).catch(() => null),
    getSiteSettings(),
    getProductSpecs(raw.id).catch(() => null),
    getProductMedia(normalized).catch(() => null),
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

  // Build additionalProperty array from firearms attributes and specs
  const additionalProps: Array<{ '@type': string; name: string; value: string }> = []
  const addProp = (name: string, value: string | null | undefined) => {
    if (value) additionalProps.push({ '@type': 'PropertyValue', name, value })
  }
  addProp('Caliber', product.attributes.caliber)
  addProp('Action', product.attributes.action)
  addProp('Barrel Length', product.attributes.barrel_length)
  addProp('Frame Color', product.attributes.frame_color)
  if (serverSpecs) {
    addProp('Finish', serverSpecs.finish)
    addProp('Sights', serverSpecs.sights)
    addProp('Overall Length', serverSpecs.overall_length)
    addProp('Grip', serverSpecs.grip)
    addProp('Frame Material', serverSpecs.frame_material)
  }

  // Parse weight into QuantitativeValue (units: ONZ = ounces, as most firearm specs use oz)
  let weightSpec: { '@type': string; value: string; unitCode: string } | undefined
  if (serverSpecs?.weight) {
    const m = serverSpecs.weight.match(/[\d.]+/)
    if (m) weightSpec = { '@type': 'QuantitativeValue', value: m[0], unitCode: 'ONZ' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const primaryCat = (raw as any).categories?.[0]

  // Product images — use all available images, fall back to thumbnail.
  // "Modern Firearms" tagged products use stock/manufacturer images, so we omit
  // license metadata for those. All other products (collectibles) are original
  // Luxus Collection photography and get the full ImageObject with license info.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawImages: string[] = ((raw as any).images ?? []).map((img: any) => img.url).filter(Boolean)
  const imageUrls = rawImages.length > 0 ? rawImages : (product.thumbnail ? [product.thumbnail] : [])
  const isModernFirearm = product.tags.some(t => t.toLowerCase() === 'modern firearms')
  const images = imageUrls.length > 0
    ? imageUrls.map(url => isModernFirearm ? { '@type': 'ImageObject', url } : {
        '@type': 'ImageObject',
        url,
        copyrightNotice: '© Luxus Collection',
        creator: { '@type': 'Organization', name: 'Luxus Collection' },
        license: `${SITE}/terms`,
        acquireLicensePage: `${SITE}/contact`,
      })
    : undefined

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.short_description || product.overview?.slice(0, 200) || undefined,
    url: `${SITE}/product/${product.handle}`,
    image: images,
    brand: product.attributes.brand
      ? { '@type': 'Brand', name: product.attributes.brand }
      : undefined,
    manufacturer: product.attributes.brand
      ? { '@type': 'Organization', name: product.attributes.brand }
      : undefined,
    sku: product.id,
    color: product.attributes.frame_color || undefined,
    material: serverSpecs?.frame_material || undefined,
    weight: weightSpec,
    category: primaryCat?.name || undefined,
    itemCondition: 'https://schema.org/NewCondition',
    additionalProperty: additionalProps.length > 0 ? additionalProps : undefined,
    // Contact-for-pricing products omit the offers block entirely.
    // Google Product Snippet (organic search) only requires name + image — offers
    // is optional. The "missing Offer" warning in Search Console is non-penalizing
    // and is the correct/recommended approach for POA items per Google's own docs.
    // Firearms cannot appear in Google Shopping regardless, so Merchant Listing
    // eligibility (which does require offers+price) is irrelevant for this store.
    offers: (!product.contact_for_pricing && product.price != null) ? {
      '@type': 'Offer',
      url: `${SITE}/product/${product.handle}`,
      availability: product.in_stock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      priceCurrency: 'USD',
      price: product.price.toFixed(2),
      seller: { '@type': 'Organization', name: 'Luxus Collection' },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: '95.00', currency: 'USD' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'US' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
          transitTime:  { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'US',
        returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
        merchantReturnLink: `${SITE}/contact`,
      },
    } : undefined,
  }

  // BreadcrumbList for navigation path context
  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
    { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE}/shop` },
  ]
  if (primaryCat?.name && primaryCat?.handle) {
    breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: primaryCat.name, item: `${SITE}/category/${primaryCat.handle}` })
  }
  breadcrumbItems.push({ '@type': 'ListItem', position: breadcrumbItems.length + 1, name: product.title, item: `${SITE}/product/${product.handle}` })

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense>
        <ProductDetailPage product={product} relatedProducts={relatedProducts} settings={settings} serverSpecs={serverSpecs} productMedia={productMedia} />
      </Suspense>
    </>
  )
}
