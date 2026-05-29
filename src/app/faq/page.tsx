import type { Metadata } from "next"
import { getFaqItems, getSiteSettings } from "@/lib/payload"
import FAQPage from "./FAQPage"

export const revalidate = 300

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about ordering, FFL transfers, shipping, payments, and consignment at Luxus Collection.",
}

export default async function Page() {
  const [categories, settings] = await Promise.all([getFaqItems(), getSiteSettings()])
  return <FAQPage categories={categories} settings={settings} />
}
