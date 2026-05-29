'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import type { SiteSettings, FeaturedPageText, FeaturedClassifiedItem } from '@/lib/payload'
import type { MappedProduct } from '@/lib/medusa'

const PLAYFAIR = "var(--font-playfair), serif"
const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n / 100)

const CONDITION_LABELS: Record<string, string> = {
  'new': 'New / Unfired', 'excellent': 'Excellent', 'very-good': 'Very Good', 'good': 'Good', 'fair': 'Fair',
}

function ProductCard({ product }: { product: MappedProduct }) {
  const { t } = useTheme()
  const router = useRouter()
  const [hov, setHov] = useState(false)
  return (
    <div onClick={() => router.push(`/product/${product.handle}`)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? t.bgCardHover : t.bgCard, border: `1px solid ${hov ? t.gold + "55" : t.border}`, borderRadius: "1px", overflow: "hidden", transition: "all 0.28s ease", transform: hov ? "translateY(-3px)" : "none", boxShadow: hov ? `0 16px 48px rgba(0,0,0,0.1)` : "0 2px 8px rgba(0,0,0,0.04)", cursor: "pointer", display: "flex", flexDirection: "column", fontFamily: "var(--font-inter)" }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden", background: "#f5f5f6", flexShrink: 0 }}>
        {product.thumbnail
          ? <Image src={product.thumbnail} alt={product.title} fill style={{ objectFit: "contain" }} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"/>
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ opacity: 0.15 }}><rect x="4" y="12" width="32" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M12 12V10C12 8.9 12.9 8 14 8H26C27.1 8 28 8.9 28 10V12" stroke="currentColor" strokeWidth="1.5"/></svg></div>}
        {product.details?.primary_category && (
          <div style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(255,255,255,0.9)", border: `1px solid ${t.gold}50`, padding: "3px 9px", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: t.gold }}>
            {product.details.primary_category}
          </div>
        )}
      </div>
      <div style={{ padding: "18px 20px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "5px" }}>
          {product.attributes?.brand ?? "Luxus Collection"}
        </div>
        <div style={{ fontFamily: PLAYFAIR, fontSize: "18px", fontWeight: 400, color: t.text, lineHeight: 1.2, marginBottom: "5px" }}>
          {product.title}
        </div>
        <div style={{ fontSize: "10.5px", color: t.textMuted, fontWeight: 300, letterSpacing: "0.04em", marginBottom: "14px" }}>
          {[product.attributes?.caliber, product.attributes?.action].filter(Boolean).join(" · ")}
        </div>
        <div style={{ height: "1px", background: t.border, marginBottom: "13px", marginTop: "auto" }}/>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: product.contact_for_pricing ? "10px" : "15px", fontWeight: product.contact_for_pricing ? 400 : 500, color: product.contact_for_pricing ? t.gold : t.text, letterSpacing: product.contact_for_pricing ? "0.04em" : "0.01em" }}>
            {product.contact_for_pricing ? "Contact for Pricing" : (product.price ? fmt(product.price) : "—")}
          </div>
          <div style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, color: t.gold, borderBottom: `1px solid ${t.gold}55`, paddingBottom: "1px", opacity: hov ? 1 : 0.65, transition: "opacity 0.2s" }}>
            View Details
          </div>
        </div>
      </div>
    </div>
  )
}

