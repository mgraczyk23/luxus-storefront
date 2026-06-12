import { getSiteSettings, getBrands, getPosts } from '@/lib/payload'
import { getCategories } from '@/lib/api'

export const revalidate = 3600 // rebuild every hour

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'

export async function GET() {
  const [settings, brands, posts, categoriesRes] = await Promise.all([
    getSiteSettings().catch(() => null),
    getBrands().catch(() => []),
    getPosts({ limit: 20, noContent: true }).catch(() => ({ docs: [] })),
    getCategories().catch(() => ({ product_categories: [] })),
  ])

  const name       = settings?.branding.legalName || 'Luxus Collection'
  const phone      = settings?.contact.phone       || '(941) 253-3660'
  const email      = settings?.contact.emailInfo   || 'info@luxus-collection.com'
  const addr       = settings?.address
  const ffl        = settings?.fflLicense

  const addressLine = addr
    ? `${addr.line1}, ${addr.city}, ${addr.state} ${addr.zip}`
    : '1199 N Beneva Rd, Sarasota, FL 34232'

  const hours = settings?.hours
  const hoursLine = hours
    ? `Mon–Fri ${hours.weekdayOpen}–${hours.weekdayClose}, Sat ${hours.saturdayOpen}–${hours.saturdayClose}${hours.sundayClosed ? ', Sun Closed' : ''} (${hours.timezone})`
    : ''

  const categories: { name: string; handle: string }[] =
    (categoriesRes.product_categories ?? []).filter((c: { name: string; handle: string }) => c.name && c.handle)

  const lines: string[] = []

  // ── Header ────────────────────────────────────────────────────────────────
  lines.push(`# ${name}`)
  lines.push('')
  lines.push(`> Fine and collectible firearms dealer specializing in historically significant, rare, and high-quality handguns, rifles, and shotguns. Licensed FFL dealer${ffl ? ` (FFL #${ffl})` : ''}. Carries both collectible antique/vintage and modern firearms.${hoursLine ? ` ${hoursLine}.` : ''} Located at ${addressLine}.`)
  lines.push('')

  // ── Key pages ─────────────────────────────────────────────────────────────
  lines.push('## Site')
  lines.push('')
  lines.push(`- [Home](${SITE}/): Featured inventory, new arrivals, and editorial highlights`)
  lines.push(`- [Shop](${SITE}/shop): Full inventory — collectible and modern firearms`)
  lines.push(`- [Articles](${SITE}/articles): Collector guides, historical deep-dives, and buying advice`)
  lines.push(`- [About](${SITE}/about): Company history, FFL credentials, and team`)
  lines.push(`- [FAQ](${SITE}/faq): Ordering, FFL transfers, shipping, payments, and consignment`)
  lines.push(`- [Sell Your Gun](${SITE}/sell-your-gun): Consignment and direct purchase options`)
  lines.push(`- [Contact](${SITE}/contact): ${phone} · ${email}`)
  lines.push('')

  // ── Shop categories ───────────────────────────────────────────────────────
  if (categories.length > 0) {
    lines.push('## Product Categories')
    lines.push('')
    for (const cat of categories) {
      lines.push(`- [${cat.name}](${SITE}/category/${cat.handle})`)
    }
    lines.push('')
  }

  // ── Brands ────────────────────────────────────────────────────────────────
  if (brands.length > 0) {
    lines.push('## Brands')
    lines.push('')
    for (const brand of brands) {
      const desc = brand.tagline ? `: ${brand.tagline}` : ''
      lines.push(`- [${brand.name}](${SITE}/brand/${brand.slug})${desc}`)
    }
    lines.push('')
  }

  // ── Recent articles ───────────────────────────────────────────────────────
  if (posts.docs.length > 0) {
    lines.push('## Recent Articles')
    lines.push('')
    for (const post of posts.docs) {
      const excerpt = post.excerpt ? `: ${post.excerpt.slice(0, 120)}${post.excerpt.length > 120 ? '…' : ''}` : ''
      lines.push(`- [${post.title}](${SITE}/article/${post.slug})${excerpt}`)
    }
    lines.push('')
  }

  // ── Business info ─────────────────────────────────────────────────────────
  lines.push('## About This Site')
  lines.push('')
  lines.push(`${name} is a licensed Federal Firearms Licensee (FFL) dealing in fine, collectible, and modern firearms. All purchases require legal transfer through a local FFL dealer. Shipping to FFL dealers only. Accepts major credit cards. Located in Sarasota, Florida.`)
  lines.push('')

  const body = lines.join('\n')

  return new Response(body, {
    headers: {
      'Content-Type':  'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
