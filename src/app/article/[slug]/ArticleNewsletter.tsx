'use client'

import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'

const PAYLOAD_URL = process.env.NEXT_PUBLIC_PAYLOAD_URL ?? 'https://api.luxus-collection.com/cms'

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'duplicate'

export default function ArticleNewsletter({ source }: { source?: string }) {
  const { t } = useTheme()
  const [email, setEmail]   = useState('')
  const [name, setName]     = useState('')
  const [status, setStatus] = useState<Status>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('submitting')

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined, source: source ?? 'article' }),
      })
      if (!res.ok) throw new Error()
      const json = await res.json().catch(() => ({}))
      if (json.duplicate) { setStatus('duplicate'); return }
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '11px 14px', background: t.bg, border: `1px solid ${t.border}`,
    color: t.text, fontSize: '13px', outline: 'none', fontFamily: 'var(--font-inter)',
    fontWeight: 300, minWidth: 0,
  }

  return (
    <section style={{ margin: '56px 0', padding: '36px 40px', background: t.bgSurface, border: `1px solid ${t.border}`, borderLeft: `3px solid ${t.gold}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap' }}>

        {/* Copy */}
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <div style={{ fontSize: '8px', letterSpacing: '0.24em', textTransform: 'uppercase', color: t.gold, fontWeight: 500, fontFamily: 'var(--font-inter)', marginBottom: '10px' }}>
            The Collector's Circle
          </div>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 300, color: t.text, lineHeight: 1.2, marginBottom: '10px' }}>
            New articles, straight to your inbox
          </div>
          <p style={{ fontSize: '12.5px', fontWeight: 300, color: t.textMuted, lineHeight: 1.75, fontFamily: 'var(--font-inter)', margin: 0 }}>
            Be the first to read new editorial features, collector guides, and brand spotlights.
          </p>
        </div>

        {/* Form */}
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          {status === 'success' ? (
            <div style={{ padding: '16px 20px', border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: '8.5px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.gold, fontWeight: 500, fontFamily: 'var(--font-inter)', marginBottom: '5px' }}>You're in</div>
              <p style={{ fontSize: '13px', fontWeight: 300, color: t.textMuted, fontFamily: 'var(--font-inter)', margin: 0, lineHeight: 1.7 }}>
                Thank you — you'll hear from us when the next article publishes.
              </p>
            </div>
          ) : status === 'duplicate' ? (
            <div style={{ padding: '16px 20px', border: `1px solid ${t.border}` }}>
              <p style={{ fontSize: '13px', fontWeight: 300, color: t.textMuted, fontFamily: 'var(--font-inter)', margin: 0, lineHeight: 1.7 }}>
                That email is already subscribed — you're all set.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text" placeholder="Your name (optional)"
                  value={name} onChange={e => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '0' }}>
                <input
                  required type="email" placeholder="Your email address"
                  value={email} onChange={e => setEmail(e.target.value)}
                  style={{ ...inputStyle, borderRight: 'none' }}
                />
                <button type="submit" disabled={status === 'submitting'}
                  style={{ padding: '11px 20px', background: status === 'submitting' ? t.bgSurface : t.gold, color: status === 'submitting' ? t.textDim : '#fff', border: `1px solid ${status === 'submitting' ? t.border : t.gold}`, fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', fontWeight: 600, cursor: status === 'submitting' ? 'default' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s' }}>
                  {status === 'submitting' ? '…' : 'Subscribe'}
                </button>
              </div>
              {status === 'error' && (
                <p style={{ fontSize: '11px', color: '#c0392b', fontFamily: 'var(--font-inter)', marginTop: '8px', marginBottom: 0 }}>
                  Something went wrong — please try again.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
