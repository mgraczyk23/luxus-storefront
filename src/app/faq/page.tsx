import type { Metadata } from "next"
import { getFaqItems, getSiteSettings, getPageSeo } from "@/lib/payload"
import FAQPage from "./FAQPage"

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  return {
    title:       seo.faq?.title       || "FAQ",
    description: seo.faq?.description || "Frequently asked questions about ordering, FFL transfers, shipping, payments, and consignment at Luxus Collection.",
    alternates: { canonical: '/faq' },
  }
}

export default async function Page() {
  const [categories, settings] = await Promise.all([getFaqItems(), getSiteSettings()])
  return <FAQPage categories={categories} settings={settings} />
}
