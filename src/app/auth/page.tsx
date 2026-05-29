import { Suspense } from "react"
import type { Metadata } from "next"
import AuthPage from "./AuthPage"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in or create your Luxus Collection account.",
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
