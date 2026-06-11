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
