import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
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
      // Klaviyo: API calls (script is handled by Route Handler at /proxy/kl-script)
      { source: '/proxy/kl/:path*', destination: 'https://a.klaviyo.com/:path*' },
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
