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
  if (img.url.startsWith("http")) return img.url
  return `${PAYLOAD_URL}${img.url}`
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

export type PayloadModelSeries = {
  id:             string
  name:           string
  yearIntroduced: number | null
  description:    unknown // Lexical JSON
  image:          PayloadImage | null
  productHandle:  string | null
}

export type PayloadGalleryItem = {
  id:      string
  image:   PayloadImage
  caption: string | null
}

export type PayloadTimelineItem = {
  id:    string
  year:  string
  title: string
  body:  string | null
  image: PayloadImage | null
}

export type PayloadBrandFull = PayloadBrand & {
  heroImage:      PayloadImage | null
  tagline:        string | null
  foundingYear:   number | null
  history:        unknown // Lexical JSON
  modelSeries:    PayloadModelSeries[]
  gallery:        PayloadGalleryItem[]
  timeline:       PayloadTimelineItem[]
  seoTitle:       string | null
  seoDescription: string | null
}

function mapBrandBase(b: any): PayloadBrand {
  return {
    id:          String(b.id),
    name:        b.name,
    slug:        b.slug,
    origin:      b.origin      ?? null,
    description: b.description ?? null,
    logo:        b.logo        ?? null,
    featured:    b.featured    ?? false,
    sortOrder:   b.sortOrder   ?? 0,
  }
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
    return (data.docs ?? []).map(mapBrandBase)
  } catch {
    return []
  }
}

export async function getBrand(slug: string): Promise<PayloadBrandFull | null> {
  try {
    const params = new URLSearchParams()
    params.set('where[slug][equals]', slug)
    params.set('depth', '2')
    params.set('limit', '1')

    const res = await fetch(`${PAYLOAD_URL}/api/brands?${params}`, {
      next: { revalidate: 300, tags: ['brands', `brand-${slug}`] },
    })
    if (!res.ok) return null
    const data: PayloadListResponse<any> = await res.json()
    const b = data.docs[0]
    if (!b) return null

    return {
      ...mapBrandBase(b),
      heroImage:      b.heroImage      ?? null,
      tagline:        b.tagline        ?? null,
      foundingYear:   b.foundingYear   ?? null,
      history:        b.history        ?? null,
      modelSeries:    (b.modelSeries ?? []).map((m: any) => ({
        id:             String(m.id),
        name:           m.name,
        yearIntroduced: m.yearIntroduced ?? null,
        description:    m.description ?? null,
        image:          m.image ?? null,
        productHandle:  m.productHandle ?? null,
      })),
      gallery: (b.gallery ?? [])
        .filter((g: any) => g.image)
        .map((g: any) => ({
          id:      String(g.id),
          image:   g.image,
          caption: g.caption ?? null,
        })),
      timeline: (b.timeline ?? []).map((t: any) => ({
        id:    String(t.id),
        year:  t.year,
        title: t.title,
        body:  t.body  ?? null,
        image: t.image ?? null,
      })),
      seoTitle:       b.seoTitle       ?? null,
      seoDescription: b.seoDescription ?? null,
    }
  } catch {
    return null
  }
}

