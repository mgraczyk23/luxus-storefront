import type { Metadata } from "next"
import { getConsignmentPageText, getSiteSettings, getPageSeo } from "@/lib/payload"
import { ogMeta } from "@/lib/og"
import ConsignmentPage from "./ConsignmentPage"

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  const title = seo.consignment?.title || "Consignment & Private Sales"
  const description = seo.consignment?.description || "Consign a fine firearm through Luxus Collection or sell outright. Personal response within 3 business days."
  return {
    title,
    description,
    ...ogMeta(title, description),
    alternates: { canonical: '/sell-your-gun' },
  }
}

export default async function Page() {
  const [text, settings] = await Promise.all([
    getConsignmentPageText(),
    getSiteSettings(),
  ])
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Firearm Consignment & Private Sales',
    serviceType: 'Firearm Consignment',
    description: 'Consign a fine firearm through Luxus Collection or sell outright. Personal response within 3 business days.',
    url: `${SITE}/sell-your-gun`,
    areaServed: { '@type': 'Country', name: 'United States' },
    provider: {
      '@type': 'Organization',
      name: settings?.branding?.legalName || 'Luxus Collection',
      url: SITE,
    },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <ConsignmentPage text={text} settings={settings} />
    </>
  )
}
