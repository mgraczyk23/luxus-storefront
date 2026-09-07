// Google Tag Manager dataLayer helper — client-side only.
// The dataLayer array is created by GTM's own bootstrap snippet in
// layout.tsx (loaded unconditionally — GTM is just a script loader; it sets
// no cookies itself). That snippet must stay the standard inline
// dataLayer.push({'gtm.start':...,event:'gtm.js'}) form, not a bare
// <script src> — GTM's "All Pages" trigger (and everything else in the
// container) fires off that 'gtm.js' dataLayer event, so without it no tag
// ever runs even though gtm.js itself loads fine. See layout.tsx's comment.
// If the bootstrap snippet hasn't run yet, pushes here are silently dropped
// rather than creating a stray global.

export function trackEvent(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  const w = window as unknown as { dataLayer?: Record<string, unknown>[] }
  if (!w.dataLayer) return
  w.dataLayer.push({ event, ...params })
}

// Fires `event` at most once per mounted ref — use for form_start events,
// which should only report the first interaction, not every field focus.
export function trackOnce(ref: { current: boolean }, event: string, params?: Record<string, unknown>) {
  if (ref.current) return
  ref.current = true
  trackEvent(event, params)
}
