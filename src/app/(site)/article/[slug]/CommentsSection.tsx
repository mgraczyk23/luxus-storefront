'use client'

import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import type { PayloadComment } from '@/lib/payload'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function CommentCard({ comment }: { comment: PayloadComment }) {
  const { t } = useTheme()
  const initials = comment.authorName.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ display: 'flex', gap: '16px', paddingBottom: '28px', borderBottom: `1px solid ${t.border}` }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: t.bgSurface, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '15px', fontWeight: 400, color: t.gold }}>{initials}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: t.text, fontFamily: 'var(--font-inter)' }}>{comment.authorName}</span>
          <span style={{ fontSize: '10px', color: t.textDim, fontFamily: 'var(--font-inter)', fontWeight: 300 }}>{formatDate(comment.createdAt)}</span>
        </div>
        <p style={{ fontSize: '14.5px', fontWeight: 300, color: t.textMuted, lineHeight: 1.8, fontFamily: 'var(--font-inter)', margin: 0, whiteSpace: 'pre-wrap' }}>
          {comment.body}
        </p>
      </div>
    </div>
  )
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function CommentsSection({
  postId,
  initialComments,
}: {
  postId: string
  initialComments: PayloadComment[]
}) {
  const { t } = useTheme()
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [body, setBody]       = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus]   = useState<Status>('idle')
  const [errMsg, setErrMsg]   = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !body.trim()) return
    setStatus('submitting')
    setErrMsg('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_PAYLOAD_URL ?? 'https://api.luxus-collection.com/cms'}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: postId, authorName: name.trim(), authorEmail: email.trim(), body: body.trim(), honeypot }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.errors?.[0]?.message ?? 'Submission failed.')
      }
      setStatus('success')
      setName(''); setEmail(''); setBody('')
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: t.bg, border: `1px solid ${t.border}`,
    color: t.text, fontSize: '13px', outline: 'none', fontFamily: 'var(--font-inter)',
    fontWeight: 300, boxSizing: 'border-box',
  }

  return (
    <section style={{ marginTop: '64px', paddingTop: '40px', borderTop: `1px solid ${t.border}` }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}>
        <div style={{ width: '18px', height: '1px', background: t.gold }} />
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 300, color: t.text, margin: 0 }}>
          {initialComments.length > 0 ? `${initialComments.length} Comment${initialComments.length !== 1 ? 's' : ''}` : 'Comments'}
        </h2>
      </div>

      {/* Existing comments */}
      {initialComments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '52px' }}>
          {initialComments.map(c => <CommentCard key={c.id} comment={c} />)}
        </div>
      )}

      {initialComments.length === 0 && (
        <p style={{ fontSize: '13px', color: t.textDim, fontFamily: 'var(--font-inter)', fontWeight: 300, marginBottom: '40px' }}>
          Be the first to leave a comment.
        </p>
      )}

      {/* Form */}
      {status === 'success' ? (
        <div style={{ padding: '24px 28px', background: t.bgSurface, border: `1px solid ${t.border}`, borderLeft: `3px solid ${t.gold}` }}>
          <div style={{ fontSize: '8.5px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.gold, fontWeight: 500, fontFamily: 'var(--font-inter)', marginBottom: '6px' }}>Thank You</div>
          <p style={{ fontSize: '13px', fontWeight: 300, color: t.textMuted, fontFamily: 'var(--font-inter)', margin: 0, lineHeight: 1.7 }}>
            Your comment has been submitted and is awaiting moderation. It will appear once approved.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase', color: t.gold, fontWeight: 500, fontFamily: 'var(--font-inter)', marginBottom: '20px' }}>
            Leave a Comment
          </div>

          {/* Honeypot — hidden from humans */}
          <input
            type="text" tabIndex={-1} aria-hidden="true"
            value={honeypot} onChange={e => setHoneypot(e.target.value)}
            style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.textDim, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '6px' }}>Name *</label>
              <input required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.textDim, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '6px' }}>Email * <span style={{ fontWeight: 300, textTransform: 'none', letterSpacing: 0 }}>(not published)</span></label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.textDim, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '6px' }}>Comment *</label>
            <textarea required value={body} onChange={e => setBody(e.target.value)} placeholder="Share your thoughts..." rows={5}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
          </div>

          {status === 'error' && (
            <p style={{ fontSize: '12px', color: '#c0392b', fontFamily: 'var(--font-inter)', marginBottom: '12px' }}>{errMsg}</p>
          )}

          <button type="submit" disabled={status === 'submitting'}
            style={{ padding: '11px 32px', background: status === 'submitting' ? t.bgSurface : t.gold, color: status === 'submitting' ? t.textDim : '#fff', border: `1px solid ${status === 'submitting' ? t.border : t.gold}`, fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', fontWeight: 600, cursor: status === 'submitting' ? 'default' : 'pointer', transition: 'all 0.2s' }}>
            {status === 'submitting' ? 'Submitting…' : 'Post Comment'}
          </button>
        </form>
      )}
    </section>
  )
}
