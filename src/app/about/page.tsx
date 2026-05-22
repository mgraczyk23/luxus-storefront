import type { Metadata } from "next"
import AboutPage from "./AboutPage"

export const metadata: Metadata = {
  title: "About Us",
  description: "Luxus Collection — a boutique destination for the serious collector. Our story, philosophy, and the standard behind every piece we carry.",
}

export default function Page() {
  return <AboutPage />
}
