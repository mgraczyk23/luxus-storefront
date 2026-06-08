'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import type { HeroSlidesData } from '@/lib/payload'

const DEFAULT_SLIDES = [
  { kicker: "The Vault",           caption: "1911 Collection · Top-down array",          imageUrl: undefined },
  { kicker: "Heritage",            caption: "Engraved Revolvers · Detail close-up",       imageUrl: undefined },
  { kicker: "Master Craft",        caption: "Cabot Guns Damascus · Studio lighting",       imageUrl: undefined },
  { kicker: "European Precision",  caption: "Korth Lineup · Black backdrop",               imageUrl: undefined },
  { kicker: "American Custom",     caption: "Nighthawk Custom · Workshop bench",           imageUrl: undefined },
]

const DEFAULT_INTRO = [
  "Luxus Collection is a privately curated portfolio of historically significant and master-grade firearms, assembled and managed as an active, evolving portfolio.",
  "We are collectors first. The collection grows through disciplined acquisition, selective trading, and private-treaty transfers. Pieces rotate in and out of the vault as the collection evolves — some retained long term, others released to qualified collectors when appropriate.",
  "Items displayed are presented for reference, research, and private inquiry. Availability, when extended, is discreet and subject to qualification, compliance, and curator discretion.",
]

const PLAYFAIR = "var(--font-playfair), serif"

type Props = {
  heroData?: HeroSlidesData
  autoAdvanceMs?: number
  featuredAdvanceMs?: number
}

