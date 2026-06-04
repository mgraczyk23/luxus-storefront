'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import { useCart } from '@/context/CartContext'
import { isWishlisted, toggleWishlist } from '@/lib/auth'
import {
  parseLexical, imageUrl,
  type PayloadBrandFull, type PayloadPost, type PayloadResourcePage,
  type PayloadModelSeries, type PayloadGalleryItem, type PayloadTimelineItem,
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
      <Tag style={{ paddingLeft: '28px', marginBottom: '24px', listStyle: node.listType === 'number' ? 'decimal' : 'disc' }}>
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

/* ── Section header ──────────────────────────────────────────────────────── */
function SectionHead({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  const { t } = useTheme()
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '36px', paddingBottom: '14px', borderBottom: `1px solid ${t.border}` }}>
      <div>
        {eyebrow && <div style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '6px' }}>{eyebrow}</div>}
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(22px,4vw,28px)', fontWeight: 400, color: t.text, margin: 0 }}>{title}</h2>
      </div>
      {action}
    </div>
  )
}

/* ── Resource page card ──────────────────────────────────────────────────── */
function ResourceCard({ page, brandSlug }: { page: PayloadResourcePage; brandSlug: string }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  const imgUrl = imageUrl(page.featuredImage)
  return (
    <Link href={`/resources-on-guns/${brandSlug}/${page.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ border: `1px solid ${hov ? t.gold + '60' : t.border}`, transition: 'border-color 0.25s', display: 'flex', flexDirection: 'column', cursor: 'pointer', flex: 1 }}
      >
        <div style={{ height: '200px', background: t.bgSurface, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
          {imgUrl
            ? <Image src={imgUrl} alt={page.title} fill style={{ objectFit: 'cover', transform: hov ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.4s ease' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '10px', color: t.textDim, letterSpacing: '0.1em' }}>LUXUS</span></div>
          }
        </div>
        <div style={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 400, color: hov ? t.gold : t.text, margin: '0 0 8px', transition: 'color 0.22s', lineHeight: 1.25 }}>
            {page.title}
          </h3>
          {page.excerpt && (
            <p style={{ fontSize: '13px', fontWeight: 300, lineHeight: 1.7, color: t.textDim, fontFamily: 'var(--font-inter)', margin: 0, flex: 1 }}>
              {page.excerpt.slice(0, 130)}{page.excerpt.length > 130 ? '…' : ''}
            </p>
          )}
          <div style={{ marginTop: '12px', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
            Read More →
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ── Model Series card ───────────────────────────────────────────────────── */
function ModelSeriesCard({ series }: { series: PayloadModelSeries }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  const imgUrl = imageUrl(series.image)
  const hasLink = !!series.productHandle
  const descNodes = parseLexical(series.description)

  const card = (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: `1px solid ${hov && hasLink ? t.gold + '60' : t.border}`,
        transition: 'border-color 0.25s, transform 0.25s',
        transform: hov && hasLink ? 'translateY(-3px)' : 'translateY(0)',
        cursor: hasLink ? 'pointer' : 'default',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column', height: '100%',
      }}
    >
      <div style={{ height: '160px', background: t.bgSurface, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {imgUrl
          ? <Image src={imgUrl} alt={series.name} fill style={{ objectFit: 'cover', transform: hov && hasLink ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.4s ease' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '10px', color: t.textDim, letterSpacing: '0.1em' }}>LUXUS</span></div>
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', bottom: '12px', left: '14px', right: '14px' }}>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 400, color: '#fff', lineHeight: 1.2 }}>
            {series.name}
          </div>
          {series.yearIntroduced && (
            <div style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-inter)', fontWeight: 500, marginTop: '3px' }}>
              Est. {series.yearIntroduced}
            </div>
          )}
        </div>
      </div>
      {descNodes.length > 0 && (
        <div style={{ padding: '12px 14px 14px', flex: 1, borderBottom: `1px solid ${t.border}`, fontSize: '11.5px', fontWeight: 300, color: t.textMuted, lineHeight: 1.72, fontFamily: 'var(--font-inter)' }}>
          {descNodes.map((n, i) => <LexBlock key={i} node={n} />)}
        </div>
      )}
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: t.bgSurface, flexShrink: 0, marginTop: 'auto' }}>
        {hasLink ? (
          <>
            <span style={{ fontSize: '8.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500 }}>Shop This Series</span>
            <span style={{ fontSize: '13px', color: t.gold, opacity: hov ? 1 : 0.6, transition: 'opacity 0.2s' }}>→</span>
          </>
        ) : (
          <span style={{ fontSize: '8.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.textDim, fontFamily: 'var(--font-inter)', fontWeight: 500 }}>Model Overview</span>
        )}
      </div>
    </div>
  )

  return hasLink
    ? <Link href={`/shop/model/${series.productHandle}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>{card}</Link>
    : <div style={{ height: '100%' }}>{card}</div>
}

/* ── Gallery lightbox ────────────────────────────────────────────────────── */
function LightboxModal({ items, index, onClose, onPrev, onNext }: {
  items: PayloadGalleryItem[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const { t } = useTheme()
  const item = items[index]
  const src = imageUrl(item?.image)
  const touchX = useRef(0)
  const multi = items.length > 1

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowLeft')   onPrev()
      if (e.key === 'ArrowRight')  onNext()
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose, onPrev, onNext])

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  if (!src) return null

  const btnBase: React.CSSProperties = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.55)', border: `1px solid ${t.gold}40`,
    color: '#fff', width: '44px', height: '44px', fontSize: '22px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 2, lineHeight: 1,
    fontFamily: 'var(--font-inter)', fontWeight: 300,
  }

  return (
    <div
      onClick={onClose}
      onTouchStart={e => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const delta = e.changedTouches[0].clientX - touchX.current
        if (delta > 50) onPrev()
        else if (delta < -50) onNext()
      }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Close */}
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        style={{
          position: 'fixed', top: '20px', right: '20px',
          background: 'rgba(0,0,0,0.55)', border: `1px solid ${t.gold}50`,
          color: '#fff', width: '40px', height: '40px', fontSize: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 3, lineHeight: 1,
        }}
        aria-label="Close"
      >×</button>

      {/* Prev */}
      {multi && (
        <button
          onClick={e => { e.stopPropagation(); onPrev() }}
          style={{ ...btnBase, left: '16px' }}
          aria-label="Previous"
        >‹</button>
      )}

      {/* Image */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', width: '90vw', maxWidth: '1200px', height: '78vh' }}
      >
        <Image
          src={src}
          alt={item.image?.alt ?? ''}
          fill
          style={{ objectFit: 'contain' }}
          sizes="90vw"
          priority
        />
      </div>

      {/* Caption + counter */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '24px', minHeight: '24px' }}
      >
        {item.caption && (
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.72)', fontFamily: 'var(--font-inter)', fontWeight: 300, fontStyle: 'italic', textAlign: 'center' }}>
            {item.caption}
          </span>
        )}
        {multi && (
          <span style={{ fontSize: '10px', letterSpacing: '0.14em', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500, flexShrink: 0, marginLeft: 'auto' }}>
            {index + 1} / {items.length}
          </span>
        )}
      </div>

      {/* Next */}
      {multi && (
        <button
          onClick={e => { e.stopPropagation(); onNext() }}
          style={{ ...btnBase, right: '16px' }}
          aria-label="Next"
        >›</button>
      )}
    </div>
  )
}

