'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'

function InputField({ label, type = "text", placeholder, value, onChange, hint }: {
  label: string; type?: string; placeholder?: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; hint?: string
}) {
  const { t } = useTheme()
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "6px" }}>
        <label style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, fontFamily: "var(--font-inter)" }}>{label}</label>
        {hint && <span style={{ fontSize: "10px", color: t.gold, cursor: "pointer", fontFamily: "var(--font-inter)", fontWeight: 300 }}>{hint}</span>}
      </div>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ width: "100%", padding: "12px 14px", background: "var(--lxs-bg)", border: `1px solid ${t.border}`, color: t.text, fontSize: "13px", fontFamily: "var(--font-inter)", fontWeight: 300, letterSpacing: "0.02em", outline: "none", borderRadius: "1px", transition: "border-color 0.2s" }}
        onFocus={e => e.currentTarget.style.borderColor = t.gold + "60"}
        onBlur={e => e.currentTarget.style.borderColor = t.border}/>
    </div>
  )
}

const passwordStrength = (p: string) => {
  let score = 0
  if (p.length >= 8)             score++
  if (p.length >= 12)            score++
  if (/[A-Z]/.test(p))           score++
  if (/[0-9]/.test(p))           score++
  if (/[^A-Za-z0-9]/.test(p))   score++
  return score
}

const STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong", "Excellent"]
const STRENGTH_COLOR = ["", "#b05040", "#c08030", "#8a9030", "#4a8a4a", "#3a7a6a"]

