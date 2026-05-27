'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const HEIGHT = 36

export default function AnnouncementBar({ message, link }: {
  message: string
  link?: string
}) {
  // Start visible — CSS var was already set server-side, so no layout jump.
  // On mount we check localStorage and hide if previously dismissed.
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (localStorage.getItem('ann-dismissed') === message) {
      setVisible(false)
      document.documentElement.style.setProperty('--ann-h', '0px')
    }
  }, [message])

  const dismiss = () => {
    localStorage.setItem('ann-dismissed', message)
    setVisible(false)
    document.documentElement.style.setProperty('--ann-h', '0px')
  }

  if (!visible) return null

  const text = (
    <span style={{
      fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase",
      fontWeight: 500, color: "#e8d5a3", fontFamily: "'Inter',sans-serif",
    }}>
      {message}
    </span>
  )

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 201,
      height: `${HEIGHT}px`,
      background: "#1a1a1a",
      display: "flex", alignItems: "center", justifyContent: "center",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
    }}>
      {link
        ? <Link href={link} style={{ textDecoration: "none" }}>{text}</Link>
        : text
      }
      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        style={{
          position: "absolute", right: "16px", top: 0, bottom: 0,
          background: "none", border: "none", cursor: "pointer",
          color: "#666", padding: "0 8px",
          display: "flex", alignItems: "center",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#aaa")}
        onMouseLeave={e => (e.currentTarget.style.color = "#666")}
      >
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <path d="M1 1L8 8M8 1L1 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
