'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { useCart } from '@/context/CartContext'
import { isWishlisted, toggleWishlist } from '@/lib/auth'
import type { MappedProduct } from '@/lib/medusa'
import type { HeroSlidesData } from '@/lib/payload'
import HeroSection from './HeroSection'

/* ── Types ────────────────────────────────────────────────────────────── */

type HeroProduct = {
  label: string
  title: string
  caliber: string | null
  action: string | null
  price: number | null
  contactForPricing: boolean
  handle: string | null
}

type ShopItem = { id: string; name: string; handle?: string; imageUrl?: string }

function toSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/\s*&\s*/g, '-')
    .replace(/\s+and\s+/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

type Auction = {
  id: number
  title: string
  thumbnail: string | null
  currentBid: number
  bidCount: number
  timeLeft: string
  buyNowPrice: number | null
  reserveMet: boolean | null
  gunBrokerUrl: string
}

type Article = {
  id: string
  category: string
  title: string
  excerpt: string
  date: string
  slug: string
  img?: string | null
}

/* ── Static mock data ─────────────────────────────────────────────────── */

type BrandItem = { name: string; slug: string }

const MOCK_AUCTIONS: Auction[] = [
  { id: 1086459123, title: "Wilson Combat Bill Wilson Carry .45 ACP",  thumbnail: null, currentBid: 2850, bidCount: 14, timeLeft: "2d 14h", buyNowPrice: 3995, reserveMet: true,  gunBrokerUrl: "https://www.gunbroker.com/item/1086459123" },
  { id: 1086459124, title: "Korth Sky Marshal 9mm, Engraved Edition",  thumbnail: null, currentBid: 4200, bidCount: 9,  timeLeft: "1d 06h", buyNowPrice: null, reserveMet: false, gunBrokerUrl: "https://www.gunbroker.com/item/1086459124" },
  { id: 1086459125, title: "Colt Python 6-inch, 1981 Production",      thumbnail: null, currentBid: 3475, bidCount: 22, timeLeft: "4d 22h", buyNowPrice: 4250, reserveMet: true,  gunBrokerUrl: "https://www.gunbroker.com/item/1086459125" },
  { id: 1086459126, title: "Nighthawk Custom President, Damascus",     thumbnail: null, currentBid: 6100, bidCount: 5,  timeLeft: "5h 42m", buyNowPrice: null, reserveMet: true,  gunBrokerUrl: "https://www.gunbroker.com/item/1086459126" },
  { id: 1086459127, title: "Cabot Guns S100 Mirror Polish",            thumbnail: null, currentBid: 7250, bidCount: 11, timeLeft: "3d 18h", buyNowPrice: 8900, reserveMet: true,  gunBrokerUrl: "https://www.gunbroker.com/item/1086459127" },
  { id: 1086459128, title: "SIG Sauer P210 Target, Swiss Production",  thumbnail: null, currentBid: 1675, bidCount: 3,  timeLeft: "6d 02h", buyNowPrice: 2199, reserveMet: false, gunBrokerUrl: "https://www.gunbroker.com/item/1086459128" },
  { id: 1086459129, title: "Korth Mongoose .44 Magnum, Stainless",     thumbnail: null, currentBid: 5800, bidCount: 17, timeLeft: "9h 18m", buyNowPrice: null, reserveMet: true,  gunBrokerUrl: "https://www.gunbroker.com/item/1086459129" },
]

/* ── Helpers ──────────────────────────────────────────────────────────── */

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)

const PLAYFAIR = "var(--font-playfair), serif"

/* ── ImgBox placeholder ───────────────────────────────────────────────── */

function ImgBox({ style = {} }: { style?: React.CSSProperties }) {
  const { t } = useTheme()
  return (
    <div style={{
      background: "linear-gradient(140deg,#e8e8eb 0%,#d4d4d8 50%,#e8e8eb 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", ...style,
    }}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" opacity="0.18">
        <rect x="2" y="2" width="32" height="32" rx="1" stroke={t.gold} strokeWidth="0.8" />
        <circle cx="12" cy="13" r="3.5" stroke={t.gold} strokeWidth="0.8" />
        <path d="M2 25L10 17L16 22L24 12L34 22V34H2V25Z" stroke={t.gold} strokeWidth="0.8" />
      </svg>
    </div>
  )
}

