import { Suspense } from "react"
import type { Metadata } from "next"
import AuthPage from "./AuthPage"

export const metadata: Metadata = {
  title: "Sign In | Luxus Collection",
  description: "Sign in to your Luxus Collection account or create one to track orders and save your favorite pieces.",
  robots: "noindex, nofollow",
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  return (
    <Suspense>
      <AuthPage defaultTab={tab === "register" ? "register" : "signin"} />
    </Suspense>
  )
}
