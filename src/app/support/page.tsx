import type { Metadata } from "next"
import { getSiteSettings, getSupportPageText, getPageSeo } from "@/lib/payload"
import SupportPage from "./SupportPage"

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  return {
    title:       seo.support?.title       || "Customer Support",
    description: seo.support?.description || "Reach Luxus Collection customer support — order help, FFL transfer guidance, returns, and more. Personal response guaranteed.",
    alternates: { canonical: '/support' },
  }
}

export default async function Page() {
  const [settings, text] = await Promise.all([getSiteSettings(), getSupportPageText()])

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
  const name = settings.branding.legalName || 'Luxus Collection'

  const supportPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Customer Support — ${name}`,
    description: 'Order help, FFL transfer guidance, shipping questions, and returns.',
    url: `${SITE}/support`,
    mainEntity: {
      '@type': 'Organization',
      name,
      url: SITE,
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone:         settings.contact.phone,
          email:             settings.contact.emailSupport,
          contactType:       'customer support',
          areaServed:        'US',
          availableLanguage: 'English',
        },
      ].filter(cp => cp.telephone || cp.email),
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(supportPageJsonLd) }} />
      <SupportPage settings={settings} text={text} />
    </>
  )
}
