import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { getPosts, getPost, getComments, getSiteSettings, parseLexical, imageUrl } from "@/lib/payload"
import { ogMeta } from "@/lib/og"
import { getLinkDictionary, injectLinks } from "@/lib/link-engine"
import { toSlug } from "@/lib/slug"
import ArticlePage from "./ArticlePage"

export async function generateStaticParams() {
  try {
    const result = await getPosts({ limit: 500, noContent: true })
    return result.docs.map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const normalized = toSlug(slug)
  const post = await getPost(normalized)
  if (!post) return {}
  const title = post.seoTitle ?? post.title
  const description = post.seoDescription ?? post.excerpt ?? undefined
  return {
    title,
    description,
    ...ogMeta(title, description, {
      image: imageUrl(post.featuredImage),
      type: 'article',
      url: `/article/${normalized}`,
    }),
    alternates: { canonical: `/article/${normalized}` },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const normalized = toSlug(slug)
  if (normalized !== slug) permanentRedirect(`/article/${normalized}`)

  const [post, allPosts, settings, dictionary] = await Promise.all([
    getPost(normalized),
    getPosts({ limit: 100, noContent: true }).catch(() => ({ docs: [] })),
    getSiteSettings(),
    getLinkDictionary().catch(() => []),
  ])
  if (!post) notFound()
  const related = allPosts.docs
    .filter((p) => p.slug !== normalized && p.status === "published")
    .slice(0, 3)
  const comments = await getComments(post.id).catch(() => [])

  const body = injectLinks(parseLexical(post.content), dictionary, `/article/${normalized}`)

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
  const orgLogoUrl = imageUrl(settings.branding.logo)
  const postImageUrl = imageUrl(post.featuredImage)

  const blogPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || undefined,
    image: postImageUrl || undefined,
    datePublished: post.publishedAt || undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dateModified: (post as any).updatedAt || post.publishedAt || undefined,
    url: `${SITE}/article/${post.slug}`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/article/${post.slug}` },
    inLanguage: 'en-US',
    author: { '@type': 'Person', name: post.author?.name || 'Luxus Collection' },
    publisher: {
      '@type': 'Organization',
      name: settings.branding.legalName || 'Luxus Collection',
      ...(orgLogoUrl ? { logo: { '@type': 'ImageObject', url: orgLogoUrl } } : {}),
    },
    ...(post.category ? { articleSection: post.category } : {}),
    ...(post.tags?.length ? { keywords: post.tags.map((t) => t.tag).join(', ') } : {}),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }} />
      <ArticlePage post={post} related={related} comments={comments} body={body} />
    </>
  )
}
