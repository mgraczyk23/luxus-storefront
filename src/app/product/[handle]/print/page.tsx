import { notFound } from "next/navigation"
import { getProduct } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import PrintPage from "./PrintPage"
import type { Metadata } from "next"

export async function generateMetadata(
  { params }: { params: Promise<{ handle: string }> }
): Promise<Metadata> {
  const { handle } = await params
  try {
    const res = await getProduct(handle)
    const p = res.products?.[0]
    if (!p) return {}
    return { title: `Print — ${mapMedusaProduct(p).title}`, robots: "noindex" }
  } catch { return {} }
}

export default async function ProductPrintPage(
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  const res = await getProduct(handle).catch(() => null)
  const raw = res?.products?.[0]
  if (!raw) notFound()
  const product = mapMedusaProduct(raw)
  return <PrintPage product={product} />
}
