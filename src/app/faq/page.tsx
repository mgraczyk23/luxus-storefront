import type { Metadata } from "next"
import { getFaqItems } from "@/lib/payload"
import FAQPage from "./FAQPage"

export const revalidate = 300

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about ordering, FFL transfers, shipping, payments, and consignment at Luxus Collection.",
}

export default async function Page() {
  const categories = await getFaqItems()
  return <FAQPage categories={categories} />
}
