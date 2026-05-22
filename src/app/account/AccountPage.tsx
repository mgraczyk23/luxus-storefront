'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)

const MOCK_USER = { firstName: "James", lastName: "Whitfield", email: "james@example.com", phone: "(615) 555-0142", memberSince: "March 2026" }

const MOCK_ORDERS = [
  { id: "LXC-109842", date: "May 14, 2026", status: "In Transit", statusCode: "transit",
    items: [{ title: "Nighthawk Custom Agent", brand: "Nighthawk Custom", caliber: ".45 ACP", price: 3499 }],
    total: 3499, ffl: "Ace Gun Shop, Nashville TN", tracking: "786192847365" },
  { id: "LXC-098311", date: "Apr 2, 2026", status: "Delivered", statusCode: "delivered",
    items: [{ title: "SIG Sauer P210 Legend", brand: "SIG Sauer", caliber: "9mm", price: 2199 }],
    total: 2199, ffl: "Premier Arms, Franklin TN", tracking: "786192847200" },
  { id: "LXC-087104", date: "Feb 18, 2026", status: "Delivered", statusCode: "delivered",
    items: [{ title: "Colt Python 6-inch", brand: "Colt", caliber: ".357 Magnum", price: 1899 }],
    total: 1899, ffl: "Ace Gun Shop, Nashville TN", tracking: "786192846901" },
]

const MOCK_WISHLIST = [
  { id: 1, title: "Cabot Guns American Joe", brand: "Cabot Guns", caliber: ".45 ACP", action: "Single Action", price: null as number|null, contact_for_pricing: true },
  { id: 2, title: "Korth NXS Revolver", brand: "Korth", caliber: ".357 Magnum", action: "DA / SA", price: 6800, contact_for_pricing: false },
  { id: 3, title: "Wilson Combat Supergrade", brand: "Wilson Combat", caliber: ".45 ACP", action: "Single Action", price: 4950, contact_for_pricing: false },
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  transit:    { bg: "#c09530", text: "#0a0a0a" },
  delivered:  { bg: "#4a8a4a", text: "#fff" },
  processing: { bg: "#3a6a8a", text: "#fff" },
  cancelled:  { bg: "#8a4a4a", text: "#fff" },
}

