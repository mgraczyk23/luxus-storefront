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

function mapItem(it: Record<string, unknown>): GunBrokerListing {
  const id = (it.ItemID ?? it.itemID) as number
  const endDate = (it.EndingDate ?? it.endingDate ?? '') as string
  const hasBuyNow = !!(it.HasBuyNow ?? it.hasBuyNow)

  return {
    id,
    title:       (it.Title ?? it.title ?? '') as string,
    thumbnail:   (it.ThumbnailURL ?? it.thumbnailURL ?? it.PictureURL ?? null) as string | null,
    currentBid:  (it.BidPrice ?? it.bidPrice ?? it.Price ?? it.price ?? 0) as number,
    bidCount:    (it.Bids ?? it.bids ?? it.BidCount ?? it.bidCount ?? 0) as number,
    timeLeft:    endDate ? formatTimeLeft(endDate) : '—',
    buyNowPrice: hasBuyNow
      ? ((it.BuyNowPrice ?? it.buyNowPrice ?? it.BuyPrice ?? null) as number | null)
      : null,
    reserveMet: Boolean(it.HasReserveBeenMet ?? it.hasReserveBeenMet ?? !(it.HasReserve)),
    gunBrokerUrl: SANDBOX
      ? `https://www.sandbox.gunbroker.com/item/${id}`
      : `https://www.gunbroker.com/item/${id}`,
  }
}

async function fetchListings(token: string, limit: number): Promise<GunBrokerListing[]> {
  const res = await fetch(`${BASE}/ItemsSelling?PageSize=${limit}&PageIndex=0`, {
    headers: {
      'X-DevKey':     DEV_KEY,
      'X-AccessToken': token,
      'User-Agent':   USER_AGENT,
    },
    next: { revalidate: 300 }, // edge cache 5 min
  })
  if (!res.ok) return []
  const data = await res.json()
  const items = (data.results ?? data.Results ?? []) as Record<string, unknown>[]
  return items.map(mapItem)
}

export async function getSellerListings(limit = 8): Promise<GunBrokerListing[]> {
  if (!DEV_KEY) return []

  let token = await getAccessToken()
  if (!token) return []

  try {
    const res = await fetch(`${BASE}/ItemsSelling?PageSize=${limit}&PageIndex=0`, {
      headers: {
        'X-DevKey':      DEV_KEY,
        'X-AccessToken': token,
        'User-Agent':    USER_AGENT,
      },
      next: { revalidate: 300 },
    })

    // Token expired mid-session — re-auth once and retry
    if (res.status === 401) {
      _token = ''; _tokenExp = 0
      token = await getAccessToken()
      if (!token) return []
      return fetchListings(token, limit)
    }

    if (!res.ok) return []
    const data = await res.json()
    const items = (data.results ?? data.Results ?? []) as Record<string, unknown>[]
    return items.map(mapItem)
  } catch {
    return []
  }
}
