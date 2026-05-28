'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/context/ThemeContext'
import {
  parseLexical, imageUrl,
  type PayloadBrandFull, type PayloadResourcePage, type PayloadSpecTable,
  type LexNode, type LexInline,
} from '@/lib/payload'

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

/* ── Spec table ──────────────────────────────────────────────────────────── */
function SpecTable({ spec }: { spec: PayloadSpecTable }) {
  const { t } = useTheme()
  if (!spec.entries?.length) return null
  return (
    <div style={{ marginBottom: '40px' }}>
      {spec.heading && (
        <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 400, color: t.text, marginBottom: '6px', marginTop: 0, lineHeight: 1.3 }}>
          {spec.heading}
        </h3>
      )}
      {spec.note && (
        <p style={{ fontSize: '14px', fontWeight: 300, color: t.textDim, fontFamily: 'var(--font-inter)', lineHeight: 1.65, marginBottom: '14px', marginTop: 0 }}>
          {spec.note}
        </p>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-inter)' }}>
        <tbody>
          {spec.entries.map((entry, i) => (
            <tr key={entry.id ?? i} style={{ borderBottom: `1px solid ${t.border}` }}>
              <td style={{ padding: '10px 14px 10px 0', fontSize: '12.5px', fontWeight: 500, color: t.textDim, width: '38%', verticalAlign: 'top', letterSpacing: '0.02em' }}>
                {entry.label}
              </td>
              <td style={{ padding: '10px 0', fontSize: '13.5px', fontWeight: 300, color: t.text, verticalAlign: 'top', lineHeight: 1.55 }}>
                {entry.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Sidebar navigation ──────────────────────────────────────────────────── */
function SidebarNav({ siblings, brandSlug, brandName }: { siblings: PayloadResourcePage[]; brandSlug: string; brandName: string }) {
  const { t } = useTheme()
  if (!siblings.length) return null
  return (
    <div style={{ border: `1px solid ${t.border}`, padding: '24px', position: 'sticky', top: '24px' }}>
      <div style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '16px' }}>
        More on {brandName}
      </div>
      <nav>
        {siblings.map(p => (
          <Link
            key={p.id}
            href={`/resources-on-guns/${brandSlug}/${p.slug}`}
            style={{ display: 'block', padding: '8px 0', borderBottom: `1px solid ${t.border}`, textDecoration: 'none', fontSize: '13px', fontFamily: 'var(--font-inter)', fontWeight: 300, color: t.textDim, lineHeight: 1.45 }}
          >
            {p.title}
          </Link>
        ))}
      </nav>
      <div style={{ marginTop: '20px' }}>
        <Link
          href={`/resources-on-guns/${brandSlug}`}
          style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.gold, textDecoration: 'none', fontFamily: 'var(--font-inter)', fontWeight: 500 }}
        >
          ← All {brandName} Resources
        </Link>
      </div>
    </div>
  )
}

/* ── Main export ─────────────────────────────────────────────────────────── */
export default function ResourceArticlePage({
  page,
  brand,
  siblings,
  brandSlug,
}: {
  page: PayloadResourcePage
  brand: PayloadBrandFull | null
  siblings: PayloadResourcePage[]
  brandSlug: string
}) {
  const { t } = useTheme()
  const [isMobile] = useState(false) // will rely on CSS grid auto-collapse

  const heroUrl    = imageUrl(page.featuredImage)
  const brandName  = brand?.name ?? (typeof page.brand === 'object' ? page.brand.name : brandSlug)
  const nodes      = parseLexical(page.content)
  const hasSpecs   = (page.specs?.length ?? 0) > 0
  const hasContent = nodes.length > 0

  return (
    <div style={{ background: t.bg, minHeight: '100vh' }}>
      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${t.border}`, padding: '12px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-inter)', fontWeight: 300, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: t.textDim, textDecoration: 'none' }}>Home</Link>
          <span style={{ color: t.border }}>›</span>
          <Link href="/resources-on-guns" style={{ color: t.textDim, textDecoration: 'none' }}>Resources on Guns</Link>
          <span style={{ color: t.border }}>›</span>
          <Link href={`/resources-on-guns/${brandSlug}`} style={{ color: t.textDim, textDecoration: 'none' }}>{brandName}</Link>
          <span style={{ color: t.border }}>›</span>
          <span style={{ color: t.text }}>{page.title}</span>
        </div>
      </div>

      {/* ── Hero image ───────────────────────────────────────────────────── */}
      {heroUrl && (
        <div style={{ position: 'relative', height: 'clamp(240px, 40vw, 520px)', overflow: 'hidden' }}>
          <Image src={heroUrl} alt={page.title} fill style={{ objectFit: 'cover' }} priority />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />
        </div>
      )}

      {/* ── Title block ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: heroUrl ? '48px 24px 0' : '48px 24px 0' }}>
        <div style={{ fontSize: '8.5px', letterSpacing: '0.25em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '12px' }}>
          {brandName} · Resources on Guns
        </div>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 400, color: t.text, margin: '0 0 20px', lineHeight: 1.1 }}>
          {page.title}
        </h1>
        {page.excerpt && (
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '17px', fontWeight: 300, color: t.textDim, lineHeight: 1.7, margin: '0 0 32px', maxWidth: '680px' }}>
            {page.excerpt}
          </p>
        )}
        <hr style={{ border: 'none', borderTop: `1px solid ${t.border}`, margin: '0 0 48px' }} />
      </div>

      {/* ── Content + Sidebar layout ─────────────────────────────────────── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px', display: 'grid', gridTemplateColumns: siblings.length > 0 ? 'minmax(0,1fr) 280px' : '1fr', gap: '56px', alignItems: 'start' }}>

        {/* ── Main body ────────────────────────────────────────────────── */}
        <div>
          {/* Article content */}
          {hasContent && (
            <section>
              {nodes.map((n, i) => <LexBlock key={i} node={n} />)}
            </section>
          )}

          {/* Specification tables */}
          {hasSpecs && (
            <section style={{ marginTop: hasContent ? '56px' : 0 }}>
              <div style={{ paddingBottom: '14px', borderBottom: `1px solid ${t.border}`, marginBottom: '32px' }}>
                <div style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '6px' }}>
                  Specifications
                </div>
                <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '26px', fontWeight: 400, color: t.text, margin: 0 }}>
                  Technical Data
                </h2>
              </div>
              {page.specs.map((spec, i) => <SpecTable key={spec.id ?? i} spec={spec} />)}
            </section>
          )}

          {/* Shop CTA */}
          <div style={{ marginTop: '56px', padding: '28px 32px', border: `1px solid ${t.border}`, background: t.bgSurface, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '6px' }}>
                Interested in {brandName}?
              </div>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', fontWeight: 300, color: t.textDim, margin: 0, lineHeight: 1.6 }}>
                Browse our current {brandName} inventory, available for purchase.
              </p>
            </div>
            <Link
              href={`/brand/${brandSlug}`}
              style={{ display: 'inline-block', padding: '12px 32px', border: `1px solid ${t.gold}`, color: t.gold, fontFamily: 'var(--font-inter)', fontSize: '9.5px', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              Shop {brandName} →
            </Link>
          </div>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        {siblings.length > 0 && (
          <aside>
            <SidebarNav siblings={siblings} brandSlug={brandSlug} brandName={brandName} />
          </aside>
        )}
      </div>
    </div>
  )
}
