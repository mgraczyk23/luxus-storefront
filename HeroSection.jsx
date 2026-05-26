/* ──────────────────────────────────────────────────────────────────────
 * Luxus Collection — Hero Section (standalone)
 *
 * Drop-in React component for the updated home page hero:
 *   1) Full-bleed image carousel (5 placeholder slides, auto-advance + dots + arrows)
 *   2) Brand wordmark "LUXUS COLLECTION" flanked by rules
 *   3) "The Forefront of Exclusive Firearms" tagline in gold
 *   4) Two-column intro: about copy (left) + featured cutout piece (right)
 *      — stacks vertically on viewports ≤ 860px
 *
 * USAGE
 * ─────
 * Plain React (Vite / Next / CRA):
 *   import HeroSection from "./HeroSection";
 *   <HeroSection isDark={true} />
 *
 * Inline-JSX (Babel-in-browser) projects:
 *   <script type="text/babel" src="HeroSection.jsx"></script>
 *   then use <HeroSection isDark={true} /> in your tree.
 *
 * Replace the slide placeholders by passing your own:
 *   <HeroSection slides={[
 *     { kicker: "The Vault",    caption: "1911 Collection",       imageUrl: "/hero/01.jpg" },
 *     { kicker: "Heritage",     caption: "Engraved Revolvers",    imageUrl: "/hero/02.jpg" },
 *     ...
 *   ]} />
 *
 * Replace the cutout piece with a real PNG:
 *   <HeroSection featuredImageUrl="/featured/nighthawk-agent.png" />
 *
 * Requires Playfair Display + Inter (Google Fonts) — loaded on demand
 * by the component's <style> block.
 * ────────────────────────────────────────────────────────────────────── */

const { useState, useEffect } = React;

/* ─── Theme ──────────────────────────────────────────────────────────── */
const HERO_DARK = {
  bg: "#0a0a0a",
  border: "#2a2a2a",
  gold: "#c09530",
  goldLight: "#d4aa4a",
  text: "#ededed",
  textMuted: "#9a9a9a",
  textDim: "#606060",
};

const HERO_LIGHT = {
  bg: "#ffffff",
  border: "#e4e4e6",
  gold: "#7e5e10",
  goldLight: "#9a7218",
  text: "#1a1a1a",
  textMuted: "#525258",
  textDim: "#707076",
};

/* ─── Default slide content (replace with real photography) ──────────── */
const DEFAULT_SLIDES = [
  { kicker: "The Vault",            caption: "1911 Collection · Top-down array" },
  { kicker: "Heritage",             caption: "Engraved Revolvers · Detail close-up" },
  { kicker: "Master Craft",         caption: "Cabot Guns Damascus · Studio lighting" },
  { kicker: "European Precision",   caption: "Korth Lineup · Black backdrop" },
  { kicker: "American Custom",      caption: "Nighthawk Custom · Workshop bench" },
];

const DEFAULT_BODY = [
  <span key="p1">
    <strong style={{ fontWeight: 400 }}>Luxus Collection</strong> is a privately curated portfolio of historically significant and master-grade firearms, assembled and managed as an active, evolving portfolio.
  </span>,
  "We are collectors first. The collection grows through disciplined acquisition, selective trading, and private-treaty transfers. Pieces rotate in and out of the vault as the collection evolves — some retained long term, others released to qualified collectors when appropriate.",
  "Luxus Collection is not a retail marketplace and does not operate as a public dealer. Items displayed are presented for reference, research, and private inquiry. Availability, when extended, is discreet and subject to qualification, compliance, and curator discretion.",
];

