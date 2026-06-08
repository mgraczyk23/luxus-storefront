'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import type { SiteSettings } from '@/lib/payload'

const FOOTER_LINKS = {
  Shop: [
    { label: "Brands",       href: "/shop/brands"      },
    { label: "Collections",  href: "/shop/collections" },
    { label: "Categories",   href: "/shop/categories"  },
    { label: "Models",       href: "/shop/models"      },
    { label: "Featured",     href: "/featured"         },
  ],
  Information: [
    { label: "About",            href: "/about"    },
    { label: "Contact",          href: "/contact"  },
    { label: "FAQ",              href: "/faq"      },
    { label: "Support",          href: "/support"  },
    { label: "Shipping Policy",  href: "/shipping" },
    { label: "Returns",          href: "/shipping" },
  ],
  Account: [
    { label: "Sign In",        href: "/auth"              },
    { label: "Register",       href: "/auth?tab=register" },
    { label: "Order History",  href: "/account"           },
    { label: "Sell Your Gun",  href: "/sell-your-gun"     },
  ],
}

export default function Footer({ settings, logoUrl }: { settings: SiteSettings; logoUrl?: string }) {
  const { t } = useTheme()
  const { contact, social, footer = {} } = settings
  const logoSrc = logoUrl ?? '/logo.webp'
  const blurb         = footer.blurb         ?? "A boutique destination for the serious collector, curating the world's finest production and custom pistols since 2026."
  const copyrightLine = footer.copyrightLine  ?? "© 2026 Luxus Collection LLC · luxus-collection.com · All Rights Reserved"
  const legalLine     = footer.legalLine      ?? "All transactions conducted in full compliance with federal, state, and local firearms laws. FFL transfers required. Licensed Federal Firearms Dealer · License #1-59-XXX-XX-XX-55688."

  const SOCIAL = [
    { label: "Facebook",    href: social.facebook,   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 2H15C13.67 2 12.4 2.53 11.46 3.46C10.53 4.4 10 5.67 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73 14.11 6.48 14.29 6.29C14.48 6.11 14.73 6 15 6H18V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: "Instagram",   href: social.instagram,  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg> },
    { label: "LinkedIn",    href: social.linkedin,   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M16 8C17.59 8 19.12 8.63 20.24 9.76C21.37 10.88 22 12.41 22 14V21H18V14C18 13.47 17.79 12.96 17.41 12.59C17.04 12.21 16.53 12 16 12C15.47 12 14.96 12.21 14.59 12.59C14.21 12.96 14 13.47 14 14V21H10V14C10 12.41 10.63 10.88 11.76 9.76C12.88 8.63 14.41 8 16 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="2" y="9" width="4" height="12" stroke="currentColor" strokeWidth="1.5"/><circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.5"/></svg> },
    { label: "X / Twitter", href: social.twitter,    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 4L20 20M20 4L4 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
    { label: "YouTube",     href: social.youtube,    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22.54 6.42C22.27 5.36 21.45 4.53 20.4 4.27C18.52 3.75 12 3.75 12 3.75C12 3.75 5.48 3.75 3.6 4.27C2.55 4.53 1.73 5.36 1.46 6.42C0.96 8.34 0.96 12.36 0.96 12.36C0.96 12.36 0.96 16.38 1.46 18.3C1.73 19.36 2.55 20.19 3.6 20.45C5.48 20.97 12 20.97 12 20.97C12 20.97 18.52 20.97 20.4 20.45C21.45 20.19 22.27 19.36 22.54 18.3C23.04 16.38 23.04 12.36 23.04 12.36C23.04 12.36 23.04 8.34 22.54 6.42ZM9.75 15.57V9.15L15.5 12.36L9.75 15.57Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
    { label: "Pinterest",   href: social.pinterest,  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12C2 16.24 4.64 19.85 8.36 21.31C8.27 20.55 8.19 19.37 8.39 18.53C8.57 17.77 9.53 13.69 9.53 13.69C9.53 13.69 9.25 13.12 9.25 12.28C9.25 10.96 10.02 9.97 11 9.97C11.8 9.97 12.2 10.57 12.2 11.31C12.2 12.12 11.68 13.34 11.41 14.47C11.18 15.42 11.88 16.19 12.81 16.19C14.5 16.19 15.8 14.39 15.8 11.82C15.8 9.54 14.15 7.95 11.82 7.95C9.12 7.95 7.55 9.97 7.55 12.06C7.55 12.88 7.86 13.76 8.25 14.24C8.33 14.33 8.34 14.42 8.32 14.51C8.25 14.8 8.08 15.46 8.05 15.59C8.01 15.77 7.91 15.81 7.72 15.72C6.55 15.16 5.81 13.41 5.81 12.02C5.81 9.04 7.99 6.31 12.05 6.31C15.33 6.31 17.88 8.64 17.88 11.78C17.88 15.06 15.82 17.69 12.99 17.69C12.03 17.69 11.12 17.19 10.81 16.6L10.26 18.7C10.06 19.46 9.52 20.42 9.17 21C10.09 21.28 11.03 21.43 12 21.43C17.52 21.43 22 16.95 22 11.43C22 5.91 17.52 2 12 2Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  ].filter(s => s.href)

  const linkStyle: React.CSSProperties = {
    fontSize: "11.5px", fontWeight: 300, color: t.textMuted,
    letterSpacing: "0.02em", transition: "color 0.15s", textDecoration: "none", display: "block",
  }

  return (
    <footer className="lxs-footer" style={{ background: t.bg, fontFamily: "'Inter',sans-serif", borderTop: `1px solid ${t.border}` }}>
      <div style={{ maxWidth: "1440px", margin: "0 auto" }}>

        {/* Main grid: [brand 2fr] [shop 1fr] [info 1fr] [account 1fr] */}
        <div className="lxs-footer-grid" style={{ display: "grid" }}>

          {/* ── Brand column ─────────────────────────────────────────── */}
          <div className="lxs-footer-brand">
            <div className="lxs-footer-brand-logo" style={{ marginBottom: "20px" }}>
              <Image src={logoSrc} alt="Luxus Collection" width={224} height={56}
                style={{ height: "56px", width: "auto", display: "block", filter: "brightness(0.68) saturate(1.1)" }}/>
            </div>
            <p className="lxs-footer-brand-blurb" style={{ fontSize: "12px", fontWeight: 300, lineHeight: 1.85, color: "#525258", maxWidth: "260px", margin: 0 }}>
              {blurb}
            </p>

            {/* Contact links */}
            <div className="lxs-footer-contact" style={{ display: "flex", flexDirection: "column", gap: "9px", marginTop: "22px" }}>
              {[
                { href: `tel:${contact.phone.replace(/\D/g,'')}`,         icon: "phone", label: contact.phone              },
                { href: `tel:${contact.phoneTollFree.replace(/\D/g,'')}`, icon: "phone", label: `${contact.phoneTollFree} · Toll-Free`  },
                { href: `mailto:${contact.emailInfo}`,                    icon: "email", label: contact.emailInfo  },
              ].map(({ href, icon, label }) => (
                <a key={label} href={href}
                  style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "#525258", fontSize: "12px", fontWeight: 300, letterSpacing: "0.02em", transition: "color 0.18s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = t.gold)}
                  onMouseLeave={e => (e.currentTarget.style.color = "#525258")}>
                  {icon === 'phone' ? (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, opacity: 0.6 }}>
                      <path d="M2 1.5C2 1.5 1 1.5 1 2.5C1 3.5 1.5 6.5 4.5 9.5C7.5 12.5 10.5 12 11.5 12C12.5 12 12.5 11 12.5 11L11 8.5C11 8.5 10.5 8 10 8.5L8.5 9.5C8.5 9.5 7 9 5 7C3 5 3.5 3.5 3.5 3.5L4.5 2C5 1.5 4.5 1 4.5 1L2 1.5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, opacity: 0.6 }}>
                      <rect x="1" y="2.5" width="11" height="8" rx="1" stroke="currentColor" strokeWidth="1"/>
                      <path d="M1 3.5L6.5 7.5L12 3.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                  )}
                  {label}
                </a>
              ))}
            </div>

            {/* Social icons */}
            {SOCIAL.length > 0 && (
              <div className="lxs-footer-social" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "22px" }}>
                {SOCIAL.map(({ label, href, icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label}
                    style={{ width: "32px", height: "32px", border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: t.gold, textDecoration: "none", transition: "all 0.18s", flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold + "55"; e.currentTarget.style.color = t.gold }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.gold }}>
                    {icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* ── Nav columns ──────────────────────────────────────────── */}
          {(Object.entries(FOOTER_LINKS) as [string, { label: string; href: string }[]][]).map(([heading, links]) => (
            <div key={heading} className="lxs-footer-nav-col">
              <div style={{ fontSize: "7.5px", letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 500, color: t.gold, marginBottom: "18px" }}>
                {heading}
              </div>
              <div className="lxs-footer-nav-links" style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                {links.map(({ label, href }) => (
                  <Link key={label} href={href} style={linkStyle}
                    onMouseEnter={e => (e.currentTarget.style.color = t.gold)}
                    onMouseLeave={e => (e.currentTarget.style.color = t.textMuted)}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ───────────────────────────────────────────────── */}
        <div className="lxs-footer-bottom" style={{ borderTop: `1px solid ${t.border}`, padding: "22px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ fontSize: "9.5px", color: t.textMuted, letterSpacing: "0.04em" }}>
            {copyrightLine}
          </span>
          <div className="lxs-footer-legal" style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <Link href="/privacy"
              style={{ fontSize: "9.5px", color: t.gold, letterSpacing: "0.06em", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = t.goldLight)}
              onMouseLeave={e => (e.currentTarget.style.color = t.gold)}>
              Privacy Policy
            </Link>
            <Link href="/terms"
              style={{ fontSize: "9.5px", color: t.gold, letterSpacing: "0.06em", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = t.goldLight)}
              onMouseLeave={e => (e.currentTarget.style.color = t.gold)}>
              Terms &amp; Conditions
            </Link>
            <span style={{ fontSize: "9.5px", color: t.textMuted, letterSpacing: "0.025em", lineHeight: 1.6 }}>
              {legalLine}
            </span>
          </div>
        </div>

      </div>
    </footer>
  )
}
