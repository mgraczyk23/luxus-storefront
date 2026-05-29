import type { Metadata } from "next"
import { getSiteSettings } from "@/lib/payload"
import AccountPage from "./AccountPage"

export const metadata: Metadata = {
  title: "My Account",
  description: "View your order history, wishlist, and account details.",
}

export default async function Page() {
  const settings = await getSiteSettings()
  return <AccountPage settings={settings} />
}
