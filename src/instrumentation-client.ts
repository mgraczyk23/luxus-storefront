import * as Sentry from '@sentry/nextjs'

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    debug: false,
    ignoreErrors: [
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'AbortError',
      // Browser extension noise
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
  })
}

// Captures client-side navigations as Sentry spans for performance tracing
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
