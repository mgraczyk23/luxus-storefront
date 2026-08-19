'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { useCart } from '@/context/CartContext'
import { isWishlisted, toggleWishlist } from '@/lib/auth'
import type { SiteSettings, FeaturedPageText } from '@/lib/payload'
import type { MappedProduct } from '@/lib/medusa'

const PLAYFAIR = "var(--font-playfair), serif"
const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)

function ProductCard({ product }: { product: MappedProduct }) {
  const { t } = useTheme()
  const { addItem } = useCart()

  const [hov, setHov] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => { setWishlisted(isWishlisted(product.handle)) }, [product.handle])

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const next = toggleWishlist({ handle: product.handle, title: product.title, brand: product.brand, caliber: product.attributes?.caliber ?? null, action: product.attributes?.action ?? null, price: product.price, contact_for_pricing: product.contact_for_pricing, thumbnail: product.thumbnail })
    setWishlisted(next)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 1800)
  }

  return (
    <Link href={`/product/${product.handle}`}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? t.bgCardHover : t.bgCard,
        border: `1px solid ${hov ? t.gold + "55" : t.border}`,
        borderRadius: "1px", overflow: "hidden",
        textDecoration: "none", color: "inherit",
        transition: "all 0.28s ease",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov ? `0 16px 48px rgba(0,0,0,0.1),0 0 0 1px ${t.gold}25` : "0 2px 8px rgba(0,0,0,0.05)",
        cursor: "pointer", fontFamily: "var(--font-inter)",
        display: "flex", flexDirection: "column", flex: 1, height: "100%",
      }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden", flexShrink: 0, background: "#ffffff" }}>
        {product.thumbnail
          ? <Image src={product.thumbnail} alt={[product.attributes?.brand, product.title, product.attributes?.caliber, product.attributes?.action].filter(Boolean).join(' ')} fill style={{ objectFit: "contain", filter: !product.in_stock ? "grayscale(0.55) brightness(0.78)" : "none" }} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"/>
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", filter: !product.in_stock ? "grayscale(0.55) brightness(0.78)" : "none" }}><svg width="32" height="32" viewBox="0 0 36 36" fill="none" opacity="0.15"><rect x="2" y="2" width="32" height="32" rx="1" stroke={t.gold} strokeWidth="0.8"/><circle cx="12" cy="13" r="3.5" stroke={t.gold} strokeWidth="0.8"/><path d="M2 25L10 17L16 22L24 12L34 22V34H2V25Z" stroke={t.gold} strokeWidth="0.8"/></svg></div>}
        {product.details?.primary_category && product.in_stock && (
          <div className="lxs-card-badge-cat" style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(255,255,255,0.88)", border: `1px solid ${t.gold}50`, padding: "3px 9px", fontSize: "8.5px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: t.gold, backdropFilter: "blur(6px)" }}>
            {product.details.primary_category}
          </div>
        )}
      </div>
      <div style={{ padding: "18px 20px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div className="lxs-card-brand" style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "5px" }}>
          {product.attributes?.brand}
        </div>
        <div className="lxs-card-title" style={{ fontFamily: PLAYFAIR, fontSize: "19px", fontWeight: 400, color: t.text, lineHeight: 1.2, marginBottom: "5px" }}>
          {product.title}
        </div>
        <div className="lxs-card-sub" style={{ fontSize: "10.5px", color: t.textMuted, fontWeight: 300, letterSpacing: "0.04em", marginBottom: "13px" }}>
          {[product.attributes?.caliber, product.attributes?.action].filter(Boolean).join(" · ")}
        </div>
        <div style={{ height: "1px", background: t.border, marginBottom: "13px", marginTop: "auto" }}/>
        <div className={`lxs-card-price-row${product.contact_for_pricing ? ' lxs-card-cfp-row' : ''}`} style={{ display: "flex", alignItems: "center", justifyContent: product.in_stock ? "space-between" : "flex-end", gap: "8px" }}>
          {product.in_stock && (
            <div className={`lxs-card-price${product.contact_for_pricing ? ' lxs-card-price-cfp' : ''}`} style={{ fontSize: product.contact_for_pricing ? "10px" : "15px", fontWeight: product.contact_for_pricing ? 400 : 500, color: product.contact_for_pricing ? t.gold : t.text, letterSpacing: product.contact_for_pricing ? "0.04em" : "0.01em" }}>
              {product.contact_for_pricing ? "Contact Us" : product.price !== null ? fmt(product.price) : "—"}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <button
              onClick={handleHeartClick}
              title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center", color: wishlisted ? "#c0392b" : t.textMuted, opacity: hov || wishlisted ? 1 : 0.55, transition: "all 0.2s" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            {!product.in_stock || product.contact_for_pricing ? (
              <span
                style={{ cursor: "pointer", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, color: t.gold, borderBottom: `1px solid ${t.gold}55`, paddingBottom: "1px", opacity: hov ? 1 : 0.65, transition: "opacity 0.2s" }}
              >
                View Details
              </span>
            ) : (
              <button
                onClick={handleAddToCart}
                style={{
                  background: addedToCart ? t.gold : "transparent",
                  border: `1px solid ${t.gold}`,
                  color: addedToCart ? "#fff" : t.gold,
                  fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase",
                  fontWeight: 600, padding: "5px 10px", cursor: "pointer",
                  transition: "all 0.2s", whiteSpace: "nowrap",
                }}
              >
                {addedToCart ? "Added ✓" : "Add to Cart"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function FeaturedPage({ settings, text, products }: {
  settings: SiteSettings
  text: FeaturedPageText
  products: MappedProduct[]
}) {
  const { t } = useTheme()

  const c = {
    headline:       text.headline       ?? "Featured Collection",
    introParagraph: text.introParagraph ?? "A hand-curated selection of exceptional pieces chosen for provenance, craftsmanship, and rarity. Each firearm in this collection represents the standard we hold every acquisition to.",
  }

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: "var(--font-inter)" }}>

      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(to bottom,#f3f3f5,#ffffff)", borderBottom: `1px solid ${t.border}`, padding: "52px 40px" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
            {["Home", "Featured"].map((crumb, i, arr) => (
              <div key={crumb} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {i > 0 && <span style={{ fontSize: "9px", color: t.textDim }}>›</span>}
                <span style={{ fontSize: "10px", color: i < arr.length - 1 ? t.textDim : t.textMuted, fontWeight: 300 }}>
                  {i < arr.length - 1 ? <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>{crumb}</Link> : crumb}
                </span>
              </div>
            ))}
          </div>
          <h1 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(36px,4.5vw,62px)", fontWeight: 300, color: t.text, lineHeight: 1.07, letterSpacing: "0.01em", marginBottom: "18px" }}>
            {c.headline}
          </h1>
          <p style={{ fontSize: "14.5px", fontWeight: 300, color: t.textMuted, lineHeight: 1.82, maxWidth: "520px", letterSpacing: "0.02em" }}>
            {c.introParagraph}
          </p>
        </div>
      </div>

      {/* ── Featured Products ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "64px 40px" }}>
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", border: `1px solid ${t.border}`, background: "#fafafa" }}>
            <p style={{ fontSize: "13px", color: t.textMuted, fontWeight: 300 }}>No featured products at this time — check back soon.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "6px" }}>
                  {products.length} {products.length === 1 ? "piece" : "pieces"}
                </div>
                <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 300, color: t.text, lineHeight: 1.15 }}>
                  Available Now
                </h2>
              </div>
              <Link href="/shop" style={{ fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.gold, textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px", borderBottom: `1px solid ${t.gold}55`, paddingBottom: "1px" }}>
                Browse Full Collection
                <svg width="9" height="8" viewBox="0 0 9 8" fill="none"><path d="M1 4H8M5 1L8 4L5 7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
            <div className="lxs-featured-grid">
              {products.map(p => <ProductCard key={p.id} product={p}/>)}
            </div>
          </>
        )}
      </div>

    </div>
  )
}
