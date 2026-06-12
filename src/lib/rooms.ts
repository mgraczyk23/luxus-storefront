export const ROOMS = [
  { slug: 'backroom', name: 'Backroom' },
  { slug: 'vip',      name: 'VIP'      },
  { slug: 'reserve',  name: 'Reserve'  },
  { slug: 'special',  name: 'Special'  },
  { slug: 'unicorn',  name: 'Unicorn'  },
] as const

export type RoomSlug = typeof ROOMS[number]['slug']

export function getRoomName(slug: string): string {
  return ROOMS.find(r => r.slug === slug)?.name ?? slug
}
