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

export default async function Page() {
  const [settings, text] = await Promise.all([getSiteSettings(), getContactPageText()])
  return <ContactPage settings={settings} text={text} />
}
