import type { Metadata } from "next"
import { getPosts, getPageSeo } from "@/lib/payload"
import ArticlesPage from "./ArticlesPage"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  return {
    title:       seo.articles?.title       || "Articles",
    description: seo.articles?.description || "Long-form writing on the craft, history, and culture of fine firearms — for the collector who wants to understand what they own.",
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
