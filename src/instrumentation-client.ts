import * as Sentry from '@sentry/nextjs'
import '../sentry.client.config'

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Safari (iOS + macOS) shows a privacy notice when a service worker accesses the
  // Cache API under Advanced Privacy Protection or Private Browsing. Skip registration
  // there — Safari doesn't support the PWA install prompt anyway.
  const ua = navigator.userAgent
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgA/.test(ua)
  if (!isSafari) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
    })
  }
}
