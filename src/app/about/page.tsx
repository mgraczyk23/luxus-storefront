import type { Metadata } from "next"
import { getAboutPageImages, getAboutPageText, getBrands, getSiteSettings, getPageSeo } from "@/lib/payload"
import AboutPage from "./AboutPage"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  return {
    title:       seo.about?.title       || "About Us",
    description: seo.about?.description || "Luxus Collection — a boutique destination for the serious collector. Our story, philosophy, and the standard behind every piece we carry.",
    alternates: { canonical: '/about' },
  }
}

export default async function Page() {
  const [images, text, brands, settings] = await Promise.all([
    getAboutPageImages(),
    getAboutPageText(),
    getBrands({ featuredOnly: true }),
    getSiteSettings(),
  ])

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
  const name = settings.branding.legalName || 'Luxus Collection'

  const aboutPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About ${name}`,
    description: text.heroDescription || `${name} — a boutique destination for the serious collector. Our story, philosophy, and the standard behind every piece we carry.`,
    url: `${SITE}/about`,
    mainEntity: {
      '@type': 'Organization',
      name,
      legalName: name,
      url: SITE,
      telephone: settings.contact.phone,
      email: settings.contact.emailInfo,
      address: {
        '@type': 'PostalAddress',
        streetAddress:   settings.address.line1,
        addressLocality: settings.address.city,
        addressRegion:   settings.address.state,
        postalCode:      settings.address.zip,
        addressCountry:  'US',
      },
      ...(settings.fflLicense ? { identifier: { '@type': 'PropertyValue', name: 'FFL License', value: settings.fflLicense } } : {}),
      description: text.missionBody1 || text.heroDescription || undefined,
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageJsonLd) }} />
      <AboutPage images={images} text={text} brands={brands} settings={settings} />
    </>
  )
}
