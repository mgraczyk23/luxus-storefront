'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'

type Slide = {
  kicker: string
  caption: string
  imageUrl?: string
}

const DEFAULT_SLIDES: Slide[] = [
  { kicker: "The Vault",           caption: "1911 Collection · Top-down array" },
  { kicker: "Heritage",            caption: "Engraved Revolvers · Detail close-up" },
  { kicker: "Master Craft",        caption: "Cabot Guns Damascus · Studio lighting" },
  { kicker: "European Precision",  caption: "Korth Lineup · Black backdrop" },
  { kicker: "American Custom",     caption: "Nighthawk Custom · Workshop bench" },
]

const SLIDE_TONES: [string, string][] = [
  ["#dcd9d4", "#b4b1aa"],
  ["#cfccc6", "#a8a59f"],
  ["#d6d0c4", "#b0a995"],
  ["#cdcdd0", "#a9a9af"],
  ["#d4cdc2", "#a8a094"],
]

const PLAYFAIR = "var(--font-playfair), serif"

type Props = {
  slides?: Slide[]
  wordmark?: string
  tagline?: string
  featuredImageUrl?: string | null
  featuredCaption?: string
  autoAdvanceMs?: number
}

export default function HeroSection({
  slides = DEFAULT_SLIDES,
  wordmark = "Luxus Collection",
  tagline = "The Forefront of Exclusive Firearms",
  featuredImageUrl = null,
  featuredCaption = "Featured Piece",
  autoAdvanceMs = 6000,
}: Props) {
  const { t } = useTheme()
  const [heroSlide, setHeroSlide] = useState(0)

  useEffect(() => {
    if (!autoAdvanceMs) return
    const id = setInterval(() => setHeroSlide((s) => (s + 1) % slides.length), autoAdvanceMs)
    return () => clearInterval(id)
  }, [slides.length, autoAdvanceMs])

  return (
    <section style={{ position: "relative", background: t.bg, color: t.text, fontFamily: "'Inter',sans-serif" }}>

      {/* ── Carousel ──────────────────────────────────────────────────── */}
      <div style={{
        position: "relative", width: "100%",
        height: "clamp(420px, 62vh, 720px)",
        overflow: "hidden",
        background: "#e8e8eb",
      }}>
        {slides.map((slide, i) => {
          const active = i === heroSlide
          const [a, b] = SLIDE_TONES[i % SLIDE_TONES.length]
          return (
            <div
              key={i}
              style={{
                position: "absolute", inset: 0,
                opacity: active ? 1 : 0,
                transition: "opacity 1.1s ease",
                background: slide.imageUrl
                  ? `url(${slide.imageUrl}) center/cover no-repeat`
                  : `linear-gradient(135deg, ${a} 0%, ${b} 100%)`,
              }}
            >
              {!slide.imageUrl && (
                <>
                  <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage:
                      `linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),` +
                      `linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)`,
                    backgroundSize: "48px 48px",
                    maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 90%)",
                    WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, transparent 90%)",
                  }} />
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: "14px", color: t.gold, opacity: 0.6,
                  }}>
                    <svg width="54" height="54" viewBox="0 0 36 36" fill="none" opacity="0.55">
                      <rect x="2" y="2" width="32" height="32" rx="1" stroke="currentColor" strokeWidth="0.8" />
                      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="0.8" />
                      <path d="M2 25L10 17L16 22L24 12L34 22V34H2V25Z" stroke="currentColor" strokeWidth="0.8" />
                    </svg>
                    <div style={{ fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", fontWeight: 500 }}>
                      {slide.kicker} · {slide.caption}
                    </div>
                  </div>
                </>
              )}
              {/* Vignette */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, rgba(255,255,255,0.0) 0%, transparent 70%, rgba(255,255,255,0.5) 100%)",
              }} />
            </div>
          )
        })}

        {/* Dots */}
        <div style={{
          position: "absolute", bottom: "22px", left: 0, right: 0,
          display: "flex", justifyContent: "center", gap: "10px", zIndex: 3,
        }}>
          {slides.map((_, i) => {
            const active = i === heroSlide
            return (
              <button
                key={i}
                onClick={() => setHeroSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: active ? "26px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  background: active ? t.gold : "rgba(0,0,0,0.3)",
                  transition: "all 0.35s ease",
                  padding: 0,
                }}
              />
            )
          })}
        </div>

        {/* Prev / Next arrows */}
        {([
          { side: "left"  as const, dx: -1, path: "M11 2L3 8L11 14" },
          { side: "right" as const, dx:  1, path: "M3 2L11 8L3 14"  },
        ] as const).map((arr) => (
          <button
            key={arr.side}
            onClick={() => setHeroSlide((s) => (s + arr.dx + slides.length) % slides.length)}
            aria-label={arr.side === "left" ? "Previous slide" : "Next slide"}
            style={{
              position: "absolute", top: "50%", transform: "translateY(-50%)",
              [arr.side]: "22px",
              width: "44px", height: "44px",
              background: "rgba(255,255,255,0.55)",
              border: `1px solid rgba(0,0,0,0.1)`,
              color: t.text,
              cursor: "pointer", zIndex: 3,
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = t.gold + "80"
              e.currentTarget.style.color = t.gold
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)"
              e.currentTarget.style.color = t.text
            }}
          >
            <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
              <path d={arr.path} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>

      {/* ── Brand intro ───────────────────────────────────────────────── */}
      <div className="lxs-hero-brand-intro" style={{ position: "relative", background: t.bg }}>
        <div style={{ maxWidth: "1320px", margin: "0 auto" }}>

          {/* Wordmark + rules */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "28px", marginBottom: "22px" }}>
            <div style={{ flex: 1, maxWidth: "320px", height: "1px", background: t.text, opacity: 0.85 }} />
            <h2 style={{
              fontFamily: PLAYFAIR,
              fontSize: "clamp(28px, 3.4vw, 44px)",
              fontWeight: 400,
              letterSpacing: "0.08em",
              color: t.text,
              textTransform: "uppercase",
              margin: 0,
              whiteSpace: "nowrap",
            }}>
              {wordmark}
            </h2>
            <div style={{ flex: 1, maxWidth: "320px", height: "1px", background: t.text, opacity: 0.85 }} />
          </div>

          {/* Tagline */}
          <div className="lxs-hero-tagline" style={{ textAlign: "center" }}>
            <div style={{
              fontSize: "clamp(15px, 1.5vw, 22px)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 400,
              color: t.gold,
            }}>
              {tagline}
            </div>
          </div>

          {/* Two-column: body copy + featured cutout */}
          <div className="lxs-hero-intro-grid">
            <div style={{ fontSize: "14.5px", lineHeight: 1.85, fontWeight: 300, color: t.textMuted, letterSpacing: "0.015em" }}>
              <p style={{ marginBottom: "20px" }}>
                <strong style={{ fontWeight: 400 }}>Luxus Collection</strong> is a privately curated portfolio of historically significant and master-grade firearms, assembled and managed as an active, evolving portfolio.
              </p>
              <p style={{ marginBottom: "20px" }}>
                We are collectors first. The collection grows through disciplined acquisition, selective trading, and private-treaty transfers. Pieces rotate in and out of the vault as the collection evolves — some retained long term, others released to qualified collectors when appropriate.
              </p>
              <p style={{ marginBottom: 0 }}>
                Items displayed are presented for reference, research, and private inquiry. Availability, when extended, is discreet and subject to qualification, compliance, and curator discretion.
              </p>
            </div>

            {/* Featured cutout */}
            <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "340px" }}>
              <div style={{
                position: "absolute", inset: 0,
                background: `radial-gradient(ellipse at center, ${t.gold}18 0%, transparent 60%)`,
                pointerEvents: "none",
              }} />
              <div style={{
                position: "relative",
                width: "min(100%, 460px)",
                aspectRatio: "5/3",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg, rgba(126,94,16,0.06), rgba(0,0,0,0))",
              }}>
                {featuredImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featuredImageUrl}
                    alt={featuredCaption}
                    style={{
                      width: "100%", height: "100%", objectFit: "contain",
                      filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.18))",
                    }}
                  />
                ) : (
                  <svg viewBox="0 0 320 180" width="100%" height="100%" style={{ filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.18))" }}>
                    <defs>
                      <linearGradient id="luxBarrel" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%"   stopColor={t.gold} stopOpacity="0.65" />
                        <stop offset="50%"  stopColor={t.gold} stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#7e5e10" stopOpacity="0.9" />
                      </linearGradient>
                      <linearGradient id="luxGrip" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%"   stopColor="#5a4220" />
                        <stop offset="100%" stopColor="#2e2110" />
                      </linearGradient>
                    </defs>
                    <rect x="30" y="58" width="240" height="34" rx="3" fill="url(#luxBarrel)" />
                    <rect x="30" y="56" width="240" height="3" fill={t.gold} opacity="0.7" />
                    <path d="M82 92 L240 92 L235 122 L200 122 L196 138 L170 138 L166 122 L150 122 L150 116 L130 116 L130 122 L98 122 Z" fill="#3a3a3a" />
                    <ellipse cx="158" cy="120" rx="14" ry="9" fill={t.bg} />
                    <path d="M82 92 L138 92 L150 168 L96 168 Z" fill="url(#luxGrip)" />
                    <g opacity="0.35" stroke={t.gold} strokeWidth="0.4">
                      {[0,1,2,3,4,5].map(i => <line key={i} x1={102 + i*7} y1="105" x2={92 + i*7} y2="160" />)}
                    </g>
                    <rect x="248" y="50" width="14" height="8" fill={t.gold} opacity="0.85" />
                    <rect x="44" y="50" width="6" height="8" fill={t.gold} opacity="0.85" />
                  </svg>
                )}

                {!featuredImageUrl && (
                  <div style={{
                    position: "absolute", bottom: "-26px", left: 0, right: 0, textAlign: "center",
                    fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase",
                    color: t.textDim, fontWeight: 500,
                  }}>
                    {featuredCaption} · Cutout Image
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
