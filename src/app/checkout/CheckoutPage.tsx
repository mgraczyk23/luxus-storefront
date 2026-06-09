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

type PaymentMethod = 'card' | 'wire'

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

function SectionHead({ title }: { title: string }) {
  const { t } = useTheme()
  return (
    <div style={{ fontSize: '8.5px', letterSpacing: '0.22em', textTransform: 'uppercase', color: t.gold, fontWeight: 500, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '14px', height: '1px', background: t.gold }} />
      {title}
    </div>
  )
}

function Field({
  label, name, value, onChange, required, type = 'text', placeholder, error,
}: {
  label: string; name: keyof FormData; value: string
  onChange: (k: keyof FormData, v: string) => void
  required?: boolean; type?: string; placeholder?: string; error?: string
}) {
  const { t } = useTheme()
  const [touched, setTouched] = useState(false)
  const showErr = touched && error
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: showErr ? '#b05040' : t.textDim, fontWeight: 500, fontFamily: 'var(--font-inter)' }}>
        {label}{required && <span style={{ color: t.gold, marginLeft: '3px' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(name, e.target.value)}
        onFocus={e => { e.currentTarget.style.borderColor = showErr ? '#e09080' : t.gold }}
        onBlur={e => { setTouched(true); e.currentTarget.style.borderColor = error ? '#e09080' : t.border }}
        placeholder={placeholder}
        style={{
          padding: '11px 13px',
          border: `1px solid ${showErr ? '#e09080' : t.border}`,
          background: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)',
          color: t.text, fontWeight: 300, outline: 'none', width: '100%', boxSizing: 'border-box',
        }}
      />
      {showErr && <span style={{ fontSize: '10px', color: '#b05040', fontFamily: 'var(--font-inter)' }}>{error}</span>}
    </div>
  )
}

