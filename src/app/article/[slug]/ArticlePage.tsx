'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/context/ThemeContext'
import type { PayloadPost } from '@/lib/payload'
import { parseLexical, imageUrl } from '@/lib/payload'
import type { LexNode, LexInline } from '@/lib/payload'

/* ── Reading progress bar ────────────────────────────────────────────────── */
function ProgressBar() {
  const { t } = useTheme()
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const fn = () => {
      const el = document.documentElement
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100
      setProgress(Math.min(100, Math.max(0, pct)))
    }
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])
  return (
    <div style={{ position: "fixed", top: "68px", left: 0, right: 0, height: "2px", background: t.border, zIndex: 190 }}>
      <div style={{ height: "100%", width: `${progress}%`, background: t.gold, transition: "width 0.1s linear" }}/>
    </div>
  )
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

/* ── Inline node renderer ────────────────────────────────────────────────── */
function InlineNode({ node }: { node: LexInline }) {
  const { t } = useTheme()
  if (node.type === "linebreak") return <br />
  if (node.type === "link") {
    return (
      <a href={node.url} target="_blank" rel="noopener noreferrer" style={{ color: t.gold, textDecoration: "underline" }}>
        {node.children.map((c, i) => <InlineNode key={i} node={c} />)}
      </a>
    )
  }
  let text: React.ReactNode = node.text
  if (node.bold)      text = <strong style={{ fontWeight: 600 }}>{text}</strong>
  if (node.italic)    text = <em>{text}</em>
  if (node.underline) text = <u>{text}</u>
  if (node.code)      text = <code style={{ fontFamily: "monospace", fontSize: "0.9em", background: "#f0f0f2", padding: "1px 5px", borderRadius: "3px" }}>{text}</code>
  return <>{text}</>
}

/* ── Lexical body renderer ───────────────────────────────────────────────── */
function LexicalBlock({ node }: { node: LexNode }) {
  const { t } = useTheme()

  if (node.type === "paragraph") {
    const isEmpty = node.children.length === 0 || (node.children.length === 1 && node.children[0].type === "text" && node.children[0].text === "")
    if (isEmpty) return <div style={{ height: "14px" }} />
    return (
      <p style={{ fontSize: "17px", fontWeight: 300, lineHeight: 1.9, color: t.text, marginBottom: "28px", letterSpacing: "0.015em", fontFamily: "var(--font-inter)" }}>
        {node.children.map((c, i) => <InlineNode key={i} node={c} />)}
      </p>
    )
  }

  if (node.type === "heading") {
    const Tag = node.tag
    const style: React.CSSProperties = node.tag === "h2"
      ? { fontFamily: "var(--font-playfair)", fontSize: "28px", fontWeight: 400, color: t.text, lineHeight: 1.25, marginBottom: "20px", marginTop: "52px", letterSpacing: "0.01em" }
      : { fontFamily: "var(--font-playfair)", fontSize: "22px", fontWeight: 400, color: t.text, lineHeight: 1.3, marginBottom: "16px", marginTop: "36px", letterSpacing: "0.01em" }
    return (
      <Tag id={node.id} style={style}>
        {node.children.map((c, i) => <InlineNode key={i} node={c} />)}
      </Tag>
    )
  }

  if (node.type === "quote") {
    return (
      <div style={{ margin: "48px 0", padding: "32px 36px", borderLeft: `3px solid ${t.gold}`, background: t.bgSurface, position: "relative" }}>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: "80px", lineHeight: 0.7, color: t.gold, opacity: 0.25, position: "absolute", top: "24px", left: "28px", fontWeight: 300, userSelect: "none" }}>"</div>
        <blockquote style={{ fontFamily: "var(--font-playfair)", fontSize: "22px", fontWeight: 300, fontStyle: "italic", color: t.text, lineHeight: 1.55, letterSpacing: "0.01em", position: "relative", zIndex: 1, margin: 0, paddingLeft: "16px" }}>
          {node.children.map((c, i) => <InlineNode key={i} node={c} />)}
        </blockquote>
      </div>
    )
  }

  if (node.type === "list") {
    const Tag = node.listType === "number" ? "ol" : "ul"
    return (
      <Tag style={{ paddingLeft: "28px", marginBottom: "28px" }}>
        {node.items.map((item, i) => (
          <li key={i} style={{ fontSize: "17px", fontWeight: 300, lineHeight: 1.9, color: t.text, marginBottom: "8px", letterSpacing: "0.015em", fontFamily: "var(--font-inter)" }}>
            {item.map((c, j) => <InlineNode key={j} node={c} />)}
          </li>
        ))}
      </Tag>
    )
  }

  if (node.type === "hr") {
    return <hr style={{ border: "none", borderTop: `1px solid ${t.border}`, margin: "44px 0" }} />
  }

  if (node.type === "upload") {
    return (
      <figure style={{ margin: "44px 0" }}>
        <div style={{ border: `1px solid ${t.border}`, overflow: "hidden", position: "relative" }}>
          <Image src={node.url} alt={node.alt} width={800} height={450} style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
        {node.caption && (
          <figcaption style={{ marginTop: "12px", fontSize: "11.5px", fontStyle: "italic", color: t.textDim, fontFamily: "var(--font-inter)", fontWeight: 300, lineHeight: 1.6, letterSpacing: "0.02em" }}>
            {node.caption}
          </figcaption>
        )}
      </figure>
    )
  }

  return null
}

