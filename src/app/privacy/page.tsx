import { getPolicy } from "@/lib/payload"
import PolicyPage from "@/components/PolicyPage"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Luxus Collection privacy policy: how we collect, use, and protect your information.",
}

export const revalidate = 300

export default async function Page() {
  const data = await getPolicy('privacy')
  return <PolicyPage policy="privacy" data={data} />
}
