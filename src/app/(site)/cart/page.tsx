import type { Metadata } from "next"
import CartPage from "./CartPage"

export const metadata: Metadata = {
  title: "Your Cart | Luxus Collection",
  description: "Review your selected pieces before proceeding to checkout with Luxus Collection.",
  robots: "noindex, nofollow",
}

export default function Page() {
  return <CartPage />
}
