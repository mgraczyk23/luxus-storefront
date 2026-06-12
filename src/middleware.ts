import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const VALID_ROOMS = ["master", "backroom", "vip", "reserve", "special", "unicorn"]

// Tag every /private/* request so the root layout can hide Header/Footer
function privateNext(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set("x-is-private", "1")
  return NextResponse.next({ request: { headers } })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith("/private/")) return NextResponse.next()

  const parts = pathname.split("/")
  const room  = parts[2]

  if (!room || !VALID_ROOMS.includes(room)) return NextResponse.next()

  // Login page — accessible without auth, but still needs the private header
  if (parts[3] === "login") return privateNext(request)

  const secret = new TextEncoder().encode(process.env.BACKROOM_JWT_SECRET ?? "")
  const token  = request.cookies.get(`bkr_${room}`)?.value

  if (!token) {
    return NextResponse.redirect(new URL(`/private/${room}/login`, request.url))
  }

  try {
    const { payload } = await jwtVerify(token, secret)
    if (payload.room !== room) throw new Error("room mismatch")
    return privateNext(request)
  } catch {
    const res = NextResponse.redirect(new URL(`/private/${room}/login`, request.url))
    res.cookies.delete(`bkr_${room}`)
    return res
  }
}

export const config = {
  matcher: ["/private/:path*"],
}
