'use client'

import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'

const PLAYFAIR = "var(--font-playfair), serif"

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)

type Props = {
  productId: string
  productTitle: string
  productHandle: string
  listedPrice: number | null
  contactForPricing: boolean
  onClose: () => void
}

type FormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  offerAmount: string
  message: string
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function MakeAnOfferModal({
  productId,
  productTitle,
  productHandle,
  listedPrice,
  contactForPricing,
  onClose,
}: Props) {
  const { t } = useTheme()

  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    offerAmount: "",
    message: "",
  })
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState("")

  const set = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  // Parse and validate offer amount — digits and one decimal point only
  const handleAmountChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, "").replace(/^(\d*\.?\d*).*/, "$1")
    set("offerAmount", cleaned)
  }

  const offerNum = parseFloat(form.offerAmount)
  const offerValid = !isNaN(offerNum) && offerNum > 0
  const canSubmit = form.firstName.trim() && form.email.trim() && offerValid && status !== 'submitting'

  // Percentage of list price — only shown when list price is known
  const pctOfList = listedPrice && offerValid ? Math.round((offerNum / listedPrice) * 100) : null

  const handleSubmit = async () => {
    if (!canSubmit) return
    setStatus('submitting')
    setErrorMsg("")

    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id:     productId,
          product_handle: productHandle,
          product_title:  productTitle,
          first_name:     form.firstName.trim(),
          last_name:      form.lastName.trim(),
          email:          form.email.trim(),
          phone:          form.phone.trim() || null,
          offer_amount:   offerNum,
          message:        form.message.trim() || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }

      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    background: "#ffffff",
    border: `1px solid ${t.border}`,
    color: t.text,
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 300,
    letterSpacing: "0.02em",
    outline: "none",
    borderRadius: "1px",
    boxSizing: "border-box",
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "8.5px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: t.textMuted,
    fontWeight: 500,
    marginBottom: "6px",
  }

  return (
    <div
      onClick={() => { if (status !== 'submitting') onClose() }}
      style={{
        position: "fixed", inset: 0, zIndex: 10002,
        background: "rgba(8,7,6,0.82)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 20px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "540px",
          background: "#fff",
          border: `1px solid ${t.border}`,
          borderTop: `2px solid ${t.gold}`,
          boxShadow: "0 30px 80px rgba(0,0,0,0.18)",
          position: "relative",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "16px", right: "16px",
            width: "32px", height: "32px",
            background: "none", border: `1px solid ${t.border}`,
            color: t.textMuted, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.18s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold + "60"; e.currentTarget.style.color = t.gold }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted }}
          aria-label="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>

        {/* ── Success state ──────────────────────────────────────────────── */}
        {status === 'success' ? (
          <div style={{ padding: "48px 44px 44px", textAlign: "center" }}>
            <div style={{
              width: "56px", height: "56px",
              border: `1px solid ${t.gold}`,
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                <path d="M1 8L8 15L21 1" stroke={t.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontFamily: PLAYFAIR, fontSize: "28px", fontWeight: 400, color: t.text, marginBottom: "12px" }}>
              Offer Submitted
            </div>
            <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted, lineHeight: 1.8, maxWidth: "380px", margin: "0 auto 8px" }}>
              Your offer of <strong style={{ color: t.text, fontWeight: 500 }}>{fmt(offerNum)}</strong> on the{" "}
              <span style={{ color: t.text }}>{productTitle}</span> has been received.
            </p>
            <p style={{ fontSize: "12px", fontWeight: 300, color: t.textMuted, lineHeight: 1.8, maxWidth: "380px", margin: "0 auto 32px" }}>
              We will review your offer and respond to <span style={{ color: t.text }}>{form.email}</span> within one business day.
              You may receive an acceptance, a counter-offer, or a decline.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: "11px 32px", background: "transparent",
                border: `1px solid ${t.border}`, color: t.textMuted,
                fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase",
                fontFamily: "'Inter', sans-serif", fontWeight: 500, cursor: "pointer",
                transition: "all 0.18s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold + "60"; e.currentTarget.style.color = t.gold }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted }}
            >
              Close
            </button>
          </div>
        ) : (
          <div style={{ padding: "40px 44px 36px" }}>

            {/* Header */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                <div style={{ width: "20px", height: "1px", background: t.gold }} />
                <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>
                  Private Offer
                </span>
              </div>
              <h2 style={{ fontFamily: PLAYFAIR, fontSize: "28px", fontWeight: 400, color: t.text, lineHeight: 1.15, margin: "0 0 8px" }}>
                Make an Offer
              </h2>
              <p style={{ fontSize: "12.5px", fontWeight: 300, color: t.textMuted, lineHeight: 1.75, margin: 0 }}>
                Submit a private offer on the{" "}
                <span style={{ color: t.text }}>{productTitle}</span>.
                {!contactForPricing && listedPrice !== null && (
                  <> Listed at <span style={{ color: t.text }}>{fmt(listedPrice)}</span>.</>
                )}
              </p>
            </div>

            {/* Offer amount — prominent, top of form */}
            <div style={{
              background: "#fafafa",
              border: `1px solid ${t.border}`,
              borderLeft: `2px solid ${t.gold}`,
              padding: "20px 22px",
              marginBottom: "22px",
            }}>
              <label style={{ ...labelStyle, marginBottom: "10px" }}>
                Your Offer <span style={{ color: t.gold }}>*</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
                <div style={{
                  padding: "11px 14px",
                  background: "#f0f0f0",
                  border: `1px solid ${t.border}`,
                  borderRight: "none",
                  fontSize: "14px", fontWeight: 500, color: t.textMuted,
                  letterSpacing: "0.02em", lineHeight: 1,
                  flexShrink: 0,
                }}>
                  $
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.offerAmount}
                  onChange={e => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  style={{
                    ...inputStyle,
                    fontSize: "20px", fontWeight: 400,
                    letterSpacing: "0.01em",
                    padding: "10px 14px",
                    borderLeft: "none",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = t.gold + "70")}
                  onBlur={e => (e.currentTarget.style.borderColor = t.border)}
                />
                <div style={{
                  padding: "11px 12px",
                  background: "#f0f0f0",
                  border: `1px solid ${t.border}`,
                  borderLeft: "none",
                  fontSize: "11px", fontWeight: 500, color: t.textDim,
                  letterSpacing: "0.06em", lineHeight: 1,
                  flexShrink: 0,
                }}>
                  USD
                </div>
              </div>
              {/* Percentage hint */}
              {pctOfList !== null && (
                <div style={{ marginTop: "8px", fontSize: "11px", color: pctOfList >= 90 ? "#5a8a5a" : pctOfList >= 75 ? t.textMuted : "#a05a2a", fontWeight: 400 }}>
                  {pctOfList}% of listed price
                  {pctOfList >= 95 && " — strong offer"}
                  {pctOfList >= 85 && pctOfList < 95 && " — competitive"}
                  {pctOfList >= 75 && pctOfList < 85 && " — may consider"}
                  {pctOfList < 75 && " — low offer"}
                </div>
              )}
            </div>

            {/* Contact fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>

              {/* Name row */}
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>
                    First Name <span style={{ color: t.gold }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={e => set("firstName", e.target.value)}
                    placeholder="First"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = t.gold + "70")}
                    onBlur={e => (e.currentTarget.style.borderColor = t.border)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Last Name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={e => set("lastName", e.target.value)}
                    placeholder="Last"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = t.gold + "70")}
                    onBlur={e => (e.currentTarget.style.borderColor = t.border)}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  Email <span style={{ color: t.gold }}>*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  placeholder="you@example.com"
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = t.gold + "70")}
                  onBlur={e => (e.currentTarget.style.borderColor = t.border)}
                />
              </div>

              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = t.gold + "70")}
                  onBlur={e => (e.currentTarget.style.borderColor = t.border)}
                />
              </div>

              <div>
                <label style={labelStyle}>Message <span style={{ color: t.textDim, fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  value={form.message}
                  onChange={e => set("message", e.target.value)}
                  rows={3}
                  placeholder="Any context you'd like to share — trade-in, terms, timeline…"
                  style={{ ...inputStyle, lineHeight: 1.6, resize: "vertical" }}
                  onFocus={e => (e.currentTarget.style.borderColor = t.gold + "70")}
                  onBlur={e => (e.currentTarget.style.borderColor = t.border)}
                />
              </div>
            </div>

            {/* Error message */}
            {status === 'error' && (
              <div style={{
                padding: "10px 14px", marginBottom: "14px",
                background: "#fff8f6", border: "1px solid #e0a090",
                fontSize: "12px", color: "#9a3020", fontWeight: 400,
              }}>
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                width: "100%",
                padding: "14px 32px",
                background: canSubmit ? t.gold : t.gold + "55",
                border: "none",
                color: "#fff",
                fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase",
                fontFamily: "'Inter', sans-serif", fontWeight: 600,
                cursor: canSubmit ? "pointer" : "not-allowed",
                borderRadius: "1px", transition: "background 0.2s",
                marginBottom: "16px",
              }}
              onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = t.goldLight }}
              onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = t.gold }}
            >
              {status === 'submitting' ? "Submitting Offer…" : "Submit Offer"}
            </button>

            {/* Fine print */}
            <p style={{ fontSize: "10.5px", color: t.textDim, lineHeight: 1.7, margin: 0, textAlign: "center" }}>
              Submitting an offer does not guarantee purchase or reserve the item.
              We will respond within one business day with an acceptance, counter-offer, or decline.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
