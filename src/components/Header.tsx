'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'

type SearchHit = {
  id: string
  handle: string
  title: string
  brand: string | null
  caliber: string | null
  price: number | null
  contact_for_pricing: boolean
  thumbnail: string | null
  in_stock: boolean
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)

function useSearch(query: string) {
  const [hits, setHits]   = useState<SearchHit[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (query.trim().length < 2) { setHits([]); setTotal(0); return }
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=6`)
        const data = await res.json()
        setHits(data.hits ?? [])
        setTotal(data.estimatedTotalHits ?? 0)
      } catch { setHits([]); setTotal(0) }
    }, 280)
    return () => clearTimeout(timer)
  }, [query])

  return { hits, total }
}

function SearchResultItem({ hit, onClick }: { hit: SearchHit; onClick: () => void }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  return (
    <Link href={`/product/${hit.handle}`} onClick={onClick} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", background: hov ? "#fafafa" : "transparent", transition: "background 0.15s", cursor: "pointer" }}
      >
        <div style={{ width: "44px", height: "44px", flexShrink: 0, background: "#f0f0f0", border: `1px solid ${t.border}`, position: "relative", overflow: "hidden" }}>
          {hit.thumbnail
            ? <Image src={hit.thumbnail} alt={hit.title} fill style={{ objectFit: "contain" }} sizes="44px" />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 36 36" fill="none" opacity="0.2"><rect x="2" y="2" width="32" height="32" rx="1" stroke="#888" strokeWidth="1"/><circle cx="12" cy="12" r="4" stroke="#888" strokeWidth="1"/><path d="M2 26L12 16L18 22L26 12L34 22V34H2V26Z" stroke="#888" strokeWidth="1"/></svg>
              </div>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {hit.brand && <div style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "2px" }}>{hit.brand}</div>}
          <div style={{ fontSize: "13px", fontWeight: 400, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "var(--font-playfair)" }}>{hit.title}</div>
          {hit.caliber && <div style={{ fontSize: "10px", color: t.textMuted, fontWeight: 300, marginTop: "1px" }}>{hit.caliber}</div>}
        </div>
        <div style={{ flexShrink: 0, fontSize: "12px", fontWeight: 500, color: hit.contact_for_pricing ? t.gold : t.text }}>
          {hit.contact_for_pricing ? "Contact" : hit.price !== null ? fmt(hit.price) : "—"}
        </div>
      </div>
    </Link>
  )
}

function getActivePage(pathname: string): string {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/shop') || pathname.startsWith('/featured')) return 'shop'
  if (pathname.startsWith('/product')) return 'shop'
  if (pathname.startsWith('/resources-on-guns')) return 'resources'
  if (pathname.startsWith('/articles') || pathname.startsWith('/article')) return 'articles'
  if (pathname.startsWith('/faq')) return 'faq'
  if (pathname.startsWith('/support')) return 'support'
  if (pathname.startsWith('/about')) return 'about'
  if (pathname.startsWith('/contact')) return 'contact'
  if (pathname.startsWith('/sell-your-gun')) return 'consignment'
  if (pathname.startsWith('/account')) return 'account'
  if (pathname.startsWith('/cart')) return 'cart'
  return ''
}

// ── Mobile Nav ─────────────────────────────────────────────────────────────
function MobileNav({ logoUrl }: { logoUrl?: string }) {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const { isLoggedIn, customer, signOut } = useAuth()
  const { cartCount } = useCart()
  const { hits, total } = useSearch(searchQuery)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const go = (path: string) => { router.push(path); setOpen(false) }
  const handleSignOut = () => { signOut(); setOpen(false); router.push("/") }

  const T = { bg: "#ffffff", surface: "#fafafa", text: "#1a1a1a", muted: "#525258", dim: "#707076", border: "#e4e4e6", gold: "#7e5e10" }

  const accountItems: [string, string][] = isLoggedIn
    ? [["/account", "My Account"], ["/account", "Order History"]]
    : [["/account", "My Account"], ["/auth", "Sign In"], ["/auth?tab=register", "Register"]]

  const NAV = [
    { section: "Shop",      items: [["/", "Home"], ["/shop", "Shop All"], ["/shop/collectible-firearms", "Collectible Firearms"], ["/shop/modern-firearms", "Modern Firearms"], ["/cart", "Cart"]] as [string, string][] },
    { section: "Shop By",   items: [["/shop/brands", "Brands"], ["/shop/collections", "Collections"], ["/shop/categories", "Categories"], ["/shop/models", "Models"]] as [string, string][] },
    { section: "Editorial", items: [["/resources-on-guns", "Resources on Guns"], ["/articles", "Articles"]] as [string, string][] },
    { section: "Account",   items: accountItems },
    { section: "Company",   items: [["/about", "About"], ["/contact", "Contact"], ["/sell-your-gun", "Sell Your Gun"]] as [string, string][] },
    { section: "Help",      items: [["/faq", "FAQ"], ["/support", "Support"]] as [string, string][] },
  ]

  const btnStyle = {
    position: "relative" as const,
    width: "42px", height: "42px",
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(16px) saturate(1.3)",
    WebkitBackdropFilter: "blur(16px) saturate(1.3)",
    border: `1px solid #e4e4e6`,
    color: "#7e5e10",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 0, borderRadius: "1px",
    transition: "border-color 0.2s, color 0.2s",
    fontFamily: "inherit",
  }

  return (
    <>
      {/* Mobile control cluster — display controlled by CSS (.lxs-mnav-cluster) */}
      <div className="lxs-mnav-cluster" style={{ position: "fixed", top: "calc(var(--ann-h, 0px) + 17px)", right: "16px", zIndex: 9998, gap: "8px" }}>
        {/* Search */}
        <button style={btnStyle} onClick={() => setSearchOpen(true)} aria-label="Open search"
          onMouseEnter={e => (e.currentTarget.style.borderColor = "#7e5e10" + "88")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "#e4e4e6")}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5.2" stroke="currentColor" strokeWidth="1.1"/>
            <line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Cart */}
        <button style={{ ...btnStyle, position: "relative" }} onClick={() => router.push('/cart')} aria-label="Cart"
          onMouseEnter={e => (e.currentTarget.style.borderColor = "#7e5e10" + "88")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "#e4e4e6")}>
          <svg width="17" height="16" viewBox="0 0 17 16" fill="none">
            <path d="M1 1H3.2L5 11H13L15 4.5H3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6.5" cy="14" r="0.9" fill="currentColor"/>
            <circle cx="12" cy="14" r="0.9" fill="currentColor"/>
          </svg>
          {cartCount > 0 && (
            <span style={{ position: "absolute", top: "-4px", right: "-4px", width: "16px", height: "16px", borderRadius: "50%", background: "#7e5e10", color: "#ffffff", fontSize: "9px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid #ffffff` }}>
              {cartCount}
            </span>
          )}
        </button>

        {/* Menu */}
        <button style={btnStyle} onClick={() => setOpen(true)} aria-label="Open menu"
          onMouseEnter={e => (e.currentTarget.style.borderColor = "#7e5e10" + "88")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "#e4e4e6")}>
          <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
            <line x1="0.5" y1="1"   x2="15.5" y2="1"   stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            <line x1="0.5" y1="5.5" x2="15.5" y2="5.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            <line x1="0.5" y1="10"  x2="15.5" y2="10"  stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="lxs-mnav-backdrop" style={{ justifyContent: "center", alignItems: "flex-start", paddingTop: "12vh" }}
          onClick={e => { if ((e.target as HTMLElement).classList.contains('lxs-mnav-backdrop')) setSearchOpen(false) }}>
          <div style={{ width: "min(560px, 90vw)", background: T.bg, border: `1px solid ${T.border}`, borderTop: `2px solid ${T.gold}`, padding: "28px 28px 24px", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "16px", height: "1px", background: T.gold }}/>
                <span style={{ fontSize: "9px", letterSpacing: "0.26em", textTransform: "uppercase", color: T.gold, fontWeight: 600 }}>Search the Collection</span>
              </div>
              <button onClick={() => setSearchOpen(false)} aria-label="Close search"
                style={{ width: "36px", height: "36px", background: "none", border: `1px solid ${T.border}`, color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); setSearchOpen(false); router.push(`/shop${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`); setSearchQuery('') }}
              style={{ display: "flex", gap: "10px", alignItems: "stretch" }}>
              <input autoFocus type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by brand, model, caliber…"
                style={{ flex: 1, padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: "'Inter', sans-serif", fontSize: "14px", outline: "none", letterSpacing: "0.02em", minHeight: "48px" }}/>
              <button type="submit" style={{ padding: "0 22px", background: T.gold, border: "none", color: "#ffffff", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, cursor: "pointer", minHeight: "48px" }}>
                Search
              </button>
            </form>
            {/* Live results */}
            {hits.length > 0 ? (
              <div style={{ marginTop: "12px", borderTop: `1px solid ${T.border}` }}>
                {hits.map(hit => (
                  <SearchResultItem key={hit.id} hit={hit} onClick={() => { setSearchOpen(false); setSearchQuery('') }} />
                ))}
                {total > hits.length && (
                  <Link href={`/shop?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                    style={{ display: "block", padding: "12px 16px", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.gold, fontWeight: 500, textDecoration: "none", borderTop: `1px solid ${T.border}`, textAlign: "center" }}>
                    View all {total} results →
                  </Link>
                )}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div style={{ marginTop: "16px", fontSize: "12px", color: T.dim, fontWeight: 300 }}>No results for &ldquo;{searchQuery}&rdquo;</div>
            ) : (
              <div style={{ marginTop: "16px", fontSize: "11px", color: T.dim, fontWeight: 300, lineHeight: 1.6 }}>
                Try <span style={{ color: T.gold }}>&ldquo;Nighthawk&rdquo;</span>, <span style={{ color: T.gold }}>&ldquo;.357 Magnum&rdquo;</span>, or <span style={{ color: T.gold }}>&ldquo;1911&rdquo;</span>.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide-out nav panel */}
      {open && (
        <div className="lxs-mnav-backdrop"
          onClick={e => { if ((e.target as HTMLElement).classList.contains('lxs-mnav-backdrop')) setOpen(false) }}>
          <div className="lxs-mnav-panel" style={{ background: T.bg, color: T.text, borderLeft: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${T.border}` }}>
              <Image src={logoUrl ?? "/logo.webp"} alt="Luxus Collection" width={144} height={36}
                style={{ height: "36px", width: "auto", filter: "brightness(0.68) saturate(1.1)" }}/>
              <button onClick={() => setOpen(false)} aria-label="Close menu"
                style={{ width: "40px", height: "40px", background: "none", border: `1px solid ${T.border}`, color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
              {NAV.map(({ section, items }) => (
                <div key={section} style={{ padding: "14px 0 8px", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ padding: "0 22px 10px", fontSize: "9px", letterSpacing: "0.24em", textTransform: "uppercase", color: T.gold, fontWeight: 600 }}>
                    {section === "Account" && isLoggedIn && customer
                      ? `${customer.first_name} ${customer.last_name}`
                      : section}
                  </div>
                  {items.map(([path, label]) => (
                    <button key={label} onClick={() => go(path)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 22px", color: T.text, fontSize: "14px", fontWeight: 400, background: "none", border: "none", cursor: "pointer", minHeight: "48px", letterSpacing: "0.02em", textAlign: "left" }}>
                      <span>{label}</span>
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ color: T.dim, flexShrink: 0 }}><path d="M1 1L8 1L8 8M8 1L1 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  ))}
                  {section === "Account" && isLoggedIn && (
                    <button onClick={handleSignOut}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 22px", color: "#b05040", fontSize: "14px", fontWeight: 400, background: "none", border: "none", cursor: "pointer", minHeight: "48px", letterSpacing: "0.02em", textAlign: "left" }}>
                      <span>Sign Out</span>
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ color: "#b05040", flexShrink: 0 }}><path d="M1 1L8 1L8 8M8 1L1 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Desktop Header ─────────────────────────────────────────────────────────
export default function Header({ logoUrl }: { logoUrl?: string }) {
  const { t } = useTheme()
  const pathname = usePathname()
  const activePage = getActivePage(pathname)
  const { isLoggedIn, customer } = useAuth()
  const { cartCount } = useCart()

  const [scrolled, setScrolled] = useState(false)
  const [shopAllOpen, setShopAllOpen] = useState(false)
  const [shopByOpen, setShopByOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLDivElement>(null)
  const { hits, total } = useSearch(searchQuery)

  useEffect(() => {
    if (!searchOpen) return
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false); setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [searchOpen])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navItem: React.CSSProperties = {
    fontSize: "9.5px", letterSpacing: "0.15em", textTransform: "uppercase",
    cursor: "pointer", fontWeight: 500, fontFamily: "'Inter',sans-serif",
    transition: "color 0.2s", whiteSpace: "nowrap", textDecoration: "none",
  }

  const NAV = [
    { slug: "resources", label: "Resources on Guns", href: "/resources-on-guns" },
    { slug: "articles",  label: "Articles",           href: "/articles"          },
    { slug: "faq",       label: "FAQ",                href: "/faq"               },
    { slug: "about",     label: "About",              href: "/about"             },
  ]

  return (
    <>
      <header style={{
        position: "fixed", top: "var(--ann-h, 0px)", left: 0, right: 0, zIndex: 200, height: "68px",
        background: scrolled ? "rgba(255,255,255,0.94)" : t.bg,
        backdropFilter: scrolled ? "blur(20px) saturate(1.2)" : "none",
        borderBottom: `1px solid ${scrolled ? t.border : "transparent"}`,
        transition: "all 0.35s ease",
      }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", height: "100%", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "32px" }}>

          {/* Logo */}
          <Link href="/" style={{ flexShrink: 0 }}>
            <Image src={logoUrl ?? "/logo.webp"} alt="Luxus Collection" width={168} height={42} priority
              style={{ height: "42px", width: "auto", display: "block", filter: "brightness(0.68) saturate(1.1)" }}/>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: "28px", flex: 1, justifyContent: "center" }}>

            {/* Shop All + dropdown */}
            <div style={{ position: "relative" }}
              onMouseEnter={() => setShopAllOpen(true)}
              onMouseLeave={() => setShopAllOpen(false)}>
              <Link href="/shop" className="nav-link"
                style={{ ...navItem, display: "flex", alignItems: "center", gap: "4px", color: shopAllOpen || activePage === 'shop' ? t.gold : t.textMuted }}>
                Shop All
                <svg width="7" height="5" viewBox="0 0 7 5" fill="none" style={{ transition: "transform 0.2s", transform: shopAllOpen ? "rotate(180deg)" : "none" }}>
                  <path d="M0.5 0.5L3.5 4L6.5 0.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              {shopAllOpen && (
                <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", paddingTop: "14px" }}>
                  <div style={{ background: "#ffffff", border: `1px solid ${t.border}`, borderTop: `2px solid ${t.gold}`, minWidth: "180px", boxShadow: "0 20px 60px rgba(0,0,0,0.1)", padding: "8px 0" }}>
                    {([
                      ["All Items",             "/shop"],
                      ["Collectible Firearms",  "/shop/collectible-firearms"],
                      ["Modern Firearms",       "/shop/modern-firearms"],
                    ] as [string, string][]).map(([label, href]) => (
                      <Link key={label} href={href}
                        style={{ display: "block", padding: "9px 22px", fontSize: "9px", letterSpacing: "0.13em", textTransform: "uppercase", color: t.textMuted, textDecoration: "none", fontFamily: "'Inter',sans-serif", fontWeight: 500, transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.color = t.gold; e.currentTarget.style.paddingLeft = "26px" }}
                        onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.paddingLeft = "22px" }}>
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Shop By dropdown */}
            <div style={{ position: "relative" }}
              onMouseEnter={() => setShopByOpen(true)}
              onMouseLeave={() => setShopByOpen(false)}>
              <span className="nav-link" style={{ ...navItem, display: "flex", alignItems: "center", gap: "4px", color: shopByOpen || activePage === 'shop' ? t.gold : t.textMuted }}>
                Shop By
                <svg width="7" height="5" viewBox="0 0 7 5" fill="none" style={{ transition: "transform 0.2s", transform: shopByOpen ? "rotate(180deg)" : "none" }}>
                  <path d="M0.5 0.5L3.5 4L6.5 0.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              {shopByOpen && (
                <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", paddingTop: "14px" }}>
                  <div style={{ background: "#ffffff", border: `1px solid ${t.border}`, borderTop: `2px solid ${t.gold}`, minWidth: "148px", boxShadow: "0 20px 60px rgba(0,0,0,0.1)", padding: "8px 0" }}>
                    {([["Brands", "/shop/brands"], ["Collections", "/shop/collections"], ["Categories", "/shop/categories"], ["Models", "/shop/models"]] as [string, string][]).map(([label, href]) => (
                      <Link key={label} href={href}
                        style={{ display: "block", padding: "9px 22px", fontSize: "9px", letterSpacing: "0.13em", textTransform: "uppercase", color: t.textMuted, textDecoration: "none", fontFamily: "'Inter',sans-serif", fontWeight: 500, transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.color = t.gold; e.currentTarget.style.paddingLeft = "26px" }}
                        onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.paddingLeft = "22px" }}>
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Other nav links */}
            {NAV.map(({ slug, label, href }) => (
              <Link key={slug} href={href} className="nav-link"
                style={{ ...navItem, color: activePage === slug ? t.gold : t.textMuted }}>
                {label}
              </Link>
            ))}

            {/* Contact dropdown */}
            <div style={{ position: "relative" }}
              onMouseEnter={() => setContactOpen(true)}
              onMouseLeave={() => setContactOpen(false)}>
              <Link href="/contact" className="nav-link"
                style={{ ...navItem, display: "flex", alignItems: "center", gap: "4px", color: contactOpen || activePage === 'contact' || activePage === 'consignment' || activePage === 'support' ? t.gold : t.textMuted }}>
                Contact
                <svg width="7" height="5" viewBox="0 0 7 5" fill="none" style={{ transition: "transform 0.2s", transform: contactOpen ? "rotate(180deg)" : "none" }}>
                  <path d="M0.5 0.5L3.5 4L6.5 0.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              {contactOpen && (
                <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", paddingTop: "14px" }}>
                  <div style={{ background: "#ffffff", border: `1px solid ${t.border}`, borderTop: `2px solid ${t.gold}`, minWidth: "168px", boxShadow: "0 20px 60px rgba(0,0,0,0.1)", padding: "8px 0" }}>
                    {([["Contact Us", "/contact", activePage === 'contact'], ["Support", "/support", activePage === 'support'], ["Sell Your Gun", "/sell-your-gun", activePage === 'consignment']] as [string, string, boolean][]).map(([label, href, isActive]) => (
                      <Link key={label} href={href}
                        style={{ display: "block", padding: "9px 22px", fontSize: "9px", letterSpacing: "0.13em", textTransform: "uppercase", color: isActive ? t.gold : t.textMuted, textDecoration: "none", fontFamily: "'Inter',sans-serif", fontWeight: 500, transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.color = t.gold; e.currentTarget.style.paddingLeft = "26px" }}
                        onMouseLeave={e => { e.currentTarget.style.color = isActive ? t.gold : t.textMuted; e.currentTarget.style.paddingLeft = "22px" }}>
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "18px", flexShrink: 0 }}>
            {/* Search */}
            <div ref={searchRef} style={{ position: "relative" }}>
              <button
                onClick={() => { setSearchOpen(o => !o); setSearchQuery('') }}
                aria-label="Search"
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: searchOpen ? t.gold : t.textMuted, width: "20px", height: "20px", transition: "color 0.2s" }}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.1"/>
                  <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                </svg>
              </button>
              {searchOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 16px)", width: "380px", background: "#fff", border: `1px solid ${t.border}`, borderTop: `2px solid ${t.gold}`, boxShadow: "0 20px 60px rgba(0,0,0,0.12)", zIndex: 200 }}>
                  <div style={{ padding: "14px 16px", borderBottom: `1px solid ${t.border}` }}>
                    <form onSubmit={e => { e.preventDefault(); setSearchOpen(false); setSearchQuery(''); if (searchQuery.trim()) window.location.href = `/shop?q=${encodeURIComponent(searchQuery.trim())}` }}
                      style={{ display: "flex", gap: "8px" }}>
                      <input
                        autoFocus
                        type="search"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Brand, model, caliber…"
                        style={{ flex: 1, padding: "9px 12px", border: `1px solid ${t.border}`, background: "#fafafa", color: t.text, fontFamily: "'Inter',sans-serif", fontSize: "13px", outline: "none", letterSpacing: "0.02em" }}
                      />
                      <button type="submit" style={{ padding: "0 14px", background: t.gold, border: "none", color: "#fff", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600, cursor: "pointer" }}>
                        Go
                      </button>
                    </form>
                  </div>
                  {hits.length > 0 ? (
                    <div>
                      {hits.map(hit => (
                        <SearchResultItem key={hit.id} hit={hit} onClick={() => { setSearchOpen(false); setSearchQuery('') }} />
                      ))}
                      {total > hits.length && (
                        <Link href={`/shop?q=${encodeURIComponent(searchQuery)}`}
                          onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                          style={{ display: "block", padding: "11px 16px", fontSize: "9.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.gold, fontWeight: 500, textDecoration: "none", borderTop: `1px solid ${t.border}`, textAlign: "center" }}>
                          View all {total} results →
                        </Link>
                      )}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div style={{ padding: "16px", fontSize: "12px", color: t.textMuted, fontWeight: 300 }}>No results for &ldquo;{searchQuery}&rdquo;</div>
                  ) : (
                    <div style={{ padding: "14px 16px", fontSize: "10.5px", color: t.textMuted, fontWeight: 300, lineHeight: 1.7 }}>
                      Try <span style={{ color: t.gold }}>&ldquo;Nighthawk&rdquo;</span>, <span style={{ color: t.gold }}>&ldquo;1911&rdquo;</span>, or <span style={{ color: t.gold }}>&ldquo;.357&rdquo;</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Account */}
            <Link href="/account" className="nav-link"
              style={{ ...navItem, color: activePage === 'account' ? t.gold : t.textMuted }}>
              {isLoggedIn && customer ? customer.first_name : "Account"}
            </Link>

            {/* Cart */}
            <Link href="/cart" className="nav-link" aria-label="Cart"
              style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", color: t.textMuted, width: "20px", height: "20px" }}>
              <svg width="17" height="16" viewBox="0 0 17 16" fill="none">
                <path d="M1 1H3.2L5 11H13L15 4.5H3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="6.5" cy="14" r="0.9" fill="currentColor"/>
                <circle cx="12" cy="14" r="0.9" fill="currentColor"/>
              </svg>
              {cartCount > 0 && (
                <span style={{ position: "absolute", top: "-5px", right: "-6px", width: "13px", height: "13px", borderRadius: "50%", background: t.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7px", fontWeight: 600, color: "#fff" }}>
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <MobileNav logoUrl={logoUrl} />
    </>
  )
}
