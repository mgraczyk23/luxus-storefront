'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/gtm'

// US toll-free area codes — used to tell a toll-free tel: link apart from a
// local one without needing site-settings context inside a global listener.
const TOLL_FREE_PREFIXES = ['800', '833', '844', '855', '866', '877', '888']

// Tracks every tel: and mailto: click sitewide via a single delegated
// listener, instead of adding onClick handlers to every anchor in Footer,
// ContactPage, ConsignmentPage, ProductDetailPage, etc.
export default function GtmLinkTracker() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!link) return
      const href = link.getAttribute('href') ?? ''

      if (href.startsWith('tel:')) {
        const digits = href.slice(4).replace(/\D/g, '')
        trackEvent('phone_click', {
          phone_number: digits,
          phone_type: TOLL_FREE_PREFIXES.includes(digits.slice(-10, -7)) ? 'toll_free' : 'local',
        })
        return
      }

      if (href.startsWith('mailto:')) {
        const address = href.slice(7).split('?')[0]
        trackEvent('email_click', {
          email: address,
          mailbox: address.split('@')[0] || undefined,
        })
      }
    }

    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return null
}
