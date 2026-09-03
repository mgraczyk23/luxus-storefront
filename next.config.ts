import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Inlines page CSS into <style> tags in <head> instead of a
    // render-blocking <link> — PageSpeed flagged our CSS chunk as
    // render-blocking (~110ms). This codebase styles almost everything via
    // inline style={{}} objects (see the CSP comment below), so the actual
    // compiled CSS file is small (~10KB) — squarely the case Next's own docs
    // recommend this for. Trade-off: returning visitors re-download that
    // ~10KB with every page instead of hitting a cached stylesheet, but
    // pages here are already cached as full static HTML (generateStaticParams
    // + revalidate: false), so there's no separate CSS request being saved
    // for them today anyway. Production-build-only; has no effect in `next dev`.
    inlineCss: true,
  },
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
      // GA4's own /proxy/ga/* rewrites were removed — GTM already loads and
      // configures GA4 itself (via its own GA4 Configuration tag), so the
      // separate direct gtag.js path in ConsentBanner.tsx was a redundant,
      // unproxied-by-GTM second initialization of the same property.

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
        // Static brand assets in /public — favicon, touch icon, PWA icons,
        // manifest, header logo. These only change via a code deploy (not
        // CMS-editable), so a long cache is safe; `must-revalidate` (no
        // `immutable`) means a browser still checks back once the year is up
        // instead of never revisiting the file at all. PageSpeed flagged all
        // of these as serving with no real cache lifetime — Vercel's default
        // for anything under /public is `max-age=0` since, unlike the hashed
        // /_next/static/* filenames, it can't assume the content at a stable
        // URL like this never changes.
        source: '/:path(favicon\\.ico|apple-touch-icon\\.png|icon-192\\.png|icon-512\\.png|logo\\.webp|manifest\\.webmanifest)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, must-revalidate' },
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
    // Vercel's default is 4 hours — PageSpeed flags that as an inefficient
    // cache lifetime for images that don't change on every request. Went
    // with 7 days rather than matching the /public assets' 1-year value
    // above: those are code-deployed and effectively permanent, but most
    // images through this optimizer are CMS-managed product/brand photos
    // that can be swapped by a non-developer at any time, and Payload's S3
    // upload can reuse the same filename/URL on a re-upload — a much longer
    // cache risks serving a stale photo for a long stretch after a real
    // update. 7 days is a meaningful improvement over 4 hours while keeping
    // that risk small.
    minimumCacheTTL: 604800,
    // Next's defaults are 8 deviceSizes + 8 imageSizes (16 total buckets).
    // Every distinct (source image, width, quality) combination is
    // transformed lazily on first request and cached after that — confirmed
    // live: an uncached size took ~400ms+ for a bare HEAD request (real GETs
    // under real network conditions add much more), a cached one ~70ms. With
    // 500+ products × several photos each × every one of those buckets, most
    // exact-width requests are cache misses far more often than they should
    // be. Trimmed to the widths this codebase's own `sizes` props actually
    // use (audited via grep across every next/image usage) — collapses
    // near-duplicate buckets (750/828, 2048/1920) so more real requests
    // converge on the same cached variant, at the cost of occasionally
    // serving a slightly larger image than the exact viewport needs.
    deviceSizes: [640, 828, 1080, 1200, 1920, 3840],
    // 32 is required — the CMS favicon URL in layout.tsx hardcodes `w=32`
    // directly (not through <Image>), and the optimizer 400s any width not
    // in this list.
    imageSizes: [32, 64, 96, 128, 256, 384],
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