export async function getPostsByBrand(brandId: string, limit = 8): Promise<PayloadPost[]> {
  try {
    const params = new URLSearchParams()
    params.set('where[brand][equals]', brandId)
    params.set('where[status][equals]', 'published')
    params.set('sort', '-publishedAt')
    params.set('depth', '1')
    params.set('limit', String(limit))
    params.set('select[content]', 'false')

    const res = await fetch(`${PAYLOAD_URL}/api/posts?${params}`, {
      next: { revalidate: 300, tags: ['posts', `brand-${brandId}`] },
    })
    if (!res.ok) return []
    const data: PayloadListResponse<PayloadPost> = await res.json()
    return data.docs ?? []
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

/* ── Policy Pages ────────────────────────────────────────────────────────── */

export type PolicySection = { heading: string; body: string }
export type PolicyData = {
  title: string
  eyebrow: string
  lastUpdated: string
  sections: PolicySection[]
}

const POLICY_META: Record<'shipping' | 'privacy' | 'terms', Pick<PolicyData, 'title' | 'eyebrow'>> = {
  shipping: { title: 'Shipping & Returns', eyebrow: 'Policies' },
  privacy:  { title: 'Privacy Policy',     eyebrow: 'Legal'    },
  terms:    { title: 'Terms & Conditions', eyebrow: 'Legal'    },
}

const POLICY_FALLBACK_SECTIONS: Record<'shipping' | 'privacy' | 'terms', PolicySection[]> = {
  shipping: [
    { heading: 'Shipping Overview',        body: 'All firearms sold by Luxus Collection ship to a licensed Federal Firearms Licensee (FFL) dealer of your choosing. We do not ship firearms directly to customers. This is a federal legal requirement that applies to all interstate firearm sales. You must provide your FFL dealer\'s information at checkout before an order can be processed.' },
    { heading: 'Processing Time',          body: 'In-stock orders are processed within 2–3 business days of confirmed payment. Custom-order and consignment pieces have individual lead times confirmed at the time of order. Orders placed using bank wire transfer do not ship until funds are confirmed received, which typically takes 3–5 business days from the time of transfer.' },
    { heading: 'Shipping Method & Carriers', body: 'All firearms ship via FedEx or UPS, fully insured for the declared purchase value, with adult signature required upon delivery to the FFL dealer. We do not ship via USPS. You will receive a tracking number by email when your label is created. Luxus Collection is not responsible for carrier delays once a package has been accepted by the carrier.' },
    { heading: 'Shipping Rates',           body: 'Shipping on all firearm purchases is complimentary. We absorb the full cost of insured, signature-required carrier shipping to your FFL dealer on every order regardless of purchase amount.' },
    { heading: 'FFL Dealer Transfer Fees', body: 'Transfer fees are charged by your FFL dealer, not by Luxus Collection, and are paid directly to your dealer at the time of pickup. These fees typically range from $25 to $75 and vary by dealer. Luxus Collection has no control over and receives no portion of transfer fees.' },
    { heading: 'State Restrictions',       body: 'Certain firearms cannot be legally transferred in certain states due to magazine capacity restrictions, feature bans, assault weapon statutes, or handgun roster requirements. We make every effort to notify customers of restrictions before processing payment. It is ultimately the buyer\'s responsibility to understand the laws in their state and to ensure the firearm can be legally received by their FFL dealer.' },
    { heading: 'Return Policy',            body: 'New, unfired firearms may be returned within 10 days of FFL transfer for a full refund minus a 5% restocking fee, provided the firearm is in its original, unaltered condition with all original packaging and accessories included. Firearms that have been fired are considered used and cannot be returned regardless of round count.' },
    { heading: 'Return Process',           body: 'All returns require a Return Authorization (RA) number issued by Luxus Collection before any firearm is shipped back. Contact us at info@luxus-collection.com or (941) 253-3660 within the return window to request an RA number. Returns shipped without an RA number will be refused. All return shipments must route through a licensed FFL dealer on the sender\'s end to our FFL — the same process as the original transfer.' },
    { heading: 'Damaged or Defective Firearms', body: 'Inspect the outer packaging carefully before accepting transfer from your FFL dealer. If the outer packaging shows obvious damage, refuse the shipment and contact us immediately. If a defect is discovered after transfer, contact us within 48 hours with photographic documentation. We will arrange return shipping at our expense and provide either a full replacement or a full refund at our discretion. Manufacturing defects are also covered by the manufacturer\'s warranty.' },
    { heading: 'Pre-Owned Firearms',       body: 'Pre-owned firearms are sold as-is in the condition described in the listing. We make every effort to accurately represent condition, but buyers are responsible for understanding that pre-owned firearms are not new. Pre-owned firearms are not eligible for return unless a material misrepresentation in the listing can be demonstrated.' },
  ],
  privacy: [
    { heading: 'Overview',                 body: 'Luxus Collection LLC (\'Luxus Collection,\' \'we,\' \'us,\' or \'our\') is committed to protecting your privacy. This Privacy Policy describes how we collect, use, disclose, and protect information about you when you visit our website, create an account, or make a purchase. By using our site, you agree to the practices described in this Policy.' },
    { heading: 'Information We Collect',   body: 'We collect information you provide directly: name, email address, phone number, billing and shipping address, FFL dealer information, and payment information when you make a purchase or create an account. We also collect information automatically when you use our site, including IP address, browser type, device identifiers, pages visited, and referring URLs. We use standard cookies and similar tracking technologies for functionality and analytics.' },
    { heading: 'How We Use Your Information', body: 'We use your information to process orders and coordinate FFL transfers, communicate about your orders, respond to inquiries, send transactional emails, and, with your consent, send marketing communications. We use automatically collected information to improve our site and understand how it is used. We do not sell your personal information to third parties.' },
    { heading: 'Information Sharing',      body: 'We share your information with service providers who help us operate our business, including our e-commerce platform, payment processors, shipping carriers, and email service providers, under confidentiality agreements. We may also share information as required by law, to comply with legal process, or to protect the rights, property, or safety of Luxus Collection, our customers, or others. Because firearm transactions are regulated, certain transaction records may be subject to review by federal, state, or local law enforcement agencies.' },
    { heading: 'FFL and Transaction Records', body: 'Firearm purchases are regulated transactions. Your name, address, and identification information are recorded on ATF Form 4473 by your FFL dealer and are subject to federal records retention requirements. These records are maintained by your FFL dealer, not by Luxus Collection, and are subject to ATF regulations and applicable law.' },
    { heading: 'Data Retention',           body: 'We retain your account information for as long as your account is active and for a reasonable period afterward. Order records are retained as required by applicable law. You may request deletion of your personal information by contacting us, subject to legal retention requirements.' },
    { heading: 'Security',                 body: 'We implement industry-standard security measures including SSL/TLS encryption, secure payment processing, and access controls to protect your information. No method of internet transmission or electronic storage is 100% secure. We cannot guarantee absolute security but are committed to protecting your information using reasonable measures.' },
    { heading: 'Your Rights',              body: 'Depending on your state of residence, you may have rights to access, correct, or delete your personal information, or to opt out of certain uses. To exercise these rights, contact us at info@luxus-collection.com. We will respond within 30 days. California residents have additional rights under the California Consumer Privacy Act (CCPA).' },
    { heading: 'Changes to This Policy',   body: 'We may update this Privacy Policy from time to time. We will notify registered users of material changes by email. The \'Last Updated\' date at the top of this page reflects the most recent revision.' },
    { heading: 'Contact',                  body: 'Questions about this Privacy Policy? Contact us at info@luxus-collection.com or (941) 253-3660.' },
  ],
  terms: [
    { heading: 'Acceptance of Terms',      body: 'By accessing or using the Luxus Collection website (luxus-collection.com) or purchasing from us, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, do not use our site or services. We reserve the right to modify these terms at any time. Continued use of our site after changes are posted constitutes acceptance of the revised terms.' },
    { heading: 'Eligibility',              body: 'You must be at least 21 years of age to purchase handguns through our site. You must be legally permitted under federal, state, and local law to purchase and receive the firearm(s) you are ordering. By completing a purchase, you represent and warrant that you meet all eligibility requirements. Providing false information in connection with a firearm purchase is a federal felony.' },
    { heading: 'Product Listings',         body: 'We make every effort to accurately represent our products, including descriptions, photographs, specifications, and pricing. We reserve the right to correct errors, update pricing, or discontinue products at any time without notice. All sales are subject to product availability at the time of order processing. In the event a listed item becomes unavailable after purchase, we will notify you promptly and offer a full refund.' },
    { heading: 'Pricing and Payment',      body: 'All prices are listed in U.S. dollars. Prices are subject to change without notice. We reserve the right to cancel any order in the event of a pricing error. Sales tax is collected in states where we have nexus, in compliance with applicable law. Payment must be received in full before any firearm is shipped. We accept Visa, Mastercard, American Express, Discover, and bank wire transfer.' },
    { heading: 'FFL Transfer Requirement', body: 'All firearm purchases are shipped to a licensed Federal Firearms Licensee (FFL) dealer designated by the buyer. The buyer is responsible for providing accurate FFL dealer information at checkout. Luxus Collection is not responsible for delays, fees, or complications arising from the buyer\'s FFL dealer. The buyer is solely responsible for understanding and complying with all applicable state and local laws governing the receipt and possession of the purchased firearm.' },
    { heading: 'Prohibited Transfers',     body: 'Luxus Collection does not engage in straw purchases (purchasing a firearm for someone who is legally prohibited from purchasing one). We will refuse any order we reasonably believe constitutes a straw purchase or other prohibited transfer. We reserve the right to cancel any order for any reason without liability.' },
    { heading: 'Intellectual Property',    body: 'All content on this site, including text, photographs, graphics, logos, and design, is the property of Luxus Collection LLC or its content suppliers and is protected by U.S. and international copyright law. You may not reproduce, distribute, or create derivative works from our content without prior written consent.' },
    { heading: 'Limitation of Liability',  body: 'To the maximum extent permitted by law, Luxus Collection\'s liability for any claim arising from a purchase or use of our site is limited to the amount paid for the specific product giving rise to the claim. We are not liable for indirect, incidental, special, consequential, or punitive damages. Some states do not allow limitations on implied warranties or exclusions of certain damages, so these limitations may not apply to you.' },
    { heading: 'Governing Law',            body: 'These Terms & Conditions are governed by the laws of the State of Florida, without regard to conflict of law provisions. Any dispute arising from these terms or your use of our site shall be resolved exclusively in the state or federal courts located in Manatee County, Florida. You consent to the personal jurisdiction of such courts.' },
    { heading: 'Contact',                  body: 'Questions about these Terms? Contact us at info@luxus-collection.com or (941) 253-3660.' },
  ],
}

export async function getPolicy(slug: 'shipping' | 'privacy' | 'terms'): Promise<PolicyData> {
  const meta = POLICY_META[slug]
  const fallback: PolicyData = { ...meta, lastUpdated: 'May 1, 2026', sections: POLICY_FALLBACK_SECTIONS[slug] }
  try {
    const res = await fetch(`${PAYLOAD_URL}/api/globals/${slug}-policy`, {
      next: { revalidate: 300, tags: [`policy-${slug}`] },
    })
    if (!res.ok) return fallback
    const data = await res.json()
    const sections: PolicySection[] = (data.sections ?? []).map((s: { heading: string; body: string }) => ({
      heading: s.heading,
      body: s.body,
    }))
    if (!sections.length) return fallback
    return {
      ...meta,
      lastUpdated: data.lastUpdated || fallback.lastUpdated,
      sections,
    }
  } catch {
    return fallback
  }
}

/* ── Lexical rich-text → React-renderable node tree ─────────────────────── */
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
