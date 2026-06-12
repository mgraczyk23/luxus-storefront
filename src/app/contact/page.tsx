import type { Metadata } from "next"
import { getSiteSettings, getContactPageText, getPageSeo } from "@/lib/payload"
import ContactPage from "./ContactPage"

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  return {
    title:       seo.contact?.title       || "Contact Us",
    description: seo.contact?.description || "Reach out to the Luxus Collection team — product inquiries, consignment, press, and more. Personal response guaranteed.",
    alternates: { canonical: '/contact' },
  }
}

function to24h(t: string): string {
  const m = t.trim().match(/^(\d+):(\d{2})\s*(AM|PM)$/i)
  if (!m) return t
  let h = parseInt(m[1])
  const min = m[2], ampm = m[3].toUpperCase()
  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${min}`
}

export default async function Page() {
  const [settings, text] = await Promise.all([getSiteSettings(), getContactPageText()])

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'
  const name = settings.branding.legalName || 'Luxus Collection'
  const { hours, address, contact } = settings

  const openingHours: string[] = []
  if (hours.weekdayOpen && hours.weekdayClose)
    openingHours.push(`Mo-Fr ${to24h(hours.weekdayOpen)}-${to24h(hours.weekdayClose)}`)
  if (hours.saturdayOpen && hours.saturdayClose)
    openingHours.push(`Sa ${to24h(hours.saturdayOpen)}-${to24h(hours.saturdayClose)}`)

  const contactPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${name}`,
    url: `${SITE}/contact`,
  }

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    url: SITE,
    telephone: contact.phone,
    email: contact.emailInfo,
    address: {
      '@type': 'PostalAddress',
      streetAddress:   address.line1,
      addressLocality: address.city,
      addressRegion:   address.state,
      postalCode:      address.zip,
      addressCountry:  'US',
    },
    ...(openingHours.length > 0 ? { openingHours } : {}),
    ...(settings.fflLicense ? { identifier: { '@type': 'PropertyValue', name: 'FFL License', value: settings.fflLicense } } : {}),
    contactPoint: [
      { '@type': 'ContactPoint', telephone: contact.phone,         contactType: 'sales',            areaServed: 'US', availableLanguage: 'English' },
      { '@type': 'ContactPoint', email:     contact.emailInfo,     contactType: 'customer service', areaServed: 'US', availableLanguage: 'English' },
      { '@type': 'ContactPoint', email:     contact.emailSales,    contactType: 'sales',            areaServed: 'US', availableLanguage: 'English' },
      { '@type': 'ContactPoint', email:     contact.emailSupport,  contactType: 'customer support', areaServed: 'US', availableLanguage: 'English' },
    ].filter(cp => cp.telephone || cp.email),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }} />
      <ContactPage settings={settings} text={text} />
    </>
  )
}
