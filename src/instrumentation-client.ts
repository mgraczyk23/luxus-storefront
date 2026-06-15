import * as Sentry from '@sentry/nextjs'
import '../sentry.client.config'

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
  })
}
