import type { Metadata } from "next"
import { getSiteSettings } from "@/lib/payload"
import ContactPage from "./ContactPage"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Reach out to the Luxus Collection team — product inquiries, consignment, press, and more. Personal response guaranteed.",
}

export default async function Page() {
  const settings = await getSiteSettings()
  return <ContactPage settings={settings} />
}
