'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import { useCart, type CartItem } from '@/context/CartContext'

declare global {
  interface Window {
    ConvergeLightbox?: {
      open: (opts: {
        ssl_txn_auth_token: string
        onError: (err: string) => void
        onCancelled: () => void
        onDeclined: (r: Record<string, string>) => void
        onApproval: (r: Record<string, string>) => void
      }) => void
    }
  }
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

function genRef() {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `LXS-${ts}-${rand}`
}

type FormData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  fflDealerName: string
  fflDealerCity: string
  fflDealerState: string
  notes: string
}

const EMPTY: FormData = {
  firstName: '', lastName: '', email: '', phone: '',
  fflDealerName: '', fflDealerCity: '', fflDealerState: '', notes: '',
}

function Field({
  label, name, value, onChange, required, type = 'text', placeholder,
}: {
  label: string; name: keyof FormData; value: string
  onChange: (k: keyof FormData, v: string) => void
  required?: boolean; type?: string; placeholder?: string
}) {
  const { t } = useTheme()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: t.textDim, fontWeight: 500, fontFamily: 'var(--font-inter)' }}>
        {label}{required && <span style={{ color: t.gold, marginLeft: '3px' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(name, e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{ padding: '11px 13px', border: `1px solid ${t.border}`, background: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)', color: t.text, fontWeight: 300, outline: 'none', width: '100%', boxSizing: 'border-box' }}
        onFocus={e => { e.currentTarget.style.borderColor = t.gold }}
        onBlur={e => { e.currentTarget.style.borderColor = t.border }}
      />
    </div>
  )
}

function CartItemRow({ item }: { item: CartItem }) {
  const { t } = useTheme()
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingBottom: '12px', borderBottom: `1px solid ${t.border}` }}>
      {item.thumbnail ? (
        <div style={{ width: '52px', height: '52px', position: 'relative', flexShrink: 0, border: `1px solid ${t.border}`, background: '#f9f9f9' }}>
          <Image src={item.thumbnail} alt={item.title} fill style={{ objectFit: 'contain' }} sizes="52px" />
        </div>
      ) : (
        <div style={{ width: '52px', height: '52px', flexShrink: 0, border: `1px solid ${t.border}`, background: '#f5f5f5' }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {item.brand && (
          <div style={{ fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: t.gold, fontWeight: 500 }}>{item.brand}</div>
        )}
        <div style={{ fontSize: '12px', fontWeight: 300, color: t.text, lineHeight: 1.35 }}>{item.title}</div>
        {item.quantity > 1 && (
          <div style={{ fontSize: '10.5px', color: t.textMuted, marginTop: '2px' }}>×{item.quantity}</div>
        )}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 400, color: t.text, flexShrink: 0 }}>{fmt(item.price * item.quantity)}</div>
    </div>
  )
}

