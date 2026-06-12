import type { LexNode, LexInline } from './payload'
import { getPosts } from './payload'

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'https://api.luxus-collection.com'
const PK      = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''
const PAYLOAD_URL = process.env.PAYLOAD_CMS_URL ?? 'https://api.luxus-collection.com/cms'

export interface LinkEntry {
  keyword: string
  url: string
  priority: number
}

// ── Attribute helpers ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractAttrMap(p: any): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const av of (p.attribute_values ?? [])) {
    const slug: string | undefined = av.attribute_type?.slug
    if (!slug || av.value == null) continue
    const val = String(av.value).trim()
    if (!val) continue
    if (!map[slug]) map[slug] = []
    if (!map[slug].includes(val)) map[slug].push(val)
  }
  return map
}

// ── Source fetchers ────────────────────────────────────────────────────────────

async function fetchManualLinks(): Promise<LinkEntry[]> {
  try {
    const res = await fetch(
      `${PAYLOAD_URL}/api/internal-links?where[enabled][equals]=true&limit=500&depth=0`,
      { next: { revalidate: false, tags: ['internal-links'] } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.docs ?? []).map((d: Record<string, unknown>) => ({
      keyword: String(d.keyword ?? ''),
      url:     String(d.url ?? ''),
      priority: Number(d.priority ?? 10),
    })).filter((e: LinkEntry) => e.keyword && e.url)
  } catch { return [] }
}

// Article tags → article pages (priority 70 — real editorial content, highest value)
// Most-recently-published article wins when multiple share the same tag.
async function fetchArticleTagLinks(): Promise<LinkEntry[]> {
  try {
    const result = await getPosts({ limit: 500, noContent: true })
    const entries: LinkEntry[] = []
    for (const post of result.docs) {
      for (const t of (post.tags ?? [])) {
        const tag = String(t.tag ?? '').trim()
        if (tag.length >= 3) {
          entries.push({ keyword: tag, url: `/article/${post.slug}`, priority: 70 })
        }
      }
    }
    return entries
  } catch { return [] }
}

// Product attributes → product pages
// Generates brand+model compound keywords (priority 60) and model-only (priority 45).
// First product in API order wins when multiple share the same compound or model.
async function fetchProductAttributeLinks(): Promise<LinkEntry[]> {
  const all: LinkEntry[] = []
  let offset = 0
  const limit = 250
  try {
    for (;;) {
      const res = await fetch(
        `${BACKEND}/store/products?limit=${limit}&offset=${offset}&fields=id,handle,*attribute_values,*attribute_values.attribute_type`,
        {
          headers: { 'x-publishable-api-key': PK },
          next: { revalidate: false, tags: ['products'] },
        }
      )
      if (!res.ok) break
      const data = await res.json()
      const products: Record<string, unknown>[] = data.products ?? []

      for (const p of products) {
        if (!p.handle) continue
        const url     = `/product/${p.handle as string}`
        const attrMap = extractAttrMap(p)
        const brands  = attrMap['brand'] ?? []
        const models  = attrMap['model'] ?? []

        // "Colt Single Action Army", "SIG Sauer P320" — stronger SEO signal
        for (const brand of brands) {
          for (const model of models) {
            const compound = `${brand} ${model}`.trim()
            if (compound.length >= 4) all.push({ keyword: compound, url, priority: 60 })
          }
        }

        // "Single Action Army", "P320", "1911" — fallback when compound doesn't appear verbatim
        for (const model of models) {
          if (model.length >= 3) all.push({ keyword: model, url, priority: 45 })
        }
      }

      if (products.length < limit) break
      offset += limit
    }
  } catch { /* return whatever was collected */ }
  return all
}

// Brand name → /brand/[slug] hub page (priority 50)
async function fetchBrandLinks(): Promise<LinkEntry[]> {
  try {
    const res = await fetch(
      `${PAYLOAD_URL}/api/brands?limit=200&depth=0`,
      { next: { revalidate: false, tags: ['brands'] } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.docs ?? [])
      .filter((b: Record<string, unknown>) => b.name && b.slug)
      .map((b: Record<string, unknown>) => ({
        keyword: String(b.name),
        url:     `/brand/${b.slug}`,
        priority: 50,
      }))
  } catch { return [] }
}

// Category name → /category/[handle] page (priority 40)
async function fetchCategoryLinks(): Promise<LinkEntry[]> {
  try {
    const res = await fetch(
      `${BACKEND}/store/product-categories?limit=100&fields=id,name,handle`,
      {
        headers: { 'x-publishable-api-key': PK },
        next: { revalidate: false, tags: ['products'] },
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.product_categories ?? [])
      .filter((c: Record<string, unknown>) => c.name && c.handle)
      .map((c: Record<string, unknown>) => ({
        keyword: String(c.name),
        url:     `/category/${c.handle}`,
        priority: 40,
      }))
  } catch { return [] }
}

// ── Dictionary builder ─────────────────────────────────────────────────────────
// Priority order for same-keyword conflicts:
//   manual overrides → article tags → product attributes → brand pages → category pages

export async function getLinkDictionary(): Promise<LinkEntry[]> {
  const [manual, articleTags, productAttrs, brands, cats] = await Promise.all([
    fetchManualLinks(),
    fetchArticleTagLinks(),
    fetchProductAttributeLinks(),
    fetchBrandLinks(),
    fetchCategoryLinks(),
  ])

  const seen     = new Set<string>()
  const combined: LinkEntry[] = []
  for (const entry of [...manual, ...articleTags, ...productAttrs, ...brands, ...cats]) {
    const key = entry.keyword.toLowerCase()
    if (!seen.has(key)) { seen.add(key); combined.push(entry) }
  }
  return combined
}

// ── AST transformer ────────────────────────────────────────────────────────────

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function linkifyChildrenTracked(
  children: LexInline[],
  entries:  LinkEntry[],
): { children: LexInline[]; linked: string | null } {
  let linkedUrl: string | null = null
  const result: LexInline[] = []

  for (const child of children) {
    if (linkedUrl !== null || child.type !== 'text') {
      result.push(child)
      continue
    }

    const text    = child.text
    let   matched = false

    for (const entry of entries) {
      const re = new RegExp(`(?<![a-zA-Z0-9])(${escapeRegex(entry.keyword)})(?![a-zA-Z0-9])`, 'i')
      const m  = re.exec(text)
      if (!m) continue

      linkedUrl = entry.url
      matched   = true

      const pre  = text.slice(0, m.index)
      const hit  = m[1]
      const post = text.slice(m.index + hit.length)

      if (pre)  result.push({ ...child, text: pre })
      result.push({ type: 'link', url: entry.url, autoLink: true, children: [{ type: 'text', text: hit }] })
      if (post) result.push({ ...child, text: post })
      break
    }

    if (!matched) result.push(child)
  }

  return { children: result, linked: linkedUrl }
}

// Inject at most one auto-link per paragraph, and each destination URL at most once per article.
// Sorted longest-keyword-first so specific phrases ("Colt SAA") beat shorter substrings ("Colt").
export function injectLinks(nodes: LexNode[], dictionary: LinkEntry[], currentPath: string): LexNode[] {
  if (!dictionary.length) return nodes

  const sorted = [...dictionary]
    .filter(e => e.url !== currentPath && e.keyword.length >= 3)
    .sort((a, b) => b.keyword.length - a.keyword.length || b.priority - a.priority)

  if (!sorted.length) return nodes

  const usedUrls = new Set<string>()

  return nodes.map(node => {
    if (node.type !== 'paragraph') return node
    const available = sorted.filter(e => !usedUrls.has(e.url))
    if (!available.length) return node
    const { children, linked } = linkifyChildrenTracked(node.children, available)
    if (linked) usedUrls.add(linked)
    return { ...node, children }
  })
}
