import * as Sentry from '@sentry/nextjs'
import '../sentry.client.config'

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const ua = navigator.userAgent
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgA/.test(ua)
  if (isSafari) {
    // Unregister any previously installed service workers on Safari. The SW
    // accesses the Cache API which triggers iOS "advanced privacy protections"
    // notice even in regular browsing. Actively unregister so existing installs
    // are cleared — skipping registration alone leaves stale SWs running.
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister())
    })
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
    })
  }
}