function CartItemRow({ item }: { item: CartItem }) {
  const { t } = useTheme()
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingBottom: '12px', borderBottom: `1px solid ${t.border}` }}>
      {item.thumbnail ? (
        <div style={{ width: '52px', height: '52px', position: 'relative', flexShrink: 0, border: `1px solid ${t.border}`, background: '#fff' }}>
          <Image src={item.thumbnail} alt={item.title} fill style={{ objectFit: 'contain' }} sizes="52px" />
        </div>
      ) : (
        <div style={{ width: '52px', height: '52px', flexShrink: 0, border: `1px solid ${t.border}`, background: '#f5f5f5' }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {item.brand && (
          <div style={{ fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: t.gold, fontWeight: 500 }}>{item.brand}</div>
        )}
        <div style={{ fontSize: '12px', fontWeight: 300, color: t.text, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
        {item.quantity > 1 && <div style={{ fontSize: '10.5px', color: t.textMuted, marginTop: '2px' }}>×{item.quantity}</div>}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 400, color: t.text, flexShrink: 0 }}>{fmt(item.price * item.quantity)}</div>
    </div>
  )
}

function PaymentMethodSelector({ value, onChange }: { value: PaymentMethod; onChange: (m: PaymentMethod) => void }) {
  const { t } = useTheme()
  const options: { id: PaymentMethod; label: string; sub: string; icon: React.ReactNode }[] = [
    {
      id: 'card',
      label: 'Credit / Debit Card',
      sub: 'Visa · Mastercard · Amex · Discover',
      icon: (
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
          <rect x="0.5" y="0.5" width="17" height="13" rx="1.5" stroke="currentColor" strokeWidth="1"/>
          <path d="M0.5 4H17.5" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="2" y="7.5" width="4" height="2" rx="0.5" fill="currentColor"/>
        </svg>
      ),
    },
    {
      id: 'wire',
      label: 'Wire Transfer or Check',
      sub: 'Instructions emailed · Order held 5 business days',
      icon: (
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
          <rect x="0.5" y="0.5" width="17" height="13" rx="1.5" stroke="currentColor" strokeWidth="1"/>
          <path d="M3 5h4M3 7h6M3 9h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          <path d="M12 4l2.5 3L12 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {options.map(opt => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 16px', border: `1px solid ${active ? t.gold : t.border}`,
              background: active ? `${t.gold}08` : '#fff',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%',
              border: `1.5px solid ${active ? t.gold : t.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, background: active ? t.gold : 'transparent',
              transition: 'all 0.15s',
            }}>
              {active && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
            </div>
            <span style={{ color: active ? t.gold : t.textDim, flexShrink: 0 }}>{opt.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: t.text, fontFamily: 'var(--font-inter)', marginBottom: '2px' }}>{opt.label}</div>
              <div style={{ fontSize: '10px', fontWeight: 300, color: t.textMuted, fontFamily: 'var(--font-inter)' }}>{opt.sub}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default function CheckoutPage() {
  const { t } = useTheme()
  const { cartItems, clearCart } = useCart()
  const router = useRouter()
  const [form, setForm] = useState<FormData>(EMPTY)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const orderRefRef = useRef('')

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)

  const setField = useCallback((k: keyof FormData, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }))
    setErrorMsg('')
  }, [])

  const fieldErrors = {
    firstName: !form.firstName.trim() ? 'Required' : undefined,
    lastName: !form.lastName.trim() ? 'Required' : undefined,
    email: !form.email.trim() ? 'Required' : !form.email.includes('@') ? 'Enter a valid email' : undefined,
  }

  const validate = () => {
    if (fieldErrors.firstName) return 'First name is required'
    if (fieldErrors.lastName) return 'Last name is required'
    if (fieldErrors.email) return 'Valid email address is required'
    if (cartItems.length === 0) return 'Your cart is empty'
    return null
  }

  const orderPayload = () => ({
    orderRef: orderRefRef.current,
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
  })

  const handleWireOrder = async () => {
    const err = validate()
    if (err) { setErrorMsg(err); return }

    setStatus('loading')
    setErrorMsg('')
    orderRefRef.current = genRef()

    try {
      const res = await fetch('/api/checkout/wire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload()),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setStatus('error')
        setErrorMsg(data.error ?? 'Could not submit order. Please try again.')
        return
      }

      clearCart()
      router.push(`/order-confirmation?ref=${encodeURIComponent(orderRefRef.current)}&name=${encodeURIComponent(form.firstName.trim())}&method=wire`)
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please check your connection and try again.')
    }
  }

  const handleCardPay = async () => {
    const err = validate()
    if (err) { setErrorMsg(err); return }
    if (!window.ConvergeLightbox) {
      setErrorMsg('Payment form could not load. Please ensure your browser allows scripts from convergepay.com, then refresh and try again.')
      return
    }

    setStatus('loading')
    setErrorMsg('')
    orderRefRef.current = genRef()

    try {
      const tokenRes = await fetch('/api/elavon/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: subtotal,
          invoiceRef: orderRefRef.current,
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
          setErrorMsg(response.ssl_result_message
            ? `Payment declined: ${response.ssl_result_message}`
            : 'Your card was declined. Please try a different card.')
        },

        onApproval: async (response) => {
          await fetch('/api/elavon/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...orderPayload(),
              approvalCode: response.ssl_approval_code ?? '',
              txnId: response.ssl_txn_id ?? '',
            }),
          }).catch(() => {})

          clearCart()
          router.push(`/order-confirmation?ref=${encodeURIComponent(orderRefRef.current)}&name=${encodeURIComponent(form.firstName.trim())}&method=card`)
        },
      })
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please check your connection and try again.')
    }
  }

  const handleSubmit = () => {
    if (paymentMethod === 'wire') handleWireOrder()
    else handleCardPay()
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

  const isLoading = status === 'loading'
  const cardReady = true // script load is checked at click time; don't gate the button

  return (
    <>
      <Script
        src="https://api.convergepay.com/hosted-payments/Lightbox.js"
        onLoad={() => setScriptLoaded(true)}
        strategy="afterInteractive"
      />

      <style>{`
        .lxs-co-grid { display: grid; grid-template-columns: 1fr 400px; gap: 48px; align-items: start; }
        .lxs-co-sticky { position: sticky; top: 96px; }
        .lxs-co-contact { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .lxs-co-ffl { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 14px; }
        @keyframes lxs-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 860px) {
          .lxs-co-grid { grid-template-columns: 1fr !important; }
          .lxs-co-sticky { position: static !important; }
        }
        @media (max-width: 560px) {
          .lxs-co-contact { grid-template-columns: 1fr !important; }
          .lxs-co-ffl { grid-template-columns: 1fr !important; }
          .lxs-co-banner { padding: 24px 20px 20px !important; }
          .lxs-co-main { padding: 32px 20px 64px !important; }
        }
      `}</style>

      <div style={{ background: t.bg, color: t.text, fontFamily: 'var(--font-inter)' }}>

        {/* Banner */}
        <div className="lxs-co-banner" style={{ background: 'linear-gradient(to bottom,#f3f3f5,#ffffff)', borderBottom: `1px solid ${t.border}`, padding: '36px 40px 28px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              {['Home', 'Cart', 'Checkout'].map((c, i) => (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {i > 0 && <span style={{ fontSize: '9px', color: t.textDim }}>›</span>}
                  <span style={{ fontSize: '10px', color: i < 2 ? t.textDim : t.textMuted, fontWeight: 300 }}>
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
        <div className="lxs-co-main" style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 40px 96px' }}>
          <div className="lxs-co-grid">

            {/* ── Left: Form ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

              {/* Contact */}
              <section>
                <SectionHead title="Contact Information" />
                <div className="lxs-co-contact">
                  <Field label="First Name" name="firstName" value={form.firstName} onChange={setField} required
                    error={fieldErrors.firstName} />
                  <Field label="Last Name" name="lastName" value={form.lastName} onChange={setField} required
                    error={fieldErrors.lastName} />
                  <Field label="Email Address" name="email" value={form.email} onChange={setField} required type="email"
                    error={fieldErrors.email} />
                  <Field label="Phone Number" name="phone" value={form.phone} onChange={setField} placeholder="Optional" />
                </div>
              </section>

              {/* FFL */}
              <section>
                <SectionHead title="FFL Transfer Dealer" />
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px 16px', background: '#fafaf8', border: `1px solid ${t.border}`, borderLeft: `2px solid ${t.gold}50`, marginBottom: '16px' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: t.gold, flexShrink: 0, marginTop: '1px' }}>
                    <path d="M7 0.5L13 4V8C13 11 10.5 13 7 14C3.5 13 1 11 1 8V4L7 0.5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                  </svg>
                  <p style={{ fontSize: '12px', fontWeight: 300, color: t.textMuted, lineHeight: 1.6, margin: 0 }}>
                    All firearms require FFL transfer. Enter your chosen dealer — we ship directly to them.{' '}
                    <Link href="/support#ffl" style={{ color: t.gold, textDecoration: 'none', borderBottom: `1px solid ${t.gold}50` }}>Learn more →</Link>
                  </p>
                </div>
                <div className="lxs-co-ffl">
                  <Field label="Dealer Name" name="fflDealerName" value={form.fflDealerName} onChange={setField} placeholder="e.g. Sarasota Firearms" />
                  <Field label="City" name="fflDealerCity" value={form.fflDealerCity} onChange={setField} />
                  <Field label="State" name="fflDealerState" value={form.fflDealerState} onChange={setField} placeholder="e.g. FL" />
                </div>
              </section>

              {/* Notes */}
              <section>
                <SectionHead title="Order Notes" />
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

            {/* ── Right: Order Summary ── */}
            <div className="lxs-co-sticky" style={{ background: '#fff', border: `1px solid ${t.border}`, padding: '28px' }}>
              <SectionHead title="Order Summary" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {cartItems.map(item => <CartItemRow key={item.id} item={item} />)}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '16px', borderTop: `1px solid ${t.border}`, marginBottom: '8px' }}>
                {[
                  ['Subtotal', fmt(subtotal)],
                  ['Shipping', 'Invoiced after order'],
                  ['Tax', 'Calculated at transfer'],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 300, color: t.textMuted }}>{label}</span>
                    <span style={{ fontSize: '11.5px', fontWeight: 300, color: t.text }}>{val}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 0', borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, marginBottom: '24px' }}>
                <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '16px', fontWeight: 400, color: t.text }}>Total</span>
                <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 300, color: t.text }}>{fmt(subtotal)}</span>
              </div>

              {/* Payment method */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '8.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: t.textDim, fontWeight: 500, marginBottom: '12px', fontFamily: 'var(--font-inter)' }}>
                  Payment Method
                </div>
                <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
              </div>

              {/* Wire note */}
              {paymentMethod === 'wire' && (
                <div style={{ padding: '12px 14px', background: '#faf9f5', border: `1px solid ${t.border}`, borderLeft: `2px solid ${t.gold}50`, marginBottom: '16px' }}>
                  <p style={{ fontSize: '11.5px', fontWeight: 300, color: t.textMuted, lineHeight: 1.55, margin: 0 }}>
                    Wire instructions will be emailed to you immediately. Your order is held for <strong>5 business days</strong> pending receipt of funds.
                  </p>
                </div>
              )}

              {errorMsg && (
                <div style={{ padding: '12px 14px', background: '#fff5f5', border: '1px solid #fcc', marginBottom: '16px' }}>
                  <p style={{ fontSize: '11.5px', color: '#b05040', margin: 0, lineHeight: 1.5, fontWeight: 300 }}>{errorMsg}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                style={{
                  width: '100%', padding: '15px',
                  background: isLoading ? t.textDim : t.gold,
                  color: '#fff', border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '9.5px', letterSpacing: '0.18em', textTransform: 'uppercase',
                  fontFamily: 'var(--font-inter)', fontWeight: 600, borderRadius: '1px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'background 0.2s',
                }}
              >
                {isLoading ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ animation: 'lxs-spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round"/>
                    </svg>
                    Processing...
                  </>
                ) : paymentMethod === 'wire' ? (
                  <>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 0.5L10 3V6.5C10 9 8 10.8 5.5 11.5C3 10.8 1 9 1 6.5V3L5.5 0.5Z" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round"/></svg>
                    Submit Order — Wire / Check
                  </>
                ) : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 0.5L10 3V6.5C10 9 8 10.8 5.5 11.5C3 10.8 1 9 1 6.5V3L5.5 0.5Z" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round"/></svg>
                    Proceed to Secure Payment
                  </>
                )}
              </button>

              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(paymentMethod === 'card' ? [
                  'Secured by Elavon Converge — PCI SAQ A',
                  'Card details entered on Elavon\'s encrypted page',
                  'Visa · Mastercard · American Express · Discover',
                ] : [
                  'Order held for 5 business days pending payment',
                  'Wire instructions emailed to you immediately',
                  'Questions? Call (941) 253-3660',
                ]).map(label => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <circle cx="4.5" cy="4.5" r="4" stroke="currentColor" strokeWidth="0.8"/>
                      <path d="M2.5 4.5L3.8 5.8L6.5 3" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: '10px', color: t.textDim, fontWeight: 300 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