function GallerySection({ items, eyebrow }: { items: PayloadGalleryItem[]; eyebrow: string }) {
  const { t } = useTheme()
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const open  = useCallback((i: number) => setLightboxIdx(i), [])
  const close = useCallback(() => setLightboxIdx(null), [])
  const prev  = useCallback(() => setLightboxIdx(i => i !== null ? (i - 1 + items.length) % items.length : null), [items.length])
  const next  = useCallback(() => setLightboxIdx(i => i !== null ? (i + 1) % items.length : null), [items.length])

  return (
    <section className="rp-section">
      <SectionHead eyebrow={eyebrow} title="Gallery" />
      <div className="rp-gallery-grid">
        {items.map((item, i) => {
          const src = imageUrl(item.image)
          if (!src) return null
          return (
            <GalleryThumb key={item.id} item={item} src={src} onClick={() => open(i)} />
          )
        })}
      </div>
      {lightboxIdx !== null && (
        <LightboxModal items={items} index={lightboxIdx} onClose={close} onPrev={prev} onNext={next} />
      )}
    </section>
  )
}

function GalleryThumb({ item, src, onClick }: { item: PayloadGalleryItem; src: string; onClick: () => void }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: t.bgSurface, cursor: 'pointer' }}
    >
      <Image src={src} alt={item.image?.alt ?? ''} fill style={{ objectFit: 'cover', transform: hov ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.45s ease' }} />
      <div style={{ position: 'absolute', inset: 0, background: hov ? 'rgba(0,0,0,0.22)' : 'transparent', transition: 'background 0.25s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hov && (
          <div style={{ width: '36px', height: '36px', border: `1px solid rgba(255,255,255,0.7)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 1h5M1 1v5M15 1h-5M15 1v5M1 15h5M1 15v-5M15 15h-5M15 15v-5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
      {item.caption && hov && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px', background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-inter)', fontWeight: 300, fontStyle: 'italic' }}>{item.caption}</span>
        </div>
      )}
    </div>
  )
}

/* ── Timeline entry ──────────────────────────────────────────────────────── */
function TimelineEntry({ item, isLast }: { item: PayloadTimelineItem; isLast: boolean }) {
  const { t } = useTheme()
  const imgUrl = imageUrl(item.image)
  return (
    <div style={{ display: 'flex', gap: '24px', position: 'relative', paddingBottom: isLast ? 0 : '40px' }}>
      {/* Year column */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
        <div style={{ padding: '5px 8px', border: `1px solid ${t.gold}`, background: t.bgSurface }}>
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 600, color: t.gold, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{item.year}</span>
        </div>
        {!isLast && <div style={{ width: '1px', flex: 1, marginTop: '8px', background: `linear-gradient(to bottom, ${t.gold}60, ${t.border})` }} />}
      </div>
      {/* Content column */}
      <div style={{ flex: 1, paddingTop: '3px', paddingBottom: isLast ? 0 : '8px' }}>
        <h4 style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 400, color: t.text, margin: '0 0 8px', lineHeight: 1.3 }}>{item.title}</h4>
        {item.body && (
          <p style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.75, color: t.textDim, fontFamily: 'var(--font-inter)', margin: '0 0 12px' }}>{item.body}</p>
        )}
        {imgUrl && (
          <div style={{ position: 'relative', height: '180px', overflow: 'hidden', border: `1px solid ${t.border}` }}>
            <Image src={imgUrl} alt={item.title} fill style={{ objectFit: 'cover' }} />
          </div>
        )}
      </div>
    </div>
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

/* ── Product card ────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

function ProductCard({ product }: { product: MappedProduct }) {
  const { t } = useTheme()
  const { addItem } = useCart()
  const router = useRouter()
  const [hov, setHov] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => { setWishlisted(isWishlisted(product.handle)) }, [product.handle])

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = toggleWishlist({ handle: product.handle, title: product.title, brand: product.brand, caliber: product.attributes?.caliber ?? null, action: product.attributes?.action ?? null, price: product.price, contact_for_pricing: product.contact_for_pricing, thumbnail: product.thumbnail })
    setWishlisted(next)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(product)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 1800)
  }

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/product/${product.handle}`)
  }

  return (
    <div
      onClick={() => router.push(`/product/${product.handle}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#fafafa' : '#ffffff',
        border: `1px solid ${hov ? t.gold + '55' : t.border}`,
        overflow: 'hidden',
        transition: 'all 0.28s ease',
        transform: hov ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hov ? `0 16px 48px rgba(0,0,0,0.1),0 0 0 1px ${t.gold}25` : '0 2px 8px rgba(0,0,0,0.05)',
        cursor: 'pointer', fontFamily: 'var(--font-inter)',
        display: 'flex', flexDirection: 'column', flex: 1, height: '100%',
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
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '9px', color: t.textDim, letterSpacing: '0.1em' }}>LUXUS</span>
          </div>
        )}

        {product.details?.primary_category && product.in_stock && (
          <div style={{
            position: 'absolute', top: '8px', left: '8px',
            background: 'rgba(255,255,255,0.88)', border: `1px solid ${t.gold}50`,
            padding: '3px 8px', fontSize: '8px', letterSpacing: '0.14em',
            textTransform: 'uppercase', fontWeight: 500, color: t.gold, backdropFilter: 'blur(6px)',
          }}>
            {product.details.primary_category}
          </div>
        )}

        {/* Availability badge */}
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.88)', border: `1px solid ${product.in_stock ? '#3a6a3a55' : '#6a3a3a55'}`, padding: '3px 8px', backdropFilter: 'blur(6px)' }}>
          <span style={{ fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, color: product.in_stock ? '#3a6a3a' : '#6a3a3a' }}>
            {product.in_stock ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.gold, fontWeight: 500, marginBottom: '4px' }}>
          {product.attributes?.brand}
        </div>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '16px', fontWeight: 400, color: t.text, lineHeight: 1.25, marginBottom: '4px' }}>
          {product.title}
        </div>
        <div style={{ fontSize: '10px', color: '#525258', fontWeight: 300, letterSpacing: '0.03em', marginBottom: '10px' }}>
          {[product.attributes?.caliber, product.attributes?.action].filter(Boolean).join(' · ')}
        </div>
        <div style={{ height: '1px', background: t.border, marginBottom: '10px', marginTop: 'auto' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: product.in_stock ? 'space-between' : 'flex-end', gap: '8px' }}>
          {product.in_stock && (
            <div style={{
              fontSize: product.contact_for_pricing ? '9px' : '14px',
              fontWeight: product.contact_for_pricing ? 400 : 500,
              color: product.contact_for_pricing ? t.gold : t.text,
              letterSpacing: product.contact_for_pricing ? '0.04em' : '0.01em',
              lineHeight: 1.3,
            }}>
              {product.contact_for_pricing ? 'Contact Us For Pricing' : product.price !== null ? fmt(product.price) : '—'}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={handleHeartClick}
              title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: wishlisted ? '#c0392b' : t.textMuted, opacity: hov || wishlisted ? 1 : 0.55, transition: 'all 0.2s' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            {!product.in_stock || product.contact_for_pricing ? (
              <button
                onClick={handleViewDetails}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, color: t.gold, borderBottom: `1px solid ${t.gold}55`, paddingBottom: '1px', opacity: hov ? 1 : 0.65, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}
              >
                View Details
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                style={{
                  background: addedToCart ? t.gold : 'transparent',
                  border: `1px solid ${t.gold}`,
                  color: addedToCart ? '#fff' : t.gold,
                  fontSize: '7.5px', letterSpacing: '0.12em', textTransform: 'uppercase',
                  fontWeight: 600, padding: '4px 8px', cursor: 'pointer',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >
                {addedToCart ? 'Added ✓' : 'Add to Cart'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
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
  const modelSeries  = brand?.modelSeries ?? []
  const gallery      = (brand?.gallery ?? []).filter(g => g.image)
  const timeline     = brand?.timeline ?? []

  return (
    <div style={{ background: t.bg, minHeight: '100vh' }}>

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${t.border}`, padding: '12px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-inter)', fontWeight: 300, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: t.textDim, textDecoration: 'none' }}>Home</Link>
          <span style={{ color: t.border }}>›</span>
          <Link href="/resources-on-guns" style={{ color: t.textDim, textDecoration: 'none' }}>Resources on Guns</Link>
          <span style={{ color: t.border }}>›</span>
          <span style={{ color: t.text }}>{brandName}</span>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: heroUrl ? 'clamp(260px,50vw,480px)' : '220px', overflow: 'hidden', background: heroUrl ? undefined : t.bgSurface }}>
        {heroUrl && <Image src={heroUrl} alt={brandName} fill style={{ objectFit: 'cover' }} priority />}
        <div style={{ position: 'absolute', inset: 0, background: heroUrl ? 'linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.58) 100%)' : 'none' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '0 24px 44px', textAlign: 'center' }}>
          {logoUrl && (
            <div style={{ width: '110px', height: '110px', position: 'relative', marginBottom: '14px', filter: heroUrl ? 'brightness(0) invert(1)' : undefined }}>
              <Image src={logoUrl} alt={brandName} fill style={{ objectFit: 'contain' }} />
            </div>
          )}
          <div style={{ fontSize: '8.5px', letterSpacing: '0.28em', textTransform: 'uppercase', color: heroUrl ? 'rgba(255,255,255,0.65)' : t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '8px' }}>
            Resources on Guns
          </div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(26px,5vw,52px)', fontWeight: 400, color: heroUrl ? '#fff' : t.text, margin: '0 0 10px', lineHeight: 1.1 }}>
            {brandName}
          </h1>
          {brand?.tagline && (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'clamp(13px,2vw,15px)', fontWeight: 300, color: heroUrl ? 'rgba(255,255,255,0.8)' : t.textDim, margin: 0, maxWidth: '540px', lineHeight: 1.6 }}>
              {brand.tagline}
            </p>
          )}
        </div>
      </div>

      {/* ── Brand meta bar ───────────────────────────────────────────────── */}
      {(brand?.origin || brand?.foundingYear) && (
        <div style={{ borderBottom: `1px solid ${t.border}`, background: t.bgSurface }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px 24px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
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

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

        {/* ── History / Overview ───────────────────────────────────────── */}
        {(brand?.description || hasHistory) && (
          <section className="rp-section-first">
            {!hasHistory && brand?.description && (
              <p style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.85, color: t.text, fontFamily: 'var(--font-inter)', margin: 0 }}>{brand.description}</p>
            )}
            {hasHistory && histNodes.map((n, i) => <LexBlock key={i} node={n} />)}
          </section>
        )}

        {/* ── Timeline ─────────────────────────────────────────────────── */}
        {timeline.length > 0 && (
          <section className="rp-section">
            <SectionHead eyebrow={brandName} title="History & Milestones" />
            <div style={{ maxWidth: '700px' }}>
              {timeline.map((item, i) => (
                <TimelineEntry key={item.id} item={item} isLast={i === timeline.length - 1} />
              ))}
            </div>
          </section>
        )}

        {/* ── Resource Pages (models, topics, specs) ───────────────────── */}
        {hasResources && (
          <section className="rp-section">
            <SectionHead eyebrow={brandName} title="Models & Reference Pages" />
            <div className="rp-resource-grid">
              {resourcePages.map(p => <ResourceCard key={p.id} page={p} brandSlug={slug} />)}
            </div>
          </section>
        )}

        {/* ── Model Series / Product Lines ─────────────────────────────── */}
        {modelSeries.length > 0 && (
          <section className="rp-section">
            <SectionHead eyebrow={brandName} title="Model Series & Product Lines" />
            <div className="rp-series-grid">
              {modelSeries.map(s => <ModelSeriesCard key={s.id} series={s} />)}
            </div>
          </section>
        )}

        {/* ── Photo Gallery ────────────────────────────────────────────── */}
        {gallery.length > 0 && <GallerySection items={gallery} eyebrow={brandName} />}

        {/* ── Blog Articles ────────────────────────────────────────────── */}
        {hasArticles && (
          <section className="rp-section">
            <SectionHead
              eyebrow={brandName}
              title="Articles & Features"
              action={
                <Link href="/articles" style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: t.gold, textDecoration: 'none', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
                  All Articles →
                </Link>
              }
            />
            <div className="rp-article-grid">
              {articles.map(p => <ArticleCard key={p.id} post={p} />)}
            </div>
          </section>
        )}

        {/* ── Available for Purchase ───────────────────────────────────── */}
        {hasProducts && (
          <section className="rp-section-last">
            <SectionHead
              eyebrow={brandName}
              title="Available for Purchase"
              action={
                <Link href={`/brand/${slug}`} style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: t.gold, textDecoration: 'none', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
                  Shop All →
                </Link>
              }
            />
            <div className="rp-product-grid">
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
