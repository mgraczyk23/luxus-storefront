'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import { useCart, type CartItem } from '@/context/CartContext'
import FflSelector from '@/components/FflSelector'
import { fetchRestrictions, checkState, type StateRestriction } from '@/lib/state-restrictions'

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'https://api.luxus-collection.com'
const MEDUSA_PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''
const US_REGION_ID = 'reg_01KRM4PNPXXVRHKQP5NN4XFMQX'

const medusaHeaders = {
  'Content-Type': 'application/json',
  'x-publishable-api-key': MEDUSA_PK,
}

// Format cents from Medusa into display dollars
const fmtCents = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(cents / 100)

// Format dollars (for local cart item prices which are already in dollars)
const fmtDollars = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)

type PaymentMethod = 'card' | 'wire'

type FormData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  buyerAddress1: string
  buyerCity: string
  buyerState: string
  buyerZip: string
  fflDealerName: string
  fflDealerAddress1: string
  fflDealerCity: string
  fflDealerState: string
  fflDealerZip: string
  fflContactName: string
  fflContactPhone: string
  fflContactEmail: string
  notes: string
}

const EMPTY: FormData = {
  firstName: '', lastName: '', email: '', phone: '',
  buyerAddress1: '', buyerCity: '', buyerState: '', buyerZip: '',
  fflDealerName: '', fflDealerAddress1: '', fflDealerCity: '', fflDealerState: '', fflDealerZip: '',
  fflContactName: '', fflContactPhone: '', fflContactEmail: '',
  notes: '',
}

type MedusaCart = {
  id: string
  item_subtotal: number
  shipping_subtotal: number
  tax_total: number
  total: number
  subtotal: number
  shipping_options?: Array<{ id: string; name: string; amount: number }>
  payment_collection?: { id: string; payment_sessions?: Array<{ id: string; data: Record<string, any> }> }
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
          padding: '11px 13px', border: `1px solid ${showErr ? '#e09080' : t.border}`,
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
        {item.brand && <div style={{ fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: t.gold, fontWeight: 500 }}>{item.brand}</div>}
        <div style={{ fontSize: '12px', fontWeight: 300, color: t.text, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
        {item.quantity > 1 && <div style={{ fontSize: '10.5px', color: t.textMuted, marginTop: '2px' }}>×{item.quantity}</div>}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 400, color: t.text, flexShrink: 0 }}>{fmtDollars(item.price * item.quantity)}</div>
    </div>
  )
}

