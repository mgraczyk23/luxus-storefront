import type { MetadataRoute } from 'next'
import { getProducts, getCategories, getCollections } from '@/lib/api'
import { getBrands, getPosts, getAllResourcePagesForSearch } from '@/lib/payload'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
const url  = (path: string) => `${SITE}${path}`
const now  = new Date()

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

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: url('/'),                          changeFrequency: 'weekly',  priority: 1.0, lastModified: now },
  { url: url('/shop'),                      changeFrequency: 'daily',   priority: 0.9, lastModified: now },
  { url: url('/shop/brands'),               changeFrequency: 'weekly',  priority: 0.7, lastModified: now },
  { url: url('/shop/models'),               changeFrequency: 'weekly',  priority: 0.7, lastModified: now },
  { url: url('/shop/categories'),           changeFrequency: 'weekly',  priority: 0.7, lastModified: now },
  { url: url('/shop/collections'),          changeFrequency: 'weekly',  priority: 0.7, lastModified: now },
  { url: url('/shop/modern-firearms'),      changeFrequency: 'weekly',  priority: 0.7, lastModified: now },
  { url: url('/shop/collectible-firearms'), changeFrequency: 'weekly',  priority: 0.7, lastModified: now },
  { url: url('/resources-on-guns'),         changeFrequency: 'weekly',  priority: 0.6, lastModified: now },
  { url: url('/about'),                     changeFrequency: 'monthly', priority: 0.6, lastModified: now },
  { url: url('/contact'),                   changeFrequency: 'monthly', priority: 0.5, lastModified: now },
  { url: url('/faq'),                       changeFrequency: 'monthly', priority: 0.5, lastModified: now },
  { url: url('/support'),                   changeFrequency: 'monthly', priority: 0.5, lastModified: now },
  { url: url('/sell-your-gun'),             changeFrequency: 'monthly', priority: 0.5, lastModified: now },
  { url: url('/articles'),                  changeFrequency: 'weekly',  priority: 0.7, lastModified: now },
  { url: url('/shipping'),                  changeFrequency: 'monthly', priority: 0.3, lastModified: now },
  { url: url('/privacy'),                   changeFrequency: 'monthly', priority: 0.3, lastModified: now },
  { url: url('/terms'),                     changeFrequency: 'monthly', priority: 0.3, lastModified: now },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productsRes, categoriesRes, collectionsRes, brandsRes, postsRes, resourcesRes] =
    await Promise.allSettled([
      getProducts({ limit: '500', fields: 'handle,+metadata,+attribute_values,*attribute_values.attribute_type' }),
      getCategories(),
      getCollections(),
      getBrands(),
      getPosts({ limit: 200 }),
      getAllResourcePagesForSearch(),
    ])

  const allProducts = productsRes.status === 'fulfilled' ? (productsRes.value.products ?? []) : []

  // Exclude all private room / backroom items from every public section
  const publicProducts = allProducts.filter(
    (p: any) => p.metadata?.master_backroom !== 'true' && p.metadata?.backroom_hidden !== 'true',
  )

  // Products
  const productEntries: MetadataRoute.Sitemap = publicProducts.map((p: any) => ({
    url:             url(`/product/${p.handle}`),
    changeFrequency: 'weekly' as const,
    priority:        0.8,
    lastModified:    now,
  }))

  // Model pages — extract unique model slugs from attribute_values (with metadata fallback)
  const modelSlugs = new Set<string>()
  for (const p of publicProducts) {
    const attrVals: any[] = p.attribute_values ?? []
    const fromAttrs = attrVals
      .filter((v: any) => v.attribute_type?.slug === 'model' && v.value)
      .map((v: any) => String(v.value).trim())
    if (fromAttrs.length > 0) {
      fromAttrs.forEach(m => modelSlugs.add(toSlug(m)))
    } else if (p.metadata?.model) {
      // legacy metadata fallback
      const raw = p.metadata.model
      const names: string[] = (() => {
        if (raw.startsWith('[')) {
          try { return JSON.parse(raw) } catch { /* ignore */ }
        }
        if (raw.includes(',')) return raw.split(',').map((s: string) => s.trim())
        return [raw]
      })()
      names.filter(Boolean).forEach((m: string) => modelSlugs.add(toSlug(m)))
    }
  }
  const modelEntries: MetadataRoute.Sitemap = [...modelSlugs].map(slug => ({
    url:             url(`/shop/model/${slug}`),
    changeFrequency: 'weekly' as const,
    priority:        0.7,
    lastModified:    now,
  }))

  // Brand pages
  const brands = brandsRes.status === 'fulfilled' ? brandsRes.value : []
  const brandEntries: MetadataRoute.Sitemap = brands
    .filter((b: any) => b.slug)
    .map((b: any) => ({
      url:             url(`/brand/${b.slug}`),
      changeFrequency: 'weekly' as const,
      priority:        0.7,
      lastModified:    now,
    }))

  // Resources-on-guns brand hub pages (brands with hub content)
  const hubBrandEntries: MetadataRoute.Sitemap = brands
    .filter((b: any) => b.slug && b.showInHub)
    .map((b: any) => ({
      url:             url(`/resources-on-guns/${b.slug}`),
      changeFrequency: 'monthly' as const,
      priority:        0.6,
      lastModified:    now,
    }))

  // Resources-on-guns individual article pages
  const resources = resourcesRes.status === 'fulfilled' ? resourcesRes.value : []
  const resourceArticleEntries: MetadataRoute.Sitemap = resources
    .filter((r: any) => r.slug && r.brandSlug)
    .map((r: any) => ({
      url:             url(`/resources-on-guns/${r.brandSlug}/${r.slug}`),
      changeFrequency: 'monthly' as const,
      priority:        0.6,
      lastModified:    now,
    }))

  // Category pages
  const categoryEntries: MetadataRoute.Sitemap =
    categoriesRes.status === 'fulfilled'
      ? (categoriesRes.value.product_categories ?? [])
          .filter((c: any) => c.handle)
          .map((c: any) => ({
            url:             url(`/category/${c.handle}`),
            changeFrequency: 'weekly' as const,
            priority:        0.6,
            lastModified:    now,
          }))
      : []

  // Collection pages
  const collectionEntries: MetadataRoute.Sitemap =
    collectionsRes.status === 'fulfilled'
      ? (collectionsRes.value.collections ?? [])
          .filter((c: any) => c.handle)
          .map((c: any) => ({
            url:             url(`/collection/${c.handle}`),
            changeFrequency: 'weekly' as const,
            priority:        0.6,
            lastModified:    now,
          }))
      : []

  // Article pages
  const articleEntries: MetadataRoute.Sitemap =
    postsRes.status === 'fulfilled'
      ? (postsRes.value.docs ?? [])
          .filter((p: any) => p.slug)
          .map((p: any) => ({
            url:             url(`/article/${p.slug}`),
            changeFrequency: 'monthly' as const,
            priority:        0.7,
            lastModified:    p.updatedAt ? new Date(p.updatedAt) : now,
          }))
      : []

  return [
    ...STATIC_PAGES,
    ...productEntries,
    ...modelEntries,
    ...brandEntries,
    ...hubBrandEntries,
    ...resourceArticleEntries,
    ...categoryEntries,
    ...collectionEntries,
    ...articleEntries,
  ]
}
