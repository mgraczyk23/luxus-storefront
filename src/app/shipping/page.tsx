import { getPolicy } from "@/lib/payload"
import PolicyPage from "@/components/PolicyPage"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "Luxus Collection shipping policy: FFL transfer process, shipping rates, return policy, and how to initiate a return.",
}

export const revalidate = 300

export default async function Page() {
  const data = await getPolicy('shipping')
  return <PolicyPage policy="shipping" data={data} />
}
