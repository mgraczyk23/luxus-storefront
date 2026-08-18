import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const VALID_ROOMS = ["master", "backroom", "vip", "reserve", "special", "unicorn"]

// Every route with a dynamic [segment] gets matched case-insensitively by
// Vercel's own routing layer (platform behavior, not a Next.js/app bug) —
// e.g. /Brand/x and /BRAND/x both resolve to brand/[slug] and return 200.
// Fully static routes (no brackets anywhere) are unaffected and stay
// case-sensitive. By the time a page component runs, `params` only ever
// contains the dynamic segment's value — the literal folder-name casing is
// already gone — so this can only be normalized here, before Vercel resolves
// the route. Each entry is the canonical-case path segments leading up to
// (and including) the folder that holds the dynamic segment.
const CASE_NORMALIZED_PREFIXES: string[][] = [
  ["article"],
  ["brand"],
  ["category"],
  ["checkout", "offer"],
  ["collection"],
  ["invoice"],
  ["offer"],
  ["product"],
  ["resources-on-guns"],
  ["shop", "model"],
]

function normalizePrefixCase(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean)
  for (const prefix of CASE_NORMALIZED_PREFIXES) {
    if (segments.length < prefix.length) continue
    const head = segments.slice(0, prefix.length)
    const isMatch = head.every((seg, i) => seg.toLowerCase() === prefix[i])
    if (!isMatch) continue
    const isExact = head.every((seg, i) => seg === prefix[i])
    if (isExact) return null
    return "/" + [...prefix, ...segments.slice(prefix.length)].join("/")
  }
  return null
}

// Tag every /private/* request so the root layout can hide Header/Footer
function privateNext(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set("x-is-private", "1")
  return NextResponse.next({ request: { headers } })
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const corrected = normalizePrefixCase(pathname)
  if (corrected) {
    const url = request.nextUrl.clone()
    url.pathname = corrected
    return NextResponse.redirect(url, 308)
  }

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
  // Broad match (not just "/private/:path*") so the case-normalization check
  // above also runs on the affected content routes. Excludes static assets,
  // /api, and /proxy so those aren't paying for an edge invocation.
  matcher: ["/((?!_next/static|_next/image|api|proxy|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|css|js|txt|xml|webmanifest)$).*)"],
}
