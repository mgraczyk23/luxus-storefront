import type { Metadata } from "next"
import PolicyPage from "@/components/PolicyPage"

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "Luxus Collection shipping policy: FFL transfer process, shipping rates, return policy, and how to initiate a return.",
}

export default function Page() {
  return <PolicyPage policy="shipping" />
}
