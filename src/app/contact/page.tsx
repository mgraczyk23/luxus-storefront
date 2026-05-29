import type { Metadata } from "next"
import { getSiteSettings, getContactPageText } from "@/lib/payload"
import ContactPage from "./ContactPage"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Reach out to the Luxus Collection team — product inquiries, consignment, press, and more. Personal response guaranteed.",
}

export default async function Page() {
  const [settings, text] = await Promise.all([getSiteSettings(), getContactPageText()])
  return <ContactPage settings={settings} text={text} />
}
