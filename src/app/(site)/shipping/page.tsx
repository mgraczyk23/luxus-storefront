import { getPolicy, getSiteSettings, getPageSeo } from "@/lib/payload"
import { ogMeta } from "@/lib/og"
import PolicyPage from "@/components/PolicyPage"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  const title = seo.shipping?.title || "Shipping & Returns"
  const description = seo.shipping?.description || "Luxus Collection shipping policy: FFL transfer process, shipping rates, return policy, and how to initiate a return."
  return {
    title,
    description,
    ...ogMeta(title, description, { url: '/shipping' }),
    alternates: { canonical: '/shipping' },
  }
}

export const revalidate = 300

export default async function Page() {
  const [data, settings] = await Promise.all([getPolicy('shipping'), getSiteSettings()])
  return <PolicyPage policy="shipping" data={data} settings={settings} />
}
