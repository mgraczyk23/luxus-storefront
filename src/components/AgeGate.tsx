'use client'

import { useEffect, useState } from 'react'
import { LIGHT as t } from '@/context/ThemeContext'

const COOKIE = 'lxs_age_verified'

function getVerified(): boolean {
  try {
    const hasCookie = document.cookie.split('; ').some(r => r.startsWith(COOKIE + '=1'))
    const hasSession = sessionStorage.getItem(COOKIE) === '1'
    return hasCookie || hasSession
  } catch {
    return false
  }
}

function setVerified(remember: boolean) {
  if (remember) {
    const maxAge = 30 * 24 * 60 * 60
    document.cookie = `${COOKIE}=1;path=/;max-age=${maxAge};samesite=lax`
  } else {
    sessionStorage.setItem(COOKIE, '1')
  }
}

export default function AgeGate() {
  const [visible, setVisible] = useState(false)
  const [remember, setRemember] = useState(true)

  useEffect(() => {
    if (!getVerified()) setVisible(true)
  }, [])

  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [visible])

  const handleEnter = () => {
    setVerified(remember)
    setVisible(false)
  }

  const handleExit = () => {
    window.location.href = 'https://www.google.com'
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(26, 26, 26, 0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: t.bg,
        border: `1px solid ${t.border}`,
        borderTop: `2px solid ${t.gold}`,
        maxWidth: '460px',
        width: '100%',
        padding: '48px 40px 40px',
        textAlign: 'center',
        boxShadow: '0 30px 80px rgba(0,0,0,0.18)',
      }}>

        {/* Wordmark */}
        <div style={{
          fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase',
          color: t.gold, fontWeight: 600, fontFamily: "'Inter', sans-serif",
          marginBottom: '20px',
        }}>
          Luxus Collection
        </div>

        <div style={{ width: '32px', height: '1px', background: t.gold, margin: '0 auto 28px' }} />

        {/* Heading */}
        <h2 style={{
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: '22px', fontWeight: 400, color: t.text,
          margin: '0 0 12px', lineHeight: 1.3,
        }}>
          Age Verification Required
        </h2>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px', color: t.textMuted, lineHeight: 1.7,
          margin: '0 0 32px',
        }}>
          You must be 18 years of age or older to enter this site.
          <br />
          Are you 18 or older?
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
          <button
            onClick={handleEnter}
            style={{
              flex: 1, padding: '14px 12px',
              background: t.gold, border: 'none',
              color: '#ffffff',
              fontFamily: "'Inter', sans-serif",
              fontSize: '10px', letterSpacing: '0.16em',
              textTransform: 'uppercase', fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Yes, I am 18 or Older
          </button>
          <button
            onClick={handleExit}
            style={{
              flex: 1, padding: '14px 12px',
              background: 'transparent',
              border: `1px solid ${t.border}`,
              color: t.textMuted,
              fontFamily: "'Inter', sans-serif",
              fontSize: '10px', letterSpacing: '0.16em',
              textTransform: 'uppercase', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            No, Exit
          </button>
        </div>

        {/* Remember checkbox */}
        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          cursor: 'pointer', textAlign: 'left',
        }}>
          <input
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            style={{ marginTop: '2px', accentColor: t.gold, cursor: 'pointer', flexShrink: 0 }}
          />
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px', color: t.textDim, lineHeight: 1.6,
          }}>
            Remember me for 30 days.<br />
            I confirm that this is not a shared device.
          </span>
        </label>
      </div>
    </div>
  )
}
