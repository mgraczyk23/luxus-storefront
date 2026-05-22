import type { Metadata } from "next"
import CartPage from "./CartPage"

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review your selected pieces before proceeding to checkout.",
}

export default function Page() {
  return <CartPage />
}