export default function HeroSection({
  heroData,
  autoAdvanceMs = 6000,
  featuredAdvanceMs = 5000,
}: Props) {
  const { t } = useTheme()
  const [heroSlide, setHeroSlide]       = useState(0)
  const [featuredSlide, setFeaturedSlide] = useState(0)

  const slides         = heroData?.slides?.length        ? heroData.slides        : DEFAULT_SLIDES
  const wordmark       = heroData?.wordmark              || 'Luxus Collection'
  const tagline        = heroData?.tagline               || 'The Forefront of Exclusive Firearms'
  const featuredImages = heroData?.featuredImages        ?? []
  const introParagraphs = heroData?.introBody
    ? heroData.introBody.split(/\n\n+/).map(s => s.trim()).filter(Boolean)
    : DEFAULT_INTRO

  useEffect(() => {
    if (!autoAdvanceMs || slides.length <= 1) return
    const id = setInterval(() => setHeroSlide(s => (s + 1) % slides.length), autoAdvanceMs)
    return () => clearInterval(id)
  }, [slides.length, autoAdvanceMs])

  useEffect(() => {
    if (!featuredAdvanceMs || featuredImages.length <= 1) return
    const id = setInterval(() => setFeaturedSlide(s => (s + 1) % featuredImages.length), featuredAdvanceMs)
    return () => clearInterval(id)
  }, [featuredImages.length, featuredAdvanceMs])

  return (
    <section style={{ position: "relative", background: t.bg, color: t.text, fontFamily: "'Inter',sans-serif" }}>

      {/* ── Main Carousel ─────────────────────────────────────────────── */}
      <div style={{
        position: "relative", width: "100%",
        height: "clamp(260px, 40vh, 480px)",
        overflow: "hidden",
        background: "#1a1a1e",
      }}>
        {slides.map((slide, i) => {
          const active = i === heroSlide
          return (
            <div
              key={i}
              style={{
                position: "absolute", inset: 0,
                opacity: active ? 1 : 0,
                transition: "opacity 1.1s ease",
                background: slide.imageUrl
                  ? `url("${slide.imageUrl}") center/contain no-repeat`
                  : `linear-gradient(135deg, #2a2a30 0%, #1a1a1e 100%)`,
                backgroundColor: "#1a1a1e",
              }}
            >
              {/* Text overlay for kicker/caption */}
              {(slide.kicker || slide.caption) && (
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  padding: "28px 32px 22px",
                  background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)",
                }}>
                  {slide.kicker && (
                    <div style={{
                      fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.6)", marginBottom: "5px", fontWeight: 500,
                    }}>
                      {slide.kicker}
                    </div>
                  )}
                  {slide.caption && (
                    <div style={{
                      fontSize: "15px", letterSpacing: "0.04em",
                      color: "#fff", fontWeight: 300,
                    }}>
                      {slide.caption}
                    </div>
                  )}
                </div>
              )}

              {/* Placeholder icon when no image */}
              {!slide.imageUrl && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: "14px", color: t.gold, opacity: 0.35,
                }}>
                  <svg width="54" height="54" viewBox="0 0 36 36" fill="none">
                    <rect x="2" y="2" width="32" height="32" rx="1" stroke="currentColor" strokeWidth="0.8" />
                    <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="0.8" />
                    <path d="M2 25L10 17L16 22L24 12L34 22V34H2V25Z" stroke="currentColor" strokeWidth="0.8" />
                  </svg>
                </div>
              )}
            </div>
          )
        })}

        {/* Dots */}
        {slides.length > 1 && (
          <div style={{
            position: "absolute", bottom: "18px", left: 0, right: 0,
            display: "flex", justifyContent: "center", gap: "8px", zIndex: 3,
          }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: i === heroSlide ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  background: i === heroSlide ? t.gold : "rgba(255,255,255,0.35)",
                  transition: "all 0.35s ease",
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}

        {/* Prev / Next arrows */}
        {slides.length > 1 && ([
          { side: "left"  as const, dx: -1, path: "M11 2L3 8L11 14" },
          { side: "right" as const, dx:  1, path: "M3 2L11 8L3 14"  },
        ] as const).map((arr) => (
          <button
            key={arr.side}
            onClick={() => setHeroSlide(s => (s + arr.dx + slides.length) % slides.length)}
            aria-label={arr.side === "left" ? "Previous slide" : "Next slide"}
            style={{
              position: "absolute", top: "50%", transform: "translateY(-50%)",
              [arr.side]: "18px",
              width: "40px", height: "40px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              cursor: "pointer", zIndex: 3,
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.18)"
              e.currentTarget.style.borderColor = t.gold + "80"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)"
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"
            }}
          >
            <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
              <path d={arr.path} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>

      {/* ── Brand Intro ───────────────────────────────────────────────── */}
      <div className="lxs-hero-brand-intro" style={{ position: "relative", background: t.bg }}>
        <div style={{ maxWidth: "1320px", margin: "0 auto" }}>

          {/* H1 Wordmark + rules */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "28px", marginBottom: "22px" }}>
            <div style={{ flex: 1, maxWidth: "320px", height: "1px", background: t.text, opacity: 0.85 }} />
            <h1 style={{
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
            </h1>
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

          {/* Two-column: body copy + featured slider */}
          <div className="lxs-hero-intro-grid">

            {/* Left: body text */}
            <div style={{ fontSize: "14.5px", lineHeight: 1.85, fontWeight: 300, color: t.textMuted, letterSpacing: "0.015em" }}>
              {introParagraphs.map((p, i) => (
                <p key={i} style={{ marginBottom: i < introParagraphs.length - 1 ? "20px" : 0 }}>{p}</p>
              ))}
            </div>

            {/* Right: featured images slider */}
            <div className="lxs-hero-featured-wrap" style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{
                position: "relative",
                width: "min(100%, 460px)",
                aspectRatio: "5/3",
                background: t.bg,
                overflow: "hidden",
              }}>
                {featuredImages.length > 0 ? (
                  <>
                    {featuredImages.map((img, i) => (
                      <div
                        key={i}
                        style={{
                          position: "absolute", inset: 0,
                          opacity: i === featuredSlide ? 1 : 0,
                          transition: "opacity 1s ease",
                          background: `url("${img.imageUrl}") center/contain no-repeat`,
                          backgroundColor: t.bg,
                        }}
                      />
                    ))}

                    {/* Caption */}
                    {featuredImages[featuredSlide]?.caption && (
                      <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        padding: "8px 12px",
                        fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase",
                        color: t.textMuted, textAlign: "center",
                      }}>
                        {featuredImages[featuredSlide].caption}
                      </div>
                    )}

                    {/* Dots */}
                    {featuredImages.length > 1 && (
                      <div style={{
                        position: "absolute", bottom: "10px", left: 0, right: 0,
                        display: "flex", justifyContent: "center", gap: "6px", zIndex: 2,
                      }}>
                        {featuredImages.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setFeaturedSlide(i)}
                            aria-label={`Featured image ${i + 1}`}
                            style={{
                              width: i === featuredSlide ? "18px" : "6px",
                              height: "6px",
                              borderRadius: "3px",
                              border: "none",
                              cursor: "pointer",
                              background: i === featuredSlide ? t.gold : "rgba(0,0,0,0.2)",
                              transition: "all 0.35s ease",
                              padding: 0,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  /* Gun SVG placeholder */
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg viewBox="0 0 320 180" width="100%" height="100%">
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
                      <path d="M82 92 L240 92 L235 122 L200 122 L196 138 L170 138 L166 122 L150 122 L150 116 L130 116 L130 122 L98 122 Z" fill="#4a4a4a" />
                      <ellipse cx="158" cy="120" rx="14" ry="9" fill={t.bg} />
                      <path d="M82 92 L138 92 L150 168 L96 168 Z" fill="url(#luxGrip)" />
                      <g opacity="0.35" stroke={t.gold} strokeWidth="0.4">
                        {[0,1,2,3,4,5].map(i => <line key={i} x1={102 + i*7} y1="105" x2={92 + i*7} y2="160" />)}
                      </g>
                      <rect x="248" y="50" width="14" height="8" fill={t.gold} opacity="0.85" />
                      <rect x="44" y="50" width="6" height="8" fill={t.gold} opacity="0.85" />
                    </svg>
                    <div style={{
                      position: "absolute", bottom: "12px", left: 0, right: 0, textAlign: "center",
                      fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase",
                      color: t.textDim, fontWeight: 500,
                    }}>
                      Featured Piece · Upload images in CMS
                    </div>
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
