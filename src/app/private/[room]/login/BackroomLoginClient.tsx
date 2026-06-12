'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const GOLD     = "#7e5e10"
const GOLD_LT  = "#9a7218"
const BORDER   = "#e4e4e6"
const ERR_RED  = "#b84040"

export default function PrivateLoginClient({
  room,
  roomName,
}: {
  room: string
  roomName: string
}) {
  const [password, setPassword] = useState("")
  const [error,    setError]    = useState("")
  const [loading,  setLoading]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setLoading(true)
    setError("")

    try {
      const res  = await fetch("/api/backroom/auth", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ room, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message ?? "Incorrect password")
        setPassword("")
        inputRef.current?.focus()
      } else {
        router.replace(`/private/${room}`)
      }
    } catch {
      setError("Connection error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "calc(100vh - 68px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      background: "#fff",
    }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>

        {/* Decorative rule */}
        <div style={{ width: "32px", height: "1px", background: GOLD, margin: "0 auto 28px" }} />

        <h1 style={{
          fontFamily: "var(--font-playfair), serif",
          fontSize: "26px",
          fontWeight: 400,
          color: "#1a1a1a",
          textAlign: "center",
          margin: "0 0 6px",
          letterSpacing: "0.01em",
        }}>
          {roomName}
        </h1>

        <p style={{
          fontSize: "10px",
          color: "#aaa",
          textAlign: "center",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          margin: "0 0 36px",
        }}>
          Private Access
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "12px" }}>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError("") }}
              placeholder="Password"
              autoComplete="current-password"
              style={{
                width: "100%",
                height: "46px",
                background: "#fff",
                border: `1px solid ${error ? ERR_RED : BORDER}`,
                borderRadius: "2px",
                color: "#1a1a1a",
                fontSize: "14px",
                padding: "0 14px",
                outline: "none",
                letterSpacing: "0.04em",
                transition: "border-color 0.15s",
                boxSizing: "border-box",
                fontFamily: "'Inter', sans-serif",
              }}
              onFocus={e => { if (!error) e.target.style.borderColor = GOLD_LT }}
              onBlur={e  => { if (!error) e.target.style.borderColor = BORDER }}
            />
          </div>

          {error && (
            <p style={{
              fontSize: "11px",
              color: ERR_RED,
              margin: "0 0 12px",
              textAlign: "center",
              letterSpacing: "0.04em",
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!password.trim() || loading}
            style={{
              width: "100%",
              height: "46px",
              background: !password.trim() || loading ? "#ccc" : "#1a1a1a",
              border: "none",
              borderRadius: "2px",
              color: "#fff",
              fontSize: "10px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 500,
              cursor: !password.trim() || loading ? "default" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {loading ? "Verifying…" : "Enter"}
          </button>
        </form>

        {/* Bottom rule */}
        <div style={{ width: "32px", height: "1px", background: BORDER, margin: "36px auto 0" }} />

      </div>
    </div>
  )
}
