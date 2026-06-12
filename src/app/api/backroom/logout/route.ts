import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { room } = await req.json()
  const response = NextResponse.json({ ok: true })
  if (room) {
    response.cookies.delete(`bkr_${room}`)
  }
  return response
}
