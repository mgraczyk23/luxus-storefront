import type { Metadata } from "next"
import { getSiteSettings, getSupportPageText, getPageSeo } from "@/lib/payload"
import SupportPage from "./SupportPage"

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  return {
    title:       seo.support?.title       || "Customer Support",
    description: seo.support?.description || "Reach Luxus Collection customer support — order help, FFL transfer guidance, returns, and more. Personal response guaranteed.",
  }
}

export default async function Page() {
  const [settings, text] = await Promise.all([getSiteSettings(), getSupportPageText()])
  return <SupportPage settings={settings} text={text} />
}