/* ── SectionHead ──────────────────────────────────────────────────────── */

function SectionHead({ eyebrow, title, center = false }: {
  eyebrow: string; title: string; center?: boolean
}) {
  const { t } = useTheme()
  return (
    <div style={{ marginBottom: "44px", textAlign: center ? "center" : "left" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: center ? "center" : "flex-start", marginBottom: "10px" }}>
        <div style={{ width: "20px", height: "1px", background: t.gold, flexShrink: 0 }} />
        <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 500, color: t.gold }}>
          {eyebrow}
        </span>
      </div>
      <div style={{ fontFamily: PLAYFAIR, fontSize: "clamp(28px,3vw,42px)", fontWeight: 300, color: t.text, lineHeight: 1.1, letterSpacing: "0.01em" }}>
        {title}
      </div>
    </div>
  )
}

/* ── ProductCard ──────────────────────────────────────────────────────── */

function ProductCard({ product, small = false }: {
  product: MappedProduct; small?: boolean
}) {
  const { t } = useTheme()
  const { addItem } = useCart()
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

  return (
    <Link href={`/product/${product.handle}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? t.bgCardHover : t.bgCard,
        border: `1px solid ${hov ? t.gold + "55" : t.border}`,
        borderRadius: "1px", overflow: "hidden",
        textDecoration: "none", color: "inherit",
        transition: "all 0.28s ease",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov
          ? `0 16px 48px rgba(0,0,0,0.1), 0 0 0 1px ${t.gold}30`
          : "0 2px 8px rgba(0,0,0,0.05)",
        cursor: "pointer", position: "relative",
        fontFamily: "'Inter',sans-serif",
        display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden", flexShrink: 0 }}>
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            style={{ objectFit: "contain", filter: !product.in_stock ? "grayscale(0.55) brightness(0.78)" : "none" }}
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <ImgBox style={{ width: "100%", height: "100%", filter: !product.in_stock ? "grayscale(0.55) brightness(0.78)" : "none" }} />
        )}
        {product.details?.primary_category && product.in_stock && (
          <div style={{
            position: "absolute", top: "10px", left: "10px",
            background: "rgba(255,255,255,0.88)",
            border: `1px solid ${t.gold}50`, padding: "3px 9px",
            fontSize: "8.5px", letterSpacing: "0.14em", textTransform: "uppercase",
            fontWeight: 500, color: t.gold, backdropFilter: "blur(6px)",
          }}>
            {product.details.primary_category}
          </div>
        )}
        {/* Availability badge */}
        <div style={{
          position: "absolute", top: "10px", right: "10px",
          display: "flex", alignItems: "center",
          background: "rgba(255,255,255,0.88)",
          border: `1px solid ${product.in_stock ? "#3a6a3a55" : "#6a3a3a55"}`,
          padding: "3px 9px", backdropFilter: "blur(6px)",
        }}>
          <span style={{ fontSize: "8.5px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: product.in_stock ? "#3a6a3a" : "#6a3a3a" }}>
            {product.in_stock ? "Available" : "Unavailable"}
          </span>
        </div>
      </div>
      <div style={{ padding: small ? "14px 15px 16px" : "18px 20px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div className="lxs-card-brand" style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "5px" }}>
          {product.attributes?.brand}
        </div>
        <div className="lxs-card-title" style={{ fontFamily: PLAYFAIR, fontSize: small ? "15px" : "19px", fontWeight: 400, color: t.text, lineHeight: 1.2, marginBottom: "5px" }}>
          {product.title}
        </div>
        <div className="lxs-card-sub" style={{ fontSize: "10.5px", color: t.textMuted, fontWeight: 300, letterSpacing: "0.04em", marginBottom: "13px" }}>
          {[product.attributes?.caliber, product.attributes?.action].filter(Boolean).join(" · ")}
        </div>
        <div style={{ height: "1px", background: t.border, marginBottom: "13px", marginTop: "auto" }} />
        <div className="lxs-card-price-row" style={{ display: "flex", alignItems: "center", justifyContent: product.in_stock ? "space-between" : "flex-end", gap: "8px" }}>
          {product.in_stock && (
            <div style={{
              fontSize: product.contact_for_pricing ? "10px" : (small ? "13px" : "15px"),
              fontWeight: product.contact_for_pricing ? 400 : 500,
              color: product.contact_for_pricing ? t.gold : t.text,
              letterSpacing: product.contact_for_pricing ? "0.04em" : "0.01em",
            }}>
              {product.contact_for_pricing ? "Contact Us For Pricing" : (product.price ? fmt(product.price) : "—")}
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

/* ── AuctionCard ──────────────────────────────────────────────────────── */

function AuctionCard({ auction }: { auction: Auction }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  return (
    <a
      href={auction.gunBrokerUrl}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? t.bgCardHover : t.bgCard,
        border: `1px solid ${hov ? t.gold + "55" : t.border}`,
        borderRadius: "1px", overflow: "hidden",
        transition: "all 0.28s ease",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov
          ? `0 16px 48px rgba(0,0,0,0.1), 0 0 0 1px ${t.gold}30`
          : "0 2px 8px rgba(0,0,0,0.05)",
        cursor: "pointer", position: "relative",
        fontFamily: "'Inter',sans-serif",
        display: "flex", flexDirection: "column",
        textDecoration: "none", color: "inherit",
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden", flexShrink: 0 }}>
        {auction.thumbnail ? (
          <Image src={auction.thumbnail} alt={auction.title} fill style={{ objectFit: "contain" }} sizes="25vw" />
        ) : (
          <ImgBox style={{ width: "100%", height: "100%" }} />
        )}
        <div style={{
          position: "absolute", top: "12px", left: "12px",
          display: "flex", alignItems: "center",
          background: "rgba(255,255,255,0.92)",
          border: "1px solid #3a6a3a55", padding: "4px 10px", backdropFilter: "blur(6px)",
        }}>
          <span style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#3a6a3a", fontWeight: 600 }}>
            Live
          </span>
        </div>
        <div style={{
          position: "absolute", top: "12px", right: "12px",
          background: "rgba(255,255,255,0.92)",
          border: `1px solid ${t.border}`, padding: "4px 10px", backdropFilter: "blur(6px)",
          fontSize: "8.5px", letterSpacing: "0.16em", textTransform: "uppercase",
          fontWeight: 500, color: t.text,
        }}>
          {auction.timeLeft}
        </div>
      </div>
      <div style={{ padding: "18px 20px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "6px" }}>
          GunBroker Auction
        </div>
        <div style={{ fontFamily: PLAYFAIR, fontSize: "17px", fontWeight: 400, color: t.text, lineHeight: 1.25, marginBottom: "14px" }}>
          {auction.title}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "12px" }}>
          <div>
            <div style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "3px" }}>
              {auction.reserveMet === false ? "Current Bid · Reserve not met" : "Current Bid"}
            </div>
            <div style={{ fontSize: "20px", fontWeight: 500, color: t.text, letterSpacing: "0.01em" }}>
              {fmt(auction.currentBid)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "3px" }}>
              Bids
            </div>
            <div style={{ fontSize: "16px", fontWeight: 400, color: t.text, fontFamily: PLAYFAIR }}>
              {auction.bidCount}
            </div>
          </div>
        </div>
        {auction.buyNowPrice && (
          <div style={{ fontSize: "10.5px", color: t.textMuted, fontWeight: 300, marginBottom: "10px", letterSpacing: "0.02em" }}>
            Buy Now: <span style={{ color: t.text, fontWeight: 500 }}>{fmt(auction.buyNowPrice)}</span>
          </div>
        )}
        <div style={{ height: "1px", background: t.border, marginBottom: "13px", marginTop: "auto" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, color: t.gold, borderBottom: `1px solid ${t.gold}55`, paddingBottom: "1px", opacity: hov ? 1 : 0.75, transition: "opacity 0.2s" }}>
            View on GunBroker
          </span>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ color: t.gold }}>
            <path d="M3 1H10V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 1L4.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M1 4V10H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </a>
  )
}

/* ── BrandTile ────────────────────────────────────────────────────────── */

function BrandTile({ brand }: { brand: BrandItem }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  return (
    <Link href={`/brand/${brand.slug}`}
      className="lxs-home-brand-tile"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: `1px solid ${hov ? t.gold + "60" : t.border}`,
        background: hov ? "#fafafa" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.24s", borderRadius: "1px",
        textDecoration: "none",
      }}
    >
      <span style={{ fontFamily: PLAYFAIR, fontSize: "13.5px", fontWeight: 400, color: hov ? t.gold : t.textMuted, transition: "color 0.24s", textAlign: "center", padding: "0 12px", letterSpacing: "0.04em" }}>
        {brand.name}
      </span>
    </Link>
  )
}

/* ── CategoryTile ─────────────────────────────────────────────────────── */

function CategoryTile({ item, href }: { item: ShopItem; href: string }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  return (
    <Link href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative", borderRadius: "1px", overflow: "hidden",
        cursor: "pointer", border: `1px solid ${hov ? t.gold + "50" : t.border}`,
        transition: "border-color 0.24s", textDecoration: "none", display: "block",
      }}
    >
      <div style={{ position: "relative", height: "130px", overflow: "hidden" }}>
        {item.imageUrl
          ? <Image src={item.imageUrl} alt={item.name} fill style={{ objectFit: "cover", transform: hov ? "scale(1.04)" : "scale(1)", transition: "transform 0.4s ease" }} sizes="(max-width:640px) 50vw, 20vw" />
          : <ImgBox style={{ height: "130px", transform: hov ? "scale(1.04)" : "scale(1)", transition: "transform 0.4s ease" }} />
        }
      </div>
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 14px 12px",
        background: item.imageUrl
          ? "linear-gradient(to top,rgba(0,0,0,0.55),transparent)"
          : "linear-gradient(to top,rgba(255,255,255,0.97),rgba(255,255,255,0.5))",
      }}>
        <div style={{ fontFamily: PLAYFAIR, fontSize: "15px", fontWeight: 400, color: item.imageUrl ? "#fff" : t.text, letterSpacing: "0.02em" }}>
          {item.name}
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: `${t.gold}07`, opacity: hov ? 1 : 0, transition: "opacity 0.24s", pointerEvents: "none" }} />
    </Link>
  )
}

/* ── ArticleCard ──────────────────────────────────────────────────────── */

function ArticleCard({ article }: { article: Article }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  return (
    <Link href={`/article/${article.slug}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ cursor: "pointer", textDecoration: "none", display: "block" }}
    >
      <div style={{ position: "relative", marginBottom: "18px", overflow: "hidden", borderRadius: "1px", border: `1px solid ${t.border}`, height: "200px" }}>
        {article.img
          ? <Image src={article.img} alt={article.title} fill sizes="(max-width:768px) 100vw, 33vw" style={{ objectFit: "cover", transform: hov ? "scale(1.04)" : "scale(1)", transition: "transform 0.4s ease" }} />
          : <ImgBox style={{ height: "200px", transform: hov ? "scale(1.04)" : "scale(1)", transition: "transform 0.4s ease" }} />
        }
      </div>
      <div style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "8px" }}>
        {article.category}
      </div>
      <div style={{ fontFamily: PLAYFAIR, fontSize: "20px", fontWeight: 400, color: hov ? t.gold : t.text, lineHeight: 1.3, marginBottom: "10px", transition: "color 0.22s" }}>
        {article.title}
      </div>
      <div style={{ fontSize: "12.5px", fontWeight: 300, color: t.textMuted, lineHeight: 1.75, marginBottom: "14px" }}>
        {article.excerpt}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "9px", letterSpacing: "0.08em", color: t.textDim }}>{article.date}</span>
        <span style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.gold, borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px", fontWeight: 500 }}>
          Read More
        </span>
      </div>
    </Link>
  )
}