export default function CheckoutPage() {
  const { t } = useTheme()
  const { cartItems, clearCart } = useCart()
  const router = useRouter()
  const [form, setForm] = useState<FormData>(EMPTY)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const orderRefRef = useRef('')

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)

  const setField = useCallback((k: keyof FormData, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }))
  }, [])

  const validate = () => {
    if (!form.firstName.trim()) return 'First name is required'
    if (!form.lastName.trim()) return 'Last name is required'
    if (!form.email.trim() || !form.email.includes('@')) return 'Valid email is required'
    if (cartItems.length === 0) return 'Your cart is empty'
    return null
  }

  const handlePay = async () => {
    const err = validate()
    if (err) { setErrorMsg(err); return }
    if (!window.ConvergeLightbox) { setErrorMsg('Payment form not loaded. Please refresh and try again.'); return }

    setStatus('loading')
    setErrorMsg('')

    const orderRef = genRef()
    orderRefRef.current = orderRef

    try {
      const tokenRes = await fetch('/api/elavon/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: subtotal,
          invoiceRef: orderRef,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
        }),
      })

      const tokenData = await tokenRes.json()
      if (!tokenRes.ok || !tokenData.token) {
        setStatus('error')
        setErrorMsg(tokenData.error ?? 'Could not initialize payment. Please try again.')
        return
      }

      setStatus('idle')

      window.ConvergeLightbox.open({
        ssl_txn_auth_token: tokenData.token,

        onError: (errMsg) => {
          setStatus('error')
          setErrorMsg(`Payment error: ${errMsg}`)
        },

        onCancelled: () => {
          setStatus('idle')
        },

        onDeclined: (response) => {
          setStatus('error')
          setErrorMsg(`Payment declined: ${response.ssl_result_message ?? 'Card was declined. Please try a different card.'}`)
        },

        onApproval: async (response) => {
          // Send order notification email
          await fetch('/api/elavon/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderRef: orderRefRef.current,
              approvalCode: response.ssl_approval_code ?? '',
              txnId: response.ssl_txn_id ?? '',
              amount: subtotal,
              firstName: form.firstName.trim(),
              lastName: form.lastName.trim(),
              email: form.email.trim(),
              phone: form.phone.trim(),
              fflDealerName: form.fflDealerName.trim(),
              fflDealerCity: form.fflDealerCity.trim(),
              fflDealerState: form.fflDealerState.trim(),
              notes: form.notes.trim(),
              items: cartItems.map(i => ({ title: i.title, quantity: i.quantity, price: i.price })),
            }),
          }).catch(() => { /* non-fatal — order is already approved */ })

          clearCart()
          router.push(`/order-confirmation?ref=${encodeURIComponent(orderRefRef.current)}&name=${encodeURIComponent(form.firstName.trim())}`)
        },
      })
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please check your connection and try again.')
    }
  }

  if (cartItems.length === 0) {
    return (
      <div style={{ background: t.bg, minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 300, color: t.text, marginBottom: '12px' }}>Your cart is empty</div>
          <Link href="/shop" style={{ fontSize: '9.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: t.gold, textDecoration: 'none', fontWeight: 500 }}>
            Browse Collection →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://api.convergepay.com/hosted-payments/Lightbox.js"
        onLoad={() => setScriptLoaded(true)}
        strategy="afterInteractive"
      />

      <div style={{ background: t.bg, color: t.text, fontFamily: 'var(--font-inter)' }}>
        {/* Banner */}
        <div style={{ background: 'linear-gradient(to bottom,#f3f3f5,#ffffff)', borderBottom: `1px solid ${t.border}`, padding: '36px 40px 28px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              {['Home', 'Cart', 'Checkout'].map((c, i, a) => (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {i > 0 && <span style={{ fontSize: '9px', color: t.textDim }}>›</span>}
                  <span style={{ fontSize: '10px', color: i < a.length - 1 ? t.textDim : t.textMuted, fontWeight: 300 }}>
                    {i === 0 ? <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>{c}</Link>
                      : i === 1 ? <Link href="/cart" style={{ textDecoration: 'none', color: 'inherit' }}>{c}</Link>
                      : c}
                  </span>
                </div>
              ))}
            </div>
            <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 300, color: t.text, letterSpacing: '0.01em' }}>Checkout</h1>
          </div>
        </div>

        {/* Main */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 40px 96px', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '48px', alignItems: 'start' }}>

          {/* Left — Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

            {/* Contact */}
            <section>
              <div style={{ fontSize: '8.5px', letterSpacing: '0.22em', textTransform: 'uppercase', color: t.gold, fontWeight: 500, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '14px', height: '1px', background: t.gold }} />
                Contact Information
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Field label="First Name" name="firstName" value={form.firstName} onChange={setField} required />
                <Field label="Last Name" name="lastName" value={form.lastName} onChange={setField} required />
                <Field label="Email" name="email" value={form.email} onChange={setField} required type="email" />
                <Field label="Phone" name="phone" value={form.phone} onChange={setField} placeholder="Optional" />
              </div>
            </section>

            {/* FFL */}
            <section>
              <div style={{ fontSize: '8.5px', letterSpacing: '0.22em', textTransform: 'uppercase', color: t.gold, fontWeight: 500, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '14px', height: '1px', background: t.gold }} />
                FFL Transfer Dealer
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px 16px', background: '#fafaf8', border: `1px solid ${t.border}`, borderLeft: `2px solid ${t.gold}40`, marginBottom: '16px' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: t.gold, flexShrink: 0, marginTop: '1px' }}><path d="M7 0.5L13 4V8C13 11 10.5 13 7 14C3.5 13 1 11 1 8V4L7 0.5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/></svg>
                <p style={{ fontSize: '12px', fontWeight: 300, color: t.textMuted, lineHeight: 1.6, margin: 0 }}>
                  All firearms require FFL transfer. Enter your chosen dealer below — we will ship directly to them and they will contact you for pickup.{' '}
                  <Link href="/support#ffl" style={{ color: t.gold, textDecoration: 'none', borderBottom: `1px solid ${t.gold}50` }}>Learn more →</Link>
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px' }}>
                <Field label="Dealer Name" name="fflDealerName" value={form.fflDealerName} onChange={setField} placeholder="e.g. Joe's Gun Shop" />
                <Field label="City" name="fflDealerCity" value={form.fflDealerCity} onChange={setField} />
                <Field label="State" name="fflDealerState" value={form.fflDealerState} onChange={setField} placeholder="e.g. TX" />
              </div>
            </section>

            {/* Notes */}
            <section>
              <div style={{ fontSize: '8.5px', letterSpacing: '0.22em', textTransform: 'uppercase', color: t.gold, fontWeight: 500, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '14px', height: '1px', background: t.gold }} />
                Order Notes
                <span style={{ fontSize: '9px', color: t.textDim, textTransform: 'none', letterSpacing: '0', fontWeight: 400 }}>(optional)</span>
              </div>
              <textarea
                value={form.notes}
                onChange={e => setField('notes', e.target.value)}
                placeholder="Any special instructions or questions..."
                rows={3}
                style={{ width: '100%', padding: '11px 13px', border: `1px solid ${t.border}`, background: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)', color: t.text, fontWeight: 300, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                onFocus={e => { e.currentTarget.style.borderColor = t.gold }}
                onBlur={e => { e.currentTarget.style.borderColor = t.border }}
              />
            </section>
          </div>

          {/* Right — Order Summary */}
          <div style={{ position: 'sticky', top: '96px', background: '#fff', border: `1px solid ${t.border}`, padding: '28px' }}>
            <div style={{ fontSize: '8.5px', letterSpacing: '0.22em', textTransform: 'uppercase', color: t.gold, fontWeight: 500, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '14px', height: '1px', background: t.gold }} />
              Order Summary
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {cartItems.map(item => <CartItemRow key={item.id} item={item} />)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: `1px solid ${t.border}`, marginBottom: '20px' }}>
              {[
                ['Subtotal', fmt(subtotal)],
                ['Shipping', 'TBD after order'],
                ['Tax', 'Calculated at transfer'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 300, color: t.textMuted }}>{label}</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 300, color: t.text }}>{val}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '16px 0', borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, marginBottom: '20px' }}>
              <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '16px', fontWeight: 400, color: t.text }}>Total</span>
              <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 300, color: t.text }}>{fmt(subtotal)}</span>
            </div>

            {errorMsg && (
              <div style={{ padding: '12px 14px', background: '#fff5f5', border: '1px solid #fcc', marginBottom: '16px' }}>
                <p style={{ fontSize: '11.5px', color: '#b05040', margin: 0, lineHeight: 1.5, fontWeight: 300 }}>{errorMsg}</p>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={status === 'loading' || !scriptLoaded}
              style={{
                width: '100%', padding: '15px', background: status === 'loading' ? t.textDim : t.gold, color: '#fff',
                border: 'none', cursor: status === 'loading' || !scriptLoaded ? 'not-allowed' : 'pointer',
                fontSize: '9.5px', letterSpacing: '0.18em', textTransform: 'uppercase',
                fontFamily: 'var(--font-inter)', fontWeight: 600, borderRadius: '1px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'background 0.2s', opacity: !scriptLoaded ? 0.6 : 1,
              }}
            >
              {status === 'loading' ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round"/>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg width="11" height="12" viewBox="0 0 11 12" fill="none"><path d="M5.5 0.5L10 3V6.5C10 9 8 10.8 5.5 11.5C3 10.8 1 9 1 6.5V3L5.5 0.5Z" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round"/></svg>
                  Proceed to Secure Payment
                </>
              )}
            </button>

            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                'Secured by Elavon Converge — PCI compliant',
                'Card details entered on Elavon\'s encrypted page',
                'Visa · Mastercard · American Express · Discover',
              ].map(label => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><circle cx="4.5" cy="4.5" r="4" stroke="currentColor" strokeWidth="0.8"/><path d="M2.5 4.5L3.8 5.8L6.5 3" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{ fontSize: '10px', color: t.textDim, fontWeight: 300 }}>{label}</span>
                </div>
              ))}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
    </>
  )
}
