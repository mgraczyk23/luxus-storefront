import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const VALID_ROOMS = ["master", "backroom", "vip", "reserve", "special", "unicorn"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith("/private/")) return NextResponse.next()

  // /private/{room}[/...]
  const parts = pathname.split("/")
  const room = parts[2]

  if (!room || !VALID_ROOMS.includes(room)) return NextResponse.next()

  // Login page is always accessible
  if (parts[3] === "login") return NextResponse.next()

  const secret = new TextEncoder().encode(process.env.BACKROOM_JWT_SECRET ?? "")
  const token  = request.cookies.get(`bkr_${room}`)?.value

  if (!token) {
    return NextResponse.redirect(new URL(`/private/${room}/login`, request.url))
  }

  try {
    const { payload } = await jwtVerify(token, secret)
    if (payload.room !== room) throw new Error("room mismatch")
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL(`/private/${room}/login`, request.url))
    res.cookies.delete(`bkr_${room}`)
    return res
  }
}

export const config = {
  matcher: ["/private/:path*"],
}
