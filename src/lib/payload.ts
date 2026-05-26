const PAYLOAD_URL = process.env.PAYLOAD_CMS_URL ?? "https://api.luxus-collection.com/cms"

export type PayloadImage = {
  id:       string
  url:      string
  alt:      string
  width?:   number
  height?:  number
  filename: string
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

export function imageUrl(img: PayloadImage | null | undefined): string | null {
  if (!img) return null
  if (img.url.startsWith("http")) return img.url
  return `${PAYLOAD_URL}${img.url}`
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
