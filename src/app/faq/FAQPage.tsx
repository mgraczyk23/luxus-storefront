'use client'

import { useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import type { PayloadFaqCategory } from '@/lib/payload'

/* ── Per-category icons (keyed by category name) ────────────────────────── */
const ICONS: Record<string, React.ReactNode> = {
  "Ordering & Purchasing": <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 1H3L4.5 9.5H12.5L14 4H3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="13" r="1" fill="currentColor"/><circle cx="11" cy="13" r="1" fill="currentColor"/></svg>,
  "FFL Transfers & Shipping": <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L14 4.5V8C14 11.5 11 13.5 8 15C5 13.5 2 11.5 2 8V4.5L8 1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/><path d="M5.5 8L7 9.5L10.5 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  "Products & Inventory": <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.1"/><rect x="9" y="1" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.1"/><rect x="1" y="9" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.1"/><rect x="9" y="9" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.1"/></svg>,
  "Payments & Pricing": <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3.5" width="14" height="9" rx="1" stroke="currentColor" strokeWidth="1.1"/><path d="M1 7H15" stroke="currentColor" strokeWidth="1.1"/><rect x="3" y="9" width="3" height="1.5" rx="0.3" fill="currentColor"/></svg>,
  "Returns & Warranties": <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8C2 4.68629 4.68629 2 8 2C10.2 2 12.1 3.1 13.2 4.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><path d="M14 8C14 11.3137 11.3137 14 8 14C5.8 14 3.9 12.9 2.8 11.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><path d="M11 4.5L13.5 5L13 2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 11.5L2.5 11L3 13.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  "Consignment & Trade-In": <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8H15M1 8L4.5 4.5M1 8L4.5 11.5M15 8L11.5 4.5M15 8L11.5 11.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}
const DEFAULT_ICON = <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.1"/><path d="M8 5C6.9 5 6 5.9 6 7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><path d="M8 9.5V10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>

function getIcon(category: string): React.ReactNode {
  return ICONS[category] ?? DEFAULT_ICON
}

/* ── Accordion item ──────────────────────────────────────────────────────── */
function AccordionItem({ item, isOpen, onToggle, highlight = "" }: {
  item: { id: string; question: string; answer: string }
  isOpen: boolean
  onToggle: () => void
  highlight?: string
}) {
  const { t } = useTheme()

  const hl = (text: string) => {
    if (!highlight.trim()) return <>{text}</>
    const idx = text.toLowerCase().indexOf(highlight.toLowerCase())
    if (idx === -1) return <>{text}</>
    return <>{text.slice(0, idx)}<mark style={{ background: t.gold + "35", color: t.gold, padding: "0 2px", borderRadius: "2px" }}>{text.slice(idx, idx + highlight.length)}</mark>{text.slice(idx + highlight.length)}</>
  }

  return (
    <div style={{ borderBottom: `1px solid ${t.border}`, background: isOpen ? "#fafafa" : "transparent", transition: "background 0.25s" }}>
      <button onClick={onToggle}
        style={{ width: "100%", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", padding: "20px 24px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontFamily: "var(--font-playfair)", fontSize: "18px", fontWeight: isOpen ? 400 : 300, color: isOpen ? t.gold : t.text, lineHeight: 1.35, letterSpacing: "0.01em", transition: "color 0.22s", flex: 1 }}>
          {hl(item.question)}
        </span>
        <div style={{ width: "24px", height: "24px", flexShrink: 0, border: `1px solid ${isOpen ? t.gold + "60" : t.border}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s", marginTop: "2px", background: isOpen ? t.gold + "15" : "transparent" }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transition: "transform 0.25s", transform: isOpen ? "rotate(45deg)" : "none" }}>
            <path d="M5 1V9M1 5H9" stroke={isOpen ? t.gold : t.textMuted} strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
      </button>
      <div style={{ overflow: "hidden", maxHeight: isOpen ? "600px" : "0", transition: "max-height 0.35s ease" }}>
        <div style={{ padding: "0 24px 24px" }}>
          <div style={{ width: "28px", height: "1px", background: t.gold + "60", marginBottom: "14px" }} />
          <p style={{ fontSize: "14px", fontWeight: 300, lineHeight: 1.85, color: t.textMuted, letterSpacing: "0.02em", fontFamily: "var(--font-inter)" }}>
            {hl(item.answer)}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function FAQPage({ categories }: { categories: PayloadFaqCategory[] }) {
  const { t } = useTheme()
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState(categories[0]?.category ?? "")
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const searchRef = useRef<HTMLInputElement>(null)

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return null
    return categories
      .map(cat => ({ ...cat, items: cat.items.filter(item => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)) }))
      .filter(cat => cat.items.length > 0)
  }, [search, categories])

  const activeSection = searchResults ? null : categories.find(c => c.category === activeCategory)
  const totalResults = searchResults ? searchResults.reduce((s, c) => s + c.items.length, 0) : null

  const toggleItem  = (id: string) => setOpenItems(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const expandAll   = (items: { id: string }[]) => setOpenItems(new Set(items.map(i => i.id)))
  const collapseAll = () => setOpenItems(new Set())

  const btnStyle = {
    fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: t.textMuted, background: "none",
    border: `1px solid ${t.border}`, padding: "6px 12px", cursor: "pointer", fontFamily: "var(--font-inter)", fontWeight: 500, transition: "all 0.18s",
  }

  // Empty state if CMS returns nothing
  if (categories.length === 0) {
    return (
      <div style={{ background: t.bg, minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: t.textDim, fontWeight: 300 }}>FAQ content coming soon.</p>
      </div>
    )
  }

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: "var(--font-inter)" }}>

      {/* BANNER */}
      <div style={{ background: "linear-gradient(to bottom,#f3f3f5,#ffffff)", borderBottom: `1px solid ${t.border}`, padding: "52px 40px 48px" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            {["Home", "FAQ"].map((crumb, i, arr) => (
              <div key={crumb} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {i > 0 && <span style={{ fontSize: "9px", color: t.textDim }}>›</span>}
                <span style={{ fontSize: "10px", color: i < arr.length - 1 ? t.textDim : t.textMuted, fontWeight: 300 }}>
                  {i < arr.length - 1 ? <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>{crumb}</Link> : crumb}
                </span>
              </div>
            ))}
          </div>
          <div className="lxs-faq-banner">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "18px", height: "1px", background: t.gold }} />
                <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>Help Center</span>
              </div>
              <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(36px,4vw,58px)", fontWeight: 300, color: t.text, lineHeight: 1.08, letterSpacing: "0.01em", marginBottom: "16px" }}>
                Frequently Asked<br />Questions
              </h1>
              <p style={{ fontSize: "14px", fontWeight: 300, color: t.textMuted, lineHeight: 1.8, maxWidth: "440px" }}>
                Answers to our most common questions across ordering, FFL transfers, products, payments, and more.
              </p>
            </div>
            <div>
              <div style={{ position: "relative" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: t.textDim, pointerEvents: "none" }}>
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.1" />
                  <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                </svg>
                <input ref={searchRef} type="text" placeholder="Search questions…" value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: "100%", padding: "15px 48px 15px 44px", background: "#fff", border: `1px solid ${search ? t.gold + "60" : t.border}`, color: t.text, fontSize: "14px", outline: "none", fontFamily: "var(--font-inter)", fontWeight: 300, letterSpacing: "0.02em", transition: "border-color 0.2s" }} />
                {search && (
                  <button onClick={() => setSearch("")} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: t.textDim, padding: "4px" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                  </button>
                )}
              </div>
              {search && (
                <div style={{ marginTop: "10px", fontSize: "11px", color: t.textDim, fontWeight: 300, letterSpacing: "0.03em" }}>
                  {totalResults! > 0
                    ? <><span style={{ color: t.text, fontWeight: 400 }}>{totalResults}</span> result{totalResults !== 1 ? "s" : ""} for &ldquo;<span style={{ color: t.gold }}>{search}</span>&rdquo;</>
                    : <>No results for &ldquo;<span style={{ color: t.gold }}>{search}</span>&rdquo; — try different keywords</>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="lxs-faq-main" style={{ maxWidth: "1440px", margin: "0 auto", padding: "52px 40px 96px" }}>
        {searchResults ? (
          <div style={{ maxWidth: "800px" }}>
            {searchResults.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div style={{ fontFamily: "var(--font-playfair)", fontSize: "28px", fontWeight: 300, color: t.textMuted, marginBottom: "12px" }}>No matching questions</div>
                <p style={{ fontSize: "13px", color: t.textDim, fontWeight: 300, marginBottom: "24px" }}>Try broader search terms, or contact our support team directly.</p>
                <Link href="/support" style={{ fontSize: "9.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.gold, fontWeight: 500, textDecoration: "none", borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px" }}>Contact Support →</Link>
              </div>
            ) : searchResults.map(cat => (
              <div key={cat.category} style={{ marginBottom: "44px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", color: t.gold }}>
                  {getIcon(cat.category)}
                  <span style={{ fontSize: "8.5px", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 500 }}>{cat.category}</span>
                </div>
                <div style={{ border: `1px solid ${t.border}` }}>
                  {cat.items.map(item => <AccordionItem key={item.id} item={item} isOpen={openItems.has(item.id)} onToggle={() => toggleItem(item.id)} highlight={search} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="lxs-faq-layout">
            {/* Sidebar */}
            <aside className="lxs-faq-sidebar" style={{ position: "sticky", top: "96px" }}>
              <div style={{ fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "16px" }}>Categories</div>
              <div className="lxs-faq-cat-list" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {categories.map(cat => (
                  <button key={cat.category} onClick={() => { setActiveCategory(cat.category); setOpenItems(new Set()) }}
                    className={activeCategory === cat.category ? "lxs-faq-cat-btn lxs-faq-cat-active" : "lxs-faq-cat-btn"}
                    style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", background: activeCategory === cat.category ? "#fafafa" : "transparent", border: `1px solid ${activeCategory === cat.category ? t.gold + "50" : "transparent"}`, cursor: "pointer", textAlign: "left", width: "100%", borderLeft: `2px solid ${activeCategory === cat.category ? t.gold : "transparent"}`, transition: "all 0.2s" }}>
                    <span className="lxs-faq-cat-icon" style={{ color: activeCategory === cat.category ? t.gold : t.textDim, flexShrink: 0, transition: "color 0.2s" }}>{getIcon(cat.category)}</span>
                    <span style={{ fontSize: "11.5px", fontWeight: activeCategory === cat.category ? 500 : 300, color: activeCategory === cat.category ? t.gold : t.textMuted, letterSpacing: "0.02em", transition: "color 0.2s" }}>{cat.category}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: "36px", padding: "20px", background: "#fafafa", border: `1px solid ${t.border}`, borderLeft: `2px solid ${t.gold}40` }}>
                <div style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "8px" }}>Still have questions?</div>
                <p style={{ fontSize: "11.5px", fontWeight: 300, color: t.textMuted, lineHeight: 1.65, marginBottom: "14px" }}>Our team typically responds within one business day.</p>
                <Link href="/support" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.gold, fontWeight: 500, textDecoration: "none", borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px", width: "fit-content" }}>
                  Contact Support
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4H9M6 1L9 4L6 7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </div>
            </aside>

            {/* Accordion panel */}
            <div>
              {activeSection && (
                <>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", color: t.gold }}>
                        {getIcon(activeSection.category)}
                        <span style={{ fontSize: "8.5px", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 500 }}>{activeSection.category}</span>
                      </div>
                      <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(24px,2.5vw,34px)", fontWeight: 300, color: t.text, lineHeight: 1.1 }}>{activeSection.category}</h2>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button onClick={() => expandAll(activeSection.items)} style={btnStyle}
                        onMouseEnter={e => { e.currentTarget.style.color = t.gold; e.currentTarget.style.borderColor = t.gold + "55" }}
                        onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.border }}>
                        Expand All
                      </button>
                      <button onClick={collapseAll} style={btnStyle}
                        onMouseEnter={e => { e.currentTarget.style.color = t.gold; e.currentTarget.style.borderColor = t.gold + "55" }}
                        onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.border }}>
                        Collapse All
                      </button>
                    </div>
                  </div>
                  <div style={{ height: "1px", background: `linear-gradient(to right,${t.gold}40,transparent)`, marginBottom: "0" }} />
                  <div style={{ border: `1px solid ${t.border}` }}>
                    {activeSection.items.map(item => <AccordionItem key={item.id} item={item} isOpen={openItems.has(item.id)} onToggle={() => toggleItem(item.id)} />)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "36px", paddingTop: "24px", borderTop: `1px solid ${t.border}` }}>
                    {(() => {
                      const idx = categories.findIndex(c => c.category === activeCategory)
                      const prev = categories[idx - 1]
                      const next = categories[idx + 1]
                      const navBtn = { display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: t.textMuted, fontFamily: "var(--font-inter)", fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase" as const, fontWeight: 500, transition: "color 0.2s" }
                      return (
                        <>
                          {prev ? (
                            <button onClick={() => { setActiveCategory(prev.category); setOpenItems(new Set()) }} style={navBtn}
                              onMouseEnter={e => e.currentTarget.style.color = t.gold} onMouseLeave={e => e.currentTarget.style.color = t.textMuted}>
                              <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              {prev.category}
                            </button>
                          ) : <div />}
                          {next && (
                            <button onClick={() => { setActiveCategory(next.category); setOpenItems(new Set()) }} style={navBtn}
                              onMouseEnter={e => e.currentTarget.style.color = t.gold} onMouseLeave={e => e.currentTarget.style.color = t.textMuted}>
                              {next.category}
                              <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SUPPORT CTA */}
      <section style={{ background: "#f3f3f5", borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, padding: "64px 40px" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
          <div className="lxs-faq-cta">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "18px", height: "1px", background: t.gold }} />
                <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>Still Need Help?</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(26px,2.8vw,38px)", fontWeight: 300, color: t.text, lineHeight: 1.15, marginBottom: "14px" }}>
                Our Team Is Here<br />To Assist You
              </h2>
              <p style={{ fontSize: "13.5px", fontWeight: 300, color: t.textMuted, lineHeight: 1.8, maxWidth: "400px" }}>
                If you couldn&apos;t find the answer you were looking for, reach out directly. We respond to every inquiry personally.
              </p>
            </div>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              {[
                { label: "Call Us", value: "(941) 253-3660", sub: "Mon – Fri, 8:30am – 6pm EST", href: "tel:9412533660" },
                { label: "Toll-Free", value: "(833) 486-6659", sub: "Mon – Fri, 8:30am – 6pm EST", href: "tel:8334866659" },
              ].map(item => (
                <a key={item.href} href={item.href}
                  style={{ flex: 1, minWidth: "160px", padding: "20px 24px", background: "#fff", border: `1px solid ${t.border}`, textDecoration: "none", display: "flex", flexDirection: "column", gap: "8px", transition: "border-color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = t.gold + "60"} onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: t.gold }}><path d="M3 2C3 2 1.5 2 1.5 3.5C1.5 5 2.25 9.25 6.25 13.25C10.25 17.25 14.5 17 16 17C17.5 17 17.5 15.5 17.5 15.5L15 11.5C15 11.5 14.25 10.75 13.5 11.5L11.5 13C11.5 13 9.5 12.5 7 10C4.5 7.5 5 5.5 5 5.5L7 3.5C7.75 2.75 7 2 7 2L3 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                  <div style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.textDim, fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: "15px", fontFamily: "var(--font-playfair)", fontWeight: 400, color: t.text }}>{item.value}</div>
                  <div style={{ fontSize: "10px", color: t.textDim, fontWeight: 300 }}>{item.sub}</div>
                </a>
              ))}
              <Link href="/support"
                style={{ flex: 1, minWidth: "160px", padding: "20px 24px", background: t.gold, border: `1px solid ${t.gold}`, textDecoration: "none", display: "flex", flexDirection: "column", gap: "8px", transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = t.goldLight} onMouseLeave={e => e.currentTarget.style.background = t.gold}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: "#fff" }}><rect x="1.5" y="3" width="15" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" /><path d="M1.5 5L9 10.5L16.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                <div style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#fff", fontWeight: 500, opacity: 0.75 }}>Email Support</div>
                <div style={{ fontSize: "15px", fontFamily: "var(--font-playfair)", fontWeight: 400, color: "#fff" }}>Send a Message</div>
                <div style={{ fontSize: "10px", color: "#fff", fontWeight: 300, opacity: 0.7 }}>Response within 1 business day</div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
