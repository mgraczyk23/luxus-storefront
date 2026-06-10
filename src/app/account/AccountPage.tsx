'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { getCustomerOrders, getWishlist, toggleWishlist, type LxsOrder, type WishlistItem } from '@/lib/auth'
import type { SiteSettings } from '@/lib/payload'

const fmt = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

const STATUS_MAP: Record<string, { label: string; bg: string }> = {
  pending:    { label: "Processing",  bg: "#3a6a8a" },
  completed:  { label: "Completed",   bg: "#4a8a4a" },
  cancelled:  { label: "Cancelled",   bg: "#8a4a4a" },
  archived:   { label: "Archived",    bg: "#707076" },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, bg: "#c09530" }
  return (
    <span style={{ padding: "3px 10px", background: s.bg + "22", border: `1px solid ${s.bg}55`, fontSize: "8.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: s.bg, fontWeight: 500 }}>
      {s.label}
    </span>
  )
}

function ImgBox({ style = {} }: { style?: React.CSSProperties }) {
  const { t } = useTheme()
  return (
    <div style={{ background: "linear-gradient(140deg,#e8e8eb,#d4d4d8)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, ...style }}>
      <svg width="18" height="18" viewBox="0 0 36 36" fill="none" opacity="0.14">
        <rect x="2" y="2" width="32" height="32" rx="1" stroke={t.gold} strokeWidth="0.8"/>
        <circle cx="12" cy="12" r="4" stroke={t.gold} strokeWidth="0.8"/>
        <path d="M2 26L11 17L17 23L25 13L34 23V34H2V26Z" stroke={t.gold} strokeWidth="0.8"/>
      </svg>
    </div>
  )
}

const TABS = [
  { id: "orders",   label: "Order History",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="1"/><path d="M4 5H10M4 7.5H8M4 10H7" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/></svg> },
  { id: "wishlist", label: "Wishlist",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 12C7 12 1 8 1 4C1 2.34 2.34 1 4 1C5.2 1 6.25 1.7 6.78 2.72C6.88 2.92 7.12 2.92 7.22 2.72C7.75 1.7 8.79 1 10 1C11.66 1 13 2.34 13 4C13 8 7 12 7 12Z" stroke="currentColor" strokeWidth="1"/></svg> },
  { id: "offers",   label: "My Offers",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 2.5H12.5V9.5H7.5L5 12V9.5H1.5V2.5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/></svg> },
  { id: "settings", label: "Account Details",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1"/><path d="M1.5 12.5C1.5 10.015 4.015 8 7 8C9.985 8 12.5 10.015 12.5 12.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg> },
]

export default function AccountPage({ settings }: { settings?: SiteSettings }) {
  const { t } = useTheme()
  const { customer, token, isLoading, isLoggedIn, signOut, updateProfile } = useAuth()
  const router = useRouter()

  const [tab,           setTab]          = useState("orders")
  const [expandedOrder, setExpandedOrder] = useState<string|null>(null)
  const [orders,        setOrders]        = useState<LxsOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [wishlist,      setWishlist]      = useState<WishlistItem[]>([])
  const [offers,        setOffers]        = useState<any[]>([])
  const [offersLoading, setOffersLoading] = useState(false)

  // Profile edit state
  const [editMode,   setEditMode]   = useState(false)
  const [editFirst,  setEditFirst]  = useState("")
  const [editLast,   setEditLast]   = useState("")
  const [editPhone,  setEditPhone]  = useState("")
  const [saveStatus, setSaveStatus] = useState<"idle"|"saving"|"saved"|"error">("idle")
  const [saveError,  setSaveError]  = useState("")

  // Redirect to /auth if not logged in once loading is done
  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.replace("/auth")
  }, [isLoading, isLoggedIn, router])

  // Fetch orders when tab switches to orders
  useEffect(() => {
    if (tab === "orders" && token && orders.length === 0) {
      setOrdersLoading(true)
      getCustomerOrders(token).then(o => { setOrders(o); setOrdersLoading(false) })
    }
  }, [tab, token, orders.length])

  // Load wishlist from localStorage when tab switches
  useEffect(() => {
    if (tab === "wishlist") setWishlist(getWishlist())
  }, [tab])

  // Fetch offers when tab switches to offers
  useEffect(() => {
    if (tab === "offers" && token && offers.length === 0) {
      setOffersLoading(true)
      const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'https://api.luxus-collection.com'
      const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''
      fetch(`${MEDUSA_URL}/store/offers/mine`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-publishable-api-key': PK },
      })
        .then(r => r.json())
        .then(d => { setOffers(d.offers ?? []); setOffersLoading(false) })
        .catch(() => setOffersLoading(false))
    }
  }, [tab, token, offers.length])

  // Pre-fill edit fields when entering edit mode
  useEffect(() => {
    if (editMode && customer) {
      setEditFirst(customer.first_name)
      setEditLast(customer.last_name)
      setEditPhone(customer.phone ?? "")
    }
  }, [editMode, customer])

  const handleSaveProfile = async () => {
    setSaveStatus("saving"); setSaveError("")
    try {
      await updateProfile({ first_name: editFirst, last_name: editLast, phone: editPhone || undefined })
      setSaveStatus("saved")
      setEditMode(false)
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (err: any) {
      setSaveError(err.message ?? "Failed to save")
      setSaveStatus("error")
    }
  }

  const handleSignOut = () => { signOut(); router.push("/") }

  const inp: React.CSSProperties = { width: "100%", padding: "11px 14px", background: "#ffffff", border: `1px solid ${t.border}`, color: t.text, fontSize: "12.5px", fontFamily: "var(--font-inter)", fontWeight: 300, letterSpacing: "0.02em", outline: "none", borderRadius: "1px" }

  if (isLoading || !customer) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-inter)", color: t.textDim, fontSize: "11px", letterSpacing: "0.1em" }}>
        Loading…
      </div>
    )
  }

  const memberSince = new Date(customer.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "var(--font-inter)" }}>

      {/* Banner */}
      <div style={{ background: "linear-gradient(to bottom,#f3f3f5,#ffffff)", borderBottom: `1px solid ${t.border}`, padding: "40px 40px 0" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: "28px", borderBottom: `1px solid ${t.border}` }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                <div style={{ width: "18px", height: "1px", background: t.gold }}/>
                <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>My Account</span>
              </div>
              <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(26px,3vw,40px)", fontWeight: 400, color: t.text, lineHeight: 1.1 }}>
                Welcome back, {customer.first_name}.
              </h1>
              <div style={{ fontSize: "11.5px", color: t.textDim, fontWeight: 300, marginTop: "6px" }}>
                Member since {memberSince} · {customer.email}
              </div>
            </div>
            <button onClick={handleSignOut}
              style={{ padding: "9px 20px", background: "transparent", border: `1px solid ${t.border}`, color: t.textMuted, fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 500, cursor: "pointer", transition: "all 0.18s", whiteSpace: "nowrap", flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold + "60"; e.currentTarget.style.color = t.gold }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted }}>
              Sign Out
            </button>
          </div>
          {/* Tab bar */}
          <div className="lxs-account-tabs" style={{ display: "flex" }}>
            {TABS.map(({ id, label, icon }) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "16px 24px 16px 0", background: "none", border: "none", borderBottom: `2px solid ${tab === id ? t.gold : "transparent"}`, marginBottom: "-1px", cursor: "pointer", fontFamily: "var(--font-inter)", fontWeight: tab === id ? 500 : 300, fontSize: "9.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: tab === id ? t.gold : t.textMuted, transition: "all 0.2s" }}>
                <span style={{ color: tab === id ? t.gold : t.textDim }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "48px 40px 80px" }}>

        {/* ── ORDER HISTORY ── */}
        {tab === "orders" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
              <div style={{ fontFamily: "var(--font-playfair)", fontSize: "24px", fontWeight: 400, color: t.text }}>Order History</div>
              {!ordersLoading && <span style={{ fontSize: "11px", color: t.textDim, fontWeight: 300 }}><span style={{ color: t.text, fontWeight: 400 }}>{orders.length}</span> orders</span>}
            </div>

            {ordersLoading ? (
              <div style={{ padding: "60px 0", textAlign: "center", fontSize: "11px", color: t.textDim }}>Loading orders…</div>
            ) : orders.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center", border: `1px solid ${t.border}`, background: "#fafafa" }}>
                <div style={{ fontFamily: "var(--font-playfair)", fontSize: "22px", fontWeight: 400, color: t.text, marginBottom: "10px" }}>No orders yet</div>
                <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted, marginBottom: "20px" }}>Your order history will appear here once you make a purchase.</p>
                <Link href="/shop" style={{ fontSize: "9.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.gold, fontWeight: 600, textDecoration: "none", borderBottom: `1px solid ${t.gold}50`, paddingBottom: "2px" }}>Browse the Collection →</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {orders.map(order => {
                  const displayId = `LXC-${String(order.display_id).padStart(6, '0')}`
                  const tracking  = order.fulfillments?.[0]?.tracking_links?.[0]?.tracking_number ?? null
                  return (
                    <div key={order.id} style={{ border: `1px solid ${expandedOrder === order.id ? t.gold + "50" : t.border}`, transition: "border-color 0.22s" }}>
                      <div className="lxs-order-head" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "20px", padding: "18px 22px", alignItems: "center", cursor: "pointer", background: "#fff" }}
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                        <div>
                          <div style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "4px" }}>Order</div>
                          <div style={{ fontFamily: "var(--font-playfair)", fontSize: "15px", fontWeight: 400, color: t.gold }}>{displayId}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "4px" }}>Date</div>
                          <div style={{ fontSize: "12px", fontWeight: 300, color: t.text }}>{fmtDate(order.created_at)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "4px" }}>Status</div>
                          <StatusBadge status={order.status}/>
                        </div>
                        <div>
                          <div style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "4px" }}>Total</div>
                          <div style={{ fontFamily: "var(--font-playfair)", fontSize: "16px", fontWeight: 400, color: t.text }}>{fmt(order.total)}</div>
                        </div>
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transition: "transform 0.25s", transform: expandedOrder === order.id ? "rotate(180deg)" : "none", color: t.textDim, flexShrink: 0 }}>
                          <path d="M0.5 0.5L5 5L9.5 0.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div style={{ overflow: "hidden", maxHeight: expandedOrder === order.id ? "600px" : "0", transition: "max-height 0.3s ease" }}>
                        <div style={{ padding: "20px 22px", borderTop: `1px solid ${t.border}`, background: "#fafafa" }}>
                          {(order.items ?? []).map((item, i) => (
                            <div key={item.id ?? i} style={{ display: "flex", gap: "14px", alignItems: "center", marginBottom: "14px" }}>
                              {item.thumbnail
                                ? <div style={{ width: "56px", height: "56px", border: `1px solid ${t.border}`, position: "relative", flexShrink: 0, overflow: "hidden" }}>
                                    <Image src={item.thumbnail} alt={item.title} fill style={{ objectFit: "contain" }} sizes="56px"/>
                                  </div>
                                : <ImgBox style={{ width: "56px", height: "56px", border: `1px solid ${t.border}` }}/>}
                              <div>
                                <div style={{ fontFamily: "var(--font-playfair)", fontSize: "15px", fontWeight: 400, color: t.text, marginBottom: "2px" }}>{item.title}</div>
                                <div style={{ fontSize: "10.5px", color: t.textDim, fontWeight: 300 }}>{fmt(item.unit_price)} · Qty {item.quantity}</div>
                              </div>
                            </div>
                          ))}
                          <div className="lxs-order-meta" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", paddingTop: "14px", borderTop: `1px solid ${t.border}` }}>
                            <div>
                              <div style={{ fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "4px" }}>Order ID</div>
                              <div style={{ fontSize: "12px", fontWeight: 300, color: t.text, letterSpacing: "0.04em" }}>{order.id.slice(0, 20)}…</div>
                            </div>
                            {tracking && (
                              <div>
                                <div style={{ fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "4px" }}>Tracking</div>
                                <div style={{ fontSize: "12px", fontWeight: 300, color: t.gold, letterSpacing: "0.04em" }}>{tracking}</div>
                              </div>
                            )}
                            <div style={{ display: "flex", alignItems: "flex-end", gap: "18px", flexWrap: "wrap" }}>
                              <Link href={`/invoice/${order.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.gold, textDecoration: "none", borderBottom: `1px solid ${t.gold}50`, paddingBottom: "2px", fontWeight: 500 }}>
                                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 0.5V7.5M5.5 7.5L2.5 4.5M5.5 7.5L8.5 4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 10H10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                                Invoice
                              </Link>
                              <Link href={`/support?order=${displayId}`} style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.textMuted, textDecoration: "none", borderBottom: `1px solid ${t.border}`, paddingBottom: "2px", fontWeight: 500 }}
                                onMouseEnter={e => e.currentTarget.style.color = t.gold} onMouseLeave={e => e.currentTarget.style.color = t.textMuted}>
                                Order Support →
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── WISHLIST ── */}
        {tab === "wishlist" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
              <div style={{ fontFamily: "var(--font-playfair)", fontSize: "24px", fontWeight: 400, color: t.text }}>Saved Pieces</div>
              <span style={{ fontSize: "11px", color: t.textDim, fontWeight: 300 }}><span style={{ color: t.text, fontWeight: 400 }}>{wishlist.length}</span> items</span>
            </div>
            {wishlist.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center", border: `1px solid ${t.border}`, background: "#fafafa" }}>
                <div style={{ fontFamily: "var(--font-playfair)", fontSize: "22px", fontWeight: 400, color: t.text, marginBottom: "10px" }}>Your wishlist is empty</div>
                <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted, marginBottom: "20px" }}>Save pieces from the collection using the heart button on any product page.</p>
                <Link href="/shop" style={{ fontSize: "9.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.gold, fontWeight: 600, textDecoration: "none", borderBottom: `1px solid ${t.gold}50`, paddingBottom: "2px" }}>Browse the Collection →</Link>
              </div>
            ) : (
              <div className="lxs-wishlist-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
                {wishlist.map((item) => (
                  <div key={item.handle} style={{ border: `1px solid ${t.border}`, background: t.bgCard, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <div style={{ height: "180px", position: "relative", background: "#f0f0f2", flexShrink: 0 }}>
                      {item.thumbnail
                        ? <Image src={item.thumbnail} alt={item.title} fill style={{ objectFit: "contain" }} sizes="(max-width: 640px) 100vw, 33vw"/>
                        : <ImgBox style={{ width: "100%", height: "100%" }}/>}
                    </div>
                    <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
                      {item.brand && <div style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "4px" }}>{item.brand}</div>}
                      <div style={{ fontFamily: "var(--font-playfair)", fontSize: "17px", fontWeight: 400, color: t.text, lineHeight: 1.25, marginBottom: "4px" }}>{item.title}</div>
                      {item.caliber && <div style={{ fontSize: "11px", color: t.textMuted, fontWeight: 300, marginBottom: "14px" }}>{item.caliber}</div>}
                      <div style={{ height: "1px", background: t.border, marginBottom: "12px", marginTop: "auto" }}/>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontSize: item.contact_for_pricing ? "10px" : "14px", fontWeight: item.contact_for_pricing ? 400 : 500, color: item.contact_for_pricing ? t.gold : t.text }}>
                          {item.contact_for_pricing ? "Contact for Pricing" : item.price !== null ? fmt(item.price * 100) : "—"}
                        </div>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <Link href={`/product/${item.handle}`} style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.gold, textDecoration: "none", borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px", fontWeight: 500 }}>View</Link>
                          <span style={{ fontSize: "9px", color: t.textDim, cursor: "pointer", transition: "color 0.18s" }}
                            onClick={() => { toggleWishlist(item); setWishlist(getWishlist()) }}
                            onMouseEnter={e => e.currentTarget.style.color = "#b05040"}
                            onMouseLeave={e => e.currentTarget.style.color = t.textDim}>Remove</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY OFFERS ── */}
        {tab === "offers" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
              <div style={{ fontFamily: "var(--font-playfair)", fontSize: "24px", fontWeight: 400, color: t.text }}>My Offers</div>
              {!offersLoading && <span style={{ fontSize: "11px", color: t.textDim, fontWeight: 300 }}><span style={{ color: t.text, fontWeight: 400 }}>{offers.length}</span> offers</span>}
            </div>

            {offersLoading ? (
              <div style={{ padding: "60px 0", textAlign: "center", fontSize: "11px", color: t.textDim }}>Loading offers…</div>
            ) : offers.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center", border: `1px solid ${t.border}`, background: "#fafafa" }}>
                <div style={{ fontFamily: "var(--font-playfair)", fontSize: "22px", fontWeight: 400, color: t.text, marginBottom: "10px" }}>No offers yet</div>
                <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted, marginBottom: "20px" }}>When you submit an offer on a firearm, it will appear here with its current status.</p>
                <Link href="/shop" style={{ fontSize: "9.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.gold, fontWeight: 600, textDecoration: "none", borderBottom: `1px solid ${t.gold}50`, paddingBottom: "2px" }}>Browse the Collection →</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {offers.map((offer: any) => {
                  const OFFER_STATUS: Record<string, { label: string; bg: string }> = {
                    pending:   { label: "Awaiting Response", bg: "#c09530" },
                    countered: { label: "Counter Offer",     bg: "#3a6a8a" },
                    accepted:  { label: "Accepted",          bg: "#4a8a4a" },
                    declined:  { label: "Declined",          bg: "#8a4a4a" },
                  }
                  const s = OFFER_STATUS[offer.status] ?? { label: offer.status, bg: "#707076" }
                  const amountDisplay = offer.counter_amount
                    ? `${fmt(offer.counter_amount * 100)} (counter from ${fmt(offer.offer_amount * 100)})`
                    : fmt(offer.offer_amount * 100)
                  const tokenExpired = offer.checkout_token_expires_at && new Date(offer.checkout_token_expires_at) < new Date()

                  return (
                    <div key={offer.id} style={{ border: `1px solid ${t.border}`, background: "#fff" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "20px", padding: "18px 22px", alignItems: "center" }} className="lxs-order-head">
                        <div>
                          <div style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "4px" }}>Item</div>
                          <div style={{ fontFamily: "var(--font-playfair)", fontSize: "15px", fontWeight: 400, color: t.text, lineHeight: 1.3 }}>{offer.product_title}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "4px" }}>Amount</div>
                          <div style={{ fontSize: "13px", fontWeight: 300, color: t.text }}>{amountDisplay}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "4px" }}>Status</div>
                          <span style={{ padding: "3px 10px", background: s.bg + "22", border: `1px solid ${s.bg}55`, fontSize: "8.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: s.bg, fontWeight: 500 }}>{s.label}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                          {offer.status === "accepted" && offer.checkout_token && !tokenExpired && (
                            <Link href={`/checkout/offer/${offer.checkout_token}`}
                              style={{ padding: "9px 18px", background: t.gold, color: "#fff", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", display: "block" }}>
                              Complete Purchase →
                            </Link>
                          )}
                          {offer.status === "accepted" && tokenExpired && (
                            <span style={{ fontSize: "10.5px", color: t.textDim, fontWeight: 300 }}>Link expired — contact us</span>
                          )}
                          {offer.status === "countered" && (
                            <Link href={`/offer/${offer.id}/accept-counter`}
                              style={{ padding: "9px 18px", background: "transparent", border: `1px solid ${t.gold}`, color: t.gold, fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", display: "block" }}>
                              Review Counter →
                            </Link>
                          )}
                          {offer.status === "declined" && (
                            <Link href={`/product/${offer.product_handle}`}
                              style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.textMuted, textDecoration: "none", borderBottom: `1px solid ${t.border}`, paddingBottom: "2px", fontWeight: 500 }}>
                              View Item →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ACCOUNT SETTINGS ── */}
        {tab === "settings" && (
          <div style={{ maxWidth: "640px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
              <div style={{ fontFamily: "var(--font-playfair)", fontSize: "24px", fontWeight: 400, color: t.text }}>Account Details</div>
              <div style={{ display: "flex", gap: "10px" }}>
                {editMode && (
                  <button onClick={() => { setEditMode(false); setSaveStatus("idle") }}
                    style={{ padding: "8px 18px", background: "transparent", border: `1px solid ${t.border}`, color: t.textMuted, fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 500, cursor: "pointer" }}>
                    Cancel
                  </button>
                )}
                <button onClick={editMode ? handleSaveProfile : () => setEditMode(true)}
                  disabled={saveStatus === "saving"}
                  style={{ padding: "8px 18px", background: editMode ? t.gold : "transparent", border: `1px solid ${editMode ? t.gold : t.border}`, color: editMode ? "#fff" : t.textMuted, fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}>
                  {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved ✓" : editMode ? "Save Changes" : "Edit"}
                </button>
              </div>
            </div>
            {saveStatus === "error" && <p style={{ fontSize: "11px", color: "#b05040", marginBottom: "16px", fontWeight: 300 }}>{saveError}</p>}

            {[
              { label: "First Name",    key: "first_name", val: customer.first_name, editVal: editFirst, setVal: setEditFirst },
              { label: "Last Name",     key: "last_name",  val: customer.last_name,  editVal: editLast,  setVal: setEditLast  },
              { label: "Email Address", key: "email",      val: customer.email,      editVal: customer.email, setVal: () => {} },
              { label: "Phone Number",  key: "phone",      val: customer.phone ?? "—", editVal: editPhone, setVal: setEditPhone },
            ].map(({ label, key, val, editVal, setVal }) => (
              <div key={key} style={{ display: "grid", gridTemplateColumns: "1fr 2fr", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${t.border}` }}>
                <span style={{ fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.textDim, fontWeight: 500 }}>{label}</span>
                {editMode && key !== "email" ? (
                  <input value={editVal} onChange={e => setVal(e.target.value)} style={{ ...inp, padding: "9px 12px" }}
                    onFocus={e => e.currentTarget.style.borderColor = t.gold + "60"}
                    onBlur={e => e.currentTarget.style.borderColor = t.border}/>
                ) : (
                  <span style={{ fontSize: "13px", fontWeight: 300, color: t.text, letterSpacing: "0.01em" }}>{val}</span>
                )}
              </div>
            ))}

            <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: `1px solid ${t.border}` }}>
              <div style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "8px" }}>Password</div>
              <p style={{ fontSize: "12.5px", fontWeight: 300, color: t.textMuted, lineHeight: 1.7, marginBottom: "14px" }}>
                To change your password, use the password reset link sent to your email address.
              </p>
              <Link href={`mailto:support@luxus-collection.com?subject=Password Reset Request`}
                style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.gold, textDecoration: "none", borderBottom: `1px solid ${t.gold}50`, paddingBottom: "2px", fontWeight: 500 }}>
                Request Password Reset →
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