export default function AuthPage({ defaultTab = "signin" }: { defaultTab?: "signin" | "register" }) {
  const { t } = useTheme()
  const [tab, setTab] = useState<"signin"|"register">(defaultTab)

  const [siEmail, setSiEmail]         = useState("")
  const [siPassword, setSiPassword]   = useState("")
  const [siStatus, setSiStatus]       = useState<"idle"|"loading"|"success">("idle")

  const [regFirst, setRegFirst]       = useState("")
  const [regLast, setRegLast]         = useState("")
  const [regEmail, setRegEmail]       = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirm, setRegConfirm]   = useState("")
  const [regConsent, setRegConsent]   = useState(false)
  const [regStatus, setRegStatus]     = useState<"idle"|"loading"|"success">("idle")
  const [showStrength, setShowStrength] = useState(false)

  const strength = passwordStrength(regPassword)

  const handleSignIn = () => {
    if (!siEmail || !siPassword) return
    setSiStatus("loading")
    setTimeout(() => setSiStatus("success"), 1200)
  }

  const handleRegister = () => {
    if (!regFirst || !regEmail || !regPassword || regPassword !== regConfirm || !regConsent) return
    setRegStatus("loading")
    setTimeout(() => setRegStatus("success"), 1400)
  }

  const canRegister = !!(regFirst && regEmail && regPassword && regPassword === regConfirm && regConsent)

  const ORDivider = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "24px 0" }}>
      <div style={{ flex: 1, height: "1px", background: t.border }}/>
      <span style={{ fontSize: "9px", color: t.textDim, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-inter)" }}>or</span>
      <div style={{ flex: 1, height: "1px", background: t.border }}/>
    </div>
  )

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "var(--font-inter)" }}>
      <style>{`input::placeholder { color: ${t.textDim}; }`}</style>

      <div className="lxs-auth-wrapper" style={{ paddingTop: "68px", minHeight: "calc(100vh - 68px)", position: "relative" }}>
        {/* Split background — hidden on mobile via .lxs-auth-bg-split CSS rule */}
        <div className="lxs-auth-bg-split" style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, zIndex: 0, display: "flex" }}>
          <div style={{ flex: 1, background: "linear-gradient(155deg,#f3f3f5,#e8e8eb)" }}/>
          <div style={{ flex: 1, background: t.bg }}/>
        </div>

        <div className="lxs-auth-layout" style={{ position: "relative", zIndex: 1, maxWidth: "1440px", margin: "0 auto", padding: "0 40px", minHeight: "calc(100vh - 68px)", display: "grid", gridTemplateColumns: "1fr 1fr" }}>

          {/* ── Left: decorative panel ── */}
          <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 72px", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 30% 60%,${t.gold}10,transparent 60%)` }}/>
            <div style={{ position: "absolute", top: "15%", bottom: "15%", right: 0, width: "1px", background: `linear-gradient(to bottom,transparent,${t.gold}30,transparent)` }}/>
            {[
              { top: "32px", left: "32px", borderTop: `1px solid ${t.gold}35`, borderLeft: `1px solid ${t.gold}35` } as React.CSSProperties,
              { bottom: "32px", right: "32px", borderBottom: `1px solid ${t.gold}35`, borderRight: `1px solid ${t.gold}35` } as React.CSSProperties,
            ].map((s, i) => (
              <div key={i} style={{ position: "absolute", width: "28px", height: "28px", ...s }}/>
            ))}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ width: "18px", height: "1px", background: t.gold }}/>
                <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>The Collector&apos;s Circle</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(32px,3.2vw,48px)", fontWeight: 400, color: t.text, lineHeight: 1.12, marginBottom: "24px", letterSpacing: "0.01em" }}>
                Your Collection,<br/>
                <em style={{ color: t.gold, fontStyle: "italic" }}>Your Account.</em>
              </h2>
              <p style={{ fontSize: "14px", fontWeight: 300, color: t.textMuted, lineHeight: 1.82, maxWidth: "380px", marginBottom: "40px" }}>
                Track orders, manage your wishlist, submit consignments, and access exclusive early notifications on new arrivals, all in one place.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  ["Order Tracking", "Monitor every shipment from our vault to your FFL dealer."],
                  ["Wishlist & Alerts", "Save pieces and receive notifications when availability changes."],
                  ["Consignment Portal", "Submit and track your consignment pieces directly."],
                ].map(([heading, body]) => (
                  <div key={heading} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: t.gold, marginTop: "6px", flexShrink: 0 }}/>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 500, color: t.text, marginBottom: "2px" }}>{heading}</div>
                      <div style={{ fontSize: "11.5px", fontWeight: 300, color: t.textMuted, lineHeight: 1.65 }}>{body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: auth form ── */}
          <div className="lxs-auth-form-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 72px" }}>
            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, marginBottom: "36px" }}>
              {(["signin", "register"] as const).map(v => (
                <button key={v} onClick={() => { setTab(v); setSiStatus("idle"); setRegStatus("idle") }}
                  style={{ padding: "0 0 16px", marginRight: "32px", background: "none", border: "none", borderBottom: `2px solid ${tab === v ? t.gold : "transparent"}`, marginBottom: "-1px", cursor: "pointer", fontFamily: "var(--font-inter)", fontWeight: 500, fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: tab === v ? t.gold : t.textMuted, transition: "all 0.2s" }}>
                  {v === "signin" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            {/* ── SIGN IN ── */}
            {tab === "signin" && (
              siStatus === "success" ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ width: "52px", height: "52px", border: `1px solid ${t.gold}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <svg width="20" height="15" viewBox="0 0 20 15" fill="none"><path d="M1 7.5L7 13.5L19 1.5" stroke={t.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{ fontFamily: "var(--font-playfair)", fontSize: "26px", fontWeight: 400, color: t.text, marginBottom: "10px" }}>Welcome Back</div>
                  <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted }}>Redirecting to your account…</p>
                </div>
              ) : (
                <div style={{ maxWidth: "380px" }}>
                  <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(26px,2.8vw,36px)", fontWeight: 400, color: t.text, marginBottom: "8px", lineHeight: 1.2 }}>Sign In</h1>
                  <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted, marginBottom: "32px" }}>Welcome back to Luxus Collection.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                    <InputField label="Email Address" type="email" placeholder="you@example.com" value={siEmail} onChange={e => setSiEmail(e.target.value)}/>
                    <InputField label="Password" type="password" placeholder="••••••••••" value={siPassword} onChange={e => setSiPassword(e.target.value)} hint="Forgot password?"/>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px", cursor: "pointer" }}>
                    <div style={{ width: "14px", height: "14px", border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "1px", flexShrink: 0 }}/>
                    <span style={{ fontSize: "12px", fontWeight: 300, color: t.textMuted }}>Keep me signed in</span>
                  </label>
                  <button onClick={handleSignIn} disabled={!siEmail || !siPassword}
                    style={{ width: "100%", padding: "14px", background: siEmail && siPassword ? t.gold : t.gold + "55", border: "none", color: "#fff", fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 600, cursor: siEmail && siPassword ? "pointer" : "not-allowed", borderRadius: "1px", transition: "all 0.22s" }}
                    onMouseEnter={e => { if (siEmail && siPassword) e.currentTarget.style.background = t.goldLight }}
                    onMouseLeave={e => { if (siEmail && siPassword) e.currentTarget.style.background = t.gold }}>
                    {siStatus === "loading" ? "Signing In…" : "Sign In"}
                  </button>
                  <ORDivider/>
                  <p style={{ fontSize: "12.5px", fontWeight: 300, color: t.textMuted, textAlign: "center" }}>
                    New to Luxus Collection?{" "}
                    <span onClick={() => setTab("register")} style={{ color: t.gold, cursor: "pointer", borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px" }}>Create an account →</span>
                  </p>
                </div>
              )
            )}

            {/* ── REGISTER ── */}
            {tab === "register" && (
              regStatus === "success" ? (
                <div style={{ textAlign: "center", padding: "40px 0", maxWidth: "380px" }}>
                  <div style={{ width: "52px", height: "52px", border: `1px solid ${t.gold}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <svg width="20" height="15" viewBox="0 0 20 15" fill="none"><path d="M1 7.5L7 13.5L19 1.5" stroke={t.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{ fontFamily: "var(--font-playfair)", fontSize: "26px", fontWeight: 400, color: t.text, marginBottom: "10px" }}>Account Created</div>
                  <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted, lineHeight: 1.75 }}>Welcome to Luxus Collection, {regFirst}. Check your inbox for a confirmation email, then sign in to access your account.</p>
                </div>
              ) : (
                <div style={{ maxWidth: "380px" }}>
                  <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(26px,2.8vw,36px)", fontWeight: 400, color: t.text, marginBottom: "8px", lineHeight: 1.2 }}>Create Account</h1>
                  <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted, marginBottom: "32px" }}>Join the collector&apos;s circle.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <InputField label="First Name" placeholder="James" value={regFirst} onChange={e => setRegFirst(e.target.value)}/>
                      <InputField label="Last Name" placeholder="Whitfield" value={regLast} onChange={e => setRegLast(e.target.value)}/>
                    </div>
                    <InputField label="Email Address" type="email" placeholder="you@example.com" value={regEmail} onChange={e => setRegEmail(e.target.value)}/>
                    <div>
                      <InputField label="Password" type="password" placeholder="Min. 8 characters" value={regPassword} onChange={e => { setRegPassword(e.target.value); setShowStrength(true) }}/>
                      {showStrength && regPassword.length > 0 && (
                        <div style={{ marginTop: "8px" }}>
                          <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                            {[1,2,3,4,5].map(i => (
                              <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= strength ? STRENGTH_COLOR[strength] : t.border, transition: "background 0.2s" }}/>
                            ))}
                          </div>
                          <span style={{ fontSize: "10px", color: STRENGTH_COLOR[strength], fontWeight: 400 }}>{STRENGTH_LABEL[strength]}</span>
                        </div>
                      )}
                    </div>
                    <InputField label="Confirm Password" type="password" placeholder="Re-enter password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)}/>
                    {regConfirm && regPassword !== regConfirm && (
                      <div style={{ fontSize: "10.5px", color: "#b05040", fontWeight: 300 }}>Passwords don&apos;t match</div>
                    )}
                  </div>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "24px", cursor: "pointer" }} onClick={() => setRegConsent(!regConsent)}>
                    <div style={{ width: "14px", height: "14px", border: `1px solid ${regConsent ? t.gold : t.border}`, background: regConsent ? t.gold : "transparent", transition: "all 0.18s", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "1px", flexShrink: 0, marginTop: "1px" }}>
                      {regConsent && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 300, color: t.textMuted, lineHeight: 1.65 }}>
                      I agree to the <Link href="/terms" style={{ color: t.gold, textDecoration: "none" }}>Terms &amp; Conditions</Link> and <Link href="/privacy" style={{ color: t.gold, textDecoration: "none" }}>Privacy Policy</Link>
                    </span>
                  </label>
                  <button onClick={handleRegister} disabled={!canRegister}
                    style={{ width: "100%", padding: "14px", background: canRegister ? t.gold : t.gold + "55", border: "none", color: "#fff", fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 600, cursor: "pointer", borderRadius: "1px", transition: "all 0.22s" }}
                    onMouseEnter={e => e.currentTarget.style.background = t.goldLight}
                    onMouseLeave={e => e.currentTarget.style.background = t.gold}>
                    {regStatus === "loading" ? "Creating Account…" : "Create Account"}
                  </button>
                  <ORDivider/>
                  <p style={{ fontSize: "12.5px", fontWeight: 300, color: t.textMuted, textAlign: "center" }}>
                    Already have an account?{" "}
                    <span onClick={() => setTab("signin")} style={{ color: t.gold, cursor: "pointer", borderBottom: `1px solid ${t.gold}50`, paddingBottom: "1px" }}>Sign in →</span>
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
