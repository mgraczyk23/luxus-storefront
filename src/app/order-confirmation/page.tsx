import type { Metadata } from 'next'
import { Suspense } from 'react'
import OrderConfirmationPage from './OrderConfirmationPage'

export const metadata: Metadata = {
  title: 'Order Confirmed — Luxus Collection',
  description: 'Your order has been confirmed.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <Suspense>
      <OrderConfirmationPage />
    </Suspense>
  )
}
