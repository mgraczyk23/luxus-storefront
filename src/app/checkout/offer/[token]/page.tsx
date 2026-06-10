import { notFound } from 'next/navigation'
import OfferCheckoutPage from './OfferCheckoutPage'

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'https://api.luxus-collection.com'
const PK         = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

export default async function Page({ params }: { params: { token: string } }) {
  const res = await fetch(`${MEDUSA_URL}/store/offers/redeem/${params.token}`, {
    headers: { 'x-publishable-api-key': PK },
    cache: 'no-store',
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const message = (err as any).error ?? 'This checkout link is invalid or has expired.'
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-inter)', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px' }}>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 400, color: '#1a1a1a', marginBottom: '14px' }}>
            Link Unavailable
          </div>
          <p style={{ fontSize: '14px', fontWeight: 300, color: '#707076', lineHeight: 1.8, marginBottom: '24px' }}>{message}</p>
          <p style={{ fontSize: '12px', color: '#9e9994' }}>
            Please contact us at{' '}
            <a href="mailto:sales@luxus-collection.com" style={{ color: '#c9a96e' }}>sales@luxus-collection.com</a>{' '}
            and we will be happy to assist.
          </p>
        </div>
      </div>
    )
  }

  const { offer } = await res.json()
  return <OfferCheckoutPage offer={offer} checkoutToken={params.token} />
}
