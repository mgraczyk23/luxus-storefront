'use client'

import { useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'

const FAQ_DATA = [
  {
    id: "ordering",
    category: "Ordering & Purchasing",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 1H3L4.5 9.5H12.5L14 4H3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="13" r="1" fill="currentColor"/><circle cx="11" cy="13" r="1" fill="currentColor"/></svg>,
    items: [
      { id:"ord-0", q:"Can I buy a gun online?", a:"Yes. Because Luxus Collection specializes in high-end collectibles, a customer service representative will personally assist with every order, confirming specifications, verifying FFL paperwork, and walking you through any state-specific considerations. Contact us by phone, email, or the inquiry form on any product page and we'll be happy to help." },
      { id:"ord-1", q:"How do I purchase a firearm from Luxus Collection?", a:"Browsing and adding items to your cart works just like any e-commerce store. At checkout you'll be asked to provide your FFL dealer's information — the dealer who will receive the firearm and complete the transfer paperwork on your behalf. Once your order is confirmed and payment cleared, we ship directly to your dealer." },
      { id:"ord-2", q:"Can I purchase a firearm if I live outside the United States?", a:"At this time Luxus Collection only ships to FFL-licensed dealers within the contiguous United States, Alaska, and Hawaii. We are unable to facilitate international transfers due to ITAR regulations and the complexity of import/export licensing." },
      { id:"ord-3", q:"Do I need to pass a background check?", a:"Yes. All firearm transfers are subject to an NICS (National Instant Criminal Background Check System) background check, which is conducted by your FFL dealer at the time of transfer. This is a federal requirement that applies to every firearm purchase regardless of the sale channel." },
      { id:"ord-4", q:"Can I purchase a firearm as a gift?", a:"Straw purchases — buying a firearm for someone who cannot legally purchase one themselves — are a federal felony. Gifting a firearm to someone who is legally permitted to own one is lawful in most states, but the recipient must still complete the FFL transfer paperwork in their name. We recommend consulting an attorney if you have questions about your specific situation." },
      { id:"ord-5", q:"What if the firearm I want is listed as 'Contact Us For Pricing'?", a:"Certain pieces — prototype models, bespoke commissions, and items with provenance or appraisal value — are priced individually based on current market conditions. Use the inquiry form on the product page or contact us directly at info@luxus-collection.com and we will respond with pricing and availability within one business day." },
    ],
  },
  {
    id: "ffl",
    category: "FFL Transfers & Shipping",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L14 4.5V8C14 11.5 11 13.5 8 15C5 13.5 2 11.5 2 8V4.5L8 1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/><path d="M5.5 8L7 9.5L10.5 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    items: [
      { id:"ffl-0", q:"What is your policy regarding shipping firearms?", a:"Our standard policy is to ship every firearm to your local Federal Firearms Licensee (FFL). The FFL dealer completes the transfer paperwork and background check before releasing the firearm to you. If you don't already have an FFL dealer lined up, contact us — we'll help you locate one nearby or recommend a transfer partner in your area." },
      { id:"ffl-1", q:"What is an FFL transfer and why is it required?", a:"A Federal Firearms Licensee (FFL) is a federally licensed dealer authorized to transfer firearms. Federal law requires that interstate firearm sales ship to and through an FFL dealer, who then conducts the background check and paperwork before releasing the firearm to you. This applies to all online firearm purchases, including ours." },
      { id:"ffl-2", q:"How do I find an FFL dealer near me?", a:"Most local gun shops hold an FFL license. The ATF's online database (atfonline.gov) allows you to search for licensed dealers by ZIP code. When you've identified a dealer willing to accept transfers, ask them to provide their FFL license copy and contact information, which you'll enter during checkout. Transfer fees vary by dealer, typically ranging from $25–$75." },
      { id:"ffl-3", q:"How long does shipping take?", a:"Most in-stock orders ship within 2–3 business days of payment clearing. Transit to your FFL dealer typically takes 3–7 business days via FedEx or UPS. We ship signature-required and insured on all orders. You'll receive tracking information by email as soon as the label is created. Custom and contact-for-pricing items have individual lead times discussed at the time of order." },
      { id:"ffl-4", q:"Do you ship to California, New York, or other states with stricter laws?", a:"We make every effort to accommodate customers in all 50 states, but certain firearms cannot legally be transferred in certain jurisdictions due to magazine capacity restrictions, feature bans, or roster requirements. At checkout, if your shipping state has restrictions that affect the item in your cart, we will notify you before processing payment. It is ultimately the buyer's responsibility to understand the laws in their state." },
      { id:"ffl-5", q:"What happens if my FFL dealer closes or is unavailable?", a:"Contact us as soon as you become aware of the issue. If your firearm has not yet shipped, we can update the receiving FFL at no charge. If it has already shipped, we will work with you and FedEx or UPS to redirect the shipment. Firearms cannot be left with a carrier — they must be received by a licensed FFL." },
    ],
  },
  {
    id: "products",
    category: "Products & Inventory",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.1"/><rect x="9" y="1" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.1"/><rect x="1" y="9" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.1"/><rect x="9" y="9" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.1"/></svg>,
    items: [
      { id:"prod-1", q:"Are all firearms listed on the site currently in stock?", a:"We make every effort to keep our inventory current in real time. Items marked 'In Stock' are physically on hand at our facility and ready to ship. Occasionally, high-demand pieces may sell between inventory updates — if this occurs, we will contact you promptly and offer a full refund or the option to be notified when the piece is available again." },
      { id:"prod-2", q:"Do you sell factory-new firearms only, or also pre-owned?", a:"We carry both new-in-box production firearms and pre-owned pieces that meet our condition standards. All pre-owned listings include a detailed condition grade and are inspected before listing. 'Pre-owned' on a Nighthawk or Cabot can mean a gun with 50 rounds through it — we describe what we know and photograph what we have." },
      { id:"prod-3", q:"Can I request a specific configuration or custom build?", a:"Yes. We have direct relationships with our manufacturing partners and can facilitate custom orders with Nighthawk Custom, Cabot Guns, Korth, and Wilson Combat, among others. Lead times vary by manufacturer and specification — contact us with your requirements and we'll quote you a lead time and pricing." },
      { id:"prod-4", q:"Do you provide test-fire or accuracy data with your firearms?", a:"Production firearms are test-fired at the factory prior to shipping to us. Select manufacturers — Nighthawk Custom and Cabot Guns in particular — include accuracy targets fired at the factory with each pistol. We pass these on to the buyer when available. We do not individually test-fire every piece on our end." },
    ],
  },
  {
    id: "payments",
    category: "Payments & Pricing",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3.5" width="14" height="9" rx="1" stroke="currentColor" strokeWidth="1.1"/><path d="M1 7H15" stroke="currentColor" strokeWidth="1.1"/><rect x="3" y="9" width="3" height="1.5" rx="0.3" fill="currentColor"/></svg>,
    items: [
      { id:"pay-1", q:"What payment methods do you accept?", a:"We accept American Express, Discover, MasterCard, and Visa. We also accept bank wire transfers, which we recommend for purchases over $5,000 as they avoid card processing fees. We do not accept personal checks or money orders. Cryptocurrency is not accepted at this time." },
      { id:"pay-1b", q:"Do you offer discounts on large purchases?", a:"We typically do not offer standard discounts on large orders. However, every request is evaluated on a case-by-case basis — the possibility of a discount depends on the specifics of the items in question. If you're planning a significant purchase, contact our sales team directly to discuss what you're looking at; we're happy to have the conversation." },
      { id:"pay-2", q:"Are prices negotiable?", a:"Our prices reflect current market value and the curation investment we make in sourcing exceptional pieces. We do not negotiate on production pieces. For pre-owned items and 'Contact Us For Pricing' listings, there is occasionally flexibility — inquire directly and we will have an honest conversation." },
      { id:"pay-3", q:"Do you offer financing or layaway?", a:"We offer a layaway program for purchases over $2,000. A 25% non-refundable deposit holds the piece for up to 90 days, with the balance due before shipment. We do not currently offer third-party financing. Contact us to set up a layaway arrangement." },
      { id:"pay-4", q:"Is there a sales tax on my purchase?", a:"Sales tax is collected on orders shipped to states where we have nexus, in compliance with applicable law. The applicable rate and amount will be displayed at checkout before you complete your purchase." },
    ],
  },
  {
    id: "returns",
    category: "Returns & Warranties",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8C2 4.68629 4.68629 2 8 2C10.2 2 12.1 3.1 13.2 4.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><path d="M14 8C14 11.3137 11.3137 14 8 14C5.8 14 3.9 12.9 2.8 11.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><path d="M11 4.5L13.5 5L13 2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 11.5L2.5 11L3 13.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    items: [
      { id:"ret-1", q:"What is your return policy?", a:"New, unfired firearms may be returned within 10 days of FFL transfer for a full refund, minus a 5% restocking fee, provided the firearm is in its original, unaltered condition with all original packaging and accessories. Once a firearm has been fired, it is considered used and cannot be returned. Contact us before initiating any return — all returns require a Return Authorization number." },
      { id:"ret-2", q:"What if my firearm arrives damaged or defective?", a:"Document the damage photographically before accepting transfer from your FFL dealer, or refuse the shipment entirely if the outer packaging shows obvious damage. Contact us within 48 hours with photos and we will arrange return shipping at our expense and either replace the firearm or issue a full refund. Manufacturing defects are covered by the manufacturer's warranty." },
      { id:"ret-3", q:"What warranties apply to the firearms you sell?", a:"Every new firearm carries the manufacturer's warranty, which varies by brand. Nighthawk Custom and Wilson Combat offer limited lifetime warranties for the original owner. Cabot Guns and Korth offer similarly comprehensive coverage. Pre-owned firearms are sold as-is unless otherwise noted, though we will disclose any known issues." },
      { id:"ret-4", q:"Can I send a firearm directly to you for service or repair?", a:"We do not offer in-house service or repair. For warranty work, contact the manufacturer directly. For non-warranty gunsmithing, we are happy to refer you to qualified smiths who specialize in the relevant platform. Firearms sent to us without prior authorization will be refused." },
    ],
  },
  {
    id: "consignment",
    category: "Consignment & Trade-In",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8H15M1 8L4.5 4.5M1 8L4.5 11.5M15 8L11.5 4.5M15 8L11.5 11.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    items: [
      { id:"con-1", q:"Do you accept firearms on consignment?", a:"Yes. We actively seek exceptional pieces for our consignment program. We specialize in production and custom pistols from the brands we carry, though we occasionally make exceptions for historically significant or particularly rare revolvers and pistols from other makers. The consignment process begins with a submission form and photos — we respond within 3 business days with our assessment." },
      { id:"con-2", q:"What is your consignment commission rate?", a:"Our standard consignment rate is 15% of the final sale price for items listed at $1,500 or above, and 20% for items below $1,500. This covers listing, photography, storage, and transaction handling. There are no listing fees — you only pay if and when the item sells." },
      { id:"con-3", q:"How do I ship a firearm to you for consignment?", a:"All consignment pieces must ship via a licensed FFL dealer on your end to our FFL on ours — the same process as any interstate firearm transfer. We will provide our FFL license copy and receiving instructions once a consignment agreement is signed. Never ship a firearm directly to our address without going through the FFL process." },
      { id:"con-4", q:"Do you offer trade-in credit?", a:"We offer trade-in credit on a case-by-case basis for pieces that fit our inventory. Trade-in value is applied as a credit toward any purchase. To initiate a trade-in inquiry, send photos and a description — including any known history, original packaging, and accessories — to info@luxus-collection.com." },
    ],
  },
]

