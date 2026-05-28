import type { Metadata } from "next"
import { getConsignmentPageText, getSiteSettings } from "@/lib/payload"
import ConsignmentPage from "./ConsignmentPage"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Consignment & Private Sales",
  description: "Consign a fine firearm through Luxus Collection or sell outright. Personal response within 3 business days.",
}

export default async function Page() {
  const [text, settings] = await Promise.all([
    getConsignmentPageText(),
    getSiteSettings(),
  ])
  return <ConsignmentPage text={text} settings={settings} />
}
