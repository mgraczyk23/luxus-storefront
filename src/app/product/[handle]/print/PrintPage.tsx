'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { MappedProduct } from '@/lib/medusa'
import type { SiteSettings } from '@/lib/payload'

const PLAYFAIR = "var(--font-playfair), serif"
const GOLD = "#c09530"

function formatOverview(text: string): string {
  if (/<p[\s>]/i.test(text)) return text
  return '<p>' + text.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>') + '</p>'
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)

export default function PrintPage({ product, settings }: { product: MappedProduct; settings?: SiteSettings }) {
  const triggered = useRef(false)
  const [productUrl, setProductUrl] = useState(`https://luxus-collection.com/product/${product.handle}`)

  useEffect(() => {
    setProductUrl(window.location.origin + `/product/${product.handle}`)
    if (triggered.current) return
    triggered.current = true
    const t = setTimeout(() => window.print(), 800)
    return () => clearTimeout(t)
  }, [product.handle])

  // Same spec-building logic as the main PDP
  const baseSpecs: Record<string, string> = {}
  if (product.attributes?.caliber)       baseSpecs["Caliber"]      = product.attributes.caliber
  if (product.attributes?.action)        baseSpecs["Action"]        = product.attributes.action
  if (product.attributes?.barrel_length) baseSpecs["Barrel Length"] = product.attributes.barrel_length
  if (product.attributes?.model)         baseSpecs["Model"]         = product.attributes.model
  const specEntries = Object.entries({ ...baseSpecs, ...(product.specifications ?? {}) })

  const printDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  const mainImage = product.images[0] ?? product.thumbnail
  const extraImages = product.images.slice(1, 5)

  const sectionHead = (label: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
      <div style={{ width: "18px", height: "1px", background: GOLD }} />
      <span style={{ fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase" as const, color: GOLD, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>{label}</span>
    </div>
  )

  return (
    <>
      {/* ── Critical print CSS ────────────────────────────────────────────── */}
      <style>{`
        .lxs-print-root {
          position: fixed; inset: 0; z-index: 99999;
          background: #fff; overflow-y: auto;
          font-family: 'Inter', sans-serif; color: #1a1a1a;
        }
        .lxs-print-inner {
          max-width: 800px; margin: 0 auto; padding: 0 48px 80px;
        }
        .lxs-print-overview p { margin: 0 0 1.1em; }
        .lxs-print-overview p:last-child { margin-bottom: 0; }

        @media print {
          @page { margin: 0.65in; size: letter portrait; }
          header, footer, .lxs-sticky-buy, nav { display: none !important; }
          main { padding: 0 !important; }
          body > * { visibility: hidden; }
          .lxs-print-root, .lxs-print-root * { visibility: visible; }
          .lxs-print-root {
            position: static !important; overflow: visible !important;
            height: auto !important; z-index: auto !important;
          }
          .lxs-print-inner { padding: 0 !important; max-width: 100% !important; }
          .lxs-print-actions { display: none !important; }
          .lxs-print-spec-row { break-inside: avoid; }
          .lxs-print-section { break-inside: avoid; }
        }
      `}</style>

      <div className="lxs-print-root">

        {/* ── Actions bar (screen only) ──────────────────────────────────── */}
        <div className="lxs-print-actions" style={{
          position: "sticky", top: 0, background: "#fff",
          borderBottom: "1px solid #e8e8e8", padding: "10px 48px",
          display: "flex", alignItems: "center", gap: "10px", zIndex: 10,
        }}>
          <span style={{ flex: 1, fontSize: "11px", color: "#999", fontFamily: "'Inter',sans-serif" }}>
            Print preview — {product.title}
          </span>
          <button onClick={() => window.print()} style={{
            padding: "8px 22px", background: "#1a1a1a", border: "none",
            color: "#fff", fontSize: "10px", letterSpacing: "0.12em",
            textTransform: "uppercase", fontFamily: "'Inter',sans-serif",
            fontWeight: 600, cursor: "pointer",
          }}>Print</button>
          <button onClick={() => window.close()} style={{
            padding: "8px 16px", background: "none",
            border: "1px solid #d4d4d4", color: "#666",
            fontSize: "10px", letterSpacing: "0.06em",
            fontFamily: "'Inter',sans-serif", cursor: "pointer",
          }}>Close</button>
        </div>

        <div className="lxs-print-inner">

          {/* ── Letterhead ──────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingTop: "36px", marginBottom: "8px" }}>
            <div>
              <div style={{ fontFamily: PLAYFAIR, fontSize: "28px", fontWeight: 400, color: "#1a1a1a", letterSpacing: "0.05em" }}>
                LUXUS COLLECTION
              </div>
              <div style={{ fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#999", marginTop: "3px" }}>
                Fine Firearms for the Discerning Collector
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "9px", color: "#bbb", letterSpacing: "0.04em" }}>luxus-collection.com</div>
              <div style={{ fontSize: "9px", color: "#bbb", marginTop: "2px" }}>{printDate}</div>
            </div>
          </div>
          <div style={{ height: "1px", background: GOLD, marginBottom: "32px" }} />

          {/* ── Product identification ───────────────────────────────────── */}
          <div className="lxs-print-section" style={{ marginBottom: "24px" }}>
            {product.brand && (
              <div style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: GOLD, fontWeight: 500, marginBottom: "6px", fontFamily: "'Inter',sans-serif" }}>
                {product.brand}
              </div>
            )}
            <h1 style={{ fontFamily: PLAYFAIR, fontSize: "32px", fontWeight: 300, color: "#1a1a1a", lineHeight: 1.1, letterSpacing: "0.01em", margin: "0 0 6px" }}>
              {product.title}
            </h1>
            {product.subtitle && (
              <div style={{ fontFamily: PLAYFAIR, fontSize: "18px", fontWeight: 400, fontStyle: "italic", color: GOLD, marginBottom: "6px" }}>
                {product.subtitle}
              </div>
            )}
            <div style={{ display: "flex", gap: "20px", alignItems: "center", marginTop: "10px", fontFamily: "'Inter',sans-serif" }}>
              {product.sku && (
                <span style={{ fontSize: "10px", color: "#999", letterSpacing: "0.06em" }}>SKU: {product.sku}</span>
              )}
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", color: product.in_stock ? "#4a8a4a" : "#8a4a4a" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: product.in_stock ? "#5a9a5a" : "#9a5a5a", display: "inline-block", flexShrink: 0 }} />
                {product.in_stock ? "Available" : "Currently Unavailable"}
              </span>
            </div>
          </div>

          {/* ── Price ───────────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", padding: "12px 16px", background: "#f8f8f8", border: "1px solid #e8e8e8", borderLeft: `3px solid ${GOLD}`, marginBottom: "32px", fontFamily: "'Inter',sans-serif" }}>
            <span style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#999", fontWeight: 500 }}>Price</span>
            <span style={{ fontFamily: PLAYFAIR, fontSize: "26px", fontWeight: 300, color: product.contact_for_pricing ? GOLD : "#1a1a1a" }}>
              {product.contact_for_pricing ? "Contact Us For Pricing" : product.price !== null ? fmt(product.price) : "—"}
            </span>
          </div>

          {/* ── Images ──────────────────────────────────────────────────── */}
          {mainImage && (
            <div className="lxs-print-section" style={{ marginBottom: "32px" }}>
              <div style={{ position: "relative", width: "100%", maxWidth: "600px", aspectRatio: "4/3", margin: "0 auto", background: "#f4f4f4", border: "1px solid #e8e8e8", overflow: "hidden" }}>
                <Image src={mainImage} alt={product.title} fill style={{ objectFit: "contain" }} sizes="600px" priority />
              </div>
              {extraImages.length > 0 && (
                <div style={{ marginTop: "10px", display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                  {extraImages.map((src, i) => (
                    <div key={i} style={{ position: "relative", width: "136px", aspectRatio: "4/3", background: "#f4f4f4", border: "1px solid #e8e8e8", overflow: "hidden", flexShrink: 0 }}>
                      <Image src={src} alt="" fill style={{ objectFit: "contain" }} sizes="136px" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Short description ───────────────────────────────────────── */}
          {product.short_description && (
            <div style={{ marginBottom: "28px", borderLeft: `2px solid ${GOLD}`, paddingLeft: "14px" }}>
              <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.8, fontWeight: 300, margin: 0, fontFamily: "'Inter',sans-serif" }}>
                {product.short_description}
              </p>
            </div>
          )}

          {/* ── Overview / Description ──────────────────────────────────── */}
          {product.overview && (
            <div className="lxs-print-section" style={{ marginBottom: "32px" }}>
              {sectionHead("Description of This Piece")}
              <div
                className="lxs-print-overview"
                style={{ fontFamily: PLAYFAIR, fontSize: "15px", fontWeight: 300, color: "#1a1a1a", lineHeight: 1.85 }}
                dangerouslySetInnerHTML={{ __html: formatOverview(product.overview) }}
              />
            </div>
          )}

          {/* ── Highlights ──────────────────────────────────────────────── */}
          {product.highlights?.length > 0 && (
            <div className="lxs-print-section" style={{ marginBottom: "32px" }}>
              {sectionHead("Highlights")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {product.highlights.map(({ title, body }: { title: string; body: string }) => (
                  <div key={title} style={{ background: "#f8f8f8", border: "1px solid #e8e8e8", padding: "12px 14px" }}>
                    <div style={{ fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, fontWeight: 600, marginBottom: "4px", fontFamily: "'Inter',sans-serif" }}>{title}</div>
                    <div style={{ fontSize: "11.5px", color: "#555", fontWeight: 300, lineHeight: 1.6, fontFamily: "'Inter',sans-serif" }}>{body}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Specifications ──────────────────────────────────────────── */}
          {specEntries.length > 0 && (
            <div className="lxs-print-section" style={{ marginBottom: "32px" }}>
              {sectionHead("Specifications")}
              <div style={{ border: "1px solid #e8e8e8" }}>
                {specEntries.map(([label, value], i) => (
                  <div key={label} className="lxs-print-spec-row"
                    style={{ display: "grid", gridTemplateColumns: "1fr 2fr", padding: "9px 14px", background: i % 2 === 0 ? "#fff" : "#f8f8f8", borderBottom: i < specEntries.length - 1 ? "1px solid #e8e8e8" : "none" }}>
                    <span style={{ fontSize: "10.5px", color: "#888", fontWeight: 400, fontFamily: "'Inter',sans-serif" }}>{label}</span>
                    <span style={{ fontSize: "11px", color: "#1a1a1a", fontWeight: 400, fontFamily: "'Inter',sans-serif" }}>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── In the Box ──────────────────────────────────────────────── */}
          {product.in_the_box?.length > 0 && (
            <div className="lxs-print-section" style={{ marginBottom: "32px" }}>
              {sectionHead("What's Included")}
              <div>
                {product.in_the_box.map((item: string, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "7px 0", borderBottom: i < product.in_the_box.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                    <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: GOLD, flexShrink: 0, marginTop: "6px", display: "inline-block" }} />
                    <span style={{ fontSize: "12px", color: "#333", fontWeight: 300, lineHeight: 1.5, fontFamily: "'Inter',sans-serif" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Contact ─────────────────────────────────────────────────── */}
          <div style={{ background: "#f8f8f8", border: "1px solid #e8e8e8", borderLeft: `3px solid ${GOLD}`, padding: "18px 20px", marginBottom: "20px", fontFamily: "'Inter',sans-serif" }}>
            <div style={{ fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: GOLD, fontWeight: 600, marginBottom: "14px" }}>
              Contact Luxus Collection
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              {[
                { label: "Direct",    value: settings?.contact.phone        ?? "(941) 253-3660" },
                { label: "Toll-Free", value: settings?.contact.phoneTollFree ?? "(833) 486-6659" },
                { label: "Email",     value: settings?.contact.emailInfo     ?? "info@luxus-collection.com" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#bbb", fontWeight: 500, marginBottom: "3px" }}>{label}</div>
                  <div style={{ fontSize: "11.5px", color: "#1a1a1a", fontWeight: 400 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── FFL notice ──────────────────────────────────────────────── */}
          <div style={{ fontSize: "9.5px", color: "#aaa", lineHeight: 1.65, fontWeight: 300, marginBottom: "28px", fontFamily: "'Inter',sans-serif" }}>
            <strong style={{ color: "#888", fontWeight: 500 }}>FFL Transfer Required: </strong>
            All firearms must be transferred through a licensed FFL dealer in your state.
            Contact us or visit our website to provide your dealer&apos;s information.
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div style={{ borderTop: "1px solid #e8e8e8", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Inter',sans-serif" }}>
            <span style={{ fontSize: "8.5px", color: "#ccc", letterSpacing: "0.04em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{productUrl}</span>
            <span style={{ fontSize: "8.5px", color: "#ccc", flexShrink: 0 }}>© {new Date().getFullYear()} Luxus Collection</span>
          </div>
        </div>
      </div>
    </>
  )
}
