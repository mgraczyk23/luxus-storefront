import type { MetadataRoute } from 'next'
import { getProducts, getCategories, getCollections } from '@/lib/api'
import { getBrands, getPosts, getAllResourcePagesForSearch } from '@/lib/payload'
import { toSlug } from '@/lib/slug'

// On-demand revalidation (revalidatePath("/sitemap.xml") in api/revalidate,
// fired by Medusa/Payload webhooks) has been confirmed NOT to reliably
// trigger regeneration of this specific route in production — verified by
// manually re-firing the webhook and watching the served response's `age`
// header climb indefinitely with no regeneration for 30+ seconds afterward,
// even though the sitemap's own generation logic is correct (a fresh local
// build against the same live data includes the missing products). Rather
// than keep depending on that cross-service chain for freshness, this route
// now self-heals on a short timer that matches the underlying products
// fetch's own 5-minute window (storeFetch in lib/api.ts) — worst case
// staleness is ~5 minutes regardless of whether any on-demand trigger fired.
export const revalidate = 300

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
const url  = (path: string) => `${SITE}${path}`
const now  = new Date()

// Medusa caps /store/products at 500 per request — the catalog has already
// passed that (501+ and growing), so a single fetch silently drops products.
// Page through with offset until every product has been fetched.
async function getAllProducts(): Promise<any[]> {
  const pageSize = 500
  // Must use `*attribute_values` (wildcard expand) not `+attribute_values`
  // (add-field) — the latter omits the nested `value` field entirely, which
  // silently breaks model-slug extraction below.
  const fields = 'handle,updated_at,+metadata,*attribute_values,*attribute_values.attribute_type'
  const first = await getProducts({ limit: String(pageSize), offset: '0', fields })
  const all = [...(first.products ?? [])]
  const total = first.count ?? all.length
  for (let offset = pageSize; offset < total; offset += pageSize) {
    const page = await getProducts({ limit: String(pageSize), offset: String(offset), fields })
    all.push(...(page.products ?? []))
  }
  return all
}

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: url('/'),                          changeFrequency: 'weekly',  priority: 1.0, lastModified: now },
  { url: url('/shop'),                      changeFrequency: 'daily',   priority: 0.9, lastModified: now },
  { url: url('/shop/brands'),               changeFrequency: 'weekly',  priority: 0.7, lastModified: now },
  { url: url('/shop/models'),               changeFrequency: 'weekly',  priority: 0.7, lastModified: now },
  { url: url('/shop/categories'),           changeFrequency: 'weekly',  priority: 0.7, lastModified: now },
  { url: url('/shop/collections'),          changeFrequency: 'weekly',  priority: 0.7, lastModified: now },
  { url: url('/shop/modern-firearms'),      changeFrequency: 'weekly',  priority: 0.7, lastModified: now },
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
      getAllProducts(),
      getCategories(),
      getCollections(),
      getBrands(),
      getPosts({ limit: 200 }),
      getAllResourcePagesForSearch(),
    ])

  const allProducts = productsRes.status === 'fulfilled' ? (productsRes.value ?? []) : []

  // Exclude all private room / backroom items from every public section
  const publicProducts = allProducts.filter(
    (p: any) => p.metadata?.master_backroom !== 'true' && p.metadata?.backroom_hidden !== 'true',
  )

  // Products
  const productEntries: MetadataRoute.Sitemap = publicProducts.map((p: any) => ({
    url:             url(`/product/${p.handle}`),
    changeFrequency: 'weekly' as const,
    priority:        0.8,
    lastModified:    p.updated_at ? new Date(p.updated_at) : now,
  }))

  // Model pages — extract unique model slugs from attribute_values (with metadata fallback)
  const modelSlugs = new Set<string>()
  for (const p of publicProducts) {
    const attrVals: any[] = Array.isArray(p.attribute_values) ? p.attribute_values : []
    const fromAttrs = attrVals
      .filter((v: any) => v?.attribute_type?.slug === 'model' && v.value != null)
      .map((v: any) => String(v.value).trim())
      .filter(Boolean)
    if (fromAttrs.length > 0) {
      fromAttrs.forEach(m => modelSlugs.add(toSlug(m)))
    } else {
      // legacy metadata fallback — metadata.model may already be a native
      // array (current API shape), a JSON-stringified array, or a plain/CSV string
      const raw = p.metadata?.model
      if (raw == null || raw === '') continue
      let names: string[]
      if (Array.isArray(raw)) {
        names = raw.map(String)
      } else if (typeof raw !== 'string') {
        continue
      } else if (raw.startsWith('[')) {
        try {
          const parsed = JSON.parse(raw)
          names = Array.isArray(parsed) ? parsed.map(String) : [raw]
        } catch { names = [raw] }
      } else if (raw.includes(',')) {
        names = raw.split(',').map((s: string) => s.trim()).filter(Boolean)
      } else {
        names = [raw]
      }
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
