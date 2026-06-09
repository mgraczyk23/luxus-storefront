'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'

export default function OrderConfirmationPage() {
  const { t } = useTheme()
  const params = useSearchParams()
  const ref = params.get('ref') ?? ''
  const name = params.get('name') ?? ''

  return (
    <div style={{ background: t.bg, minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ maxWidth: '560px', width: '100%', textAlign: 'center' }}>

        <div style={{ width: '56px', height: '56px', border: `1px solid ${t.gold}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', borderRadius: '50%' }}>
          <svg width="22" height="18" viewBox="0 0 22 18" fill="none" style={{ color: t.gold }}>
            <path d="M1 9L8 16L21 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div style={{ fontSize: '9px', letterSpacing: '0.26em', textTransform: 'uppercase', color: t.gold, fontWeight: 500, marginBottom: '14px', fontFamily: 'var(--font-inter)' }}>
          Order Confirmed
        </div>

        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 300, color: t.text, margin: '0 0 16px', letterSpacing: '0.01em', lineHeight: 1.2 }}>
          {name ? `Thank you, ${name}.` : 'Thank you for your order.'}
        </h1>

        <p style={{ fontSize: '14px', fontWeight: 300, color: t.textMuted, lineHeight: 1.7, margin: '0 0 28px', fontFamily: 'var(--font-inter)' }}>
          Your payment has been approved and your order is confirmed. We will contact you at the email you provided within one business day to arrange FFL transfer and shipping details.
        </p>

        {ref && (
          <div style={{ padding: '16px 20px', background: '#fafaf8', border: `1px solid ${t.border}`, marginBottom: '32px', display: 'inline-block' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: t.textDim, marginBottom: '5px', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>Order Reference</div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '15px', fontWeight: 500, color: t.text, letterSpacing: '0.06em' }}>{ref}</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', background: '#fff', border: `1px solid ${t.border}`, marginBottom: '36px', textAlign: 'left' }}>
          {[
            ['FFL Transfer', 'We will ship your firearm directly to your FFL dealer. They will call you when it arrives for pickup and transfer paperwork.'],
            ['Questions?', 'Reply to your order confirmation email or contact us at sales@luxus-collection.com with your order reference number.'],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: t.gold, flexShrink: 0, marginTop: '2px' }}><path d="M7 0.5L13 4V8C13 11 10.5 13 7 14C3.5 13 1 11 1 8V4L7 0.5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/></svg>
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: t.text, fontWeight: 500, marginBottom: '3px', fontFamily: 'var(--font-inter)' }}>{title}</div>
                <p style={{ fontSize: '12px', fontWeight: 300, color: t.textMuted, lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-inter)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
