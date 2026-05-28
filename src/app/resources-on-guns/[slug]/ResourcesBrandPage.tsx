'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/context/ThemeContext'
import {
  parseLexical, imageUrl,
  type PayloadBrandFull, type PayloadPost, type PayloadResourcePage,
  type LexNode, type LexInline,
} from '@/lib/payload'
import type { MappedProduct } from '@/lib/medusa'

/* ── Lexical inline renderer ─────────────────────────────────────────────── */

function InlineNode({ node }: { node: LexInline }) {
  const { t } = useTheme()
  if (node.type === 'linebreak') return <br />
  if (node.type === 'link') {
    return (
      <a href={node.url} target="_blank" rel="noopener noreferrer" style={{ color: t.gold, textDecoration: 'underline' }}>
        {node.children.map((c, i) => <InlineNode key={i} node={c} />)}
      </a>
    )
  }
  let text: React.ReactNode = node.text
  if (node.bold)      text = <strong style={{ fontWeight: 600 }}>{text}</strong>
  if (node.italic)    text = <em>{text}</em>
  if (node.underline) text = <u>{text}</u>
  if (node.code)      text = <code style={{ fontFamily: 'monospace', fontSize: '0.9em', background: '#f0f0f2', padding: '1px 5px', borderRadius: '3px' }}>{text}</code>
  return <>{text}</>
}

function LexBlock({ node }: { node: LexNode }) {
  const { t } = useTheme()
  if (node.type === 'paragraph') {
    const isEmpty = node.children.length === 0 || (node.children.length === 1 && node.children[0].type === 'text' && node.children[0].text === '')
    if (isEmpty) return <div style={{ height: '12px' }} />
    return (
      <p style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.85, color: t.text, marginBottom: '24px', letterSpacing: '0.015em', fontFamily: 'var(--font-inter)' }}>
        {node.children.map((c, i) => <InlineNode key={i} node={c} />)}
      </p>
    )
  }
  if (node.type === 'heading') {
    const Tag = node.tag
    const style: React.CSSProperties = node.tag === 'h2'
      ? { fontFamily: 'var(--font-playfair)', fontSize: '26px', fontWeight: 400, color: t.text, lineHeight: 1.25, marginBottom: '18px', marginTop: '48px' }
      : { fontFamily: 'var(--font-playfair)', fontSize: '21px', fontWeight: 400, color: t.text, lineHeight: 1.3, marginBottom: '14px', marginTop: '32px' }
    return <Tag id={node.id} style={style}>{node.children.map((c, i) => <InlineNode key={i} node={c} />)}</Tag>
  }
  if (node.type === 'quote') {
    return (
      <div style={{ margin: '40px 0', padding: '28px 32px', borderLeft: `3px solid ${t.gold}`, background: t.bgSurface }}>
        <blockquote style={{ fontFamily: 'var(--font-playfair)', fontSize: '21px', fontWeight: 300, fontStyle: 'italic', color: t.text, lineHeight: 1.55, margin: 0 }}>
          {node.children.map((c, i) => <InlineNode key={i} node={c} />)}
        </blockquote>
      </div>
    )
  }
  if (node.type === 'list') {
    const Tag = node.listType === 'number' ? 'ol' : 'ul'
    return (
      <Tag style={{ paddingLeft: '28px', marginBottom: '24px' }}>
        {node.items.map((item, i) => (
          <li key={i} style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.85, color: t.text, marginBottom: '6px', fontFamily: 'var(--font-inter)' }}>
            {item.map((c, j) => <InlineNode key={j} node={c} />)}
          </li>
        ))}
      </Tag>
    )
  }
  if (node.type === 'hr') return <hr style={{ border: 'none', borderTop: `1px solid ${t.border}`, margin: '40px 0' }} />
  if (node.type === 'upload') {
    return (
      <figure style={{ margin: '40px 0' }}>
        <div style={{ border: `1px solid ${t.border}`, overflow: 'hidden' }}>
          <Image src={node.url} alt={node.alt} width={800} height={450} style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
        {node.caption && <figcaption style={{ marginTop: '10px', fontSize: '11.5px', fontStyle: 'italic', color: t.textDim, fontFamily: 'var(--font-inter)', fontWeight: 300 }}>{node.caption}</figcaption>}
      </figure>
    )
  }
  return null
}

