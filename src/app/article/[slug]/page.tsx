import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPosts, getPost } from "@/lib/payload"
import ArticlePage from "./ArticlePage"

export async function generateStaticParams() {
  try {
    const result = await getPosts({ limit: 100 })
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
  const post = await getPost(slug)
  if (!post) notFound()
  return <ArticlePage post={post} />
}
