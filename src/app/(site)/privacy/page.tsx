import { getPolicy, getSiteSettings, getPageSeo } from "@/lib/payload"
import { ogMeta } from "@/lib/og"
import PolicyPage from "@/components/PolicyPage"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  const title = seo.privacy?.title || "Privacy Policy"
  const description = seo.privacy?.description || "Luxus Collection privacy policy: how we collect, use, and protect your information."
  return {
    title,
    description,
    ...ogMeta(title, description, { url: '/privacy' }),
    alternates: { canonical: '/privacy' },
  }
}

export const revalidate = 300

export default async function Page() {
  const [data, settings] = await Promise.all([getPolicy('privacy'), getSiteSettings()])
  return <PolicyPage policy="privacy" data={data} settings={settings} />
}
