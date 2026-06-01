'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/context/ThemeContext'
import type { PayloadPost, PayloadImage } from '@/lib/payload'
import { imageUrl } from '@/lib/payload'

/* ── Mock fallback data ──────────────────────────────────────────────────── */
const MOCK_POSTS = [
  {
    id: "1", slug: "cabot-guns-machining-process", category: "Craft & Engineering",
    title: "The Geometry of Perfection: Inside Cabot Guns' Machining Process",
    excerpt: "How a former aerospace facility in rural Pennsylvania became the birthplace of the world's most precisely manufactured 1911, and why tolerances measured in ten-thousandths of an inch actually matter.",
    publishedAt: "2025-05-12T00:00:00.000Z", readTime: "9 min read",
    author: { name: "James Whitfield", role: "Contributing Editor", bio: null },
    featured: true, status: "published" as const, featuredImage: null,
    tags: [], content: null, seoTitle: null, seoDescription: null,
  },
  {
    id: "2", slug: "korth-vs-manurhin-revolver", category: "Collector's Guide",
    title: "Korth vs. Manurhin: A Study in European Revolver Obsession",
    excerpt: "Two countries. Two philosophies. Both defined by a refusal to compromise on the double-action revolver. We put them side by side.",
    publishedAt: "2025-04-28T00:00:00.000Z", readTime: "12 min read",
    author: { name: "Clara Hoffmann", role: "European Correspondent", bio: null },
    featured: false, status: "published" as const, featuredImage: null,
    tags: [], content: null, seoTitle: null, seoDescription: null,
  },
  {
    id: "3", slug: "nighthawk-one-gunsmith", category: "Brand Spotlight",
    title: "Nighthawk's One-Gun-One-Gunsmith Promise, Still Worth It in 2025?",
    excerpt: "We spend two days in Berryville, Arkansas with the team behind America's most respected custom 1911 shop.",
    publishedAt: "2025-04-09T00:00:00.000Z", readTime: "8 min read",
    author: { name: "James Whitfield", role: "Contributing Editor", bio: null },
    featured: false, status: "published" as const, featuredImage: null,
    tags: [], content: null, seoTitle: null, seoDescription: null,
  },
  {
    id: "4", slug: "1911-collecting-beginners-guide", category: "Collector's Guide",
    title: "Starting a 1911 Collection: What the Experts Wish They'd Known First",
    excerpt: "Before you spend $4,000 on your first custom pistol, read this. Eight seasoned collectors share the mistakes they made so you don't have to.",
    publishedAt: "2025-03-22T00:00:00.000Z", readTime: "15 min read",
    author: { name: "Thomas Aldridge", role: "Senior Writer", bio: null },
    featured: false, status: "published" as const, featuredImage: null,
    tags: [], content: null, seoTitle: null, seoDescription: null,
  },
  {
    id: "5", slug: "sig-sauer-p210-revival", category: "Reviews",
    title: "The SIG Sauer P210 Legend: Switzerland's Greatest Service Pistol, Reborn",
    excerpt: "The original P210 is widely considered the finest service pistol ever made. Does the modern Legend live up to a 70-year legacy? We fired 500 rounds to find out.",
    publishedAt: "2025-03-05T00:00:00.000Z", readTime: "11 min read",
    author: { name: "Clara Hoffmann", role: "European Correspondent", bio: null },
    featured: false, status: "published" as const, featuredImage: null,
    tags: [], content: null, seoTitle: null, seoDescription: null,
  },
  {
    id: "6", slug: "colt-python-history", category: "History",
    title: "The Colt Python: Fifty Years of the Revolver America Couldn't Stop Wanting",
    excerpt: "From its 1955 debut to discontinuation, return, and collector frenzy, how the Python became the most emotionally loaded revolver in American history.",
    publishedAt: "2025-02-18T00:00:00.000Z", readTime: "14 min read",
    author: { name: "Thomas Aldridge", role: "Senior Writer", bio: null },
    featured: false, status: "published" as const, featuredImage: null,
    tags: [], content: null, seoTitle: null, seoDescription: null,
  },
]