/* ── Related card ────────────────────────────────────────────────────────── */
function RelatedCard({ post, compact = false }: { post: PayloadPost; compact?: boolean }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  const thumbUrl = imageUrl(post.featuredImage)

  if (compact) {
    return (
      <Link href={`/article/${post.slug}`} style={{ textDecoration: "none" }}>
        <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{ display: "flex", gap: "14px", alignItems: "flex-start", cursor: "pointer", padding: "14px 0", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ width: "64px", height: "64px", flexShrink: 0, border: `1px solid ${t.border}`, overflow: "hidden", position: "relative" }}>
            {thumbUrl ? (
              <Image src={thumbUrl} alt={post.featuredImage?.alt ?? ""} fill style={{ objectFit: "cover" }} />
            ) : (
              <ImgBox style={{ width: "100%", height: "100%" }} index={parseInt(post.id, 10) % 5} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "7.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "4px", fontFamily: "var(--font-inter)" }}>{post.category}</div>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: "14px", fontWeight: 400, color: hov ? t.gold : t.text, lineHeight: 1.3, transition: "color 0.2s", marginBottom: "4px" }}>{post.title}</div>
            <div style={{ fontSize: "9.5px", color: t.textDim, fontWeight: 300, fontFamily: "var(--font-inter)" }}>{post.readTime}</div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/article/${post.slug}`} style={{ textDecoration: "none" }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ cursor: "pointer" }}>
        <div style={{ border: `1px solid ${hov ? t.gold + "40" : t.border}`, overflow: "hidden", marginBottom: "14px", transition: "border-color 0.25s", height: "160px", position: "relative" }}>
          {thumbUrl ? (
            <Image src={thumbUrl} alt={post.featuredImage?.alt ?? ""} fill style={{ objectFit: "cover", transform: hov ? "scale(1.04)" : "scale(1)", transition: "transform 0.4s ease" }} />
          ) : (
            <ImgBox style={{ width: "100%", height: "100%", transform: hov ? "scale(1.04)" : "scale(1)", transition: "transform 0.4s ease" }} index={parseInt(post.id, 10) % 5} />
          )}
        </div>
        <div style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "6px", fontFamily: "var(--font-inter)" }}>{post.category}</div>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: "17px", fontWeight: 400, color: hov ? t.gold : t.text, lineHeight: 1.3, transition: "color 0.22s", marginBottom: "8px" }}>{post.title}</div>
        <div style={{ fontSize: "10px", color: t.textDim, fontFamily: "var(--font-inter)", fontWeight: 300 }}>{post.readTime}</div>
      </div>
    </Link>
  )
}

/* ── Main export ─────────────────────────────────────────────────────────── */
export default function ArticlePage({ post }: { post: PayloadPost }) {
  const { t } = useTheme()
  const [activeToc, setActiveToc] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showFixedToc, setShowFixedToc] = useState(false)
  const [pastHero, setPastHero] = useState(false)

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768)
      setShowFixedToc(window.innerWidth >= 1280)
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById("article-hero")
      if (!hero) return
      setPastHero(hero.getBoundingClientRect().bottom < 80)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const body = parseLexical(post.content)

  const toc = body
    .filter((n): n is Extract<LexNode, { type: "heading" }> => n.type === "heading" && n.tag === "h2")
    .map((n) => ({ id: n.id ?? "", label: n.children.map((c) => (c.type === "text" ? c.text : "")).join("") }))
    .filter((item) => item.id)

  useEffect(() => {
    if (toc.length === 0) return
    const fn = () => {
      const headings = toc.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[]
      for (let i = headings.length - 1; i >= 0; i--) {
        if (headings[i].getBoundingClientRect().top <= 120) {
          setActiveToc(toc[i].id)
          return
        }
      }
      setActiveToc(null)
    }
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [toc])

  const heroUrl = imageUrl(post.featuredImage)
  const initials = post.author.name.split(" ").map((n) => n[0]).join("")

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "var(--font-inter)" }}>
      <ProgressBar />

      {/* ── Hero image — full bleed from top, header floats above ── */}
      <div id="article-hero" style={{ position: "relative", height: "55vh", minHeight: "380px", maxHeight: "600px", overflow: "hidden" }}>
          {heroUrl ? (
            <Image src={heroUrl} alt={post.featuredImage?.alt ?? post.title} fill style={{ objectFit: "cover" }} priority />
          ) : (
            <ImgBox style={{ width: "100%", height: "100%" }} index={0} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0.75) 100%)" }}/>
          <div style={{ position: "absolute", top: "84px", left: isMobile ? "16px" : "40px" }}>
            <div style={{ background: "rgba(255,255,255,0.9)", border: `1px solid ${t.gold}50`, padding: "5px 14px", backdropFilter: "blur(8px)", display: "inline-block" }}>
              <span style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, fontFamily: "var(--font-inter)" }}>{post.category}</span>
            </div>
          </div>
      </div>

      {/* ── Article header ── */}
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: isMobile ? "0 16px" : "0 40px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: isMobile ? "32px 0 0" : "52px 0 0" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "28px" }}>
            {[{ label: "Home", href: "/" }, { label: "Articles", href: "/articles" }, { label: post.category, href: null }].map((crumb, i) => (
              <div key={crumb.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {i > 0 && <span style={{ fontSize: "9px", color: t.textDim }}>›</span>}
                {crumb.href ? (
                  <Link href={crumb.href} style={{ fontSize: "10px", color: t.textDim, fontWeight: 300, textDecoration: "none" }}>{crumb.label}</Link>
                ) : (
                  <span style={{ fontSize: "10px", color: t.textMuted, fontWeight: 300 }}>{crumb.label}</span>
                )}
              </div>
            ))}
          </div>

          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(32px,4vw,54px)", fontWeight: 300, color: t.text, lineHeight: 1.1, letterSpacing: "0.01em", marginBottom: "20px" }}>
            {post.title}
          </h1>

          <p style={{ fontFamily: "var(--font-playfair)", fontSize: "20px", fontWeight: 300, fontStyle: "italic", color: t.textMuted, lineHeight: 1.65, marginBottom: "32px", letterSpacing: "0.01em" }}>
            {post.excerpt}
          </p>

          {/* Meta bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "24px", borderBottom: `1px solid ${t.border}`, flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: t.bgSurface, border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "var(--font-playfair)", fontSize: "16px", fontWeight: 400, color: t.gold }}>{initials}</span>
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 500, color: t.text, fontFamily: "var(--font-inter)", marginBottom: "2px" }}>{post.author.name}</div>
                {post.author.role && <div style={{ fontSize: "10px", fontWeight: 300, color: t.textDim, fontFamily: "var(--font-inter)", letterSpacing: "0.03em" }}>{post.author.role}</div>}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", fontWeight: 300, color: t.textMuted, fontFamily: "var(--font-inter)" }}>{formatDate(post.publishedAt)}</div>
              {post.readTime && <div style={{ fontSize: "10px", fontWeight: 300, color: t.textDim, fontFamily: "var(--font-inter)", letterSpacing: "0.04em" }}>{post.readTime}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Fixed floating ToC — only on wide screens, only after hero scrolled past ── */}
      {showFixedToc && toc.length > 0 && pastHero && (
        <div style={{ position: "fixed", top: "120px", right: "32px", width: "220px", zIndex: 80 }}>
          <div style={{ fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: t.gold, fontWeight: 500, fontFamily: "var(--font-inter)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "14px", height: "1px", background: t.gold }}/>
            In This Article
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {toc.map((item) => (
              <button key={item.id}
                onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "7px 12px", fontFamily: "var(--font-inter)", fontSize: "11px", fontWeight: 300, color: activeToc === item.id ? t.gold : t.textMuted, letterSpacing: "0.02em", lineHeight: 1.5, borderLeft: `2px solid ${activeToc === item.id ? t.gold : t.border}`, transition: "all 0.2s" }}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Body — full reading width, no sidebar column ── */}
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: isMobile ? "0 16px" : "0 40px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", paddingTop: isMobile ? "32px" : "48px" }}>

          <article>
            {body.map((node, i) => (
              <LexicalBlock key={i} node={node} />
            ))}

            {/* Tags */}
            {post.tags.length > 0 && (
              <div style={{ marginTop: "52px", paddingTop: "32px", borderTop: `1px solid ${t.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, fontFamily: "var(--font-inter)" }}>Topics</span>
                  {post.tags.map((tag) => (
                    <span key={tag.id}
                      style={{ padding: "4px 12px", border: `1px solid ${t.border}`, fontSize: "9.5px", letterSpacing: "0.1em", color: t.textMuted, fontFamily: "var(--font-inter)", fontWeight: 300, cursor: "default" }}>
                      {tag.tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Author bio */}
            {post.author.bio && (
              <div style={{ marginTop: "40px", padding: "28px 32px", background: t.bgSurface, border: `1px solid ${t.border}`, borderLeft: `3px solid ${t.gold}40`, display: "flex", gap: "20px", alignItems: "flex-start" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: t.bgCard, border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-playfair)", fontSize: "20px", fontWeight: 400, color: t.gold }}>{initials}</span>
                </div>
                <div>
                  <div style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.gold, fontWeight: 500, marginBottom: "5px", fontFamily: "var(--font-inter)" }}>About the Author</div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: t.text, fontFamily: "var(--font-inter)", marginBottom: "6px" }}>{post.author.name}</div>
                  <p style={{ fontSize: "12.5px", fontWeight: 300, color: t.textMuted, lineHeight: 1.75, letterSpacing: "0.01em", fontFamily: "var(--font-inter)" }}>{post.author.bio}</p>
                </div>
              </div>
            )}

            {/* Back to articles */}
            <div style={{ marginTop: "48px", paddingTop: "32px", borderTop: `1px solid ${t.border}` }}>
              <Link href="/articles" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 500, color: t.gold, textDecoration: "none", borderBottom: `1px solid ${t.gold}55`, paddingBottom: "1px" }}>
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M11 4H1M4 1L1 4L4 7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                All Articles
              </Link>
            </div>
          </article>
        </div>
      </div>

      {/* ── Back to articles footer ── */}
      <section style={{ maxWidth: "1440px", margin: isMobile ? "48px auto 0" : "80px auto 0", padding: isMobile ? "0 16px 64px" : "0 40px 96px" }}>
        <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: "52px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "40px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                <div style={{ width: "18px", height: "1px", background: t.gold }}/>
                <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>Continue Reading</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(24px,2.5vw,34px)", fontWeight: 300, color: t.text, lineHeight: 1.1 }}>
                From The Blog
              </h2>
            </div>
            <Link href="/articles" style={{ fontSize: "9px", letterSpacing: "0.13em", textTransform: "uppercase", color: t.gold, borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px", fontWeight: 500, flexShrink: 0, textDecoration: "none" }}>
              All Articles
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
