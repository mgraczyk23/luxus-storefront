import type { Metadata } from "next"
import PolicyPage from "@/components/PolicyPage"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Luxus Collection terms and conditions: eligibility, payment, FFL transfer requirements, and governing law.",
}

export default function Page() {
  return <PolicyPage policy="terms" />
}
