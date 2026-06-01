'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/context/ThemeContext'
import { useCart } from '@/context/CartContext'
import { isWishlisted, toggleWishlist } from '@/lib/auth'
import type { MappedProduct } from '@/lib/medusa'

const PLAYFAIR = "var(--font-playfair), serif"
const PER_PAGE = 18
const PRICE_FLOOR = 0

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest First"       },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "brand_az",   label: "Brand: A to Z"      },
]

type Filters = {
  categories:    string[]
  brand:         string[]
  model:         string[]
  caliber:       string[]
  action:        string[]
  barrel_length: string[]
  priceMin:      number
  priceMax:      number
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)

function getPageNums(current: number, total: number, wing: number): (number | '...')[] {
  if (total <= wing * 2 + 3) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | '...')[] = [1]
  const lo = Math.max(2, current - wing)
  const hi = Math.min(total - 1, current + wing)
  if (lo > 2) out.push('...')
  for (let i = lo; i <= hi; i++) out.push(i)
  if (hi < total - 1) out.push('...')
  out.push(total)
  return out
}

// ── ImgBox placeholder ────────────────────────────────────────────────────────
function ImgBox({ style = {} }: { style?: React.CSSProperties }) {
  const { t } = useTheme()
  return (
    <div style={{
      background: "linear-gradient(140deg,#e8e8eb 0%,#d4d4d8 50%,#e8e8eb 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", width: "100%", height: "100%", ...style,
    }}>
      <svg width="32" height="32" viewBox="0 0 36 36" fill="none" opacity="0.15">
        <rect x="2" y="2" width="32" height="32" rx="1" stroke={t.gold} strokeWidth="0.8" />
        <circle cx="12" cy="13" r="3.5" stroke={t.gold} strokeWidth="0.8" />
        <path d="M2 25L10 17L16 22L24 12L34 22V34H2V25Z" stroke={t.gold} strokeWidth="0.8" />
      </svg>
    </div>
  )
}

