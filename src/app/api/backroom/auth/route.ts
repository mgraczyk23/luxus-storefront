import { NextRequest, NextResponse } from "next/server"

const MEDUSA = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "https://api.luxus-collection.com"
const PK     = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

export async function POST(req: NextRequest) {
  const { room, password } = await req.json()

  if (!room || !password) {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 })
  }

  let token: string
  try {
    const res = await fetch(`${MEDUSA}/store/backroom-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
      body: JSON.stringify({ room, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ message: (err as any).message ?? "Incorrect password" }, { status: 401 })
    }
    const data = await res.json()
    token = data.token
  } catch {
    return NextResponse.json({ message: "Service unavailable" }, { status: 503 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(`bkr_${room}`, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24,  // 24 hours
    path:     `/private/${room}`,
  })
  return response
}
