'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import type { SiteSettings, ContactPageText } from '@/lib/payload'

const TOPIC_PLACEHOLDER = "Select a topic…"

function MapEmbed({ address }: { address: SiteSettings['address'] }) {
  const { t } = useTheme()
  const src = address.mapEmbedUrl ||
    `https://maps.google.com/maps?q=${encodeURIComponent(`${address.line1}, ${address.city}, ${address.state} ${address.zip}`)}&output=embed&zoom=15`
  return (
    <div style={{ position:"relative", height:"100%", minHeight:"340px", border:`1px solid ${t.border}`, overflow:"hidden" }}>
      <iframe
        src={src}
        width="100%" height="100%"
        style={{ border:0, display:"block", minHeight:"340px", filter:"grayscale(15%) contrast(96%)" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Luxus Collection location"
      />
      <div style={{ position:"absolute",bottom:"16px",left:"16px",background:"rgba(255,255,255,0.96)",border:`1px solid ${t.border}`,borderLeft:`2px solid ${t.gold}`,padding:"10px 14px",backdropFilter:"blur(8px)",pointerEvents:"none" }}>
        <div style={{ fontSize:"7.5px",letterSpacing:"0.2em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"3px" }}>Headquarters</div>
        <div style={{ fontSize:"12px",fontWeight:300,color:t.text,lineHeight:1.5 }}>
          Luxus Collection, LLC<br/>
          {address.line1}<br/>
          {address.city}, {address.state} {address.zip}
        </div>
      </div>
    </div>
  )
}

export default function ContactPage({ settings, text = {} }: { settings: SiteSettings; text?: ContactPageText }) {
  const { t } = useTheme()
  const { contact, address, hours, social } = settings

  const c = {
    headline:      text.headline      ?? "We’d Love to\nHear from You.",
    introParagraph: text.introParagraph ?? "Whether you’re inquiring about a specific piece, considering a consignment, or simply want to talk firearms with someone who cares as much as you do, our team is here.",
    topics: [TOPIC_PLACEHOLDER, ...[text.topic1, text.topic2, text.topic3, text.topic4, text.topic5, text.topic6, text.topic7, text.topic8, text.topic9, text.topic10].filter((t): t is string => !!t)],
    emailChannelSub: text.emailChannelSub ?? "Response within 1 business day",
    salesChannelSub: text.salesChannelSub ?? "Submit pieces for review\nResponse within 3 business days",
    pressChannelSub: text.pressChannelSub ?? "Media inquiries & editorial requests",
    expects: [
      [text.expect1Title ?? "We Read Every Message",  text.expect1Body ?? "No automated routing, no ticket queue. Every message is read by a team member who knows the inventory."],
      [text.expect2Title ?? "Honest, Direct Replies", text.expect2Body ?? "If we don’t have the piece you’re after, we’ll tell you, and often suggest where you might find it."],
      [text.expect3Title ?? "No Hard Sell",           text.expect3Body ?? "Our team is here to inform and assist, not to close. If the right piece isn’t in our collection, we’ll say so."],
      [text.expect4Title ?? "Follow-Through",         text.expect4Body ?? "If we say we’ll follow up, we follow up. Complex inquiries don’t fall through the cracks."],
    ] as [string, string][],
  }

  const SOCIALS = [
    { label: "Facebook",    href: social.facebook,   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: "Instagram",   href: social.instagram,  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg> },
    { label: "LinkedIn",    href: social.linkedin,   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="2" y="9" width="4" height="12" stroke="currentColor" strokeWidth="1.5"/><circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.5"/></svg> },
    { label: "X / Twitter", href: social.twitter,    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 4L20 20M20 4L4 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
    { label: "YouTube",     href: social.youtube,    icon: <svg width="14" height="10" viewBox="0 0 24 17" fill="none"><path d="M22.5 2.5C22.5 2.5 22.2 0.7 21.4-0.1C20.4-1.2 19.3-1.2 18.8-1.3C15.7-1.5 11-1.5 11-1.5C11-1.5 6.3-1.5 3.2-1.3C2.7-1.2 1.6-1.2 0.6-0.1C-0.2 0.7-0.5 2.5-0.5 2.5S-0.8 4.6-0.8 6.7V8.7C-0.8 10.8-0.5 12.9-0.5 12.9C-0.5 12.9-0.2 14.7 0.6 15.5C1.6 16.6 2.9 16.6 3.5 16.7C5.6 16.9 11 17 11 17C11 17 15.7 17 18.8 16.8C19.3 16.7 20.4 16.7 21.4 15.6C22.2 14.8 22.5 13 22.5 13C22.5 13 22.8 10.9 22.8 8.8V6.8C22.8 4.6 22.5 2.5 22.5 2.5ZM8.7 11.8V4.8L15.5 8.3L8.7 11.8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
    { label: "Pinterest",   href: social.pinterest,  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.477 2 2 6.477 2 12C2 16.236 4.636 19.854 8.356 21.312C8.268 20.55 8.188 19.373 8.388 18.532C8.568 17.774 9.532 13.69 9.532 13.69C9.532 13.69 9.248 13.124 9.248 12.282C9.248 10.956 10.024 9.966 10.988 9.966C11.804 9.966 12.196 10.574 12.196 11.306C12.196 12.124 11.676 13.344 11.408 14.474C11.184 15.418 11.876 16.186 12.808 16.186C14.496 16.186 15.796 14.394 15.796 11.82C15.796 9.544 14.148 7.952 11.816 7.952C9.124 7.952 7.546 9.974 7.546 12.064C7.546 12.882 7.858 13.758 8.248 14.236C8.328 14.332 8.34 14.416 8.316 14.514C8.248 14.8 8.08 15.458 8.048 15.594C8.008 15.77 7.908 15.808 7.724 15.72C6.548 15.158 5.808 13.41 5.808 12.022C5.808 9.044 7.988 6.306 12.048 6.306C15.332 6.306 17.876 8.642 17.876 11.778C17.876 15.056 15.82 17.686 12.988 17.686C12.028 17.686 11.124 17.188 10.812 16.598L10.26 18.696C10.06 19.462 9.524 20.424 9.172 21C10.088 21.28 11.028 21.43 12 21.43C17.523 21.43 22 16.953 22 11.43C22 5.907 17.523 2 12 2Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  ].filter(s => s.href)

  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", phone:"", company:"", topic: TOPIC_PLACEHOLDER, message:"", newsletter: false })
  const [formStatus, setFormStatus] = useState<"idle"|"submitting"|"success"|"error">("idle")
  const [activeChannel, setActiveChannel] = useState<string|null>(null)

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }))
  const canSubmit = form.firstName && form.email && form.topic !== TOPIC_PLACEHOLDER

  const handleSubmit = async () => {
    if (!canSubmit) return
    setFormStatus("submitting")
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mailbox: 'info',
          subject: `Contact Form: ${form.topic} — ${form.firstName} ${form.lastName}`,
          ...form,
          newsletter: undefined,
        }),
      })
      if (!res.ok) throw new Error()
      if (form.newsletter) {
        await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, name: `${form.firstName} ${form.lastName}`.trim(), source: 'contact-form' }),
        }).catch(() => {})
      }
      setFormStatus("success")
    } catch {
      setFormStatus("error")
    }
  }

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    background: "#ffffff",
    border: `1px solid ${t.border}`, color: t.text,
    fontSize: "12.5px", fontFamily: "var(--font-inter)",
    fontWeight: 300, letterSpacing: "0.02em", outline: "none",
    borderRadius: "1px", transition: "border-color 0.2s",
  } as const

  const labelStyle = {
    display: "block", fontSize: "8px", letterSpacing: "0.2em",
    textTransform: "uppercase" as const, color: t.textDim, fontWeight: 500, marginBottom: "6px",
  }

  const CHANNELS = [
    { id:"phone", icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 2C3 2 1 2 1 4C1 6 2 12.5 8.5 18C15 23.5 21 21.5 21 21.5S22 19.5 22 18L18 14.5C18 14.5 17 13.5 15.5 15L13.5 17C13.5 17 10.5 16.5 7.5 13.5C4.5 10.5 5 7.5 5 7.5L7 5.5C8.5 4 7.5 3 7.5 3L3 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>, label:"Call Us", heading:contact.phone, sub:`Toll-Free  ${contact.phoneTollFree}\nMon – Fri  ${hours.weekdayOpen} – ${hours.weekdayClose} ${hours.timezone}\nSat  ${hours.saturdayOpen} – ${hours.saturdayClose} ${hours.timezone}`, href:`tel:${contact.phone.replace(/\D/g,'')}`, cta:"Call now" },
    { id:"email", icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="1.5" y="4" width="19" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 6.5L11 13L20.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, label:"Email Us", heading:contact.emailInfo, sub:c.emailChannelSub, href:`mailto:${contact.emailInfo}`, cta:"Send email" },
    { id:"consignment", icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 11H19M3 11L7 7M3 11L7 15M19 11L15 7M19 11L15 15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>, label:"Sales / Consignment", heading:contact.emailSales, sub:c.salesChannelSub, href:`mailto:${contact.emailSales}`, cta:"Sales inquiry" },
    { id:"press", icon:<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="4" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M6 8H16M6 11H12M6 14H9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>, label:"Press & Media", heading:contact.emailPress, sub:c.pressChannelSub, href:`mailto:${contact.emailPress}`, cta:"Media inquiry" },
  ]

  return (
    <div className="lxs-contact-page" style={{ background: t.bg, color: t.text, fontFamily: "var(--font-inter)" }}>

      {/* HERO BANNER */}
      <div style={{ background: "linear-gradient(to bottom,#f3f3f5,#ffffff)", borderBottom: `1px solid ${t.border}`, padding: "52px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position:"absolute",bottom:0,right:0,width:"40%",height:"100%",background:`radial-gradient(ellipse at right,${t.gold}08,transparent 70%)`,pointerEvents:"none" }}/>
        <div style={{ maxWidth: "1440px", margin: "0 auto", position: "relative" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"24px" }}>
            {["Home","Contact"].map((c,i,a) => (
              <div key={c} style={{ display:"flex",alignItems:"center",gap:"8px" }}>
                {i>0&&<span style={{ fontSize:"9px",color:t.textDim }}>›</span>}
                <span style={{ fontSize:"10px",color:i<a.length-1?t.textDim:t.textMuted,fontWeight:300 }}>
                  {i<a.length-1 ? <Link href="/" style={{ textDecoration:"none",color:"inherit" }}>{c}</Link> : c}
                </span>
              </div>
            ))}
          </div>

          <div className="lxs-contact-hero">
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px" }}>
                <div style={{ width:"18px",height:"1px",background:t.gold }}/>
                <span style={{ fontSize:"8.5px",letterSpacing:"0.26em",textTransform:"uppercase",color:t.gold,fontWeight:500 }}>Get In Touch</span>
              </div>
              <h1 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(36px,4.5vw,62px)",fontWeight:300,color:t.text,lineHeight:1.07,letterSpacing:"0.01em",marginBottom:"18px" }}>
                {c.headline.split('\n').map((line, i, a) => <span key={i}>{line}{i < a.length - 1 && <br/>}</span>)}
              </h1>
              <p style={{ fontSize:"14.5px",fontWeight:300,color:t.textMuted,lineHeight:1.82,maxWidth:"420px",letterSpacing:"0.02em" }}>
                {c.introParagraph}
              </p>
            </div>

            <div className="lxs-contact-direct" style={{ display:"flex",flexDirection:"column",gap:"12px" }}>
              <div style={{ fontSize:"8px",letterSpacing:"0.22em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"4px" }}>Direct Contact</div>
              {[
                { label:"Phone",     value:contact.phone,         href:`tel:${contact.phone.replace(/\D/g,'')}`,         note:`Mon – Fri ${hours.weekdayOpen} – ${hours.weekdayClose} ${hours.timezone}` },
                { label:"Toll-Free", value:contact.phoneTollFree, href:`tel:${contact.phoneTollFree.replace(/\D/g,'')}`, note:"Nationwide" },
                { label:"Email",     value:contact.emailInfo,     href:`mailto:${contact.emailInfo}`,                    note:"Response within 1 business day" },
                { label:"Support",   value:contact.emailSupport,  href:`mailto:${contact.emailSupport}`,                 note:"For order & after-sale help" },
              ].map(({ label, value, href, note }) => (
                <a key={label} href={href}
                  style={{ display:"flex",alignItems:"baseline",justifyContent:"space-between",padding:"12px 16px",background:"#fff",border:`1px solid ${t.border}`,textDecoration:"none",transition:"border-color 0.2s",gap:"16px" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=t.gold+"60"} onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>
                  <div>
                    <span style={{ fontSize:"8px",letterSpacing:"0.2em",textTransform:"uppercase",color:t.textDim,fontWeight:500,display:"block",marginBottom:"4px" }}>{label}</span>
                    <span style={{ fontFamily:"var(--font-playfair)",fontSize:"17px",fontWeight:400,color:t.text,letterSpacing:"0.01em",wordBreak:"break-all" }}>{value}</span>
                  </div>
                  <span style={{ fontSize:"10px",fontWeight:300,color:t.textDim,whiteSpace:"nowrap",flexShrink:0 }}>{note}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CONTACT CHANNELS */}
      <div style={{ maxWidth:"1440px",margin:"0 auto",padding:"52px 40px 0" }}>
        <div className="lxs-contact-channels">
          {CHANNELS.map(ch => {
            const hov = activeChannel === ch.id
            return (
              <a key={ch.id} href={ch.href}
                onMouseEnter={() => setActiveChannel(ch.id)} onMouseLeave={() => setActiveChannel(null)}
                style={{ padding:"24px",background:hov?"#fafafa":t.bgCard,border:`1px solid ${hov?t.gold+"55":t.border}`,textDecoration:"none",display:"flex",flexDirection:"column",gap:"14px",transition:"all 0.25s",boxShadow:hov?"0 12px 40px rgba(0,0,0,0.07)":"none" }}>
                <div style={{ color:t.gold }}>{ch.icon}</div>
                <div>
                  <div style={{ fontSize:"8px",letterSpacing:"0.2em",textTransform:"uppercase",color:t.textDim,fontWeight:500,marginBottom:"5px" }}>{ch.label}</div>
                  <div style={{ fontFamily:"var(--font-playfair)",fontSize:"15px",fontWeight:400,color:hov?t.gold:t.text,lineHeight:1.3,transition:"color 0.22s",marginBottom:"5px",letterSpacing:"0.01em",wordBreak:"break-all" }}>{ch.heading}</div>
                  {ch.sub.split("\n").map((line,i) => <div key={i} style={{ fontSize:"10.5px",fontWeight:300,color:t.textDim,letterSpacing:"0.02em",lineHeight:1.5 }}>{line}</div>)}
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:"6px",fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginTop:"auto",paddingTop:"10px",borderTop:`1px solid ${t.border}` }}>
                  {ch.cta}
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4H9M6 1L9 4L6 7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </a>
            )
          })}
        </div>
      </div>

      {/* CONTACT FORM + MAP */}
      <div style={{ maxWidth:"1440px",margin:"0 auto",padding:"64px 40px 0" }}>
        <div className="lxs-contact-form-map">

          {/* Form */}
          <div>
            <div style={{ marginBottom:"32px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"10px" }}>
                <div style={{ width:"18px",height:"1px",background:t.gold }}/>
                <span style={{ fontSize:"8.5px",letterSpacing:"0.26em",textTransform:"uppercase",color:t.gold,fontWeight:500 }}>Send a Message</span>
              </div>
              <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(26px,2.8vw,40px)",fontWeight:300,color:t.text,lineHeight:1.15 }}>Drop Us a Line</h2>
            </div>

            {formStatus === "success" ? (
              <div style={{ padding:"60px 40px",border:`1px solid ${t.border}`,background:"#fff",textAlign:"center" }}>
                <div style={{ width:"52px",height:"52px",border:`1px solid ${t.gold}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px" }}>
                  <svg width="20" height="15" viewBox="0 0 20 15" fill="none"><path d="M1 7.5L7 13.5L19 1.5" stroke={t.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ fontFamily:"var(--font-playfair)",fontSize:"30px",fontWeight:300,color:t.text,marginBottom:"12px" }}>Message Sent</div>
                <p style={{ fontSize:"13.5px",fontWeight:300,color:t.textMuted,lineHeight:1.8,maxWidth:"380px",margin:"0 auto 24px" }}>
                  Thank you, {form.firstName}. We&apos;ll be in touch at <span style={{ color:t.text }}>{form.email}</span> within one business day.
                </p>
                <button onClick={() => { setFormStatus("idle"); setForm({ firstName:"",lastName:"",email:"",phone:"",company:"",topic:TOPIC_PLACEHOLDER,message:"",newsletter:false }) }}
                  style={{ fontSize:"9.5px",letterSpacing:"0.16em",textTransform:"uppercase",color:t.gold,background:"none",border:`1px solid ${t.gold}50`,padding:"10px 24px",cursor:"pointer",fontFamily:"var(--font-inter)",fontWeight:500 }}>
                  Send Another
                </button>
              </div>
            ) : (
              <div style={{ background:"#fff",border:`1px solid ${t.border}`,padding:"36px" }}>
                <div className="lxs-form-row" style={{ marginBottom:"14px" }}>
                  {[["firstName","First Name *","James"],["lastName","Last Name","Whitfield"]].map(([k,l,p]) => (
                    <div key={k}>
                      <label style={labelStyle}>{l}</label>
                      <input type="text" placeholder={p} value={form[k as keyof typeof form] as string} onChange={e=>set(k,e.target.value)} style={inputStyle} className="lxs-form-field"/>
                    </div>
                  ))}
                </div>
                <div className="lxs-form-row" style={{ marginBottom:"14px" }}>
                  {[["email","Email Address *","you@example.com","email"],["phone","Phone Number","(555) 000-0000","tel"]].map(([k,l,p,type]) => (
                    <div key={k}>
                      <label style={labelStyle}>{l}</label>
                      <input type={type} placeholder={p} value={form[k as keyof typeof form] as string} onChange={e=>set(k,e.target.value)} style={inputStyle} className="lxs-form-field"/>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom:"14px" }}>
                  <label style={labelStyle}>Company / Publication <span style={{ color:t.textDim,fontWeight:300,textTransform:"none",letterSpacing:"0.04em" }}>(optional)</span></label>
                  <input type="text" placeholder="e.g. Guns & Ammo, Independent Collector" value={form.company} onChange={e=>set("company",e.target.value)} style={inputStyle} className="lxs-form-field"/>
                </div>
                <div style={{ marginBottom:"14px" }}>
                  <label style={labelStyle}>Topic <span style={{ color:t.gold }}>*</span></label>
                  <select value={form.topic} onChange={e=>set("topic",e.target.value)} className="lxs-form-field"
                    style={{ ...inputStyle, appearance:"none" as const, backgroundImage:`url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0.5 0.5L5 5L9.5 0.5' stroke='%235e5448' stroke-width='1.2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center", paddingRight:"36px", cursor:"pointer" }}>
                    {c.topics.map(tp => <option key={tp} value={tp} disabled={tp===TOPIC_PLACEHOLDER}>{tp}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom:"18px" }}>
                  <label style={labelStyle}>Message</label>
                  <textarea rows={5} placeholder="Tell us what's on your mind…" value={form.message} onChange={e=>set("message",e.target.value)} style={{ ...inputStyle, lineHeight:1.75 }} className="lxs-form-field"/>
                </div>
                <label style={{ display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:"24px",cursor:"pointer" }}>
                  <div onClick={() => set("newsletter",!form.newsletter)}
                    style={{ width:"14px",height:"14px",flexShrink:0,marginTop:"1px",border:`1px solid ${form.newsletter?t.gold:t.border}`,background:form.newsletter?t.gold:"transparent",transition:"all 0.18s",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"1px" }}>
                    {form.newsletter&&<svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontSize:"11px",color:t.textMuted,fontWeight:300,lineHeight:1.65,letterSpacing:"0.01em" }}>
                    Sign me up for The Collector&apos;s Circle — new acquisitions, editorial features, and exclusive access.
                  </span>
                </label>
                <button onClick={handleSubmit} disabled={!canSubmit || formStatus==="submitting"}
                  style={{ width:"100%",padding:"14px",background:canSubmit?t.gold:t.gold+"55",border:"none",color:"#fff",fontSize:"9.5px",letterSpacing:"0.18em",textTransform:"uppercase",fontFamily:"var(--font-inter)",fontWeight:600,cursor:canSubmit?"pointer":"not-allowed",borderRadius:"1px",transition:"all 0.22s" }}
                  onMouseEnter={e=>{ if(canSubmit) (e.currentTarget as HTMLButtonElement).style.background=t.goldLight }}
                  onMouseLeave={e=>{ if(canSubmit) (e.currentTarget as HTMLButtonElement).style.background=t.gold }}>
                  {formStatus==="submitting"?"Sending…":"Send Message"}
                </button>
                {formStatus === "error" && (
                  <p style={{ fontSize:"11px",color:"#c0392b",textAlign:"center",marginTop:"8px",fontFamily:"var(--font-inter)" }}>
                    Something went wrong — please try again or email us directly.
                  </p>
                )}
                <p style={{ fontSize:"10px",color:t.textDim,textAlign:"center",marginTop:"12px",letterSpacing:"0.03em",fontWeight:300 }}>
                  Fields marked <span style={{ color:t.gold }}>*</span> are required · We respond within 1 business day
                </p>
              </div>
            )}
          </div>

          {/* Right column: map + hours + social */}
          <div style={{ display:"flex",flexDirection:"column",gap:"28px" }}>
            <div>
              <div style={{ fontSize:"8px",letterSpacing:"0.24em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"14px",display:"flex",alignItems:"center",gap:"10px" }}>
                <div style={{ width:"14px",height:"1px",background:t.gold }}/>Location
              </div>
              <MapEmbed address={address} />
              <div style={{ marginTop:"12px", padding:"10px 14px", background:"#faf9f6", border:`1px solid ${t.border}`, borderLeft:`2px solid ${t.gold}` }}>
                <div style={{ fontSize:"8px", letterSpacing:"0.2em", textTransform:"uppercase", color:t.gold, fontWeight:500, marginBottom:"4px", fontFamily:"var(--font-inter)" }}>By Appointment Only</div>
                <p style={{ fontSize:"12px", fontWeight:300, color:t.textDim, lineHeight:1.65, margin:0, fontFamily:"var(--font-inter)" }}>
                  Our showroom is open by appointment only. Please call or email us to schedule a visit and we will be happy to arrange a time that works for you.
                </p>
              </div>
            </div>
            <div style={{ background:"#fff",border:`1px solid ${t.border}`,borderLeft:`2px solid ${t.gold}40`,padding:"20px 22px" }}>
              <div style={{ fontSize:"8px",letterSpacing:"0.22em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"14px" }}>Business Hours</div>
              {([
                ["Monday – Friday", `${hours.weekdayOpen} – ${hours.weekdayClose} ${hours.timezone}`],
                ["Saturday", `${hours.saturdayOpen} – ${hours.saturdayClose} ${hours.timezone}`],
                ["Sunday", hours.sundayClosed ? "Closed" : `${hours.saturdayOpen} – ${hours.saturdayClose} ${hours.timezone}`],
              ] as [string, string][]).map(([day, hrs]) => (
                <div key={day} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:"8px",marginBottom:"8px",borderBottom:`1px solid ${t.border}` }}>
                  <span style={{ fontSize:"11.5px",fontWeight:300,color:t.textMuted,letterSpacing:"0.02em" }}>{day}</span>
                  <span style={{ fontSize:"11.5px",fontWeight:hrs==="Closed"?300:400,color:hrs==="Closed"?t.textDim:t.text,letterSpacing:"0.02em" }}>{hrs}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:"8px",letterSpacing:"0.24em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"14px",display:"flex",alignItems:"center",gap:"10px" }}>
                <div style={{ width:"14px",height:"1px",background:t.gold }}/>Follow Along
              </div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:"8px" }}>
                {SOCIALS.map(({ label, href, icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label}
                    style={{ width:"36px",height:"36px",border:`1px solid ${t.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:t.textMuted,textDecoration:"none",transition:"all 0.18s" }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor=t.gold+"60"; e.currentTarget.style.color=t.gold; e.currentTarget.style.background="#fafafa" }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor=t.border; e.currentTarget.style.color=t.textMuted; e.currentTarget.style.background="transparent" }}>
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WHAT TO EXPECT */}
      <section style={{ padding:"80px 40px",margin:"64px 0 0",background:"#f3f3f5",borderTop:`1px solid ${t.border}`,borderBottom:`1px solid ${t.border}` }}>
        <div style={{ maxWidth:"1440px",margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:"48px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"10px",justifyContent:"center" }}>
              <div style={{ width:"18px",height:"1px",background:t.gold }}/>
              <span style={{ fontSize:"8.5px",letterSpacing:"0.26em",textTransform:"uppercase",color:t.gold,fontWeight:500 }}>What To Expect</span>
              <div style={{ width:"18px",height:"1px",background:t.gold }}/>
            </div>
            <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(26px,2.8vw,38px)",fontWeight:300,color:t.text,lineHeight:1.15 }}>
              Every Inquiry Gets a Personal Response
            </h2>
          </div>
          <div className="lxs-contact-expect">
            {c.expects.map(([title, body], i) => ({ n: String(i + 1).padStart(2, '0'), title, body })).map(({ n, title, body }) => (
              <div key={n} style={{ padding:"26px 22px",background:"#fff",border:`1px solid ${t.border}` }}>
                <div style={{ fontFamily:"var(--font-playfair)",fontSize:"36px",fontWeight:300,color:t.gold,lineHeight:1,marginBottom:"14px",opacity:0.45 }}>{n}</div>
                <div style={{ fontSize:"8.5px",letterSpacing:"0.18em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"8px" }}>{title}</div>
                <p style={{ fontSize:"12.5px",fontWeight:300,color:t.textMuted,lineHeight:1.78,letterSpacing:"0.01em" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
