'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import type { PolicyData, SiteSettings } from '@/lib/payload'

export type PolicySlug = 'shipping' | 'privacy' | 'terms'

export default function PolicyPage({ policy, data, settings }: { policy: PolicySlug; data: PolicyData; settings?: SiteSettings }) {
  const { t } = useTheme()
  const [activeSection, setActiveSection] = useState<number | null>(null)
  const doc = data

  useEffect(() => {
    const fn = () => {
      const headings = doc.sections.map((_,i) => document.getElementById(`section-${i}`)).filter(Boolean) as HTMLElement[]
      for (let i = headings.length-1; i >= 0; i--) {
        if (headings[i].getBoundingClientRect().top <= 110) {
          setActiveSection(i)
          return
        }
      }
      setActiveSection(null)
    }
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [doc])

  const RELATED: [PolicySlug, string, string][] = [
    ["shipping","Shipping & Returns","/shipping"],
    ["privacy","Privacy Policy","/privacy"],
    ["terms","Terms & Conditions","/terms"],
  ]

  return (
    <div style={{ background:t.bg,color:t.text,fontFamily:"var(--font-inter)" }}>

      {/* BANNER */}
      <div style={{ background:"linear-gradient(to bottom,#f3f3f5,#ffffff)",borderBottom:`1px solid ${t.border}`,padding:"52px 40px 40px" }}>
        <div style={{ maxWidth:"1440px",margin:"0 auto" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"20px" }}>
            {["Home","Legal",doc.title].map((c,i,a) => (
              <div key={c} style={{ display:"flex",alignItems:"center",gap:"8px" }}>
                {i>0&&<span style={{ fontSize:"9px",color:t.textDim }}>›</span>}
                <span style={{ fontSize:"10px",color:i<a.length-1?t.textDim:t.textMuted,fontWeight:300 }}>
                  {i===0 ? <Link href="/" style={{ textDecoration:"none",color:"inherit" }}>{c}</Link> : c}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px" }}>
            <div style={{ width:"18px",height:"1px",background:t.gold }}/>
            <span style={{ fontSize:"8.5px",letterSpacing:"0.26em",textTransform:"uppercase",color:t.gold,fontWeight:500 }}>{doc.eyebrow}</span>
          </div>
          <h1 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(30px,3.5vw,52px)",fontWeight:400,color:t.text,lineHeight:1.1,marginBottom:"10px" }}>{doc.title}</h1>
          <div style={{ fontSize:"11px",color:t.textDim,fontWeight:300 }}>Last updated: {doc.lastUpdated}</div>
          <div style={{ display:"flex",gap:"12px",marginTop:"24px",flexWrap:"wrap" }}>
            {RELATED.map(([key,label,href]) => (
              <Link key={key} href={href}
                style={{ padding:"7px 16px",border:`1px solid ${key===policy?t.gold+"60":t.border}`,background:key===policy?"#f3f3f5":"transparent",fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",color:key===policy?t.gold:t.textMuted,textDecoration:"none",fontWeight:500,transition:"all 0.18s" }}
                onMouseEnter={e=>{ if(key!==policy){e.currentTarget.style.color=t.gold;e.currentTarget.style.borderColor=t.gold+"50"} }}
                onMouseLeave={e=>{ if(key!==policy){e.currentTarget.style.color=t.textMuted;e.currentTarget.style.borderColor=t.border} }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth:"1440px",margin:"0 auto",padding:"52px 40px 96px" }}>
        <div className="lxs-policy-layout">

          {/* ToC */}
          <aside style={{ position:"sticky",top:"88px" }}>
            <div style={{ fontSize:"8px",letterSpacing:"0.24em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"14px",display:"flex",alignItems:"center",gap:"10px" }}>
              <div style={{ width:"14px",height:"1px",background:t.gold }}/>Contents
            </div>
            <div style={{ display:"flex",flexDirection:"column" }}>
              {doc.sections.map((s,i) => (
                <button key={i} onClick={()=>{ const el=document.getElementById(`section-${i}`); if(el) el.scrollIntoView({behavior:"smooth",block:"start"}) }}
                  style={{ background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:"8px 12px",fontFamily:"var(--font-inter)",fontSize:"11.5px",fontWeight:300,color:activeSection===i?t.gold:t.textMuted,letterSpacing:"0.01em",lineHeight:1.4,borderLeft:`2px solid ${activeSection===i?t.gold:t.border}`,transition:"all 0.2s" }}
                  onMouseEnter={e=>{ if(activeSection!==i){ e.currentTarget.style.color=t.text; e.currentTarget.style.borderLeftColor=t.borderHover } }}
                  onMouseLeave={e=>{ if(activeSection!==i){ e.currentTarget.style.color=t.textMuted; e.currentTarget.style.borderLeftColor=t.border } }}>
                  {s.heading}
                </button>
              ))}
            </div>
          </aside>

          {/* Sections */}
          <article style={{ maxWidth:"680px" }}>
            {doc.sections.map((section, i) => (
              <div key={i} id={`section-${i}`} style={{ marginBottom:"44px",scrollMarginTop:"96px" }}>
                <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"22px",fontWeight:500,color:t.text,lineHeight:1.25,marginBottom:"14px",letterSpacing:"0.01em" }}>
                  {section.heading}
                </h2>
                <div style={{ height:"1px",background:`linear-gradient(to right,${t.gold}40,transparent)`,marginBottom:"14px" }}/>
                <p style={{ fontSize:"14.5px",fontWeight:300,lineHeight:1.9,color:t.textMuted,letterSpacing:"0.015em" }}>
                  {section.body}
                </p>
              </div>
            ))}
            <div style={{ marginTop:"52px",padding:"24px 28px",background:"#fff",border:`1px solid ${t.border}`,borderLeft:`2px solid ${t.gold}40` }}>
              <div style={{ fontSize:"8.5px",letterSpacing:"0.2em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"10px" }}>Questions about this policy?</div>
              <p style={{ fontSize:"13px",fontWeight:300,color:t.textMuted,lineHeight:1.75,marginBottom:"12px" }}>We&apos;re happy to clarify anything. Reach out directly:</p>
              <div style={{ display:"flex",gap:"24px",flexWrap:"wrap" }}>
                <a href={`mailto:${settings?.contact.emailInfo ?? "info@luxus-collection.com"}`} style={{ fontSize:"13px",color:t.gold,textDecoration:"none",fontWeight:300 }}>{settings?.contact.emailInfo ?? "info@luxus-collection.com"}</a>
                <a href={`tel:${(settings?.contact.phone ?? "(941) 253-3660").replace(/\D/g,'')}`} style={{ fontSize:"13px",color:t.textMuted,textDecoration:"none",fontWeight:300 }}>{settings?.contact.phone ?? "(941) 253-3660"}</a>
                <a href={`tel:${(settings?.contact.phoneTollFree ?? "(833) 486-6659").replace(/\D/g,'')}`} style={{ fontSize:"13px",color:t.textMuted,textDecoration:"none",fontWeight:300 }}>{settings?.contact.phoneTollFree ?? "(833) 486-6659"} · Toll-Free</a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}
