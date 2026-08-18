// Google Tag Manager dataLayer helper — client-side only.
// The dataLayer array itself is created by the inline GTM snippet in
// layout.tsx, which loads unconditionally (GTM is just a script loader; it
// sets no cookies itself). If that snippet hasn't run for any reason,
// pushes are silently dropped rather than creating a stray global.

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