/* ── BrowseScroll ─────────────────────────────────────────────────────── */

function BrowseScroll({
  gridClass, items, renderItem,
}: {
  gridClass: string
  items: ShopItem[]
  renderItem: (item: ShopItem) => React.ReactNode
}) {
  const { t } = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft]   = useState(false)
  const [canRight, setCanRight] = useState(true)  // optimistic: show fade on mount

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => {
      setCanLeft(el.scrollLeft > 2)
      setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [items])

  const doScroll = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth, behavior: 'smooth' })
  }

  const btnStyle = (side: 'left' | 'right'): React.CSSProperties => ({
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    [side]: '10px', zIndex: 3,
    background: 'rgba(255,255,255,0.92)',
    border: `1px solid ${t.gold}55`, color: t.gold,
    width: '36px', height: '36px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', borderRadius: '1px',
    fontSize: '22px', lineHeight: '1', fontFamily: 'sans-serif',
    outline: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    transition: 'background 0.2s, border-color 0.2s',
  })

  return (
    <div style={{ position: 'relative' }}>
      {canLeft  && <button className="lxs-browse-arrow" style={btnStyle('left')}  onClick={() => doScroll(-1)} aria-label="Previous">‹</button>}
      <div ref={ref} className={gridClass} onScroll={() => {
        const el = ref.current!
        setCanLeft(el.scrollLeft > 2)
        setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2)
      }}>
        {items.map(item => renderItem(item))}
      </div>
      {canRight && <button className="lxs-browse-arrow" style={btnStyle('right')} onClick={() => doScroll(1)}  aria-label="Next">›</button>}
      {/* Mobile-only edge fades — hint that content continues */}
      <div className="lxs-browse-fade-r" style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '52px',
        background: `linear-gradient(to right, transparent, #f3f3f5)`,
        pointerEvents: 'none', zIndex: 2,
        opacity: canRight ? 1 : 0, transition: 'opacity 0.35s',
      }} />
      <div className="lxs-browse-fade-l" style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '52px',
        background: `linear-gradient(to left, transparent, #f3f3f5)`,
        pointerEvents: 'none', zIndex: 2,
        opacity: canLeft ? 1 : 0, transition: 'opacity 0.35s',
      }} />
    </div>
  )
}