/* ── Section divider ─────────────────────────────────────────────────────── */
function SectionHead({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  const { t } = useTheme()
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '36px', paddingBottom: '14px', borderBottom: `1px solid ${t.border}` }}>
      <div>
        {eyebrow && <div style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '6px' }}>{eyebrow}</div>}
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 400, color: t.text, margin: 0 }}>{title}</h2>
      </div>
      {action}
    </div>
  )
}

/* ── Resource page card (model/topic sub-page) ───────────────────────────── */
function ResourceCard({ page, brandSlug }: { page: PayloadResourcePage; brandSlug: string }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  const imgUrl = imageUrl(page.featuredImage)
  return (
    <Link href={`/resources-on-guns/${brandSlug}/${page.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ border: `1px solid ${hov ? t.gold + '60' : t.border}`, transition: 'border-color 0.25s', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
      >
        <div style={{ height: '220px', background: t.bgSurface, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
          {imgUrl
            ? <Image src={imgUrl} alt={page.title} fill style={{ objectFit: 'cover', transform: hov ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.4s ease' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '10px', color: t.textDim, letterSpacing: '0.1em' }}>LUXUS</span></div>
          }
        </div>
        <div style={{ padding: '20px 22px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '19px', fontWeight: 400, color: hov ? t.gold : t.text, margin: '0 0 10px', transition: 'color 0.22s', lineHeight: 1.25 }}>
            {page.title}
          </h3>
          {page.excerpt && (
            <p style={{ fontSize: '13.5px', fontWeight: 300, lineHeight: 1.7, color: t.textDim, fontFamily: 'var(--font-inter)', margin: 0, flex: 1 }}>
              {page.excerpt.slice(0, 160)}{page.excerpt.length > 160 ? '…' : ''}
            </p>
          )}
          <div style={{ marginTop: '14px', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
            Read More →
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ── Blog article card ───────────────────────────────────────────────────── */
function ArticleCard({ post }: { post: PayloadPost }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  const thumbUrl = imageUrl(post.featuredImage)
  return (
    <Link href={`/article/${post.slug}`} style={{ textDecoration: 'none' }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ cursor: 'pointer' }}>
        <div style={{ height: '180px', border: `1px solid ${hov ? t.gold + '50' : t.border}`, overflow: 'hidden', position: 'relative', marginBottom: '14px', transition: 'border-color 0.25s' }}>
          {thumbUrl
            ? <Image src={thumbUrl} alt={post.featuredImage?.alt ?? ''} fill style={{ objectFit: 'cover', transform: hov ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.4s ease' }} />
            : <div style={{ width: '100%', height: '100%', background: t.bgSurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '10px', color: t.textDim, letterSpacing: '0.1em' }}>LUXUS</span></div>
          }
        </div>
        <div style={{ fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '6px' }}>{post.category}</div>
        <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 400, color: hov ? t.gold : t.text, lineHeight: 1.3, margin: '0 0 8px', transition: 'color 0.22s' }}>{post.title}</h3>
        <p style={{ fontSize: '12.5px', color: t.textDim, fontFamily: 'var(--font-inter)', fontWeight: 300, margin: 0, lineHeight: 1.6 }}>{post.excerpt?.slice(0, 100)}{(post.excerpt?.length ?? 0) > 100 ? '…' : ''}</p>
      </div>
    </Link>
  )
}

/* ── Product card — matches store ListingPage exactly ────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

function ProductCard({ product }: { product: MappedProduct }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)

  return (
    <Link href={`/product/${product.handle}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: hov ? '#fafafa' : '#ffffff',
          border: `1px solid ${hov ? t.gold + '55' : t.border}`,
          borderRadius: '1px', overflow: 'hidden',
          transition: 'all 0.28s ease',
          transform: hov ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: hov ? `0 16px 48px rgba(0,0,0,0.1),0 0 0 1px ${t.gold}25` : '0 2px 8px rgba(0,0,0,0.05)',
          cursor: 'pointer', fontFamily: 'var(--font-inter)',
          display: 'flex', flexDirection: 'column', flex: 1,
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', flexShrink: 0, background: '#f0f0f0' }}>
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              style={{ objectFit: 'contain', filter: !product.in_stock ? 'grayscale(0.55) brightness(0.78)' : 'none' }}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: !product.in_stock ? 'grayscale(0.55) brightness(0.78)' : 'none' }}>
              <span style={{ fontSize: '9px', color: t.textDim, letterSpacing: '0.1em' }}>LUXUS</span>
            </div>
          )}

          {product.details?.primary_category && product.in_stock && (
            <div style={{
              position: 'absolute', top: '10px', left: '10px',
              background: 'rgba(255,255,255,0.88)', border: `1px solid ${t.gold}50`,
              padding: '3px 9px', fontSize: '8.5px', letterSpacing: '0.14em',
              textTransform: 'uppercase', fontWeight: 500, color: t.gold, backdropFilter: 'blur(6px)',
            }}>
              {product.details.primary_category}
            </div>
          )}

          {!product.in_stock && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(11,10,9,0.32)' }}>
              <div style={{ background: 'rgba(255,255,255,0.92)', border: `1px solid ${t.gold}`, color: t.gold, padding: '7px 22px', fontSize: '10px', letterSpacing: '0.32em', textTransform: 'uppercase', fontWeight: 600, backdropFilter: 'blur(6px)' }}>
                Unavailable
              </div>
            </div>
          )}

          {product.in_stock && (
            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.88)', border: '1px solid #3a6a3a55', padding: '3px 9px', backdropFilter: 'blur(6px)' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3a6a3a' }} />
              <span style={{ fontSize: '8.5px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: '#3a6a3a' }}>Available</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: '8.5px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.gold, fontWeight: 500, marginBottom: '5px' }}>
            {product.attributes?.brand}
          </div>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '19px', fontWeight: 400, color: t.text, lineHeight: 1.2, marginBottom: '5px' }}>
            {product.title}
          </div>
          <div style={{ fontSize: '10.5px', color: '#525258', fontWeight: 300, letterSpacing: '0.04em', marginBottom: '13px' }}>
            {[product.attributes?.caliber, product.attributes?.action].filter(Boolean).join(' · ')}
          </div>
          <div style={{ height: '1px', background: t.border, marginBottom: '13px', marginTop: 'auto' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
              fontSize: product.contact_for_pricing ? '10px' : '15px',
              fontWeight: product.contact_for_pricing ? 400 : 500,
              color: product.contact_for_pricing ? t.gold : t.text,
              letterSpacing: product.contact_for_pricing ? '0.04em' : '0.01em',
            }}>
              {product.contact_for_pricing ? 'Contact Us For Pricing' : product.price !== null ? fmt(product.price) : '—'}
            </div>
            <div style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, color: t.gold, borderBottom: `1px solid ${t.gold}55`, paddingBottom: '1px', opacity: hov ? 1 : 0.65, transition: 'opacity 0.2s' }}>
              View Details
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ── Main export ─────────────────────────────────────────────────────────── */
export default function ResourcesBrandPage({
  brand,
  articles,
  resourcePages,
  products,
  slug,
}: {
  brand: PayloadBrandFull | null
  articles: PayloadPost[]
  resourcePages: PayloadResourcePage[]
  products: MappedProduct[]
  slug: string
}) {
  const { t } = useTheme()

  const heroUrl      = imageUrl(brand?.heroImage)
  const logoUrl      = imageUrl(brand?.logo)
  const histNodes    = parseLexical(brand?.history)
  const hasHistory   = histNodes.length > 0
  const hasResources = resourcePages.length > 0
  const hasArticles  = articles.length > 0
  const hasProducts  = products.length > 0
  const brandName    = brand?.name ?? slug

  return (
    <div style={{ background: t.bg, minHeight: '100vh' }}>
      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${t.border}`, padding: '12px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-inter)', fontWeight: 300 }}>
          <Link href="/" style={{ color: t.textDim, textDecoration: 'none' }}>Home</Link>
          <span style={{ color: t.border }}>›</span>
          <Link href="/resources-on-guns" style={{ color: t.textDim, textDecoration: 'none' }}>Resources on Guns</Link>
          <span style={{ color: t.border }}>›</span>
          <span style={{ color: t.text }}>{brandName}</span>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: heroUrl ? '480px' : '260px', overflow: 'hidden', background: heroUrl ? undefined : t.bgSurface }}>
        {heroUrl && <Image src={heroUrl} alt={brandName} fill style={{ objectFit: 'cover' }} priority />}
        <div style={{ position: 'absolute', inset: 0, background: heroUrl ? 'linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.58) 100%)' : 'none' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '0 24px 52px', textAlign: 'center' }}>
          {logoUrl && (
            <div style={{ width: '72px', height: '72px', position: 'relative', marginBottom: '14px', filter: heroUrl ? 'brightness(0) invert(1)' : undefined }}>
              <Image src={logoUrl} alt={brandName} fill style={{ objectFit: 'contain' }} />
            </div>
          )}
          <div style={{ fontSize: '8.5px', letterSpacing: '0.28em', textTransform: 'uppercase', color: heroUrl ? 'rgba(255,255,255,0.65)' : t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '10px' }}>
            Resources on Guns
          </div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(30px,5vw,52px)', fontWeight: 400, color: heroUrl ? '#fff' : t.text, margin: '0 0 12px', lineHeight: 1.1 }}>
            {brandName}
          </h1>
          {brand?.tagline && (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '15px', fontWeight: 300, color: heroUrl ? 'rgba(255,255,255,0.8)' : t.textDim, margin: 0, maxWidth: '540px', lineHeight: 1.6 }}>
              {brand.tagline}
            </p>
          )}
        </div>
      </div>

      {/* ── Brand meta bar ───────────────────────────────────────────────── */}
      {(brand?.origin || brand?.foundingYear) && (
        <div style={{ borderBottom: `1px solid ${t.border}`, background: t.bgSurface }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '14px 24px', display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
            {brand.foundingYear && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500 }}>Founded</span>
                <span style={{ fontSize: '13px', color: t.text, fontFamily: 'var(--font-inter)', fontWeight: 300 }}>{brand.foundingYear}</span>
              </div>
            )}
            {brand.origin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500 }}>Location</span>
                <span style={{ fontSize: '13px', color: t.text, fontFamily: 'var(--font-inter)', fontWeight: 300 }}>{brand.origin}</span>
              </div>
            )}
            <div style={{ marginLeft: 'auto' }}>
              <Link href={`/brand/${slug}`} style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.gold, textDecoration: 'none', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
                Shop {brandName} →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── History / Overview ───────────────────────────────────────── */}
        {(brand?.description || hasHistory) && (
          <section style={{ padding: '64px 0 48px' }}>
            <div style={{ maxWidth: '760px' }}>
              {!hasHistory && brand?.description && (
                <p style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.85, color: t.text, fontFamily: 'var(--font-inter)', margin: 0 }}>{brand.description}</p>
              )}
              {hasHistory && histNodes.map((n, i) => <LexBlock key={i} node={n} />)}
            </div>
          </section>
        )}

        {/* ── Resource Pages (models, topics, specs) ───────────────────── */}
        {hasResources && (
          <section style={{ padding: '48px 0' }}>
            <SectionHead eyebrow={brandName} title="Models & Reference Pages" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {resourcePages.map(p => <ResourceCard key={p.id} page={p} brandSlug={slug} />)}
            </div>
          </section>
        )}

        {/* ── Blog Articles ────────────────────────────────────────────── */}
        {hasArticles && (
          <section style={{ padding: '48px 0' }}>
            <SectionHead
              eyebrow={brandName}
              title="Articles & Features"
              action={
                <Link href="/articles" style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: t.gold, textDecoration: 'none', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
                  All Articles →
                </Link>
              }
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '32px' }}>
              {articles.map(p => <ArticleCard key={p.id} post={p} />)}
            </div>
          </section>
        )}

        {/* ── Available for Purchase ───────────────────────────────────── */}
        {hasProducts && (
          <section style={{ padding: '48px 0 80px' }}>
            <SectionHead
              eyebrow={brandName}
              title="Available for Purchase"
              action={
                <Link href={`/brand/${slug}`} style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: t.gold, textDecoration: 'none', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
                  Shop All →
                </Link>
              }
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '28px' }}>
              {products.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            {products.length > 8 && (
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <Link
                  href={`/brand/${slug}`}
                  style={{ display: 'inline-block', padding: '13px 40px', border: `1px solid ${t.gold}`, color: t.gold, fontFamily: 'var(--font-inter)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}
                >
                  View All {products.length} {brandName} Products
                </Link>
              </div>
            )}
          </section>
        )}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {!brand && !hasProducts && !hasResources && (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', fontWeight: 300, color: t.textDim }}>
              Content coming soon. <Link href="/resources-on-guns" style={{ color: t.gold, textDecoration: 'none' }}>← Back to Resources</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
