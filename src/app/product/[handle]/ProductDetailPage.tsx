'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import { useCart } from '@/context/CartContext'
import type { MappedProduct } from '@/lib/medusa'
import type { SiteSettings } from '@/lib/payload'
import { isWishlisted, toggleWishlist } from '@/lib/auth'
import MakeAnOfferModal from '@/components/MakeAnOfferModal'

const PLAYFAIR = "var(--font-playfair), serif"

// Convert plain-text paragraphs (\n\n) into <p> tags.
// If Medusa ever returns HTML (rich-text editor), passes through unchanged.
function formatOverview(text: string): string {
  if (/<p[\s>]/i.test(text)) return text
  return '<p>' + text.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>') + '</p>'
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)

// ── ImgBox ────────────────────────────────────────────────────────────────────
function ImgBox({ index = 0, style = {} }: { index?: number; style?: React.CSSProperties }) {
  const { t } = useTheme()
  const lshifts = ["#e8e8eb,#d4d4d8", "#eaeaec,#d8d8dc", "#e6e6e9,#d6d6da", "#ebebed,#d9d9dd", "#e8e8eb,#d4d4d8"]
  const grad = lshifts[index % lshifts.length]
  const [c1, c2] = grad.split(",")
  return (
    <div style={{
      background: `linear-gradient(140deg,${c1} 0%,${c2} 50%,${c1} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", position: "relative", width: "100%", height: "100%", ...style,
    }}>
      <svg width="38" height="38" viewBox="0 0 38 38" fill="none" opacity="0.13">
        <rect x="2" y="2" width="34" height="34" rx="1" stroke={t.gold} strokeWidth="0.8" />
        <circle cx="13" cy="13" r="4" stroke={t.gold} strokeWidth="0.8" />
        <path d="M2 27L12 17L18 23L26 13L36 23V36H2V27Z" stroke={t.gold} strokeWidth="0.8" />
      </svg>
    </div>
  )
}

// ── RelatedCard ───────────────────────────────────────────────────────────────
function RelatedCard({ product }: { product: MappedProduct }) {
  const { t } = useTheme()
  const { addItem } = useCart()
  const router = useRouter()
  const [hov, setHov] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => { setWishlisted(isWishlisted(product.handle)) }, [product.handle])

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = toggleWishlist({ handle: product.handle, title: product.title, brand: product.brand, caliber: product.attributes?.caliber ?? null, action: product.attributes?.action ?? null, price: product.price, contact_for_pricing: product.contact_for_pricing, thumbnail: product.thumbnail })
    setWishlisted(next)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(product)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 1800)
  }

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/product/${product.handle}`)
  }

  return (
    <div
      onClick={() => router.push(`/product/${product.handle}`)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? t.bgCardHover : t.bgCard,
        border: `1px solid ${hov ? t.gold + "55" : t.border}`,
        borderRadius: "1px", overflow: "hidden",
        transition: "all 0.28s ease",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov ? `0 16px 48px rgba(0,0,0,0.1)` : "0 2px 8px rgba(0,0,0,0.05)",
        cursor: "pointer", fontFamily: "'Inter',sans-serif",
        display: "flex", flexDirection: "column", height: "100%",
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden", background: "#f0f0f0", flexShrink: 0 }}>
        {product.thumbnail ? (
          <Image src={product.thumbnail} alt={product.title} fill style={{ objectFit: "contain" }}
            sizes="(max-width: 640px) 50vw, 25vw" />
        ) : (
          <ImgBox index={0} />
        )}
        {product.details?.primary_category && (
          <div style={{ position: "absolute", bottom: "10px", left: "10px", background: "rgba(255,255,255,0.88)", border: `1px solid ${t.gold}50`, padding: "3px 9px", fontSize: "8.5px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: t.gold, backdropFilter: "blur(6px)" }}>
            {product.details.primary_category}
          </div>
        )}
      </div>
      <div style={{ padding: "16px 18px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "4px" }}>{product.attributes?.brand}</div>
        <div style={{ fontFamily: PLAYFAIR, fontSize: "17px", fontWeight: 400, color: t.text, lineHeight: 1.2, marginBottom: "4px" }}>{product.title}</div>
        <div style={{ fontSize: "10px", color: t.textMuted, fontWeight: 300, marginBottom: "12px" }}>
          {[product.attributes?.caliber, product.attributes?.action].filter(Boolean).join(" · ")}
        </div>
        <div style={{ height: "1px", background: t.border, marginBottom: "12px", marginTop: "auto" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <span style={{ fontSize: product.contact_for_pricing ? "9.5px" : "14px", fontWeight: 500, color: product.contact_for_pricing ? t.gold : t.text, letterSpacing: product.contact_for_pricing ? "0.03em" : "0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, flexShrink: 1 }}>
            {product.contact_for_pricing ? "Contact For Pricing" : product.price !== null ? fmt(product.price) : "—"}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <button
              onClick={handleHeartClick}
              title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center", color: wishlisted ? "#c0392b" : t.textMuted, opacity: hov || wishlisted ? 1 : 0.55, transition: "all 0.2s" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            {product.contact_for_pricing ? (
              <button
                onClick={handleViewDetails}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, color: t.gold, borderBottom: `1px solid ${t.gold}55`, paddingBottom: "1px", opacity: hov ? 1 : 0.65, transition: "opacity 0.2s" }}
              >
                View Details
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                style={{ background: addedToCart ? t.gold : "transparent", border: `1px solid ${t.gold}`, color: addedToCart ? "#fff" : t.gold, fontSize: "7.5px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, padding: "4px 8px", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}
              >
                {addedToCart ? "Added ✓" : "Add to Cart"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProductDetailPage({
  product,
  relatedProducts,
  settings,
}: {
  product: MappedProduct
  relatedProducts: MappedProduct[]
  settings?: SiteSettings
}) {
  const { t } = useTheme()
  const { addItem } = useCart()

  const [activeImg, setActiveImg] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [showSticky, setShowSticky] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'specifications' | 'in the box'>('overview')
  const [wishlisted, setWishlisted] = useState(false)
  // Hydrate wishlist state from localStorage after mount
  useEffect(() => { setWishlisted(isWishlisted(product.handle)) }, [product.handle])
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [offerModalOpen, setOfferModalOpen] = useState(false)
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    message: `I'm interested in the ${product.title} and would like more information.`,
    fflConsent: false,
  })
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [contactModalContext, setContactModalContext] = useState<'question' | 'pricing'>('question')
  const [addedToCart, setAddedToCart] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  useEffect(() => { setShareUrl(window.location.href) }, [])

  const infoPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      if (infoPanelRef.current) {
        setShowSticky(infoPanelRef.current.getBoundingClientRect().bottom < 80)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowLeft') setActiveImg(i => (i - 1 + images.length) % images.length)
      if (e.key === 'ArrowRight') setActiveImg(i => (i + 1) % images.length)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFormChange = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!form.firstName || !form.email || formStatus === 'submitting') return
    setFormStatus('submitting')
    const isPricing = contactModalContext === 'pricing'
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mailbox: 'sales',
          subject: isPricing
            ? `Pricing Inquiry: ${product.title}`
            : `Product Question: ${product.title}`,
          product: `${product.brand ? product.brand + ' — ' : ''}${product.title}`,
          ...form,
          fflConsent: form.fflConsent ? 'Yes' : undefined,
        }),
      })
      if (!res.ok) throw new Error()
      setFormStatus('success')
    } catch {
      setFormStatus('error')
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const images = product.images.length > 0 ? product.images : []
  const hasImages = images.length > 0

  // Build spec table: attribute-derived rows first, then any explicit metadata specs
  const baseSpecs: Record<string, string> = {}
  if (product.attributes?.caliber)       baseSpecs["Caliber"]       = product.attributes.caliber
  if (product.attributes?.action)        baseSpecs["Action"]         = product.attributes.action
  if (product.attributes?.barrel_length) baseSpecs["Barrel Length"]  = product.attributes.barrel_length
  if (product.attributes?.model)         baseSpecs["Model"]          = product.attributes.model
  const specEntries = Object.entries({ ...baseSpecs, ...(product.specifications ?? {}) })

  const hasTabs = {
    overview: !!(product.overview || (product.highlights?.length > 0)),
    specifications: specEntries.length > 0,
    'in the box': (product.in_the_box?.length ?? 0) > 0,
  }
  const visibleTabs = (['overview', 'specifications', 'in the box'] as const).filter(t => hasTabs[t])

  // Quick spec chips from attributes + specifications
  const specChips = [
    product.attributes?.caliber && `${product.attributes.caliber}`,
    product.attributes?.action,
    product.attributes?.barrel_length && `Barrel ${product.attributes.barrel_length}`,
    product.specifications?.["Capacity"] && `${product.specifications["Capacity"]} Capacity`,
  ].filter(Boolean) as string[]

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px",
    background: "#ffffff",
    border: `1px solid ${t.border}`, color: t.text,
    fontSize: "12px", fontFamily: "'Inter',sans-serif",
    fontWeight: 300, letterSpacing: "0.02em",
    outline: "none", borderRadius: "1px",
  }

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        .lxs-form-input:focus { border-color: ${t.gold}60 !important; }
        .lxs-thumb:hover { border-color: ${t.gold}80 !important; opacity: 1 !important; }
        textarea { resize: vertical; }
        input::placeholder, textarea::placeholder { color: ${t.textDim}; }
      `}</style>

      {/* ── Sticky buy bar ──────────────────────────────────────────────── */}
      <div className="lxs-sticky-buy" style={{
        position: "fixed", top: "68px", left: 0, right: 0, zIndex: 150,
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${t.border}`,
        transform: showSticky ? "translateY(0)" : "translateY(-100%)",
        transition: "transform 0.3s ease",
        padding: "10px 40px",
      }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0, overflow: "hidden" }}>
            <span style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, flexShrink: 0 }}>{product.brand}</span>
            <span style={{ fontFamily: PLAYFAIR, fontSize: "18px", fontWeight: 400, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.title}</span>
            {(product.attributes?.caliber || product.attributes?.action) && (
              <span style={{ fontSize: "11px", color: t.textMuted, fontWeight: 300, flexShrink: 0, display: "flex", gap: "6px" }}>
                {[product.attributes.caliber, product.attributes.action].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "16px", fontWeight: 500, color: product.contact_for_pricing ? t.gold : t.text }}>
              {product.contact_for_pricing ? "Contact For Pricing" : product.price !== null ? fmt(product.price) : ""}
            </span>
            {product.contact_for_pricing ? (
              <button onClick={() => { setContactModalContext('pricing'); setContactModalOpen(true) }}
                style={{ padding: "9px 22px", background: "transparent", border: `1px solid ${t.gold}`, color: t.gold, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 600, cursor: "pointer", borderRadius: "1px" }}>
                Contact for Pricing
              </button>
            ) : (
              <button
                onClick={() => { addItem(product); setAddedToCart(true); setTimeout(() => setAddedToCart(false), 1800) }}
                style={{ padding: "9px 22px", background: addedToCart ? "#5a9a5a" : t.gold, border: "none", color: "#fff", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 600, cursor: "pointer", borderRadius: "1px", transition: "background 0.2s" }}>
                {addedToCart ? "Added ✓" : "Add to Cart"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <div style={{ paddingTop: "68px", background: t.bgSurface, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "14px 40px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            ...(product.brand ? [{ label: product.brand, href: `/brand/${product.brand.toLowerCase().replace(/&amp;/g,'and').replace(/\s*&\s*/g,'-').replace(/\s+and\s+/g,'-').replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')}` }] : []),
          ].map(crumb => (
            <div key={crumb.href} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Link href={crumb.href}
                style={{ fontSize: "10px", color: t.textDim, fontWeight: 300, letterSpacing: "0.04em", transition: "color 0.18s" }}
                onMouseEnter={e => (e.currentTarget.style.color = t.gold)}
                onMouseLeave={e => (e.currentTarget.style.color = t.textDim)}>
                {crumb.label}
              </Link>
              <span style={{ fontSize: "9px", color: t.textDim }}>›</span>
            </div>
          ))}
          <span style={{ fontSize: "10px", color: t.textMuted, fontWeight: 400, letterSpacing: "0.01em" }}>{product.title}</span>
        </div>
      </div>

      {/* ── Product hero ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "52px 40px 0" }}>
        <div className="lxs-pdp-hero" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "start" }}>

          {/* LEFT: Gallery */}
          <div className="lxs-pdp-gallery" style={{ position: "sticky", top: "88px", minWidth: 0, overflow: "hidden" }}>

            {/* Main image */}
            <div
              onClick={() => hasImages && setLightboxOpen(true)}
              style={{
                position: "relative", aspectRatio: "4/3",
                border: `1px solid ${t.border}`,
                cursor: hasImages ? "zoom-in" : "default",
                overflow: "hidden", marginBottom: "12px",
                background: "#f0f0f0",
              }}
            >
              {hasImages && images[activeImg] ? (
                <Image
                  src={images[activeImg]}
                  alt={`${product.title} – image ${activeImg + 1}`}
                  fill style={{ objectFit: "contain" }}
                  sizes="(max-width: 640px) 100vw, 50vw"
                  priority
                />
              ) : (
                <ImgBox index={activeImg} />
              )}

              {/* Category badge */}
              {product.primary_category && (
                <div style={{ position: "absolute", top: "16px", left: "16px", background: "rgba(255,255,255,0.9)", border: `1px solid ${t.gold}55`, padding: "4px 12px", fontSize: "8.5px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: t.gold, backdropFilter: "blur(8px)" }}>
                  {product.primary_category}
                </div>
              )}

              {/* Stock badge */}
              <div style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.9)", border: `1px solid ${product.in_stock ? "#4a8a4a" : "#8a4a4a"}40`, padding: "4px 12px", backdropFilter: "blur(8px)", display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: "8.5px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, color: product.in_stock ? "#5a9a5a" : "#9a5a5a" }}>
                  {product.in_stock ? "Available" : "Unavailable"}
                </span>
              </div>

              {/* Zoom hint */}
              {hasImages && (
                <div style={{ position: "absolute", bottom: "14px", right: "14px", width: "32px", height: "32px", background: "rgba(255,255,255,0.8)", border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="5.5" cy="5.5" r="4.5" stroke={t.textMuted} strokeWidth="1" />
                    <path d="M9 9L12 12" stroke={t.textMuted} strokeWidth="1" strokeLinecap="round" />
                    <path d="M5.5 3.5V7.5M3.5 5.5H7.5" stroke={t.textMuted} strokeWidth="1" strokeLinecap="round" />
                  </svg>
                </div>
              )}

              {/* Prev / Next arrows */}
              {images.length > 1 && (
                <>
                  <button onClick={e => { e.stopPropagation(); setActiveImg(i => (i - 1 + images.length) % images.length) }}
                    style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "34px", height: "34px", background: "rgba(255,255,255,0.85)", border: `1px solid ${t.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M6 1L1 6L6 11" stroke={t.textMuted} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button onClick={e => { e.stopPropagation(); setActiveImg(i => (i + 1) % images.length) }}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "34px", height: "34px", background: "rgba(255,255,255,0.85)", border: `1px solid ${t.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1L6 6L1 11" stroke={t.textMuted} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "nowrap", overflowX: "auto", width: "100%", minWidth: 0 }}>
                {images.map((src, i) => (
                  <div key={i} className="lxs-thumb"
                    onClick={() => setActiveImg(i)}
                    style={{
                      flexShrink: 0, height: "68px", aspectRatio: "4/3", cursor: "pointer",
                      border: `1px solid ${activeImg === i ? t.gold : t.border}`,
                      overflow: "hidden", opacity: activeImg === i ? 1 : 0.55,
                      transition: "all 0.2s", position: "relative",
                      background: "#f0f0f0",
                    }}
                  >
                    {src ? (
                      <Image src={src} alt="" fill style={{ objectFit: "contain" }} sizes="90px" />
                    ) : (
                      <ImgBox index={i} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Dot counter */}
            {images.length > 1 && (
              <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                {images.map((_, i) => (
                  <div key={i} onClick={() => setActiveImg(i)}
                    style={{ width: i === activeImg ? "18px" : "5px", height: "3px", background: i === activeImg ? t.gold : t.border, transition: "all 0.28s ease", cursor: "pointer", borderRadius: "2px" }} />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Info */}
          <div ref={infoPanelRef} style={{ minWidth: 0 }}>

            {/* Brand + SKU */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "16px", height: "1px", background: t.gold }} />
                <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>
                  {product.brand}
                </span>
              </div>
              {product.sku && (
                <span style={{ fontSize: "9.5px", color: t.textDim, letterSpacing: "0.06em", fontWeight: 300 }}>
                  SKU: {product.sku}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(28px,3.2vw,46px)", fontWeight: 300, color: t.text, lineHeight: 1.08, letterSpacing: "0.01em", marginBottom: "10px" }}>
              {product.title}
            </h1>

            {/* Subtitle */}
            {product.subtitle && (
              <div style={{ fontFamily: PLAYFAIR, fontSize: "clamp(16px,1.4vw,20px)", fontWeight: 400, fontStyle: "italic", color: t.gold, lineHeight: 1.4, letterSpacing: "0.01em", marginBottom: "20px" }}>
                {product.subtitle}
              </div>
            )}

            {/* Short description */}
            {product.short_description && (
              <p style={{ fontSize: "13px", fontWeight: 300, lineHeight: 1.85, color: t.textMuted, marginBottom: "24px", letterSpacing: "0.02em" }}>
                {product.short_description}
              </p>
            )}

            {/* Quick-spec chips */}
            {specChips.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
                {specChips.map(chip => (
                  <div key={chip} style={{ padding: "5px 12px", border: `1px solid ${t.border}`, fontSize: "10px", letterSpacing: "0.1em", color: t.textMuted, fontWeight: 300 }}>
                    {chip}
                  </div>
                ))}
              </div>
            )}

            {/* Engraver */}
            {product.engraver && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", marginBottom: "24px", border: `1px solid ${t.border}`, borderLeft: `2px solid ${t.gold}`, background: "#fafafa" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: t.gold, flexShrink: 0 }}>
                  <path d="M9.5 1.5L12.5 4.5L4.5 12.5H1.5V9.5L9.5 1.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8.5 2.5L11.5 5.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                </svg>
                <div>
                  <div style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "2px" }}>Engraved By</div>
                  <div style={{ fontFamily: PLAYFAIR, fontSize: "16px", fontWeight: 400, color: t.text, lineHeight: 1.2 }}>{product.engraver}</div>
                </div>
              </div>
            )}

            {/* Divider */}
            <div style={{ height: "1px", background: `linear-gradient(to right, ${t.gold}50, transparent)`, marginBottom: "24px" }} />

            {/* Price */}
            <div style={{ marginBottom: "28px" }}>
              {product.contact_for_pricing ? (
                <div>
                  <div style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.textDim, fontWeight: 400, marginBottom: "4px" }}>Pricing</div>
                  <div style={{ fontFamily: PLAYFAIR, fontSize: "clamp(22px,2.4vw,30px)", fontWeight: 300, color: t.gold, letterSpacing: "0.02em" }}>
                    Contact Us For Pricing
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.textDim, fontWeight: 400, marginBottom: "4px" }}>Price</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span style={{ fontFamily: PLAYFAIR, fontSize: "clamp(32px,3vw,44px)", fontWeight: 300, color: t.text, lineHeight: 1, letterSpacing: "0.01em" }}>
                      {product.price !== null ? fmt(product.price) : "—"}
                    </span>
                    <span style={{ fontSize: "10px", color: t.textDim, letterSpacing: "0.06em", fontWeight: 300 }}>USD</span>
                  </div>
                </div>
              )}
            </div>

            {/* CTA buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {product.contact_for_pricing ? (
                <>
                  <button onClick={() => { setContactModalContext('pricing'); setContactModalOpen(true) }}
                    style={{ padding: "15px 32px", background: t.gold, border: "none", color: "#fff", fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 600, cursor: "pointer", borderRadius: "1px", transition: "all 0.22s", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
                    onMouseEnter={e => { e.currentTarget.style.background = t.goldLight; e.currentTarget.style.transform = "translateY(-1px)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = t.gold; e.currentTarget.style.transform = "none" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5C2 2.67 2.67 2 3.5 2H10.5C11.33 2 12 2.67 12 3.5V8.5C12 9.33 11.33 10 10.5 10H5L2 12.5V3.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>
                    Contact Us For Pricing
                  </button>
                  <button onClick={() => setOfferModalOpen(true)}
                    style={{ padding: "14px 32px", background: "transparent", border: `1px solid ${t.gold}`, color: t.gold, fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 600, cursor: "pointer", borderRadius: "1px", transition: "all 0.22s", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
                    onMouseEnter={e => { e.currentTarget.style.background = t.gold + "10"; e.currentTarget.style.transform = "translateY(-1px)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "none" }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1L8.1 4.7L12 5.2L9.25 7.9L10 12L6.5 10.1L3 12L3.75 7.9L1 5.2L4.9 4.7L6.5 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                    Make an Offer
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { if (product.in_stock) { addItem(product); setAddedToCart(true); setTimeout(() => setAddedToCart(false), 1800) } }}
                    style={{ padding: "15px 32px", background: addedToCart ? "#5a9a5a" : product.in_stock ? t.gold : t.gold + "55", border: "none", color: "#fff", fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 600, cursor: product.in_stock ? "pointer" : "not-allowed", borderRadius: "1px", transition: "all 0.22s", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
                    onMouseEnter={e => { if (product.in_stock && !addedToCart) { e.currentTarget.style.background = t.goldLight; e.currentTarget.style.transform = "translateY(-1px)" } }}
                    onMouseLeave={e => { if (product.in_stock && !addedToCart) { e.currentTarget.style.background = t.gold; e.currentTarget.style.transform = "none" } }}>
                    <svg width="14" height="13" viewBox="0 0 14 13" fill="none"><path d="M1 1H2.5L4 9H10.5L12.5 3.5H3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="5" cy="11.5" r="0.8" fill="currentColor" /><circle cx="10" cy="11.5" r="0.8" fill="currentColor" /></svg>
                    {addedToCart ? "Added to Cart ✓" : product.in_stock ? "Add to Cart" : "Unavailable"}
                  </button>
                  <button onClick={() => setOfferModalOpen(true)}
                    style={{ padding: "14px 32px", background: "transparent", border: `1px solid ${t.gold}`, color: t.gold, fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 600, cursor: "pointer", borderRadius: "1px", transition: "all 0.22s", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
                    onMouseEnter={e => { e.currentTarget.style.background = t.gold + "10"; e.currentTarget.style.transform = "translateY(-1px)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "none" }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1L8.1 4.7L12 5.2L9.25 7.9L10 12L6.5 10.1L3 12L3.75 7.9L1 5.2L4.9 4.7L6.5 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                    Make an Offer
                  </button>
                  <button onClick={() => { setContactModalContext('question'); setContactModalOpen(true) }}
                    style={{ padding: "14px 32px", background: "transparent", border: `1px solid ${t.border}`, color: t.text, fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 500, cursor: "pointer", borderRadius: "1px", transition: "all 0.22s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold + "70"; e.currentTarget.style.color = t.gold }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.text }}>
                    Request More Information
                  </button>
                </>
              )}

              {/* Wishlist */}
              <button onClick={() => {
                  const added = toggleWishlist({
                    handle: product.handle, title: product.title,
                    brand: product.attributes?.brand ?? null,
                    caliber: product.attributes?.caliber ?? null,
                    action: product.attributes?.action ?? null,
                    price: product.price, contact_for_pricing: product.contact_for_pricing,
                    thumbnail: product.thumbnail,
                  })
                  setWishlisted(added)
                }}
                style={{ padding: "13px 32px", background: "transparent", border: `1px solid ${wishlisted ? t.gold + "60" : t.border}`, color: wishlisted ? t.gold : t.textMuted, fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 500, cursor: "pointer", borderRadius: "1px", transition: "all 0.22s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <svg width="14" height="13" viewBox="0 0 14 13" fill="none">
                  <path d="M7 12C7 12 1 8 1 4C1 2.34315 2.34315 1 4 1C5.20537 1 6.25249 1.70194 6.77735 2.72271C6.87716 2.91782 7.12284 2.91782 7.22265 2.72271C7.74751 1.70194 8.79463 1 10 1C11.6569 1 13 2.34315 13 4C13 8 7 12 7 12Z"
                    stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
                    fill={wishlisted ? "currentColor" : "none"} />
                </svg>
                {wishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
              </button>
            </div>

            {/* FFL Transfer Required — only shown for Firearm product type */}
            {product.is_firearm && (
              <div style={{ background: "#fafafa", border: `1px solid ${t.gold}30`, borderLeft: `3px solid ${t.gold}`, padding: "14px 16px", marginBottom: "20px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <svg width="16" height="18" viewBox="0 0 16 18" fill="none" style={{ flexShrink: 0, marginTop: "1px", color: t.gold }}>
                    <path d="M8 1L15 4.5V9C15 13 11.5 16.5 8 17.5C4.5 16.5 1 13 1 9V4.5L8 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    <path d="M8 7V10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    <circle cx="8" cy="13" r="0.8" fill="currentColor"/>
                  </svg>
                  <div>
                    <div style={{ fontSize: "8.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.gold, fontWeight: 600, marginBottom: "4px" }}>
                      FFL Transfer Required
                    </div>
                    <div style={{ fontSize: "11.5px", color: t.textMuted, fontWeight: 300, lineHeight: 1.7, letterSpacing: "0.01em" }}>
                      All firearms must be transferred through a licensed FFL dealer in your state. Provide your dealer&apos;s information at checkout — we ship directly to them.{" "}
                      <a href="/support#ffl" style={{ color: t.gold, textDecoration: "none", fontWeight: 400 }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>
                        How FFL transfers work →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Share row */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "8.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginRight: "4px" }}>Share</span>

              {/* Email */}
              <a href={`mailto:?subject=${encodeURIComponent(product.title)}&body=${encodeURIComponent(shareUrl)}`} title="Share via Email" target="_blank" rel="noopener noreferrer"
                style={{ background: "none", border: `1px solid ${t.border}`, padding: "6px 9px", color: t.textMuted, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s", borderRadius: "1px", textDecoration: "none" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold + "60"; e.currentTarget.style.color = t.gold }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted }}>
                <svg width="13" height="12" viewBox="0 0 13 12" fill="none"><rect x="1" y="1.5" width="11" height="9" rx="1" stroke="currentColor" strokeWidth="1" /><path d="M1 3L6.5 7L12 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
              </a>

              {/* Facebook */}
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} title="Share on Facebook" target="_blank" rel="noopener noreferrer"
                style={{ background: "none", border: `1px solid ${t.border}`, padding: "6px 9px", color: t.textMuted, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s", borderRadius: "1px", textDecoration: "none" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold + "60"; e.currentTarget.style.color = t.gold }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted }}>
                <svg width="13" height="14" viewBox="0 0 13 14" fill="none">
                  <rect x="1" y="1" width="11" height="12" rx="1" stroke="currentColor" strokeWidth="1"/>
                  <path d="M7 13V8H8.5L8.75 6.5H7V5.5C7 5.22 7.22 5 7.5 5H9V3.5H7.5C6.12 3.5 5 4.62 5 6V6.5H3.75V8H5V13" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>

              {/* X / Twitter */}
              <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(product.title)}`} title="Share on X" target="_blank" rel="noopener noreferrer"
                style={{ background: "none", border: `1px solid ${t.border}`, padding: "6px 9px", color: t.textMuted, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s", borderRadius: "1px", textDecoration: "none" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold + "60"; e.currentTarget.style.color = t.gold }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M1.5 1.5L5.8 7.2L1.5 12H2.8L6.4 7.95L9.5 12H12L7.5 6L11.5 1.5H10.2L6.9 5.3L4 1.5H1.5Z" stroke="currentColor" strokeWidth="0.85" strokeLinejoin="round"/>
                </svg>
              </a>

              {/* Pinterest */}
              <a href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(product.thumbnail ?? '')}&description=${encodeURIComponent(product.title)}`} title="Save to Pinterest" target="_blank" rel="noopener noreferrer"
                style={{ background: "none", border: `1px solid ${t.border}`, padding: "6px 9px", color: t.textMuted, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s", borderRadius: "1px", textDecoration: "none" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold + "60"; e.currentTarget.style.color = t.gold }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted }}>
                <svg width="13" height="14" viewBox="0 0 13 14" fill="none">
                  <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1"/>
                  <path d="M5 9.5C5.3 8.5 5.8 7.5 5.8 6.2C5.8 5.2 6.4 4.5 7.2 4.5C8 4.5 8.4 5.1 8.1 6C7.8 6.9 8.4 7.8 8.9 7.8C9.4 7.8 9.8 7.2 9.8 6.2" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
                  <path d="M5.8 8.5L5.2 12" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
                </svg>
              </a>

              {/* WhatsApp */}
              <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(product.title + ' — ' + shareUrl)}`} title="Share on WhatsApp" target="_blank" rel="noopener noreferrer"
                style={{ background: "none", border: `1px solid ${t.border}`, padding: "6px 9px", color: t.textMuted, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s", borderRadius: "1px", textDecoration: "none" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold + "60"; e.currentTarget.style.color = t.gold }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1"/>
                  <path d="M9.5 8.5C9.5 8.5 8.5 9 7 9C5.5 9 4 7.8 4 6.5C4 5.2 5 4 6.5 4C8 4 9.5 5 9.5 6.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
                  <path d="M4 10L3.5 12L5.5 11.2" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>

              {/* Copy link */}
              <button onClick={handleCopy} title={copied ? "Copied!" : "Copy link"}
                style={{ background: copied ? t.gold + "20" : "none", border: `1px solid ${copied ? t.gold + "60" : t.border}`, padding: "6px 9px", cursor: "pointer", color: copied ? t.gold : t.textMuted, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s", borderRadius: "1px" }}
                onMouseEnter={e => { if (!copied) { e.currentTarget.style.borderColor = t.gold + "60"; e.currentTarget.style.color = t.gold } }}
                onMouseLeave={e => { if (!copied) { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted } }}>
                <svg width="12" height="13" viewBox="0 0 12 13" fill="none"><rect x="1" y="4" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1" /><path d="M4 4V2C4 1.44772 4.44772 1 5 1H10C10.5523 1 11 1.44772 11 2V9C11 9.55228 10.5523 10 10 10H8" stroke="currentColor" strokeWidth="1" /></svg>
              </button>

              {/* Print */}
              <button onClick={() => window.open(`/product/${product.handle}/print`, '_blank')} title="Print product sheet"
                style={{ background: "none", border: `1px solid ${t.border}`, padding: "6px 9px", cursor: "pointer", color: t.textMuted, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s", borderRadius: "1px" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold + "60"; e.currentTarget.style.color = t.gold }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted }}>
                <svg width="14" height="13" viewBox="0 0 14 13" fill="none"><path d="M3 4V1H11V4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /><rect x="1" y="4" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="1" /><path d="M3 8H3.01M3 10V13H11V10H3Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail tabs ──────────────────────────────────────────────────── */}
      {visibleTabs.length > 0 && (
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "64px 40px 0" }}>
          {/* Tab bar */}
          <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, marginBottom: "44px", overflowX: "auto" }}>
            {visibleTabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  padding: "0 0 18px", marginRight: "36px", background: "none", border: "none",
                  borderBottom: `2px solid ${activeTab === tab ? t.gold : "transparent"}`,
                  marginBottom: "-1px", cursor: "pointer",
                  fontFamily: "'Inter',sans-serif", fontWeight: 500,
                  fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase",
                  color: activeTab === tab ? t.gold : t.textMuted,
                  transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0,
                }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeTab === 'overview' && (
            <div>
              {product.overview && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                    <div style={{ width: "18px", height: "1px", background: t.gold }} />
                    <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>About This Piece</span>
                  </div>
                  <div
                    className="lxs-pdp-overview"
                    style={{ fontFamily: PLAYFAIR, fontSize: "clamp(16px,1.5vw,22px)", fontWeight: 300, color: t.text, lineHeight: 1.7, letterSpacing: "0.01em", marginBottom: "32px" }}
                    dangerouslySetInnerHTML={{ __html: formatOverview(product.overview) }}
                  />
                </>
              )}
              {product.highlights?.length > 0 && (
                <div className="lxs-pdp-highlights" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "14px", marginTop: product.overview ? "0" : "0" }}>
                  {product.highlights.map(({ title, body }: { title: string; body: string }) => (
                    <div key={title} style={{ background: "#fafafa", border: `1px solid ${t.border}`, padding: "16px 18px" }}>
                      <div style={{ fontSize: "8.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "6px" }}>{title}</div>
                      <div style={{ fontSize: "12px", color: t.textMuted, fontWeight: 300, lineHeight: 1.65 }}>{body}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Specifications */}
          {activeTab === 'specifications' && (
            <div style={{ maxWidth: "680px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <div style={{ width: "18px", height: "1px", background: t.gold }} />
                <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>Full Specifications</span>
              </div>
              <div style={{ border: `1px solid ${t.border}`, padding: "0 20px" }}>
                {specEntries.map(([label, value], i) => (
                  <div key={label} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", padding: "12px 0", borderBottom: i < specEntries.length - 1 ? `1px solid ${t.border}` : "none", gap: "16px" }}>
                    <span style={{ fontSize: "10.5px", color: t.textMuted, fontWeight: 300, letterSpacing: "0.04em" }}>{label}</span>
                    <span style={{ fontSize: "11px", color: t.text, fontWeight: 400, letterSpacing: "0.02em" }}>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In the Box */}
          {activeTab === 'in the box' && (
            <div style={{ maxWidth: "560px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <div style={{ width: "18px", height: "1px", background: t.gold }} />
                <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>What's Included</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {product.in_the_box.map((item: string, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "13px 0", borderBottom: i < product.in_the_box.length - 1 ? `1px solid ${t.border}` : "none" }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: t.gold, marginTop: "5px", flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", fontWeight: 300, color: t.text, lineHeight: 1.5, letterSpacing: "0.02em" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Inquiry form ─────────────────────────────────────────────────── */}
      <section style={{ margin: "80px 0 0", background: "#f3f3f5", borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "80px 40px" }}>
          <div className="lxs-pdp-inquiry" style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "80px", alignItems: "start" }}>

            {/* Copy */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "18px", height: "1px", background: t.gold }} />
                <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>Inquire</span>
              </div>
              <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(24px,2.8vw,40px)", fontWeight: 300, color: t.text, lineHeight: 1.15, letterSpacing: "0.01em", marginBottom: "20px" }}>
                Questions About<br />This Piece?
              </h2>
              <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted, lineHeight: 1.85, marginBottom: "28px", maxWidth: "320px" }}>
                Our team is available to answer questions about specifications, provenance, availability, and FFL transfer logistics. We typically respond within one business day.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { href: `tel:${(settings?.contact.phone ?? "(941) 253-3660").replace(/\D/g,'')}`, label: settings?.contact.phone ?? "(941) 253-3660" },
                  { href: `tel:${(settings?.contact.phoneTollFree ?? "(833) 486-6659").replace(/\D/g,'')}`, label: `${settings?.contact.phoneTollFree ?? "(833) 486-6659"} · Toll-Free` },
                  { href: `mailto:${settings?.contact.emailInfo ?? "info@luxus-collection.com"}`, label: settings?.contact.emailInfo ?? "info@luxus-collection.com" },
                ].map(({ href, label }) => (
                  <a key={href} href={href}
                    style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: t.textMuted, fontSize: "13px", fontWeight: 300, transition: "color 0.18s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = t.gold)}
                    onMouseLeave={e => (e.currentTarget.style.color = t.textMuted)}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 1.5C2 1.5 1 1.5 1 2.5C1 3.5 1.5 6.5 4.5 9.5C7.5 12.5 10.5 12 11.5 12C12.5 12 12.5 11 12.5 11L11 8.5C11 8.5 10.5 8 10 8.5L8.5 9.5C8.5 9.5 7 9 5 7C3 5 3.5 3.5 3.5 3.5L4.5 2C5 1.5 4.5 1 4.5 1L2 1.5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
                    {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Form */}
            <div>
              {formStatus === 'success' ? (
                <div style={{ textAlign: "center", padding: "60px 40px", border: `1px solid ${t.border}`, background: "#fff" }}>
                  <div style={{ width: "48px", height: "48px", border: `1px solid ${t.gold}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <svg width="18" height="14" viewBox="0 0 18 14" fill="none"><path d="M1 7L6.5 12.5L17 1.5" stroke={t.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <div style={{ fontFamily: PLAYFAIR, fontSize: "26px", fontWeight: 300, color: t.text, marginBottom: "10px" }}>Message Received</div>
                  <p style={{ fontSize: "12.5px", fontWeight: 300, color: t.textMuted, lineHeight: 1.75 }}>
                    Thank you for your interest in the {product.title}. A member of our team will be in touch within one business day.
                  </p>
                </div>
              ) : (
                <div style={{ background: "#fff", border: `1px solid ${t.border}`, padding: "36px" }}>
                  <div style={{ background: "#fafafa", border: `1px solid ${t.border}`, borderLeft: `2px solid ${t.gold}50`, padding: "10px 14px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.textDim, fontWeight: 500 }}>Re:</span>
                    <span style={{ fontSize: "11.5px", color: t.text, fontWeight: 300 }}>{product.brand ? `${product.brand}, ` : ""}{product.title}</span>
                  </div>

                  <div className="lxs-pdp-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                    {[["firstName", "First Name", "John"], ["lastName", "Last Name", "Doe"]].map(([field, label, ph]) => (
                      <div key={field}>
                        <label style={{ display: "block", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "6px" }}>{label}</label>
                        <input className="lxs-form-input" type="text" placeholder={ph} value={form[field as keyof typeof form] as string}
                          onChange={e => handleFormChange(field, e.target.value)} style={inputStyle} />
                      </div>
                    ))}
                  </div>

                  <div className="lxs-pdp-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                    {[["email", "Email Address", "john@example.com", "email"], ["phone", "Phone Number", "(555) 000-0000", "tel"]].map(([field, label, ph, type]) => (
                      <div key={field}>
                        <label style={{ display: "block", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "6px" }}>{label}</label>
                        <input className="lxs-form-input" type={type} placeholder={ph} value={form[field as keyof typeof form] as string}
                          onChange={e => handleFormChange(field, e.target.value)} style={inputStyle} />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: "18px" }}>
                    <label style={{ display: "block", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "6px" }}>Message</label>
                    <textarea className="lxs-form-input" rows={4} value={form.message}
                      onChange={e => handleFormChange("message", e.target.value)}
                      style={{ ...inputStyle, lineHeight: 1.7 }} />
                  </div>

                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "24px", cursor: "pointer" }}>
                    <div onClick={() => handleFormChange("fflConsent", !form.fflConsent)}
                      style={{ width: "14px", height: "14px", flexShrink: 0, marginTop: "1px", border: `1px solid ${form.fflConsent ? t.gold : t.border}`, background: form.fflConsent ? t.gold : "transparent", transition: "all 0.18s", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "1px" }}>
                      {form.fflConsent && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <span style={{ fontSize: "11px", color: t.textMuted, fontWeight: 300, lineHeight: 1.6, letterSpacing: "0.01em" }}>
                      I understand that all firearm purchases require FFL transfer through a licensed dealer in my state.
                    </span>
                  </label>

                  <button onClick={() => { setContactModalContext('question'); handleSubmit() }} disabled={formStatus === 'submitting'}
                    style={{ width: "100%", padding: "14px", background: formStatus === 'submitting' ? t.gold + "80" : t.gold, border: "none", color: "#fff", fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 600, cursor: formStatus === 'submitting' ? "wait" : "pointer", borderRadius: "1px", transition: "all 0.22s" }}
                    onMouseEnter={e => { if (formStatus !== 'submitting') e.currentTarget.style.background = t.goldLight }}
                    onMouseLeave={e => { if (formStatus !== 'submitting') e.currentTarget.style.background = t.gold }}>
                    {formStatus === 'submitting' ? "Sending…" : "Send Inquiry"}
                  </button>
                  {formStatus === 'error' && (
                    <p style={{ fontSize: "11px", color: "#c0392b", textAlign: "center", marginTop: "8px", fontFamily: "'Inter',sans-serif" }}>
                      Something went wrong — please try again or email {settings?.contact.emailSales ?? "sales@luxus-collection.com"}.
                    </p>
                  )}
                  <p style={{ fontSize: "9.5px", color: t.textDim, textAlign: "center", marginTop: "12px", letterSpacing: "0.03em", fontWeight: 300 }}>
                    We typically respond within one business day.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Related products ─────────────────────────────────────────────── */}
      {relatedProducts.length > 0 && (
        <section style={{ padding: "80px 40px 96px" }}>
          <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "44px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <div style={{ width: "18px", height: "1px", background: t.gold }} />
                  <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>
                    {product.brand ? `More From ${product.brand}` : "You May Also Consider"}
                  </span>
                </div>
                <h2 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(24px,2.8vw,38px)", fontWeight: 300, color: t.text, lineHeight: 1.1, letterSpacing: "0.01em" }}>
                  You May Also Consider
                </h2>
              </div>
              <Link href="/shop"
                style={{ fontSize: "9px", letterSpacing: "0.13em", textTransform: "uppercase", color: t.gold, borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px", fontWeight: 500, flexShrink: 0, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = t.goldLight)}
                onMouseLeave={e => (e.currentTarget.style.color = t.gold)}>
                View All
              </Link>
            </div>
            <div className="lxs-pdp-related" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "18px", alignItems: "stretch" }}>
              {relatedProducts.map(p => <RelatedCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightboxOpen && (
        <div onClick={() => setLightboxOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(8,7,6,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: "40px 20px" }}>
          <button onClick={() => setLightboxOpen(false)}
            style={{ position: "absolute", top: "24px", right: "28px", background: "none", border: "1px solid #3a3a3a", padding: "8px 14px", cursor: "pointer", color: "#9a9a9a", display: "flex", alignItems: "center", gap: "8px", fontFamily: "'Inter',sans-serif", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 500 }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            Close
          </button>

          <div onClick={e => e.stopPropagation()}
            style={{ maxWidth: "min(90vw,1000px)", width: "100%", aspectRatio: "4/3", maxHeight: "80vh", border: "1px solid #2a2a2a", position: "relative", background: "#161616" }}>
            {images[activeImg] ? (
              <Image src={images[activeImg]} alt={product.title} fill style={{ objectFit: "contain" }} sizes="80vw" />
            ) : (
              <ImgBox index={activeImg} />
            )}
            {images.length > 1 && (
              <>
                <button onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                  style={{ position: "absolute", left: "-52px", top: "50%", transform: "translateY(-50%)", background: "none", border: "1px solid #2a2a2a", width: "40px", height: "40px", cursor: "pointer", color: "#9a9a9a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button onClick={() => setActiveImg(i => (i + 1) % images.length)}
                  style={{ position: "absolute", right: "-52px", top: "50%", transform: "translateY(-50%)", background: "none", border: "1px solid #2a2a2a", width: "40px", height: "40px", cursor: "pointer", color: "#9a9a9a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div style={{ marginTop: "20px", display: "flex", gap: "8px" }}>
              {images.map((src, i) => (
                <div key={i} onClick={e => { e.stopPropagation(); setActiveImg(i) }}
                  style={{ height: "52px", aspectRatio: "4/3", border: `1px solid ${i === activeImg ? "#c09530" : "#2a2a2a"}`, opacity: i === activeImg ? 1 : 0.5, cursor: "pointer", transition: "all 0.2s", overflow: "hidden", position: "relative", background: "#161616" }}>
                  {src ? (
                    <Image src={src} alt="" fill style={{ objectFit: "contain" }} sizes="52px" />
                  ) : (
                    <ImgBox index={i} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Contact / pricing modal ──────────────────────────────────────── */}
      {contactModalOpen && (
        <div onClick={() => { if (formStatus !== 'submitting') { setContactModalOpen(false); if (formStatus === 'success') setFormStatus('idle') } }}
          style={{ position: "fixed", inset: 0, zIndex: 10001, background: "rgba(8,7,6,0.82)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", overflowY: "auto" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "520px", background: "#fff", border: `1px solid ${t.border}`, borderTop: `2px solid ${t.gold}`, boxShadow: "0 30px 80px rgba(0,0,0,0.18)", position: "relative", padding: "40px 44px 36px", fontFamily: "'Inter',sans-serif" }}>
            <button onClick={() => { setContactModalOpen(false); if (formStatus === 'success') setFormStatus('idle') }}
              style={{ position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", background: "none", border: `1px solid ${t.border}`, color: t.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold + "60"; e.currentTarget.style.color = t.gold }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            </button>

            {formStatus === 'success' ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ width: "52px", height: "52px", border: `1px solid ${t.gold}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>
                  <svg width="20" height="15" viewBox="0 0 20 15" fill="none"><path d="M1 7.5L7 13.5L19 1.5" stroke={t.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div style={{ fontFamily: PLAYFAIR, fontSize: "26px", fontWeight: 400, color: t.text, marginBottom: "10px" }}>Inquiry Received</div>
                <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted, lineHeight: 1.8, maxWidth: "360px", margin: "0 auto 24px" }}>
                  Thank you, {form.firstName}. A specialist will reach out to <span style={{ color: t.text }}>{form.email}</span> within one business day.
                </p>
                <button onClick={() => { setContactModalOpen(false); setFormStatus('idle') }}
                  style={{ padding: "11px 28px", background: "transparent", border: `1px solid ${t.border}`, color: t.textMuted, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 500, cursor: "pointer", transition: "all 0.18s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold + "60"; e.currentTarget.style.color = t.gold }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted }}>
                  Close
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ width: "20px", height: "1px", background: t.gold }} />
                  <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>Pricing Inquiry</span>
                </div>
                <h2 style={{ fontFamily: PLAYFAIR, fontSize: "26px", fontWeight: 400, color: t.text, lineHeight: 1.2, marginBottom: "8px" }}>
                  Contact Us for Pricing
                </h2>
                <p style={{ fontSize: "12.5px", fontWeight: 300, color: t.textMuted, lineHeight: 1.75, marginBottom: "26px" }}>
                  Tell us about yourself and a specialist will follow up regarding the <span style={{ color: t.text }}>{product.title}</span>.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {[
                    { key: "firstName", label: "Name",         type: "text",  required: true,  ph: "Your full name" },
                    { key: "email",     label: "Email",        type: "email", required: true,  ph: "you@example.com" },
                    { key: "phone",     label: "Phone Number", type: "tel",   required: false, ph: "(555) 123-4567" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display: "block", fontSize: "8.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.textMuted, fontWeight: 500, marginBottom: "6px" }}>
                        {f.label} {f.required && <span style={{ color: t.gold }}>*</span>}
                      </label>
                      <input type={f.type} value={form[f.key as keyof typeof form] as string}
                        onChange={e => handleFormChange(f.key, e.target.value)}
                        placeholder={f.ph}
                        style={{ ...inputStyle, padding: "11px 14px", fontSize: "13px" }}
                        onFocus={e => (e.currentTarget.style.borderColor = t.gold + "70")}
                        onBlur={e => (e.currentTarget.style.borderColor = t.border)} />
                    </div>
                  ))}

                  <div>
                    <label style={{ display: "block", fontSize: "8.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.textMuted, fontWeight: 500, marginBottom: "6px" }}>Message</label>
                    <textarea value={form.message} onChange={e => handleFormChange("message", e.target.value)} rows={4}
                      placeholder="Anything specific you'd like to know?"
                      style={{ ...inputStyle, padding: "11px 14px", fontSize: "13px", lineHeight: 1.6, resize: "vertical" }}
                      onFocus={e => (e.currentTarget.style.borderColor = t.gold + "70")}
                      onBlur={e => (e.currentTarget.style.borderColor = t.border)} />
                  </div>

                  <button onClick={handleSubmit} disabled={formStatus === 'submitting' || !form.firstName || !form.email}
                    style={{ marginTop: "8px", padding: "13px 32px", background: (!form.firstName || !form.email) ? t.gold + "55" : t.gold, border: "none", color: "#fff", fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 600, cursor: (!form.firstName || !form.email || formStatus === 'submitting') ? "not-allowed" : "pointer", transition: "background 0.2s" }}
                    onMouseEnter={e => { if (form.firstName && form.email && formStatus !== 'submitting') e.currentTarget.style.background = t.goldLight }}
                    onMouseLeave={e => { if (form.firstName && form.email && formStatus !== 'submitting') e.currentTarget.style.background = t.gold }}>
                    {formStatus === 'submitting' ? "Sending…" : "Send Inquiry"}
                  </button>
                  {formStatus === 'error' && (
                    <p style={{ fontSize: "11px", color: "#c0392b", textAlign: "center", marginTop: "8px", fontFamily: "'Inter',sans-serif" }}>
                      Something went wrong — please try again or email {settings?.contact.emailSales ?? "sales@luxus-collection.com"}.
                    </p>
                  )}
                  <p style={{ fontSize: "10.5px", fontWeight: 300, color: t.textDim, textAlign: "center", marginTop: "8px" }}>
                    We typically respond within one business day. <span style={{ color: t.gold }}>*</span> required
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Make an Offer modal ─────────────────────────────────────────── */}
      {offerModalOpen && (
        <MakeAnOfferModal
          productId={product.id}
          productTitle={product.title}
          productHandle={product.handle}
          listedPrice={product.price}
          contactForPricing={product.contact_for_pricing}
          onClose={() => setOfferModalOpen(false)}
        />
      )}
    </div>
  )
}
