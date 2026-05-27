'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import type { SiteSettings } from '@/lib/payload'

const TOPICS = [
  "Select a topic…",
  "Order Status & Tracking",
  "FFL Transfer Questions",
  "Product Inquiry / Availability",
  "Pricing & Payment",
  "Returns & Exchanges",
  "Consignment & Trade-In",
  "Website / Account Issue",
  "Other",
]

function ContactCard({ icon, label, value, sub, href, cta, accent = false }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  href?: string; cta?: string; accent?: boolean
}) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  const El = href ? "a" : "div"
  return (
    <El href={href} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"flex",flexDirection:"column",gap:"12px",padding:"28px 28px 24px",background:accent?t.gold:(hov?t.bgCardHover:t.bgCard),border:`1px solid ${accent?t.gold:(hov?t.gold+"50":t.border)}`,transition:"all 0.25s",cursor:href?"pointer":"default",textDecoration:"none",boxShadow:hov&&!accent?"0 12px 40px rgba(0,0,0,0.08)":"none" }}>
      <div style={{ color:accent?"#fff":t.gold }}>{icon}</div>
      <div>
        <div style={{ fontSize:"8px",letterSpacing:"0.22em",textTransform:"uppercase",fontWeight:500,color:accent?"#fff":t.textDim,marginBottom:"6px",opacity:accent?0.75:1 }}>{label}</div>
        <div style={{ fontFamily:"var(--font-playfair)",fontSize:"22px",fontWeight:400,color:accent?"#fff":t.text,lineHeight:1.2,marginBottom:"4px" }}>{value}</div>
        <div style={{ fontSize:"11px",fontWeight:300,color:accent?"#fff":t.textMuted,letterSpacing:"0.03em",opacity:accent?0.75:1 }}>{sub}</div>
      </div>
      {cta && (
        <div style={{ display:"flex",alignItems:"center",gap:"6px",fontSize:"9px",letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:500,color:accent?"#fff":t.gold,marginTop:"auto",paddingTop:"8px",borderTop:`1px solid ${accent?"rgba(255,255,255,0.2)":t.border}` }}>
          {cta}
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4H9M6 1L9 4L6 7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      )}
    </El>
  )
}

