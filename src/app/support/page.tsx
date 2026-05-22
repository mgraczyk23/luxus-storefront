import type { Metadata } from "next"
import SupportPage from "./SupportPage"

export const metadata: Metadata = {
  title: "Customer Support",
  description: "Reach Luxus Collection customer support — order help, FFL transfer guidance, returns, and more. Personal response guaranteed.",
}

export default function Page() {
  return <SupportPage />
}
