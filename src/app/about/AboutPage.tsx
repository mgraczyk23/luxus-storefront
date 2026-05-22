'use client'

import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'

function ImgBox({ style = {}, index = 0 }: { style?: React.CSSProperties; index?: number }) {
  const { isDark, t } = useTheme()
  const d = ["#171717,#222222","#1a1a1a,#262626","#161616,#1e1e1e","#1e1e1e,#262626","#161616,#1f1f1f"]
  const l = ["#e8e8eb,#d4d4d8","#e8e8eb,#d4d4d8","#e8e8eb,#d4d4d8","#e8e8eb,#d4d4d8","#e8e8eb,#d4d4d8"]
  const [c1, c2] = (isDark ? d : l)[index % 5].split(",")
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

function Eyebrow({ label }: { label: string }) {
  const { t } = useTheme()
  return (
    <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px" }}>
      <div style={{ width:"18px",height:"1px",background:t.gold }}/>
      <span style={{ fontSize:"8.5px",letterSpacing:"0.26em",textTransform:"uppercase",color:t.gold,fontWeight:500,fontFamily:"var(--font-inter)" }}>{label}</span>
    </div>
  )
}

function ValueCard({ number, title, body }: { number: string; title: string; body: string }) {
  const { isDark, t } = useTheme()
  return (
    <div style={{ padding:"32px 28px",background:t.bgCard,border:`1px solid ${t.border}`,transition:"all 0.28s ease" }}
      onMouseEnter={e=>{ e.currentTarget.style.background=t.bgCardHover; e.currentTarget.style.borderColor=t.gold+"50"; e.currentTarget.style.boxShadow=isDark?"0 12px 40px rgba(0,0,0,0.4)":"0 12px 40px rgba(0,0,0,0.08)" }}
      onMouseLeave={e=>{ e.currentTarget.style.background=t.bgCard; e.currentTarget.style.borderColor=t.border; e.currentTarget.style.boxShadow="none" }}>
      <div style={{ fontFamily:"var(--font-playfair)",fontSize:"44px",fontWeight:300,color:t.gold,lineHeight:1,marginBottom:"18px",opacity:0.5 }}>{number}</div>
      <div style={{ fontSize:"8.5px",letterSpacing:"0.2em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"10px",fontFamily:"var(--font-inter)" }}>{title}</div>
      <p style={{ fontSize:"13px",fontWeight:300,color:t.textMuted,lineHeight:1.82,letterSpacing:"0.015em" }}>{body}</p>
    </div>
  )
}

function BrandTile({ name, origin, description }: { name: string; origin: string; description: string }) {
  const { isDark, t } = useTheme()
  return (
    <div style={{ padding:"24px",border:`1px solid ${t.border}`,background:"transparent",transition:"all 0.25s",cursor:"pointer" }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=t.gold+"55"; e.currentTarget.style.background=isDark?"#161616":"#fafafa" }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=t.border; e.currentTarget.style.background="transparent" }}>
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
  )
}

export default function AboutPage() {
  const { isDark, t } = useTheme()

  return (
    <div style={{ background:t.bg,color:t.text,fontFamily:"var(--font-inter)" }}>

      {/* HERO */}
      <div style={{ position:"relative",minHeight:"72vh",display:"flex",alignItems:"center",overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,background:isDark?"radial-gradient(ellipse at 65% 50%,#181818,#0c0b09 60%,#050505 100%)":"radial-gradient(ellipse at 65% 50%,#f5edd8,#f0e8d0 60%,#ebebee 100%)" }}/>
        <div style={{ position:"absolute",bottom:0,right:0,width:"50%",height:"60%",background:`radial-gradient(ellipse at bottom right,${t.gold}0d,transparent 65%)` }}/>
        <div style={{ position:"absolute",left:"50%",top:"10%",bottom:"10%",width:"1px",background:`linear-gradient(to bottom,transparent,${t.gold}28,transparent)` }}/>

        <div style={{ position:"relative",zIndex:2,maxWidth:"1440px",margin:"0 auto",padding:"80px 40px",width:"100%" }}>
          <div className="lxs-about-hero">
            <div>
              <Eyebrow label="Our Story" />
              <h1 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(44px,5.5vw,80px)",fontWeight:300,lineHeight:1.04,letterSpacing:"0.005em",color:t.text,marginBottom:"28px" }}>
                The Boutique the<br/>
                Collector <em style={{ color:t.gold,fontStyle:"italic" }}>Deserved.</em>
              </h1>
              <p style={{ fontSize:"15px",fontWeight:300,lineHeight:1.85,color:t.textMuted,maxWidth:"440px",letterSpacing:"0.025em" }}>
                Founded in 2026 with a single conviction — that collectors spending thousands on a precision firearm deserve an experience that matches the quality of what they&apos;re buying.
              </p>
              <div style={{ display:"flex",gap:"40px",marginTop:"52px",paddingTop:"32px",borderTop:`1px solid ${t.border}` }}>
                {[["450+","Curated Pieces"],["35+","Premier Brands"],["2026","Est."]].map(([n,l]) => (
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
                <ImgBox index={0} style={{ width:"100%",height:"100%" }}/>
              </div>
              <div style={{ position:"absolute",bottom:"40px",left:"-36px",background:isDark?"rgba(22,20,17,0.95)":"rgba(255,255,255,0.96)",border:`1px solid ${t.border}`,borderLeft:`2px solid ${t.gold}`,padding:"14px 18px",backdropFilter:"blur(12px)",boxShadow:isDark?"0 12px 40px rgba(0,0,0,0.5)":"0 12px 40px rgba(0,0,0,0.1)",minWidth:"200px" }}>
                <div style={{ fontSize:"7.5px",letterSpacing:"0.22em",color:t.gold,textTransform:"uppercase",fontWeight:500,marginBottom:"5px" }}>Federal Firearms Licensee</div>
                <div style={{ fontFamily:"var(--font-playfair)",fontSize:"15px",fontWeight:400,color:t.text,marginBottom:"3px" }}>License #1-59-XXX-XX-XX-55688</div>
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
            A Distinguished Showcase of Top-Tier <em style={{ color:t.gold,fontStyle:"italic" }}>Firearm Craftsmanship</em>
          </h2>
          <p style={{ fontSize:"15.5px",fontWeight:300,lineHeight:1.9,color:t.textMuted,maxWidth:"780px",margin:"0 auto 18px",letterSpacing:"0.02em" }}>
            Welcome to Luxus Collection, LLC. We have diligently assembled an extensive catalog of premium firearms from the world&apos;s most respected manufacturers, each piece exemplifying unmatched precision, reliability, and artistic excellence.
          </p>
          <p style={{ fontSize:"14px",fontWeight:300,lineHeight:1.9,color:t.textDim,maxWidth:"720px",margin:"0 auto 44px",letterSpacing:"0.02em",fontStyle:"italic" }}>
            We represent more than just a retail experience — we are a benchmark of gun-making mastery, where heritage and innovation meet.
          </p>
          <div style={{ display:"flex",flexWrap:"wrap",justifyContent:"center",gap:"10px",maxWidth:"780px",margin:"0 auto" }}>
            {["Heckler & Koch","Smith & Wesson","Ruger","SIG Sauer","Colt","Korth","Nighthawk Custom","Cabot Guns","Wilson Combat"].map(name => (
              <span key={name} style={{ padding:"9px 18px",border:`1px solid ${t.border}`,fontSize:"10.5px",letterSpacing:"0.14em",textTransform:"uppercase",color:t.textMuted,fontWeight:500,background:isDark?"#141414":"#fafafa",transition:"all 0.22s",cursor:"default" }}
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
            <div style={{ position:"sticky",top:"96px",display:"flex",flexDirection:"column",gap:"14px" }}>
              <ImgBox index={1} style={{ height:"320px",border:`1px solid ${t.border}` }}/>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px" }}>
                <ImgBox index={2} style={{ height:"180px",border:`1px solid ${t.border}` }}/>
                <ImgBox index={3} style={{ height:"180px",border:`1px solid ${t.border}` }}/>
              </div>
            </div>
            <div>
              <Eyebrow label="The Beginning" />
              <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(30px,3vw,44px)",fontWeight:300,color:t.text,lineHeight:1.15,marginBottom:"32px",letterSpacing:"0.01em" }}>
                A Market That Deserved Better
              </h2>
              <div style={{ display:"flex",flexDirection:"column",gap:"22px" }}>
                {[
                  "Collectors spending $5,000 on a Cabot pistol or $8,000 on a Korth revolver were navigating a fragmented market of gun shows, private sales, and general-purpose retailers that offered no curation, no expertise, and no experience befitting a purchase of that significance.",
                  "The gap was obvious to anyone paying attention. The fine watch market had long since matured into something refined — boutiques with trained staff, curated selections, detailed provenance, and service that matched the price point. The fine timepiece buyer knew exactly what they were getting and why it was worth it.",
                  "The fine firearms collector had no such equivalent. The platforms existed, but the experience didn't. Luxus Collection was built to close that gap.",
                  "We launched in 2026 with a focused inventory, direct relationships with the manufacturers we carry, and a commitment to treating every customer as the serious collector they are — not a one-time transaction.",
                ].map((para, i) => (
                  <p key={i} style={{ fontSize:"15px",fontWeight:300,lineHeight:1.9,color:i===0?t.text:t.textMuted,letterSpacing:"0.02em" }}>{para}</p>
                ))}
              </div>
              <div style={{ margin:"44px 0",padding:"0 0 0 32px",borderLeft:`3px solid ${t.gold}`,position:"relative" }}>
                <div style={{ fontFamily:"var(--font-playfair)",fontSize:"80px",lineHeight:0.65,color:t.gold,opacity:0.2,position:"absolute",top:"8px",left:"20px",fontWeight:300,userSelect:"none" }}>&ldquo;</div>
                <div style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(20px,2.2vw,26px)",fontWeight:300,fontStyle:"italic",color:t.text,lineHeight:1.6,letterSpacing:"0.01em" }}>
                  We didn&apos;t set out to sell more guns. We set out to make buying one remarkable.
                </div>
              </div>
              <p style={{ fontSize:"15px",fontWeight:300,lineHeight:1.9,color:t.textMuted,letterSpacing:"0.02em" }}>
                Today, Luxus Collection carries over 450 curated pieces from more than 35 of the world&apos;s most respected manufacturers, with every listing individually assessed for condition, provenance, and fit within our collection&apos;s standard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section style={{ padding:"96px 40px",background:isDark?"linear-gradient(to bottom,transparent,#141414 8%,#141414 92%,transparent)":"linear-gradient(to bottom,transparent,#f3f3f5 8%,#f3f3f5 92%,transparent)" }}>
        <div style={{ maxWidth:"1440px",margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:"64px" }}>
            <Eyebrow label="What We Believe" />
            <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(30px,3.2vw,48px)",fontWeight:300,color:t.text,letterSpacing:"0.01em",lineHeight:1.1 }}>Our Philosophy</h2>
            <div style={{ width:"36px",height:"1px",background:t.gold,margin:"18px auto 0" }}/>
          </div>
          <div className="lxs-about-values">
            <ValueCard number="01" title="Curation Over Inventory" body="We carry fewer pieces than a general retailer by design. Every item on our site has been individually assessed — for quality, condition, rarity, and fit within our collection's standard. If we wouldn't be proud to own it, we don't list it."/>
            <ValueCard number="02" title="Expertise Over Volume" body="Our team understands what they sell at a depth that generic retailers can't match. We know the difference between a standard Nighthawk build and a consignment Agent with provenance. That knowledge is available to every customer, at every price point."/>
            <ValueCard number="03" title="Relationship Over Transaction" body="A collector spending $4,000 on a pistol should leave the experience better informed than when they arrived — about the piece, about its maker, and about what to look for next. We measure our success by repeat customers, not first-time conversions."/>
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
                Beyond <em style={{ color:t.gold,fontStyle:"italic" }}>Commerce.</em>
              </h2>
              <p style={{ fontSize:"15px",fontWeight:300,lineHeight:1.9,color:t.textMuted,marginBottom:"20px",letterSpacing:"0.02em" }}>
                Our mission transcends commerce. We aren&apos;t only driven to offer the finest firearms — we aim to innovate and continually elevate the experience that surrounds them.
              </p>
              <p style={{ fontSize:"14px",fontWeight:300,lineHeight:1.85,color:t.textDim,letterSpacing:"0.02em" }}>
                Each piece in our catalog is more than a tool. It is an emblem of tradition, precision, and luxury, selected to set a global standard while honoring the roots of the craft.
              </p>
              <div style={{ marginTop:"36px",padding:"22px 26px",background:isDark?"#141414":"#fafafa",border:`1px solid ${t.border}`,borderLeft:`2px solid ${t.gold}` }}>
                <div style={{ fontSize:"8.5px",letterSpacing:"0.22em",textTransform:"uppercase",color:t.gold,fontWeight:600,marginBottom:"8px" }}>The Through-line</div>
                <p style={{ fontFamily:"var(--font-playfair)",fontSize:"17px",fontWeight:400,fontStyle:"italic",color:t.text,lineHeight:1.55,letterSpacing:"0.01em" }}>
                  Luxus Collection is not just a name — it&apos;s a legacy.
                </p>
              </div>
            </div>
            <div>
              <Eyebrow label="Why Choose Luxus" />
              <h3 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(22px,2.2vw,30px)",fontWeight:300,color:t.text,lineHeight:1.2,marginBottom:"28px",letterSpacing:"0.01em" }}>
                Four Pillars of the Experience
              </h3>
              <div style={{ display:"flex",flexDirection:"column" }}>
                {[
                  ["Unrivaled Expertise","Our team understands the industry's nuances in depth. Backed by years of experience, every piece is meticulously selected to align with the Luxus promise of exclusivity."],
                  ["Global Standards, Personal Touch","We pride ourselves on meeting international benchmarks while keeping every interaction deeply personal. Each client, each firearm, each inquiry is handled with the utmost care."],
                  ["Heritage Meets Innovation","We merge the artistry of traditional gunmaking with state-of-the-art technology, preserving what is timeless while continually elevating what is possible."],
                  ["From Humble Beginnings","What began with a singular conviction has grown into a renowned destination defined by passion, exclusivity, and an ever-evolving portfolio of the world's finest."],
                ].map(([title, body], i, arr) => (
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

      {/* FEATURED BRANDS */}
      <section style={{ padding:"96px 40px",background:isDark?"linear-gradient(to bottom,transparent,#141414 8%,#141414 92%,transparent)":"linear-gradient(to bottom,transparent,#f3f3f5 8%,#f3f3f5 92%,transparent)" }}>
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
            {[
              { name:"Korriphila",       origin:"Germany · Heidelberg",       description:"Among the rarest and most exclusive pistol makers in the world. Edgar Budischowsky's HSP-701 represents the absolute pinnacle of German semi-automatic engineering, hand-built in quantities so limited that a waiting list is simply part of ownership." },
              { name:"SIG Sauer",        origin:"Germany / Switzerland / USA", description:"From the original Swiss P210 to the modern P226 Legion and P320 AXG, SIG's collector and duty-grade production line represents the enduring best of European precision manufacture." },
              { name:"Heckler & Koch",   origin:"Germany · Oberndorf",        description:"Relentless German engineering applied to every pistol they produce. The P7, HK45, Mark 23, and USP series occupy a singular position — iconic design married to mechanical excellence that has never been fully replicated." },
              { name:"Colt",             origin:"USA · Hartford, CT",         description:"The original American firearm. Python, Gold Cup, Government Model, Single Action Army — Colt's heritage pieces occupy a category that no other manufacturer, American or otherwise, can genuinely claim to share." },
              { name:"Smith & Wesson",   origin:"USA · Springfield, MA",      description:"Over 170 years of American revolver and pistol heritage. The Model 29, the Performance Center series, and the classic K-frame revolvers represent the backbone of the American collecting tradition." },
              { name:"Walther",          origin:"Germany · Ulm",              description:"Precision, restraint, and nearly 140 years of German craftsmanship. From the legendary PPK and P38 to the modern PPQ and PDP, Walther's lineage spans military history and collector culture in equal measure." },
              { name:"Nighthawk Custom", origin:"USA · Berryville, AR",       description:"One pistol, one gunsmith, start to finish. Every Nighthawk 1911 is hand-fitted by a single master craftsman — a discipline that produces some of the tightest tolerances and most coveted custom-grade production pistols ever made in America." },
              { name:"Korth",            origin:"Germany · Lollar",           description:"The pinnacle of the modern collector revolver. Handcrafted in small batches with proprietary heat-treatment and tolerances measured in microns, the NXR and Sky Marshal series occupy a tier that simply has no peer in the contemporary revolver market." },
              { name:"Cabot Guns",       origin:"USA · Cabot, PA",            description:"Investment-grade American 1911s machined from billet steel to tolerances that rival Swiss watchmaking. Every Cabot is a functional work of art that commands premium collector attention and holds its value over time." },
            ].map(brand => <BrandTile key={brand.name} {...brand} />)}
          </div>
          <div style={{ marginTop:"20px",padding:"16px 24px",border:`1px solid ${t.border}`,borderStyle:"dashed",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px" }}>
            <span style={{ fontSize:"13px",fontWeight:300,color:t.textMuted,letterSpacing:"0.02em",fontStyle:"italic" }}>
              …alongside Wilson Combat, Les Baer, Ed Brown, Dan Wesson, Kimber, Springfield Armory, and more.
            </span>
            <Link href="/shop" style={{ fontSize:"9px",letterSpacing:"0.13em",textTransform:"uppercase",color:t.gold,cursor:"pointer",fontWeight:500,borderBottom:`1px solid ${t.gold}50`,paddingBottom:"1px",flexShrink:0,textDecoration:"none" }}>
              Browse All Brands
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"96px 40px",background:isDark?"#0e0e0e":"#f3f3f5",borderTop:`1px solid ${t.border}`,borderBottom:`1px solid ${t.border}` }}>
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
            <div style={{ display:"flex",gap:"14px",flexWrap:"wrap" }}>
              <Link href="/shop" style={{ flex:"1 1 160px",padding:"18px 28px",background:t.gold,textDecoration:"none",display:"flex",flexDirection:"column",gap:"4px",transition:"background 0.2s" }}
                onMouseEnter={e=>e.currentTarget.style.background=t.goldLight} onMouseLeave={e=>e.currentTarget.style.background=t.gold}>
                <span style={{ fontSize:"8px",letterSpacing:"0.22em",textTransform:"uppercase",color:isDark?"#0a0a0a":"#fff",fontWeight:500,opacity:0.75 }}>Explore</span>
                <span style={{ fontFamily:"var(--font-playfair)",fontSize:"20px",fontWeight:400,color:isDark?"#0a0a0a":"#fff",lineHeight:1.2 }}>Browse Collection</span>
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
