import type { LexNode, LexInline } from './payload'

const PAYLOAD_URL = process.env.PAYLOAD_CMS_URL ?? 'https://api.luxus-collection.com/cms'
const BACKEND     = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'https://api.luxus-collection.com'
const PK          = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

export interface LinkEntry {
  keyword: string
  url: string
  priority: number
}

// ── Source fetchers ────────────────────────────────────────────────────────────
// Each fetch is cached by Next.js Data Cache via the `next.tags` option,
// matching the same pattern used throughout src/lib/payload.ts and api.ts.

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
      url: String(d.url ?? ''),
      priority: Number(d.priority ?? 10),
    })).filter((e: LinkEntry) => e.keyword && e.url)
  } catch {
    return []
  }
}

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
        url: `/brand/${b.slug}`,
        priority: 50,
      }))
  } catch {
    return []
  }
}

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
        url: `/category/${c.handle}`,
        priority: 40,
      }))
  } catch {
    return []
  }
}

async function fetchProductLinks(): Promise<LinkEntry[]> {
  const all: LinkEntry[] = []
  let offset = 0
  const limit = 250
  try {
    for (;;) {
      const res = await fetch(
        `${BACKEND}/store/products?limit=${limit}&offset=${offset}&fields=id,title,handle`,
        {
          headers: { 'x-publishable-api-key': PK },
          next: { revalidate: false, tags: ['products'] },
        }
      )
      if (!res.ok) break
      const data = await res.json()
      const products: Record<string, unknown>[] = data.products ?? []
      for (const p of products) {
        if (p.title && p.handle) {
          all.push({ keyword: String(p.title), url: `/product/${p.handle}`, priority: 30 })
        }
      }
      if (products.length < limit) break
      offset += limit
    }
  } catch {
    // return whatever was collected before the error
  }
  return all
}

// ── Dictionary builder ─────────────────────────────────────────────────────────
// Combines all sources. Manual entries win over auto-entries when keywords clash.
// Each source fetch is independently cached via Next.js Data Cache (fetch tags),
// so this function is cheap to call — it hits cached fetch responses.

export async function getLinkDictionary(): Promise<LinkEntry[]> {
  const [manual, brands, cats, prods] = await Promise.all([
    fetchManualLinks(),
    fetchBrandLinks(),
    fetchCategoryLinks(),
    fetchProductLinks(),
  ])

  // Deduplicate by lowercased keyword; first seen wins (manual listed first)
  const seen = new Set<string>()
  const combined: LinkEntry[] = []
  for (const entry of [...manual, ...brands, ...cats, ...prods]) {
    const key = entry.keyword.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      combined.push(entry)
    }
  }
  return combined
}

// ── AST transformer ────────────────────────────────────────────────────────────

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function linkifyChildren(children: LexInline[], entries: LinkEntry[]): LexInline[] {
  let linked = false
  const result: LexInline[] = []

  for (const child of children) {
    if (linked || child.type !== 'text') {
      result.push(child)
      continue
    }

    const text = child.text
    let matched = false

    for (const entry of entries) {
      const re = new RegExp(`(?<![a-zA-Z0-9])(${escapeRegex(entry.keyword)})(?![a-zA-Z0-9])`, 'i')
      const m = re.exec(text)
      if (!m) continue

      linked = true
      matched = true

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

  return result
}

// Inject at most one auto-link per paragraph. Headings, quotes, lists untouched.
export function injectLinks(nodes: LexNode[], dictionary: LinkEntry[], currentPath: string): LexNode[] {
  if (!dictionary.length) return nodes

  // Longest keyword first → "Sig Sauer P320 X-Carry" wins over "Sig Sauer"
  const sorted = [...dictionary]
    .filter(e => e.url !== currentPath && e.keyword.length >= 3)
    .sort((a, b) => b.keyword.length - a.keyword.length || b.priority - a.priority)

  if (!sorted.length) return nodes

  return nodes.map(node => {
    if (node.type !== 'paragraph') return node
    return { ...node, children: linkifyChildren(node.children, sorted) }
  })
}
