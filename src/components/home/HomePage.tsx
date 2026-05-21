'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme, DARK, LIGHT } from '@/context/ThemeContext'
import type { MappedProduct } from '@/lib/medusa'

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

type ShopItem = { id: string; name: string }

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
}

/* ── Static mock data ─────────────────────────────────────────────────── */

const BRANDS = [
  { id: "1", name: "Nighthawk Custom", slug: "nighthawk-custom" },
  { id: "2", name: "Cabot Guns",       slug: "cabot-guns"       },
  { id: "3", name: "Korth",            slug: "korth"            },
  { id: "4", name: "SIG Sauer",        slug: "sig-sauer"        },
  { id: "5", name: "Colt",             slug: "colt"             },
  { id: "6", name: "Wilson Combat",    slug: "wilson-combat"    },
]

const MOCK_AUCTIONS: Auction[] = [
  { id: 1086459123, title: "Wilson Combat Bill Wilson Carry .45 ACP",  thumbnail: null, currentBid: 2850, bidCount: 14, timeLeft: "2d 14h", buyNowPrice: 3995, reserveMet: true,  gunBrokerUrl: "https://www.gunbroker.com/item/1086459123" },
  { id: 1086459124, title: "Korth Sky Marshal 9mm, Engraved Edition",  thumbnail: null, currentBid: 4200, bidCount: 9,  timeLeft: "1d 06h", buyNowPrice: null, reserveMet: false, gunBrokerUrl: "https://www.gunbroker.com/item/1086459124" },
  { id: 1086459125, title: "Colt Python 6-inch, 1981 Production",      thumbnail: null, currentBid: 3475, bidCount: 22, timeLeft: "4d 22h", buyNowPrice: 4250, reserveMet: true,  gunBrokerUrl: "https://www.gunbroker.com/item/1086459125" },
  { id: 1086459126, title: "Nighthawk Custom President, Damascus",     thumbnail: null, currentBid: 6100, bidCount: 5,  timeLeft: "5h 42m", buyNowPrice: null, reserveMet: true,  gunBrokerUrl: "https://www.gunbroker.com/item/1086459126" },
  { id: 1086459127, title: "Cabot Guns S100 Mirror Polish",            thumbnail: null, currentBid: 7250, bidCount: 11, timeLeft: "3d 18h", buyNowPrice: 8900, reserveMet: true,  gunBrokerUrl: "https://www.gunbroker.com/item/1086459127" },
  { id: 1086459128, title: "SIG Sauer P210 Target, Swiss Production",  thumbnail: null, currentBid: 1675, bidCount: 3,  timeLeft: "6d 02h", buyNowPrice: 2199, reserveMet: false, gunBrokerUrl: "https://www.gunbroker.com/item/1086459128" },
  { id: 1086459129, title: "Korth Mongoose .44 Magnum, Stainless",     thumbnail: null, currentBid: 5800, bidCount: 17, timeLeft: "9h 18m", buyNowPrice: null, reserveMet: true,  gunBrokerUrl: "https://www.gunbroker.com/item/1086459129" },
]

const MOCK_ARTICLES: Article[] = [
  { id: "1", category: "Editor's Note",      slug: "what-we-look-for",         date: "May 19, 2026", title: "What We Look For When We Add a Maker to the Collection",          excerpt: "The intangible qualities, provenance, restraint, craftsmanship that holds up under a loupe, that determine which brands earn a place on our shelves." },
  { id: "2", category: "Engraving",          slug: "reading-an-engravers-hand", date: "May 14, 2026", title: "Reading a Master Engraver's Signature: A Brief Field Guide",        excerpt: "Otto Carter, Tim George, the Whitneys, how to identify the hand behind a piece and what each style commands at auction." },
  { id: "3", category: "Market Watch",       slug: "pre-war-colt-saa",         date: "May 6, 2026",  title: "The Quiet Resurgence of the Pre-War Colt Single Action Army",      excerpt: "First-generation SAA prices have outpaced inflation every year since 2019. We trace the curve and talk to four collectors driving the trend." },
  { id: "4", category: "Craft & Engineering",slug: "inside-cabot-guns",        date: "May 12, 2026", title: "The Geometry of Perfection: Inside Cabot Guns' Machining Process",  excerpt: "How a former aerospace facility in rural Pennsylvania became the birthplace of the world's most precisely manufactured 1911." },
  { id: "5", category: "Collector's Guide",  slug: "korth-vs-manurhin",        date: "Apr 28, 2026", title: "Korth vs. Manurhin: A Study in European Revolver Obsession",         excerpt: "Two countries. Two philosophies. Both defined by a refusal to compromise on the double-action revolver." },
  { id: "6", category: "Brand Spotlight",    slug: "nighthawk-one-gun-promise", date: "Apr 9, 2026",  title: "Nighthawk's One-Gun-One-Gunsmith Promise, Still Worth It in 2026?",  excerpt: "We spend two days in Berryville, Arkansas with the team behind America's most respected custom 1911 shop." },
]

