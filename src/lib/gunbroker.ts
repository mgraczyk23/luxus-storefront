// GunBroker REST API client — server-side only
// Sandbox base: https://api.sandbox.gunbroker.com/v1
// Production base: https://api.gunbroker.com/v1
//
// Required env vars:
//   GUNBROKER_DEV_KEY      — developer key (different per environment)
//   GUNBROKER_USERNAME     — GunBroker account username
//   GUNBROKER_PASSWORD     — GunBroker account password
//   GUNBROKER_SANDBOX=true — set to "true" to target sandbox; omit for production

const SANDBOX   = process.env.GUNBROKER_SANDBOX === 'true'
const BASE      = SANDBOX
  ? 'https://api.sandbox.gunbroker.com/v1'
  : 'https://api.gunbroker.com/v1'
const DEV_KEY   = process.env.GUNBROKER_DEV_KEY ?? ''
// Per GunBroker support requirement: Software/Seller/Version/AppName
const USER_AGENT = 'LuxusStorefront/LuxusCollection/1.0/AuctionSync'

// Per-serverless-instance token cache — avoids re-auth on every request
let _token    = ''
let _tokenExp = 0

async function getAccessToken(): Promise<string> {
  if (_token && Date.now() < _tokenExp) return _token

  const username = process.env.GUNBROKER_USERNAME
  const password = process.env.GUNBROKER_PASSWORD
  if (!username || !password || !DEV_KEY) return ''

  try {
    const res = await fetch(`${BASE}/Users/AccessToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DevKey':     DEV_KEY,
        'User-Agent':   USER_AGENT,
      },
      body: JSON.stringify({ Username: username, Password: password }),
      cache: 'no-store',
    })
    if (!res.ok) return ''
    const data = await res.json()
    const token = data.AccessToken ?? data.accessToken ?? ''
    if (token) {
      _token    = token
      _tokenExp = Date.now() + 50 * 60 * 1000 // cache 50 min (tokens last ~60 min)
    }
    return _token
  } catch {
    return ''
  }
}

export type GunBrokerListing = {
  id:           number
  title:        string
  thumbnail:    string | null
  currentBid:   number
  bidCount:     number
  timeLeft:     string
  buyNowPrice:  number | null
  reserveMet:   boolean
  gunBrokerUrl: string
}

function formatTimeLeft(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'Ended'
  const d = Math.floor(ms / 86_400_000)
  const h = Math.floor((ms % 86_400_000) / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

const PAGE_SIZE = 96

function mapItem(it: Record<string, unknown>): GunBrokerListing {
  const id = (it.ItemID ?? it.itemID) as number
  // ItemsSelling uses endingDateTimeUTC; Items search uses endingDate
  const endDate = (it.endingDateTimeUTC ?? it.EndingDateTimeUTC ?? it.endingDate ?? it.EndingDate ?? '') as string
  const hasBuyNow = !!(it.HasBuyNow ?? it.hasBuyNow)
  // ?? skips only null/undefined — not false. Check hasReserve first; if no reserve, treat as met.
  const hasReserve = !!(it.HasReserve ?? it.hasReserve)

  // currentBid is 0 when no bids have been placed; fall back to startingBid / minimumBid
  const rawBid = (it.currentBid ?? it.CurrentBid ?? it.BidPrice ?? it.bidPrice ?? 0) as number
  const startingBid = (it.startingBid ?? it.StartingBid ?? it.minimumBid ?? it.MinimumBid ?? it.Price ?? it.price ?? 0) as number
  const bidCount = (it.Bids ?? it.bids ?? it.BidCount ?? it.bidCount ?? 0) as number

  return {
    id,
    title:       (it.Title ?? it.title ?? '') as string,
    thumbnail:   (it.ThumbnailURL ?? it.thumbnailURL ?? it.PictureURL ?? null) as string | null,
    currentBid:  rawBid > 0 ? rawBid : startingBid,
    bidCount,
    timeLeft:    endDate ? formatTimeLeft(endDate) : '—',
    buyNowPrice: hasBuyNow
      ? ((it.BuyNowPrice ?? it.buyNowPrice ?? it.BuyPrice ?? null) as number | null)
      : null,
    reserveMet: !hasReserve || Boolean(it.HasReserveBeenMet ?? it.hasReserveBeenMet ?? false),
    gunBrokerUrl: SANDBOX
      ? `https://www.sandbox.gunbroker.com/item/${id}`
      : `https://www.gunbroker.com/item/${id}`,
  }
}

async function fetchPage(token: string, pageIndex: number): Promise<{ listings: GunBrokerListing[], total: number }> {
  const res = await fetch(`${BASE}/ItemsSelling?PageSize=${PAGE_SIZE}&PageIndex=${pageIndex}`, {
    headers: {
      'X-DevKey':      DEV_KEY,
      'X-AccessToken': token,
      'User-Agent':    USER_AGENT,
    },
    next: { revalidate: 300 },
  })
  if (!res.ok) return { listings: [], total: 0 }
  const data = await res.json()
  const total = (data.count ?? data.Count ?? 0) as number
  const items = (data.results ?? data.Results ?? []) as Record<string, unknown>[]
  return { listings: items.map(mapItem).filter(l => l.timeLeft !== 'Ended'), total }
}

export async function getSellerListings(): Promise<GunBrokerListing[]> {
  if (!DEV_KEY) return []

  let token = await getAccessToken()
  if (!token) return []

  try {
    let firstRes = await fetch(`${BASE}/ItemsSelling?PageSize=${PAGE_SIZE}&PageIndex=1`, {
      headers: {
        'X-DevKey':      DEV_KEY,
        'X-AccessToken': token,
        'User-Agent':    USER_AGENT,
      },
      next: { revalidate: 300 },
    })

    // Token expired mid-session — re-auth once and retry
    if (firstRes.status === 401) {
      _token = ''; _tokenExp = 0
      token = await getAccessToken()
      if (!token) return []
      firstRes = await fetch(`${BASE}/ItemsSelling?PageSize=${PAGE_SIZE}&PageIndex=1`, {
        headers: {
          'X-DevKey':      DEV_KEY,
          'X-AccessToken': token,
          'User-Agent':    USER_AGENT,
        },
        next: { revalidate: 300 },
      })
    }

    if (!firstRes.ok) return []
    const firstData = await firstRes.json()
    const total = (firstData.count ?? firstData.Count ?? 0) as number
    const firstItems = (firstData.results ?? firstData.Results ?? []) as Record<string, unknown>[]
    const firstPage = firstItems.map(mapItem).filter(l => l.timeLeft !== 'Ended')

    if (total <= PAGE_SIZE) return firstPage

    // Seller has more than PAGE_SIZE listings — fetch remaining pages in parallel
    const totalPages = Math.ceil(total / PAGE_SIZE)
    const remaining = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(token, i + 2))
    )
    return [firstPage, ...remaining.map(r => r.listings)].flat()
  } catch {
    return []
  }
}
