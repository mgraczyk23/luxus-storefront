'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { imageUrl } from '@/lib/payload'
import type { AboutPageImages, AboutPageText, AboutGalleryItem, PayloadBrand } from '@/lib/payload'
import { useState, useEffect } from 'react'

function ImgBox({ style = {}, index = 0 }: { style?: React.CSSProperties; index?: number }) {
  const { t } = useTheme()
  const l = ["#e8e8eb,#d4d4d8","#e8e8eb,#d4d4d8","#e8e8eb,#d4d4d8","#e8e8eb,#d4d4d8","#e8e8eb,#d4d4d8"]
  const [c1, c2] = l[index % 5].split(",")
  return (
    <div style={{ background: `linear-gradient(140deg,${c1} 0%,${c2} 55%,${c1} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", ...style }}>
      <svg width="32" height="32" viewBox="0 0 36 36" fill="none" opacity="0.12">
        <rect x="2" y="2" width="32" height="32" rx="1" stroke={t.gold} strokeWidth="0.8"/>
        <circle cx="12" cy="12" r="4" stroke={t.gold} strokeWidth="0.8"/>
        <path d="M2 26L11 17L17 23L25 13L34 23V34H2V26Z" stroke={t.gold} strokeWidth="0.8"/>
      </svg>
    </div>
  )
}

function Eyebrow({ label, center = false }: { label: string; center?: boolean }) {
  const { t } = useTheme()
  return (
    <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px", justifyContent: center ? "center" : "flex-start" }}>
      <div style={{ width:"18px",height:"1px",background:t.gold }}/>
      <span style={{ fontSize:"8.5px",letterSpacing:"0.26em",textTransform:"uppercase",color:t.gold,fontWeight:500,fontFamily:"var(--font-inter)" }}>{label}</span>
    </div>
  )
}

function ValueCard({ number, title, body }: { number: string; title: string; body: string }) {
  const { t } = useTheme()
  return (
    <div style={{ padding:"32px 28px",background:t.bgCard,border:`1px solid ${t.border}`,transition:"all 0.28s ease" }}
      onMouseEnter={e=>{ e.currentTarget.style.background=t.bgCardHover; e.currentTarget.style.borderColor=t.gold+"50"; e.currentTarget.style.boxShadow="0 12px 40px rgba(0,0,0,0.08)" }}
      onMouseLeave={e=>{ e.currentTarget.style.background=t.bgCard; e.currentTarget.style.borderColor=t.border; e.currentTarget.style.boxShadow="none" }}>
      <div style={{ fontFamily:"var(--font-playfair)",fontSize:"44px",fontWeight:300,color:t.gold,lineHeight:1,marginBottom:"18px",opacity:0.5 }}>{number}</div>
      <div style={{ fontSize:"8.5px",letterSpacing:"0.2em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"10px",fontFamily:"var(--font-inter)" }}>{title}</div>
      <p style={{ fontSize:"13px",fontWeight:300,color:t.textMuted,lineHeight:1.82,letterSpacing:"0.015em" }}>{body}</p>
    </div>
  )
}

function GallerySection({ items }: { items: AboutGalleryItem[] }) {
  const { t } = useTheme()
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [hov, setHov] = useState<number | null>(null)

  const open  = (i: number) => setLightbox(i)
  const close = () => setLightbox(null)
  const prev  = () => setLightbox(i => i !== null ? (i - 1 + items.length) % items.length : null)
  const next  = () => setLightbox(i => i !== null ? (i + 1) % items.length : null)

  // Keyboard navigation
  useEffect(() => {
    if (lightbox === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")     setLightbox(null)
      if (e.key === "ArrowLeft")  setLightbox(i => i !== null ? (i - 1 + items.length) % items.length : null)
      if (e.key === "ArrowRight") setLightbox(i => i !== null ? (i + 1) % items.length : null)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [lightbox, items.length])

  const active = lightbox !== null ? items[lightbox] : null

  return (
    <>
      {/* Grid */}
      <div className="lxs-about-gallery">
        {items.map((item, i) => {
          const src = imageUrl(item.image)
          const isHov = hov === i
          return (
            <div
              key={item.id}
              onClick={() => open(i)}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
              style={{ position:"relative", overflow:"hidden", border:`1px solid ${t.border}`, aspectRatio:"4/3", cursor:"zoom-in" }}
            >
              {src
                ? <Image src={src} alt={item.image.alt || item.title || "Heritage piece"} fill style={{ objectFit:"cover", transition:"transform 0.5s ease", transform: isHov ? "scale(1.04)" : "scale(1)" }} sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" />
                : <div style={{ width:"100%", height:"100%", background:t.bgSurface }} />
              }
              {/* Hover caption */}
              {(item.title || item.caption) && (
                <div style={{ position:"absolute", inset:0, background:"rgba(10,9,8,0.62)", display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"20px 22px", opacity: isHov ? 1 : 0, transition:"opacity 0.28s ease", pointerEvents:"none" }}>
                  {item.title && <div style={{ fontFamily:"var(--font-playfair)", fontSize:"16px", fontWeight:400, color:"#fff", lineHeight:1.25, marginBottom: item.caption ? "6px" : 0 }}>{item.title}</div>}
                  {item.caption && <div style={{ fontSize:"11.5px", fontWeight:300, color:"rgba(255,255,255,0.75)", lineHeight:1.6, letterSpacing:"0.02em" }}>{item.caption}</div>}
                </div>
              )}
              {/* Zoom icon */}
              <div style={{ position:"absolute", top:"12px", right:"12px", opacity: isHov ? 1 : 0, transition:"opacity 0.2s", pointerEvents:"none" }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color:"#fff", filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}>
                  <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M6.5 8.5H10.5M8.5 6.5V10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          )
        })}
      </div>

      {/* Lightbox */}
      {lightbox !== null && active && (
        <div
          onClick={close}
          style={{ position:"fixed", inset:0, zIndex:10000, background:"rgba(8,7,6,0.92)", backdropFilter:"blur(12px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
        >
          {/* Image container */}
          <div
            onClick={e => e.stopPropagation()}
            style={{ position:"relative", maxWidth:"min(92vw, 1200px)", maxHeight:"88vh", width:"100%", display:"flex", flexDirection:"column", alignItems:"center" }}
          >
            <div style={{ position:"relative", width:"100%", maxHeight:"80vh", aspectRatio:"auto" }}>
              {imageUrl(active.image) && (
                <Image
                  key={lightbox}
                  src={imageUrl(active.image)!}
                  alt={active.image.alt || active.title || "Heritage piece"}
                  width={active.image.width ?? 1200}
                  height={active.image.height ?? 900}
                  style={{ objectFit:"contain", maxHeight:"80vh", width:"100%", height:"auto" }}
                  sizes="92vw"
                />
              )}
            </div>

            {/* Caption */}
            {(active.title || active.caption) && (
              <div style={{ marginTop:"16px", textAlign:"center", maxWidth:"600px" }}>
                {active.title && <div style={{ fontFamily:"var(--font-playfair)", fontSize:"18px", fontWeight:400, color:"#fff", marginBottom: active.caption ? "6px" : 0 }}>{active.title}</div>}
                {active.caption && <div style={{ fontSize:"12px", fontWeight:300, color:"rgba(255,255,255,0.65)", letterSpacing:"0.03em", lineHeight:1.6 }}>{active.caption}</div>}
              </div>
            )}

            {/* Counter */}
            <div style={{ marginTop:"12px", fontSize:"10px", letterSpacing:"0.18em", color:"rgba(255,255,255,0.35)", fontFamily:"var(--font-inter)" }}>
              {lightbox + 1} / {items.length}
            </div>
          </div>

          {/* Prev */}
          {items.length > 1 && (
            <button onClick={e => { e.stopPropagation(); prev() }}
              style={{ position:"fixed", left:"20px", top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.18)", color:"#fff", width:"44px", height:"44px", borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.18)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}

          {/* Next */}
          {items.length > 1 && (
            <button onClick={e => { e.stopPropagation(); next() }}
              style={{ position:"fixed", right:"20px", top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.18)", color:"#fff", width:"44px", height:"44px", borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.18)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}

          {/* Close */}
          <button onClick={close}
            style={{ position:"fixed", top:"20px", right:"20px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.18)", color:"#fff", width:"40px", height:"40px", borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
      )}
    </>
  )
}

function BrandTile({ name, origin, description, logo, slug }: { name: string; origin: string; description: string; logo: import('@/lib/payload').PayloadImage | null; slug: string }) {
  const { t } = useTheme()
  const logoSrc = imageUrl(logo)
  return (
    <Link href={`/brand/${slug}`} style={{ textDecoration:"none" }}>
      <div style={{ padding:"24px",border:`1px solid ${t.border}`,background:"transparent",transition:"all 0.25s",cursor:"pointer",height:"100%" }}
        onMouseEnter={e=>{ e.currentTarget.style.borderColor=t.gold+"55"; e.currentTarget.style.background="#fafafa" }}
        onMouseLeave={e=>{ e.currentTarget.style.borderColor=t.border; e.currentTarget.style.background="transparent" }}>
        {logoSrc && (
          <div style={{ height:"40px",marginBottom:"16px",display:"flex",alignItems:"center" }}>
            <Image src={logoSrc} alt={`${name} logo`} width={120} height={40} style={{ objectFit:"contain",objectPosition:"left",maxHeight:"40px",width:"auto" }} />
          </div>
        )}
        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"14px" }}>
          <div style={{ fontFamily:"var(--font-playfair)",fontSize:"19px",fontWeight:400,color:t.text,letterSpacing:"0.02em",transition:"color 0.22s" }}
            onMouseEnter={e=>e.currentTarget.style.color=t.gold} onMouseLeave={e=>e.currentTarget.style.color=t.text}>
            {name}
          </div>
          <span style={{ fontSize:"8.5px",letterSpacing:"0.14em",textTransform:"uppercase",color:t.textDim,fontWeight:400,flexShrink:0,marginLeft:"12px",marginTop:"4px" }}>{origin}</span>
        </div>
        <div style={{ width:"20px",height:"1px",background:t.gold+"50",marginBottom:"12px" }}/>
        <p style={{ fontSize:"12px",fontWeight:300,color:t.textMuted,lineHeight:1.75,letterSpacing:"0.01em" }}>{description}</p>
      </div>
    </Link>
  )
}

export default function AboutPage({
  images = { heroImage: null, storyImageMain: null, storyImageLeft: null, storyImageRight: null, valuesImage: null, galleryHeading: null, galleryIntro: null, gallery: [] },
  text = {},
  brands = [],
  settings,
}: {
  images?: AboutPageImages
  text?: AboutPageText
  brands?: PayloadBrand[]
  settings?: import('@/lib/payload').SiteSettings
}) {
  const { t } = useTheme()

  const c = {
    heroHeadline:    text.heroHeadline    ?? "The Boutique the Collector Deserved.",
    heroDescription: text.heroDescription ?? "Founded in 2026 with a single conviction — that collectors spending thousands on a precision firearm deserve an experience that matches the quality of what they're buying.",
    stats: [
      [text.stat1Number ?? "450+", text.stat1Label ?? "Curated Pieces"],
      [text.stat2Number ?? "35+",  text.stat2Label ?? "Premier Brands"],
      [text.stat3Number ?? "2026", text.stat3Label ?? "Est."],
    ] as [string, string][],
    fflLicense: settings?.fflLicense ?? text.fflLicenseNumber ?? "Update in Site Settings",

    excellenceHeading: text.excellenceHeading ?? "A Distinguished Showcase of Top-Tier Firearm Craftsmanship",
    excellenceBody:    text.excellenceBody    ?? "Welcome to Luxus Collection, LLC. We have diligently assembled an extensive catalog of premium firearms from the world’s most respected manufacturers, each piece exemplifying unmatched precision, reliability, and artistic excellence.",
    excellenceItalic:  text.excellenceItalic  ?? "We represent more than just a retail experience — we are a benchmark of gun-making mastery, where heritage and innovation meet.",

    storyHeading:   text.storyHeading   ?? "A Market That Deserved Better",
    storyPara1:     text.storyPara1     ?? "Collectors spending $5,000 on a Cabot pistol or $8,000 on a Korth revolver were navigating a fragmented market of gun shows, private sales, and general-purpose retailers that offered no curation, no expertise, and no experience befitting a purchase of that significance.",
    storyPara2:     text.storyPara2     ?? "The gap was obvious to anyone paying attention. The fine watch market had long since matured into something refined — boutiques with trained staff, curated selections, detailed provenance, and service that matched the price point. The fine timepiece buyer knew exactly what they were getting and why it was worth it.",
    storyPara3:     text.storyPara3     ?? "The fine firearms collector had no such equivalent. The platforms existed, but the experience didn’t. Luxus Collection was built to close that gap.",
    storyPara4:     text.storyPara4     ?? "We launched in 2026 with a focused inventory, direct relationships with the manufacturers we carry, and a commitment to treating every customer as the serious collector they are — not a one-time transaction.",
    storyPullquote: text.storyPullquote ?? "We didn’t set out to sell more guns. We set out to make buying one remarkable.",
    storyParaFinal: text.storyParaFinal ?? "Today, Luxus Collection carries over 450 curated pieces from more than 35 of the world’s most respected manufacturers, with every listing individually assessed for condition, provenance, and fit within our collection’s standard.",

    phil1Title: text.phil1Title ?? "Curation Over Inventory",
    phil1Body:  text.phil1Body  ?? "We carry fewer pieces than a general retailer by design. Every item on our site has been individually assessed — for quality, condition, rarity, and fit within our collection’s standard. If we wouldn’t be proud to own it, we don’t list it.",
    phil2Title: text.phil2Title ?? "Expertise Over Volume",
    phil2Body:  text.phil2Body  ?? "Our team understands what they sell at a depth that generic retailers can’t match. We know the difference between a standard Nighthawk build and a consignment Agent with provenance. That knowledge is available to every customer, at every price point.",
    phil3Title: text.phil3Title ?? "Relationship Over Transaction",
    phil3Body:  text.phil3Body  ?? "A collector spending $4,000 on a pistol should leave the experience better informed than when they arrived — about the piece, about its maker, and about what to look for next. We measure our success by repeat customers, not first-time conversions.",

    missionHeading: text.missionHeading ?? "Beyond Commerce.",
    missionBody1:   text.missionBody1   ?? "Our mission transcends commerce. We aren’t only driven to offer the finest firearms — we aim to innovate and continually elevate the experience that surrounds them.",
    missionBody2:   text.missionBody2   ?? "Each piece in our catalog is more than a tool. It is an emblem of tradition, precision, and luxury, selected to set a global standard while honoring the roots of the craft.",
    missionCallout: text.missionCallout ?? "Luxus Collection is not just a name — it’s a legacy.",
    pillars: [
      [text.pillar1Title ?? "Unrivaled Expertise",           text.pillar1Body ?? "Our team understands the industry’s nuances in depth. Backed by years of experience, every piece is meticulously selected to align with the Luxus promise of exclusivity."],
      [text.pillar2Title ?? "Global Standards, Personal Touch", text.pillar2Body ?? "We pride ourselves on meeting international benchmarks while keeping every interaction deeply personal. Each client, each firearm, each inquiry is handled with the utmost care."],
      [text.pillar3Title ?? "Heritage Meets Innovation",     text.pillar3Body ?? "We merge the artistry of traditional gunmaking with state-of-the-art technology, preserving what is timeless while continually elevating what is possible."],
      [text.pillar4Title ?? "From Humble Beginnings",        text.pillar4Body ?? "What began with a singular conviction has grown into a renowned destination defined by passion, exclusivity, and an ever-evolving portfolio of the world’s finest."],
    ] as [string, string][],

    curationHeading: text.curationHeading ?? "The Curation Standard",
    curationIntro:   text.curationIntro   ?? "Not every pistol from a respected manufacturer meets our standard. Production variance, condition issues, and mismatched market positioning all factor into what we carry. Our curation process applies four criteria to every piece before it earns a listing.",
    criteria: [
      [text.crit1Title ?? "Manufacturer Reputation",    text.crit1Body ?? "We carry brands with demonstrable commitment to quality, not aspirational claims."],
      [text.crit2Title ?? "Individual Piece Condition", text.crit2Body ?? "New or pre-owned, every piece is graded. We describe what we see and photograph what we have."],
      [text.crit3Title ?? "Market Fit",                 text.crit3Body ?? "The price must reflect genuine value. We don’t inflate collector markets with artificial scarcity."],
      [text.crit4Title ?? "Provenance When Available",  text.crit4Body ?? "Historical or notable pieces come with documentation. We trace what can be traced."],
    ] as [string, string][],

    fflBody:      text.fflBody      ?? "Luxus Collection holds a current Federal Firearms License and operates in full compliance with all applicable federal, state, and local laws governing the sale and transfer of firearms. Every transaction is conducted with the legal precision our customers’ purchases deserve.",
    fflCard1Body: text.fflCard1Body ?? "We hold FFL License #{LICENSE}, authorizing us to engage in the business of dealing in firearms.",
    fflCard2Body: text.fflCard2Body ?? "We screen all orders against applicable state and local laws before shipment. Buyers are responsible for understanding the laws in their jurisdiction.",
  }

  return (
    <div className="lxs-about-page" style={{ background:t.bg,color:t.text,fontFamily:"var(--font-inter)" }}>

      {/* HERO */}
      <div style={{ position:"relative",minHeight:"72vh",display:"flex",alignItems:"center",overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse at 65% 50%,#f2f2f5,#ececef 60%,#e6e6ea 100%)" }}/>
        <div style={{ position:"absolute",bottom:0,right:0,width:"50%",height:"60%",background:`radial-gradient(ellipse at bottom right,${t.gold}0d,transparent 65%)` }}/>
        <div style={{ position:"absolute",left:"50%",top:"10%",bottom:"10%",width:"1px",background:`linear-gradient(to bottom,transparent,${t.gold}28,transparent)` }}/>

        <div style={{ position:"relative",zIndex:2,maxWidth:"1440px",margin:"0 auto",padding:"80px 40px",width:"100%" }}>
          <div className="lxs-about-hero">
            <div>
              <Eyebrow label="Our Story" />
              <h1 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(44px,5.5vw,80px)",fontWeight:300,lineHeight:1.04,letterSpacing:"0.005em",color:t.text,marginBottom:"28px" }}>
                {c.heroHeadline}
              </h1>
              <p style={{ fontSize:"15px",fontWeight:300,lineHeight:1.85,color:t.textMuted,maxWidth:"440px",letterSpacing:"0.025em" }}>
                {c.heroDescription}
              </p>
              <div style={{ display:"flex",gap:"40px",marginTop:"52px",paddingTop:"32px",borderTop:`1px solid ${t.border}` }}>
                {c.stats.map(([n,l]) => (
                  <div key={l}>
                    <div style={{ fontFamily:"var(--font-playfair)",fontSize:"32px",fontWeight:300,color:t.gold,lineHeight:1,marginBottom:"4px" }}>{n}</div>
                    <div style={{ fontSize:"8.5px",letterSpacing:"0.14em",textTransform:"uppercase",color:t.textMuted,fontWeight:400 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ position:"relative" }}>
              <div style={{ aspectRatio:"4/5",maxHeight:"560px",border:`1px solid ${t.border}`,position:"relative",overflow:"hidden" }}>
                {[{top:"14px",left:"14px",borderTop:`1px solid ${t.gold}50`,borderLeft:`1px solid ${t.gold}50`},{top:"14px",right:"14px",borderTop:`1px solid ${t.gold}50`,borderRight:`1px solid ${t.gold}50`},{bottom:"14px",left:"14px",borderBottom:`1px solid ${t.gold}50`,borderLeft:`1px solid ${t.gold}50`},{bottom:"14px",right:"14px",borderBottom:`1px solid ${t.gold}50`,borderRight:`1px solid ${t.gold}50`}].map((s,i) => (
                  <div key={i} style={{ position:"absolute",width:"22px",height:"22px",...s,zIndex:1 }}/>
                ))}
                {images.heroImage
                  ? <Image src={imageUrl(images.heroImage)!} alt={images.heroImage.alt || "Luxus Collection showroom"} fill style={{ objectFit:"cover" }} sizes="(max-width:768px) 100vw, 50vw" />
                  : <ImgBox index={0} style={{ width:"100%",height:"100%" }}/>
                }
              </div>
              <div style={{ position:"absolute",bottom:"40px",left:"-36px",background:"rgba(255,255,255,0.96)",border:`1px solid ${t.border}`,borderLeft:`2px solid ${t.gold}`,padding:"14px 18px",backdropFilter:"blur(12px)",boxShadow:"0 12px 40px rgba(0,0,0,0.1)",minWidth:"200px" }}>
                <div style={{ fontSize:"7.5px",letterSpacing:"0.22em",color:t.gold,textTransform:"uppercase",fontWeight:500,marginBottom:"5px" }}>Federal Firearms Licensee</div>
                <div style={{ fontFamily:"var(--font-playfair)",fontSize:"15px",fontWeight:400,color:t.text,marginBottom:"3px" }}>License #{c.fflLicense}</div>
                <div style={{ fontSize:"10.5px",color:t.textMuted,fontWeight:300 }}>Fully Licensed · Fully Compliant</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INVESTMENT-GRADE EXCELLENCE */}
      <section style={{ padding:"96px 40px 64px",borderTop:`1px solid ${t.border}` }}>
        <div style={{ maxWidth:"1180px",margin:"0 auto",textAlign:"center" }}>
          <Eyebrow label="Investment-Grade Excellence" />
          <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(28px,3vw,44px)",fontWeight:300,color:t.text,lineHeight:1.15,letterSpacing:"0.01em",margin:"0 auto 28px",maxWidth:"900px" }}>
            {c.excellenceHeading}
          </h2>
          <p style={{ fontSize:"15.5px",fontWeight:300,lineHeight:1.9,color:t.textMuted,maxWidth:"780px",margin:"0 auto 18px",letterSpacing:"0.02em" }}>
            {c.excellenceBody}
          </p>
          <p style={{ fontSize:"14px",fontWeight:300,lineHeight:1.9,color:t.textDim,maxWidth:"720px",margin:"0 auto 44px",letterSpacing:"0.02em",fontStyle:"italic" }}>
            {c.excellenceItalic}
          </p>
          <div style={{ display:"flex",flexWrap:"wrap",justifyContent:"center",gap:"10px",maxWidth:"780px",margin:"0 auto" }}>
            {["Heckler & Koch","Smith & Wesson","Ruger","SIG Sauer","Colt","Korth","Nighthawk Custom","Cabot Guns","Wilson Combat"].map(name => (
              <span key={name} style={{ padding:"9px 18px",border:`1px solid ${t.border}`,fontSize:"10.5px",letterSpacing:"0.14em",textTransform:"uppercase",color:t.textMuted,fontWeight:500,background:"#fafafa",transition:"all 0.22s",cursor:"default" }}
                onMouseEnter={e=>{ e.currentTarget.style.color=t.gold; e.currentTarget.style.borderColor=t.gold+"50" }}
                onMouseLeave={e=>{ e.currentTarget.style.color=t.textMuted; e.currentTarget.style.borderColor=t.border }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* OUR STORY */}
      <section style={{ padding:"96px 40px" }}>
        <div style={{ maxWidth:"1440px",margin:"0 auto" }}>
          <div className="lxs-about-story">
            <div className="lxs-about-story-images" style={{ position:"sticky",top:"96px",display:"flex",flexDirection:"column",gap:"14px" }}>
              <div style={{ position:"relative",aspectRatio:"4/3",border:`1px solid ${t.border}`,overflow:"hidden" }}>
                {images.storyImageMain
                  ? <Image src={imageUrl(images.storyImageMain)!} alt={images.storyImageMain.alt || "Our story"} fill style={{ objectFit:"cover" }} sizes="(max-width:768px) 100vw, 40vw" />
                  : <ImgBox index={1} style={{ width:"100%",height:"100%" }}/>
                }
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px" }}>
                <div style={{ position:"relative",aspectRatio:"4/3",border:`1px solid ${t.border}`,overflow:"hidden" }}>
                  {images.storyImageLeft
                    ? <Image src={imageUrl(images.storyImageLeft)!} alt={images.storyImageLeft.alt || ""} fill style={{ objectFit:"cover" }} sizes="(max-width:768px) 50vw, 20vw" />
                    : <ImgBox index={2} style={{ width:"100%",height:"100%" }}/>
                  }
                </div>
                <div style={{ position:"relative",aspectRatio:"4/3",border:`1px solid ${t.border}`,overflow:"hidden" }}>
                  {images.storyImageRight
                    ? <Image src={imageUrl(images.storyImageRight)!} alt={images.storyImageRight.alt || ""} fill style={{ objectFit:"cover" }} sizes="(max-width:768px) 50vw, 20vw" />
                    : <ImgBox index={3} style={{ width:"100%",height:"100%" }}/>
                  }
                </div>
              </div>
            </div>
            <div>
              <Eyebrow label="The Beginning" />
              <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(30px,3vw,44px)",fontWeight:300,color:t.text,lineHeight:1.15,marginBottom:"32px",letterSpacing:"0.01em" }}>
                {c.storyHeading}
              </h2>
              <div style={{ display:"flex",flexDirection:"column",gap:"22px" }}>
                {[c.storyPara1, c.storyPara2, c.storyPara3, c.storyPara4].map((para, i) => (
                  <p key={i} style={{ fontSize:"15px",fontWeight:300,lineHeight:1.9,color:i===0?t.text:t.textMuted,letterSpacing:"0.02em" }}>{para}</p>
                ))}
              </div>
              <div style={{ margin:"44px 0",padding:"0 0 0 32px",borderLeft:`3px solid ${t.gold}`,position:"relative" }}>
                <div style={{ fontFamily:"var(--font-playfair)",fontSize:"80px",lineHeight:0.65,color:t.gold,opacity:0.2,position:"absolute",top:"8px",left:"20px",fontWeight:300,userSelect:"none" }}>&ldquo;</div>
                <div style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(20px,2.2vw,26px)",fontWeight:300,fontStyle:"italic",color:t.text,lineHeight:1.6,letterSpacing:"0.01em" }}>
                  {c.storyPullquote}
                </div>
              </div>
              <p style={{ fontSize:"15px",fontWeight:300,lineHeight:1.9,color:t.textMuted,letterSpacing:"0.02em" }}>
                {c.storyParaFinal}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section style={{ padding:"96px 40px",background:"linear-gradient(to bottom,transparent,#f3f3f5 8%,#f3f3f5 92%,transparent)" }}>
        <div style={{ maxWidth:"1440px",margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:"64px" }}>
            <Eyebrow label="What We Believe" />
            <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(30px,3.2vw,48px)",fontWeight:300,color:t.text,letterSpacing:"0.01em",lineHeight:1.1 }}>Our Philosophy</h2>
            <div style={{ width:"36px",height:"1px",background:t.gold,margin:"18px auto 0" }}/>
          </div>
          <div className="lxs-about-values">
            <ValueCard number="01" title={c.phil1Title} body={c.phil1Body}/>
            <ValueCard number="02" title={c.phil2Title} body={c.phil2Body}/>
            <ValueCard number="03" title={c.phil3Title} body={c.phil3Body}/>
          </div>
        </div>
      </section>

      {/* MISSION & WHY CHOOSE */}
      <section style={{ padding:"96px 40px",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:"10%",right:"-10%",width:"60%",height:"80%",background:`radial-gradient(ellipse at center,${t.gold}10,transparent 65%)`,pointerEvents:"none" }}/>
        <div style={{ position:"relative",maxWidth:"1440px",margin:"0 auto" }}>
          <div className="lxs-about-mission">
            <div>
              <Eyebrow label="Our Mission" />
              <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(30px,3vw,46px)",fontWeight:300,color:t.text,lineHeight:1.12,letterSpacing:"0.01em",marginBottom:"24px" }}>
                {c.missionHeading}
              </h2>
              <p style={{ fontSize:"15px",fontWeight:300,lineHeight:1.9,color:t.textMuted,marginBottom:"20px",letterSpacing:"0.02em" }}>
                {c.missionBody1}
              </p>
              <p style={{ fontSize:"14px",fontWeight:300,lineHeight:1.85,color:t.textDim,letterSpacing:"0.02em" }}>
                {c.missionBody2}
              </p>
              <div style={{ marginTop:"36px",padding:"22px 26px",background:"#fafafa",border:`1px solid ${t.border}`,borderLeft:`2px solid ${t.gold}` }}>
                <div style={{ fontSize:"8.5px",letterSpacing:"0.22em",textTransform:"uppercase",color:t.gold,fontWeight:600,marginBottom:"8px" }}>The Through-line</div>
                <p style={{ fontFamily:"var(--font-playfair)",fontSize:"17px",fontWeight:400,fontStyle:"italic",color:t.text,lineHeight:1.55,letterSpacing:"0.01em" }}>
                  {c.missionCallout}
                </p>
              </div>
            </div>
            <div>
              <Eyebrow label="Why Choose Luxus" />
              <h3 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(22px,2.2vw,30px)",fontWeight:300,color:t.text,lineHeight:1.2,marginBottom:"28px",letterSpacing:"0.01em" }}>
                Four Pillars of the Experience
              </h3>
              <div style={{ display:"flex",flexDirection:"column" }}>
                {c.pillars.map(([title, body], i, arr) => (
                  <div key={title} style={{ display:"flex",gap:"20px",padding:"20px 0",borderBottom:i<arr.length-1?`1px solid ${t.border}`:"none" }}>
                    <div style={{ flexShrink:0,fontFamily:"var(--font-playfair)",fontSize:"20px",fontWeight:300,color:t.gold,lineHeight:1,letterSpacing:"0.04em",width:"28px",paddingTop:"2px" }}>
                      {String(i+1).padStart(2,"0")}
                    </div>
                    <div>
                      <div style={{ fontSize:"13px",fontWeight:500,color:t.text,marginBottom:"5px",letterSpacing:"0.04em" }}>{title}</div>
                      <p style={{ fontSize:"13px",fontWeight:300,color:t.textMuted,lineHeight:1.78,letterSpacing:"0.01em" }}>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CURATION STANDARD */}
      <section style={{ padding:"96px 40px" }}>
        <div style={{ maxWidth:"1440px",margin:"0 auto" }}>
          <div className="lxs-about-curation">
            <div>
              <Eyebrow label="How We Select" />
              <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(28px,3vw,44px)",fontWeight:300,color:t.text,lineHeight:1.15,marginBottom:"28px",letterSpacing:"0.01em" }}>
                {c.curationHeading}
              </h2>
              <p style={{ fontSize:"14.5px",fontWeight:300,lineHeight:1.88,color:t.textMuted,marginBottom:"36px",letterSpacing:"0.02em" }}>
                {c.curationIntro}
              </p>
              <div style={{ display:"flex",flexDirection:"column" }}>
                {c.criteria.map(([title, body], i, arr) => (
                  <div key={title} style={{ display:"flex",gap:"18px",padding:"20px 0",borderBottom:i<arr.length-1?`1px solid ${t.border}`:"none" }}>
                    <div style={{ width:"6px",height:"6px",borderRadius:"50%",background:t.gold,marginTop:"7px",flexShrink:0 }}/>
                    <div>
                      <div style={{ fontSize:"12px",fontWeight:500,color:t.text,marginBottom:"4px",letterSpacing:"0.03em" }}>{title}</div>
                      <div style={{ fontSize:"13px",fontWeight:300,color:t.textMuted,lineHeight:1.72,letterSpacing:"0.01em" }}>{body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position:"relative",aspectRatio:"4/3",border:`1px solid ${t.border}`,overflow:"hidden" }}>
              {images.valuesImage
                ? <Image src={imageUrl(images.valuesImage)!} alt={images.valuesImage.alt || "Curation standards"} fill style={{ objectFit:"cover" }} sizes="(max-width:768px) 100vw, 40vw" />
                : <ImgBox index={4} style={{ width:"100%",height:"100%" }}/>
              }
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED BRANDS */}
      <section style={{ padding:"96px 40px",background:"linear-gradient(to bottom,transparent,#f3f3f5 8%,#f3f3f5 92%,transparent)" }}>
        <div style={{ maxWidth:"1440px",margin:"0 auto" }}>
          <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:"52px",flexWrap:"wrap",gap:"20px" }}>
            <div>
              <Eyebrow label="A Selection From Our Partners" />
              <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(28px,3vw,44px)",fontWeight:300,color:t.text,lineHeight:1.1,letterSpacing:"0.01em" }}>Featured Brands</h2>
              <p style={{ fontSize:"13px",fontWeight:300,color:t.textMuted,lineHeight:1.75,maxWidth:"420px",marginTop:"12px",letterSpacing:"0.02em" }}>
                A curated highlight from our full roster of 35+ manufacturers.
              </p>
            </div>
            <Link href="/shop" style={{ fontSize:"9px",letterSpacing:"0.13em",textTransform:"uppercase",color:t.gold,cursor:"pointer",borderBottom:`1px solid ${t.gold}50`,paddingBottom:"1px",fontWeight:500,flexShrink:0,textDecoration:"none" }}>
              Browse Collection →
            </Link>
          </div>
          <div className="lxs-about-brands">
            {(brands.length > 0 ? brands.map(b => ({
              name: b.name,
              origin: b.origin ?? "",
              description: b.description ?? "",
              logo: b.logo,
              slug: b.slug,
            })) : [
              { name:"Korriphila",       origin:"Germany · Heidelberg",       description:"Among the rarest and most exclusive pistol makers in the world. Edgar Budischowsky's HSP-701 represents the absolute pinnacle of German semi-automatic engineering, hand-built in quantities so limited that a waiting list is simply part of ownership.",        logo:null, slug:"korriphila" },
              { name:"SIG Sauer",        origin:"Germany / Switzerland / USA", description:"From the original Swiss P210 to the modern P226 Legion and P320 AXG, SIG's collector and duty-grade production line represents the enduring best of European precision manufacture.",                                                                              logo:null, slug:"sig-sauer" },
              { name:"Heckler & Koch",   origin:"Germany · Oberndorf",        description:"Relentless German engineering applied to every pistol they produce. The P7, HK45, Mark 23, and USP series occupy a singular position — iconic design married to mechanical excellence that has never been fully replicated.",                                          logo:null, slug:"heckler-and-koch" },
              { name:"Colt",             origin:"USA · Hartford, CT",         description:"The original American firearm. Python, Gold Cup, Government Model, Single Action Army — Colt's heritage pieces occupy a category that no other manufacturer, American or otherwise, can genuinely claim to share.",                                                    logo:null, slug:"colt" },
              { name:"Smith & Wesson",   origin:"USA · Springfield, MA",      description:"Over 170 years of American revolver and pistol heritage. The Model 29, the Performance Center series, and the classic K-frame revolvers represent the backbone of the American collecting tradition.",                                                                  logo:null, slug:"smith-wesson" },
              { name:"Walther",          origin:"Germany · Ulm",              description:"Precision, restraint, and nearly 140 years of German craftsmanship. From the legendary PPK and P38 to the modern PPQ and PDP, Walther's lineage spans military history and collector culture in equal measure.",                                                        logo:null, slug:"walther" },
              { name:"Ruger",            origin:"USA · Southport, CT",        description:"American ingenuity at scale. From the Mark-series rimfires to the New Model Single-Six and the Super Redhawk, Ruger pairs uncompromising mechanical reliability with a heritage of approachable craftsmanship that defines the modern American sporting arm.",           logo:null, slug:"ruger" },
              { name:"Nighthawk Custom", origin:"USA · Berryville, AR",       description:"One pistol, one gunsmith, start to finish. Every Nighthawk 1911 is hand-fitted by a single master craftsman — a discipline that produces some of the tightest tolerances and most coveted custom-grade production pistols ever made in America.",                       logo:null, slug:"nighthawk-custom" },
              { name:"Korth",            origin:"Germany · Lollar",           description:"The pinnacle of the modern collector revolver. Handcrafted in small batches with proprietary heat-treatment and tolerances measured in microns, the NXR and Sky Marshal series occupy a tier that simply has no peer in the contemporary revolver market.",              logo:null, slug:"korth" },
            ]).map(brand => <BrandTile key={brand.name} name={brand.name} origin={brand.origin} description={brand.description} logo={brand.logo} slug={brand.slug} />)}
          </div>
          <div style={{ marginTop:"20px",padding:"16px 24px",border:`1px solid ${t.border}`,borderStyle:"dashed",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px" }}>
            <span style={{ fontSize:"13px",fontWeight:300,color:t.textMuted,letterSpacing:"0.02em",fontStyle:"italic" }}>
              …alongside Cabot Guns, Wilson Combat, Les Baer, Ed Brown, Dan Wesson, Kimber, Springfield Armory, and more.
            </span>
            <Link href="/shop" style={{ fontSize:"9px",letterSpacing:"0.13em",textTransform:"uppercase",color:t.gold,cursor:"pointer",fontWeight:500,borderBottom:`1px solid ${t.gold}50`,paddingBottom:"1px",flexShrink:0,textDecoration:"none" }}>
              Browse All Brands
            </Link>
          </div>
        </div>
      </section>

      {/* HERITAGE GALLERY */}
      {images.gallery.length > 0 && (
        <section style={{ padding:"96px 40px",borderTop:`1px solid ${t.border}` }}>
          <div style={{ maxWidth:"1440px",margin:"0 auto" }}>
            {/* Heading */}
            <div style={{ textAlign:"center",marginBottom:"64px" }}>
              <Eyebrow label="Heritage" center />
              <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(28px,3vw,44px)",fontWeight:300,color:t.text,lineHeight:1.1,letterSpacing:"0.01em",marginBottom:"16px" }}>
                {images.galleryHeading ?? "From the Vault"}
              </h2>
              {images.galleryIntro && (
                <p style={{ fontSize:"15px",fontWeight:300,color:t.textMuted,lineHeight:1.8,maxWidth:"560px",margin:"0 auto",letterSpacing:"0.02em" }}>
                  {images.galleryIntro}
                </p>
              )}
            </div>

            {/* Grid + lightbox */}
            <GallerySection items={images.gallery} />
          </div>
        </section>
      )}

      {/* FFL COMPLIANCE */}
      <section style={{ padding:"96px 40px" }}>
        <div style={{ maxWidth:"1440px",margin:"0 auto" }}>
          <div className="lxs-about-ffl">
            <div>
              <Eyebrow label="Licensing & Compliance" />
              <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(26px,2.8vw,40px)",fontWeight:300,color:t.text,lineHeight:1.15,marginBottom:"20px" }}>
                FFL Licensing &<br/>Legal Compliance
              </h2>
              <p style={{ fontSize:"14px",fontWeight:300,lineHeight:1.88,color:t.textMuted,letterSpacing:"0.02em" }}>
                {c.fflBody}
              </p>
            </div>
            <div className="lxs-about-ffl-cards">
              {[
                { icon:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 1L18 5V10C18 14 14.5 17 10 19C5.5 17 2 14 2 10V5L10 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M6.5 10L8.5 12L13.5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>, heading:"Federal Firearms License", body:c.fflCard1Body.replace('{LICENSE}', c.fflLicense) },
                { icon:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10H17M3 10L7 6M3 10L7 14M17 10L13 6M17 10L13 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>, heading:"State Law Compliance", body:c.fflCard2Body },
              ].map(({ icon, heading, body }) => (
                <div key={heading} style={{ padding:"22px",background:"#fff",border:`1px solid ${t.border}` }}>
                  <div style={{ color:t.gold,marginBottom:"12px" }}>{icon}</div>
                  <div style={{ fontSize:"8.5px",letterSpacing:"0.18em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"7px",fontFamily:"var(--font-inter)" }}>{heading}</div>
                  <p style={{ fontSize:"12px",fontWeight:300,color:t.textMuted,lineHeight:1.75,letterSpacing:"0.01em" }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"96px 40px",background:"#f3f3f5",borderTop:`1px solid ${t.border}`,borderBottom:`1px solid ${t.border}` }}>
        <div style={{ maxWidth:"1440px",margin:"0 auto" }}>
          <div className="lxs-about-cta">
            <div>
              <Eyebrow label="Begin Your Collection" />
              <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(30px,3.2vw,48px)",fontWeight:300,color:t.text,lineHeight:1.12,marginBottom:"18px" }}>
                Ready to Find Your<br/>Next Piece?
              </h2>
              <p style={{ fontSize:"14px",fontWeight:300,color:t.textMuted,lineHeight:1.85,maxWidth:"420px" }}>
                Browse our current inventory, explore by brand, or reach out to our team with a specific piece in mind. Every inquiry receives a personal response.
              </p>
            </div>
            <div className="lxs-about-cta-btns" style={{ display:"flex",gap:"14px",flexWrap:"wrap" }}>
              <Link href="/shop" style={{ flex:"1 1 160px",padding:"18px 28px",background:t.gold,textDecoration:"none",display:"flex",flexDirection:"column",gap:"4px",transition:"background 0.2s" }}
                onMouseEnter={e=>e.currentTarget.style.background=t.goldLight} onMouseLeave={e=>e.currentTarget.style.background=t.gold}>
                <span style={{ fontSize:"8px",letterSpacing:"0.22em",textTransform:"uppercase",color:"#fff",fontWeight:500,opacity:0.75 }}>Explore</span>
                <span style={{ fontFamily:"var(--font-playfair)",fontSize:"20px",fontWeight:400,color:"#fff",lineHeight:1.2 }}>Browse Collection</span>
              </Link>
              <Link href="/contact" style={{ flex:"1 1 160px",padding:"18px 28px",background:"transparent",border:`1px solid ${t.border}`,textDecoration:"none",display:"flex",flexDirection:"column",gap:"4px",transition:"border-color 0.2s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=t.gold+"60"} onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>
                <span style={{ fontSize:"8px",letterSpacing:"0.22em",textTransform:"uppercase",color:t.textDim,fontWeight:500,opacity:0.75 }}>Speak With Us</span>
                <span style={{ fontFamily:"var(--font-playfair)",fontSize:"20px",fontWeight:400,color:t.text,lineHeight:1.2 }}>Get In Touch</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
