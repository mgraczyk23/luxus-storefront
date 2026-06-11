'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { useCart } from '@/context/CartContext'

export default function OrderConfirmationPage() {
  const { t } = useTheme()
  const { clearCart } = useCart()
  const params = useSearchParams()
  const ref = params.get('ref') ?? ''
  const name = params.get('name') ?? ''
  const method = params.get('method') ?? 'card'
  const isWire = method === 'wire'
  const hasWarn = params.get('warn') === '1'

  // Clear the cart now that payment is confirmed. Wire orders clear it in CheckoutPage
  // before navigating here; card orders keep the cart alive through the Elavon redirect
  // so the customer can recover it if they cancel — we clear it here on success.
  useEffect(() => {
    if (!isWire) clearCart()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ background: t.bg, minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ maxWidth: '580px', width: '100%', textAlign: 'center' }}>

        <div style={{ width: '56px', height: '56px', border: `1px solid ${t.gold}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', borderRadius: '50%' }}>
          {isWire ? (
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none" style={{ color: t.gold }}>
              <rect x="1" y="1" width="20" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M1 6H21" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="3" y="9.5" width="5" height="2" rx="0.5" fill="currentColor"/>
            </svg>
          ) : (
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none" style={{ color: t.gold }}>
              <path d="M1 9L8 16L21 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        <div style={{ fontSize: '9px', letterSpacing: '0.26em', textTransform: 'uppercase', color: t.gold, fontWeight: 500, marginBottom: '14px', fontFamily: 'var(--font-inter)' }}>
          {isWire ? 'Order Received' : 'Order Confirmed'}
        </div>

        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 300, color: t.text, margin: '0 0 16px', letterSpacing: '0.01em', lineHeight: 1.2 }}>
          {name ? `Thank you, ${name}.` : 'Thank you for your order.'}
        </h1>

        <p style={{ fontSize: '14px', fontWeight: 300, color: t.textMuted, lineHeight: 1.7, margin: '0 0 28px', fontFamily: 'var(--font-inter)' }}>
          {isWire
            ? 'Your order has been received. Wire transfer instructions have been sent to your email. Your order is held for 5 business days pending receipt of funds.'
            : 'Your payment has been approved and your order is confirmed. We will contact you within one business day to arrange FFL transfer and shipping details.'}
        </p>

        {hasWarn && (
          <div style={{ padding: '14px 18px', background: '#fff8f0', border: '1px solid #f0c080', marginBottom: '20px', textAlign: 'left' }}>
            <p style={{ fontSize: '12px', color: '#8b5e00', lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-inter)' }}>
              Your payment was approved — please save your reference below. Our team will confirm your order by email within one business day. If you don&apos;t hear from us, contact{' '}
              <a href="mailto:sales@luxus-collection.com" style={{ color: '#8b5e00' }}>sales@luxus-collection.com</a>.
            </p>
          </div>
        )}

        {ref && (
          <div style={{ padding: '16px 20px', background: '#fafaf8', border: `1px solid ${t.border}`, marginBottom: '28px', display: 'inline-block' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: t.textDim, marginBottom: '5px', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>Order Reference</div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '15px', fontWeight: 500, color: t.text, letterSpacing: '0.06em' }}>{ref}</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', padding: '0', marginBottom: '36px', textAlign: 'left' }}>
          {(isWire ? [
            ['Wire Instructions Sent', 'Check your email for complete wire transfer instructions including bank details and your order reference number.'],
            ['Include Reference in Memo', `When wiring funds, include your order reference (${ref}) in the wire memo field so we can match your payment.`],
            ['FFL Transfer', 'Once payment is confirmed, your firearm will ship directly to your FFL dealer. They will contact you for pickup.'],
          ] : [
            ['FFL Transfer', 'We will ship your firearm directly to your FFL dealer. They will call you when it arrives for pickup and transfer paperwork.'],
            ['Confirmation Email Sent', 'A confirmation with your order details has been sent to the email you provided.'],
            ['Questions?', `Contact us at sales@luxus-collection.com with your order reference ${ref}.`],
          ]).map(([title, desc], i, arr) => (
            <div key={title} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px', background: '#fff', border: `1px solid ${t.border}`, borderTop: i > 0 ? 'none' : `1px solid ${t.border}` }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: t.gold, flexShrink: 0, marginTop: '2px' }}>
                <path d="M7 0.5L13 4V8C13 11 10.5 13 7 14C3.5 13 1 11 1 8V4L7 0.5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
              </svg>
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: t.text, fontWeight: 500, marginBottom: '4px', fontFamily: 'var(--font-inter)' }}>{title}</div>
                <p style={{ fontSize: '12px', fontWeight: 300, color: t.textMuted, lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-inter)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/shop" style={{ padding: '13px 28px', background: t.gold, color: '#fff', textDecoration: 'none', fontSize: '9.5px', letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', fontWeight: 600 }}>
            Continue Shopping
          </Link>
          <Link href="/contact" style={{ padding: '13px 28px', background: 'none', color: t.text, textDecoration: 'none', fontSize: '9.5px', letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', fontWeight: 500, border: `1px solid ${t.border}` }}>
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}
