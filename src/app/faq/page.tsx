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

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: categories.flatMap(cat =>
      cat.items.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      }))
    ),
    url: `${SITE}/faq`,
    publisher: {
      '@type': 'Organization',
      name: settings.branding.legalName || 'Luxus Collection',
      url: SITE,
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <FAQPage categories={categories} settings={settings} />
    </>
  )
}
