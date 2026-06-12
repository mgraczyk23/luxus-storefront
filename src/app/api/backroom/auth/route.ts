import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"

const MEDUSA = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "https://api.luxus-collection.com"
const PK     = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

const VALID_ROOMS = ["master", "backroom", "vip", "reserve", "special", "unicorn"] as const
type Room = typeof VALID_ROOMS[number]

// Fast-path passwords — set BACKROOM_PASS_{ROOM} env vars in Vercel for instant auth
const ENV_PASSWORDS: Partial<Record<Room, string>> = {
  master:   process.env.BACKROOM_PASS_MASTER,
  backroom: process.env.BACKROOM_PASS_BACKROOM,
  vip:      process.env.BACKROOM_PASS_VIP,
  reserve:  process.env.BACKROOM_PASS_RESERVE,
  special:  process.env.BACKROOM_PASS_SPECIAL,
  unicorn:  process.env.BACKROOM_PASS_UNICORN,
}

function safeCompare(a: string, b: string): boolean {
  const key = process.env.BACKROOM_JWT_SECRET ?? "key"
  const ha = createHmac("sha256", key).update(a).digest()
  const hb = createHmac("sha256", key).update(b).digest()
  return ha.length === hb.length && timingSafeEqual(ha, hb)
}

function signJwt(room: string): string {
  const secret = process.env.BACKROOM_JWT_SECRET!
  const hdr = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")
  const pld = Buffer.from(JSON.stringify({
    room,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
  })).toString("base64url")
  const sig = createHmac("sha256", secret).update(`${hdr}.${pld}`).digest("base64url")
  return `${hdr}.${pld}.${sig}`
}

function cookieResponse(room: string, token: string): NextResponse {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(`bkr_${room}`, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   86400,
    path:     `/private/${room}`,
  })
  return res
}

export async function POST(req: NextRequest) {
  const { room, password } = await req.json() as { room?: string; password?: string }

  if (!room || !VALID_ROOMS.includes(room as Room)) {
    return NextResponse.json({ message: "Invalid room" }, { status: 400 })
  }
  if (!password) {
    return NextResponse.json({ message: "Password required" }, { status: 400 })
  }

  // Fast path: env var is set — no Medusa round-trip, sub-10ms
  const envPass = ENV_PASSWORDS[room as Room]
  if (envPass) {
    if (!safeCompare(password, envPass)) {
      return NextResponse.json({ message: "Incorrect password" }, { status: 401 })
    }
    if (!process.env.BACKROOM_JWT_SECRET) {
      return NextResponse.json({ message: "Server configuration error" }, { status: 500 })
    }
    return cookieResponse(room, signJwt(room))
  }

  // Slow path: fall back to Medusa (used until env vars are configured)
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

  return cookieResponse(room, token)
}
