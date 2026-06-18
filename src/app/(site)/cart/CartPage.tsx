'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/context/ThemeContext'
import { useCart, type CartItem } from '@/context/CartContext'
import { toggleWishlist } from '@/lib/auth'

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)

function ImgPlaceholder() {
  const { t } = useTheme()
  return (
    <div style={{ width: "96px", height: "96px", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${t.border}` }}>
      <svg width="20" height="20" viewBox="0 0 36 36" fill="none" opacity="0.18">
        <rect x="2" y="2" width="32" height="32" rx="1" stroke={t.gold} strokeWidth="0.8"/>
        <circle cx="12" cy="12" r="4" stroke={t.gold} strokeWidth="0.8"/>
        <path d="M2 26L11 17L17 23L25 13L34 23V34H2V26Z" stroke={t.gold} strokeWidth="0.8"/>
      </svg>
    </div>
  )
}

function CartItemRow({ item, index }: { item: CartItem; index: number }) {
  const { t } = useTheme()
  const { removeItem, updateQuantity } = useCart()
  const [removing, setRemoving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [savedToWishlist, setSavedToWishlist] = useState(false)

  const handleRemove = () => {
    if (!confirmRemove) { setConfirmRemove(true); return }
    setRemoving(true)
    setTimeout(() => removeItem(item.id), 300)
  }

  const handleSaveForLater = () => {
    toggleWishlist({
      handle: item.handle,
      title: item.title,
      brand: item.brand,
      caliber: null,
      action: null,
      price: item.price,
      contact_for_pricing: false,
      thumbnail: item.thumbnail,
    })
    setSavedToWishlist(true)
    setTimeout(() => {
      removeItem(item.id)
    }, 900)
  }

  return (
    <div
      className="lxs-cart-item"
      style={{ padding: "28px 0", borderBottom: `1px solid ${t.border}`, opacity: removing ? 0 : 1, transition: "opacity 0.3s" }}
    >
      {/* Thumbnail */}
      <Link href={`/product/${item.handle}`} style={{ textDecoration: "none", flexShrink: 0 }}>
        {item.thumbnail ? (
          <div style={{ width: "96px", height: "96px", position: "relative", border: `1px solid ${t.border}`, background: "#f9f9f9", flexShrink: 0 }}>
            <Image src={item.thumbnail} alt={item.title} fill style={{ objectFit: "contain" }} sizes="96px" />
          </div>
        ) : (
          <ImgPlaceholder />
        )}
      </Link>

      {/* Details */}
      <div>
        {item.brand && (
          <div style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "5px" }}>
            {item.brand}
          </div>
        )}
        <Link href={`/product/${item.handle}`} style={{ textDecoration: "none" }}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: "20px", fontWeight: 400, color: t.text, lineHeight: 1.2, marginBottom: "14px", letterSpacing: "0.01em" }}>
            {item.title}
          </div>
        </Link>

        {/* Quantity selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "16px" }}>
          <span style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginRight: "10px" }}>Qty</span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            style={{ width: "28px", height: "28px", background: "none", border: `1px solid ${t.border}`, cursor: item.quantity <= 1 ? "not-allowed" : "pointer", color: item.quantity <= 1 ? t.textDim : t.text, fontSize: "16px", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.2s", opacity: item.quantity <= 1 ? 0.4 : 1 }}
          >−</button>
          <div style={{ width: "36px", height: "28px", border: `1px solid ${t.border}`, borderLeft: "none", borderRight: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 400, color: t.text }}>
            {item.quantity}
          </div>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            style={{ width: "28px", height: "28px", background: "none", border: `1px solid ${t.border}`, cursor: "pointer", color: t.text, fontSize: "16px", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.2s" }}
          >+</button>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={handleRemove}
            onBlur={() => setTimeout(() => setConfirmRemove(false), 200)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 500, color: confirmRemove ? "#b05040" : t.textDim, transition: "color 0.2s", display: "flex", alignItems: "center", gap: "5px", padding: 0 }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 1L10 10M10 1L1 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            {confirmRemove ? "Confirm Remove" : "Remove"}
          </button>
          {!savedToWishlist ? (
            <button
              onClick={handleSaveForLater}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 500, color: t.textDim, transition: "color 0.2s", display: "flex", alignItems: "center", gap: "5px", padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = t.gold}
              onMouseLeave={e => e.currentTarget.style.color = t.textDim}
            >
              <svg width="11" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              Save for Later
            </button>
          ) : (
            <span style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5a9a5a", fontWeight: 500 }}>
              ✓ Saved to Wishlist
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "18px", fontWeight: 500, color: t.text, letterSpacing: "0.01em" }}>
          {fmt(item.price * item.quantity)}
        </div>
        {item.quantity > 1 && (
          <div style={{ fontSize: "10.5px", color: t.textMuted, fontWeight: 300, marginTop: "3px" }}>
            {fmt(item.price)} each
          </div>
        )}
      </div>
    </div>
  )
}

function OrderSummary({ items }: { items: CartItem[] }) {
  const { t } = useTheme()
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <div style={{ position: "sticky", top: "96px", background: "#fff", border: `1px solid ${t.border}`, padding: "28px" }}>
      <div style={{ fontSize: "8.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "14px", height: "1px", background: t.gold }}/>
        Order Summary
      </div>

      {/* Line items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px", paddingBottom: "20px", borderBottom: `1px solid ${t.border}` }}>
        {items.map(item => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: 300, color: t.text, lineHeight: 1.3, letterSpacing: "0.01em" }}>
                {item.title}{item.quantity > 1 ? ` ×${item.quantity}` : ""}
              </div>
            </div>
            <div style={{ fontSize: "12px", fontWeight: 400, color: t.text, flexShrink: 0 }}>{fmt(item.price * item.quantity)}</div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
        {[
          ["Subtotal", fmt(subtotal)],
          ["Shipping", "TBD at checkout"],
          ["Tax", "Calculated at checkout"],
        ].map(([label, val]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 300, color: t.textMuted, letterSpacing: "0.02em" }}>{label}</span>
            <span style={{ fontSize: "11.5px", fontWeight: 300, color: t.text }}>{val}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "16px 0", borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, marginBottom: "20px" }}>
        <span style={{ fontFamily: "var(--font-playfair)", fontSize: "18px", fontWeight: 400, color: t.text }}>Subtotal</span>
        <span style={{ fontFamily: "var(--font-playfair)", fontSize: "26px", fontWeight: 300, color: t.text }}>{fmt(subtotal)}</span>
      </div>

      <Link
        href="/checkout"
        style={{ width: "100%", padding: "15px", background: t.gold, color: "#fff", textDecoration: "none", fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 600, borderRadius: "1px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
      >
        <svg width="11" height="12" viewBox="0 0 11 12" fill="none"><path d="M5.5 0.5L10 3V6.5C10 9 8 10.8 5.5 11.5C3 10.8 1 9 1 6.5V3L5.5 0.5Z" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round"/></svg>
        Proceed to Checkout
      </Link>

      {/* Trust badges */}
      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "7px" }}>
        {[
          [<svg key="s" width="11" height="12" viewBox="0 0 11 12" fill="none"><path d="M5.5 0.5L10 3V6.5C10 9 8 10.8 5.5 11.5C3 10.8 1 9 1 6.5V3L5.5 0.5Z" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round"/></svg>, "Secure ordering — all data encrypted"],
          [<svg key="f" width="11" height="12" viewBox="0 0 11 12" fill="none"><path d="M5.5 1L10 3.5V6C10 8.5 8.5 10.5 5.5 11C2.5 10.5 1 8.5 1 6V3.5L5.5 1Z" stroke="currentColor" strokeWidth="0.9"/><path d="M3.5 6L5 7.5L7.5 4.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/></svg>, "FFL transfer required, all 50 states"],
          [<svg key="t" width="11" height="12" viewBox="0 0 11 12" fill="none"><rect x="0.5" y="3.5" width="10" height="8" rx="0.5" stroke="currentColor" strokeWidth="0.9"/><path d="M1 6H10" stroke="currentColor" strokeWidth="0.9"/><rect x="2" y="8" width="2" height="1" rx="0.2" fill="currentColor"/></svg>, "Visa · Mastercard · Amex · Wire Transfer"],
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
  const { t } = useTheme()
  const { cartItems, cartCount } = useCart()

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: "var(--font-inter)" }}>

      {/* Banner */}
      <div style={{ background: "linear-gradient(to bottom,#f3f3f5,#ffffff)", borderBottom: `1px solid ${t.border}`, padding: "36px 40px 28px" }}>
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
              <span style={{ color: t.text, fontWeight: 400 }}>{cartCount}</span> {cartCount === 1 ? "item" : "items"}
            </span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "48px 40px 96px" }}>
        {cartItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "96px 0" }}>
            <div style={{ width: "60px", height: "60px", border: `1px solid ${t.border}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="24" height="22" viewBox="0 0 24 22" fill="none" style={{ color: t.textDim }}>
                <path d="M1 1H4L6 15H18L20.5 6H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="19.5" r="1.3" fill="currentColor"/>
                <circle cx="16" cy="19.5" r="1.3" fill="currentColor"/>
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: "32px", fontWeight: 300, color: t.text, marginBottom: "12px" }}>Your cart is empty</div>
            <p style={{ fontSize: "13.5px", fontWeight: 300, color: t.textMuted, marginBottom: "32px", lineHeight: 1.7 }}>
              Browse our collection to find your next piece.
            </p>
            <Link href="/shop" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 32px", background: t.gold, color: "#fff", textDecoration: "none", fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600 }}>
              Browse Collection
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4H9M6 1L9 4L6 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        ) : (
          <div className="lxs-cart-layout">
            <div>
              {/* FFL notice */}
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "16px 18px", background: "#fff", border: `1px solid ${t.border}`, borderLeft: `2px solid ${t.gold}40`, marginBottom: "8px" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: t.gold, flexShrink: 0, marginTop: "1px" }}><path d="M8 1L14.5 4.5V8.5C14.5 12 11.5 14.5 8 15.5C4.5 14.5 1.5 12 1.5 8.5V4.5L8 1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/><path d="M5.5 8L7 9.5L10.5 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div>
                  <div style={{ fontSize: "8.5px", letterSpacing: "0.15em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "3px" }}>FFL Transfer Required</div>
                  <p style={{ fontSize: "12px", fontWeight: 300, color: t.textMuted, lineHeight: 1.65 }}>
                    All firearms ship to a licensed FFL dealer near you. Your dealer information will be collected when you contact us to complete your order.{" "}
                    <Link href="/support#ffl" style={{ color: t.gold, textDecoration: "none", borderBottom: `1px solid ${t.gold}50` }}>Learn more →</Link>
                  </p>
                </div>
              </div>

              {/* Column headers */}
              <div className="lxs-cart-item" style={{ padding: "12px 0", borderBottom: `1px solid ${t.border}` }}>
                {["Item", "", "Price"].map((h, i) => (
                  <span key={i} style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, textAlign: i === 2 ? "right" : "left" }}>{h}</span>
                ))}
              </div>

              {cartItems.map((item, i) => (
                <CartItemRow key={item.id} item={item} index={i} />
              ))}

              <div style={{ marginTop: "24px" }}>
                <Link href="/shop"
                  style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.textMuted, textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = t.gold}
                  onMouseLeave={e => e.currentTarget.style.color = t.textMuted}>
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M7 1L1 6L7 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Continue Shopping
                </Link>
              </div>
            </div>

            <OrderSummary items={cartItems} />
          </div>
        )}
      </div>
    </div>
  )
}