function AccordionItem({ item, isOpen, onToggle, highlight = "" }: { item: { id: string; q: string; a: string }; isOpen: boolean; onToggle: () => void; highlight?: string }) {
  const { t } = useTheme()

  const hl = (text: string) => {
    if (!highlight.trim()) return <>{text}</>
    const idx = text.toLowerCase().indexOf(highlight.toLowerCase())
    if (idx === -1) return <>{text}</>
    return <>{text.slice(0,idx)}<mark style={{ background:t.gold+"35",color:t.gold,padding:"0 2px",borderRadius:"2px" }}>{text.slice(idx,idx+highlight.length)}</mark>{text.slice(idx+highlight.length)}</>
  }

  return (
    <div style={{ borderBottom:`1px solid ${t.border}`,background:isOpen?"#fafafa":"transparent",transition:"background 0.25s" }}>
      <button onClick={onToggle}
        style={{ width:"100%",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"20px",padding:"20px 24px",background:"none",border:"none",cursor:"pointer",textAlign:"left" }}>
        <span style={{ fontFamily:"var(--font-playfair)",fontSize:"18px",fontWeight:isOpen?400:300,color:isOpen?t.gold:t.text,lineHeight:1.35,letterSpacing:"0.01em",transition:"color 0.22s",flex:1 }}>
          {hl(item.q)}
        </span>
        <div style={{ width:"24px",height:"24px",flexShrink:0,border:`1px solid ${isOpen?t.gold+"60":t.border}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.25s",marginTop:"2px",background:isOpen?t.gold+"15":"transparent" }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transition:"transform 0.25s",transform:isOpen?"rotate(45deg)":"none" }}>
            <path d="M5 1V9M1 5H9" stroke={isOpen?t.gold:t.textMuted} strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
      </button>
      <div style={{ overflow:"hidden",maxHeight:isOpen?"600px":"0",transition:"max-height 0.35s ease" }}>
        <div style={{ padding:"0 24px 24px" }}>
          <div style={{ width:"28px",height:"1px",background:t.gold+"60",marginBottom:"14px" }}/>
          <p style={{ fontSize:"14px",fontWeight:300,lineHeight:1.85,color:t.textMuted,letterSpacing:"0.02em",fontFamily:"var(--font-inter)" }}>
            {hl(item.a)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function FAQPage() {
  const { t } = useTheme()
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("ordering")
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const searchRef = useRef<HTMLInputElement>(null)

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return null
    const results: typeof FAQ_DATA = []
    FAQ_DATA.forEach(cat => {
      const matched = cat.items.filter(item => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q))
      if (matched.length) results.push({ ...cat, items: matched })
    })
    return results
  }, [search])

  const activeSection = searchResults ? null : FAQ_DATA.find(c => c.id === activeCategory)
  const totalResults = searchResults ? searchResults.reduce((s,c) => s + c.items.length, 0) : null

  const toggleItem = (id: string) => setOpenItems(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n })
  const expandAll = (items: {id:string}[]) => setOpenItems(new Set(items.map(i=>i.id)))
  const collapseAll = () => setOpenItems(new Set())

  const btnStyle = {
    fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase" as const,color:t.textMuted,background:"none",border:`1px solid ${t.border}`,padding:"6px 12px",cursor:"pointer",fontFamily:"var(--font-inter)",fontWeight:500,transition:"all 0.18s",
  }

  return (
    <div style={{ background:t.bg,color:t.text,fontFamily:"var(--font-inter)" }}>

      {/* BANNER */}
      <div style={{ background:"linear-gradient(to bottom,#f3f3f5,#ffffff)",borderBottom:`1px solid ${t.border}`,padding:"52px 40px 48px" }}>
        <div style={{ maxWidth:"1440px",margin:"0 auto" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"20px" }}>
            {["Home","FAQ"].map((crumb,i,arr) => (
              <div key={crumb} style={{ display:"flex",alignItems:"center",gap:"8px" }}>
                {i>0&&<span style={{ fontSize:"9px",color:t.textDim }}>›</span>}
                <span style={{ fontSize:"10px",color:i<arr.length-1?t.textDim:t.textMuted,fontWeight:300 }}>
                  {i<arr.length-1 ? <Link href="/" style={{ textDecoration:"none",color:"inherit" }}>{crumb}</Link> : crumb}
                </span>
              </div>
            ))}
          </div>
          <div className="lxs-faq-banner">
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px" }}>
                <div style={{ width:"18px",height:"1px",background:t.gold }}/>
                <span style={{ fontSize:"8.5px",letterSpacing:"0.26em",textTransform:"uppercase",color:t.gold,fontWeight:500 }}>Help Center</span>
              </div>
              <h1 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(36px,4vw,58px)",fontWeight:300,color:t.text,lineHeight:1.08,letterSpacing:"0.01em",marginBottom:"16px" }}>
                Frequently Asked<br/>Questions
              </h1>
              <p style={{ fontSize:"14px",fontWeight:300,color:t.textMuted,lineHeight:1.8,maxWidth:"440px" }}>
                Answers to our most common questions across ordering, FFL transfers, products, payments, and more.
              </p>
            </div>
            <div>
              <div style={{ position:"relative" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position:"absolute",left:"16px",top:"50%",transform:"translateY(-50%)",color:t.textDim,pointerEvents:"none" }}>
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.1"/>
                  <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                </svg>
                <input ref={searchRef} type="text" placeholder="Search questions…" value={search} onChange={e=>setSearch(e.target.value)}
                  style={{ width:"100%",padding:"15px 48px 15px 44px",background:"#fff",border:`1px solid ${search?t.gold+"60":t.border}`,color:t.text,fontSize:"14px",outline:"none",fontFamily:"var(--font-inter)",fontWeight:300,letterSpacing:"0.02em",transition:"border-color 0.2s" }}/>
                {search && (
                  <button onClick={()=>setSearch("")} style={{ position:"absolute",right:"16px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:t.textDim,padding:"4px" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  </button>
                )}
              </div>
              {search && (
                <div style={{ marginTop:"10px",fontSize:"11px",color:t.textDim,fontWeight:300,letterSpacing:"0.03em" }}>
                  {totalResults! > 0
                    ? <><span style={{ color:t.text,fontWeight:400 }}>{totalResults}</span> result{totalResults!==1?"s":""} for &ldquo;<span style={{ color:t.gold }}>{search}</span>&rdquo;</>
                    : <>No results for &ldquo;<span style={{ color:t.gold }}>{search}</span>&rdquo; — try different keywords</>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="lxs-faq-main" style={{ maxWidth:"1440px",margin:"0 auto",padding:"52px 40px 96px" }}>
        {searchResults ? (
          <div style={{ maxWidth:"800px" }}>
            {searchResults.length === 0 ? (
              <div style={{ textAlign:"center",padding:"80px 0" }}>
                <div style={{ fontFamily:"var(--font-playfair)",fontSize:"28px",fontWeight:300,color:t.textMuted,marginBottom:"12px" }}>No matching questions</div>
                <p style={{ fontSize:"13px",color:t.textDim,fontWeight:300,marginBottom:"24px" }}>Try broader search terms, or contact our support team directly.</p>
                <Link href="/support" style={{ fontSize:"9.5px",letterSpacing:"0.16em",textTransform:"uppercase",color:t.gold,fontWeight:500,textDecoration:"none",borderBottom:`1px solid ${t.gold}50`,paddingBottom:"1px" }}>Contact Support →</Link>
              </div>
            ) : searchResults.map(cat => (
              <div key={cat.id} style={{ marginBottom:"44px" }}>
                <div style={{ display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px",color:t.gold }}>
                  {cat.icon}
                  <span style={{ fontSize:"8.5px",letterSpacing:"0.22em",textTransform:"uppercase",fontWeight:500 }}>{cat.category}</span>
                </div>
                <div style={{ border:`1px solid ${t.border}` }}>
                  {cat.items.map(item => <AccordionItem key={item.id} item={item} isOpen={openItems.has(item.id)} onToggle={()=>toggleItem(item.id)} highlight={search}/>)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="lxs-faq-layout">
            {/* Sidebar */}
            <aside className="lxs-faq-sidebar" style={{ position:"sticky",top:"96px" }}>
              <div style={{ fontSize:"8px",letterSpacing:"0.24em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"16px" }}>Categories</div>
              <div className="lxs-faq-cat-list" style={{ display:"flex",flexDirection:"column",gap:"2px" }}>
                {FAQ_DATA.map(cat => (
                  <button key={cat.id} onClick={()=>{ setActiveCategory(cat.id); setOpenItems(new Set()) }}
                    className={activeCategory===cat.id ? "lxs-faq-cat-btn lxs-faq-cat-active" : "lxs-faq-cat-btn"}
                    style={{ display:"flex",alignItems:"center",gap:"12px",padding:"11px 14px",background:activeCategory===cat.id?"#fafafa":"transparent",border:`1px solid ${activeCategory===cat.id?t.gold+"50":"transparent"}`,cursor:"pointer",textAlign:"left",width:"100%",borderLeft:`2px solid ${activeCategory===cat.id?t.gold:"transparent"}`,transition:"all 0.2s" }}>
                    <span className="lxs-faq-cat-icon" style={{ color:activeCategory===cat.id?t.gold:t.textDim,flexShrink:0,transition:"color 0.2s" }}>{cat.icon}</span>
                    <span style={{ fontSize:"11.5px",fontWeight:activeCategory===cat.id?500:300,color:activeCategory===cat.id?t.gold:t.textMuted,letterSpacing:"0.02em",transition:"color 0.2s" }}>{cat.category}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop:"36px",padding:"20px",background:"#fafafa",border:`1px solid ${t.border}`,borderLeft:`2px solid ${t.gold}40` }}>
                <div style={{ fontSize:"8px",letterSpacing:"0.2em",textTransform:"uppercase",color:t.gold,fontWeight:500,marginBottom:"8px" }}>Still have questions?</div>
                <p style={{ fontSize:"11.5px",fontWeight:300,color:t.textMuted,lineHeight:1.65,marginBottom:"14px" }}>Our team typically responds within one business day.</p>
                <Link href="/support" style={{ display:"flex",alignItems:"center",gap:"6px",fontSize:"9px",letterSpacing:"0.14em",textTransform:"uppercase",color:t.gold,fontWeight:500,textDecoration:"none",borderBottom:`1px solid ${t.gold}50`,paddingBottom:"1px",width:"fit-content" }}>
                  Contact Support
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4H9M6 1L9 4L6 7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              </div>
            </aside>

            {/* Accordion panel */}
            <div>
              {activeSection && (
                <>
                  <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:"28px",gap:"16px",flexWrap:"wrap" }}>
                    <div>
                      <div style={{ display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px",color:t.gold }}>
                        {activeSection.icon}
                        <span style={{ fontSize:"8.5px",letterSpacing:"0.22em",textTransform:"uppercase",fontWeight:500 }}>{activeSection.category}</span>
                      </div>
                      <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(24px,2.5vw,34px)",fontWeight:300,color:t.text,lineHeight:1.1 }}>{activeSection.category}</h2>
                    </div>
                    <div style={{ display:"flex",gap:"10px" }}>
                      <button onClick={()=>expandAll(activeSection.items)} style={btnStyle}
                        onMouseEnter={e=>{ e.currentTarget.style.color=t.gold; e.currentTarget.style.borderColor=t.gold+"55" }}
                        onMouseLeave={e=>{ e.currentTarget.style.color=t.textMuted; e.currentTarget.style.borderColor=t.border }}>
                        Expand All
                      </button>
                      <button onClick={collapseAll} style={btnStyle}
                        onMouseEnter={e=>{ e.currentTarget.style.color=t.gold; e.currentTarget.style.borderColor=t.gold+"55" }}
                        onMouseLeave={e=>{ e.currentTarget.style.color=t.textMuted; e.currentTarget.style.borderColor=t.border }}>
                        Collapse All
                      </button>
                    </div>
                  </div>
                  <div style={{ height:"1px",background:`linear-gradient(to right,${t.gold}40,transparent)`,marginBottom:"0" }}/>
                  <div style={{ border:`1px solid ${t.border}` }}>
                    {activeSection.items.map(item => <AccordionItem key={item.id} item={item} isOpen={openItems.has(item.id)} onToggle={()=>toggleItem(item.id)}/>)}
                  </div>
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"36px",paddingTop:"24px",borderTop:`1px solid ${t.border}` }}>
                    {(() => {
                      const idx = FAQ_DATA.findIndex(c=>c.id===activeCategory)
                      const prev = FAQ_DATA[idx-1]
                      const next = FAQ_DATA[idx+1]
                      const navBtn = { display:"flex",alignItems:"center",gap:"8px",background:"none",border:"none",cursor:"pointer",color:t.textMuted,fontFamily:"var(--font-inter)",fontSize:"9.5px",letterSpacing:"0.12em",textTransform:"uppercase" as const,fontWeight:500,transition:"color 0.2s" }
                      return (
                        <>
                          {prev ? (
                            <button onClick={()=>{ setActiveCategory(prev.id); setOpenItems(new Set()) }} style={navBtn}
                              onMouseEnter={e=>e.currentTarget.style.color=t.gold} onMouseLeave={e=>e.currentTarget.style.color=t.textMuted}>
                              <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              {prev.category}
                            </button>
                          ) : <div/>}
                          {next && (
                            <button onClick={()=>{ setActiveCategory(next.id); setOpenItems(new Set()) }} style={navBtn}
                              onMouseEnter={e=>e.currentTarget.style.color=t.gold} onMouseLeave={e=>e.currentTarget.style.color=t.textMuted}>
                              {next.category}
                              <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SUPPORT CTA */}
      <section style={{ background:"#f3f3f5",borderTop:`1px solid ${t.border}`,borderBottom:`1px solid ${t.border}`,padding:"64px 40px" }}>
        <div style={{ maxWidth:"1440px",margin:"0 auto" }}>
          <div className="lxs-faq-cta">
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px" }}>
                <div style={{ width:"18px",height:"1px",background:t.gold }}/>
                <span style={{ fontSize:"8.5px",letterSpacing:"0.26em",textTransform:"uppercase",color:t.gold,fontWeight:500 }}>Still Need Help?</span>
              </div>
              <h2 style={{ fontFamily:"var(--font-playfair)",fontSize:"clamp(26px,2.8vw,38px)",fontWeight:300,color:t.text,lineHeight:1.15,marginBottom:"14px" }}>
                Our Team Is Here<br/>To Assist You
              </h2>
              <p style={{ fontSize:"13.5px",fontWeight:300,color:t.textMuted,lineHeight:1.8,maxWidth:"400px" }}>
                If you couldn&apos;t find the answer you were looking for, reach out directly. We respond to every inquiry personally.
              </p>
            </div>
            <div style={{ display:"flex",gap:"14px",flexWrap:"wrap" }}>
              {[
                { label:"Call Us", value:"(941) 253-3660", sub:"Mon – Fri, 8:30am – 6pm EST", href:"tel:9412533660" },
                { label:"Toll-Free", value:"(833) 486-6659", sub:"Mon – Fri, 8:30am – 6pm EST", href:"tel:8334866659" },
              ].map(item => (
                <a key={item.href} href={item.href}
                  style={{ flex:1,minWidth:"160px",padding:"20px 24px",background:"#fff",border:`1px solid ${t.border}`,textDecoration:"none",display:"flex",flexDirection:"column",gap:"8px",transition:"border-color 0.2s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=t.gold+"60"} onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color:t.gold }}><path d="M3 2C3 2 1.5 2 1.5 3.5C1.5 5 2.25 9.25 6.25 13.25C10.25 17.25 14.5 17 16 17C17.5 17 17.5 15.5 17.5 15.5L15 11.5C15 11.5 14.25 10.75 13.5 11.5L11.5 13C11.5 13 9.5 12.5 7 10C4.5 7.5 5 5.5 5 5.5L7 3.5C7.75 2.75 7 2 7 2L3 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                  <div style={{ fontSize:"8px",letterSpacing:"0.2em",textTransform:"uppercase",color:t.textDim,fontWeight:500 }}>{item.label}</div>
                  <div style={{ fontSize:"15px",fontFamily:"var(--font-playfair)",fontWeight:400,color:t.text }}>{item.value}</div>
                  <div style={{ fontSize:"10px",color:t.textDim,fontWeight:300 }}>{item.sub}</div>
                </a>
              ))}
              <Link href="/support"
                style={{ flex:1,minWidth:"160px",padding:"20px 24px",background:t.gold,border:`1px solid ${t.gold}`,textDecoration:"none",display:"flex",flexDirection:"column",gap:"8px",transition:"background 0.2s" }}
                onMouseEnter={e=>e.currentTarget.style.background=t.goldLight} onMouseLeave={e=>e.currentTarget.style.background=t.gold}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color:"#fff" }}><rect x="1.5" y="3" width="15" height="12" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 5L9 10.5L16.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                <div style={{ fontSize:"8px",letterSpacing:"0.2em",textTransform:"uppercase",color:"#fff",fontWeight:500,opacity:0.75 }}>Email Support</div>
                <div style={{ fontSize:"15px",fontFamily:"var(--font-playfair)",fontWeight:400,color:"#fff" }}>Send a Message</div>
                <div style={{ fontSize:"10px",color:"#fff",fontWeight:300,opacity:0.7 }}>Response within 1 business day</div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
