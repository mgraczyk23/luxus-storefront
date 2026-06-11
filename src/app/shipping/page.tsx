import { getPolicy, getSiteSettings, getPageSeo } from "@/lib/payload"
import PolicyPage from "@/components/PolicyPage"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo()
  return {
    title:       seo.shipping?.title       || "Shipping & Returns",
    description: seo.shipping?.description || "Luxus Collection shipping policy: FFL transfer process, shipping rates, return policy, and how to initiate a return.",
  }
}

export const revalidate = 300

export default async function Page() {
  const [data, settings] = await Promise.all([getPolicy('shipping'), getSiteSettings()])
  return <PolicyPage policy="shipping" data={data} settings={settings} />
}
