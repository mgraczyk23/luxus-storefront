const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "https://api.luxus-collection.com"
const PK      = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

const h = (token?: string | null) => ({
  "Content-Type": "application/json",
  "x-publishable-api-key": PK,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export type LxsCustomer = {
  id:         string
  email:      string
  first_name: string
  last_name:  string
  phone:      string | null
  created_at: string
}

export type LxsAddress = {
  first_name?:  string
  last_name?:   string
  address_1?:   string
  address_2?:   string
  city?:        string
  province?:    string
  postal_code?: string
  country_code?: string
  phone?:       string
}

export type LxsOrder = {
  id:               string
  display_id:       number
  status:           string
  created_at:       string
  total:            number          // in cents
  subtotal:         number
  tax_total:        number
  shipping_total:   number
  email?:           string
  items:            LxsOrderItem[]
  fulfillments:     { tracking_links: { tracking_number: string }[] }[]
  shipping_address?: LxsAddress
  billing_address?:  LxsAddress
  metadata?:        Record<string, string>
  payment_collections?: Array<{
    payments?: Array<{ provider_id?: string; data?: Record<string, unknown> }>
  }>
}

export type LxsOrderItem = {
  id:         string
  title:      string
  quantity:   number
  unit_price: number
  thumbnail:  string | null
  variant?: { product?: { brand?: string; attributes?: { caliber?: string } } }
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function authSignIn(email: string, password: string): Promise<string> {
  const res = await fetch(`${BACKEND}/auth/customer/emailpass`, {
    method: "POST", headers: h(), body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? "Invalid email or password")
  }
  return (await res.json()).token
}

export async function authRegister(email: string, password: string): Promise<string> {
  const res = await fetch(`${BACKEND}/auth/customer/emailpass/register`, {
    method: "POST", headers: h(), body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? "Registration failed")
  }
  return (await res.json()).token
}

export async function createCustomerProfile(
  registerToken: string, first_name: string, last_name: string, email: string
): Promise<void> {
  const res = await fetch(`${BACKEND}/store/customers`, {
    method: "POST", headers: h(registerToken),
    body: JSON.stringify({ first_name, last_name, email }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    if (err.type !== "duplicate_error") throw new Error(err.message ?? "Failed to create account")
  }
}

// ── Customer ─────────────────────────────────────────────────────────────────

export async function getCustomer(token: string): Promise<LxsCustomer | null> {
  const res = await fetch(`${BACKEND}/store/customers/me`, {
    headers: h(token), cache: "no-store",
  })
  if (!res.ok) return null
  return (await res.json()).customer ?? null
}

export async function updateCustomer(
  token: string,
  data: { first_name?: string; last_name?: string; phone?: string }
): Promise<LxsCustomer> {
  const res = await fetch(`${BACKEND}/store/customers/me`, {
    method: "POST", headers: h(token), body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update profile")
  return (await res.json()).customer
}

// ── Orders ───────────────────────────────────────────────────────────────────

export async function getCustomerOrders(token: string): Promise<LxsOrder[]> {
  const res = await fetch(`${BACKEND}/store/orders/by-email`, {
    headers: h(token), cache: "no-store",
  })
  if (!res.ok) return []
  return (await res.json()).orders ?? []
}

export async function getOrderById(orderId: string, token: string): Promise<LxsOrder | null> {
  const fields = "+shipping_address,+billing_address,+tax_total,+shipping_total,+subtotal,+email,+metadata,+payment_collections"
  const res = await fetch(`${BACKEND}/store/orders/${orderId}?fields=${encodeURIComponent(fields)}`, {
    headers: h(token), cache: "no-store",
  })
  if (!res.ok) return null
  return (await res.json()).order ?? null
}

// ── Wishlist (localStorage) ──────────────────────────────────────────────────

export type WishlistItem = {
  handle:              string
  title:               string
  brand:               string | null
  caliber:             string | null
  action:              string | null
  price:               number | null
  contact_for_pricing: boolean
  thumbnail:           string | null
}

const WISHLIST_KEY = "lxs_wishlist"

export function getWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? "[]") } catch { return [] }
}

export function isWishlisted(handle: string): boolean {
  return getWishlist().some(i => i.handle === handle)
}

export function toggleWishlist(item: WishlistItem): boolean {
  const list = getWishlist()
  const idx = list.findIndex(i => i.handle === item.handle)
  if (idx >= 0) {
    list.splice(idx, 1)
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list))
    return false
  } else {
    list.unshift(item)
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list))
    return true
  }
}
