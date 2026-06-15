'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0a0a0a', fontFamily: "'Inter',sans-serif", minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '40px 24px', maxWidth: 480 }}>
          <p style={{ fontSize: '9px', letterSpacing: '0.26em', textTransform: 'uppercase', color: '#c09530', margin: '0 0 24px' }}>
            Luxus Collection
          </p>
          <h1 style={{ fontSize: '22px', fontWeight: 400, color: '#ededed', margin: '0 0 12px', fontFamily: 'Georgia,serif' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '13px', color: '#9a9a9a', margin: '0 0 32px', lineHeight: 1.6 }}>
            An unexpected error occurred. Our team has been notified. Please try refreshing the page, or contact us if the issue persists.
          </p>
          <button
            onClick={reset}
            style={{
              background: 'transparent',
              border: '1px solid #c09530',
              color: '#c09530',
              fontSize: '10px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              padding: '12px 28px',
              cursor: 'pointer',
              fontFamily: "'Inter',sans-serif",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
