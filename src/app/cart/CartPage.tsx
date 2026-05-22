'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'

const INITIAL_CART = [
  { id: 1, title: "Nighthawk Custom Agent", brand: "Nighthawk Custom", sku: "NHC-AGENT-45-OD", caliber: ".45 ACP", action: "Single Action", barrel: '5"', finish: "DLC Black", price: 3499 },
  { id: 2, title: "SIG Sauer P210 Legend", brand: "SIG Sauer", sku: "SIG-P210-9-LEG", caliber: "9mm", action: "Single Action", barrel: '4.7"', finish: "Nitron Stainless", price: 2199 },
]

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)

function ImgBox({ index = 0, style = {} }: { index?: number; style?: React.CSSProperties }) {
  const { isDark, t } = useTheme()
  const d = ["#171717,#222222", "#1a1a1a,#262626", "#161616,#1e1e1e"]
  const l = ["#e8e8eb,#d4d4d8", "#e8e8eb,#d4d4d8", "#e8e8eb,#d4d4d8"]
  const [c1, c2] = (isDark ? d : l)[index % 3].split(",")
  return (
    <div style={{ background: `linear-gradient(140deg,${c1},${c2})`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, ...style }}>
      <svg width="20" height="20" viewBox="0 0 36 36" fill="none" opacity="0.15">
        <rect x="2" y="2" width="32" height="32" rx="1" stroke={t.gold} strokeWidth="0.8"/>
        <circle cx="12" cy="12" r="4" stroke={t.gold} strokeWidth="0.8"/>
        <path d="M2 26L11 17L17 23L25 13L34 23V34H2V26Z" stroke={t.gold} strokeWidth="0.8"/>
      </svg>
    </div>
  )
}

function CartItem({ item, onRemove, index }: { item: typeof INITIAL_CART[0]; onRemove: (id: number) => void; index: number }) {
  const { isDark, t } = useTheme()
  const [removing, setRemoving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const handleRemove = () => {
    if (!confirmRemove) { setConfirmRemove(true); return }
    setRemoving(true)
    setTimeout(() => onRemove(item.id), 300)
  }

  return (
    <div className="lxs-cart-item" style={{ padding: "28px 0", borderBottom: `1px solid ${t.border}`, opacity: removing ? 0 : 1, transition: "opacity 0.3s" }}>
      <Link href={`/product/${item.sku.toLowerCase()}`} style={{ textDecoration: "none" }}>
        <ImgBox index={index} style={{ width: "96px", height: "96px", border: `1px solid ${t.border}` }}/>
      </Link>

      <div>
        <div style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "5px" }}>{item.brand}</div>
        <Link href={`/product/${item.sku.toLowerCase()}`} style={{ textDecoration: "none" }}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: "20px", fontWeight: 400, color: t.text, lineHeight: 1.2, marginBottom: "6px", letterSpacing: "0.01em" }}>{item.title}</div>
        </Link>
        <div style={{ fontSize: "11px", color: t.textMuted, fontWeight: 300, letterSpacing: "0.04em", marginBottom: "14px" }}>
          {item.caliber} · {item.action} · Barrel {item.barrel} · {item.finish}
        </div>
        <div style={{ fontSize: "9px", color: t.textDim, letterSpacing: "0.08em" }}>SKU: {item.sku}</div>
        <div style={{ display: "flex", alignItems: "center", marginTop: "18px" }}>
          <button onClick={handleRemove} onBlur={() => setTimeout(() => setConfirmRemove(false), 200)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 500, color: confirmRemove ? "#b05040" : t.textDim, transition: "color 0.2s", display: "flex", alignItems: "center", gap: "5px", padding: 0 }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 1L10 10M10 1L1 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            {confirmRemove ? "Confirm Remove" : "Remove"}
          </button>
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "18px", fontWeight: 500, color: t.text, letterSpacing: "0.01em" }}>{fmt(item.price)}</div>
        <button style={{ marginTop: "10px", background: "none", border: "none", cursor: "pointer", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: t.textDim, fontFamily: "var(--font-inter)", fontWeight: 400, transition: "color 0.18s" }}
          onMouseEnter={e => e.currentTarget.style.color = t.gold}
          onMouseLeave={e => e.currentTarget.style.color = t.textDim}>
          Save for later
        </button>
      </div>
    </div>
  )
}