// ── ProductCard ───────────────────────────────────────────────────────────────
function ProductCard({ product }: { product: MappedProduct }) {
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
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? t.bgCardHover : t.bgCard,
        border: `1px solid ${hov ? t.gold + "55" : t.border}`,
        borderRadius: "1px", overflow: "hidden",
        transition: "all 0.28s ease",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov
          ? `0 16px 48px rgba(0,0,0,0.1),0 0 0 1px ${t.gold}25`
          : "0 2px 8px rgba(0,0,0,0.05)",
        cursor: "pointer", fontFamily: "'Inter',sans-serif",
        display: "flex", flexDirection: "column", flex: 1, height: "100%",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden", flexShrink: 0, background: "#f0f0f0" }}>
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            style={{ objectFit: "contain", filter: !product.in_stock ? "grayscale(0.55) brightness(0.78)" : "none" }}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <ImgBox style={{ filter: !product.in_stock ? "grayscale(0.55) brightness(0.78)" : "none" }} />
        )}

        {/* Primary category badge */}
        {product.details?.primary_category && product.in_stock && (
          <div className="lxs-card-badge-cat" style={{
            position: "absolute", top: "10px", left: "10px",
            background: "rgba(255,255,255,0.88)",
            border: `1px solid ${t.gold}50`, padding: "3px 9px",
            fontSize: "8.5px", letterSpacing: "0.14em", textTransform: "uppercase",
            fontWeight: 500, color: t.gold, backdropFilter: "blur(6px)",
          }}>
            {product.details.primary_category}
          </div>
        )}

        {/* Unavailable overlay */}
        {!product.in_stock && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(11,10,9,0.32)",
          }}>
            <div style={{
              background: "rgba(255,255,255,0.92)",
              border: `1px solid ${t.gold}`,
              color: t.gold, padding: "7px 22px",
              fontSize: "10px", letterSpacing: "0.32em", textTransform: "uppercase",
              fontWeight: 600, backdropFilter: "blur(6px)",
            }}>
              Unavailable
            </div>
          </div>
        )}

        {/* Available pill */}
        {product.in_stock && (
          <div style={{
            position: "absolute", top: "10px", right: "10px",
            background: "rgba(255,255,255,0.88)",
            border: `1px solid #3a6a3a55`,
            padding: "3px 9px", backdropFilter: "blur(6px)",
          }}>
            <span style={{ fontSize: "8.5px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: "#3a6a3a" }}>
              Available
            </span>
          </div>
        )}
      </div>

      {/* Body */}
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
        <div style={{ height: "1px", background: t.border, marginBottom: "13px", marginTop: "auto" }} />
        <div className="lxs-card-price-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div className="lxs-card-price" style={{
            fontSize: product.contact_for_pricing ? "10px" : "15px",
            fontWeight: product.contact_for_pricing ? 400 : 500,
            color: product.contact_for_pricing ? t.gold : t.text,
            letterSpacing: product.contact_for_pricing ? "0.04em" : "0.01em",
          }}>
            {product.contact_for_pricing ? "Contact Us For Pricing" : product.price !== null ? fmt(product.price) : "—"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {/* Heart / Wishlist */}
            <button
              onClick={handleHeartClick}
              title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center", color: wishlisted ? "#c0392b" : t.textMuted, opacity: hov || wishlisted ? 1 : 0.55, transition: "all 0.2s" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            {/* CTA */}
            {product.contact_for_pricing ? (
              <button
                onClick={handleViewDetails}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 0", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, color: t.gold, borderBottom: `1px solid ${t.gold}55`, paddingBottom: "1px", opacity: hov ? 1 : 0.65, transition: "opacity 0.2s" }}
              >
                View Details
              </button>
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
    </div>
  )
}

// ── FilterSection ─────────────────────────────────────────────────────────────
function FilterSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const { t } = useTheme()
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: open ? "18px" : "0" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "none", border: "none", cursor: "pointer", padding: "18px 0",
        fontFamily: "'Inter',sans-serif",
      }}>
        <span style={{ fontSize: "8.5px", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 500, color: t.gold }}>
          {title}
        </span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{ transition: "transform 0.25s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
          <path d="M1 1L5 5L9 1" stroke={t.gold} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div style={{ overflow: "hidden", maxHeight: open ? "9999px" : "0", transition: "max-height 0.4s ease" }}>
        <div style={{ maxHeight: "340px", overflowY: "auto", scrollbarWidth: "thin", paddingRight: "12px" }}>{children}</div>
      </div>
    </div>
  )
}

