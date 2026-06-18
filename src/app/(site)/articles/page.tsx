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
    ...ogMeta(title, description),
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
  return <ArticlesPage posts={posts} />
}