/* ─── Component ──────────────────────────────────────────────────────── */
function HeroSection({
  isDark            = true,
  slides            = DEFAULT_SLIDES,
  wordmark          = "Luxus Collection",
  tagline           = "The Forefront of Exclusive Firearms",
  bodyParagraphs    = DEFAULT_BODY,
  featuredImageUrl  = null,   // optional: real cutout PNG to replace the SVG placeholder
  featuredCaption   = "Featured Piece",
  autoAdvanceMs     = 6000,
  headerOffsetPx    = 0,      // set to your fixed header height if you have one
}) {
  const t = isDark ? HERO_DARK : HERO_LIGHT;
  const [heroSlide, setHeroSlide] = useState(0);

  /* Auto-advance carousel */
  useEffect(() => {
    if (!autoAdvanceMs) return;
    const id = setInterval(() => setHeroSlide((s) => (s + 1) % slides.length), autoAdvanceMs);
    return () => clearInterval(id);
  }, [slides.length, autoAdvanceMs]);

  return (
    <section style={{ position: "relative", paddingTop: `${headerOffsetPx}px`, background: t.bg, color: t.text, fontFamily: "'Inter',sans-serif" }}>

      {/* Fonts + responsive grid */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap');
        .lxs-hero-intro-grid {
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: 72px;
          align-items: center;
        }
        @media (max-width: 860px) {
          .lxs-hero-intro-grid {
            grid-template-columns: 1fr;
            gap: 56px;
          }
        }
      `}</style>

      {/* ── Carousel ──────────────────────────────────────────────────── */}
      <div style={{
        position: "relative", width: "100%",
        height: "clamp(420px, 62vh, 720px)",
        overflow: "hidden",
        background: isDark ? "#0a0a0a" : "#e8e8eb",
      }}>
        {slides.map((slide, i) => {
          const active = i === heroSlide;
          const tones = isDark
            ? [["#2a2724", "#0e0d0b"], ["#1f1c19", "#080706"], ["#26211a", "#0d0a07"], ["#1a1a1c", "#080809"], ["#231f1a", "#0b0908"]]
            : [["#dcd9d4", "#b4b1aa"], ["#cfccc6", "#a8a59f"], ["#d6d0c4", "#b0a995"], ["#cdcdd0", "#a9a9af"], ["#d4cdc2", "#a8a094"]];
          const [a, b] = tones[i % tones.length];
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
              {/* Only render the placeholder treatment when there's no real image */}
              {!slide.imageUrl && (
                <>
                  <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage:
                      `linear-gradient(${isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.04)"} 1px, transparent 1px),` +
                      `linear-gradient(90deg, ${isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.04)"} 1px, transparent 1px)`,
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
                background: isDark
                  ? "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.55) 100%)"
                  : "linear-gradient(to bottom, rgba(255,255,255,0.0) 0%, transparent 70%, rgba(255,255,255,0.5) 100%)",
              }} />
            </div>
          );
        })}

        {/* Dots */}
        <div style={{
          position: "absolute", bottom: "22px", left: 0, right: 0,
          display: "flex", justifyContent: "center", gap: "10px", zIndex: 3,
        }}>
          {slides.map((_, i) => {
            const active = i === heroSlide;
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
                  background: active ? t.gold : (isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"),
                  transition: "all 0.35s ease",
                  padding: 0,
                }}
              />
            );
          })}
        </div>

        {/* Prev / next arrows */}
        {[{ side: "left", dx: -1, path: "M11 2L3 8L11 14" }, { side: "right", dx: 1, path: "M3 2L11 8L3 14" }].map((arr) => (
          <button
            key={arr.side}
            onClick={() => setHeroSlide((s) => (s + arr.dx + slides.length) % slides.length)}
            aria-label={arr.side === "left" ? "Previous slide" : "Next slide"}
            style={{
              position: "absolute", top: "50%", transform: "translateY(-50%)",
              [arr.side]: "22px",
              width: "44px", height: "44px",
              background: isDark ? "rgba(10,10,10,0.45)" : "rgba(255,255,255,0.55)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
              color: t.text,
              cursor: "pointer", zIndex: 3,
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.gold + "80"; e.currentTarget.style.color = t.gold; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"; e.currentTarget.style.color = t.text; }}
          >
            <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
              <path d={arr.path} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>

      {/* ── Brand intro ───────────────────────────────────────────────── */}
      <div style={{ position: "relative", padding: "84px 40px 64px", background: t.bg }}>
        <div style={{ maxWidth: "1320px", margin: "0 auto" }}>

          {/* Wordmark + rules */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "28px", marginBottom: "22px" }}>
            <div style={{ flex: 1, maxWidth: "320px", height: "1px", background: t.text, opacity: 0.85 }} />
            <h2 style={{
              fontFamily: "'Playfair Display',serif",
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
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
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

          {/* Two-column: body + cutout (stacks on mobile via .lxs-hero-intro-grid) */}
          <div className="lxs-hero-intro-grid">
            {/* Body copy */}
            <div style={{ fontSize: "14.5px", lineHeight: 1.85, fontWeight: 300, color: t.textMuted, letterSpacing: "0.015em" }}>
              {bodyParagraphs.map((p, i) => (
                <p key={i} style={{ marginBottom: i === bodyParagraphs.length - 1 ? 0 : "20px" }}>{p}</p>
              ))}
            </div>

            {/* Featured cutout */}
            <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "340px" }}>
              {/* Soft halo */}
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
                background: isDark
                  ? "linear-gradient(135deg, rgba(192,149,48,0.06), rgba(0,0,0,0))"
                  : "linear-gradient(135deg, rgba(126,94,16,0.06), rgba(0,0,0,0))",
              }}>
                {featuredImageUrl ? (
                  <img
                    src={featuredImageUrl}
                    alt={featuredCaption}
                    style={{
                      width: "100%", height: "100%", objectFit: "contain",
                      filter: isDark ? "drop-shadow(0 18px 40px rgba(0,0,0,0.55))" : "drop-shadow(0 18px 40px rgba(0,0,0,0.18))",
                    }}
                  />
                ) : (
                  /* SVG placeholder — swap for a real cutout PNG via the featuredImageUrl prop */
                  <svg viewBox="0 0 320 180" width="100%" height="100%" style={{ filter: isDark ? "drop-shadow(0 18px 40px rgba(0,0,0,0.55))" : "drop-shadow(0 18px 40px rgba(0,0,0,0.18))" }}>
                    <defs>
                      <linearGradient id="luxBarrel" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={t.gold} stopOpacity="0.65" />
                        <stop offset="50%" stopColor={t.gold} stopOpacity="0.95" />
                        <stop offset="100%" stopColor={isDark ? "#5e4710" : "#7e5e10"} stopOpacity="0.9" />
                      </linearGradient>
                      <linearGradient id="luxGrip" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={isDark ? "#3a2a14" : "#5a4220"} />
                        <stop offset="100%" stopColor={isDark ? "#1a1208" : "#2e2110"} />
                      </linearGradient>
                    </defs>
                    <rect x="30" y="58" width="240" height="34" rx="3" fill="url(#luxBarrel)" />
                    <rect x="30" y="56" width="240" height="3" fill={t.gold} opacity="0.7" />
                    <path d="M82 92 L240 92 L235 122 L200 122 L196 138 L170 138 L166 122 L150 122 L150 116 L130 116 L130 122 L98 122 Z" fill={isDark ? "#1a1a1a" : "#3a3a3a"} />
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
  );
}

/* Expose globally for inline-JSX projects */
if (typeof window !== "undefined") window.HeroSection = HeroSection;

/* ESM export for bundler projects */
if (typeof module !== "undefined" && module.exports) module.exports = HeroSection;
