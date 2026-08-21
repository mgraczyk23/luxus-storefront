import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/consignment', destination: '/sell-your-gun', permanent: true },
    ]
  },
  async rewrites() {
    return [
      // ── First-party analytics proxy ──────────────────────────────────────────
      // Routes analytics through our domain so Safari ITP doesn't flag them as
      // cross-site trackers. Browser only ever sees requests to luxus-collection.com.

      // GA4: script (gtag.js served from our domain)
      { source: '/proxy/ga/gtag.js', destination: 'https://www.googletagmanager.com/gtag/js' },
      // GA4: event collection — transport_url set to origin + '/proxy/ga'
      { source: '/proxy/ga/g/collect', destination: 'https://www.google-analytics.com/g/collect' },
      { source: '/proxy/ga/j/collect', destination: 'https://www.google-analytics.com/j/collect' },
      // Klaviyo: API calls (/proxy/kl-a/*) and static JS bundles (/proxy/kl-s/*)
      // are handled by Route Handlers so their content can be rewritten.
      // This rewrite is a fallback for any paths the handlers don't cover.
      { source: '/proxy/kl-a/:path*', destination: 'https://a.klaviyo.com/:path*' },
      // PostHog: static assets (array.js) + event ingestion
      { source: '/proxy/ph/static/:path*', destination: 'https://us-assets.i.posthog.com/static/:path*' },
      { source: '/proxy/ph/:path*', destination: 'https://us.i.posthog.com/:path*' },
    ]
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        // Baseline security headers on every route, unchanged.
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
          // Isolates this origin's top-level window from cross-origin popups
          // it opens. Verified safe against this codebase: Elavon's checkout
          // lightbox (PayWithConverge.open()) is an iframe overlay from its
          // own SDK, not a window.open() popup, and the only window.open()
          // call in the app (product print sheet) is same-origin — neither
          // relies on cross-origin window.opener/postMessage access.
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          // Report-Only first pass — monitors and logs violations to the
          // browser console without blocking anything. Origins below are
          // sourced directly from this codebase (GTM/Klaviyo script tags in
          // layout.tsx, Elavon Converge JS in CheckoutPage.tsx, Sentry DSN in
          // sentry.client.config.ts, Google Maps embed in ContactPage.tsx,
          // and next.config.ts's own images.remotePatterns) — not guessed.
          // GA and PostHog need no external entries: both are proxied
          // same-origin via the /proxy/* rewrites above. Fonts are self-hosted
          // via next/font/google, so no external font-src is needed either.
          // style-src keeps 'unsafe-inline' — this codebase styles almost
          // everything via inline style={{}} objects, and nonces aren't
          // practical here without a much larger refactor than this pass
          // covers. Do not switch this to enforcing Content-Security-Policy
          // without reviewing violation reports first (Elavon's payment
          // lightbox in particular needs to be verified against this list by
          // actually stepping through checkout, not just by static review).
          { key: 'Content-Security-Policy-Report-Only', value: [
            "default-src 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            "script-src 'self' www.googletagmanager.com static.klaviyo.com api.convergepay.com api.demo.convergepay.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' *.amazonaws.com api.luxus-collection.com res.cloudinary.com *.gunbroker.com pics.gunbroker.com",
            "font-src 'self'",
            "connect-src 'self' o4511547309817856.ingest.us.sentry.io a.klaviyo.com",
            "frame-src maps.google.com www.googletagmanager.com api.convergepay.com api.demo.convergepay.com",
            "frame-ancestors 'self'",
            "form-action 'self'",
          ].join('; ') },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "api.luxus-collection.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**.gunbroker.com",
      },
      {
        protocol: "https",
        hostname: "pics.gunbroker.com",
      },
    ],
  },
}

export default withSentryConfig(nextConfig, {
  org: "luxus-collection",
  project: "javascript-nextjs",
  // SENTRY_AUTH_TOKEN must be set in the build environment (Vercel env vars)
  // Source maps are uploaded at build time and then deleted from the output
  // so they are never publicly served.
  sourcemaps: {
    filesToDeleteAfterUpload: [".next/static/**/*.map"],
  },
  silent: true,
  webpack: {
    autoInstrumentServerFunctions: true,
    autoInstrumentMiddleware: true,
    autoInstrumentAppDirectory: true,
  },
})
