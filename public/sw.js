// Service Worker for Luxus Collection PWA
// Strategy:
//   - Navigation (HTML pages): network-first, fall back to /offline
//   - Static assets (_next/static): cache-first, network fallback
//   - Everything else: network-only (API calls, dynamic data)

const CACHE_NAME = 'luxus-v1'
const OFFLINE_URL = '/offline'
const STATIC_ASSETS = [
  OFFLINE_URL,
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // Cache-first for Next.js static chunks (immutable, fingerprinted filenames)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return res
        })
      })
    )
    return
  }

  // Network-first for navigation (HTML page requests)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((res) => res ?? new Response('Offline', { status: 503 }))
      )
    )
    return
  }

  // Network-only for everything else (API calls, dynamic media)
})
