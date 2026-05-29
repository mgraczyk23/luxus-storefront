import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "https://api.luxus-collection.com"
const PK      = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

  const res = await fetch(`${BACKEND}/auth/customer/emailpass/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
    body: JSON.stringify({ identifier: email }),
  })

  // Medusa returns 201 on success, 404 if email not found — either way we say "if the email exists..."
  // so we don't leak whether an account exists
  if (res.status !== 201 && res.status !== 200 && res.status !== 404) {
    return NextResponse.json({ error: "Failed to initiate reset" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
