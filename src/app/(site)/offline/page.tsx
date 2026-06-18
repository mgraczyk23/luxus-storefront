import type { Metadata } from 'next'
import RetryButton from './RetryButton'

export const metadata: Metadata = {
  title: 'Offline | Luxus Collection',
  robots: 'noindex, nofollow',
}

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      padding: '48px 24px',
      textAlign: 'center',
    }}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="23" stroke="#c09530" strokeWidth="1.5"/>
        <path d="M12 36L36 12" stroke="#c09530" strokeWidth="1.5"/>
        <path d="M8 20C10.5 14 16.5 10 24 10C28.5 10 32.5 11.8 35.5 14.5" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 26C15.5 23 19.5 21 24 21C26.5 21 28.8 21.8 30.5 23.2" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="24" cy="33" r="2.5" fill="#888"/>
      </svg>

      <div>
        <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 500, color: '#c09530', marginBottom: 8 }}>
          You&apos;re Offline
        </p>
        <p style={{ fontSize: '13px', color: '#888', letterSpacing: '0.04em', maxWidth: 320 }}>
          Please check your connection and try again. Your browsing history is still available from your last visit.
        </p>
      </div>

      <RetryButton />
    </div>
  )
}
