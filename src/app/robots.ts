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
          '/cart/',
          '/checkout/',
          '/invoice/',
          '/order-confirmation/',
          '/offer/',
          '/auth/',
          '/api/',
        ],
      },
      // AI crawlers: same disallows as *, explicit allow ensures they aren't blocked by blanket filters
      { userAgent: 'GPTBot',        allow: '/', disallow: ['/account/', '/cart/', '/checkout/', '/invoice/', '/order-confirmation/', '/offer/', '/auth/', '/api/'] },
      { userAgent: 'ClaudeBot',     allow: '/', disallow: ['/account/', '/cart/', '/checkout/', '/invoice/', '/order-confirmation/', '/offer/', '/auth/', '/api/'] },
      { userAgent: 'PerplexityBot', allow: '/', disallow: ['/account/', '/cart/', '/checkout/', '/invoice/', '/order-confirmation/', '/offer/', '/auth/', '/api/'] },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
