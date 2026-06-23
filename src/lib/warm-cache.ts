// Pages to pre-warm for each revalidation tag.
// Dynamic tag prefixes (brand-, post-, etc.) warm their parent listing page.
// Individual dynamic pages self-warm on first visit after that.
export const TAG_PAGES: Record<string, string[]> = {
  // Medusa product data
  "products":          ["/shop", "/", "/shop/modern-firearms", "/featured"],

  // Payload globals used on every page or the home page
  "site-settings":     ["/"],
  "hero-slides":       ["/"],
  "shop-tile-images":  ["/"],

  // Payload content pages
  "posts":             ["/articles", "/"],
  "featured-page":     ["/featured"],
  "brands":            ["/shop/brands", "/"],
  "faq":               ["/faq"],
  "about-page":        ["/about"],
  "consignment-page":  ["/sell-your-gun"],
  "contact-page":      ["/contact"],
  "support-page":      ["/support"],
  "policy-shipping":   ["/shipping"],
  "policy-privacy":    ["/privacy"],
  "policy-terms":      ["/terms"],
  "resource-pages":    ["/resources-on-guns"],

  // Page SEO global — affects metadata on all main pages
  "page-seo":          ["/", "/shop", "/about", "/articles", "/contact", "/support", "/faq", "/sell-your-gun", "/featured", "/shop/brands"],

  // Internal link engine — rebuilds when CMS entries, products, or brands change
  "internal-links":    ["/articles"],

  // Dynamic tag prefixes — warm the parent listing
  "brand-":            ["/shop/brands"],
  "resource-brand-":   ["/resources-on-guns"],
  "resource-page-":    ["/resources-on-guns"],
  "post-":             ["/articles"],
}

const DYNAMIC_PREFIXES = Object.keys(TAG_PAGES).filter(k => k.endsWith("-"))

export async function warmCache(tag: string): Promise<void> {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://luxus-collection.com"

  let pages: string[] = TAG_PAGES[tag] ?? []
  if (!pages.length) {
    for (const prefix of DYNAMIC_PREFIXES) {
      if (tag.startsWith(prefix)) {
        pages = TAG_PAGES[prefix] ?? []
        break
      }
    }
  }

  if (!pages.length) return

  await Promise.allSettled(
    pages.map(path => fetch(`${origin}${path}`, { cache: "no-store" }))
  )
}
