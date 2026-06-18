'use client'

import { useState } from 'react'
import FflSelector from '@/components/FflSelector'

const PLAYFAIR = "var(--font-playfair), serif"

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

type OfferData = {
  id: string
  product_title: string
  product_handle: string
  product_id: string
  first_name: string
  last_name: string | null
  email: string
  phone: string | null
  offer_amount: number
  counter_amount: number | null
  expires_at: string | null
}

type Props = {
  offer: OfferData
  checkoutToken: string
}

type FflDealer = { name: string; address1: string; city: string; state: string; zip: string; phone: string } | null
type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function OfferCheckoutPage({ offer, checkoutToken }: Props) {
  const acceptedPrice = offer.counter_amount ?? offer.offer_amount

  // Pre-fill from offer
  const [firstName,     setFirstName]     = useState(offer.first_name)
  const [lastName,      setLastName]      = useState(offer.last_name ?? '')
  const [email,         setEmail]         = useState(offer.email)
  const [phone,         setPhone]         = useState(offer.phone ?? '')
  const [buyerAddress1, setBuyerAddress1] = useState('')
  const [buyerCity,     setBuyerCity]     = useState('')
  const [buyerState,    setBuyerState]    = useState('')
  const [buyerZip,      setBuyerZip]      = useState('')
  const [fflDealer,     setFflDealer]     = useState<FflDealer>(null)
  const [fflIsManual,   setFflIsManual]   = useState(false)
  const [fflDealerName, setFflDealerName] = useState('')
  const [fflAddr1,      setFflAddr1]      = useState('')
  const [fflCity,       setFflCity]       = useState('')
  const [fflState,      setFflState]      = useState('')
  const [fflZip,        setFflZip]        = useState('')
  const [fflContactName,  setFflContactName]  = useState('')
  const [fflContactPhone, setFflContactPhone] = useState('')
  const [fflContactEmail, setFflContactEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Wire Transfer')
  const [notes,         setNotes]         = useState('')
  const [status,        setStatus]        = useState<Status>('idle')
  const [errorMsg,      setErrorMsg]      = useState('')
  const [orderRef,      setOrderRef]      = useState('')

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: '#fff', border: '1px solid #e4e4e6', color: '#1a1a1a',
    fontSize: '13px', fontFamily: 'var(--font-inter)', fontWeight: 300,
    letterSpacing: '0.02em', outline: 'none', borderRadius: '1px', boxSizing: 'border-box',
  }
  const label: React.CSSProperties = {
    display: 'block', fontSize: '8.5px', letterSpacing: '0.18em', textTransform: 'uppercase',
    color: '#707076', fontWeight: 500, marginBottom: '6px',
  }
  const section: React.CSSProperties = {
    background: '#fff', border: '1px solid #e4e4e6', marginBottom: '20px',
  }
  const sectionHead: React.CSSProperties = {
    padding: '18px 24px', borderBottom: '1px solid #f0f0f2',
    fontFamily: PLAYFAIR, fontSize: '17px', fontWeight: 400, color: '#1a1a1a',
  }
  const sectionBody: React.CSSProperties = { padding: '22px 24px' }
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }
  const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }

  const onFflSelect = (dealer: FflDealer) => {
    setFflDealer(dealer)
    setFflIsManual(false)
  }

  const handleSubmit = async () => {
    if (!firstName.trim() || !email.trim()) { setErrorMsg('Name and email are required.'); return }
    const fflName = fflIsManual ? fflDealerName : fflDealer?.name
    if (!fflName) { setErrorMsg('Please select or enter an FFL dealer.'); return }

    setStatus('submitting'); setErrorMsg('')

    const body = {
      checkoutToken,
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      email:     email.trim(),
      phone:     phone.trim() || undefined,
      buyerAddress1: buyerAddress1.trim() || undefined,
      buyerCity:     buyerCity.trim()     || undefined,
      buyerState:    buyerState.trim()    || undefined,
      buyerZip:      buyerZip.trim()      || undefined,
      fflDealerName:    fflIsManual ? fflDealerName.trim() : fflDealer?.name,
      fflDealerAddress1:fflIsManual ? fflAddr1.trim()      : fflDealer?.address1,
      fflDealerCity:    fflIsManual ? fflCity.trim()       : fflDealer?.city,
      fflDealerState:   fflIsManual ? fflState.trim()      : fflDealer?.state,
      fflDealerZip:     fflIsManual ? fflZip.trim()        : fflDealer?.zip,
      fflContactName:   fflIsManual ? fflContactName.trim()  : fflDealer?.phone ? undefined : undefined,
      fflContactPhone:  fflIsManual ? fflContactPhone.trim() : fflDealer?.phone || undefined,
      fflContactEmail:  fflIsManual ? fflContactEmail.trim() : undefined,
      paymentMethod,
      notes: notes.trim() || undefined,
    }

    try {
      const res = await fetch('/api/checkout/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed')
      setOrderRef(data.orderRef ?? '')
      setStatus('success')
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div style={{ maxWidth: '560px', margin: '60px auto', padding: '0 20px', fontFamily: 'var(--font-inter)', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', border: '1px solid #c9a96e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none"><path d="M1 8L8 15L21 1" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h1 style={{ fontFamily: PLAYFAIR, fontSize: '28px', fontWeight: 400, color: '#1a1a1a', marginBottom: '14px' }}>Checkout Confirmed</h1>
        {orderRef && <p style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c9a96e', fontWeight: 600, marginBottom: '18px' }}>Reference: {orderRef}</p>}
        <p style={{ fontSize: '13px', fontWeight: 300, color: '#525258', lineHeight: 1.8, marginBottom: '8px' }}>
          We've received your checkout details. Your item is held pending receipt of payment.
          A confirmation with {paymentMethod === 'Check' ? 'mailing' : 'wire transfer'} instructions has been sent to <strong style={{ color: '#1a1a1a' }}>{email}</strong>.
        </p>
        <p style={{ fontSize: '12px', color: '#9e9994', lineHeight: 1.7 }}>
          Questions? Email us at{' '}
          <a href="mailto:sales@luxus-collection.com" style={{ color: '#c9a96e' }}>sales@luxus-collection.com</a>
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 20px 80px', fontFamily: 'var(--font-inter)' }}>

      {/* Offer summary banner */}
      <div style={{ background: '#fafafa', border: '1px solid #e4e4e6', borderLeft: '3px solid #c9a96e', padding: '20px 24px', marginBottom: '32px' }}>
        <div style={{ fontSize: '8.5px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c9a96e', fontWeight: 600, marginBottom: '8px' }}>Your Accepted Offer</div>
        <div style={{ fontFamily: PLAYFAIR, fontSize: '20px', fontWeight: 400, color: '#1a1a1a', marginBottom: '6px' }}>{offer.product_title}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontFamily: PLAYFAIR, fontSize: '26px', fontWeight: 400, color: '#1a1a1a' }}>{fmt(acceptedPrice)}</span>
          {offer.counter_amount && offer.counter_amount !== offer.offer_amount && (
            <span style={{ fontSize: '12px', color: '#9e9994', textDecoration: 'line-through' }}>{fmt(offer.offer_amount)}</span>
          )}
          <span style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c9a96e', fontWeight: 500 }}>Accepted</span>
        </div>
      </div>

      <h1 style={{ fontFamily: PLAYFAIR, fontSize: '28px', fontWeight: 400, color: '#1a1a1a', marginBottom: '8px' }}>Complete Your Purchase</h1>
      <p style={{ fontSize: '13px', fontWeight: 300, color: '#707076', lineHeight: 1.7, marginBottom: '32px' }}>
        Provide your details and select your FFL transfer dealer. We'll send payment instructions to your email.
      </p>

      {/* Buyer Info */}
      <div style={section}>
        <div style={sectionHead}>Your Information</div>
        <div style={sectionBody}>
          <div style={{ ...grid2, marginBottom: '14px' }}>
            <div>
              <span style={label}>First Name <span style={{ color: '#c9a96e' }}>*</span></span>
              <input style={inp} value={firstName} onChange={e => setFirstName(e.target.value)} onFocus={e => e.currentTarget.style.borderColor = '#c9a96e70'} onBlur={e => e.currentTarget.style.borderColor = '#e4e4e6'} />
            </div>
            <div>
              <span style={label}>Last Name</span>
              <input style={inp} value={lastName} onChange={e => setLastName(e.target.value)} onFocus={e => e.currentTarget.style.borderColor = '#c9a96e70'} onBlur={e => e.currentTarget.style.borderColor = '#e4e4e6'} />
            </div>
          </div>
          <div style={{ ...grid2, marginBottom: '14px' }}>
            <div>
              <span style={label}>Email <span style={{ color: '#c9a96e' }}>*</span></span>
              <input style={{ ...inp, background: '#f8f8f8' }} value={email} readOnly tabIndex={-1} />
            </div>
            <div>
              <span style={label}>Phone</span>
              <input style={inp} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" onFocus={e => e.currentTarget.style.borderColor = '#c9a96e70'} onBlur={e => e.currentTarget.style.borderColor = '#e4e4e6'} />
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <span style={label}>Street Address</span>
            <input style={inp} value={buyerAddress1} onChange={e => setBuyerAddress1(e.target.value)} placeholder="123 Main St" onFocus={e => e.currentTarget.style.borderColor = '#c9a96e70'} onBlur={e => e.currentTarget.style.borderColor = '#e4e4e6'} />
          </div>
          <div style={grid3}>
            <div>
              <span style={label}>City</span>
              <input style={inp} value={buyerCity} onChange={e => setBuyerCity(e.target.value)} placeholder="Tampa" onFocus={e => e.currentTarget.style.borderColor = '#c9a96e70'} onBlur={e => e.currentTarget.style.borderColor = '#e4e4e6'} />
            </div>
            <div>
              <span style={label}>State</span>
              <input style={inp} value={buyerState} onChange={e => setBuyerState(e.target.value.toUpperCase())} placeholder="FL" maxLength={2} onFocus={e => e.currentTarget.style.borderColor = '#c9a96e70'} onBlur={e => e.currentTarget.style.borderColor = '#e4e4e6'} />
            </div>
            <div>
              <span style={label}>ZIP</span>
              <input style={inp} value={buyerZip} onChange={e => setBuyerZip(e.target.value)} placeholder="33602" onFocus={e => e.currentTarget.style.borderColor = '#c9a96e70'} onBlur={e => e.currentTarget.style.borderColor = '#e4e4e6'} />
            </div>
          </div>
        </div>
      </div>

      {/* FFL Dealer */}
      <div style={section}>
        <div style={sectionHead}>FFL Transfer Dealer</div>
        <div style={sectionBody}>
          {!fflIsManual ? (
            <FflSelector
              onSelect={onFflSelect}
              selected={fflDealer}
              onManualMode={() => setFflIsManual(true)}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <button onClick={() => setFflIsManual(false)} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#c9a96e', fontSize: '11px', fontFamily: 'var(--font-inter)', cursor: 'pointer', padding: 0 }}>← Search instead</button>
              <div>
                <span style={label}>Dealer Name <span style={{ color: '#c9a96e' }}>*</span></span>
                <input style={inp} value={fflDealerName} onChange={e => setFflDealerName(e.target.value)} placeholder="Smith's Gun Shop" onFocus={e => e.currentTarget.style.borderColor = '#c9a96e70'} onBlur={e => e.currentTarget.style.borderColor = '#e4e4e6'} />
              </div>
              <div>
                <span style={label}>Address</span>
                <input style={inp} value={fflAddr1} onChange={e => setFflAddr1(e.target.value)} placeholder="456 Dealer Blvd" onFocus={e => e.currentTarget.style.borderColor = '#c9a96e70'} onBlur={e => e.currentTarget.style.borderColor = '#e4e4e6'} />
              </div>
              <div style={grid3}>
                <div>
                  <span style={label}>City</span>
                  <input style={inp} value={fflCity} onChange={e => setFflCity(e.target.value)} onFocus={e => e.currentTarget.style.borderColor = '#c9a96e70'} onBlur={e => e.currentTarget.style.borderColor = '#e4e4e6'} />
                </div>
                <div>
                  <span style={label}>State</span>
                  <input style={inp} value={fflState} onChange={e => setFflState(e.target.value.toUpperCase())} maxLength={2} onFocus={e => e.currentTarget.style.borderColor = '#c9a96e70'} onBlur={e => e.currentTarget.style.borderColor = '#e4e4e6'} />
                </div>
                <div>
                  <span style={label}>ZIP</span>
                  <input style={inp} value={fflZip} onChange={e => setFflZip(e.target.value)} onFocus={e => e.currentTarget.style.borderColor = '#c9a96e70'} onBlur={e => e.currentTarget.style.borderColor = '#e4e4e6'} />
                </div>
              </div>
              <div style={{ paddingTop: '12px', borderTop: '1px solid #f0f0f2' }}>
                <div style={{ fontSize: '11px', color: '#9e9994', marginBottom: '12px' }}>Contact at dealer (optional)</div>
                <div style={grid3}>
                  <div>
                    <span style={label}>Contact Name</span>
                    <input style={inp} value={fflContactName} onChange={e => setFflContactName(e.target.value)} onFocus={e => e.currentTarget.style.borderColor = '#c9a96e70'} onBlur={e => e.currentTarget.style.borderColor = '#e4e4e6'} />
                  </div>
                  <div>
                    <span style={label}>Contact Phone</span>
                    <input style={inp} value={fflContactPhone} onChange={e => setFflContactPhone(e.target.value)} onFocus={e => e.currentTarget.style.borderColor = '#c9a96e70'} onBlur={e => e.currentTarget.style.borderColor = '#e4e4e6'} />
                  </div>
                  <div>
                    <span style={label}>Contact Email</span>
                    <input style={inp} type="email" value={fflContactEmail} onChange={e => setFflContactEmail(e.target.value)} onFocus={e => e.currentTarget.style.borderColor = '#c9a96e70'} onBlur={e => e.currentTarget.style.borderColor = '#e4e4e6'} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment */}
      <div style={section}>
        <div style={sectionHead}>Payment Method</div>
        <div style={sectionBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {(['Wire Transfer', 'Check', 'Cash'] as const).map(method => (
              <label key={method} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px 14px', border: `1px solid ${paymentMethod === method ? '#c9a96e' : '#e4e4e6'}`, background: paymentMethod === method ? '#fdf9f1' : '#fff' }}>
                <input type="radio" name="payment" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} style={{ accentColor: '#c9a96e' }} />
                <span style={{ fontSize: '13px', fontWeight: 300, color: '#1a1a1a' }}>{method}</span>
              </label>
            ))}
          </div>
          <div>
            <span style={label}>Notes (optional)</span>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Any questions or special instructions…"
              style={{ ...inp, lineHeight: 1.6, resize: 'vertical' }}
              onFocus={e => e.currentTarget.style.borderColor = '#c9a96e70'}
              onBlur={e => e.currentTarget.style.borderColor = '#e4e4e6'}
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {(status === 'error' || errorMsg) && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#fff8f6', border: '1px solid #e0a090', fontSize: '12px', color: '#9a3020' }}>
          {errorMsg}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={status === 'submitting'}
        style={{
          width: '100%', padding: '16px 32px',
          background: status === 'submitting' ? '#c9a96e88' : '#c9a96e',
          border: 'none', color: '#fff',
          fontSize: '9.5px', letterSpacing: '0.2em', textTransform: 'uppercase',
          fontFamily: 'var(--font-inter)', fontWeight: 600, cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {status === 'submitting' ? 'Processing…' : `Confirm & Get Payment Instructions — ${fmt(acceptedPrice)}`}
      </button>

      <p style={{ fontSize: '10.5px', color: '#9e9994', lineHeight: 1.7, marginTop: '14px', textAlign: 'center' }}>
        Submitting this form does not charge you. We will send payment instructions to your email and hold the item for 5 business days pending receipt of funds.
      </p>
    </div>
  )
}
