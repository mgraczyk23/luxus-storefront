import type { Metadata } from "next"
import { getSiteSettings } from "@/lib/payload"
import AccountPage from "./AccountPage"

export const metadata: Metadata = {
  title: "My Account | Luxus Collection",
  description: "View your order history, saved items, and account details for your Luxus Collection account.",
  robots: "noindex, nofollow",
}

export default async function Page() {
  const settings = await getSiteSettings()
  return <AccountPage settings={settings} />
}
