'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'

const POLICIES = {
  shipping: {
    title: "Shipping & Returns",
    eyebrow: "Policies",
    lastUpdated: "May 1, 2026",
    sections: [
      { heading:"Shipping Overview", body:"All firearms sold by Luxus Collection ship to a licensed Federal Firearms Licensee (FFL) dealer of your choosing. We do not ship firearms directly to customers. This is a federal legal requirement that applies to all interstate firearm sales. You must provide your FFL dealer's information at checkout before an order can be processed." },
      { heading:"Processing Time", body:"In-stock orders are processed within 2–3 business days of confirmed payment. Custom-order and consignment pieces have individual lead times confirmed at the time of order. Orders placed using bank wire transfer do not ship until funds are confirmed received, which typically takes 3–5 business days from the time of transfer." },
      { heading:"Shipping Method & Carriers", body:"All firearms ship via FedEx or UPS, fully insured for the declared purchase value, with adult signature required upon delivery to the FFL dealer. We do not ship via USPS. You will receive a tracking number by email when your label is created. Luxus Collection is not responsible for carrier delays once a package has been accepted by the carrier." },
      { heading:"Shipping Rates", body:"Shipping on all firearm purchases is complimentary. We absorb the full cost of insured, signature-required carrier shipping to your FFL dealer on every order regardless of purchase amount." },
      { heading:"FFL Dealer Transfer Fees", body:"Transfer fees are charged by your FFL dealer, not by Luxus Collection, and are paid directly to your dealer at the time of pickup. These fees typically range from $25 to $75 and vary by dealer. Luxus Collection has no control over and receives no portion of transfer fees." },
      { heading:"State Restrictions", body:"Certain firearms cannot be legally transferred in certain states due to magazine capacity restrictions, feature bans, assault weapon statutes, or handgun roster requirements. We make every effort to notify customers of restrictions before processing payment. It is ultimately the buyer's responsibility to understand the laws in their state and to ensure the firearm can be legally received by their FFL dealer." },
      { heading:"Return Policy", body:"New, unfired firearms may be returned within 10 days of FFL transfer for a full refund minus a 5% restocking fee, provided the firearm is in its original, unaltered condition with all original packaging and accessories included. Firearms that have been fired are considered used and cannot be returned regardless of round count." },
      { heading:"Return Process", body:"All returns require a Return Authorization (RA) number issued by Luxus Collection before any firearm is shipped back. Contact us at info@luxus-collection.com or (941) 253-3660 within the return window to request an RA number. Returns shipped without an RA number will be refused. All return shipments must route through a licensed FFL dealer on the sender's end to our FFL — the same process as the original transfer." },
      { heading:"Damaged or Defective Firearms", body:"Inspect the outer packaging carefully before accepting transfer from your FFL dealer. If the outer packaging shows obvious damage, refuse the shipment and contact us immediately. If a defect is discovered after transfer, contact us within 48 hours with photographic documentation. We will arrange return shipping at our expense and provide either a full replacement or a full refund at our discretion. Manufacturing defects are also covered by the manufacturer's warranty." },
      { heading:"Pre-Owned Firearms", body:"Pre-owned firearms are sold as-is in the condition described in the listing. We make every effort to accurately represent condition, but buyers are responsible for understanding that pre-owned firearms are not new. Pre-owned firearms are not eligible for return unless a material misrepresentation in the listing can be demonstrated." },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Legal",
    lastUpdated: "May 1, 2026",
    sections: [
      { heading:"Overview", body:"Luxus Collection LLC ('Luxus Collection,' 'we,' 'us,' or 'our') is committed to protecting your privacy. This Privacy Policy describes how we collect, use, disclose, and protect information about you when you visit our website, create an account, or make a purchase. By using our site, you agree to the practices described in this Policy." },
      { heading:"Information We Collect", body:"We collect information you provide directly: name, email address, phone number, billing and shipping address, FFL dealer information, and payment information when you make a purchase or create an account. We also collect information automatically when you use our site, including IP address, browser type, device identifiers, pages visited, and referring URLs. We use standard cookies and similar tracking technologies for functionality and analytics." },
      { heading:"How We Use Your Information", body:"We use your information to process orders and coordinate FFL transfers, communicate about your orders, respond to inquiries, send transactional emails, and, with your consent, send marketing communications. We use automatically collected information to improve our site and understand how it is used. We do not sell your personal information to third parties." },
      { heading:"Information Sharing", body:"We share your information with service providers who help us operate our business, including our e-commerce platform, payment processors, shipping carriers, and email service providers, under confidentiality agreements. We may also share information as required by law, to comply with legal process, or to protect the rights, property, or safety of Luxus Collection, our customers, or others. Because firearm transactions are regulated, certain transaction records may be subject to review by federal, state, or local law enforcement agencies." },
      { heading:"FFL and Transaction Records", body:"Firearm purchases are regulated transactions. Your name, address, and identification information are recorded on ATF Form 4473 by your FFL dealer and are subject to federal records retention requirements. These records are maintained by your FFL dealer, not by Luxus Collection, and are subject to ATF regulations and applicable law." },
      { heading:"Data Retention", body:"We retain your account information for as long as your account is active and for a reasonable period afterward. Order records are retained as required by applicable law. You may request deletion of your personal information by contacting us, subject to legal retention requirements." },
      { heading:"Security", body:"We implement industry-standard security measures including SSL/TLS encryption, secure payment processing, and access controls to protect your information. No method of internet transmission or electronic storage is 100% secure. We cannot guarantee absolute security but are committed to protecting your information using reasonable measures." },
      { heading:"Your Rights", body:"Depending on your state of residence, you may have rights to access, correct, or delete your personal information, or to opt out of certain uses. To exercise these rights, contact us at info@luxus-collection.com. We will respond within 30 days. California residents have additional rights under the California Consumer Privacy Act (CCPA)." },
      { heading:"Changes to This Policy", body:"We may update this Privacy Policy from time to time. We will notify registered users of material changes by email. The 'Last Updated' date at the top of this page reflects the most recent revision." },
      { heading:"Contact", body:"Questions about this Privacy Policy? Contact us at info@luxus-collection.com or (941) 253-3660." },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    eyebrow: "Legal",
    lastUpdated: "May 1, 2026",
    sections: [
      { heading:"Acceptance of Terms", body:"By accessing or using the Luxus Collection website (luxus-collection.com) or purchasing from us, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, do not use our site or services. We reserve the right to modify these terms at any time. Continued use of our site after changes are posted constitutes acceptance of the revised terms." },
      { heading:"Eligibility", body:"You must be at least 21 years of age to purchase handguns through our site. You must be legally permitted under federal, state, and local law to purchase and receive the firearm(s) you are ordering. By completing a purchase, you represent and warrant that you meet all eligibility requirements. Providing false information in connection with a firearm purchase is a federal felony." },
      { heading:"Product Listings", body:"We make every effort to accurately represent our products, including descriptions, photographs, specifications, and pricing. We reserve the right to correct errors, update pricing, or discontinue products at any time without notice. All sales are subject to product availability at the time of order processing. In the event a listed item becomes unavailable after purchase, we will notify you promptly and offer a full refund." },
      { heading:"Pricing and Payment", body:"All prices are listed in U.S. dollars. Prices are subject to change without notice. We reserve the right to cancel any order in the event of a pricing error. Sales tax is collected in states where we have nexus, in compliance with applicable law. Payment must be received in full before any firearm is shipped. We accept Visa, Mastercard, American Express, Discover, and bank wire transfer." },
      { heading:"FFL Transfer Requirement", body:"All firearm purchases are shipped to a licensed Federal Firearms Licensee (FFL) dealer designated by the buyer. The buyer is responsible for providing accurate FFL dealer information at checkout. Luxus Collection is not responsible for delays, fees, or complications arising from the buyer's FFL dealer. The buyer is solely responsible for understanding and complying with all applicable state and local laws governing the receipt and possession of the purchased firearm." },
      { heading:"Prohibited Transfers", body:"Luxus Collection does not engage in straw purchases (purchasing a firearm for someone who is legally prohibited from purchasing one). We will refuse any order we reasonably believe constitutes a straw purchase or other prohibited transfer. We reserve the right to cancel any order for any reason without liability." },
      { heading:"Intellectual Property", body:"All content on this site, including text, photographs, graphics, logos, and design, is the property of Luxus Collection LLC or its content suppliers and is protected by U.S. and international copyright law. You may not reproduce, distribute, or create derivative works from our content without prior written consent." },
      { heading:"Limitation of Liability", body:"To the maximum extent permitted by law, Luxus Collection's liability for any claim arising from a purchase or use of our site is limited to the amount paid for the specific product giving rise to the claim. We are not liable for indirect, incidental, special, consequential, or punitive damages. Some states do not allow limitations on implied warranties or exclusions of certain damages, so these limitations may not apply to you." },
      { heading:"Governing Law", body:"These Terms & Conditions are governed by the laws of the State of Florida, without regard to conflict of law provisions. Any dispute arising from these terms or your use of our site shall be resolved exclusively in the state or federal courts located in Manatee County, Florida. You consent to the personal jurisdiction of such courts." },
      { heading:"Contact", body:"Questions about these Terms? Contact us at info@luxus-collection.com or (941) 253-3660." },
    ],
  },
} as const

export type PolicyType = keyof typeof POLICIES

export default function PolicyPage({ policy }: { policy: PolicyType }) {
  const { isDark, t } = useTheme()
  const [activeSection, setActiveSection] = useState<number | null>(null)
  const doc = POLICIES[policy]

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

  const RELATED: [PolicyType, string, string][] = [
    ["shipping","Shipping & Returns","/shipping"],
    ["privacy","Privacy Policy","/privacy"],
    ["terms","Terms & Conditions","/terms"],
  ]

  return (
    <div style={{ background:t.bg,color:t.text,fontFamily:"var(--font-inter)" }}>

      {/* BANNER */}
      <div style={{ background:isDark?"linear-gradient(to bottom,#161616,#0a0a0a)":"linear-gradient(to bottom,#f3f3f5,#ffffff)",borderBottom:`1px solid ${t.border}`,padding:"52px 40px 40px" }}>
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
                style={{ padding:"7px 16px",border:`1px solid ${key===policy?t.gold+"60":t.border}`,background:key===policy?(isDark?"#1c1c1c":"#f3f3f5"):"transparent",fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",color:key===policy?t.gold:t.textMuted,textDecoration:"none",fontWeight:500,transition:"all 0.18s" }}
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
            <div style={{ marginTop:"52px",padding:"24px 28px",background:isDark?"#161616":"#fff",border:`1px solid ${t.border}`,borderLeft:`2px solid ${t.gold}40` }}>
              <div style={{ fontSize:"8.5px",letterSpacing:"0.2em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"10px" }}>Questions about this policy?</div>
              <p style={{ fontSize:"13px",fontWeight:300,color:t.textMuted,lineHeight:1.75,marginBottom:"12px" }}>We&apos;re happy to clarify anything. Reach out directly:</p>
              <div style={{ display:"flex",gap:"24px",flexWrap:"wrap" }}>
                <a href="mailto:info@luxus-collection.com" style={{ fontSize:"13px",color:t.gold,textDecoration:"none",fontWeight:300 }}>info@luxus-collection.com</a>
                <a href="tel:9412533660" style={{ fontSize:"13px",color:t.textMuted,textDecoration:"none",fontWeight:300 }}>(941) 253-3660</a>
                <a href="tel:8334866659" style={{ fontSize:"13px",color:t.textMuted,textDecoration:"none",fontWeight:300 }}>(833) 486-6659 · Toll-Free</a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}
