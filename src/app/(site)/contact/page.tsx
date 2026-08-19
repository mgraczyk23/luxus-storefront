import type { Metadata } from "next"
import { getSiteSettings, getContactPageText, getPageSeo, imageUrl } from "@/lib/payload"
import { ogMeta } from "@/lib/og"
import ContactPage from "./ContactPage"

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  const title = seo.contact?.title || "Contact Us"
  const description = seo.contact?.description || "Reach out to the Luxus Collection team — product inquiries, consignment, press, and more. Personal response guaranteed."
  return {
    title,
    description,
    ...ogMeta(title, description, { url: '/contact' }),
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
  const { hours, address, contact, social, branding } = settings
  const logoUrl = imageUrl(branding.logo)
  const sameAs = [social.facebook, social.instagram, social.twitter, social.youtube, social.linkedin, social.pinterest].filter(Boolean) as string[]

  const openingHoursSpec: Array<Record<string, unknown>> = []
  if (hours.weekdayOpen && hours.weekdayClose) {
    openingHoursSpec.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'https://schema.org/Monday',
        'https://schema.org/Tuesday',
        'https://schema.org/Wednesday',
        'https://schema.org/Thursday',
        'https://schema.org/Friday',
      ],
      opens:  to24h(hours.weekdayOpen),
      closes: to24h(hours.weekdayClose),
    })
  }
  if (hours.saturdayOpen && hours.saturdayClose) {
    openingHoursSpec.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['https://schema.org/Saturday'],
      opens:  to24h(hours.saturdayOpen),
      closes: to24h(hours.saturdayClose),
    })
  }

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
    description: 'A boutique destination for the serious firearms collector. Luxus Collection specializes in rare, collectible, and historically significant firearms — including antiques, engraved pieces, and limited-edition production guns.',
    priceRange: '$$$',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Cash, Credit Card, Wire Transfer',
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
    geo: { '@type': 'GeoCoordinates', latitude: 27.3480838, longitude: -82.5005979 },
    ...(openingHoursSpec.length > 0 ? { openingHoursSpecification: openingHoursSpec } : {}),
    ...(logoUrl ? { logo: { '@type': 'ImageObject', url: logoUrl } } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(settings.fflLicense ? { identifier: { '@type': 'PropertyValue', name: 'FFL License', value: settings.fflLicense } } : {}),
    contactPoint: [
      { '@type': 'ContactPoint', telephone: contact.phone,         contactType: 'sales',            areaServed: 'US', availableLanguage: 'English' },
      { '@type': 'ContactPoint', telephone: contact.phoneTollFree, contactType: 'customer service', areaServed: 'US', availableLanguage: 'English' },
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
