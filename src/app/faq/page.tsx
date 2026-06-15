import type { Metadata } from "next"
import { getFaqItems, getSiteSettings, getPageSeo } from "@/lib/payload"
import { ogMeta } from "@/lib/og"
import FAQPage from "./FAQPage"

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  const title = seo.faq?.title || "FAQ"
  const description = seo.faq?.description || "Frequently asked questions about ordering, FFL transfers, shipping, payments, and consignment at Luxus Collection."
  return {
    title,
    description,
    ...ogMeta(title, description),
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
