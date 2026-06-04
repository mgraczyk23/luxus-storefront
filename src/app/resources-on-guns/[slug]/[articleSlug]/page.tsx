import { getBrand, getResourcePage, getResourcePages } from "@/lib/payload"
import ResourceArticlePage from "./ResourceArticlePage"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; articleSlug: string }>
}): Promise<Metadata> {
  const { articleSlug } = await params
  const page = await getResourcePage(articleSlug).catch(() => null)
  if (!page) return {}
  const brandName = typeof page.brand === 'object' ? page.brand.name : ''
  return {
    title: page.seoTitle ?? `${page.title} | ${brandName} | Resources on Guns | Luxus Collection`,
    description: page.seoDescription ?? page.excerpt ?? undefined,
  }
}

export const revalidate = false

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; articleSlug: string }>
}) {
  const { slug, articleSlug } = await params

  const [page, brand] = await Promise.all([
    getResourcePage(articleSlug).catch(() => null),
    getBrand(slug).catch(() => null),
  ])

  if (!page) notFound()

  // Sidebar: other pages for this brand
  const relatedPages = brand
    ? await getResourcePages(brand.id).catch(() => [])
    : []

  const siblings = relatedPages.filter(p => p.slug !== page.slug)

  return (
    <ResourceArticlePage
      page={page}
      brand={brand}
      siblings={siblings}
      brandSlug={slug}
    />
  )
}