/* ── Main export ──────────────────────────────────────────────────────── */

export default function HomePage({
  heroProduct,
  heroData,
  featuredProducts,
  newArrivals,
  collections,
  categories,
  articles = [],
  brands = [],
}: {
  heroProduct: HeroProduct
  heroData?: HeroSlidesData
  featuredProducts: MappedProduct[]
  newArrivals: MappedProduct[]
  collections: ShopItem[]
  categories: ShopItem[]
  articles?: Article[]
  brands?: BrandItem[]
}) {
  const { t } = useTheme()
  const [tab, setTab] = useState<"collections" | "categories">("collections")
  const [email, setEmail] = useState("")
  const [nlStatus, setNlStatus] = useState<"idle" | "submitting" | "success" | "duplicate" | "error">("idle")


  const PAYLOAD_URL = process.env.NEXT_PUBLIC_PAYLOAD_URL ?? "https://api.luxus-collection.com/cms"

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setNlStatus("submitting")
    try {
      const res = await fetch(`${PAYLOAD_URL}/api/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "homepage" }),
      })
      if (res.status === 400) {
        const json = await res.json().catch(() => ({}))
        const msg = (json?.errors?.[0]?.message ?? "").toLowerCase()
        if (msg.includes("already subscribed") || msg.includes("unique")) {
          setNlStatus("duplicate"); return
        }
      }
      if (!res.ok) throw new Error()
      setEmail("")
      setNlStatus("success")
    } catch {
      setNlStatus("error")
    }
  }

  const featured = featuredProducts
  const arrivals = newArrivals


  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "'Inter',sans-serif" }}>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* HERO                                                           */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <HeroSection heroData={heroData} />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* FEATURED COLLECTION                                            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {featured.length > 0 && (
        <section className="lxs-home-section">
          <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <SectionHead eyebrow="Handpicked Pieces" title="Featured Collection" />
              <Link href="/shop" style={{ fontSize: "9px", letterSpacing: "0.13em", textTransform: "uppercase", color: t.gold, borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px", fontWeight: 500, marginBottom: "44px", flexShrink: 0, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = t.goldLight)}
                onMouseLeave={e => (e.currentTarget.style.color = t.gold)}>
                View All
              </Link>
            </div>
            <div className="lxs-home-product-grid" style={{ display: "grid" }}>
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Divider */}
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 40px" }}>
        <div style={{ height: "1px", background: `linear-gradient(to right, transparent, ${t.border}, transparent)` }} />
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SHOP BY BRAND                                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="lxs-home-section">
        <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
          <SectionHead eyebrow="Manufacturers" title="Shop By Brand" center />
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "12px" }}>
            {brands.map(b => <BrandTile key={b.slug} brand={b} />)}
          </div>
          <div style={{ textAlign: "center", marginTop: "28px" }}>
            <Link href="/shop/brands" style={{ fontFamily: "'Inter',sans-serif", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.gold, textDecoration: "none", fontWeight: 500 }}>
              View All Brands →
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* COLLECTIONS & CATEGORIES                                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="lxs-home-section" style={{ background: "linear-gradient(to bottom,transparent,#f3f3f5 10%,#f3f3f5 90%,transparent)" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "44px", borderBottom: `1px solid ${t.border}`, paddingBottom: "0" }}>
            <div style={{ display: "flex", gap: "0" }}>
              {(["collections", "categories"] as const).map(v => (
                <div key={v} onClick={() => setTab(v)} style={{
                  padding: "0 32px 16px 0",
                  borderBottom: `2px solid ${tab === v ? t.gold : "transparent"}`,
                  cursor: "pointer", transition: "all 0.2s", marginBottom: "-1px",
                }}>
                  <div style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 500, color: tab === v ? t.gold : t.textMuted, fontFamily: "'Inter',sans-serif", marginBottom: "4px" }}>
                    Browse by
                  </div>
                  <div style={{ fontFamily: PLAYFAIR, fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 300, color: tab === v ? t.text : t.textDim, transition: "color 0.2s" }}>
                    {v === "collections" ? "Collections" : "Categories"}
                  </div>
                </div>
              ))}
            </div>
            <Link href="/shop"
              style={{ fontSize: "9px", letterSpacing: "0.13em", textTransform: "uppercase", color: t.gold, borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px", fontWeight: 500, marginBottom: "18px", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = t.goldLight)}
              onMouseLeave={e => (e.currentTarget.style.color = t.gold)}>
              View All
            </Link>
          </div>
          <BrowseScroll
            key={tab}
            gridClass={tab === "collections" ? "lxs-browse-grid-col" : "lxs-browse-grid-cat"}
            items={tab === "collections" ? collections : categories}
            renderItem={(item) => (
              <CategoryTile
                key={item.id}
                item={item}
                href={tab === "collections" ? `/collection/${item.handle ?? toSlug(item.name)}` : `/category/${item.handle ?? toSlug(item.name)}`}
              />
            )}
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* NEW ARRIVALS                                                   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {arrivals.length > 0 && (
        <section className="lxs-home-section">
          <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <SectionHead eyebrow="Just Arrived" title="New Arrivals" />
              <Link href="/shop?order=newest" style={{ fontSize: "9px", letterSpacing: "0.13em", textTransform: "uppercase", color: t.gold, borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px", fontWeight: 500, marginBottom: "44px", flexShrink: 0, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = t.goldLight)}
                onMouseLeave={e => (e.currentTarget.style.color = t.gold)}>
                View All
              </Link>
            </div>
            <div className="lxs-home-product-grid" style={{ display: "grid" }}>
              {arrivals.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* LIVE GUNBROKER AUCTIONS                                        */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="lxs-home-section">
        <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <SectionHead eyebrow="Live at Auction" title="Currently on GunBroker" />
            <a
              href="https://www.gunbroker.com/All/search?Sort=13&Keywords=Luxus%20Collection"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "9px", letterSpacing: "0.13em", textTransform: "uppercase", color: t.gold, borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px", fontWeight: 500, marginBottom: "44px", flexShrink: 0, textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = t.goldLight)}
              onMouseLeave={e => (e.currentTarget.style.color = t.gold)}
            >
              View All on GunBroker
              <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
                <path d="M3 1H10V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 1L4.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M1 4V10H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
          <div className="lxs-auction-grid" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "18px" }}>
            {MOCK_AUCTIONS.map(a => (
              <div key={a.id} style={{ flex: "0 1 calc(25% - 13.5px)", minWidth: "240px", maxWidth: "calc(25% - 13.5px)", display: "grid" }}>
                <AuctionCard auction={a} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: "32px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <div style={{ width: "20px", height: "1px", background: t.border }} />
            <span style={{ fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.textDim, fontWeight: 400 }}>
              Test data · Live GunBroker integration coming soon
            </span>
            <div style={{ width: "20px", height: "1px", background: t.border }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* FROM THE BLOG                                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="lxs-home-section">
        <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <SectionHead eyebrow="Editorial" title="From The Blog" />
            <Link href="/articles" style={{ fontSize: "9px", letterSpacing: "0.13em", textTransform: "uppercase", color: t.gold, borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px", fontWeight: 500, marginBottom: "44px", flexShrink: 0, textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = t.goldLight)}
              onMouseLeave={e => (e.currentTarget.style.color = t.gold)}>
              All Articles
            </Link>
          </div>
          <div className="lxs-home-article-grid" style={{ display: "grid" }}>
            {articles.map(a => <ArticleCard key={a.id} article={a} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* NEWSLETTER                                                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="lxs-home-newsletter" style={{
        background: "#f3f3f5",
        borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`,
      }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "14px" }}>
            The Inner Circle
          </div>
          <div style={{ fontFamily: PLAYFAIR, fontSize: "34px", fontWeight: 300, color: t.text, lineHeight: 1.15, marginBottom: "14px" }}>
            The Collector&apos;s<br />Newsletter
          </div>
          <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted, lineHeight: 1.8, marginBottom: "30px" }}>
            New acquisitions, exclusive access, editorial features, and curated insights — delivered to the discerning few.
          </p>

          {nlStatus === "success" ? (
            <div style={{ padding: "16px 20px", border: `1px solid ${t.border}`, background: t.bg, maxWidth: "420px", margin: "0 auto" }}>
              <div style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "5px", fontFamily: "var(--font-inter)" }}>You&apos;re in</div>
              <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted, fontFamily: "var(--font-inter)", margin: 0, lineHeight: 1.7 }}>
                Thank you — you&apos;ll hear from us every Friday.
              </p>
            </div>
          ) : nlStatus === "duplicate" ? (
            <div style={{ padding: "16px 20px", border: `1px solid ${t.border}`, background: t.bg, maxWidth: "420px", margin: "0 auto" }}>
              <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted, fontFamily: "var(--font-inter)", margin: 0, lineHeight: 1.7 }}>
                That email is already subscribed — you&apos;re all set.
              </p>
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} style={{ display: "flex", maxWidth: "420px", margin: "0 auto", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex" }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  style={{ flex: 1, padding: "12px 18px", background: "#fff", border: `1px solid ${t.border}`, borderRight: "none", color: t.text, fontSize: "12px", outline: "none", fontFamily: "var(--font-inter)", letterSpacing: "0.03em" }}
                />
                <button
                  type="submit"
                  disabled={nlStatus === "submitting"}
                  style={{ padding: "12px 22px", background: nlStatus === "submitting" ? t.bgSurface : t.gold, color: nlStatus === "submitting" ? t.textDim : "#fff", border: `1px solid ${nlStatus === "submitting" ? t.border : t.gold}`, fontSize: "8.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 600, cursor: nlStatus === "submitting" ? "default" : "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}
                  onMouseEnter={e => { if (nlStatus !== "submitting") e.currentTarget.style.background = t.goldLight }}
                  onMouseLeave={e => { if (nlStatus !== "submitting") e.currentTarget.style.background = t.gold }}
                >
                  {nlStatus === "submitting" ? "…" : "Subscribe"}
                </button>
              </div>
              {nlStatus === "error" && (
                <p style={{ fontSize: "11px", color: "#c0392b", fontFamily: "var(--font-inter)", margin: 0 }}>
                  Something went wrong — please try again.
                </p>
              )}
            </form>
          )}
        </div>
      </section>

    </div>
  )
}
