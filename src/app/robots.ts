import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/account/',
          '/checkout/',
          '/invoice/',
          '/order-confirmation/',
          '/offer/',
          '/auth/',
          '/api/',
        ],
      },
      // Explicitly allow AI crawlers to index public content
      { userAgent: 'GPTBot',       allow: '/' },
      { userAgent: 'ClaudeBot',    allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Googlebot',    allow: '/' },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
