import { getPolicy, getSiteSettings, getPageSeo } from "@/lib/payload"
import PolicyPage from "@/components/PolicyPage"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  return {
    title:       seo.terms?.title       || "Terms & Conditions",
    description: seo.terms?.description || "Luxus Collection terms and conditions: eligibility, payment, FFL transfer requirements, and governing law.",
    alternates: { canonical: '/terms' },
  }
}

export const revalidate = 300

export default async function Page() {
  const [data, settings] = await Promise.all([getPolicy('terms'), getSiteSettings()])
  return <PolicyPage policy="terms" data={data} settings={settings} />
}
