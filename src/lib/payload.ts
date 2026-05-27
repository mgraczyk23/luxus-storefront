const PAYLOAD_URL = process.env.PAYLOAD_CMS_URL ?? "https://api.luxus-collection.com/cms"

export type PayloadImage = {
  id:       string
  url:      string
  alt:      string
  width?:   number
  height?:  number
  filename: string
}

export function imageUrl(img: PayloadImage | null | undefined): string | null {
  if (!img) return null
  // Always serve through the Payload proxy — the S3 bucket requires a public-read
  // bucket policy before direct S3 URLs work. Proxy serves from S3 server-side
  // and works unconditionally. Switch to `return img.url` once the policy is set.
  return `${PAYLOAD_URL}/api/media/file/${encodeURIComponent(img.filename)}`
}

export type PayloadPost = {
  id:            string
  title:         string
  slug:          string
  excerpt:       string
  category:      string
  status:        "draft" | "published"
  publishedAt:   string | null
  featured:      boolean
  readTime:      string | null
  featuredImage: PayloadImage | null
  author: {
    name: string
    role: string | null
    bio:  string | null
  }
  tags: { id: string; tag: string }[]
  content: unknown
  seoTitle:       string | null
  seoDescription: string | null
}

type PayloadListResponse<T> = {
  docs:       T[]
  totalDocs:  number
  limit:      number
  totalPages: number
  page:       number
  hasPrevPage: boolean
  hasNextPage: boolean
}

export async function getPosts(opts: {
  limit?:      number
  page?:       number
  category?:   string
  featured?:   boolean
  noContent?:  boolean  // exclude Lexical body — use for listing pages
} = {}): Promise<PayloadListResponse<PayloadPost>> {
  const params = new URLSearchParams()
  params.set("where[status][equals]", "published")
  params.set("sort", "-publishedAt")
  params.set("limit", String(opts.limit ?? 100))
  params.set("depth", "1")
  if (opts.page)      params.set("page",     String(opts.page))
  if (opts.category)  params.set("where[category][equals]", opts.category)
  if (opts.featured)  params.set("where[featured][equals]", "true")
  if (opts.noContent) params.set("select[content]", "false")

  const res = await fetch(`${PAYLOAD_URL}/api/posts?${params}`, {
    next: { revalidate: 300, tags: ["posts"] },
  })
  if (!res.ok) throw new Error(`Payload posts fetch failed: ${res.status}`)
  return res.json()
}

export async function getPost(slug: string): Promise<PayloadPost | null> {
  const params = new URLSearchParams()
  params.set("where[slug][equals]", slug)
  params.set("where[status][equals]", "published")
  params.set("depth", "1")
  params.set("limit", "1")

  const res = await fetch(`${PAYLOAD_URL}/api/posts?${params}`, {
    next: { revalidate: 300, tags: ["posts"] },
  })
  if (!res.ok) return null
  const data: PayloadListResponse<PayloadPost> = await res.json()
  return data.docs[0] ?? null
}

export type PayloadComment = {
  id:          string
  authorName:  string
  body:        string
  createdAt:   string
}

export async function getComments(postId: string): Promise<PayloadComment[]> {
  const params = new URLSearchParams()
  params.set("where[post][equals]", postId)
  params.set("where[status][equals]", "approved")
  params.set("sort", "createdAt")
  params.set("depth", "0")
  params.set("limit", "200")

  const res = await fetch(`${PAYLOAD_URL}/api/comments?${params}`, {
    next: { revalidate: 60, tags: [`comments-${postId}`] },
  })
  if (!res.ok) return []
  const data: PayloadListResponse<PayloadComment> = await res.json()
  return data.docs ?? []
}

