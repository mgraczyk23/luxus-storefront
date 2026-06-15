import * as Sentry from '@sentry/nextjs'

export function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.2,
    debug: false,
    ignoreErrors: [
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'AbortError',
    ],
    beforeSend(event, hint) {
      const err = hint?.originalException
      if (err instanceof Error) {
        // undici (Node.js fetch): connection terminated by remote server — transient, handled
        if (err.message === 'terminated') return null
        // undici: TLS socket closed before response complete — same root cause
        if (err.message === 'other side closed') return null
        if (err.constructor?.name === 'SocketError') return null
      }
      return event
    },
  })
}

export const onRequestError = Sentry.captureRequestError
