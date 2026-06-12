import { getProducts } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import { getBrands, imageUrl, getPageSeo } from "@/lib/payload"
import ShopByDirectory from "../ShopByDirectory"
import type { DirectoryItem } from "../ShopByDirectory"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  return {
    title:       seo.brands?.title       || "Shop by Brand",
    description: seo.brands?.description || "Browse all firearm brands at the Luxus Collection.",
    alternates: { canonical: '/shop/brands' },
  }
}

export const revalidate = false

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

export default async function BrandsDirectory() {
  const [rawRes, payloadBrandsRes] = await Promise.allSettled([
    getProducts({ limit: "500", fields: "id,*attribute_values,*attribute_values.attribute_type" }),
    getBrands(),
  ])

  const brandNames = new Map<string, string>() // slug → display name
  const countMap: Record<string, number> = {}

  if (rawRes.status === 'fulfilled') {
    for (const p of (rawRes.value.products ?? [])) {
      const mapped = mapMedusaProduct(p)
      for (const brand of mapped.attribute_lists.brand) {
        const slug = toSlug(brand)
        if (!brandNames.has(slug)) brandNames.set(slug, brand)
        countMap[slug] = (countMap[slug] ?? 0) + 1
      }
    }
  }

  const payloadBrands = payloadBrandsRes.status === 'fulfilled' ? payloadBrandsRes.value : []
  const logoMap: Record<string, string> = {}
  for (const b of payloadBrands) {
    if (b.logo) {
      const url = imageUrl(b.logo)
      if (url) logoMap[b.slug] = url
    }
  }

  const items: DirectoryItem[] = [...brandNames.entries()]
    .map(([slug, name]) => ({
      name,
      href: `/brand/${slug}`,
      count: countMap[slug] ?? 0,
      imageUrl: logoMap[slug],
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Shop by Brand — Luxus Collection',
    description: 'Browse all firearm brands at the Luxus Collection.',
    url: `${SITE}/shop/brands`,
    numberOfItems: items.length || undefined,
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Shop by Brand' },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ShopByDirectory type="brand" title="Shop by Brand" items={items} />
    </>
  )
}
