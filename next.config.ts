import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/consignment', destination: '/sell-your-gun', permanent: true },
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
  // Source map upload requires SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT.
  // Disabled until those are added to Vercel env vars.
  sourcemaps: { disable: true },
  // Suppress Sentry build output in non-CI environments
  silent: true,
  // Auto-instrument App Router server components, route handlers, and middleware
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,
  autoInstrumentAppDirectory: true,
})
