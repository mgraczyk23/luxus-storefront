import type { Metadata } from "next"
import ConsignmentPage from "./ConsignmentPage"

export const metadata: Metadata = {
  title: "Consignment & Private Sales",
  description: "Consign a fine firearm through Luxus Collection or sell outright. Personal response within 3 business days.",
}

export default function Page() {
  return <ConsignmentPage />
}