export default function SupportPage({ settings }: { settings: SiteSettings }) {
  const { t } = useTheme()
  const { contact, hours } = settings
  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", phone:"", orderNumber:"", topic:TOPICS[0], message:"", fflConsent:false })
  const [formStatus, setFormStatus] = useState<"idle"|"submitting"|"success"|"error">("idle")

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }))
  const canSubmit = form.firstName && form.email && form.topic !== TOPICS[0]

  const handleSubmit = async () => {
    if (!canSubmit || formStatus === "submitting") return
    setFormStatus("submitting")
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mailbox: 'support',
          subject: `Support Request: ${form.topic} — ${form.firstName} ${form.lastName}`,
          ...form,
        }),
      })
      if (!res.ok) throw new Error()
      setFormStatus("success")
    } catch {
      setFormStatus("error")
    }
  }

  const inputStyle = {
    width:"100%", padding:"11px 14px",
    background:"#ffffff",
    border:`1px solid ${t.border}`, color:t.text,
    fontSize:"12.5px", fontFamily:"var(--font-inter)",
    fontWeight:300, letterSpacing:"0.02em", outline:"none",
    borderRadius:"1px", transition:"border-color 0.2s",
  } as const

  const labelStyle = {
    display:"block", fontSize:"8px", letterSpacing:"0.2em",
    textTransform:"uppercase" as const, color:t.textDim, fontWeight:500, marginBottom:"6px",
  }

  return (
    <div style={{ background:t.bg,color:t.text,fontFamily:"var(--font-inter)" }}>

      {/* BANNER */}
      <div style={{ background:"linear-gradient(to bottom,#f3f3f5,#ffffff)",borderBottom:`1px solid ${t.border}`,padding:"52px 40px" }}>
        <div style={{ maxWidth:"1440px",margin:"0 auto" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"20px" }}>
            {["Home","Support"].map((crumb,i,arr) => (
              <div key={crumb} style={{ display:"flex",alignItems:"center",gap:"8px" }}>
                {i>0&&<span style={{ fontSize:"9px",color:t.textDim }}>›</span>}
                <span style={{ fontSize:"10px",color:i<arr.length-1?t.textDim:t.textMuted,fontWeight:300 }}>
                  {i<arr.length-1 ? <Link href="/" style={{ textDecoration:"none",color:"inherit" }}>{crumb}</Link> : crumb}
                </span>
              </div>
            ))}
          </div>
          <div className="lxs-support-banner">
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px" }}>
                <div style={{ width:"18px",height:"1px",background:t.gold }}/>
                <span style={{ fontSize:"8.5px",letterSpacing:"0.26em",textTransform:"uppercase",color:t.gold,fontWeight:500 }}>We&apos;re Here to Help</span>
              </div>
              <h1 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(36px,4vw,58px)",fontWeight:300,color:t.text,lineHeight:1.08,letterSpacing:"0.01em",marginBottom:"16px" }}>Customer Support</h1>
              <p style={{ fontSize:"14px",fontWeight:300,color:t.textMuted,lineHeight:1.8,maxWidth:"440px" }}>
                Whether you have a question about an order, an FFL transfer, or a specific piece in our collection, we respond to every inquiry personally.
              </p>
            </div>
            <div style={{ background:"#fff",border:`1px solid ${t.border}`,borderLeft:`2px solid ${t.gold}50`,padding:"24px 28px" }}>
              <div style={{ fontSize:"8px",letterSpacing:"0.22em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"16px" }}>Business Hours</div>
              <div style={{ display:"flex",flexDirection:"column",gap:"8px" }}>
                {([
                  ["Monday – Friday", `${hours.weekdayOpen} – ${hours.weekdayClose} ${hours.timezone}`],
                  ["Saturday", `${hours.saturdayOpen} – ${hours.saturdayClose} ${hours.timezone}`],
                  ["Sunday", hours.sundayClosed ? "Closed" : `${hours.saturdayOpen} – ${hours.saturdayClose} ${hours.timezone}`],
                ] as [string, string][]).map(([day, hrs]) => (
                  <div key={day} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:"8px",borderBottom:`1px solid ${t.border}` }}>
                    <span style={{ fontSize:"11.5px",fontWeight:300,color:t.textMuted,letterSpacing:"0.02em" }}>{day}</span>
                    <span style={{ fontSize:"11.5px",fontWeight:400,color:hrs==="Closed"?t.textDim:t.text,letterSpacing:"0.02em" }}>{hrs}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:"14px",display:"flex",alignItems:"center",gap:"6px" }}>
                <div style={{ width:"6px",height:"6px",borderRadius:"50%",background:"#5a9a5a" }}/>
                <span style={{ fontSize:"10.5px",color:t.textMuted,fontWeight:300,letterSpacing:"0.02em" }}>
                  Typically respond within <span style={{ color:t.text,fontWeight:400 }}>1 business day</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTACT CARDS */}
      <div style={{ maxWidth:"1440px",margin:"0 auto",padding:"52px 40px 0" }}>
        <div className="lxs-support-cards">
          <ContactCard icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3.5 2C3.5 2 1.5 2 1.5 4C1.5 6 2.5 12 8 17.5C13.5 23 19.5 21.5 21.5 21.5C23.5 21.5 23.5 19.5 23.5 19.5L20.5 15C20.5 15 19.5 14 18.5 15L16 17C16 17 13.5 16.5 10.5 13.5C7.5 10.5 8 8 8 8L10.5 5.5C11.5 4.5 10.5 3.5 10.5 3.5L3.5 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>} label="Call Us Directly" value={contact.phone} sub={`Toll-Free ${contact.phoneTollFree} · Mon – Fri ${hours.weekdayOpen} – ${hours.weekdayClose} ${hours.timezone}`} href={`tel:${contact.phone.replace(/\D/g,'')}`} cta="Call now"/>
          <ContactCard accent icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="1.5" y="4" width="19" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 6.5L11 13L20.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>} label="Email Support" value={contact.emailSupport} sub="Response within 1 business day" href={`mailto:${contact.emailSupport}`} cta="Send an email"/>
          <ContactCard icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M2 2H20V16H13L8 20V16H2V2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 8H15M7 11H12" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>} label="Send a Message" value="Use the Form Below" sub="Include your order number for fastest service" cta="Scroll to form"/>
        </div>
      </div>

      {/* FORM + RESOURCES */}
      <div style={{ maxWidth:"1440px",margin:"0 auto",padding:"64px 40px 0" }}>
        <div className="lxs-support-form-layout">

          <div>
            <div style={{ marginBottom:"32px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"10px" }}>
                <div style={{ width:"18px",height:"1px",background:t.gold }}/>
                <span style={{ fontSize:"8.5px",letterSpacing:"0.26em",textTransform:"uppercase",color:t.gold,fontWeight:500 }}>Get In Touch</span>
              </div>
              <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(26px,2.8vw,38px)",fontWeight:300,color:t.text,lineHeight:1.15 }}>Send Us a Message</h2>
            </div>

            {formStatus === "success" ? (
              <div style={{ padding:"60px 40px",border:`1px solid ${t.border}`,background:"#fff",textAlign:"center" }}>
                <div style={{ width:"52px",height:"52px",border:`1px solid ${t.gold}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px" }}>
                  <svg width="20" height="15" viewBox="0 0 20 15" fill="none"><path d="M1 7.5L7 13.5L19 1.5" stroke={t.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ fontFamily:"var(--font-playfair)",fontSize:"28px",fontWeight:300,color:t.text,marginBottom:"12px" }}>Message Received</div>
                <p style={{ fontSize:"13px",fontWeight:300,color:t.textMuted,lineHeight:1.8,maxWidth:"380px",margin:"0 auto 24px" }}>
                  Thank you for reaching out. A member of our team will respond to <span style={{ color:t.text }}>{form.email}</span> within one business day.
                </p>
                <button onClick={()=>{ setFormStatus("idle"); setForm({ firstName:"",lastName:"",email:"",phone:"",orderNumber:"",topic:TOPICS[0],message:"",fflConsent:false }) }}
                  style={{ fontSize:"9.5px",letterSpacing:"0.16em",textTransform:"uppercase",color:t.gold,background:"none",border:`1px solid ${t.gold}50`,padding:"10px 24px",cursor:"pointer",fontFamily:"var(--font-inter)",fontWeight:500 }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <div style={{ background:"#fff",border:`1px solid ${t.border}`,padding:"36px" }}>
                <div className="lxs-form-row" style={{ marginBottom:"14px" }}>
                  {[["firstName","First Name","James"],["lastName","Last Name","Whitfield"]].map(([field,label,ph]) => (
                    <div key={field}>
                      <label style={labelStyle}>{label} <span style={{ color:t.gold }}>*</span></label>
                      <input type="text" placeholder={ph} value={form[field as keyof typeof form] as string} onChange={e=>set(field,e.target.value)} style={inputStyle} className="lxs-form-field"/>
                    </div>
                  ))}
                </div>
                <div className="lxs-form-row" style={{ marginBottom:"14px" }}>
                  {[["email","Email Address *","you@example.com","email"],["phone","Phone Number","(555) 000-0000","tel"]].map(([field,label,ph,type]) => (
                    <div key={field}>
                      <label style={labelStyle}>{label}</label>
                      <input type={type} placeholder={ph} value={form[field as keyof typeof form] as string} onChange={e=>set(field,e.target.value)} style={inputStyle} className="lxs-form-field"/>
                    </div>
                  ))}
                </div>
                <div className="lxs-form-row" style={{ marginBottom:"14px" }}>
                  <div>
                    <label style={labelStyle}>Topic <span style={{ color:t.gold }}>*</span></label>
                    <select value={form.topic} onChange={e=>set("topic",e.target.value)} className="lxs-form-field"
                      style={{ ...inputStyle,appearance:"none" as const,backgroundImage:`url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0.5 0.5L5 5L9.5 0.5' stroke='%235e5448' stroke-width='1.2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 14px center",paddingRight:"36px",cursor:"pointer" }}>
                      {TOPICS.map(tp => <option key={tp} value={tp} disabled={tp===TOPICS[0]}>{tp}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Order Number <span style={{ color:t.textDim,fontWeight:300,letterSpacing:"0.04em",textTransform:"none" }}>(if applicable)</span></label>
                    <input type="text" placeholder="LXC-00000" value={form.orderNumber} onChange={e=>set("orderNumber",e.target.value)} style={inputStyle} className="lxs-form-field"/>
                  </div>
                </div>
                <div style={{ marginBottom:"18px" }}>
                  <label style={labelStyle}>Message</label>
                  <textarea rows={5} placeholder="Describe your question or issue in as much detail as you can…" value={form.message} onChange={e=>set("message",e.target.value)} style={{ ...inputStyle,lineHeight:1.75 }} className="lxs-form-field"/>
                </div>
                <label style={{ display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:"24px",cursor:"pointer" }}>
                  <div onClick={()=>set("fflConsent",!form.fflConsent)}
                    style={{ width:"14px",height:"14px",flexShrink:0,marginTop:"1px",border:`1px solid ${form.fflConsent?t.gold:t.border}`,background:form.fflConsent?t.gold:"transparent",transition:"all 0.18s",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"1px" }}>
                    {form.fflConsent&&<svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontSize:"11px",color:t.textMuted,fontWeight:300,lineHeight:1.65,letterSpacing:"0.01em" }}>
                    I understand that all firearm purchases require FFL transfer through a licensed dealer in my state of residence.
                  </span>
                </label>
                <button onClick={handleSubmit} disabled={!canSubmit||formStatus==="submitting"}
                  style={{ width:"100%",padding:"14px",background:canSubmit?t.gold:t.gold+"55",border:"none",color:"#fff",fontSize:"9.5px",letterSpacing:"0.18em",textTransform:"uppercase",fontFamily:"var(--font-inter)",fontWeight:600,cursor:canSubmit?"pointer":"not-allowed",borderRadius:"1px",transition:"all 0.22s" }}
                  onMouseEnter={e=>{ if(canSubmit) e.currentTarget.style.background=t.goldLight }}
                  onMouseLeave={e=>{ if(canSubmit) e.currentTarget.style.background=t.gold }}>
                  {formStatus==="submitting"?"Sending…":"Send Message"}
                </button>
                {formStatus === "error" && (
                  <p style={{ fontSize:"11px",color:"#c0392b",textAlign:"center",marginTop:"8px",fontFamily:"var(--font-inter)" }}>
                    Something went wrong — please try again or email {contact.emailSupport} directly.
                  </p>
                )}
                <p style={{ fontSize:"10px",color:t.textDim,textAlign:"center",marginTop:"12px",letterSpacing:"0.03em",fontWeight:300 }}>
                  Fields marked <span style={{ color:t.gold }}>*</span> are required · We respond within 1 business day
                </p>
              </div>
            )}
          </div>

          {/* Quick Resources */}
          <div style={{ display:"flex",flexDirection:"column",gap:"40px" }}>
            <div>
              <div style={{ fontSize:"8px",letterSpacing:"0.24em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"20px",display:"flex",alignItems:"center",gap:"10px" }}>
                <div style={{ width:"14px",height:"1px",background:t.gold }}/>Quick Resources
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:"10px" }}>
                {[
                  { label:"Frequently Asked Questions", sub:"Browse answers to the most common collector questions", href:"/faq", icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 7C7 5.9 7.9 5 9 5C10.1 5 11 5.9 11 7C11 8.1 10.1 8.5 9.5 9C9 9.4 9 10 9 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="9" cy="13" r="0.6" fill="currentColor"/></svg> },
                  { label:"Track Your Order", sub:"Get real-time tracking and shipment status", href:"/account/orders", icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="5" width="14" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M2 8H16" stroke="currentColor" strokeWidth="1.2"/><circle cx="5.5" cy="11" r="0.7" fill="currentColor"/></svg> },
                  { label:"Shipping & Returns Policy", sub:"Delivery timelines, FFL transfer logistics, and returns", href:"/shipping", icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1.5 4.5H10.5V12H1.5V4.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M10.5 7.5H14L16.5 10V12H10.5V7.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><circle cx="5" cy="13.5" r="1.3" stroke="currentColor" strokeWidth="1.2"/><circle cx="13" cy="13.5" r="1.3" stroke="currentColor" strokeWidth="1.2"/></svg> },
                  { label:"Submit a Consignment", sub:"Start the process to consign a piece from your collection", href:"/consignment", icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 4.5L9 1L15 4.5V11.5L9 15L3 11.5V4.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M9 8L9 15M9 8L3 4.5M9 8L15 4.5" stroke="currentColor" strokeWidth="1.2"/></svg> },
                  { label:"Find an FFL Dealer", sub:"Locate a licensed dealer near you via the ATF directory", href:"https://www.atf.gov/firearms/listing-federal-firearms-licensees", external:true, icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5C5.5 1.5 3 4 3 7.2C3 11 9 16.5 9 16.5C9 16.5 15 11 15 7.2C15 4 12.5 1.5 9 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><circle cx="9" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/></svg> },
                ].map(link => (
                  <a key={link.label} href={link.href} target={link.external?"_blank":undefined} rel={link.external?"noopener noreferrer":undefined}
                    style={{ display:"flex",alignItems:"center",gap:"14px",padding:"14px 16px",background:"#fafafa",border:`1px solid ${t.border}`,borderLeft:`2px solid ${t.gold}40`,textDecoration:"none",transition:"all 0.2s" }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor=t.gold+"50"; e.currentTarget.style.borderLeftColor=t.gold; e.currentTarget.style.transform="translateX(2px)" }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor=t.border; e.currentTarget.style.borderLeftColor=t.gold+"40"; e.currentTarget.style.transform="translateX(0)" }}>
                    <div style={{ width:"38px",height:"38px",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${t.gold}35`,color:t.gold }}>{link.icon}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontFamily:"var(--font-playfair)",fontSize:"15px",fontWeight:400,color:t.text,lineHeight:1.25,letterSpacing:"0.01em" }}>
                        {link.label}
                        {link.external && <svg width="10" height="10" viewBox="0 0 11 11" fill="none" style={{ display:"inline-block",marginLeft:"6px",color:t.gold,verticalAlign:"middle" }}><path d="M3 1H10V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 1L4.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M1 4V10H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div style={{ fontSize:"11px",fontWeight:300,color:t.textMuted,lineHeight:1.5,letterSpacing:"0.02em",marginTop:"3px" }}>{link.sub}</div>
                    </div>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" style={{ opacity:0.4,flexShrink:0,color:t.gold }}><path d="M1 4H9M6 1L9 4L6 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FFL GUIDE */}
      <section style={{ margin:"80px 0 0",background:"#f3f3f5",borderTop:`1px solid ${t.border}`,borderBottom:`1px solid ${t.border}`,padding:"72px 40px" }}>
        <div style={{ maxWidth:"1440px",margin:"0 auto" }}>
          <div className="lxs-ffl-guide">
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px" }}>
                <div style={{ width:"18px",height:"1px",background:t.gold }}/>
                <span style={{ fontSize:"8.5px",letterSpacing:"0.26em",textTransform:"uppercase",color:t.gold,fontWeight:500 }}>How It Works</span>
              </div>
              <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(26px,2.8vw,38px)",fontWeight:300,color:t.text,lineHeight:1.15,marginBottom:"18px" }}>The FFL Transfer Process</h2>
              <p style={{ fontSize:"13.5px",fontWeight:300,color:t.textMuted,lineHeight:1.85,marginBottom:"24px" }}>
                Purchasing a firearm online is straightforward once you understand the FFL transfer requirement. Federal law mandates that all interstate firearm sales route through a licensed dealer near you.
              </p>
              <div style={{ padding:"16px 18px",background:"#fff",border:`1px solid ${t.border}`,borderLeft:`2px solid ${t.gold}40` }}>
                <div style={{ fontSize:"8px",letterSpacing:"0.18em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"6px" }}>Transfer Fee Note</div>
                <p style={{ fontSize:"11.5px",fontWeight:300,color:t.textMuted,lineHeight:1.65 }}>
                  Your FFL dealer charges a transfer fee directly to you — typically $25–$75. This is separate from your Luxus Collection purchase and is paid to your local dealer at pickup.
                </p>
              </div>
            </div>
            <div style={{ display:"flex",flexDirection:"column" }}>
              {[
                { n:"01", title:"Choose your FFL dealer", desc:"Find a local gun shop or licensed dealer willing to accept transfers. Ask for their FFL license copy — you'll need to provide it when placing your order." },
                { n:"02", title:"Complete your purchase", desc:"Add your item to cart, provide your FFL dealer's information at checkout, and complete payment. We'll ship directly to your dealer." },
                { n:"03", title:"We ship to your dealer", desc:"Once payment clears, your firearm ships within 2–3 business days via FedEx with signature required. You'll receive tracking by email." },
                { n:"04", title:"Your dealer contacts you", desc:"When your firearm arrives, your FFL dealer will call you to schedule pickup. Bring a valid government-issued photo ID." },
                { n:"05", title:"Complete the background check", desc:"At your dealer, you'll fill out ATF Form 4473 and pass the NICS background check. Upon approval, the firearm is yours." },
              ].map((step,i,arr) => (
                <div key={step.n} style={{ display:"flex",gap:"20px",alignItems:"flex-start",padding:"20px 0",borderBottom:i<arr.length-1?`1px solid ${t.border}`:"none" }}>
                  <div style={{ width:"40px",height:"40px",flexShrink:0,border:`1px solid ${t.gold}45`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <span style={{ fontFamily:"var(--font-playfair)",fontSize:"17px",fontWeight:300,color:t.gold }}>{step.n}</span>
                  </div>
                  <div style={{ paddingTop:"8px" }}>
                    <div style={{ fontSize:"12.5px",fontWeight:500,color:t.text,marginBottom:"5px",letterSpacing:"0.02em" }}>{step.title}</div>
                    <div style={{ fontSize:"12.5px",fontWeight:300,color:t.textMuted,lineHeight:1.78,letterSpacing:"0.01em" }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INFO CARDS */}
      <div style={{ maxWidth:"1440px",margin:"0 auto",padding:"72px 40px 96px" }}>
        <div className="lxs-support-info">
          {[
            { icon:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 1L18.5 5.5V10C18.5 14.5 15 17.5 10 19C5 17.5 1.5 14.5 1.5 10V5.5L10 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M6.5 10L8.5 12L13.5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>, heading:"Legal Compliance", body:"All transactions are conducted in full compliance with applicable federal, state, and local laws. We hold Federal Firearms License #1-59-XXX-XX-XX-55688." },
            { icon:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M2 8.5L10 13.5L18 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M7 5V4C7 2.89543 7.89543 2 9 2H11C12.1046 2 13 2.89543 13 4V5" stroke="currentColor" strokeWidth="1.2"/></svg>, heading:"Discreet Packaging", body:"All shipments are packaged discreetly with no external markings indicating firearm content. Packaging is professional, secure, and fully insured for the declared value." },
            { icon:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.2"/><path d="M10 6V11L13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>, heading:"Response Commitment", body:"Every inquiry receives a personal response — not an automated reply. We aim to respond within one business day and are available by phone Monday through Saturday." },
          ].map(({ icon, heading, body }) => (
            <div key={heading} style={{ padding:"26px 24px",background:"#fff",border:`1px solid ${t.border}` }}>
              <div style={{ color:t.gold,marginBottom:"14px" }}>{icon}</div>
              <div style={{ fontSize:"8.5px",letterSpacing:"0.18em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"8px" }}>{heading}</div>
              <p style={{ fontSize:"12.5px",fontWeight:300,color:t.textMuted,lineHeight:1.78,letterSpacing:"0.01em" }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
