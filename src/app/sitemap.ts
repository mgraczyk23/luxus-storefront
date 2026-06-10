import type { MetadataRoute } from 'next'
import { getProducts, getCategories, getCollections } from '@/lib/api'
import { getBrands, getPosts } from '@/lib/payload'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
const url  = (path: string) => `${SITE}${path}`
const now  = new Date()

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: url('/'),                    changeFrequency: 'weekly',  priority: 1.0, lastModified: now },
  { url: url('/shop'),                changeFrequency: 'daily',   priority: 0.9, lastModified: now },
  { url: url('/shop/brands'),         changeFrequency: 'weekly',  priority: 0.7, lastModified: now },
  { url: url('/shop/categories'),     changeFrequency: 'weekly',  priority: 0.7, lastModified: now },
  { url: url('/shop/collections'),    changeFrequency: 'weekly',  priority: 0.7, lastModified: now },
  { url: url('/about'),               changeFrequency: 'monthly', priority: 0.6, lastModified: now },
  { url: url('/contact'),             changeFrequency: 'monthly', priority: 0.5, lastModified: now },
  { url: url('/faq'),                 changeFrequency: 'monthly', priority: 0.5, lastModified: now },
  { url: url('/support'),             changeFrequency: 'monthly', priority: 0.5, lastModified: now },
  { url: url('/sell-your-gun'),       changeFrequency: 'monthly', priority: 0.5, lastModified: now },
  { url: url('/articles'),            changeFrequency: 'weekly',  priority: 0.7, lastModified: now },
  { url: url('/shipping'),            changeFrequency: 'monthly', priority: 0.3, lastModified: now },
  { url: url('/privacy'),             changeFrequency: 'monthly', priority: 0.3, lastModified: now },
  { url: url('/terms'),               changeFrequency: 'monthly', priority: 0.3, lastModified: now },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productsRes, categoriesRes, collectionsRes, brands, posts] = await Promise.allSettled([
    getProducts({ limit: '500', fields: 'handle,+metadata' }),
    getCategories(),
    getCollections(),
    getBrands(),
    getPosts({ limit: 200 }),
  ])

  // Products — exclude backroom-hidden items
  const productEntries: MetadataRoute.Sitemap =
    productsRes.status === 'fulfilled'
      ? (productsRes.value.products ?? [])
          .filter((p: any) => p.metadata?.backroom_hidden !== 'true')
          .map((p: any) => ({
            url:             url(`/product/${p.handle}`),
            changeFrequency: 'weekly' as const,
            priority:        0.8,
            lastModified:    now,
          }))
      : []

  // Brand pages
  const brandEntries: MetadataRoute.Sitemap =
    brands.status === 'fulfilled'
      ? brands.value
          .filter((b: any) => b.slug)
          .map((b: any) => ({
            url:             url(`/brand/${b.slug}`),
            changeFrequency: 'weekly' as const,
            priority:        0.7,
            lastModified:    now,
          }))
      : []

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
    posts.status === 'fulfilled'
      ? (posts.value.docs ?? [])
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
    ...brandEntries,
    ...categoryEntries,
    ...collectionEntries,
    ...articleEntries,
  ]
}