function PaymentMethodSelector({ value, onChange }: { value: PaymentMethod; onChange: (m: PaymentMethod) => void }) {
  const { t } = useTheme()
  const options: { id: PaymentMethod; label: string; sub: string }[] = [
    { id: 'card', label: 'Credit / Debit Card', sub: 'Visa · Mastercard · Amex · Discover' },
    { id: 'wire', label: 'Wire Transfer or Check', sub: 'Instructions emailed · Order held 5 business days' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {options.map(opt => {
        const active = value === opt.id
        return (
          <button key={opt.id} type="button" onClick={() => onChange(opt.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', border: `1px solid ${active ? t.gold : t.border}`, background: active ? `${t.gold}08` : '#fff', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.15s' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `1.5px solid ${active ? t.gold : t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: active ? t.gold : 'transparent', transition: 'all 0.15s' }}>
              {active && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
            </div>
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

async function medusaFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${MEDUSA_URL}${path}`, {
    ...options,
    headers: { ...medusaHeaders, ...(options.headers ?? {}) },
  })
  return res.json()
}

export default function CheckoutPage() {
  const { t } = useTheme()
  const { cartItems, clearCart } = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [form, setForm] = useState<FormData>(EMPTY)
  const [fflIsManual, setFflIsManual] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [restrictions, setRestrictions] = useState<StateRestriction[]>([])

  useEffect(() => { fetchRestrictions().then(setRestrictions) }, [])

  // Medusa cart state
  const [medusaCart, setMedusaCart] = useState<MedusaCart | null>(null)
  const [medusaCartLoading, setMedusaCartLoading] = useState(true)
  const [shippingOptionId, setShippingOptionId] = useState<string | null>(null)
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Show message from Elavon redirects
  useEffect(() => {
    const declined = searchParams.get('declined')
    const cancelled = searchParams.get('cancelled')
    if (declined) setErrorMsg(`Payment declined: ${declined}`)
    else if (cancelled) setErrorMsg('Payment cancelled. Your cart has been restored — you can try again when ready.')
  }, [searchParams])

  // Create Medusa cart on mount
  useEffect(() => {
    if (cartItems.length === 0) { setMedusaCartLoading(false); return }
    let cancelled = false

    async function initCart() {
      setMedusaCartLoading(true)
      try {
        // Create cart with line items
        const items = cartItems
          .filter(i => i.variant_id)
          .map(i => ({ variant_id: i.variant_id!, quantity: i.quantity }))

        const cartData = await medusaFetch('/store/carts', {
          method: 'POST',
          body: JSON.stringify({ region_id: US_REGION_ID, items }),
        })

        if (cancelled || !cartData.cart) return
        const cartId = cartData.cart.id

        // Get and auto-apply shipping option
        const optData = await medusaFetch(`/store/shipping-options?cart_id=${cartId}`)
        const opts = optData.shipping_options ?? []
        let appliedCart = cartData.cart

        if (opts.length > 0) {
          const optId = opts[0].id
          if (!cancelled) setShippingOptionId(optId)
          const shippingData = await medusaFetch(`/store/carts/${cartId}/shipping-methods`, {
            method: 'POST',
            body: JSON.stringify({ option_id: optId }),
          })
          if (shippingData.cart) appliedCart = shippingData.cart
        }

        if (!cancelled) setMedusaCart(appliedCart)
      } catch (err) {
        console.error('[checkout] cart init failed:', err)
      } finally {
        if (!cancelled) setMedusaCartLoading(false)
      }
    }

    initCart()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // Only run once on mount — cartItems are already loaded from localStorage

  // Update cart shipping address when buyer state changes (drives Medusa tax calculation)
  useEffect(() => {
    if (!medusaCart?.id || !form.buyerState.trim()) return
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current)
    addressDebounceRef.current = setTimeout(async () => {
      try {
        const updatedData = await medusaFetch(`/store/carts/${medusaCart.id}`, {
          method: 'POST',
          body: JSON.stringify({
            shipping_address: {
              first_name: form.firstName.trim() || 'Buyer',
              last_name: form.lastName.trim() || 'Address',
              address_1: form.buyerAddress1.trim() || 'Address',
              city: form.buyerCity.trim() || 'City',
              country_code: 'us',
              province: form.buyerState.trim().toLowerCase(),
              postal_code: form.buyerZip.trim() || '00000',
            },
          }),
        })
        if (updatedData.cart) setMedusaCart(updatedData.cart)
      } catch { /* non-fatal */ }
    }, 500)
  }, [form.buyerState, form.buyerAddress1, form.buyerCity, form.buyerZip, form.firstName, form.lastName, medusaCart?.id])

  const setField = useCallback((k: keyof FormData, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }))
    setErrorMsg('')
  }, [])

  const fieldErrors = {
    firstName:       !form.firstName.trim() ? 'Required' : undefined,
    lastName:        !form.lastName.trim() ? 'Required' : undefined,
    email:           !form.email.trim() ? 'Required' : !form.email.includes('@') ? 'Enter a valid email' : undefined,
    phone:           !form.phone.trim() ? 'Required' : undefined,
    buyerAddress1:   !form.buyerAddress1.trim() ? 'Required' : undefined,
    buyerCity:       !form.buyerCity.trim() ? 'Required' : undefined,
    buyerState:      !form.buyerState.trim() ? 'Required' : undefined,
    buyerZip:        !form.buyerZip.trim() ? 'Required' : undefined,
    fflDealerName:     fflIsManual && !form.fflDealerName.trim() ? 'Required' : undefined,
    fflDealerAddress1: fflIsManual && !form.fflDealerAddress1.trim() ? 'Required' : undefined,
    fflDealerCity:     fflIsManual && !form.fflDealerCity.trim() ? 'Required' : undefined,
    fflDealerState:    fflIsManual && !form.fflDealerState.trim() ? 'Required' : undefined,
    fflDealerZip:      fflIsManual && !form.fflDealerZip.trim() ? 'Required' : undefined,
  }

  const validate = () => {
    if (fieldErrors.firstName) return 'First name is required'
    if (fieldErrors.lastName) return 'Last name is required'
    if (fieldErrors.email) return 'Valid email address is required'
    if (fieldErrors.phone) return 'Phone number is required'
    if (fieldErrors.buyerAddress1) return 'Street address is required'
    if (fieldErrors.buyerCity) return 'City is required'
    if (fieldErrors.buyerState) return 'State is required'
    if (fieldErrors.buyerZip) return 'ZIP code is required'
    if (fflIsManual && fieldErrors.fflDealerName) return 'FFL dealer name is required'
    if (fflIsManual && fieldErrors.fflDealerAddress1) return 'FFL dealer street address is required'
    if (fflIsManual && fieldErrors.fflDealerCity) return 'FFL dealer city is required'
    if (fflIsManual && fieldErrors.fflDealerState) return 'FFL dealer state is required'
    if (fflIsManual && fieldErrors.fflDealerZip) return 'FFL dealer ZIP is required'
    if (form.buyerState.trim()) {
      const stateCheck = checkState(form.buyerState.trim(), restrictions, {})
      if (!stateCheck.ok) return stateCheck.reason
    }
    if (cartItems.length === 0) return 'Your cart is empty'
    if (!medusaCart?.id) return 'Cart is still loading — please wait a moment'
    return null
  }

  const cartMeta = () => ({
    ffl_dealer_name:     form.fflDealerName.trim(),
    ffl_dealer_address1: form.fflDealerAddress1.trim(),
    ffl_dealer_city:     form.fflDealerCity.trim(),
    ffl_dealer_state:    form.fflDealerState.trim().toUpperCase(),
    ffl_dealer_zip:      form.fflDealerZip.trim(),
    ffl_contact_name:    form.fflContactName.trim(),
    ffl_contact_phone:   form.fflContactPhone.trim(),
    ffl_contact_email:   form.fflContactEmail.trim(),
    ffl_is_manual:       fflIsManual ? 'true' : 'false',
    buyer_address1:      form.buyerAddress1.trim(),
    buyer_city:          form.buyerCity.trim(),
    buyer_state:         form.buyerState.trim().toUpperCase(),
    buyer_zip:           form.buyerZip.trim(),
    notes:               form.notes.trim(),
    customer_phone:      form.phone.trim(),
  })

  // Ensure cart has latest email + FFL metadata before paying
  async function prepareCart() {
    if (!medusaCart?.id) throw new Error('No cart')
    const data = await medusaFetch(`/store/carts/${medusaCart.id}`, {
      method: 'POST',
      body: JSON.stringify({
        email: form.email.trim(),
        metadata: cartMeta(),
        billing_address: {
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          address_1: form.buyerAddress1.trim(),
          city: form.buyerCity.trim(),
          country_code: 'us',
          province: form.buyerState.trim().toLowerCase(),
          postal_code: form.buyerZip.trim(),
          phone: form.phone.trim(),
        },
        shipping_address: form.buyerState.trim() ? {
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          address_1: form.buyerAddress1.trim(),
          city: form.buyerCity.trim(),
          country_code: 'us',
          province: form.buyerState.trim().toLowerCase(),
          postal_code: form.buyerZip.trim(),
        } : undefined,
      }),
    })
    if (data.cart) setMedusaCart(data.cart)
    return data.cart ?? medusaCart
  }

  async function ensurePaymentCollection(cartId: string, providerId: string, extraData?: Record<string, unknown>) {
    // Create payment collection
    const pcData = await medusaFetch('/store/payment-collections', {
      method: 'POST',
      body: JSON.stringify({ cart_id: cartId }),
    })
    const pcId = pcData.payment_collection?.id
    if (!pcId) throw new Error('Could not create payment collection')

    // Initiate payment session
    const sessionData = await medusaFetch(`/store/payment-collections/${pcId}/payment-sessions`, {
      method: 'POST',
      body: JSON.stringify({
        provider_id: providerId,
        data: providerId === 'pp_elavon_elavon'
          ? {
              return_url: `${window.location.origin}/api/elavon/complete`,
              cart_id: cartId,
              ...extraData,
            }
          : {},
      }),
    })
    return sessionData.payment_collection
  }

  const handleCardPay = async () => {
    const err = validate()
    if (err) { setErrorMsg(err); return }
    setStatus('loading')
    setErrorMsg('')

    try {
      const cart = await prepareCart()
      const pc = await ensurePaymentCollection(cart.id, 'pp_elavon_elavon', {
        billing_address: {
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          address_1: form.buyerAddress1.trim(),
          city: form.buyerCity.trim(),
          province: form.buyerState.trim().toUpperCase(),
          postal_code: form.buyerZip.trim(),
          phone: form.phone.trim(),
        },
        email: form.email.trim(),
      })
      const session = pc?.payment_sessions?.[0]
      const hostedUrl = session?.data?.hostedUrl as string | undefined

      if (!hostedUrl) {
        setStatus('error')
        setErrorMsg('Could not initialize payment. Please try again.')
        return
      }

      // Save cart ID so the callback can complete it
      document.cookie = `lxs_cart=${cart.id}; path=/; max-age=3600; SameSite=Lax`
      clearCart()
      window.location.href = hostedUrl
    } catch (e: any) {
      setStatus('error')
      setErrorMsg(e?.message ?? 'Network error. Please try again.')
    }
  }

  const handleWireOrder = async () => {
    const err = validate()
    if (err) { setErrorMsg(err); return }
    setStatus('loading')
    setErrorMsg('')

    try {
      const cart = await prepareCart()

      // Initiate manual payment session + complete cart → creates Medusa order
      await ensurePaymentCollection(cart.id, 'pp_system_default')
      const completeData = await medusaFetch(`/store/carts/${cart.id}/complete`, { method: 'POST' })

      if (completeData.type !== 'order') {
        setStatus('error')
        setErrorMsg(completeData.error?.message ?? 'Order could not be completed. Please try again.')
        return
      }

      const order = completeData.order

      // Send wire instructions email via existing route
      await fetch('/api/checkout/wire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          orderRef: String(order.display_id ?? order.id),
          email: form.email.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          amount: (order.total ?? 0) / 100,
          items: cartItems.map(i => ({ title: i.title, quantity: i.quantity, price: i.price })),
          fflDealerName:     form.fflDealerName.trim(),
          fflDealerAddress1: form.fflDealerAddress1.trim(),
          fflDealerCity:     form.fflDealerCity.trim(),
          fflDealerState:    form.fflDealerState.trim(),
          fflDealerZip:      form.fflDealerZip.trim(),
          fflContactName:    form.fflContactName.trim(),
          fflContactPhone:   form.fflContactPhone.trim(),
          fflContactEmail:   form.fflContactEmail.trim(),
          buyerPhone:        form.phone.trim(),
          buyerAddress1:     form.buyerAddress1.trim(),
          buyerCity:         form.buyerCity.trim(),
          buyerState:        form.buyerState.trim(),
          buyerZip:          form.buyerZip.trim(),
          notes:             form.notes.trim(),
        }),
      }).catch(() => { /* email failure non-fatal */ })

      clearCart()
      router.push(`/order-confirmation?ref=${order.display_id ?? order.id}&name=${encodeURIComponent(form.firstName.trim())}&method=wire`)
    } catch (e: any) {
      setStatus('error')
      setErrorMsg(e?.message ?? 'Network error. Please try again.')
    }
  }

  const handleSubmit = () => {
    if (paymentMethod === 'wire') handleWireOrder()
    else handleCardPay()
  }

  if (cartItems.length === 0 && status === 'idle') {
    return (
      <div style={{ background: t.bg, minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 300, color: t.text, marginBottom: '12px' }}>Your cart is empty</div>
          <Link href="/shop" style={{ fontSize: '9.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: t.gold, textDecoration: 'none', fontWeight: 500 }}>Browse Collection →</Link>
        </div>
      </div>
    )
  }

  // Totals: prefer Medusa cart values, fall back to local calculation while cart loads
  const localSubtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0) * 100 // in cents
  const subtotalCents = medusaCart?.item_subtotal ?? medusaCart?.subtotal ?? localSubtotal
  const shippingCents = medusaCart?.shipping_subtotal ?? 0
  const taxCents = medusaCart?.tax_total ?? 0
  const totalCents = medusaCart?.total ?? (subtotalCents + shippingCents + taxCents)

  const buyerStateTax = form.buyerState.trim().toUpperCase()
  const isLoading = status === 'loading'

  return (
    <>
      <style>{`
        .lxs-co-grid { display: grid; grid-template-columns: 1fr 400px; gap: 48px; align-items: start; }
        .lxs-co-sticky { position: sticky; top: 96px; }
        .lxs-co-contact { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .lxs-co-addr3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
        .lxs-co-ffl { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 14px; }
        @keyframes lxs-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 860px) {
          .lxs-co-grid { grid-template-columns: 1fr !important; }
          .lxs-co-sticky { position: static !important; }
        }
        @media (max-width: 560px) {
          .lxs-co-contact { grid-template-columns: 1fr !important; }
          .lxs-co-addr3 { grid-template-columns: 1fr !important; }
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

              <section>
                <SectionHead title="Buyer Information" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="lxs-co-contact">
                    <Field label="First Name" name="firstName" value={form.firstName} onChange={setField} required error={fieldErrors.firstName} />
                    <Field label="Last Name" name="lastName" value={form.lastName} onChange={setField} required error={fieldErrors.lastName} />
                    <Field label="Email Address" name="email" value={form.email} onChange={setField} required type="email" error={fieldErrors.email} />
                    <Field label="Phone Number" name="phone" value={form.phone} onChange={setField} required type="tel" error={fieldErrors.phone} />
                  </div>
                  <Field label="Street Address" name="buyerAddress1" value={form.buyerAddress1} onChange={setField} required error={fieldErrors.buyerAddress1} />
                  <div className="lxs-co-addr3">
                    <Field label="City" name="buyerCity" value={form.buyerCity} onChange={setField} required error={fieldErrors.buyerCity} />
                    <Field label="State" name="buyerState" value={form.buyerState} onChange={setField} required placeholder="e.g. FL" error={fieldErrors.buyerState} />
                    <Field label="ZIP Code" name="buyerZip" value={form.buyerZip} onChange={setField} required error={fieldErrors.buyerZip} />
                  </div>
                </div>
              </section>

              <section>
                <SectionHead title="FFL Transfer Dealer" />
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px 16px', background: '#fafaf8', border: `1px solid ${t.border}`, borderLeft: `2px solid ${t.gold}50`, marginBottom: '16px' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: t.gold, flexShrink: 0, marginTop: '1px' }}>
                    <path d="M7 0.5L13 4V8C13 11 10.5 13 7 14C3.5 13 1 11 1 8V4L7 0.5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                  </svg>
                  <p style={{ fontSize: '12px', fontWeight: 300, color: t.textMuted, lineHeight: 1.6, margin: 0 }}>
                    All firearms require FFL transfer. Search for your dealer below — we ship directly to them.{' '}
                    <Link href="/support#ffl" style={{ color: t.gold, textDecoration: 'none', borderBottom: `1px solid ${t.gold}50` }}>Learn more →</Link>
                  </p>
                </div>
                <FflSelector
                  selected={form.fflDealerName ? { name: form.fflDealerName, address1: form.fflDealerAddress1, city: form.fflDealerCity, state: form.fflDealerState, zip: form.fflDealerZip } : null}
                  onManualMode={active => {
                    setFflIsManual(active)
                    if (!active) {
                      setField('fflDealerName', '')
                      setField('fflDealerAddress1', '')
                      setField('fflDealerCity', '')
                      setField('fflDealerState', '')
                      setField('fflDealerZip', '')
                    }
                  }}
                  onSelect={dealer => {
                    if (dealer) {
                      setField('fflDealerName',     dealer.name)
                      setField('fflDealerAddress1', dealer.address1)
                      setField('fflDealerCity',     dealer.city)
                      setField('fflDealerState',    dealer.state)
                      setField('fflDealerZip',      dealer.zip)
                      setFflIsManual(false)
                    } else {
                      setField('fflDealerName', '')
                      setField('fflDealerAddress1', '')
                      setField('fflDealerCity', '')
                      setField('fflDealerState', '')
                      setField('fflDealerZip', '')
                      setFflIsManual(false)
                    }
                  }}
                />
                {fflIsManual && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                    <Field label="Dealer Name" name="fflDealerName" value={form.fflDealerName} onChange={setField} required error={fieldErrors.fflDealerName} placeholder="e.g. Sarasota Firearms" />
                    <Field label="Street Address" name="fflDealerAddress1" value={form.fflDealerAddress1} onChange={setField} required error={fieldErrors.fflDealerAddress1} />
                    <div className="lxs-co-addr3">
                      <Field label="City" name="fflDealerCity" value={form.fflDealerCity} onChange={setField} required error={fieldErrors.fflDealerCity} />
                      <Field label="State" name="fflDealerState" value={form.fflDealerState} onChange={setField} required error={fieldErrors.fflDealerState} placeholder="e.g. FL" />
                      <Field label="ZIP Code" name="fflDealerZip" value={form.fflDealerZip} onChange={setField} required error={fieldErrors.fflDealerZip} />
                    </div>
                    <div style={{ fontSize: '8.5px', letterSpacing: '0.16em', textTransform: 'uppercase', color: t.textDim, fontWeight: 500, paddingTop: '2px' }}>
                      Dealer Contact <span style={{ fontSize: '8px', color: t.textMuted, textTransform: 'none', letterSpacing: 'normal', fontWeight: 300 }}>— optional, helps speed up transfer</span>
                    </div>
                    <div className="lxs-co-addr3">
                      <Field label="Contact Name" name="fflContactName" value={form.fflContactName} onChange={setField} />
                      <Field label="Contact Phone" name="fflContactPhone" value={form.fflContactPhone} onChange={setField} type="tel" />
                      <Field label="Contact Email" name="fflContactEmail" value={form.fflContactEmail} onChange={setField} type="email" />
                    </div>
                  </div>
                )}
              </section>

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

            {/* ── Right: Summary ── */}
            <div className="lxs-co-sticky" style={{ background: '#fff', border: `1px solid ${t.border}`, padding: '28px' }}>
              <SectionHead title="Order Summary" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {cartItems.map(item => <CartItemRow key={item.id} item={item} />)}
              </div>

              {/* Totals — sourced from Medusa cart */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '16px', borderTop: `1px solid ${t.border}`, marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 300, color: t.textMuted }}>Subtotal</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 300, color: t.text }}>
                    {medusaCartLoading ? '—' : fmtCents(subtotalCents)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 300, color: t.textMuted }}>Shipping</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 300, color: t.text }}>
                    {medusaCartLoading ? '—' : shippingCents > 0 ? fmtCents(shippingCents) : shippingOptionId ? 'Included' : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 300, color: t.textMuted }}>Tax</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 300, color: t.text }}>
                    {medusaCartLoading
                      ? '—'
                      : taxCents > 0
                      ? fmtCents(taxCents)
                      : buyerStateTax
                      ? 'None'
                      : 'Enter address'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 0', borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, marginBottom: '24px' }}>
                <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '16px', fontWeight: 400, color: t.text }}>Total</span>
                <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 300, color: t.text }}>
                  {medusaCartLoading ? '…' : fmtCents(totalCents)}
                </span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '8.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: t.textDim, fontWeight: 500, marginBottom: '12px', fontFamily: 'var(--font-inter)' }}>Payment Method</div>
                <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
              </div>

              {paymentMethod === 'card' && (
                <div style={{ padding: '11px 13px', background: '#fafaf8', border: `1px solid ${t.border}`, marginBottom: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 300, color: t.textMuted, lineHeight: 1.55, margin: 0 }}>
                    You will be redirected to Elavon&apos;s secure payment page to enter your card and billing details. The buyer information above is for FFL transfer records and will not be re-used by Elavon.
                  </p>
                </div>
              )}

              {paymentMethod === 'wire' && (
                <div style={{ padding: '11px 13px', background: '#fafaf8', border: `1px solid ${t.border}`, borderLeft: `2px solid ${t.gold}50`, marginBottom: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 300, color: t.textMuted, lineHeight: 1.55, margin: 0 }}>
                    Wire instructions will be emailed immediately. Order held <strong>5 business days</strong> pending receipt of funds.
                  </p>
                </div>
              )}

              {errorMsg && (
                <div style={{ padding: '12px 14px', background: '#fff5f5', border: '1px solid #fcc', marginBottom: '16px' }}>
                  <p style={{ fontSize: '11.5px', color: '#c0392b', margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-inter)' }}>{errorMsg}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isLoading || medusaCartLoading}
                style={{
                  width: '100%', padding: '16px', background: isLoading ? t.gold + 'aa' : t.gold,
                  border: 'none', cursor: isLoading || medusaCartLoading ? 'not-allowed' : 'pointer',
                  fontSize: '9.5px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500,
                  color: '#fff', fontFamily: 'var(--font-inter)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '10px', transition: 'opacity 0.15s',
                }}
              >
                {isLoading && (
                  <span style={{ width: '14px', height: '14px', border: '1.5px solid #fff4', borderTopColor: '#fff', borderRadius: '50%', animation: 'lxs-spin 0.8s linear infinite', display: 'inline-block' }} />
                )}
                {medusaCartLoading
                  ? 'Loading...'
                  : isLoading
                  ? 'Processing...'
                  : paymentMethod === 'wire'
                  ? 'Place Order — Wire / Check'
                  : 'Continue to Payment'}
              </button>

              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="5" width="10" height="6.5" rx="1" stroke="#999" strokeWidth="1"/><path d="M3.5 5V3.5a2.5 2.5 0 0 1 5 0V5" stroke="#999" strokeWidth="1"/></svg>
                <span style={{ fontSize: '9.5px', color: t.textDim, fontWeight: 300 }}>SSL Encrypted · TLS 1.3</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
