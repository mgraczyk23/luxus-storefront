import type { Metadata } from "next"
import ContactPage from "./ContactPage"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Reach out to the Luxus Collection team — product inquiries, consignment, press, and more. Personal response guaranteed.",
}

export default function Page() {
  return <ContactPage />
}
