import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "https://api.luxus-collection.com"
const PK      = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: "Token and password required" }, { status: 400 })

  const res = await fetch(`${BACKEND}/auth/customer/emailpass/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PK,
      Authorization: `Bearer ${decodeURIComponent(token)}`,
    },
    body: JSON.stringify({ password }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = (err as any).message ?? "Reset failed — link may have expired"
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
