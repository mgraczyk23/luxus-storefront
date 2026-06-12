import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getProducts } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import PrivateListingClient from "./BackroomListingClient"

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
    title: ROOM_NAMES[room],
    robots: "noindex, nofollow",
  }
}

const FIELDS = "id,title,handle,subtitle,thumbnail,*variants,*variants.prices,*variants.inventory_quantity,categories.id,categories.name,*tags,*type,+metadata,*attribute_values,*attribute_values.attribute_type"

async function getRoomProducts(room: string) {
  const res = await getProducts({ limit: "500", fields: FIELDS })
  const all = (res.products ?? []).map(mapMedusaProduct)

  if (room === "master") {
    // Staff view — all private items regardless of room assignment
    return all.filter(p => p.is_backroom_hidden)
  }
  return all.filter(p => p.private_rooms.includes(room))
}

export const revalidate = false

export default async function PrivateRoomPage(
  { params }: { params: Promise<{ room: string }> }
) {
  const { room } = await params
  if (!VALID.includes(room)) notFound()

  const products = await getRoomProducts(room)

  return (
    <PrivateListingClient
      room={room}
      roomName={ROOM_NAMES[room]}
      products={products}
    />
  )
}