export async function createComment(data: {
  post: string
  authorName: string
  authorEmail: string
  body: string
}): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(`${PAYLOAD_URL}/api/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    cache: "no-store",
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    return { ok: false, message: json?.errors?.[0]?.message ?? "Failed to submit." }
  }
  return { ok: true }
}

/* ── Site Settings ───────────────────────────────────────────────────────── */

export type SiteSettings = {
  contact: {
    phone:         string
    phoneTollFree: string
    emailInfo:     string
    emailSupport:  string
    emailSales:    string
    emailPress:    string
  }
  address: {
    line1: string
    city:  string
    state: string
    zip:   string
  }
  hours: {
    weekdayOpen:   string
    weekdayClose:  string
    saturdayOpen:  string
    saturdayClose: string
    timezone:      string
    sundayClosed:  boolean
  }
  social: {
    facebook?:  string
    instagram?: string
    linkedin?:  string
    twitter?:   string
    youtube?:   string
    pinterest?: string
  }
  banking: {
    bankName?:      string
    accountName?:   string
    routingNumber?: string
    accountNumber?: string
    swiftCode?:     string
    location?:      string
    memo?:          string
  }
  announcement: {
    enabled:  boolean
    message?: string
    link?:    string
  }
}

const SETTINGS_FALLBACK: SiteSettings = {
  contact: {
    phone:         '(941) 253-3660',
    phoneTollFree: '(833) 486-6659',
    emailInfo:     'info@luxus-collection.com',
    emailSupport:  'support@luxus-collection.com',
    emailSales:    'sales@luxus-collection.com',
    emailPress:    'press@luxus-collection.com',
  },
  address: { line1: '1199 N Beneva Rd', city: 'Sarasota', state: 'FL', zip: '34232' },
  hours: {
    weekdayOpen: '8:30 AM', weekdayClose: '6:00 PM',
    saturdayOpen: '10:00 AM', saturdayClose: '2:00 PM',
    timezone: 'EST', sundayClosed: true,
  },
  social: {},
  banking: {
    bankName:      'Truist Bank',
    accountName:   'Luxus Capital, LLC',
    routingNumber: '263191387',
    accountNumber: '1100009085694',
    location:      'Sarasota, FL',
  },
  announcement: { enabled: false },
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${PAYLOAD_URL}/api/globals/site-settings`, {
      next: { revalidate: 300, tags: ['site-settings'] },
    })
    if (!res.ok) return SETTINGS_FALLBACK
    const data = await res.json()
    return { ...SETTINGS_FALLBACK, ...data }
  } catch {
    return SETTINGS_FALLBACK
  }
}

/* ── Shop Tile Images ────────────────────────────────────────────────────── */

export type ShopTileImageMap = Record<string, string> // handle → absolute image URL

export async function getShopTileImages(): Promise<{
  collections: ShopTileImageMap
  categories:  ShopTileImageMap
}> {
  const empty = { collections: {}, categories: {} }
  try {
    const res = await fetch(`${PAYLOAD_URL}/api/globals/shop-tile-images?depth=1`, {
      next: { revalidate: 300, tags: ['shop-tile-images'] },
    })
    if (!res.ok) return empty
    const data = await res.json()

    const toMap = (rows: any[]): ShopTileImageMap => {
      const map: ShopTileImageMap = {}
      for (const row of rows ?? []) {
        const url = imageUrl(row.image)
        if (row.handle && url) map[row.handle] = url
      }
      return map
    }

    return {
      collections: toMap(data.collections),
      categories:  toMap(data.categories),
    }
  } catch {
    return empty
  }
}

/* ── Hero Slides ─────────────────────────────────────────────────────────── */

export type HeroSlide = {
  kicker:   string
  caption:  string
  imageUrl?: string
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const res = await fetch(`${PAYLOAD_URL}/api/globals/hero-slides?depth=1`, {
      next: { revalidate: 300, tags: ['hero-slides'] },
    })
    if (!res.ok) return []
    const data = await res.json()
    const slides: any[] = data?.slides ?? []
    return slides
      .filter((s: any) => s.enabled !== false)
      .map((s: any) => ({
        kicker:   s.kicker   ?? '',
        caption:  s.caption  ?? '',
        imageUrl: imageUrl(s.image) ?? undefined,
      }))
  } catch {
    return []
  }
}

/* ── Brands ──────────────────────────────────────────────────────────────── */

export type PayloadBrand = {
  id:          string
  name:        string
  slug:        string
  origin:      string | null
  description: string | null
  logo:        PayloadImage | null
  featured:    boolean
  sortOrder:   number
}