function ClassifiedCard({ item }: { item: FeaturedClassifiedItem }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  const conditionLabel = item.condition ? CONDITION_LABELS[item.condition] ?? item.condition : null
  const priceDisplay = item.priceNote ?? (item.price ? fmt(item.price * 100) : null)

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? t.bgCardHover : t.bgCard, border: `1px solid ${hov ? t.gold + "55" : t.border}`, borderRadius: "1px", overflow: "hidden", transition: "all 0.28s ease", transform: hov ? "translateY(-3px)" : "none", boxShadow: hov ? `0 16px 48px rgba(0,0,0,0.1)` : "0 2px 8px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", fontFamily: "var(--font-inter)", position: "relative" }}>

      {/* Coming Soon ribbon */}
      <div style={{ position: "absolute", top: "12px", right: "12px", background: t.gold, color: "#fff", fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, padding: "3px 8px", zIndex: 2 }}>
        Coming Soon
      </div>

      {/* Image */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", overflow: "hidden", background: "#f0f0f2", flexShrink: 0 }}>
        {item.imageUrl
          ? <Image src={item.imageUrl} alt={item.title} fill style={{ objectFit: "cover" }} sizes="(max-width: 640px) 100vw, 33vw"/>
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.12 }}>
                <rect x="4" y="14" width="40" height="24" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M14 14V11C14 9.9 14.9 9 16 9H32C33.1 9 34 9.9 34 11V14" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="24" cy="26" r="6" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>}
        {item.category && (
          <div style={{ position: "absolute", bottom: "10px", left: "10px", background: "rgba(255,255,255,0.88)", border: `1px solid ${t.border}`, padding: "3px 9px", fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, color: t.textMuted }}>
            {item.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "18px 20px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
        {(item.brand || item.model) && (
          <div style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "5px" }}>
            {[item.brand, item.model].filter(Boolean).join(" · ")}
          </div>
        )}
        <div style={{ fontFamily: PLAYFAIR, fontSize: "17px", fontWeight: 400, color: t.text, lineHeight: 1.25, marginBottom: "6px" }}>
          {item.title}
        </div>
        <div style={{ display: "flex", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
          {item.caliber && (
            <span style={{ fontSize: "10px", color: t.textMuted, fontWeight: 300, letterSpacing: "0.04em" }}>{item.caliber}</span>
          )}
          {conditionLabel && (
            <span style={{ fontSize: "10px", color: t.textMuted, fontWeight: 300, letterSpacing: "0.04em" }}>{conditionLabel}</span>
          )}
        </div>
        {item.description && (
          <p style={{ fontSize: "12px", fontWeight: 300, color: t.textMuted, lineHeight: 1.7, marginBottom: "14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
            {item.description}
          </p>
        )}
        <div style={{ height: "1px", background: t.border, marginBottom: "12px", marginTop: "auto" }}/>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: PLAYFAIR, fontSize: "17px", fontWeight: 400, color: t.text }}>
            {priceDisplay ?? "—"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {item.location && (
              <span style={{ fontSize: "10px", color: t.textDim, fontWeight: 300 }}>{item.location}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FeaturedPage({ settings, text, products, classifieds }: {
  settings: SiteSettings
  text: FeaturedPageText
  products: MappedProduct[]
  classifieds: FeaturedClassifiedItem[]
}) {
  const { t } = useTheme()

  const c = {
    headline:            text.headline            ?? "Featured Collection",
    introParagraph:      text.introParagraph      ?? "A hand-curated selection of exceptional pieces chosen for provenance, craftsmanship, and rarity. Each firearm in this collection represents the standard we hold every acquisition to.",
    classifiedsHeadline: text.classifiedsHeadline ?? "Featured Classifieds",
    classifiedsIntro:    text.classifiedsIntro    ?? "Peer-to-peer listings from verified collectors — serious pieces for serious buyers. Our full classifieds marketplace is coming soon.",
    classifiedsBadge:    text.classifiedsBadge    ?? "Coming Soon",
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <div style={{ width: "18px", height: "1px", background: t.gold }}/>
            <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>Curated Selection</span>
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

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 40px" }}>
        <div style={{ borderTop: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "40px", height: "1px", background: t.gold, flexShrink: 0 }}/>
          <span style={{ fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: t.gold, fontWeight: 500, whiteSpace: "nowrap" }}>
            {c.classifiedsBadge}
          </span>
          <div style={{ flex: 1, height: "1px", background: t.border }}/>
        </div>
      </div>

      {/* ── Featured Classifieds ────────────────────────────────────────────── */}
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "56px 40px 96px" }}>
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
            <div style={{ width: "18px", height: "1px", background: t.gold }}/>
            <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>Peer-to-Peer</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(26px,2.8vw,38px)", fontWeight: 300, color: t.text, lineHeight: 1.15 }}>
              {c.classifiedsHeadline}
            </h2>
            <Link href="/classifieds" style={{ fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.gold, textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px", borderBottom: `1px solid ${t.gold}55`, paddingBottom: "1px", opacity: 0.7 }}>
              View All Classifieds
              <svg width="9" height="8" viewBox="0 0 9 8" fill="none"><path d="M1 4H8M5 1L8 4L5 7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
          <p style={{ fontSize: "14px", fontWeight: 300, color: t.textMuted, lineHeight: 1.8, maxWidth: "520px", marginTop: "10px" }}>
            {c.classifiedsIntro}
          </p>
        </div>

        {classifieds.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", border: `1px solid ${t.border}`, background: "#fafafa" }}>
            <p style={{ fontSize: "13px", color: t.textMuted, fontWeight: 300 }}>No featured classifieds yet — add listings via the CMS.</p>
          </div>
        ) : (
          <div className="lxs-featured-classifieds-grid">
            {classifieds.map(item => <ClassifiedCard key={item.id} item={item}/>)}
          </div>
        )}

        {/* Waitlist CTA */}
        <div style={{ marginTop: "48px", padding: "36px", background: "#fafafa", border: `1px solid ${t.border}`, borderLeft: `3px solid ${t.gold}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <div style={{ fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "6px" }}>Classifieds — Coming Soon</div>
            <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted, lineHeight: 1.7, maxWidth: "420px" }}>
              The Luxus classifieds section is in development. Want early access to list or browse peer-to-peer firearm listings from verified collectors?
            </p>
          </div>
          <Link href="/contact?topic=Classifieds+Waitlist"
            style={{ padding: "13px 28px", background: t.gold, color: "#fff", fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
            Get Early Access
          </Link>
        </div>
      </div>
    </div>
  )
}
