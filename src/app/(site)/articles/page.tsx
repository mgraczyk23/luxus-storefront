import type { Metadata } from "next"
import { getPosts, getPageSeo } from "@/lib/payload"
import { ogMeta } from "@/lib/og"
import ArticlesPage from "./ArticlesPage"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  const title = seo.articles?.title || "Articles"
  const description = seo.articles?.description || "Long-form writing on the craft, history, and culture of fine firearms — for the collector who wants to understand what they own."
  return {
    title,
    description,
    ...ogMeta(title, description, { url: '/articles' }),
    alternates: { canonical: '/articles' },
  }
}

export default async function Page() {
  let posts = null
  try {
    const result = await getPosts({ limit: 200, noContent: true })
    posts = result.docs
  } catch {
    // CMS unavailable — client component shows fallback
  }
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Luxus Collection — Articles',
    description: 'Long-form writing on the craft, history, and culture of fine firearms.',
    url: `${SITE}/articles`,
    inLanguage: 'en-US',
    publisher: { '@type': 'Organization', name: 'Luxus Collection', url: SITE },
    ...(posts && posts.length > 0 ? {
      blogPost: posts.slice(0, 20).map((p: any) => ({
        '@type': 'BlogPosting',
        headline: p.title,
        url: `${SITE}/article/${p.slug}`,
        ...(p.publishedAt ? { datePublished: p.publishedAt } : {}),
        ...(p.excerpt ? { description: p.excerpt } : {}),
      })),
    } : {}),
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <ArticlesPage posts={posts} />
    </>
  )
}
