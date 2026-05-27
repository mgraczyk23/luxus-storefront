import type { Metadata } from "next"
import { getSiteSettings } from "@/lib/payload"
import SupportPage from "./SupportPage"

export const metadata: Metadata = {
  title: "Customer Support",
  description: "Reach Luxus Collection customer support — order help, FFL transfer guidance, returns, and more. Personal response guaranteed.",
}

export default async function Page() {
  const settings = await getSiteSettings()
  return <SupportPage settings={settings} />
}
