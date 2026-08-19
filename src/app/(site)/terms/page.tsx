import { getPolicy, getSiteSettings, getPageSeo } from "@/lib/payload"
import { ogMeta } from "@/lib/og"
import PolicyPage from "@/components/PolicyPage"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  const title = seo.terms?.title || "Terms & Conditions"
  const description = seo.terms?.description || "Luxus Collection terms and conditions: eligibility, payment, FFL transfer requirements, and governing law."
  return {
    title,
    description,
    ...ogMeta(title, description, { url: '/terms' }),
    alternates: { canonical: '/terms' },
  }
}

export const revalidate = 300

export default async function Page() {
  const [data, settings] = await Promise.all([getPolicy('terms'), getSiteSettings()])
  return <PolicyPage policy="terms" data={data} settings={settings} />
}
