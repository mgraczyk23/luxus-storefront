import type { Metadata } from "next"
import FAQPage from "./FAQPage"

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about ordering, FFL transfers, shipping, payments, and consignment at Luxus Collection.",
}

export default function Page() {
  return <FAQPage />
}