function OrderSummary({ cart, onCheckout }: { cart: typeof INITIAL_CART; onCheckout: () => void }) {
  const { isDark, t } = useTheme()
  const [promoCode, setPromoCode] = useState("")
  const [promoStatus, setPromoStatus] = useState<"idle"|"applied"|"invalid">("idle")
  const [discount, setDiscount] = useState(0)
  const [showPromo, setShowPromo] = useState(false)

  const subtotal = cart.reduce((s, i) => s + i.price, 0)
  const total = subtotal - discount

  const applyPromo = () => {
    if (promoCode.toUpperCase() === "COLLECTOR10") {
      setDiscount(Math.round(subtotal * 0.1))
      setPromoStatus("applied")
    } else {
      setPromoStatus("invalid")
      setTimeout(() => setPromoStatus("idle"), 2500)
    }
  }

  return (
    <div style={{ position: "sticky", top: "96px", background: isDark ? "#161616" : "#fff", border: `1px solid ${t.border}`, padding: "28px" }}>
      <div style={{ fontSize: "8.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "14px", height: "1px", background: t.gold }}/>
        Order Summary
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px", paddingBottom: "20px", borderBottom: `1px solid ${t.border}` }}>
        {cart.map(item => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: 300, color: t.text, lineHeight: 1.3, letterSpacing: "0.01em" }}>{item.title}</div>
              <div style={{ fontSize: "10px", color: t.textDim, fontWeight: 300, marginTop: "2px" }}>{item.sku}</div>
            </div>
            <div style={{ fontSize: "12px", fontWeight: 400, color: t.text, flexShrink: 0 }}>{fmt(item.price)}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
        {[["Subtotal", fmt(subtotal)], ["Shipping", "Free"], ["Tax", "Calculated at checkout"]].map(([label, val]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 300, color: t.textMuted, letterSpacing: "0.02em" }}>{label}</span>
            <span style={{ fontSize: "11.5px", fontWeight: label === "Shipping" ? 400 : 300, color: label === "Shipping" ? "#5a9a5a" : t.text }}>{val}</span>
          </div>
        ))}
        {discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 300, color: "#5a9a5a" }}>
              Promo (COLLECTOR10)
              <button onClick={() => { setDiscount(0); setPromoCode(""); setPromoStatus("idle") }} style={{ background: "none", border: "none", cursor: "pointer", color: t.textDim, marginLeft: "6px", fontSize: "9px", padding: 0 }}>✕</button>
            </span>
            <span style={{ fontSize: "11.5px", fontWeight: 400, color: "#5a9a5a" }}>−{fmt(discount)}</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "16px 0", borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, marginBottom: "20px" }}>
        <span style={{ fontFamily: "var(--font-playfair)", fontSize: "18px", fontWeight: 400, color: t.text }}>Total</span>
        <span style={{ fontFamily: "var(--font-playfair)", fontSize: "26px", fontWeight: 300, color: t.text }}>{fmt(total)}</span>
      </div>

      {!showPromo && discount === 0 && (
        <button onClick={() => setShowPromo(true)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.textDim, fontFamily: "var(--font-inter)", fontWeight: 500, marginBottom: "16px", transition: "color 0.18s", padding: 0, display: "block" }}
          onMouseEnter={e => e.currentTarget.style.color = t.gold}
          onMouseLeave={e => e.currentTarget.style.color = t.textDim}>
          + Add Promo Code
        </button>
      )}
      {showPromo && discount === 0 && (
        <div style={{ display: "flex", marginBottom: "16px" }}>
          <input type="text" placeholder="Enter code" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && applyPromo()}
            style={{ flex: 1, padding: "9px 12px", background: isDark ? "#0a0a0a" : "#ffffff", border: `1px solid ${promoStatus === "invalid" ? "#b05040" : promoStatus === "applied" ? "#5a9a5a" : t.border}`, borderRight: "none", color: t.text, fontSize: "12px", fontFamily: "var(--font-inter)", outline: "none", letterSpacing: "0.06em", textTransform: "uppercase" }}/>
          <button onClick={applyPromo}
            style={{ padding: "9px 16px", background: t.gold, color: isDark ? "#0a0a0a" : "#fff", border: "none", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 600, cursor: "pointer" }}>
            Apply
          </button>
        </div>
      )}
      {promoStatus === "invalid" && <div style={{ fontSize: "10.5px", color: "#b05040", marginBottom: "10px", fontWeight: 300 }}>Code not recognised, please check and try again.</div>}

      <button onClick={onCheckout}
        style={{ width: "100%", padding: "15px", background: t.gold, border: "none", color: isDark ? "#0a0a0a" : "#fff", fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 600, cursor: "pointer", borderRadius: "1px", transition: "background 0.22s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        onMouseEnter={e => e.currentTarget.style.background = t.goldLight}
        onMouseLeave={e => e.currentTarget.style.background = t.gold}>
        Proceed to Checkout
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4H9M6 1L9 4L6 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "7px" }}>
        {[
          [<svg key="s" width="11" height="12" viewBox="0 0 11 12" fill="none"><path d="M5.5 0.5L10 3V6.5C10 9 8 10.8 5.5 11.5C3 10.8 1 9 1 6.5V3L5.5 0.5Z" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round"/></svg>, "Secure 256-bit SSL checkout"],
          [<svg key="f" width="11" height="12" viewBox="0 0 11 12" fill="none"><path d="M5.5 1L10 3.5V6C10 8.5 8.5 10.5 5.5 11C2.5 10.5 1 8.5 1 6V3.5L5.5 1Z" stroke="currentColor" strokeWidth="0.9"/><path d="M3.5 6L5 7.5L7.5 4.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/></svg>, "FFL transfer required, all 50 states"],
          [<svg key="t" width="11" height="12" viewBox="0 0 11 12" fill="none"><rect x="0.5" y="3.5" width="10" height="8" rx="0.5" stroke="currentColor" strokeWidth="0.9"/><path d="M1 6H10" stroke="currentColor" strokeWidth="0.9"/><rect x="2" y="8" width="2" height="1" rx="0.2" fill="currentColor"/></svg>, "Visa · Mastercard · Amex · Discover · Wire"],
        ].map(([icon, label]) => (
          <div key={label as string} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: t.textDim, flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: "10px", color: t.textDim, fontWeight: 300, letterSpacing: "0.02em" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CartPage() {
  const { isDark, t } = useTheme()
  const [cart, setCart] = useState(INITIAL_CART)

  const removeItem = (id: number) => setCart(c => c.filter(i => i.id !== id))

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: "var(--font-inter)" }}>

      {/* Banner */}
      <div style={{ background: isDark ? "linear-gradient(to bottom,#161616,#0a0a0a)" : "linear-gradient(to bottom,#f3f3f5,#ffffff)", borderBottom: `1px solid ${t.border}`, padding: "36px 40px 28px" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            {["Home", "Shop", "Cart"].map((c, i, a) => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {i > 0 && <span style={{ fontSize: "9px", color: t.textDim }}>›</span>}
                <span style={{ fontSize: "10px", color: i < a.length - 1 ? t.textDim : t.textMuted, fontWeight: 300 }}>
                  {i < a.length - 1 ? <Link href={i === 0 ? "/" : "/shop"} style={{ textDecoration: "none", color: "inherit" }}>{c}</Link> : c}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(28px,3vw,44px)", fontWeight: 300, color: t.text, letterSpacing: "0.01em" }}>Your Cart</h1>
            <span style={{ fontSize: "11px", color: t.textMuted, fontWeight: 300 }}>
              <span style={{ color: t.text, fontWeight: 400 }}>{cart.length}</span> {cart.length === 1 ? "item" : "items"}
            </span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "48px 40px 96px" }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: "center", padding: "96px 0" }}>
            <div style={{ width: "60px", height: "60px", border: `1px solid ${t.border}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="24" height="22" viewBox="0 0 24 22" fill="none" style={{ color: t.textDim }}>
                <path d="M1 1H4L6 15H18L20.5 6H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="19.5" r="1.3" fill="currentColor"/>
                <circle cx="16" cy="19.5" r="1.3" fill="currentColor"/>
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: "32px", fontWeight: 300, color: t.text, marginBottom: "12px" }}>Your cart is empty</div>
            <p style={{ fontSize: "13.5px", fontWeight: 300, color: t.textMuted, marginBottom: "32px", lineHeight: 1.7 }}>Browse our collection to find your next piece.</p>
            <Link href="/shop" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 32px", background: t.gold, color: isDark ? "#0a0a0a" : "#fff", textDecoration: "none", fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600 }}>
              Browse Collection
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4H9M6 1L9 4L6 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        ) : (
          <div className="lxs-cart-layout">
            <div>
              {/* FFL notice */}
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "16px 18px", background: isDark ? "#161616" : "#fff", border: `1px solid ${t.border}`, borderLeft: `2px solid ${t.gold}40`, marginBottom: "8px" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: t.gold, flexShrink: 0, marginTop: "1px" }}><path d="M8 1L14.5 4.5V8.5C14.5 12 11.5 14.5 8 15.5C4.5 14.5 1.5 12 1.5 8.5V4.5L8 1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/><path d="M5.5 8L7 9.5L10.5 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div>
                  <div style={{ fontSize: "8.5px", letterSpacing: "0.15em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "3px" }}>FFL Transfer Required</div>
                  <p style={{ fontSize: "12px", fontWeight: 300, color: t.textMuted, lineHeight: 1.65 }}>
                    All firearms ship to a licensed FFL dealer near you. You&apos;ll provide your dealer&apos;s information at checkout.{" "}
                    <Link href="/faq" style={{ color: t.gold, textDecoration: "none", borderBottom: `1px solid ${t.gold}50` }}>Learn more about FFL transfers →</Link>
                  </p>
                </div>
              </div>

              {/* Column headers */}
              <div className="lxs-cart-item" style={{ padding: "12px 0", borderBottom: `1px solid ${t.border}` }}>
                {["Item", "", "Price"].map((h, i) => (
                  <span key={i} style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, textAlign: i === 2 ? "right" : "left" }}>{h}</span>
                ))}
              </div>

              {cart.map((item, i) => (
                <CartItem key={item.id} item={item} onRemove={removeItem} index={i}/>
              ))}

              <div style={{ marginTop: "24px" }}>
                <Link href="/shop" style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.textMuted, textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = t.gold}
                  onMouseLeave={e => e.currentTarget.style.color = t.textMuted}>
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M7 1L1 6L7 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Continue Shopping
                </Link>
              </div>

              {/* Saved for later */}
              <div style={{ marginTop: "52px", paddingTop: "32px", borderTop: `1px solid ${t.border}` }}>
                <div style={{ fontSize: "8.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "16px" }}>Saved for Later</div>
                <div style={{ padding: "24px", background: isDark ? "#161616" : "#fafafa", border: `1px solid ${t.border}`, borderStyle: "dashed", textAlign: "center" }}>
                  <p style={{ fontSize: "12.5px", fontWeight: 300, color: t.textDim, lineHeight: 1.65 }}>
                    Items you save for later will appear here.{" "}
                    <Link href="/shop" style={{ color: t.gold, textDecoration: "none" }}>Browse the collection →</Link>
                  </p>
                </div>
              </div>
            </div>

            <OrderSummary cart={cart} onCheckout={() => { window.location.href = "/checkout" }}/>
          </div>
        )}
      </div>
    </div>
  )
}