function StatusBadge({ code, label }: { code: string; label: string }) {
  const c = STATUS_COLORS[code] || STATUS_COLORS.processing
  return (
    <span style={{ padding: "3px 10px", background: c.bg + "22", border: `1px solid ${c.bg}55`, fontSize: "8.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: c.bg, fontWeight: 500 }}>{label}</span>
  )
}

function ImgBox({ index = 0, style = {} }: { index?: number; style?: React.CSSProperties }) {
  const { isDark, t } = useTheme()
  const d = ["#171717,#222222", "#1a1a1a,#262626", "#161616,#1e1e1e"]
  const l = ["#e8e8eb,#d4d4d8", "#e8e8eb,#d4d4d8", "#e8e8eb,#d4d4d8"]
  const [c1, c2] = (isDark ? d : l)[index % 3].split(",")
  return (
    <div style={{ background: `linear-gradient(140deg,${c1},${c2})`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, ...style }}>
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
  { id: "settings", label: "Account Details",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1"/><path d="M1.5 12.5C1.5 10.015 4.015 8 7 8C9.985 8 12.5 10.015 12.5 12.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg> },
]

export default function AccountPage() {
  const { isDark, t } = useTheme()
  const [tab, setTab]             = useState("orders")
  const [expandedOrder, setExpandedOrder] = useState<string|null>(null)
  const [editMode, setEditMode]   = useState(false)

  const inp: React.CSSProperties = { width: "100%", padding: "11px 14px", background: isDark ? "#0a0a0a" : "#ffffff", border: `1px solid ${t.border}`, color: t.text, fontSize: "12.5px", fontFamily: "var(--font-inter)", fontWeight: 300, letterSpacing: "0.02em", outline: "none", borderRadius: "1px" }

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "var(--font-inter)" }}>
      <div style={{ paddingTop: "68px" }}>
        {/* Banner */}
        <div style={{ background: isDark ? "linear-gradient(to bottom,#161616,#0a0a0a)" : "linear-gradient(to bottom,#f3f3f5,#ffffff)", borderBottom: `1px solid ${t.border}`, padding: "40px 40px 0" }}>
          <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: "28px", borderBottom: `1px solid ${t.border}` }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <div style={{ width: "18px", height: "1px", background: t.gold }}/>
                  <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>My Account</span>
                </div>
                <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(26px,3vw,40px)", fontWeight: 400, color: t.text, lineHeight: 1.1 }}>
                  Welcome back, {MOCK_USER.firstName}.
                </h1>
                <div style={{ fontSize: "11.5px", color: t.textDim, fontWeight: 300, marginTop: "6px" }}>Member since {MOCK_USER.memberSince} · {MOCK_USER.email}</div>
              </div>
              <button style={{ padding: "9px 20px", background: "transparent", border: `1px solid ${t.border}`, color: t.textMuted, fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 500, cursor: "pointer", transition: "all 0.18s" }}
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
                <span style={{ fontSize: "11px", color: t.textDim, fontWeight: 300 }}><span style={{ color: t.text, fontWeight: 400 }}>{MOCK_ORDERS.length}</span> orders</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {MOCK_ORDERS.map(order => (
                  <div key={order.id} style={{ border: `1px solid ${expandedOrder === order.id ? t.gold + "50" : t.border}`, transition: "border-color 0.22s" }}>
                    <div className="lxs-order-head" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "20px", padding: "18px 22px", alignItems: "center", cursor: "pointer", background: isDark ? "#161616" : "#fff" }}
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                      <div>
                        <div style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "4px" }}>Order</div>
                        <div style={{ fontFamily: "var(--font-playfair)", fontSize: "15px", fontWeight: 400, color: t.gold }}>{order.id}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "4px" }}>Date</div>
                        <div style={{ fontSize: "12px", fontWeight: 300, color: t.text }}>{order.date}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "4px" }}>Status</div>
                        <StatusBadge code={order.statusCode} label={order.status}/>
                      </div>
                      <div>
                        <div style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "4px" }}>Total</div>
                        <div style={{ fontFamily: "var(--font-playfair)", fontSize: "16px", fontWeight: 400, color: t.text }}>{fmt(order.total)}</div>
                      </div>
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transition: "transform 0.25s", transform: expandedOrder === order.id ? "rotate(180deg)" : "none", color: t.textDim, flexShrink: 0 }}>
                        <path d="M0.5 0.5L5 5L9.5 0.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div style={{ overflow: "hidden", maxHeight: expandedOrder === order.id ? "500px" : "0", transition: "max-height 0.3s ease" }}>
                      <div style={{ padding: "20px 22px", borderTop: `1px solid ${t.border}`, background: isDark ? "#0e0e0e" : "#fafafa" }}>
                        {order.items.map((item, i) => (
                          <div key={i} style={{ display: "flex", gap: "14px", alignItems: "center", marginBottom: "14px" }}>
                            <ImgBox index={i} style={{ width: "56px", height: "56px", border: `1px solid ${t.border}` }}/>
                            <div>
                              <div style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "3px" }}>{item.brand}</div>
                              <div style={{ fontFamily: "var(--font-playfair)", fontSize: "15px", fontWeight: 400, color: t.text, marginBottom: "2px" }}>{item.title}</div>
                              <div style={{ fontSize: "10.5px", color: t.textDim, fontWeight: 300 }}>{item.caliber} · {fmt(item.price)}</div>
                            </div>
                          </div>
                        ))}
                        <div className="lxs-order-meta" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", paddingTop: "14px", borderTop: `1px solid ${t.border}` }}>
                          <div>
                            <div style={{ fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "4px" }}>FFL Dealer</div>
                            <div style={{ fontSize: "12px", fontWeight: 300, color: t.text }}>{order.ffl}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "4px" }}>Tracking</div>
                            <div style={{ fontSize: "12px", fontWeight: 300, color: t.gold, letterSpacing: "0.04em" }}>{order.tracking}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-end", gap: "18px", flexWrap: "wrap" }}>
                            <Link href={`/invoice/${order.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.gold, textDecoration: "none", borderBottom: `1px solid ${t.gold}50`, paddingBottom: "2px", fontWeight: 500 }}
                              onMouseEnter={e => e.currentTarget.style.color = t.goldLight} onMouseLeave={e => e.currentTarget.style.color = t.gold}>
                              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0 }}>
                                <path d="M5.5 0.5V7.5M5.5 7.5L2.5 4.5M5.5 7.5L8.5 4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M1 10H10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                              </svg>
                              Download Invoice
                            </Link>
                            <Link href={`/support?order=${order.id}`} style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.textMuted, textDecoration: "none", borderBottom: `1px solid ${t.border}`, paddingBottom: "2px", fontWeight: 500 }}
                              onMouseEnter={e => e.currentTarget.style.color = t.gold} onMouseLeave={e => e.currentTarget.style.color = t.textMuted}>
                              Order Support →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── WISHLIST ── */}
          {tab === "wishlist" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
                <div style={{ fontFamily: "var(--font-playfair)", fontSize: "24px", fontWeight: 400, color: t.text }}>Saved Pieces</div>
                <span style={{ fontSize: "11px", color: t.textDim, fontWeight: 300 }}><span style={{ color: t.text, fontWeight: 400 }}>{MOCK_WISHLIST.length}</span> items</span>
              </div>
              <div className="lxs-wishlist-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
                {MOCK_WISHLIST.map((item, i) => (
                  <div key={item.id} style={{ border: `1px solid ${t.border}`, background: t.bgCard, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <ImgBox index={i} style={{ height: "180px", flexShrink: 0 }}/>
                    <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
                      <div style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "4px" }}>{item.brand}</div>
                      <div style={{ fontFamily: "var(--font-playfair)", fontSize: "17px", fontWeight: 400, color: t.text, lineHeight: 1.25, marginBottom: "4px" }}>{item.title}</div>
                      <div style={{ fontSize: "11px", color: t.textMuted, fontWeight: 300, marginBottom: "14px" }}>{item.caliber} · {item.action}</div>
                      <div style={{ height: "1px", background: t.border, marginBottom: "12px", marginTop: "auto" }}/>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontSize: item.contact_for_pricing ? "10px" : "14px", fontWeight: item.contact_for_pricing ? 400 : 500, color: item.contact_for_pricing ? t.gold : t.text, letterSpacing: item.contact_for_pricing ? "0.04em" : "0.01em" }}>
                          {item.contact_for_pricing ? "Contact for Pricing" : fmt(item.price!)}
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <Link href={`/product/${item.id}`} style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.gold, textDecoration: "none", borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px", fontWeight: 500 }}>View</Link>
                          <span style={{ fontSize: "9px", color: t.textDim, cursor: "pointer", transition: "color 0.18s" }}
                            onMouseEnter={e => e.currentTarget.style.color = "#b05040"}
                            onMouseLeave={e => e.currentTarget.style.color = t.textDim}>Remove</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ACCOUNT SETTINGS ── */}
          {tab === "settings" && (
            <div style={{ maxWidth: "640px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
                <div style={{ fontFamily: "var(--font-playfair)", fontSize: "24px", fontWeight: 400, color: t.text }}>Account Details</div>
                <button onClick={() => setEditMode(!editMode)}
                  style={{ padding: "8px 18px", background: "transparent", border: `1px solid ${editMode ? t.gold + "60" : t.border}`, color: editMode ? t.gold : t.textMuted, fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}>
                  {editMode ? "Save Changes" : "Edit"}
                </button>
              </div>
              {[
                { label: "First Name", val: MOCK_USER.firstName },
                { label: "Last Name",  val: MOCK_USER.lastName },
                { label: "Email Address", val: MOCK_USER.email },
                { label: "Phone Number",  val: MOCK_USER.phone },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: "grid", gridTemplateColumns: "1fr 2fr", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${t.border}` }}>
                  <span style={{ fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.textDim, fontWeight: 500 }}>{label}</span>
                  {editMode ? (
                    <input defaultValue={val} style={{ ...inp, padding: "9px 12px" }}
                      onFocus={e => e.currentTarget.style.borderColor = t.gold + "60"}
                      onBlur={e => e.currentTarget.style.borderColor = t.border}/>
                  ) : (
                    <span style={{ fontSize: "13px", fontWeight: 300, color: t.text, letterSpacing: "0.01em" }}>{val}</span>
                  )}
                </div>
              ))}
              <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: `1px solid ${t.border}` }}>
                <div style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "16px" }}>Change Password</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {["Current Password", "New Password", "Confirm New Password"].map(l => (
                    <div key={l}>
                      <label style={{ display: "block", fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "6px" }}>{l}</label>
                      <input type="password" placeholder="••••••••••" style={inp}
                        onFocus={e => e.currentTarget.style.borderColor = t.gold + "60"}
                        onBlur={e => e.currentTarget.style.borderColor = t.border}/>
                    </div>
                  ))}
                  <button style={{ alignSelf: "flex-start", padding: "11px 24px", background: t.gold, border: "none", color: isDark ? "#0a0a0a" : "#fff", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 600, cursor: "pointer", borderRadius: "1px", transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = t.goldLight}
                    onMouseLeave={e => e.currentTarget.style.background = t.gold}>Update Password</button>
                </div>
              </div>
              <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: `1px solid ${t.border}` }}>
                <div style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#b05040", fontWeight: 500, marginBottom: "8px" }}>Danger Zone</div>
                <button style={{ padding: "9px 18px", background: "transparent", border: "1px solid #8a4a4a55", color: "#b05040", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 500, cursor: "pointer", transition: "all 0.18s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#b05040"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#8a4a4a55"}>
                  Delete Account
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
