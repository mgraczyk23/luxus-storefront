import type { Metadata } from "next"
import { getConsignmentPageText, getSiteSettings, getPageSeo } from "@/lib/payload"
import ConsignmentPage from "./ConsignmentPage"

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  return {
    title:       seo.consignment?.title       || "Consignment & Private Sales",
    description: seo.consignment?.description || "Consign a fine firearm through Luxus Collection or sell outright. Personal response within 3 business days.",
  }
}

export default async function Page() {
  const [text, settings] = await Promise.all([
    getConsignmentPageText(),
    getSiteSettings(),
  ])
  return <ConsignmentPage text={text} settings={settings} />
}
