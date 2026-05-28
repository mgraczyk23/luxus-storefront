'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'

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
  if (pathname.startsWith('/consignment')) return 'consignment'
  if (pathname.startsWith('/account')) return 'account'
  if (pathname.startsWith('/cart')) return 'cart'
  return ''
}

// ── Mobile Nav ─────────────────────────────────────────────────────────────
function MobileNav({ cartCount }: { cartCount: number }) {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const go = (path: string) => { router.push(path); setOpen(false) }

  const T = { bg: "#ffffff", surface: "#fafafa", text: "#1a1a1a", muted: "#525258", dim: "#707076", border: "#e4e4e6", gold: "#7e5e10" }

  const NAV = [
    { section: "Shop",      items: [["/", "Home"], ["/shop", "Shop All"], ["/cart", "Cart"]] as [string, string][] },
    { section: "Shop By",   items: [["/shop/brands", "Brands"], ["/shop/collections", "Collections"], ["/shop/categories", "Categories"]] as [string, string][] },
    { section: "Editorial", items: [["/resources-on-guns", "Resources on Guns"], ["/articles", "Articles"]] as [string, string][] },
    { section: "Account",   items: [["/account", "My Account"], ["/auth", "Sign In / Register"]] as [string, string][] },
    { section: "Company",   items: [["/about", "About"], ["/contact", "Contact"], ["/consignment", "Consignment"]] as [string, string][] },
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
            <div style={{ marginTop: "16px", fontSize: "11px", color: T.dim, fontWeight: 300, lineHeight: 1.6 }}>
              Try <span style={{ color: T.gold }}>&ldquo;Nighthawk&rdquo;</span>, <span style={{ color: T.gold }}>&ldquo;.357 Magnum&rdquo;</span>, or <span style={{ color: T.gold }}>&ldquo;1911&rdquo;</span>.
            </div>
          </div>
        </div>
      )}

      {/* Slide-out nav panel */}
      {open && (
        <div className="lxs-mnav-backdrop"
          onClick={e => { if ((e.target as HTMLElement).classList.contains('lxs-mnav-backdrop')) setOpen(false) }}>
          <div className="lxs-mnav-panel" style={{ background: T.bg, color: T.text, borderLeft: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${T.border}` }}>
              <Image src="/logo.webp" alt="Luxus Collection" width={144} height={36}
                style={{ height: "36px", width: "auto", filter: "brightness(0.68) saturate(1.1)" }}/>
              <button onClick={() => setOpen(false)} aria-label="Close menu"
                style={{ width: "40px", height: "40px", background: "none", border: `1px solid ${T.border}`, color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
              {NAV.map(({ section, items }) => (
                <div key={section} style={{ padding: "14px 0 8px", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ padding: "0 22px 10px", fontSize: "9px", letterSpacing: "0.24em", textTransform: "uppercase", color: T.gold, fontWeight: 600 }}>{section}</div>
                  {items.map(([path, label]) => (
                    <button key={path} onClick={() => go(path)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 22px", color: T.text, fontSize: "14px", fontWeight: 400, background: "none", border: "none", cursor: "pointer", minHeight: "48px", letterSpacing: "0.02em", textAlign: "left" }}>
                      <span>{label}</span>
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ color: T.dim, flexShrink: 0 }}><path d="M1 1L8 1L8 8M8 1L1 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  ))}
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
export default function Header({ cartCount = 0 }: { cartCount?: number }) {
  const { t } = useTheme()
  const pathname = usePathname()
  const activePage = getActivePage(pathname)

  const [scrolled, setScrolled] = useState(false)
  const [shopByOpen, setShopByOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

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
    { slug: "support",   label: "Support",            href: "/support"           },
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
            <Image src="/logo.webp" alt="Luxus Collection" width={168} height={42} priority
              style={{ height: "42px", width: "auto", display: "block", filter: "brightness(0.68) saturate(1.1)" }}/>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: "28px", flex: 1, justifyContent: "center" }}>

            {/* Shop All */}
            <Link href="/shop" className="nav-link"
              style={{ ...navItem, color: activePage === 'shop' ? t.gold : t.textMuted }}>
              Shop All
            </Link>

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
                    {([["Brands", "/shop/brands"], ["Collections", "/shop/collections"], ["Categories", "/shop/categories"]] as [string, string][]).map(([label, href]) => (
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
                style={{ ...navItem, display: "flex", alignItems: "center", gap: "4px", color: contactOpen || activePage === 'contact' || activePage === 'consignment' ? t.gold : t.textMuted }}>
                Contact
                <svg width="7" height="5" viewBox="0 0 7 5" fill="none" style={{ transition: "transform 0.2s", transform: contactOpen ? "rotate(180deg)" : "none" }}>
                  <path d="M0.5 0.5L3.5 4L6.5 0.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              {contactOpen && (
                <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", paddingTop: "14px" }}>
                  <div style={{ background: "#ffffff", border: `1px solid ${t.border}`, borderTop: `2px solid ${t.gold}`, minWidth: "168px", boxShadow: "0 20px 60px rgba(0,0,0,0.1)", padding: "8px 0" }}>
                    {([["Contact Us", "/contact", activePage === 'contact'], ["Consignment", "/consignment", activePage === 'consignment']] as [string, string, boolean][]).map(([label, href, isActive]) => (
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
            <Link href="/shop" className="nav-link" aria-label="Search"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", color: t.textMuted, width: "20px", height: "20px" }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.1"/>
                <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
            </Link>

            {/* Account */}
            <Link href="/account" className="nav-link"
              style={{ ...navItem, color: activePage === 'account' ? t.gold : t.textMuted }}>
              Account
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

      <MobileNav cartCount={cartCount} />
    </>
  )
}