// ── CheckboxItem ──────────────────────────────────────────────────────────────
function CheckboxItem({ label, checked, onChange, count }: { label: string; checked: boolean; onChange: () => void; count?: number }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)

  return (
    <label onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: "5px 0", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div onClick={onChange} style={{
          width: "14px", height: "14px", flexShrink: 0,
          border: `1px solid ${checked ? t.gold : hov ? t.borderHover : t.border}`,
          background: checked ? t.gold : "transparent",
          transition: "all 0.18s", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "1px",
        }}>
          {checked && (
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
              <path d="M1 3L3 5L7 1" stroke={t.bg} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span style={{ fontSize: "12px", fontWeight: 300, fontFamily: "'Inter',sans-serif", color: checked ? t.text : t.textMuted, letterSpacing: "0.02em", transition: "color 0.18s", userSelect: "none" }}>
          {label}
        </span>
      </div>
      {count !== undefined && (
        <span style={{ fontSize: "10px", color: t.textDim, fontFamily: "'Inter',sans-serif", fontWeight: 300 }}>{count}</span>
      )}
    </label>
  )
}

// ── PriceRange dual slider ─────────────────────────────────────────────────────
function PriceRange({ priceMin, priceMax, min, max, onChange }: {
  priceMin: number; priceMax: number; min: number; max: number
  onChange: (min: number, max: number) => void
}) {
  const { t } = useTheme()
  const [localMin, setLocalMin] = useState(String(priceMin))
  const [localMax, setLocalMax] = useState(String(priceMax))

  useEffect(() => setLocalMin(String(priceMin)), [priceMin])
  useEffect(() => setLocalMax(String(priceMax)), [priceMax])

  const pct = (v: number) => ((v - min) / (max - min)) * 100
  const leftPct  = pct(priceMin)
  const rightPct = pct(priceMax)

  const handleMinRange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), priceMax - 100)
    onChange(v, priceMax)
  }
  const handleMaxRange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), priceMin + 100)
    onChange(priceMin, v)
  }
  const handleMinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalMin(e.target.value)
    const v = Number(e.target.value)
    if (!isNaN(v) && v >= min && v < priceMax) onChange(v, priceMax)
  }
  const handleMaxInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalMax(e.target.value)
    const v = Number(e.target.value)
    if (!isNaN(v) && v <= max && v > priceMin) onChange(priceMin, v)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "7px 8px 7px 20px",
    background: "#fafafa",
    border: `1px solid ${t.border}`, color: t.text,
    fontSize: "11px", fontFamily: "'Inter',sans-serif", outline: "none", borderRadius: "1px",
  }

  return (
    <div>
      <style>{`
        input[type=range]{-webkit-appearance:none;appearance:none;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:${t.gold};border:2px solid ${t.bg};cursor:pointer;position:relative;z-index:5;}
        input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:${t.gold};border:2px solid ${t.bg};cursor:pointer;}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;}
      `}</style>

      {/* Track */}
      <div style={{ position: "relative", height: "3px", background: t.border, borderRadius: "2px", margin: "12px 0 18px" }}>
        <div style={{
          position: "absolute", top: 0, height: "100%",
          left: `${leftPct}%`, width: `${rightPct - leftPct}%`,
          background: t.gold, borderRadius: "2px",
        }} />
        <input type="range" min={min} max={max} step={50} value={priceMin} onChange={handleMinRange}
          style={{ position: "absolute", width: "100%", top: "50%", transform: "translateY(-50%)", appearance: "none", WebkitAppearance: "none" as React.CSSProperties["WebkitAppearance"], background: "transparent", height: "16px", cursor: "pointer", margin: 0, zIndex: priceMin > max - 100 ? 5 : 3 }} />
        <input type="range" min={min} max={max} step={50} value={priceMax} onChange={handleMaxRange}
          style={{ position: "absolute", width: "100%", top: "50%", transform: "translateY(-50%)", appearance: "none", WebkitAppearance: "none" as React.CSSProperties["WebkitAppearance"], background: "transparent", height: "16px", cursor: "pointer", margin: 0, zIndex: 4 }} />
      </div>

      {/* Min / Max inputs */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.textDim, fontFamily: "'Inter',sans-serif", marginBottom: "5px" }}>Min</div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: t.textMuted }}>$</span>
            <input type="number" value={localMin} onChange={handleMinInput} style={inputStyle} />
          </div>
        </div>
        <div style={{ width: "12px", height: "1px", background: t.border, marginTop: "18px", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.textDim, fontFamily: "'Inter',sans-serif", marginBottom: "5px" }}>Max</div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: t.textMuted }}>$</span>
            <input type="number" value={localMax} onChange={handleMaxInput} style={inputStyle} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── FilterPill ────────────────────────────────────────────────────────────────
