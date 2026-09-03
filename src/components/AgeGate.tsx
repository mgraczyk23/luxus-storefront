'use client'

import { useEffect, useRef, useState } from 'react'
import { LIGHT as t } from '@/context/ThemeContext'
import { isAgeVerified as getVerified, setAgeVerified as setVerified, isBotUserAgent } from '@/lib/age-gate'

export default function AgeGate() {
  const [visible, setVisible] = useState(false)
  const [remember, setRemember] = useState(true)
  const dialogRef = useRef<HTMLDivElement>(null)
  const enterBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isBotUserAgent(navigator.userAgent)) return
    if (!getVerified()) setVisible(true)
  }, [])

  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [visible])

  // Move focus into the dialog when it opens, and trap Tab/Shift+Tab inside
  // it so keyboard users can't reach the page (or the consent banner)
  // underneath while age verification is unresolved.
  useEffect(() => {
    if (!visible) return
    enterBtnRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible])

  // Suppress the rest of the page (header, nav, consent banner, etc.) from
  // focus/interaction while the gate is open — the Tab trap above covers
  // keyboard navigation already reaching this dialog, but `inert` (with
  // aria-hidden as a fallback for browsers that don't support it) is the
  // belt-and-suspenders fix so assistive tech doesn't even announce the
  // page underneath while age verification is unresolved.
  useEffect(() => {
    if (!visible) return
    const toggled: HTMLElement[] = []
    Array.from(document.body.children).forEach(el => {
      if (el === dialogRef.current) return
      const node = el as HTMLElement
      if ('inert' in node) (node as unknown as { inert: boolean }).inert = true
      node.setAttribute('aria-hidden', 'true')
      toggled.push(node)
    })
    return () => {
      toggled.forEach(node => {
        if ('inert' in node) (node as unknown as { inert: boolean }).inert = false
        node.removeAttribute('aria-hidden')
      })
    }
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-heading"
      aria-describedby="age-gate-desc"
      ref={dialogRef}
      style={{
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
        <h2 id="age-gate-heading" style={{
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: '22px', fontWeight: 400, color: t.text,
          margin: '0 0 12px', lineHeight: 1.3,
        }}>
          Age Verification Required
        </h2>

        <p id="age-gate-desc" style={{
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
            ref={enterBtnRef}
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