function formatDate(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

/* ── Placeholder image box ───────────────────────────────────────────────── */
function ImgBox({ style = {}, index = 0 }: { style?: React.CSSProperties; index?: number }) {
  const { t } = useTheme()
  const pairs = ["#e8e8eb,#d4d4d8", "#e5e5e8,#d0d0d5", "#eaeaec,#d8d8dc", "#e2e2e6,#cfcfd4", "#e8e8eb,#d4d4d8"]
  const [c1, c2] = pairs[index % 5].split(",")
  return (
    <div style={{ background: `linear-gradient(140deg,${c1} 0%,${c2} 55%,${c1} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", ...style }}>
      <svg width="28" height="28" viewBox="0 0 36 36" fill="none" opacity="0.14">
        <rect x="2" y="2" width="32" height="32" rx="1" stroke={t.gold} strokeWidth="0.8"/>
        <circle cx="12" cy="12" r="4" stroke={t.gold} strokeWidth="0.8"/>
        <path d="M2 26L11 17L17 23L25 13L34 23V34H2V26Z" stroke={t.gold} strokeWidth="0.8"/>
      </svg>
    </div>
  )
}

/* ── Article thumbnail ───────────────────────────────────────────────────── */
function ArticleThumbnail({ img, index, style = {}, hov = false }: { img: PayloadImage | null; index: number; style?: React.CSSProperties; hov?: boolean }) {
  const url = imageUrl(img)
  if (url) {
    return (
      <Image
        src={url}
        alt={img?.alt ?? ""}
        fill
        style={{ objectFit: "cover", transform: hov ? "scale(1.04)" : "scale(1)", transition: "transform 0.45s ease" }}
      />
    )
  }
  return <ImgBox index={index} style={{ ...style, transform: hov ? "scale(1.04)" : "scale(1)", transition: "transform 0.45s ease" }} />
}

/* ── Featured article card ───────────────────────────────────────────────── */
function FeaturedCard({ post, index }: { post: PayloadPost; index: number }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  return (
    <Link href={`/article/${post.slug}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          display: "grid", gridTemplateColumns: "1.1fr 1fr",
          border: `1px solid ${hov ? t.gold + "50" : t.border}`,
          background: hov ? t.bgCardHover : t.bgCard,
          transition: "all 0.3s ease", cursor: "pointer",
          boxShadow: hov ? "0 20px 60px rgba(0,0,0,0.1)" : "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ position: "relative", overflow: "hidden", minHeight: "380px" }}>
          <ArticleThumbnail img={post.featuredImage} index={index} style={{ width: "100%", height: "100%" }} hov={hov} />
          <div style={{ position: "absolute", top: "20px", left: "20px", background: "rgba(255,255,255,0.9)", border: `1px solid ${t.gold}50`, padding: "4px 12px", backdropFilter: "blur(8px)" }}>
            <span style={{ fontSize: "8.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 500, color: t.gold }}>{post.category}</span>
          </div>
        </div>
        <div style={{ padding: "44px 44px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ width: "18px", height: "1px", background: t.gold }}/>
              <span style={{ fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: t.gold, fontWeight: 500, fontFamily: "var(--font-inter)" }}>Editor's Pick</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(24px,2.4vw,34px)", fontWeight: 300, lineHeight: 1.2, color: hov ? t.gold : t.text, transition: "color 0.25s", marginBottom: "18px", letterSpacing: "0.01em" }}>
              {post.title}
            </h2>
            <p style={{ fontSize: "13.5px", fontWeight: 300, color: t.textMuted, lineHeight: 1.82, marginBottom: "28px", letterSpacing: "0.02em" }}>
              {post.excerpt}
            </p>
          </div>
          <div>
            <div style={{ height: "1px", background: `linear-gradient(to right, ${t.gold}40, transparent)`, marginBottom: "20px" }}/>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 400, color: t.text, fontFamily: "var(--font-inter)", marginBottom: "2px" }}>{post.author.name}</div>
                <div style={{ fontSize: "10px", fontWeight: 300, color: t.textDim, fontFamily: "var(--font-inter)", letterSpacing: "0.03em" }}>
                  {formatDate(post.publishedAt)}{post.readTime ? ` · ${post.readTime}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 500, color: t.gold, borderBottom: `1px solid ${t.gold}55`, paddingBottom: "1px" }}>
                Read Article
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 4H11M8 1L11 4L8 7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ── Grid article card ───────────────────────────────────────────────────── */
function ArticleCard({ post, index }: { post: PayloadPost; index: number }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  return (
    <Link href={`/article/${post.slug}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column" }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ cursor: "pointer", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ position: "relative", overflow: "hidden", border: `1px solid ${hov ? t.gold + "40" : t.border}`, marginBottom: "18px", transition: "border-color 0.25s", height: "210px" }}>
          <ArticleThumbnail img={post.featuredImage} index={index} hov={hov} />
          <div style={{ position: "absolute", top: "12px", left: "12px", background: "rgba(255,255,255,0.88)", border: `1px solid ${t.gold}45`, padding: "3px 9px", backdropFilter: "blur(6px)" }}>
            <span style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 500, color: t.gold }}>{post.category}</span>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "20px", fontWeight: 400, color: hov ? t.gold : t.text, lineHeight: 1.3, marginBottom: "10px", letterSpacing: "0.01em", transition: "color 0.22s", flex: 1 }}>
            {post.title}
          </h3>
          <p style={{ fontSize: "12.5px", fontWeight: 300, color: t.textMuted, lineHeight: 1.75, marginBottom: "16px", letterSpacing: "0.02em" }}>
            {post.excerpt}
          </p>
          <div style={{ height: "1px", background: t.border, marginBottom: "14px" }}/>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "10.5px", fontWeight: 400, color: t.textMuted, fontFamily: "var(--font-inter)", marginBottom: "1px" }}>{post.author.name}</div>
              <div style={{ fontSize: "9.5px", fontWeight: 300, color: t.textDim, fontFamily: "var(--font-inter)", letterSpacing: "0.03em" }}>
                {formatDate(post.publishedAt)}{post.readTime ? ` · ${post.readTime}` : ""}
              </div>
            </div>
            <div style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 500, color: t.gold, borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px", opacity: hov ? 1 : 0.65, transition: "opacity 0.2s" }}>
              Read More
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ── Main export ─────────────────────────────────────────────────────────── */
export default function ArticlesPage({ posts }: { posts: PayloadPost[] | null }) {
  const { t } = useTheme()
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const PER_PAGE = 12

  const allPosts: PayloadPost[] = posts ?? (MOCK_POSTS as unknown as PayloadPost[])

  const categories = ["All", ...Array.from(new Set(allPosts.map((p) => p.category).filter(Boolean))).sort()]

  const featured = allPosts.find((p) => p.featured) ?? allPosts[0]
  const rest     = allPosts.filter((p) => p.id !== featured?.id)

  const q = searchQuery.trim().toLowerCase()
  // Normalize: strip hyphens/dots/slashes so "ar-15" and "ar15" both match
  const qNorm = q.replace(/[-./\s]+/g, "")
  const norm = (s: string) => s.toLowerCase().replace(/[-./\s]+/g, "")

  const filtered = rest.filter((p) => {
    if (activeCategory !== "All" && p.category !== activeCategory) return false
    if (!q) return true
    const matchRaw = p.title?.toLowerCase().includes(q) || p.excerpt?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
    const matchNorm = qNorm.length >= 2 && (norm(p.title ?? "").includes(qNorm) || norm(p.excerpt ?? "").includes(qNorm))
    return matchRaw || matchNorm
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "var(--font-inter)" }}>

      {/* ── Page banner ── */}
      <div style={{ paddingTop: "68px" }}>
        <div style={{ background: `linear-gradient(to bottom,${t.bgSurface},${t.bg})`, borderBottom: `1px solid ${t.border}`, padding: "48px 40px 0" }}>
          <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              {["Home", "Articles"].map((crumb, i, arr) => (
                <div key={crumb} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {i > 0 && <span style={{ fontSize: "9px", color: t.textDim }}>›</span>}
                  {i < arr.length - 1 ? (
                    <Link href="/" style={{ fontSize: "10px", color: t.textDim, fontWeight: 300, textDecoration: "none" }}>{crumb}</Link>
                  ) : (
                    <span style={{ fontSize: "10px", color: t.textMuted, fontWeight: 300 }}>{crumb}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Title + description */}
            <div style={{ maxWidth: "680px", marginBottom: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "18px", height: "1px", background: t.gold }}/>
                <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>Editorial</span>
              </div>
              <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(36px,4vw,60px)", fontWeight: 300, color: t.text, lineHeight: 1.05, letterSpacing: "0.01em", marginBottom: "16px" }}>
                From The Blog
              </h1>
              <p style={{ fontSize: "14px", fontWeight: 300, color: t.textMuted, lineHeight: 1.8, letterSpacing: "0.02em" }}>
                Long-form writing on the craft, history, and culture of fine firearms, for the collector who wants to understand what they own.
              </p>
            </div>

            {/* Search input */}
            <div style={{ display: "flex", gap: "0", marginBottom: "24px", maxWidth: "480px" }}>
              <input
                type="search"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
                placeholder="Search articles…"
                style={{ flex: 1, padding: "10px 14px", border: `1px solid ${t.border}`, background: "#fff", color: t.text, fontFamily: "var(--font-inter)", fontSize: "13px", outline: "none", letterSpacing: "0.02em" }}
                onFocus={e => e.currentTarget.style.borderColor = t.gold + "80"}
                onBlur={e => e.currentTarget.style.borderColor = t.border}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setPage(1) }}
                  style={{ padding: "10px 14px", background: "none", border: `1px solid ${t.border}`, borderLeft: "none", color: t.textMuted, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", lineHeight: 1 }}>
                  ×
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="lxs-cat-tabs" style={{ display: "flex", gap: "0", borderBottom: `1px solid ${t.border}`, overflowX: "auto", scrollbarWidth: "none" }}>
              {categories.map((cat) => (
                <button key={cat}
                  onClick={() => { setActiveCategory(cat); setPage(1) }}
                  style={{
                    padding: "0 20px 16px", background: "none", border: "none",
                    borderBottom: `2px solid ${activeCategory === cat ? t.gold : "transparent"}`,
                    marginBottom: "-1px", cursor: "pointer",
                    fontFamily: "var(--font-inter)", fontWeight: 500,
                    fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase",
                    color: activeCategory === cat ? t.gold : t.textMuted,
                    transition: "all 0.2s", whiteSpace: "nowrap",
                  }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Featured article ── */}
      {activeCategory === "All" && featured && (
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "52px 40px 0" }}>
          <FeaturedCard post={featured} index={0} />
        </div>
      )}

      {/* ── Article grid ── */}
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "52px 40px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "18px", height: "1px", background: t.gold }}/>
            <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>
              {activeCategory === "All" ? "All Articles" : activeCategory}
            </span>
          </div>
          <span style={{ fontSize: "11px", color: t.textDim, fontWeight: 300 }}>
            <span style={{ color: t.text, fontWeight: 400 }}>{filtered.length}</span> articles
          </span>
        </div>
        <div style={{ height: "1px", background: `linear-gradient(to right,${t.gold}30,transparent)`, marginBottom: "44px" }}/>

        {paginated.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "44px 32px" }}>
            {paginated.map((post, i) => (
              <ArticleCard key={post.id} post={post} index={i + 1} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: "28px", fontWeight: 300, color: t.textMuted }}>
              {q ? `No articles found for "${searchQuery}"` : "No articles in this category yet"}
            </div>
            {q && (
              <button onClick={() => setSearchQuery("")} style={{ marginTop: "16px", background: "none", border: `1px solid ${t.border}`, padding: "8px 20px", cursor: "pointer", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.textMuted, fontFamily: "var(--font-inter)" }}>
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "64px", paddingTop: "40px", borderTop: `1px solid ${t.border}` }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${page === 1 ? t.border + "50" : t.border}`, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.35 : 1, color: t.textMuted, transition: "all 0.2s" }}>
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)}
                style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: n === page ? t.gold : "transparent", border: `1px solid ${n === page ? t.gold : t.border}`, color: n === page ? "#fff" : t.textMuted, fontSize: "11px", fontFamily: "var(--font-inter)", fontWeight: n === page ? 500 : 300, cursor: "pointer", transition: "all 0.2s" }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${page === totalPages ? t.border + "50" : t.border}`, cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.35 : 1, color: t.textMuted, transition: "all 0.2s" }}>
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        )}
      </div>

      {/* ── Newsletter ── */}
      <section style={{ margin: "80px 0 0", padding: "72px 40px", background: t.bgSurface, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ maxWidth: "520px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "14px" }}>Stay Informed</div>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: "32px", fontWeight: 300, color: t.text, lineHeight: 1.15, marginBottom: "12px" }}>The Collector's Circle</div>
          <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted, lineHeight: 1.8, marginBottom: "28px" }}>
            New articles, acquisitions, and exclusive access, delivered to the discerning few.
          </p>
          <div style={{ display: "flex", maxWidth: "400px", margin: "0 auto" }}>
            <input type="email" placeholder="Your email address"
              style={{ flex: 1, padding: "12px 16px", background: t.bg, border: `1px solid ${t.border}`, borderRight: "none", color: t.text, fontSize: "12px", outline: "none", fontFamily: "var(--font-inter)" }}/>
            <button
              style={{ padding: "12px 20px", background: t.gold, color: "#fff", border: "none", fontSize: "8.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