export async function getBrands(opts: { featuredOnly?: boolean } = {}): Promise<PayloadBrand[]> {
  try {
    const params = new URLSearchParams()
    params.set('limit', '100')
    params.set('depth', '1')
    params.set('sort', 'sortOrder')
    if (opts.featuredOnly) params.set('where[featured][equals]', 'true')

    const res = await fetch(`${PAYLOAD_URL}/api/brands?${params}`, {
      next: { revalidate: 300, tags: ['brands'] },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.docs ?? []).map((b: any) => ({
      id:          b.id,
      name:        b.name,
      slug:        b.slug,
      origin:      b.origin      ?? null,
      description: b.description ?? null,
      logo:        b.logo        ?? null,
      featured:    b.featured    ?? false,
      sortOrder:   b.sortOrder   ?? 0,
    }))
  } catch {
    return []
  }
}

/* ── About Page Images ───────────────────────────────────────────────────── */

export type AboutPageImages = {
  heroImage:       PayloadImage | null
  storyImageMain:  PayloadImage | null
  storyImageLeft:  PayloadImage | null
  storyImageRight: PayloadImage | null
  valuesImage:     PayloadImage | null
}

export async function getAboutPageImages(): Promise<AboutPageImages> {
  const empty: AboutPageImages = {
    heroImage: null, storyImageMain: null,
    storyImageLeft: null, storyImageRight: null, valuesImage: null,
  }
  try {
    const res = await fetch(`${PAYLOAD_URL}/api/globals/about-page?depth=1`, {
      next: { revalidate: 300, tags: ['about-page'] },
    })
    if (!res.ok) return empty
    const d = await res.json()
    return {
      heroImage:       d.heroImage       ?? null,
      storyImageMain:  d.storyImageMain  ?? null,
      storyImageLeft:  d.storyImageLeft  ?? null,
      storyImageRight: d.storyImageRight ?? null,
      valuesImage:     d.valuesImage     ?? null,
    }
  } catch {
    return empty
  }
}

// Lexical rich-text → React-renderable node tree
// Returns an array of block-level descriptors consumed by LexicalRenderer
export type LexNode =
  | { type: "paragraph";   children: LexInline[] }
  | { type: "heading";     tag: "h2" | "h3"; id?: string; children: LexInline[] }
  | { type: "quote";       children: LexInline[] }
  | { type: "list";        listType: "bullet" | "number"; items: LexInline[][] }
  | { type: "hr" }
  | { type: "upload";      url: string; alt: string; caption?: string }

export type LexInline =
  | { type: "text";   text: string; bold?: boolean; italic?: boolean; underline?: boolean; code?: boolean }
  | { type: "link";   url: string; children: LexInline[] }
  | { type: "linebreak" }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseInline(node: any): LexInline {
  if (node.type === "linebreak") return { type: "linebreak" }
  if (node.type === "link") {
    const url = node.fields?.url ?? node.url ?? "#"
    return { type: "link", url, children: (node.children ?? []).map(parseInline) }
  }
  const fmt = node.format ?? 0
  return {
    type:      "text",
    text:      node.text ?? "",
    bold:      !!(fmt & 1),
    italic:    !!(fmt & 2),
    underline: !!(fmt & 8),
    code:      !!(fmt & 16),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseLexical(content: any): LexNode[] {
  if (!content?.root?.children) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return content.root.children.flatMap((node: any): LexNode[] => {
    if (node.type === "paragraph") {
      return [{ type: "paragraph", children: (node.children ?? []).map(parseInline) }]
    }
    if (node.type === "heading") {
      const tag = node.tag === "h3" ? "h3" : "h2"
      const text = (node.children ?? []).map((c: any) => c.text ?? "").join("")
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      return [{ type: "heading", tag, id, children: (node.children ?? []).map(parseInline) }]
    }
    if (node.type === "quote") {
      return [{ type: "quote", children: (node.children ?? []).map(parseInline) }]
    }
    if (node.type === "list") {
      const listType = node.listType === "number" ? "number" : "bullet"
      const items = (node.children ?? []).map((li: any) => (li.children ?? []).map(parseInline))
      return [{ type: "list", listType, items }]
    }
    if (node.type === "horizontalrule") {
      return [{ type: "hr" }]
    }
    if (node.type === "upload" && node.value) {
      const url = imageUrl(node.value) ?? ""
      return [{ type: "upload", url, alt: node.value.alt ?? "", caption: node.fields?.caption }]
    }
    return []
  })
}
