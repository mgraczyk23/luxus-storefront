import type { Metadata } from "next"
import AccountPage from "./AccountPage"

export const metadata: Metadata = {
  title: "My Account",
  description: "View your order history, wishlist, and account details.",
}

export default function Page() {
  return <AccountPage />
}
