'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'

const passwordStrength = (p: string) => {
  let s = 0
  if (p.length >= 8) s++; if (p.length >= 12) s++
  if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
}
const STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong", "Excellent"]
const STRENGTH_COLOR = ["", "#b05040", "#c08030", "#8a9030", "#4a8a4a", "#3a7a6a"]

export default function ResetPasswordPage() {
  const { t } = useTheme()
  const router = useRouter()
  const params = useSearchParams()
  const token  = params.get("token") ?? ""

  const [password,    setPassword]    = useState("")
  const [confirm,     setConfirm]     = useState("")
  const [status,      setStatus]      = useState<"idle"|"loading"|"success"|"error"|"invalid">("idle")
  const [error,       setError]       = useState("")
  const [showStrength, setShowStrength] = useState(false)

  const strength = passwordStrength(password)
  const canSubmit = !!(token && password.length >= 8 && password === confirm)

  useEffect(() => {
    if (!token) setStatus("invalid")
  }, [token])

  const handleSubmit = async () => {
    if (!canSubmit || status === "loading") return
    setStatus("loading"); setError("")
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Reset failed")
      setStatus("success")
      setTimeout(() => router.push("/auth?reset=success"), 2000)
    } catch (err: any) {
      setError(err.message)
      setStatus("error")
    }
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 14px", background: t.bg,
    border: `1px solid ${t.border}`, color: t.text,
    fontSize: "13px", fontFamily: "var(--font-inter)", fontWeight: 300,
    letterSpacing: "0.02em", outline: "none", borderRadius: "1px", transition: "border-color 0.2s",
  }

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "var(--font-inter)" }}>
      <style>{`input::placeholder { color: ${t.textDim}; }`}</style>

      <div style={{ paddingTop: "68px", minHeight: "calc(100vh - 68px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "68px 40px 40px" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>

          {/* Header */}
          <div style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <div style={{ width: "18px", height: "1px", background: t.gold }}/>
              <span style={{ fontSize: "8.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: t.gold, fontWeight: 500 }}>Luxus Collection</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(28px,3vw,40px)", fontWeight: 400, color: t.text, lineHeight: 1.1, marginBottom: "8px" }}>
              Set New Password
            </h1>
            <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted }}>
              Choose a strong password for your account.
            </p>
          </div>

          {/* Invalid token */}
          {status === "invalid" && (
            <div style={{ padding: "28px", border: `1px solid ${t.border}`, background: "#fafafa", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-playfair)", fontSize: "20px", fontWeight: 400, color: t.text, marginBottom: "10px" }}>Link Invalid or Expired</div>
              <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted, lineHeight: 1.7, marginBottom: "20px" }}>
                Password reset links expire after 15 minutes. Please request a new one.
              </p>
              <Link href="/auth" style={{ fontSize: "9.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: t.gold, fontWeight: 600, textDecoration: "none", borderBottom: `1px solid ${t.gold}50`, paddingBottom: "2px" }}>
                Back to Sign In →
              </Link>
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div style={{ padding: "40px", border: `1px solid ${t.border}`, textAlign: "center" }}>
              <div style={{ width: "52px", height: "52px", border: `1px solid ${t.gold}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <svg width="20" height="15" viewBox="0 0 20 15" fill="none"><path d="M1 7.5L7 13.5L19 1.5" stroke={t.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ fontFamily: "var(--font-playfair)", fontSize: "24px", fontWeight: 400, color: t.text, marginBottom: "10px" }}>Password Updated</div>
              <p style={{ fontSize: "13px", fontWeight: 300, color: t.textMuted }}>Redirecting you to sign in…</p>
            </div>
          )}

          {/* Form */}
          {status !== "invalid" && status !== "success" && (
            <div style={{ background: "#fff", border: `1px solid ${t.border}`, padding: "36px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>

                <div>
                  <label style={{ display: "block", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "6px" }}>New Password</label>
                  <input type="password" placeholder="Min. 8 characters" value={password}
                    onChange={e => { setPassword(e.target.value); setShowStrength(true) }}
                    style={inp}
                    onFocus={e => e.currentTarget.style.borderColor = t.gold + "60"}
                    onBlur={e => e.currentTarget.style.borderColor = t.border}/>
                  {showStrength && password.length > 0 && (
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

                <div>
                  <label style={{ display: "block", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.textDim, fontWeight: 500, marginBottom: "6px" }}>Confirm Password</label>
                  <input type="password" placeholder="Re-enter password" value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    style={inp}
                    onFocus={e => e.currentTarget.style.borderColor = t.gold + "60"}
                    onBlur={e => e.currentTarget.style.borderColor = t.border}/>
                  {confirm && password !== confirm && (
                    <div style={{ fontSize: "10.5px", color: "#b05040", fontWeight: 300, marginTop: "6px" }}>Passwords don&apos;t match</div>
                  )}
                </div>
              </div>

              <button onClick={handleSubmit} disabled={!canSubmit || status === "loading"}
                style={{ width: "100%", padding: "14px", background: canSubmit ? t.gold : t.gold + "55", border: "none", color: "#fff", fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "var(--font-inter)", fontWeight: 600, cursor: canSubmit ? "pointer" : "not-allowed", borderRadius: "1px", transition: "all 0.22s" }}
                onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = t.goldLight }}
                onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = t.gold }}>
                {status === "loading" ? "Updating…" : "Update Password"}
              </button>

              {status === "error" && (
                <p style={{ fontSize: "11px", color: "#b05040", textAlign: "center", marginTop: "10px", fontWeight: 300 }}>{error}</p>
              )}

              <p style={{ fontSize: "11px", color: t.textDim, textAlign: "center", marginTop: "16px", fontWeight: 300 }}>
                <Link href="/auth" style={{ color: t.gold, textDecoration: "none" }}>← Back to Sign In</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