/* ── Helpers ──────────────────────────────────────────────────────────── */

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)

const PLAYFAIR = "var(--font-playfair), serif"

/* ── ImgBox placeholder ───────────────────────────────────────────────── */

function ImgBox({ isDark, style = {} }: { isDark: boolean; style?: React.CSSProperties }) {
  const t = isDark ? DARK : LIGHT
  return (
    <div style={{
      background: isDark
        ? "linear-gradient(140deg,#171717 0%,#1f1f1f 50%,#171717 100%)"
        : "linear-gradient(140deg,#e8e8eb 0%,#d4d4d8 50%,#e8e8eb 100%)",
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

function SectionHead({ eyebrow, title, isDark, center = false }: {
  eyebrow: string; title: string; isDark: boolean; center?: boolean
}) {
  const t = isDark ? DARK : LIGHT
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

function ProductCard({ product, isDark, small = false }: {
  product: MappedProduct; isDark: boolean; small?: boolean
}) {
  const t = isDark ? DARK : LIGHT
  const [hov, setHov] = useState(false)
  const router = useRouter()

  return (
    <div
      onClick={() => router.push(`/product/${product.handle}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? t.bgCardHover : t.bgCard,
        border: `1px solid ${hov ? t.gold + "55" : t.border}`,
        borderRadius: "1px", overflow: "hidden",
        transition: "all 0.28s ease",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov
          ? isDark ? `0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px ${t.gold}25` : `0 16px 48px rgba(0,0,0,0.1), 0 0 0 1px ${t.gold}30`
          : isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.05)",
        cursor: "pointer", position: "relative",
        fontFamily: "'Inter',sans-serif",
        display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        {product.thumbnail ? (
          <div style={{ position: "relative", height: small ? "152px" : "210px" }}>
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          </div>
        ) : (
          <ImgBox isDark={isDark} style={{ height: small ? "152px" : "210px" }} />
        )}
        {product.details?.primary_category && (
          <div style={{
            position: "absolute", top: "10px", left: "10px",
            background: isDark ? "rgba(11,10,9,0.82)" : "rgba(255,255,255,0.88)",
            border: `1px solid ${t.gold}50`, padding: "3px 9px",
            fontSize: "8.5px", letterSpacing: "0.14em", textTransform: "uppercase",
            fontWeight: 500, color: t.gold, backdropFilter: "blur(6px)",
          }}>
            {product.details.primary_category}
          </div>
        )}
      </div>
      <div style={{ padding: small ? "14px 15px 16px" : "18px 20px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "5px" }}>
          {product.attributes?.brand}
        </div>
        <div style={{ fontFamily: PLAYFAIR, fontSize: small ? "15px" : "19px", fontWeight: 400, color: t.text, lineHeight: 1.2, marginBottom: "5px" }}>
          {product.title}
        </div>
        <div style={{ fontSize: "10.5px", color: t.textMuted, fontWeight: 300, letterSpacing: "0.04em", marginBottom: "13px" }}>
          {[product.attributes?.caliber, product.attributes?.action].filter(Boolean).join(" · ")}
        </div>
        <div style={{ height: "1px", background: t.border, marginBottom: "13px", marginTop: "auto" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{
            fontSize: product.contact_for_pricing ? "10px" : (small ? "13px" : "15px"),
            fontWeight: product.contact_for_pricing ? 400 : 500,
            color: product.contact_for_pricing ? t.gold : t.text,
            letterSpacing: product.contact_for_pricing ? "0.04em" : "0.01em",
          }}>
            {product.contact_for_pricing ? "Contact Us For Pricing" : (product.price ? fmt(product.price) : "—")}
          </div>
          <div style={{
            fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500,
            color: t.gold, borderBottom: `1px solid ${t.gold}55`, paddingBottom: "1px",
            opacity: hov ? 1 : 0.65, transition: "opacity 0.2s",
          }}>
            View Details
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── AuctionCard ──────────────────────────────────────────────────────── */

function AuctionCard({ auction, isDark }: { auction: Auction; isDark: boolean }) {
  const t = isDark ? DARK : LIGHT
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
          ? isDark ? `0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px ${t.gold}25` : `0 16px 48px rgba(0,0,0,0.1), 0 0 0 1px ${t.gold}30`
          : isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.05)",
        cursor: "pointer", position: "relative",
        fontFamily: "'Inter',sans-serif",
        display: "flex", flexDirection: "column",
        textDecoration: "none", color: "inherit",
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        {auction.thumbnail ? (
          <div style={{ position: "relative", height: "210px" }}>
            <Image src={auction.thumbnail} alt={auction.title} fill style={{ objectFit: "cover" }} sizes="25vw" />
          </div>
        ) : (
          <ImgBox isDark={isDark} style={{ height: "210px" }} />
        )}
        <div style={{
          position: "absolute", top: "12px", left: "12px",
          display: "flex", alignItems: "center", gap: "6px",
          background: isDark ? "rgba(11,10,9,0.85)" : "rgba(255,255,255,0.92)",
          border: `1px solid ${t.gold}55`, padding: "4px 10px", backdropFilter: "blur(6px)",
        }}>
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "#c93030", animation: "lxsAuctionPulse 1.6s ease-out infinite",
          }} />
          <span style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c93030", fontWeight: 600 }}>
            Live
          </span>
        </div>
        <div style={{
          position: "absolute", top: "12px", right: "12px",
          background: isDark ? "rgba(11,10,9,0.85)" : "rgba(255,255,255,0.92)",
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

function BrandTile({ brand, isDark }: { brand: typeof BRANDS[0]; isDark: boolean }) {
  const t = isDark ? DARK : LIGHT
  const [hov, setHov] = useState(false)
  return (
    <Link href={`/shop?by=brand&brand=${brand.slug}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "168px", height: "78px",
        border: `1px solid ${hov ? t.gold + "60" : t.border}`,
        background: hov ? (isDark ? "#222222" : "#fafafa") : "transparent",
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

function CategoryTile({ item, isDark, href }: { item: ShopItem; isDark: boolean; href: string }) {
  const t = isDark ? DARK : LIGHT
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
      <ImgBox isDark={isDark} style={{ height: "130px", transform: hov ? "scale(1.04)" : "scale(1)", transition: "transform 0.4s ease" }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 14px 12px",
        background: isDark ? "linear-gradient(to top,rgba(12,11,10,0.95),rgba(12,11,10,0.4))" : "linear-gradient(to top,rgba(255,255,255,0.97),rgba(255,255,255,0.5))",
      }}>
        <div style={{ fontFamily: PLAYFAIR, fontSize: "15px", fontWeight: 400, color: t.text, letterSpacing: "0.02em" }}>
          {item.name}
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: `${t.gold}07`, opacity: hov ? 1 : 0, transition: "opacity 0.24s", pointerEvents: "none" }} />
    </Link>
  )
}

/* ── ArticleCard ──────────────────────────────────────────────────────── */

function ArticleCard({ article, isDark }: { article: Article; isDark: boolean }) {
  const t = isDark ? DARK : LIGHT
  const [hov, setHov] = useState(false)
  return (
    <Link href={`/article/${article.slug}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ cursor: "pointer", textDecoration: "none", display: "block" }}
    >
      <div style={{ position: "relative", marginBottom: "18px", overflow: "hidden", borderRadius: "1px", border: `1px solid ${t.border}` }}>
        <ImgBox isDark={isDark} style={{ height: "200px", transform: hov ? "scale(1.04)" : "scale(1)", transition: "transform 0.4s ease" }} />
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

/* ── Main export ──────────────────────────────────────────────────────── */

export default function HomePage({
  heroProduct,
  products,
  collections,
  categories,
}: {
  heroProduct: HeroProduct
  products: MappedProduct[]
  collections: ShopItem[]
  categories: ShopItem[]
}) {
  const { isDark, t } = useTheme()
  const [tab, setTab] = useState<"collections" | "categories">("collections")
  const [email, setEmail] = useState("")
  const router = useRouter()

  const featured  = products.slice(0, 4)
  const arrivals  = products.length > 4 ? products.slice(4, 8) : products.slice(0, 4)

  const tabItems: ShopItem[] = tab === "collections"
    ? (collections.length > 0 ? collections.slice(0, 4) : [{ id: "1", name: "1911 Series" }, { id: "2", name: "Heritage Revolvers" }, { id: "3", name: "Modern Classics" }, { id: "4", name: "Presentation Grade" }])
    : (categories.length  > 0 ? categories.slice(0, 4)  : [{ id: "1", name: "Engraved" }, { id: "2", name: "Limited Edition" }, { id: "3", name: "Prototype" }, { id: "4", name: "Competition" }])

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "'Inter',sans-serif" }}>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* HERO                                                           */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: isDark
            ? "radial-gradient(ellipse at 70% 50%, #181818 0%, #0c0b09 55%, #050505 100%)"
            : "radial-gradient(ellipse at 70% 50%, #f3f3f5 0%, #f3f3f5 55%, #ebebee 100%)",
        }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "55%", height: "65%", background: `radial-gradient(ellipse at bottom right, ${t.gold}0e 0%, transparent 65%)` }} />
        <div style={{ position: "absolute", top: "18%", bottom: "18%", left: "50%", width: "1px", background: `linear-gradient(to bottom, transparent, ${t.gold}28, transparent)` }} />
        <div style={{ position: "absolute", top: "68px", left: 0, right: 0, height: "1px", background: `linear-gradient(to right, transparent 5%, ${t.border}, transparent 95%)` }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: "1440px", margin: "0 auto", padding: "80px 40px 60px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center", width: "100%" }}>

          {/* Left */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
              <div style={{ width: "28px", height: "1px", background: t.gold }} />
              <span style={{ fontSize: "8.5px", letterSpacing: "0.3em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>
                Curated Fine Firearms
              </span>
            </div>
            <h1 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(46px,5.5vw,82px)", fontWeight: 300, lineHeight: 1.04, letterSpacing: "0.005em", color: t.text, marginBottom: "30px" }}>
              Where Craft<br />
              Meets <em style={{ color: t.gold, fontStyle: "italic" }}>Obsession.</em>
            </h1>
            <p style={{ fontSize: "14px", fontWeight: 300, lineHeight: 1.85, color: t.textMuted, maxWidth: "400px", marginBottom: "44px", letterSpacing: "0.025em" }}>
              A distinguished showcase of top-tier firearm craftsmanship — premium pieces from Nighthawk Custom, Cabot Guns, Korth, SIG Sauer, Colt, Wilson Combat, and beyond.
            </p>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <button
                onClick={() => router.push("/shop")}
                style={{ padding: "14px 34px", background: t.gold, color: isDark ? "#0a0a0a" : "#fff", border: "none", fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, cursor: "pointer", borderRadius: "1px", fontFamily: "'Inter',sans-serif", transition: "all 0.22s" }}
                onMouseEnter={e => { e.currentTarget.style.background = t.goldLight; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = t.gold; e.currentTarget.style.transform = "none"; }}
              >
                Browse Collection
              </button>
              <button
                onClick={() => router.push("/shop?by=brand")}
                style={{ padding: "14px 34px", background: "transparent", color: t.text, border: `1px solid ${t.border}`, fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500, cursor: "pointer", borderRadius: "1px", fontFamily: "'Inter',sans-serif", transition: "all 0.22s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold + "70"; e.currentTarget.style.color = t.gold; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.text; }}
              >
                Shop by Brand
              </button>
            </div>
            <div style={{ display: "flex", gap: "44px", marginTop: "60px", paddingTop: "36px", borderTop: `1px solid ${t.border}` }}>
              {[["450+", "Curated Pieces"], ["35+", "Premier Brands"]].map(([num, label]) => (
                <div key={label}>
                  <div style={{ fontFamily: PLAYFAIR, fontSize: "30px", fontWeight: 300, color: t.gold, lineHeight: 1, marginBottom: "4px" }}>{num}</div>
                  <div style={{ fontSize: "8.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.textMuted, fontWeight: 400 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: hero image + floating product card */}
          <div style={{ position: "relative" }}>
            <div style={{
              aspectRatio: "4/5", maxHeight: "580px",
              border: `1px solid ${t.border}`,
              background: isDark ? "linear-gradient(155deg,#222222,#0e0e0e)" : "linear-gradient(155deg,#e8e8eb,#d4d4d8)",
              position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {[
                { top: "12px", left: "12px", borderTop: `1px solid ${t.gold}50`, borderLeft: `1px solid ${t.gold}50` },
                { top: "12px", right: "12px", borderTop: `1px solid ${t.gold}50`, borderRight: `1px solid ${t.gold}50` },
                { bottom: "12px", left: "12px", borderBottom: `1px solid ${t.gold}50`, borderLeft: `1px solid ${t.gold}50` },
                { bottom: "12px", right: "12px", borderBottom: `1px solid ${t.gold}50`, borderRight: `1px solid ${t.gold}50` },
              ].map((s, i) => <div key={i} style={{ position: "absolute", width: "22px", height: "22px", ...s }} />)}
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 35% 45%, ${t.gold}09, transparent 55%)` }} />
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" opacity={isDark ? 0.12 : 0.1}>
                <rect x="3" y="3" width="50" height="50" stroke={t.gold} strokeWidth="0.7" />
                <line x1="28" y1="3" x2="28" y2="53" stroke={t.gold} strokeWidth="0.4" />
                <line x1="3" y1="28" x2="53" y2="28" stroke={t.gold} strokeWidth="0.4" />
                <rect x="14" y="14" width="28" height="28" stroke={t.gold} strokeWidth="0.4" />
              </svg>
              <div style={{ position: "absolute", bottom: "28px", left: "28px", right: "28px", textAlign: "center" }}>
                <div style={{ fontSize: "7.5px", letterSpacing: "0.25em", textTransform: "uppercase", color: t.textDim, fontWeight: 500 }}>Product Photography</div>
              </div>
            </div>
            {/* Floating product card */}
            <div style={{
              position: "absolute", bottom: "44px", left: "-44px",
              background: isDark ? "rgba(22,20,17,0.94)" : "rgba(255,255,255,0.96)",
              border: `1px solid ${t.border}`, borderLeft: `2px solid ${t.gold}`,
              padding: "14px 18px", backdropFilter: "blur(14px)",
              minWidth: "210px",
              boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.5)" : "0 12px 40px rgba(0,0,0,0.1)",
            }}>
              <div style={{ fontSize: "7.5px", letterSpacing: "0.22em", color: t.gold, textTransform: "uppercase", fontWeight: 500, marginBottom: "5px" }}>
                {heroProduct.label}
              </div>
              <div style={{ fontFamily: PLAYFAIR, fontSize: "16px", fontWeight: 400, color: t.text, marginBottom: "3px" }}>
                {heroProduct.title}
              </div>
              <div style={{ fontSize: "10.5px", color: t.textMuted, fontWeight: 300, marginBottom: "7px" }}>
                {[heroProduct.caliber, heroProduct.action].filter(Boolean).join(" · ")}
              </div>
              <div style={{ fontSize: "14px", color: t.gold, fontWeight: 500 }}>
                {heroProduct.contactForPricing ? "Contact Us For Pricing" : (heroProduct.price ? fmt(heroProduct.price) : "—")}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{ position: "absolute", bottom: "28px", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", opacity: 0.45 }}>
          <div style={{ fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: t.textMuted }}>Scroll</div>
          <div style={{ width: "1px", height: "28px", background: `linear-gradient(to bottom, ${t.gold}, transparent)` }} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* FEATURED COLLECTION                                            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {featured.length > 0 && (
        <section style={{ padding: "96px 40px" }}>
          <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <SectionHead eyebrow="Handpicked Pieces" title="Featured Collection" isDark={isDark} />
              <Link href="/shop" style={{ fontSize: "9px", letterSpacing: "0.13em", textTransform: "uppercase", color: t.gold, borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px", fontWeight: 500, marginBottom: "44px", flexShrink: 0, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = t.goldLight)}
                onMouseLeave={e => (e.currentTarget.style.color = t.gold)}>
                View All
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "18px" }}>
              {featured.map(p => <ProductCard key={p.id} product={p} isDark={isDark} />)}
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
      <section style={{ padding: "96px 40px" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
          <SectionHead eyebrow="Manufacturers" title="Shop By Brand" isDark={isDark} center />
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "12px" }}>
            {BRANDS.map(b => <BrandTile key={b.id} brand={b} isDark={isDark} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* COLLECTIONS & CATEGORIES                                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "96px 40px", background: isDark ? "linear-gradient(to bottom,transparent,#141414 10%,#141414 90%,transparent)" : "linear-gradient(to bottom,transparent,#f3f3f5 10%,#f3f3f5 90%,transparent)" }}>
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
            <Link href={tab === "collections" ? "/shop?by=collection" : "/shop?by=category"}
              style={{ fontSize: "9px", letterSpacing: "0.13em", textTransform: "uppercase", color: t.gold, borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px", fontWeight: 500, marginBottom: "18px", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = t.goldLight)}
              onMouseLeave={e => (e.currentTarget.style.color = t.gold)}>
              View All
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
            {tabItems.map(item => (
              <CategoryTile
                key={item.id}
                item={item}
                isDark={isDark}
                href={tab === "collections" ? `/shop?by=collection&id=${item.id}` : `/shop?by=category&id=${item.id}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* NEW ARRIVALS                                                   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {arrivals.length > 0 && (
        <section style={{ padding: "96px 40px" }}>
          <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <SectionHead eyebrow="Just Arrived" title="New Arrivals" isDark={isDark} />
              <Link href="/shop?order=newest" style={{ fontSize: "9px", letterSpacing: "0.13em", textTransform: "uppercase", color: t.gold, borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px", fontWeight: 500, marginBottom: "44px", flexShrink: 0, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = t.goldLight)}
                onMouseLeave={e => (e.currentTarget.style.color = t.gold)}>
                View All
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "18px" }}>
              {arrivals.map(p => <ProductCard key={p.id} product={p} isDark={isDark} />)}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* LIVE GUNBROKER AUCTIONS                                        */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "96px 40px" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <SectionHead eyebrow="Live at Auction" title="Currently on GunBroker" isDark={isDark} />
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
                <AuctionCard auction={a} isDark={isDark} />
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
      <section style={{ padding: "96px 40px" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <SectionHead eyebrow="Editorial" title="From The Blog" isDark={isDark} />
            <Link href="/articles" style={{ fontSize: "9px", letterSpacing: "0.13em", textTransform: "uppercase", color: t.gold, borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px", fontWeight: 500, marginBottom: "44px", flexShrink: 0, textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = t.goldLight)}
              onMouseLeave={e => (e.currentTarget.style.color = t.gold)}>
              All Articles
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "44px" }}>
            {MOCK_ARTICLES.slice(0, 3).map(a => <ArticleCard key={a.id} article={a} isDark={isDark} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* NEWSLETTER                                                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: "80px 40px",
        background: isDark ? "#0e0e0e" : "#f3f3f5",
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
          <form
            onSubmit={e => { e.preventDefault(); setEmail("") }}
            style={{ display: "flex", maxWidth: "420px", margin: "0 auto" }}
          >
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              style={{ flex: 1, padding: "12px 18px", background: isDark ? "#0a0a0a" : "#fff", border: `1px solid ${t.border}`, borderRight: "none", color: t.text, fontSize: "12px", outline: "none", fontFamily: "'Inter',sans-serif", letterSpacing: "0.03em" }}
            />
            <button
              type="submit"
              style={{ padding: "12px 22px", background: t.gold, color: isDark ? "#0a0a0a" : "#fff", border: "none", fontSize: "8.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
              onMouseEnter={e => (e.currentTarget.style.background = t.goldLight)}
              onMouseLeave={e => (e.currentTarget.style.background = t.gold)}
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

    </div>
  )
}
