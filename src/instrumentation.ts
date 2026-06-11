import * as Sentry from '@sentry/nextjs'

export function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    // Only log actual errors — suppress noisy debug output in production
    debug: false,
    // Ignore transient network errors that aren't actionable
    ignoreErrors: [
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'AbortError',
    ],
  })
}

export const onRequestError = Sentry.captureRequestError
