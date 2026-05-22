import type { Metadata } from "next"
import PolicyPage from "@/components/PolicyPage"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Luxus Collection privacy policy: how we collect, use, and protect your information.",
}

export default function Page() {
  return <PolicyPage policy="privacy" />
}