function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "4px 10px 4px 12px",
        background: hov ? t.gold + "20" : t.gold + "12",
        border: `1px solid ${t.gold}40`,
        fontSize: "9.5px", letterSpacing: "0.08em", fontFamily: "'Inter',sans-serif",
        fontWeight: 400, color: t.gold, cursor: "pointer",
        transition: "all 0.18s", borderRadius: "1px",
      }}
    >
      {label}
      <span onClick={onRemove} style={{ display: "flex", alignItems: "center", opacity: hov ? 1 : 0.6, transition: "opacity 0.18s" }}>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </span>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ShopPage({ products }: { products: MappedProduct[] }) {
  const { t } = useTheme()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Derived constants from product data (computed once per render cycle, stable when products don't change)
  const { uniqueCategories, uniqueBrands, uniqueModels, uniqueCalibers, uniqueActions, uniqueBarrelLengths, PRICE_MAX } = useMemo(() => {
    const pricedProducts = products.filter(p => !p.contact_for_pricing && p.price !== null)
    const maxPrice = pricedProducts.length ? Math.max(...pricedProducts.map(p => p.price!)) : 20000
    return {
      uniqueCategories:    [...new Set(products.flatMap(p => p.categories))].sort(),
      uniqueBrands:        [...new Set(products.flatMap(p => p.attribute_lists.brand))].sort(),
      uniqueModels:        [...new Set(products.flatMap(p => p.attribute_lists.model))].sort(),
      uniqueCalibers:      [...new Set(products.flatMap(p => p.attribute_lists.caliber))].sort(),
      uniqueActions:       [...new Set(products.flatMap(p => p.attribute_lists.action))].sort(),
      uniqueBarrelLengths: [...new Set(products.flatMap(p => p.attribute_lists.barrel_length))].sort(),
      PRICE_MAX:           Math.ceil(maxPrice / 1000) * 1000,
    }
  }, [products])

  // Filter state — initialized from URL params
  const [filters, setFilters] = useState<Filters>(() => ({
    categories:    searchParams.getAll('category'),
    brand:         searchParams.getAll('brand'),
    model:         searchParams.getAll('model'),
    caliber:       searchParams.getAll('caliber'),
    action:        searchParams.getAll('action'),
    barrel_length: searchParams.getAll('barrel_length'),
    priceMin:      Number(searchParams.get('priceMin') ?? PRICE_FLOOR),
    priceMax:      Number(searchParams.get('priceMax') ?? PRICE_MAX),
  }))
  const [sort, setSort] = useState(() => searchParams.get('sort') ?? 'newest')
  const [page, setPage] = useState(() => Number(searchParams.get('page') ?? 1))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const sortRef = useRef<HTMLDivElement>(null)
  const isFirstMount = useRef(true)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Sync URL when filter state changes (skip first mount to avoid redundant push)
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return }
    const p = new URLSearchParams()
    filters.categories.forEach(v => p.append('category', v))
    filters.brand.forEach(v => p.append('brand', v))
    filters.model.forEach(v => p.append('model', v))
    filters.caliber.forEach(v => p.append('caliber', v))
    filters.action.forEach(v => p.append('action', v))
    filters.barrel_length.forEach(v => p.append('barrel_length', v))
    if (sort !== 'newest') p.set('sort', sort)
    if (page > 1) p.set('page', String(page))
    if (filters.priceMin > PRICE_FLOOR) p.set('priceMin', String(filters.priceMin))
    if (filters.priceMax < PRICE_MAX) p.set('priceMax', String(filters.priceMax))
    const qs = p.toString()
    router.replace(`/shop${qs ? '?' + qs : ''}`, { scroll: false })
  }, [filters, sort, page]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sortOpen])

  // ── Filter helpers ──────────────────────────────────────────────────────────
  const toggleFilter = useCallback((key: keyof Omit<Filters, 'priceMin' | 'priceMax'>, value: string) => {
    setPage(1)
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value],
    }))
  }, [])

  const countFor = useCallback((key: string, value: string): number => {
    return products.filter(p => {
      // Must match this dimension
      if (key === 'categories') {
        if (!p.categories.includes(value)) return false
      } else {
        const list = p.attribute_lists[key as keyof typeof p.attribute_lists] ?? []
        if (!list.includes(value)) return false
      }
      // Other active attribute filters
      const attrKeys = ['brand', 'model', 'caliber', 'action', 'barrel_length'] as const
      for (const k of attrKeys) {
        if (k === key) continue
        if (filters[k].length && !filters[k].some(f => p.attribute_lists[k].includes(f))) return false
      }
      // Category filter (when counting non-category dimensions)
      if (key !== 'categories' && filters.categories.length && !filters.categories.some(c => p.categories.includes(c))) return false
      // Price filter
      if (!p.contact_for_pricing && p.price !== null) {
        if (p.price < filters.priceMin || p.price > filters.priceMax) return false
      }
      return true
    }).length
  }, [products, filters])

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => products.filter(p => {
    if (filters.categories.length    && !filters.categories.some(c => p.categories.includes(c)))                         return false
    if (filters.brand.length         && !filters.brand.some(f => p.attribute_lists.brand.includes(f)))                   return false
    if (filters.model.length         && !filters.model.some(f => p.attribute_lists.model.includes(f)))                   return false
    if (filters.caliber.length       && !filters.caliber.some(f => p.attribute_lists.caliber.includes(f)))               return false
    if (filters.action.length        && !filters.action.some(f => p.attribute_lists.action.includes(f)))                 return false
    if (filters.barrel_length.length && !filters.barrel_length.some(f => p.attribute_lists.barrel_length.includes(f)))  return false
    if (!p.contact_for_pricing && p.price !== null) {
      if (p.price < filters.priceMin || p.price > filters.priceMax) return false
    }
    return true
  }), [products, filters])

  // ── Sorting ─────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const aOut = !a.in_stock, bOut = !b.in_stock
    if (aOut !== bOut) return aOut ? 1 : -1
    if (sort === 'price_asc')  return (a.price ?? Infinity) - (b.price ?? Infinity)
    if (sort === 'price_desc') return (b.price ?? 0) - (a.price ?? 0)
    if (sort === 'brand_az')   return (a.attributes.brand ?? '').localeCompare(b.attributes.brand ?? '')
    return 0 // newest — server already returned in created_at desc order
  }), [filtered, sort])

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(sorted.length / PER_PAGE)
  const paginated  = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // ── Active pills ────────────────────────────────────────────────────────────
  const activePills = [
    ...filters.categories.map(v    => ({ key: 'categories',    value: v, label: v })),
    ...filters.brand.map(v         => ({ key: 'brand',         value: v, label: v })),
    ...filters.model.map(v         => ({ key: 'model',         value: v, label: `Model: ${v}` })),
    ...filters.caliber.map(v       => ({ key: 'caliber',       value: v, label: v })),
    ...filters.action.map(v        => ({ key: 'action',        value: v, label: v })),
    ...filters.barrel_length.map(v => ({ key: 'barrel_length', value: v, label: `Barrel ${v}` })),
    ...(filters.priceMin > PRICE_FLOOR || filters.priceMax < PRICE_MAX
      ? [{ key: 'price', value: 'price', label: `${fmt(filters.priceMin)} – ${filters.priceMax >= PRICE_MAX ? 'Any' : fmt(filters.priceMax)}` }]
      : []),
  ]

  const clearAll = () => {
    setPage(1)
    setFilters({ categories: [], brand: [], model: [], caliber: [], action: [], barrel_length: [], priceMin: PRICE_FLOOR, priceMax: PRICE_MAX })
  }

  const removePill = (pill: { key: string; value: string }) => {
    setPage(1)
    if (pill.key === 'price') {
      setFilters(prev => ({ ...prev, priceMin: PRICE_FLOOR, priceMax: PRICE_MAX }))
    } else {
      setFilters(prev => ({ ...prev, [pill.key]: (prev[pill.key as keyof Filters] as string[]).filter(v => v !== pill.value) }))
    }
  }

  // ── Sidebar content (shared between desktop + mobile drawer) ───────────────
  const SidebarContent = () => (
    <div>
      {activePills.length > 0 && (
        <div style={{ marginBottom: "4px" }}>
          <button onClick={clearAll} style={{
            background: "none", border: `1px solid ${t.border}`, cursor: "pointer",
            fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase",
            color: t.textMuted, fontFamily: "'Inter',sans-serif", fontWeight: 500,
            padding: "7px 14px", width: "100%", transition: "all 0.2s", borderRadius: "1px",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold + "60"; e.currentTarget.style.color = t.gold }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted }}
          >
            Clear All Filters
          </button>
        </div>
      )}

      {uniqueCategories.length > 0 && (
        <FilterSection title="Category" defaultOpen={true}>
          {uniqueCategories.map(v => (
            <CheckboxItem key={v} label={v} checked={filters.categories.includes(v)}
              onChange={() => toggleFilter('categories', v)} count={countFor('categories', v)} />
          ))}
        </FilterSection>
      )}

      {uniqueBrands.length > 0 && (
        <FilterSection title="Brand" defaultOpen={true}>
          {uniqueBrands.map(v => (
            <CheckboxItem key={v} label={v} checked={filters.brand.includes(v)}
              onChange={() => toggleFilter('brand', v)} count={countFor('brand', v)} />
          ))}
        </FilterSection>
      )}

      {uniqueModels.length > 0 && (
        <FilterSection title="Model" defaultOpen={false}>
          {uniqueModels
            .filter(m => !filters.brand.length || products.some(p => p.attribute_lists.model.includes(m) && filters.brand.some(b => p.attribute_lists.brand.includes(b))))
            .map(v => (
              <CheckboxItem key={v} label={v} checked={filters.model.includes(v)}
                onChange={() => toggleFilter('model', v)} count={countFor('model', v)} />
            ))}
        </FilterSection>
      )}

      {uniqueCalibers.length > 0 && (
        <FilterSection title="Caliber" defaultOpen={true}>
          {uniqueCalibers.map(v => (
            <CheckboxItem key={v} label={v} checked={filters.caliber.includes(v)}
              onChange={() => toggleFilter('caliber', v)} count={countFor('caliber', v)} />
          ))}
        </FilterSection>
      )}

      {uniqueActions.length > 0 && (
        <FilterSection title="Action" defaultOpen={true}>
          {uniqueActions.map(v => (
            <CheckboxItem key={v} label={v} checked={filters.action.includes(v)}
              onChange={() => toggleFilter('action', v)} count={countFor('action', v)} />
          ))}
        </FilterSection>
      )}

      {uniqueBarrelLengths.length > 0 && (
        <FilterSection title="Barrel Length" defaultOpen={false}>
          {uniqueBarrelLengths.map(v => (
            <CheckboxItem key={v} label={v} checked={filters.barrel_length.includes(v)}
              onChange={() => toggleFilter('barrel_length', v)} count={countFor('barrel_length', v)} />
          ))}
        </FilterSection>
      )}

      <FilterSection title="Price Range" defaultOpen={true}>
        <PriceRange
          min={PRICE_FLOOR} max={PRICE_MAX}
          priceMin={filters.priceMin} priceMax={filters.priceMax}
          onChange={(mn, mx) => { setPage(1); setFilters(prev => ({ ...prev, priceMin: mn, priceMax: mx })) }}
        />
      </FilterSection>
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "'Inter',sans-serif" }}>

      {/* Page banner */}
      <div style={{
        background: "linear-gradient(to bottom, #f3f3f5, #ffffff)",
        borderBottom: `1px solid ${t.border}`,
        padding: "36px 40px 28px",
      }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Link href="/" style={{ fontSize: "10px", color: t.textDim, fontWeight: 300, letterSpacing: "0.04em", transition: "color 0.18s" }}
              onMouseEnter={e => (e.currentTarget.style.color = t.gold)}
              onMouseLeave={e => (e.currentTarget.style.color = t.textDim)}>
              Home
            </Link>
            <span style={{ fontSize: "9px", color: t.textDim }}>›</span>
            <span style={{ fontSize: "10px", color: t.textMuted, fontWeight: 400, letterSpacing: "0.04em" }}>Shop</span>
          </div>

          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "20px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                <div style={{ width: "18px", height: "1px", background: t.gold }} />
                <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>
                  Luxus Collection
                </span>
              </div>
              <h1 style={{ fontFamily: PLAYFAIR, fontSize: "clamp(28px,3vw,44px)", fontWeight: 300, color: t.text, lineHeight: 1.1, letterSpacing: "0.01em", margin: 0 }}>
                All Firearms
              </h1>
            </div>
            <div style={{ fontSize: "11px", color: t.textMuted, fontWeight: 300, letterSpacing: "0.03em", paddingBottom: "6px", flexShrink: 0 }}>
              <span style={{ color: t.text, fontWeight: 400 }}>{filtered.length}</span> items
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="lxs-listing-layout" style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 40px", display: "grid", gridTemplateColumns: "260px 1fr", gap: "48px", alignItems: "start", paddingTop: "40px", paddingBottom: "80px" }}>

        {/* Sidebar */}
        <aside className="lxs-filter-aside" style={{ position: "sticky", top: "88px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px", paddingBottom: "14px", borderBottom: `1px solid ${t.border}` }}>
            <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.text, fontWeight: 500 }}>
              Refine Results
            </span>
            {activePills.length > 0 && (
              <span onClick={clearAll} style={{ fontSize: "8.5px", letterSpacing: "0.1em", color: t.gold, cursor: "pointer", textDecoration: "underline", textDecorationColor: t.gold + "50" }}>
                Clear all
              </span>
            )}
          </div>
          <SidebarContent />
        </aside>

        {/* Product area */}
        <div>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>

            {/* Active pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", flex: 1 }}>
              {activePills.length > 0 ? (
                activePills.map(pill => (
                  <FilterPill key={`${pill.key}-${pill.value}`} label={pill.label} onRemove={() => removePill(pill)} />
                ))
              ) : (
                <span style={{ fontSize: "11px", color: t.textDim, fontWeight: 300, letterSpacing: "0.03em" }}>
                  Showing all {products.length} {products.length === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>

            {/* Mobile filter button */}
            <button className="lxs-mobile-filter-btn" onClick={() => setDrawerOpen(true)}
              style={{ alignItems: "center", gap: "7px", padding: "8px 16px", background: "transparent", border: `1px solid ${t.border}`, color: t.textMuted, fontSize: "9.5px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 500, cursor: "pointer", borderRadius: "1px" }}>
              <svg width="13" height="11" viewBox="0 0 13 11" fill="none"><path d="M1 1H12M3 5.5H10M5 10H8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
              Filters{activePills.length > 0 ? ` (${activePills.length})` : ''}
            </button>

            {/* Sort dropdown */}
            <div ref={sortRef} style={{ position: "relative", flexShrink: 0 }}>
              <div onClick={() => setSortOpen(o => !o)} style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", cursor: "pointer",
                border: `1px solid ${sortOpen ? t.gold + "50" : t.border}`, transition: "border-color 0.2s", borderRadius: "1px",
              }}>
                <span style={{ fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.textMuted, fontWeight: 500, whiteSpace: "nowrap" }}>
                  {SORT_OPTIONS.find(o => o.value === sort)?.label}
                </span>
                <svg width="8" height="5" viewBox="0 0 8 5" fill="none" style={{ transition: "transform 0.2s", transform: sortOpen ? "rotate(180deg)" : "none" }}>
                  <path d="M0.5 0.5L4 4L7.5 0.5" stroke={t.textMuted} strokeWidth="1.1" strokeLinecap="round" />
                </svg>
              </div>
              {sortOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", right: 0,
                  background: "#ffffff",
                  border: `1px solid ${t.border}`, borderTop: `2px solid ${t.gold}`,
                  minWidth: "180px", zIndex: 50,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.1)",
                }}>
                  {SORT_OPTIONS.map(opt => (
                    <div key={opt.value}
                      onClick={() => { setSort(opt.value); setSortOpen(false); setPage(1) }}
                      style={{
                        padding: "10px 18px", fontSize: "9.5px", letterSpacing: "0.1em",
                        textTransform: "uppercase", cursor: "pointer", fontFamily: "'Inter',sans-serif",
                        fontWeight: opt.value === sort ? 500 : 300,
                        color: opt.value === sort ? t.gold : t.textMuted,
                        background: opt.value === sort ? t.gold + "10" : "transparent",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { if (opt.value !== sort) { e.currentTarget.style.color = t.text; e.currentTarget.style.paddingLeft = "22px" } }}
                      onMouseLeave={e => { if (opt.value !== sort) { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.paddingLeft = "18px" } }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Gold rule */}
          <div style={{ height: "1px", background: `linear-gradient(to right, ${t.gold}30, transparent)`, marginBottom: "28px" }} />

          {/* Product grid */}
          {paginated.length > 0 ? (
            <div className="lxs-product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
              {paginated.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div style={{ padding: "80px 0", textAlign: "center" }}>
              <div style={{ fontFamily: PLAYFAIR, fontSize: "28px", fontWeight: 300, color: t.textMuted, marginBottom: "12px" }}>
                No items match your selection
              </div>
              <p style={{ fontSize: "13px", fontWeight: 300, color: t.textDim, marginBottom: "24px" }}>
                Try adjusting or clearing your filters to see more results.
              </p>
              <button onClick={clearAll} style={{ padding: "11px 28px", background: "transparent", border: `1px solid ${t.border}`, color: t.textMuted, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 500, cursor: "pointer", borderRadius: "1px", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold + "60"; e.currentTarget.style.color = t.gold }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted }}>
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "28px", flexWrap: "nowrap" }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ width: "36px", height: "36px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${page === 1 ? t.border + "50" : t.border}`, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.35 : 1, color: t.textMuted, transition: "all 0.2s", borderRadius: "1px" }}>
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {getPageNums(page, totalPages, isMobile ? 1 : 4).map((n, idx) =>
                n === '...' ? (
                  <span key={`el-${idx}`} style={{ width: "24px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: t.textDim, flexShrink: 0 }}>…</span>
                ) : (
                  <button key={n} onClick={() => setPage(n as number)}
                    style={{ width: "36px", height: "36px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: n === page ? t.gold : "transparent", border: `1px solid ${n === page ? t.gold : t.border}`, color: n === page ? "#fff" : t.textMuted, fontSize: "11px", fontFamily: "'Inter',sans-serif", fontWeight: n === page ? 500 : 300, cursor: "pointer", transition: "all 0.2s", borderRadius: "1px" }}>
                    {n}
                  </button>
                )
              )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ width: "36px", height: "36px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${page === totalPages ? t.border + "50" : t.border}`, cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.35 : 1, color: t.textMuted, transition: "all 0.2s", borderRadius: "1px" }}>
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, backdropFilter: "blur(4px)" }} />
          <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: "300px", zIndex: 10000, background: "#fff", borderRight: `1px solid ${t.border}`, overflowY: "auto", padding: "24px 24px 40px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>Refine Results</span>
              <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, padding: "4px" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
              </button>
            </div>
            <SidebarContent />
            <button onClick={() => setDrawerOpen(false)} style={{ width: "100%", marginTop: "24px", padding: "13px", background: t.gold, border: "none", color: "#fff", fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif", fontWeight: 600, cursor: "pointer", borderRadius: "1px" }}>
              View {filtered.length} Results
            </button>
          </div>
        </>
      )}
    </div>
  )
}
