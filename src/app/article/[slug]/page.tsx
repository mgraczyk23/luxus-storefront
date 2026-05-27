import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPosts, getPost, getComments } from "@/lib/payload"
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
  const post = await getPost(slug)
  if (!post) return {}
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [post, allPosts] = await Promise.all([
    getPost(slug),
    getPosts({ limit: 100, noContent: true }).catch(() => ({ docs: [] })),
  ])
  if (!post) notFound()
  const related = allPosts.docs
    .filter((p) => p.slug !== slug && p.status === "published")
    .slice(0, 3)
  const comments = await getComments(post.id).catch(() => [])
  return <ArticlePage post={post} related={related} comments={comments} />
}
