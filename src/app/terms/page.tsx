import { getPolicy, getSiteSettings } from "@/lib/payload"
import PolicyPage from "@/components/PolicyPage"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Luxus Collection terms and conditions: eligibility, payment, FFL transfer requirements, and governing law.",
}

export const revalidate = 300

export default async function Page() {
  const [data, settings] = await Promise.all([getPolicy('terms'), getSiteSettings()])
  return <PolicyPage policy="terms" data={data} settings={settings} />
}
