'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getOrderById, type LxsOrder } from '@/lib/auth'
import type { SiteSettings } from '@/lib/payload'

const invFmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n || 0)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

function lxcId(order: LxsOrder) {
  return `LXC-${String(order.display_id).padStart(6, '0')}`
}


function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Pending', completed: 'Delivered', canceled: 'Canceled',
    requires_action: 'Action Required', archived: 'Archived',
  }
  return map[status] ?? status.charAt(0).toUpperCase() + status.slice(1)
}

export default function InvoicePage({ orderId, settings }: { orderId: string; settings?: SiteSettings }) {
  const router  = useRouter()
  const { customer, token, isLoading: authLoading } = useAuth()
  const [order,   setOrder]   = useState<LxsOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!token) { router.replace('/auth'); return }
    getOrderById(orderId, token).then(o => {
      if (!o) setNotFound(true)
      else setOrder(o)
      setLoading(false)
    })
  }, [orderId, token, authLoading, router])

  const backdrop = "#eceaea"

  if (loading || authLoading) {
    return (
      <div style={{ background: backdrop, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-inter)", fontSize: "11px", color: "#707076", letterSpacing: "0.1em" }}>
        Loading invoice…
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div style={{ background: backdrop, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-inter)", textAlign: "center" }}>
        <div>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: "24px", color: "#1a1a1a", marginBottom: "10px" }}>Invoice Not Found</div>
          <p style={{ fontSize: "12px", color: "#707076", marginBottom: "20px" }}>This invoice may not be available or you may not have access to it.</p>
          <Link href="/account" style={{ fontSize: "9.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#7e5e10", textDecoration: "none", borderBottom: "1px solid #7e5e1050" }}>← Back to Account</Link>
        </div>
      </div>
    )
  }

  const displayId = lxcId(order)

  // Buyer / Sold To
  const soldToName  = customer ? `${customer.first_name} ${customer.last_name}`.trim() : (order.email ?? '—')
  const soldToPhone = order.metadata?.customer_phone ?? customer?.phone ?? ''
  const soldToEmail = order.email ?? customer?.email ?? ''
  const soldToAddr1 = order.metadata?.buyer_address1 ?? order.billing_address?.address_1 ?? ''
  const soldToCity  = order.metadata?.buyer_city      ?? order.billing_address?.city       ?? ''
  const soldToState = order.metadata?.buyer_state     ?? (order.billing_address?.province?.toUpperCase()) ?? ''
  const soldToZip   = order.metadata?.buyer_zip       ?? order.billing_address?.postal_code ?? ''
  const soldToCityStateZip = [soldToCity, [soldToState, soldToZip].filter(Boolean).join(' ')].filter(Boolean).join(', ')

  // FFL Dealer / Ship To
  const fflName    = order.metadata?.ffl_dealer_name     ?? order.shipping_address?.first_name ?? '—'
  const fflAddr1   = order.metadata?.ffl_dealer_address1 ?? ''
  const fflCity    = order.metadata?.ffl_dealer_city     ?? order.shipping_address?.city       ?? ''
  const fflState   = order.metadata?.ffl_dealer_state    ?? (order.shipping_address?.province?.toUpperCase()) ?? ''
  const fflZip     = order.metadata?.ffl_dealer_zip      ?? ''
  const fflCityStateZip = [fflCity, [fflState, fflZip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  const fflContact = [order.metadata?.ffl_contact_name, order.metadata?.ffl_contact_phone, order.metadata?.ffl_contact_email].filter(Boolean).join(' · ')

  const notes = order.metadata?.notes ?? ''

  const subtotalCents  = order.subtotal      ?? 0
  const taxCents       = order.tax_total     ?? 0
  const shippingCents  = order.shipping_total ?? 0
  const totalCents     = order.total         ?? 0

  const paymentProvider = order.payment_collections?.[0]?.payments?.[0]?.provider_id ?? ''
  const isWire = paymentProvider === 'pp_system_default'
  const paymentMethod = isWire ? 'Wire / Check' : 'Credit / Debit Card'

  return (
    <div className="lxs-invoice-root" style={{ background: backdrop, minHeight: "100vh", padding: "32px 16px 80px", fontFamily: "var(--font-inter)" }}>
      <style>{`
        /* ── Toolbar ── */
        .inv-toolbar { max-width:820px; margin:0 auto 18px; display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; }
        .inv-toolbar .inv-back { font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#525258; text-decoration:none; padding:8px 0; border-bottom:1px solid #c8c8cc; font-weight:500; }
        .inv-toolbar .inv-back:hover { color:#7e5e10; }
        .inv-toolbar .inv-actions { display:flex; gap:10px; flex-wrap:wrap; }
        .inv-btn { padding:11px 22px; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; font-weight:600; font-family:var(--font-inter); border:1px solid transparent; cursor:pointer; background:none; transition:background 0.18s,border-color 0.18s,color 0.18s; min-height:44px; display:inline-flex; align-items:center; gap:8px; }
        .inv-btn-primary { background:#7e5e10; color:#ffffff; }
        .inv-btn-primary:hover { background:#9a7218; }
        .inv-btn-secondary { border-color:#c8c8cc; color:#1a1a1a; }
        .inv-btn-secondary:hover { border-color:#7e5e10; color:#7e5e10; }

        /* ── Paper sheet ── */
        .inv-sheet { width:100%; max-width:820px; margin:0 auto; background:#ffffff; color:#1a1a1a; padding:56px 56px 48px; box-shadow:0 30px 80px rgba(0,0,0,0.32),0 4px 16px rgba(0,0,0,0.18); line-height:1.5; font-size:11.5px; }
        .inv-gold { color:#7e5e10; }
        .inv-serif { font-family:var(--font-playfair); font-weight:400; }
        .inv-label { font-size:8px; letter-spacing:0.22em; text-transform:uppercase; color:#707076; font-weight:600; margin-bottom:6px; }
        .inv-value { font-size:12px; font-weight:400; color:#1a1a1a; }

        /* Masthead */
        .inv-stripe { height:3px; background:#7e5e10; margin:-56px -56px 36px; }
        .inv-masthead { display:flex; align-items:flex-start; justify-content:space-between; gap:30px; padding-bottom:28px; border-bottom:1px solid #e4e4e6; margin-bottom:28px; }
        .inv-brand { display:flex; flex-direction:column; gap:4px; }
        .inv-brand .inv-co { font-family:var(--font-playfair); font-size:18px; font-weight:500; color:#1a1a1a; letter-spacing:0.02em; }
        .inv-brand .inv-meta { font-size:11px; font-weight:300; color:#525258; line-height:1.6; }
        .inv-brand .inv-meta a { color:inherit; text-decoration:none; }
        .inv-title-block { text-align:right; flex-shrink:0; }
        .inv-title-block .inv-title-word { font-family:var(--font-playfair); font-size:38px; font-weight:400; letter-spacing:0.12em; color:#1a1a1a; line-height:1; text-transform:uppercase; }
        .inv-title-block .inv-title-sub { font-size:8.5px; letter-spacing:0.28em; text-transform:uppercase; color:#7e5e10; font-weight:600; margin-top:8px; }

        /* Meta strip */
        .inv-meta-strip { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; padding:14px 18px; background:#faf7f0; border:1px solid #efe9d6; border-left:3px solid #7e5e10; margin-bottom:32px; }

        /* Parties */
        .inv-parties { display:grid; grid-template-columns:1fr 1fr; gap:28px; margin-bottom:30px; }
        .inv-party { padding:18px 20px; border:1px solid #e4e4e6; }
        .inv-party .inv-party-name { font-weight:500; font-size:13px; color:#1a1a1a; margin-bottom:4px; }
        .inv-party .inv-sub { font-size:10.5px; color:#525258; font-weight:300; line-height:1.55; }

        /* Comments */
        .inv-comments { padding:16px 20px; border:1px dashed #c8c8cc; margin-bottom:32px; font-size:10.5px; color:#525258; line-height:1.7; font-weight:300; }
        .inv-comments strong { color:#1a1a1a; font-weight:500; }

        /* Order bar */
        .inv-orderbar { display:grid; grid-template-columns:repeat(5,1fr); border:1px solid #1a1a1a; margin-bottom:22px; overflow:hidden; }
        .inv-orderbar-cell { padding:10px 12px; border-right:1px solid #1a1a1a; font-size:10.5px; color:#1a1a1a; font-weight:400; background:#ffffff; min-height:56px; display:flex; flex-direction:column; gap:4px; }
        .inv-orderbar-cell:last-child { border-right:none; }
        .inv-orderbar-cell .inv-orderbar-head { font-size:7.5px; letter-spacing:0.18em; text-transform:uppercase; font-weight:700; background:#1a1a1a; color:#ffffff; margin:-10px -12px 6px; padding:6px 12px; }

        /* Items table */
        .inv-table { width:100%; border-collapse:collapse; margin-bottom:24px; }
        .inv-table thead th { background:#1a1a1a; color:#ffffff; font-size:8.5px; letter-spacing:0.18em; text-transform:uppercase; font-weight:600; padding:10px 12px; text-align:left; }
        .inv-table thead th.right { text-align:right; }
        .inv-table thead th.center { text-align:center; }
        .inv-table tbody td { padding:14px 12px; border-bottom:1px solid #e4e4e6; vertical-align:top; font-size:11.5px; }
        .inv-table tbody td.right { text-align:right; font-variant-numeric:tabular-nums; }
        .inv-table tbody td.center { text-align:center; }
        .inv-item-title { font-family:var(--font-playfair); font-size:14px; font-weight:400; color:#1a1a1a; margin-bottom:3px; }
        .inv-item-meta { font-size:10px; color:#707076; font-weight:300; letter-spacing:0.02em; line-height:1.5; }
        .inv-item-meta strong { color:#1a1a1a; font-weight:500; letter-spacing:0.04em; }

        /* Totals */
        .inv-totals { display:flex; justify-content:flex-end; margin-bottom:32px; }
        .inv-totals-box { width:320px; max-width:100%; }
        .inv-totals-row { display:flex; justify-content:space-between; padding:8px 0; font-size:11.5px; color:#1a1a1a; }
        .inv-totals-row .lbl { color:#525258; font-size:9.5px; letter-spacing:0.16em; text-transform:uppercase; font-weight:500; }
        .inv-totals-row.total { border-top:1px solid #1a1a1a; margin-top:8px; padding-top:14px; align-items:baseline; }
        .inv-totals-row.total .lbl { color:#1a1a1a; font-weight:700; font-size:10.5px; }
        .inv-totals-row.total .val { font-family:var(--font-playfair); font-size:22px; font-weight:500; color:#7e5e10; }

        /* Disclaimer */
        .inv-disclaimer { font-size:10px; color:#707076; font-weight:300; padding:14px 18px; background:#fafafa; border-left:2px solid #7e5e10; margin-bottom:22px; line-height:1.7; }
        .inv-disclaimer strong { color:#1a1a1a; font-weight:500; }

        /* Payment */
        .inv-payment { border-top:1px solid #e4e4e6; padding-top:22px; display:grid; grid-template-columns:1fr 1fr; gap:28px; margin-bottom:22px; }
        .inv-payment h4 { font-size:8.5px; letter-spacing:0.22em; text-transform:uppercase; color:#7e5e10; font-weight:600; margin-bottom:10px; }
        .inv-payment .row { display:flex; justify-content:space-between; gap:8px; padding:4px 0; font-size:11px; }
        .inv-payment .row .k { color:#707076; font-weight:400; }
        .inv-payment .row .v { color:#1a1a1a; font-weight:500; font-variant-numeric:tabular-nums; text-align:right; }

        /* Footer */
        .inv-footer { border-top:1px solid #e4e4e6; padding-top:18px; font-size:9.5px; color:#707076; line-height:1.7; font-weight:300; }
        .inv-footer strong { color:#1a1a1a; font-weight:500; }
        .inv-footer-title { font-size:8.5px; letter-spacing:0.22em; text-transform:uppercase; color:#1a1a1a; font-weight:600; margin-bottom:8px; }

        /* ── Responsive ── */
        @media (max-width:640px) {
          .lxs-invoice-root { padding:16px 0 56px !important; }
          .inv-toolbar { padding:0 14px; }
          .inv-sheet { padding:28px 22px 32px; box-shadow:none; }
          .inv-stripe { margin:-28px -22px 24px; }
          .inv-masthead { flex-direction:column; align-items:stretch; gap:20px; padding-bottom:20px; margin-bottom:22px; }
          .inv-title-block { text-align:left; }
          .inv-title-block .inv-title-word { font-size:30px; }
          .inv-meta-strip { grid-template-columns:1fr; gap:12px; padding:14px 16px; margin-bottom:22px; }
          .inv-parties { grid-template-columns:1fr; gap:14px; margin-bottom:22px; }
          .inv-orderbar { grid-template-columns:1fr 1fr; }
          .inv-orderbar-cell:nth-child(2n) { border-right:none; }
          .inv-orderbar-cell { border-bottom:1px solid #1a1a1a; }
          .inv-orderbar-cell:nth-last-child(-n+2) { border-bottom:none; }
          .inv-orderbar-cell:last-child:nth-child(odd) { grid-column:1 / -1; }
          .inv-table thead { display:none; }
          .inv-table tbody td { display:block; padding:6px 0; border-bottom:none; }
          .inv-table tbody tr { display:block; border-bottom:1px solid #e4e4e6; padding:14px 0; }
          .inv-table tbody td.right { text-align:right; }
          .inv-table tbody td.center { text-align:left; }
          .inv-table tbody td.center::before { content:"Qty: "; color:#707076; font-size:10px; letter-spacing:0.12em; text-transform:uppercase; font-weight:500; }
          .inv-table tbody td.right.price::before { content:"Unit Price: "; color:#707076; font-size:10px; letter-spacing:0.12em; text-transform:uppercase; font-weight:500; }
          .inv-table tbody td.right.total::before { content:"Line Total: "; color:#707076; font-size:10px; letter-spacing:0.12em; text-transform:uppercase; font-weight:500; }
          .inv-totals-box { width:100%; }
          .inv-payment { grid-template-columns:1fr; gap:18px; }
        }

        /* ── Print ── */
        @media print {
          @page { size:Letter; margin:0.4in; }
          html, body { background:#ffffff !important; }
          header, footer.lxs-footer { display:none !important; }
          main { padding-top:0 !important; }
          .lxs-invoice-root { background:#ffffff !important; padding:0 !important; min-height:0 !important; }
          .inv-toolbar { display:none !important; }
          .inv-sheet { box-shadow:none !important; padding:0 !important; max-width:none !important; width:100% !important; font-size:9.5px !important; line-height:1.4 !important; }
          .inv-stripe { height:2px !important; margin:0 0 14px !important; }
          .inv-masthead { flex-direction:row !important; align-items:flex-start !important; padding-bottom:12px !important; margin-bottom:14px !important; gap:20px !important; }
          .inv-brand .inv-co { font-size:13px !important; }
          .inv-brand .inv-meta { font-size:9px !important; line-height:1.4 !important; }
          .inv-title-block { text-align:right !important; }
          .inv-title-block .inv-title-word { font-size:24px !important; }
          .inv-meta-strip { grid-template-columns:repeat(3,1fr) !important; padding:8px 12px !important; margin-bottom:14px !important; gap:12px !important; }
          .inv-label { font-size:7px !important; margin-bottom:3px !important; }
          .inv-value { font-size:10px !important; }
          .inv-parties { grid-template-columns:1fr 1fr !important; gap:12px !important; margin-bottom:12px !important; }
          .inv-party { padding:10px 12px !important; }
          .inv-party .inv-party-name { font-size:11px !important; }
          .inv-party .inv-sub { font-size:9px !important; line-height:1.45 !important; }
          .inv-comments { padding:8px 12px !important; margin-bottom:12px !important; font-size:8.5px !important; line-height:1.45 !important; }
          .inv-orderbar { grid-template-columns:repeat(5,1fr) !important; margin-bottom:10px !important; }
          .inv-orderbar-cell { border-right:1px solid #1a1a1a !important; border-bottom:none !important; padding:6px 8px !important; font-size:9px !important; min-height:0 !important; }
          .inv-orderbar-cell:last-child { border-right:none !important; }
          .inv-orderbar-cell .inv-orderbar-head { font-size:6.5px !important; margin:-6px -8px 4px !important; padding:4px 8px !important; }
          .inv-table thead { display:table-header-group !important; }
          .inv-table thead th { padding:6px 10px !important; font-size:7.5px !important; }
          .inv-table tbody td { display:table-cell !important; padding:8px 10px !important; border-bottom:1px solid #e4e4e6 !important; font-size:10px !important; }
          .inv-table tbody tr { display:table-row !important; }
          .inv-table tbody td::before { content:none !important; }
          .inv-table tbody td.right { text-align:right !important; }
          .inv-table tbody td.center { text-align:center !important; }
          .inv-item-title { font-size:11.5px !important; }
          .inv-item-meta { font-size:8.5px !important; }
          .inv-totals { margin-bottom:12px !important; }
          .inv-totals-box { width:280px !important; }
          .inv-totals-row { padding:4px 0 !important; font-size:10px !important; }
          .inv-totals-row.total { padding-top:8px !important; margin-top:4px !important; }
          .inv-totals-row.total .val { font-size:16px !important; }
          .inv-disclaimer { padding:8px 12px !important; margin-bottom:12px !important; font-size:8.5px !important; line-height:1.45 !important; }
          .inv-payment { grid-template-columns:1fr 1fr !important; padding-top:12px !important; margin-bottom:12px !important; }
          .inv-payment h4 { font-size:7.5px !important; margin-bottom:6px !important; }
          .inv-payment .row { padding:2px 0 !important; font-size:9px !important; }
          .inv-footer { padding-top:10px !important; font-size:8px !important; line-height:1.45 !important; }
          .inv-footer > div:last-child { display:none !important; }
          .inv-sheet, .inv-masthead, .inv-meta-strip, .inv-parties, .inv-comments, .inv-orderbar, .inv-totals, .inv-disclaimer, .inv-payment, .inv-footer { page-break-inside:avoid; break-inside:avoid; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="inv-toolbar">
        <Link href="/account" className="inv-back">← Back to Account</Link>
        <div className="inv-actions">
          <button className="inv-btn inv-btn-primary" onClick={() => window.print()}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 1H11V4H3V1Z" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M2 4H12C12.55 4 13 4.45 13 5V9H10V12H4V9H1V5C1 4.45 1.45 4 2 4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M4 7.5H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Download / Print
          </button>
        </div>
      </div>

      {/* Paper sheet */}
      <article className="inv-sheet">
        <div className="inv-stripe"/>

        <header className="inv-masthead">
          <div className="inv-brand">
            <div className="inv-co">Luxus Collection, LLC</div>
            <div className="inv-meta">
              {settings?.address.line1 ?? "1199 N Beneva Rd"}<br/>
              {settings?.address.city ?? "Sarasota"}, {settings?.address.state ?? "FL"} {settings?.address.zip ?? "34232"}<br/>
              <a href={`tel:${(settings?.contact.phone ?? "(941) 253-3660").replace(/\D/g,'')}`}>{settings?.contact.phone ?? "(941) 253-3660"}</a>
              {settings?.contact.phoneTollFree && <> · <a href={`tel:${settings.contact.phoneTollFree.replace(/\D/g,'')}`}>{settings.contact.phoneTollFree}</a></>}
            </div>
          </div>
          <div className="inv-title-block">
            <div className="inv-title-word">Invoice</div>
            <div className="inv-title-sub">Buyer Copy</div>
          </div>
        </header>

        <section className="inv-meta-strip">
          <div><div className="inv-label">Invoice #</div><div className="inv-value">{displayId}</div></div>
          <div><div className="inv-label">Date</div><div className="inv-value">{fmtDate(order.created_at)}</div></div>
          <div><div className="inv-label">Status</div><div className="inv-value inv-gold" style={{ fontWeight: 600 }}>{statusLabel(order.status)}</div></div>
        </section>

        <section className="inv-parties">
          <div className="inv-party">
            <div className="inv-label">Sold To</div>
            <div className="inv-party-name">{soldToName}</div>
            <div className="inv-sub">
              {soldToEmail && <>{soldToEmail}<br/></>}
              {soldToPhone && <>{soldToPhone}<br/></>}
              {soldToAddr1 && <>{soldToAddr1}<br/></>}
              {soldToCityStateZip && <>{soldToCityStateZip}</>}
            </div>
          </div>
          <div className="inv-party">
            <div className="inv-label">Ship To (FFL Dealer)</div>
            <div className="inv-party-name">{fflName || '—'}</div>
            <div className="inv-sub">
              {fflAddr1 && <>{fflAddr1}<br/></>}
              {fflCityStateZip && <>{fflCityStateZip}<br/></>}
              {fflContact && <>{fflContact}<br/></>}
              FFL Transfer — dealer will contact you upon arrival
            </div>
          </div>
        </section>

        {(notes || true) && (
          <section className="inv-comments">
            <strong>Comments or Special Instructions:</strong><br/>
            {notes ? <>{notes}<br/></> : null}
            Sale will become final only upon full payment and physical delivery to FFL, at the Ship To address. Luxus Collection, LLC does not warrant product compliance with local or state laws. Retailers must ensure all products sold are compliant with local, state, and federal regulations.
          </section>
        )}

        <section className="inv-orderbar">
          <div className="inv-orderbar-cell"><div className="inv-orderbar-head">Order #</div><div>{displayId}</div></div>
          <div className="inv-orderbar-cell"><div className="inv-orderbar-head">Buyer</div><div>{soldToName}</div></div>
          <div className="inv-orderbar-cell"><div className="inv-orderbar-head">Shipped Via</div><div>FedEx</div></div>
          <div className="inv-orderbar-cell"><div className="inv-orderbar-head">F.O.B. Point</div><div style={{ fontSize: "10px", lineHeight: 1.4 }}>FFL provided by client prior to shipping</div></div>
          <div className="inv-orderbar-cell"><div className="inv-orderbar-head">Terms</div><div>{isWire ? 'Wire / Check' : 'Paid by Card'}</div></div>
        </section>

        <table className="inv-table">
          <thead>
            <tr>
              <th className="center" style={{ width: "10%" }}>Qty</th>
              <th>Description</th>
              <th className="right" style={{ width: "16%" }}>Unit Price</th>
              <th className="right" style={{ width: "16%" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={item.id ?? i}>
                <td className="center">{item.quantity}</td>
                <td>
                  <div className="inv-item-title">{item.title}</div>
                  {item.variant?.product?.brand && (
                    <div className="inv-item-meta">
                      <strong>{item.variant.product.brand}</strong>
                      {item.variant.product.attributes?.caliber && <> · {item.variant.product.attributes.caliber}</>}
                    </div>
                  )}
                </td>
                <td className="right price">{invFmt(item.unit_price / 100)}</td>
                <td className="right total">{invFmt((item.unit_price * item.quantity) / 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="inv-totals">
          <div className="inv-totals-box">
            <div className="inv-totals-row"><span className="lbl">Subtotal</span><span>{invFmt(subtotalCents / 100)}</span></div>
            <div className="inv-totals-row"><span className="lbl">Sales Tax</span><span>{taxCents ? invFmt(taxCents / 100) : "—"}</span></div>
            <div className="inv-totals-row"><span className="lbl">Shipping &amp; Handling</span><span>{shippingCents ? invFmt(shippingCents / 100) : "Included"}</span></div>
            <div className="inv-totals-row total"><span className="lbl">Total Due</span><span className="val">{invFmt(totalCents / 100)}</span></div>
          </div>
        </section>

        <section className="inv-disclaimer">
          <strong>All items are sold as-is, with all faults.</strong> No warranties or representations, expressed or implied, are provided. Payment due upon receipt of this invoice.
        </section>

        <section className="inv-payment">
          <div>
            <h4>Make Checks Payable To</h4>
            <div className="row"><span className="k">Payable to</span><span className="v">Luxus Collection, LLC</span></div>
            <div className="row"><span className="k">Mail to</span><span className="v" style={{ maxWidth: "180px" }}>{settings?.address.line1 ?? "1199 N Beneva Rd"}<br/>{settings?.address.city ?? "Sarasota"}, {settings?.address.state ?? "FL"} {settings?.address.zip ?? "34232"}</span></div>
          </div>
          <div>
            <h4>Wire Transfer</h4>
            <div className="row"><span className="k">Bank</span><span className="v">Truist Bank</span></div>
            <div className="row"><span className="k">ABA Routing</span><span className="v">263191387</span></div>
            <div className="row"><span className="k">For Credit To</span><span className="v">Luxus Capital, LLC</span></div>
            <div className="row"><span className="k">Account No.</span><span className="v">1100009085694</span></div>
            <div className="row"><span className="k">Memo</span><span className="v">{displayId}</span></div>
          </div>
        </section>

        <footer className="inv-footer">
          <div className="inv-footer-title">Shipping Policy</div>
          Risk of loss and title for all merchandise pass to the Buyer upon our delivery to the carrier. Any claims for damage or loss in transit must be filed by the Buyer with the carrier. To arrange alternative shipping or supplemental insurance, please contact us for written approval prior to shipment.
          <div style={{ marginTop: "14px", textAlign: "center", color: "#a0a0a4", letterSpacing: "0.18em", textTransform: "uppercase", fontSize: "8.5px" }}>
            End of Invoice — {displayId}
          </div>
        </footer>
      </article>
    </div>
  )
}
