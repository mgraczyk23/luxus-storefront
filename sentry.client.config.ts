import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,
  // Session Replay removed — uses IndexedDB which triggers Safari's privacy notice.
  // Re-add once we confirm it can be initialized lazily after user consent.
  ignoreErrors: [
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    'AbortError',
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    // ProgressEvent(type=error) fires when a third-party script (e.g. Klaviyo)
    // fails to load — common in TikTok/Instagram in-app browsers that block
    // external marketing scripts. Not an app error, not actionable.
    /ProgressEvent/,
    "Event `ProgressEvent` (type=error)",
  ],
  debug: false,
})
