'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/context/ThemeContext'
import {
  parseLexical, imageUrl,
  type PayloadBrandFull, type PayloadPost, type PayloadModelSeries,
  type LexNode, type LexInline,
} from '@/lib/payload'
import type { MappedProduct } from '@/lib/medusa'

/* ── Inline Lexical renderer ─────────────────────────────────────────────── */

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

/* ── Section heading ─────────────────────────────────────────────────────── */
function SectionHeading({ label, action }: { label: string; action?: React.ReactNode }) {
  const { t } = useTheme()
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '36px', paddingBottom: '14px', borderBottom: `1px solid ${t.border}` }}>
      <div>
        <div style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '6px' }}>Manufacturer Profile</div>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '30px', fontWeight: 400, color: t.text, margin: 0 }}>{label}</h2>
      </div>
      {action}
    </div>
  )
}

/* ── Model series card ───────────────────────────────────────────────────── */
function ModelCard({ model }: { model: PayloadModelSeries }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  const imgUrl = imageUrl(model.image)
  const nodes = parseLexical(model.description)
  const firstPara = nodes.find(n => n.type === 'paragraph')
  const excerpt = firstPara?.type === 'paragraph'
    ? firstPara.children.map(c => (c.type === 'text' ? c.text : '')).join('').slice(0, 160)
    : null

  const inner = (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ border: `1px solid ${hov && model.productHandle ? t.gold + '60' : t.border}`, transition: 'border-color 0.25s', height: '100%', display: 'flex', flexDirection: 'column', cursor: model.productHandle ? 'pointer' : 'default' }}
    >
      <div style={{ height: '220px', background: t.bgSurface, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
        {imgUrl ? (
          <Image src={imgUrl} alt={model.name} fill style={{ objectFit: 'cover', transform: hov ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.4s ease' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none" opacity="0.15">
              <rect x="2" y="2" width="32" height="32" rx="1" stroke={t.gold} strokeWidth="0.8"/>
              <circle cx="12" cy="12" r="4" stroke={t.gold} strokeWidth="0.8"/>
              <path d="M2 26L11 17L17 23L25 13L34 23V34H2V26Z" stroke={t.gold} strokeWidth="0.8"/>
            </svg>
          </div>
        )}
      </div>
      <div style={{ padding: '20px 22px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
          <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '19px', fontWeight: 400, color: hov && model.productHandle ? t.gold : t.text, margin: 0, transition: 'color 0.22s', lineHeight: 1.25 }}>{model.name}</h3>
          {model.yearIntroduced && <span style={{ fontSize: '10px', color: t.textDim, fontFamily: 'var(--font-inter)', fontWeight: 300 }}>Est. {model.yearIntroduced}</span>}
        </div>
        {excerpt && <p style={{ fontSize: '13.5px', fontWeight: 300, lineHeight: 1.7, color: t.textDim, fontFamily: 'var(--font-inter)', margin: 0, flex: 1 }}>{excerpt}{excerpt.length === 160 ? '…' : ''}</p>}
      </div>
    </div>
  )

  if (model.productHandle) {
    return <Link href={`/product/${model.productHandle}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>{inner}</Link>
  }
  return inner
}

/* ── Article card ────────────────────────────────────────────────────────── */
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

/* ── Product card (simplified, no hover add-to-cart) ────────────────────── */
function ProductCard({ product }: { product: MappedProduct }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  const img = product.images?.[0]
  const price = product.price ? `$${(product.price / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}` : null
  return (
    <Link href={`/product/${product.handle}`} style={{ textDecoration: 'none' }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ cursor: 'pointer' }}>
        <div style={{ border: `1px solid ${hov ? t.gold + '50' : t.border}`, overflow: 'hidden', position: 'relative', paddingTop: '100%', marginBottom: '12px', transition: 'border-color 0.25s', background: t.bgSurface }}>
          {img
            ? <Image src={img} alt={product.title} fill style={{ objectFit: 'cover', transform: hov ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.4s ease' }} />
            : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '9px', color: t.textDim, letterSpacing: '0.1em' }}>LUXUS</span></div>
          }
          {product.contact_for_pricing && (
            <div style={{ position: 'absolute', top: '8px', right: '8px', background: t.gold, color: '#fff', fontSize: '7px', fontFamily: 'var(--font-inter)', fontWeight: 500, letterSpacing: '0.1em', padding: '3px 6px', textTransform: 'uppercase' }}>CONTACT</div>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.textDim, marginBottom: '4px' }}>
          {product.attribute_lists.caliber?.[0] && `${product.attribute_lists.caliber[0]}`}
        </div>
        <h4 style={{ fontFamily: 'var(--font-playfair)', fontSize: '15px', fontWeight: 400, color: hov ? t.gold : t.text, lineHeight: 1.3, margin: '0 0 6px', transition: 'color 0.22s' }}>{product.title}</h4>
        {!product.contact_for_pricing && price && (
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', fontWeight: 400, color: t.text }}>{price}</div>
        )}
      </div>
    </Link>
  )
}

/* ── Main export ─────────────────────────────────────────────────────────── */
export default function BrandHubPage({
  brand,
  articles,
  products,
  slug,
}: {
  brand: PayloadBrandFull | null
  articles: PayloadPost[]
  products: MappedProduct[]
  slug: string
}) {
  const { t } = useTheme()

  const heroUrl    = imageUrl(brand?.heroImage)
  const logoUrl    = imageUrl(brand?.logo)
  const histNodes  = parseLexical(brand?.history)
  const hasHistory = histNodes.length > 0
  const hasModels  = (brand?.modelSeries?.length ?? 0) > 0
  const hasGallery = (brand?.gallery?.length ?? 0) > 0
  const hasTimeline = (brand?.timeline?.length ?? 0) > 0
  const hasArticles = articles.length > 0
  const hasProducts = products.length > 0
  const brandName  = brand?.name ?? slug

  return (
    <div style={{ background: t.bg, minHeight: '100vh' }}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: heroUrl ? '480px' : '280px', overflow: 'hidden', background: heroUrl ? undefined : t.bgSurface }}>
        {heroUrl && (
          <Image src={heroUrl} alt={brandName} fill style={{ objectFit: 'cover' }} priority />
        )}
        <div style={{ position: 'absolute', inset: 0, background: heroUrl ? 'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.55) 100%)' : 'none' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '0 24px 48px', textAlign: 'center' }}>
          {logoUrl && (
            <div style={{ width: '80px', height: '80px', position: 'relative', marginBottom: '16px', filter: heroUrl ? 'brightness(0) invert(1)' : undefined }}>
              <Image src={logoUrl} alt={brandName} fill style={{ objectFit: 'contain' }} />
            </div>
          )}
          <div style={{ fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', color: heroUrl ? 'rgba(255,255,255,0.7)' : t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '10px' }}>
            Manufacturer Profile
          </div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(32px,5vw,56px)', fontWeight: 400, color: heroUrl ? '#fff' : t.text, margin: '0 0 12px', lineHeight: 1.1, letterSpacing: '0.01em' }}>
            {brandName}
          </h1>
          {brand?.tagline && (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '15px', fontWeight: 300, color: heroUrl ? 'rgba(255,255,255,0.82)' : t.textDim, margin: 0, maxWidth: '560px', lineHeight: 1.6, letterSpacing: '0.02em' }}>
              {brand.tagline}
            </p>
          )}
        </div>
      </div>

      {/* ── Brand meta bar ───────────────────────────────────────────────── */}
      {(brand?.origin || brand?.foundingYear) && (
        <div style={{ borderBottom: `1px solid ${t.border}`, background: t.bgSurface }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '14px 24px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
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
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── History / Philosophy ──────────────────────────────────────── */}
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

        {/* ── Model Series ─────────────────────────────────────────────── */}
        {hasModels && (
          <section style={{ padding: '48px 0' }}>
            <SectionHeading label="Models & Product Lines" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
              {brand!.modelSeries.map(m => <ModelCard key={m.id} model={m} />)}
            </div>
          </section>
        )}

        {/* ── Photo Gallery ─────────────────────────────────────────────── */}
        {hasGallery && (
          <section style={{ padding: '48px 0' }}>
            <SectionHeading label="Gallery" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {brand!.gallery.map(g => {
                const url = imageUrl(g.image)
                if (!url) return null
                return (
                  <div key={g.id}>
                    <div style={{ position: 'relative', paddingTop: '75%', overflow: 'hidden', border: `1px solid ${t.border}` }}>
                      <Image src={url} alt={g.image.alt ?? g.caption ?? brandName} fill style={{ objectFit: 'cover' }} />
                    </div>
                    {g.caption && <p style={{ marginTop: '8px', fontSize: '11.5px', fontStyle: 'italic', color: t.textDim, fontFamily: 'var(--font-inter)', fontWeight: 300 }}>{g.caption}</p>}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Timeline ─────────────────────────────────────────────────── */}
        {hasTimeline && (
          <section style={{ padding: '48px 0' }}>
            <SectionHeading label="Brand Timeline" />
            <div style={{ position: 'relative', paddingLeft: '32px', borderLeft: `2px solid ${t.border}` }}>
              {brand!.timeline.map((item, i) => (
                <div key={item.id} style={{ position: 'relative', marginBottom: i < brand!.timeline.length - 1 ? '40px' : 0 }}>
                  <div style={{ position: 'absolute', left: '-41px', width: '18px', height: '18px', borderRadius: '50%', background: t.bg, border: `2px solid ${t.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.gold }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 600, color: t.gold, letterSpacing: '0.08em' }}>{item.year}</span>
                    <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 400, color: t.text, margin: 0, lineHeight: 1.3 }}>{item.title}</h3>
                  </div>
                  {item.body && (
                    <p style={{ fontSize: '14.5px', fontWeight: 300, lineHeight: 1.75, color: t.textDim, fontFamily: 'var(--font-inter)', margin: '0 0 12px' }}>{item.body}</p>
                  )}
                  {item.image && imageUrl(item.image) && (
                    <div style={{ position: 'relative', width: '320px', maxWidth: '100%', paddingTop: '56%', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
                      <Image src={imageUrl(item.image)!} alt={item.title} fill style={{ objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Articles & Resources ─────────────────────────────────────── */}
        {hasArticles && (
          <section style={{ padding: '48px 0' }}>
            <SectionHeading
              label="Articles & Resources"
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

        {/* ── Products Available for Purchase ───────────────────────────── */}
        {hasProducts && (
          <section style={{ padding: '48px 0 80px' }}>
            <SectionHeading
              label="Available for Purchase"
              action={
                <Link href={`/shop?brand=${encodeURIComponent(brandName)}`} style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: t.gold, textDecoration: 'none', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
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
                  href={`/shop?brand=${encodeURIComponent(brandName)}`}
                  style={{ display: 'inline-block', padding: '13px 40px', border: `1px solid ${t.gold}`, color: t.gold, fontFamily: 'var(--font-inter)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}
                >
                  View All {products.length} {brandName} Products
                </Link>
              </div>
            )}
          </section>
        )}

        {/* ── Empty state (no Payload content + no products) ────────────── */}
        {!brand && !hasProducts && (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', fontWeight: 300, color: t.textDim }}>No products found for this brand.</p>
          </div>
        )}

      </div>
    </div>
  )
}
