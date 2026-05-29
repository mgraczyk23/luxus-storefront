import { Suspense } from "react"
import type { Metadata } from "next"
import ResetPasswordPage from "./ResetPasswordPage"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Luxus Collection account.",
  robots: "noindex",
}

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  )
}
