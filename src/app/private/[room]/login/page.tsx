import { notFound } from "next/navigation"
import type { Metadata } from "next"
import PrivateLoginClient from "./BackroomLoginClient"

const ROOM_NAMES: Record<string, string> = {
  master:   "Private Collection",
  backroom: "The Backroom",
  vip:      "VIP Collection",
  reserve:  "Reserve Collection",
  special:  "Special Collection",
  unicorn:  "The Unicorn Room",
}

const VALID = Object.keys(ROOM_NAMES)

export async function generateMetadata(
  { params }: { params: Promise<{ room: string }> }
): Promise<Metadata> {
  const { room } = await params
  if (!VALID.includes(room)) return {}
  return {
    title: `${ROOM_NAMES[room]} — Private Access`,
    robots: "noindex, nofollow",
  }
}

export default async function PrivateLoginPage(
  { params }: { params: Promise<{ room: string }> }
) {
  const { room } = await params
  if (!VALID.includes(room)) notFound()

  return <PrivateLoginClient room={room} roomName={ROOM_NAMES[room]} />
}
