'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'https://api.luxus-collection.com'
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''
const PLAYFAIR = "var(--font-playfair), serif"

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

type OfferData = {
  id: string
  product_title: string
  product_handle: string
  offer_amount: number
  counter_amount: number
  status: string
  expires_at: string | null
}

type Status = 'loading' | 'loaded' | 'not-countered' | 'expired' | 'accepting' | 'accepted' | 'error'

export default function AcceptCounterPage({ params }: {
  params: Promise<{ offerId: string }>
}) {
  const { offerId } = use(params)
  const searchParams = useSearchParams()
  const auth = searchParams.get('auth') ?? undefined
  const { token: jwtToken } = useAuth()
  const router = useRouter()

  const [status,    setStatus]    = useState<Status>('loading')
  const [offer,     setOffer]     = useState<OfferData | null>(null)
  const [errorMsg,  setErrorMsg]  = useState('')

  // Fetch offer details — we can reuse the admin-like approach:
  // ask the storefront to proxy for us, but we actually just need
  // basic info. We'll use the public GET /store/offers/:id if it exists,
  // or fall back to showing the info from the URL's query params if available.
  useEffect(() => {
    if (!offerId) return

    const headers: Record<string, string> = { 'x-publishable-api-key': PK }
    if (jwtToken) headers['Authorization'] = `Bearer ${jwtToken}`

    fetch(`${MEDUSA_URL}/store/offers/${offerId}`, { headers, cache: 'no-store' })
      .then(r => r.json())
      .then((data: any) => {
        const o = data.offer
        if (!o) { setStatus('error'); setErrorMsg('Offer not found.'); return }
        if (o.status !== 'countered') { setStatus('not-countered'); setOffer(o); return }
        if (o.expires_at && new Date(o.expires_at) < new Date()) { setStatus('expired'); setOffer(o); return }
        setOffer(o)
        setStatus('loaded')
      })
      .catch(() => { setStatus('error'); setErrorMsg('Failed to load offer details.') })
  }, [offerId, jwtToken])

  const handleAccept = async () => {
    if (!offer) return
    setStatus('accepting')

    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-publishable-api-key': PK }
    if (jwtToken) headers['Authorization'] = `Bearer ${jwtToken}`

    try {
      const res = await fetch(`${MEDUSA_URL}/store/offers/${offerId}/accept-counter`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ auth_sig: auth }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to accept counter offer')
      const checkoutToken = data.checkout_token
      setStatus('accepted')
      // Redirect to checkout after brief success flash
      setTimeout(() => router.push(`/checkout/offer/${checkoutToken}`), 1200)
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Something went wrong. Please try again.')
      setStatus('loaded')
    }
  }

  const card: React.CSSProperties = {
    maxWidth: '560px', margin: '80px auto', padding: '0 20px',
    fontFamily: 'var(--font-inter)', textAlign: 'center',
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div style={{ ...card, paddingTop: '100px' }}>
        <div style={{ fontSize: '11px', color: '#9e9994', letterSpacing: '0.12em' }}>Loading offer…</div>
      </div>
    )
  }

  // ── Error / not found ────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div style={card}>
        <div style={{ fontFamily: PLAYFAIR, fontSize: '26px', fontWeight: 400, color: '#1a1a1a', marginBottom: '12px' }}>Offer Not Found</div>
        <p style={{ fontSize: '13px', fontWeight: 300, color: '#707076', lineHeight: 1.8, marginBottom: '24px' }}>{errorMsg}</p>
        <Link href="/" style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c9a96e', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid #c9a96e50', paddingBottom: '2px' }}>Back to Home</Link>
      </div>
    )
  }

  // ── No longer a counter offer ────────────────────────────────────────────────
  if (status === 'not-countered') {
    const label = offer?.status === 'accepted' ? 'This offer has already been accepted.'
      : offer?.status === 'declined' ? 'This offer was declined.'
      : 'This counter offer is no longer available.'
    return (
      <div style={card}>
        <div style={{ fontFamily: PLAYFAIR, fontSize: '26px', fontWeight: 400, color: '#1a1a1a', marginBottom: '12px' }}>Link Unavailable</div>
        <p style={{ fontSize: '13px', fontWeight: 300, color: '#707076', lineHeight: 1.8, marginBottom: '24px' }}>{label}</p>
        {offer?.status === 'accepted' && offer.product_handle && (
          <Link href={`/product/${offer.product_handle}`} style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c9a96e', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid #c9a96e50', paddingBottom: '2px' }}>View Item →</Link>
        )}
      </div>
    )
  }

  // ── Expired ──────────────────────────────────────────────────────────────────
  if (status === 'expired') {
    return (
      <div style={card}>
        <div style={{ fontFamily: PLAYFAIR, fontSize: '26px', fontWeight: 400, color: '#1a1a1a', marginBottom: '12px' }}>Offer Expired</div>
        <p style={{ fontSize: '13px', fontWeight: 300, color: '#707076', lineHeight: 1.8, marginBottom: '24px' }}>This counter offer has expired. Please contact us if you&apos;d like to submit a new offer.</p>
        <Link href="mailto:sales@luxus-collection.com" style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c9a96e', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid #c9a96e50', paddingBottom: '2px' }}>Contact Us →</Link>
      </div>
    )
  }

  // ── Accepted → redirect in progress ─────────────────────────────────────────
  if (status === 'accepted') {
    return (
      <div style={{ ...card, paddingTop: '80px' }}>
        <div style={{ width: '52px', height: '52px', border: '1px solid #c9a96e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="20" height="15" viewBox="0 0 22 16" fill="none"><path d="M1 8L8 15L21 1" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ fontFamily: PLAYFAIR, fontSize: '24px', fontWeight: 400, color: '#1a1a1a', marginBottom: '10px' }}>Counter Offer Accepted</div>
        <p style={{ fontSize: '12px', fontWeight: 300, color: '#9e9994', lineHeight: 1.7 }}>Taking you to checkout…</p>
      </div>
    )
  }

  // ── Main view ────────────────────────────────────────────────────────────────
  if (!offer) return null

  const originalAmt = offer.offer_amount
  const counterAmt  = offer.counter_amount

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '64px 20px 80px', fontFamily: 'var(--font-inter)' }}>

      <div style={{ fontSize: '8.5px', letterSpacing: '0.26em', textTransform: 'uppercase', color: '#c9a96e', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '16px', height: '1px', background: '#c9a96e' }}/>
        Counter Offer
      </div>
      <h1 style={{ fontFamily: PLAYFAIR, fontSize: '30px', fontWeight: 400, color: '#1a1a1a', marginBottom: '8px', lineHeight: 1.2 }}>
        {offer.product_title}
      </h1>
      <p style={{ fontSize: '13px', fontWeight: 300, color: '#707076', lineHeight: 1.7, marginBottom: '36px' }}>
        We've reviewed your offer and would like to propose the following counter price. You can accept it below to proceed to checkout.
      </p>

      {/* Price comparison */}
      <div style={{ background: '#fafafa', border: '1px solid #e4e4e6', borderLeft: '3px solid #c9a96e', padding: '24px 28px', marginBottom: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
          <div>
            <div style={{ fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9e9994', fontWeight: 500, marginBottom: '6px' }}>Your Offer</div>
            <div style={{ fontFamily: PLAYFAIR, fontSize: '24px', fontWeight: 400, color: '#9e9994', textDecoration: 'line-through' }}>{fmt(originalAmt)}</div>
          </div>
          <div>
            <div style={{ fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c9a96e', fontWeight: 500, marginBottom: '6px' }}>Our Counter</div>
            <div style={{ fontFamily: PLAYFAIR, fontSize: '30px', fontWeight: 400, color: '#1a1a1a' }}>{fmt(counterAmt)}</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      {errorMsg && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#fff8f6', border: '1px solid #e0a090', fontSize: '12px', color: '#9a3020' }}>
          {errorMsg}
        </div>
      )}

      <button
        onClick={handleAccept}
        disabled={status === 'accepting'}
        style={{
          width: '100%', padding: '17px 32px',
          background: status === 'accepting' ? '#c9a96e88' : '#c9a96e',
          border: 'none', color: '#fff',
          fontSize: '9.5px', letterSpacing: '0.2em', textTransform: 'uppercase',
          fontFamily: 'var(--font-inter)', fontWeight: 600,
          cursor: status === 'accepting' ? 'not-allowed' : 'pointer',
          marginBottom: '14px', transition: 'background 0.2s',
        }}
      >
        {status === 'accepting' ? 'Processing…' : `Accept ${fmt(counterAmt)} & Proceed to Checkout`}
      </button>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
        <Link href={`/product/${offer.product_handle}`}
          style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9e9994', textDecoration: 'none', borderBottom: '1px solid #d0d0d4', paddingBottom: '1px', fontWeight: 500 }}>
          Decline — View Item
        </Link>
        <Link href="mailto:sales@luxus-collection.com"
          style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9e9994', textDecoration: 'none', borderBottom: '1px solid #d0d0d4', paddingBottom: '1px', fontWeight: 500 }}>
          Contact Us
        </Link>
      </div>

      <p style={{ fontSize: '10.5px', color: '#b0b0b6', lineHeight: 1.7, marginTop: '24px', textAlign: 'center', fontWeight: 300 }}>
        Accepting the counter offer will take you to our secure checkout page where you can complete your purchase via wire transfer, check, or cash.
      </p>
    </div>
  )
}
