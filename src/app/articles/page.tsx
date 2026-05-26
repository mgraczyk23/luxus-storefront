import type { Metadata } from "next"
import { getPosts } from "@/lib/payload"
import ArticlesPage from "./ArticlesPage"

export const metadata: Metadata = {
  title: "Articles",
  description: "Long-form writing on the craft, history, and culture of fine firearms — for the collector who wants to understand what they own.",
}

export default async function Page() {
  let posts = null
  try {
    const result = await getPosts({ limit: 100 })
    posts = result.docs
  } catch {
    // CMS unavailable — client component shows fallback
  }
  return <ArticlesPage posts={posts} />
}
