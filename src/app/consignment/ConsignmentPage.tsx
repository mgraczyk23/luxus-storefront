'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'

const INQUIRY_TYPES = [
  "Select a topic…",
  "Consign a Firearm (Sell Through Us)",
  "Sell a Firearm Outright",
  "General Consignment Question",
  "Trade-In Inquiry",
  "Other",
]

export default function ConsignmentPage() {
  const { t } = useTheme()
  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", phone:"", inquiryType:INQUIRY_TYPES[0], make:"", model:"", estimatedValue:"", message:"" })
  const [formStatus, setFormStatus] = useState<"idle"|"submitting"|"success"|"error">("idle")

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const canSubmit = form.firstName && form.email && form.inquiryType !== INQUIRY_TYPES[0]

  const handleSubmit = async () => {
    if (!canSubmit || formStatus === "submitting") return
    setFormStatus("submitting")
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mailbox: 'sales',
          subject: `Consignment Inquiry: ${form.inquiryType} — ${form.firstName} ${form.lastName}`,
          ...form,
        }),
      })
      if (!res.ok) throw new Error()
      setFormStatus("success")
    } catch {
      setFormStatus("error")
    }
  }

  const inp = {
    width:"100%", padding:"11px 14px",
    background:"#ffffff",
    border:`1px solid ${t.border}`, color:t.text,
    fontSize:"12.5px", fontFamily:"var(--font-inter)",
    fontWeight:300, letterSpacing:"0.02em",
    outline:"none", borderRadius:"1px", transition:"border-color 0.2s",
  } as const

  const lbl = {
    display:"block", fontSize:"8px", letterSpacing:"0.2em",
    textTransform:"uppercase" as const, color:t.textDim, fontWeight:500, marginBottom:"6px",
  }

  return (
    <div style={{ background:t.bg,color:t.text,fontFamily:"var(--font-inter)" }}>

      {/* BANNER */}
      <div style={{ background:"linear-gradient(to bottom,#f3f3f5,#ffffff)",borderBottom:`1px solid ${t.border}`,padding:"52px 40px" }}>
        <div style={{ maxWidth:"1440px",margin:"0 auto" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"20px" }}>
            {["Home","Consignment"].map((c,i,a) => (
              <div key={c} style={{ display:"flex",alignItems:"center",gap:"8px" }}>
                {i>0&&<span style={{ fontSize:"9px",color:t.textDim }}>›</span>}
                <span style={{ fontSize:"10px",color:i<a.length-1?t.textDim:t.textMuted,fontWeight:300 }}>
                  {i<a.length-1 ? <Link href="/" style={{ textDecoration:"none",color:"inherit" }}>{c}</Link> : c}
                </span>
              </div>
            ))}
          </div>

          <div className="lxs-consign-banner">
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"14px" }}>
                <div style={{ width:"18px",height:"1px",background:t.gold }}/>
                <span style={{ fontSize:"8.5px",letterSpacing:"0.26em",textTransform:"uppercase",color:t.gold,fontWeight:500 }}>Sell or Consign</span>
              </div>
              <h1 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(32px,4vw,54px)",fontWeight:400,color:t.text,lineHeight:1.08,marginBottom:"20px" }}>
                Consignment &amp;<br/>Private Sales
              </h1>
              <p style={{ fontSize:"14.5px",fontWeight:300,color:t.textMuted,lineHeight:1.85,marginBottom:"24px",maxWidth:"460px" }}>
                Whether you&apos;re looking to consign a piece through our platform or prefer to sell a firearm outright, we&apos;d love to hear from you. Our team will respond personally within three business days.
              </p>
              <div style={{ background:"#fff",border:`1px solid ${t.border}`,borderLeft:`2px solid ${t.gold}40`,padding:"20px 22px" }}>
                <div style={{ fontSize:"8.5px",letterSpacing:"0.16em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"14px" }}>Consign or Sell — What&apos;s the Difference?</div>
                <div style={{ display:"flex",flexDirection:"column",gap:"12px" }}>
                  {[
                    ["Consignment","We list and sell the piece on your behalf. You receive the sale price minus our commission once it sells. No upfront fees — you only pay if and when the piece sells."],
                    ["Private Sale","Prefer a quicker, simpler transaction? Reach out and we may be able to purchase your piece directly, subject to our assessment and a mutual agreement on price."],
                  ].map(([heading,body]) => (
                    <div key={heading} style={{ display:"flex",gap:"12px",alignItems:"flex-start" }}>
                      <div style={{ width:"5px",height:"5px",borderRadius:"50%",background:t.gold,marginTop:"6px",flexShrink:0 }}/>
                      <div>
                        <div style={{ fontSize:"12px",fontWeight:500,color:t.text,marginBottom:"3px" }}>{heading}</div>
                        <div style={{ fontSize:"12.5px",fontWeight:300,color:t.textMuted,lineHeight:1.7 }}>{body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display:"flex",flexDirection:"column",gap:"12px" }}>
              <div style={{ background:"#fff",border:`1px solid ${t.border}`,padding:"22px 24px" }}>
                <div style={{ fontSize:"8px",letterSpacing:"0.2em",textTransform:"uppercase",color:t.textDim,fontWeight:500,marginBottom:"8px" }}>Sales &amp; Consignment Email</div>
                <a href="mailto:sales@luxus-collection.com" style={{ fontFamily:"var(--font-playfair)",fontSize:"17px",fontWeight:400,color:t.gold,textDecoration:"none",display:"block",marginBottom:"4px" }}>
                  sales@luxus-collection.com
                </a>
                <div style={{ fontSize:"11px",fontWeight:300,color:t.textDim }}>Response within 3 business days</div>
              </div>
              <div style={{ background:"#fff",border:`1px solid ${t.border}`,padding:"22px 24px" }}>
                <div style={{ fontSize:"8px",letterSpacing:"0.2em",textTransform:"uppercase",color:t.textDim,fontWeight:500,marginBottom:"8px" }}>Phone</div>
                <a href="tel:9412533660" style={{ fontFamily:"var(--font-playfair)",fontSize:"17px",fontWeight:400,color:t.text,textDecoration:"none",display:"block",marginBottom:"4px" }}>(941) 253-3660</a>
                <a href="tel:8334866659" style={{ fontSize:"12px",fontWeight:300,color:t.textMuted,textDecoration:"none",display:"block",marginBottom:"8px",letterSpacing:"0.02em" }}>(833) 486-6659 · Toll-Free</a>
                <div style={{ fontSize:"11px",fontWeight:300,color:t.textDim }}>Mon – Fri 8:30am – 6pm · Sat 10am – 2pm EST</div>
              </div>
              <div style={{ background:"#fafafa",border:`1px solid ${t.border}`,borderLeft:`2px solid ${t.gold}40`,padding:"14px 18px" }}>
                <p style={{ fontSize:"11.5px",fontWeight:300,color:t.textMuted,lineHeight:1.72 }}>
                  Consignment rates start at <span style={{ color:t.text,fontWeight:500 }}>15%</span> on sales ≥ $1,500 and <span style={{ color:t.text,fontWeight:500 }}>20%</span> on sales below $1,500. No listing fees — you only pay if and when your piece sells.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div style={{ maxWidth:"1440px",margin:"0 auto",padding:"64px 40px 96px" }}>
        <div className="lxs-consign-form-layout">

          <div>
            <div style={{ marginBottom:"28px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"10px" }}>
                <div style={{ width:"18px",height:"1px",background:t.gold }}/>
                <span style={{ fontSize:"8.5px",letterSpacing:"0.26em",textTransform:"uppercase",color:t.gold,fontWeight:500 }}>Get In Touch</span>
              </div>
              <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(24px,2.8vw,36px)",fontWeight:400,color:t.text,lineHeight:1.15 }}>Tell Us About Your Piece</h2>
            </div>

            {formStatus === "success" ? (
              <div style={{ padding:"60px 40px",border:`1px solid ${t.border}`,background:"#fff",textAlign:"center" }}>
                <div style={{ width:"52px",height:"52px",border:`1px solid ${t.gold}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px" }}>
                  <svg width="20" height="15" viewBox="0 0 20 15" fill="none"><path d="M1 7.5L7 13.5L19 1.5" stroke={t.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ fontFamily:"var(--font-playfair)",fontSize:"28px",fontWeight:400,color:t.text,marginBottom:"12px" }}>Message Received</div>
                <p style={{ fontSize:"13.5px",fontWeight:300,color:t.textMuted,lineHeight:1.8,maxWidth:"400px",margin:"0 auto 24px" }}>
                  Thank you, {form.firstName}. A member of our team will be in touch at <span style={{ color:t.text }}>{form.email}</span> within three business days.
                </p>
                <button onClick={()=>{ setFormStatus("idle"); setForm({ firstName:"",lastName:"",email:"",phone:"",inquiryType:INQUIRY_TYPES[0],make:"",model:"",estimatedValue:"",message:"" }) }}
                  style={{ fontSize:"9.5px",letterSpacing:"0.16em",textTransform:"uppercase",color:t.gold,background:"none",border:`1px solid ${t.gold}50`,padding:"10px 24px",cursor:"pointer",fontFamily:"var(--font-inter)",fontWeight:500 }}>
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <div style={{ background:"#fff",border:`1px solid ${t.border}`,padding:"36px" }}>
                <div className="lxs-form-row" style={{ marginBottom:"14px" }}>
                  <div><label style={lbl}>First Name *</label><input type="text" placeholder="James" value={form.firstName} onChange={e=>set("firstName",e.target.value)} style={inp} className="lxs-form-field"/></div>
                  <div><label style={lbl}>Last Name</label><input type="text" placeholder="Whitfield" value={form.lastName} onChange={e=>set("lastName",e.target.value)} style={inp} className="lxs-form-field"/></div>
                </div>
                <div className="lxs-form-row" style={{ marginBottom:"14px" }}>
                  <div><label style={lbl}>Email Address *</label><input type="email" placeholder="you@example.com" value={form.email} onChange={e=>set("email",e.target.value)} style={inp} className="lxs-form-field"/></div>
                  <div>
                    <label style={lbl}>Phone <span style={{ fontWeight:300,textTransform:"none",letterSpacing:"0.04em",opacity:0.65 }}>(optional)</span></label>
                    <input type="tel" placeholder="(555) 000-0000" value={form.phone} onChange={e=>set("phone",e.target.value)} style={inp} className="lxs-form-field"/>
                  </div>
                </div>
                <div style={{ marginBottom:"14px" }}>
                  <label style={lbl}>I&apos;m Interested In… *</label>
                  <select value={form.inquiryType} onChange={e=>set("inquiryType",e.target.value)} className="lxs-form-field"
                    style={{ ...inp,appearance:"none" as const,backgroundImage:`url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0.5 0.5L5 5L9.5 0.5' stroke='%235e5448' stroke-width='1.2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 14px center",paddingRight:"36px",cursor:"pointer" }}>
                    {INQUIRY_TYPES.map(opt => <option key={opt} value={opt} disabled={opt===INQUIRY_TYPES[0]}>{opt}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom:"14px" }}>
                  <label style={{ ...lbl,marginBottom:"10px" }}>
                    Firearm Details <span style={{ fontWeight:300,textTransform:"none",letterSpacing:"0.04em",opacity:0.65 }}>(optional — helps us respond faster)</span>
                  </label>
                  <div className="lxs-consign-firearm-row">
                    <div>
                      <label style={{ ...lbl,fontSize:"7.5px",opacity:0.75 }}>Make / Brand</label>
                      <input type="text" placeholder="Nighthawk Custom" value={form.make} onChange={e=>set("make",e.target.value)} style={inp} className="lxs-form-field"/>
                    </div>
                    <div>
                      <label style={{ ...lbl,fontSize:"7.5px",opacity:0.75 }}>Model</label>
                      <input type="text" placeholder="Agent" value={form.model} onChange={e=>set("model",e.target.value)} style={inp} className="lxs-form-field"/>
                    </div>
                    <div>
                      <label style={{ ...lbl,fontSize:"7.5px",opacity:0.75 }}>Est. Value</label>
                      <div style={{ position:"relative" }}>
                        <span style={{ position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:t.textMuted,fontSize:"12px" }}>$</span>
                        <input type="text" placeholder="3,500" value={form.estimatedValue} onChange={e=>set("estimatedValue",e.target.value)} style={{ ...inp,paddingLeft:"26px" }} className="lxs-form-field"/>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom:"24px" }}>
                  <label style={lbl}>Message <span style={{ fontWeight:300,textTransform:"none",letterSpacing:"0.04em",opacity:0.65 }}>(optional)</span></label>
                  <textarea rows={5} placeholder="Tell us more — condition, provenance, what you're looking to get out of it, your timeline, any questions you have…" value={form.message} onChange={e=>set("message",e.target.value)} style={{ ...inp,lineHeight:1.75 }} className="lxs-form-field"/>
                </div>
                <button onClick={handleSubmit} disabled={!canSubmit || formStatus==="submitting"}
                  style={{ width:"100%",padding:"14px",background:canSubmit?t.gold:t.gold+"55",border:"none",color:"#fff",fontSize:"9.5px",letterSpacing:"0.18em",textTransform:"uppercase",fontFamily:"var(--font-inter)",fontWeight:600,cursor:canSubmit?"pointer":"not-allowed",borderRadius:"1px",transition:"all 0.22s" }}
                  onMouseEnter={e=>{ if(canSubmit) e.currentTarget.style.background=t.goldLight }}
                  onMouseLeave={e=>{ if(canSubmit) e.currentTarget.style.background=t.gold }}>
                  {formStatus==="submitting"?"Sending…":"Send Inquiry"}
                </button>
                {formStatus === "error" && (
                  <p style={{ fontSize:"11px",color:"#c0392b",textAlign:"center",marginTop:"8px",fontFamily:"var(--font-inter)" }}>
                    Something went wrong — please try again or email sales@luxus-collection.com directly.
                  </p>
                )}
                <p style={{ fontSize:"10px",color:t.textDim,textAlign:"center",marginTop:"12px",letterSpacing:"0.03em",fontWeight:300 }}>
                  Fields marked * are required · We respond within 3 business days
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ position:"sticky",top:"88px",display:"flex",flexDirection:"column",gap:"16px" }}>
            <div style={{ background:"#fff",border:`1px solid ${t.border}`,borderTop:`2px solid ${t.gold}`,padding:"24px" }}>
              <div style={{ fontSize:"8px",letterSpacing:"0.22em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"18px" }}>What Happens Next</div>
              {[
                ["We review your inquiry","Our team looks at what you've shared and assesses current market value for comparable pieces."],
                ["We reach out personally","A member of our team contacts you directly — no automated replies — to discuss options and next steps."],
                ["We agree on terms","Whether consigning or selling outright, we'll walk through the agreement before anything moves forward."],
                ["We handle the rest","Once agreed, we coordinate listing, FFL logistics, and buyer communication on your behalf."],
              ].map(([title,body],i,a) => (
                <div key={title} style={{ display:"flex",gap:"14px",paddingBottom:i<a.length-1?"16px":"0",marginBottom:i<a.length-1?"16px":"0",borderBottom:i<a.length-1?`1px solid ${t.border}`:"none" }}>
                  <div style={{ width:"24px",height:"24px",border:`1px solid ${t.gold}45`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    <span style={{ fontFamily:"var(--font-playfair)",fontSize:"13px",fontWeight:400,color:t.gold }}>{i+1}</span>
                  </div>
                  <div style={{ paddingTop:"2px" }}>
                    <div style={{ fontSize:"12px",fontWeight:500,color:t.text,marginBottom:"4px" }}>{title}</div>
                    <div style={{ fontSize:"11.5px",fontWeight:300,color:t.textMuted,lineHeight:1.68 }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background:"#fff",border:`1px solid ${t.border}`,padding:"20px 22px" }}>
              <div style={{ display:"flex",gap:"10px",alignItems:"flex-start" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color:t.gold,flexShrink:0,marginTop:"2px" }}><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1"/><path d="M7 6V10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><circle cx="7" cy="4.5" r="0.6" fill="currentColor"/></svg>
                <div>
                  <div style={{ fontSize:"8.5px",letterSpacing:"0.14em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"6px" }}>Prefer to Sell Outright?</div>
                  <p style={{ fontSize:"12px",fontWeight:300,color:t.textMuted,lineHeight:1.72 }}>
                    Not interested in waiting for a consignment sale? We may be able to purchase your piece directly. Simply select <em style={{ color:t.text }}>&ldquo;Sell a Firearm Outright&rdquo;</em> in the dropdown above.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
