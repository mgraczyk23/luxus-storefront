'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/context/ThemeContext'
import { imageUrl, type PayloadBrand, type PayloadBrandForSearch, type PayloadResourcePageSummary } from '@/lib/payload'

function BrandCard({ brand }: { brand: PayloadBrand }) {
  const { t } = useTheme()
  const [hov, setHov] = useState(false)
  const logoUrl = imageUrl(brand.logo)

  return (
    <Link href={`/resources-on-guns/${brand.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          border: `1px solid ${hov ? t.gold + '80' : t.border}`,
          padding: '32px 28px',
          transition: 'border-color 0.25s, box-shadow 0.25s',
          boxShadow: hov ? '0 8px 32px rgba(0,0,0,0.06)' : 'none',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: t.bg,
        }}
      >
        {/* Logo / placeholder */}
        <div style={{ height: '52px', display: 'flex', alignItems: 'center' }}>
          {logoUrl ? (
            <div style={{ position: 'relative', width: '120px', height: '48px' }}>
              <Image src={logoUrl} alt={brand.name} fill style={{ objectFit: 'contain', objectPosition: 'left center' }} />
            </div>
          ) : (
            <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 600 }}>{brand.name}</div>
          )}
        </div>

        {/* Name + origin */}
        <div>
          {logoUrl && (
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 400, color: hov ? t.gold : t.text, margin: '0 0 4px', lineHeight: 1.2, transition: 'color 0.22s' }}>
              {brand.name}
            </h2>
          )}
          {brand.origin && (
            <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: t.textDim, fontFamily: 'var(--font-inter)', fontWeight: 400 }}>
              {brand.foundingYear ? `Est. ${brand.foundingYear} · ` : ''}{brand.origin}
            </div>
          )}
        </div>

        {/* Description */}
        {(brand.tagline || brand.description) && (
          <p style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.75, color: t.textDim, fontFamily: 'var(--font-inter)', margin: 0, flex: 1 }}>
            {(brand.tagline || brand.description)?.slice(0, 140)}{((brand.tagline || brand.description)?.length ?? 0) > 140 ? '…' : ''}
          </p>
        )}

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'auto', paddingTop: '4px' }}>
          <span style={{ fontSize: '9.5px', letterSpacing: '0.16em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
            Explore {brand.name}
          </span>
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none" style={{ transform: hov ? 'translateX(3px)' : 'none', transition: 'transform 0.2s' }}>
            <path d="M1 5H11M7 1L11 5L7 9" stroke={t.gold} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </Link>
  )
}

type SearchResult =
  | { type: 'brand';   brand: PayloadBrand }
  | { type: 'series';  seriesName: string; brandName: string; brandSlug: string }
  | { type: 'catalog'; title: string; brandName: string; brandSlug: string }
  | { type: 'page';    title: string; excerpt: string | null; brandName: string; brandSlug: string; slug: string }

export default function ResourcesHubPage({
  brands,
  brandsForSearch = [],
  resourcePages = [],
}: {
  brands: PayloadBrand[]
  brandsForSearch?: PayloadBrandForSearch[]
  resourcePages?: PayloadResourcePageSummary[]
}) {
  const { t } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')

  const q = searchQuery.trim().toLowerCase()
  const qNorm = q.replace(/[-./\s]+/g, "")
  const norm = (s: string) => s.toLowerCase().replace(/[-./\s]+/g, "")
  const matchQ = (s: string | null | undefined) =>
    !!s && (s.toLowerCase().includes(q) || (qNorm.length >= 2 && norm(s).includes(qNorm)))

  const searchResults: SearchResult[] = q ? (() => {
    const results: SearchResult[] = []
    const seen = new Set<string>()

    // Brand matches
    for (const b of brandsForSearch) {
      if (matchQ(b.name) || matchQ(b.origin) || matchQ(b.tagline) || matchQ(b.description)) {
        const key = `brand:${b.id}`
        if (!seen.has(key)) { seen.add(key); results.push({ type: 'brand', brand: b }) }
      }
      // Model series matches → link to brand profile
      for (const m of b.modelSeries ?? []) {
        if (matchQ(m.name) || matchQ(m.description)) {
          const key = `series:${b.slug}:${m.name}`
          if (!seen.has(key)) {
            seen.add(key)
            const bKey = `brand:${b.id}`
            if (!seen.has(bKey)) { seen.add(bKey); results.push({ type: 'brand', brand: b }) }
            results.push({ type: 'series', seriesName: m.name, brandName: b.name, brandSlug: b.slug })
          }
        }
      }
      // Catalog matches → link to brand profile
      for (const c of b.catalogs ?? []) {
        if (matchQ(c.title)) {
          const key = `catalog:${b.slug}:${c.id}`
          if (!seen.has(key)) {
            seen.add(key)
            const bKey = `brand:${b.id}`
            if (!seen.has(bKey)) { seen.add(bKey); results.push({ type: 'brand', brand: b }) }
            results.push({ type: 'catalog', title: c.title, brandName: b.name, brandSlug: b.slug })
          }
        }
      }
    }

    // Resource page matches
    for (const p of resourcePages) {
      if (matchQ(p.title) || matchQ(p.excerpt) || matchQ(p.brandName)) {
        const key = `page:${p.id}`
        if (!seen.has(key)) { seen.add(key); results.push({ type: 'page', title: p.title, excerpt: p.excerpt, brandName: p.brandName, brandSlug: p.brandSlug, slug: p.slug }) }
      }
    }

    return results
  })() : []

  const filteredBrands = q ? [] : brands

  return (
    <div style={{ background: t.bg, minHeight: '100vh' }}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ background: t.bgSurface, borderBottom: `1px solid ${t.border}`, padding: '72px 24px 60px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '16px' }}>
            Luxus Collection
          </div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(36px,5vw,52px)', fontWeight: 400, color: t.text, margin: '0 0 20px', lineHeight: 1.1 }}>
            Resources on Guns
          </h1>
          <p style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.8, color: t.textDim, fontFamily: 'var(--font-inter)', margin: '0 0 32px' }}>
            Deep dives into the history, engineering, and craftsmanship behind the world&rsquo;s finest firearms manufacturers. Explore model histories, factory stories, and the artisans who build them.
          </p>
          {/* Search */}
          <div style={{ display: 'flex', maxWidth: '420px', margin: '0 auto' }}>
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search manufacturers…"
              style={{ flex: 1, padding: '11px 16px', border: `1px solid ${t.border}`, background: '#fff', color: t.text, fontFamily: 'var(--font-inter)', fontSize: '13px', outline: 'none', letterSpacing: '0.02em' }}
              onFocus={e => e.currentTarget.style.borderColor = t.gold + '80'}
              onBlur={e => e.currentTarget.style.borderColor = t.border}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                style={{ padding: '11px 14px', background: 'none', border: `1px solid ${t.border}`, borderLeft: 'none', color: t.textMuted, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', lineHeight: 1 }}>
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Brand grid / Search results ──────────────────────────────────── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 24px 80px' }}>
        {q ? (
          /* ── Search results ── */
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 400, color: t.text, margin: 0 }}>
                Results for &ldquo;{searchQuery}&rdquo;
              </h2>
              <span style={{ fontSize: '11px', color: t.textDim, fontWeight: 300 }}>
                <span style={{ color: t.text, fontWeight: 400 }}>{searchResults.length}</span> {searchResults.length === 1 ? 'result' : 'results'}
              </span>
            </div>
            {searchResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', border: `1px solid ${t.border}` }}>
                {searchResults.map((r, i) => {
                  if (r.type === 'brand') {
                    return (
                      <Link key={`b-${r.brand.id}`} href={`/resources-on-guns/${r.brand.slug}`} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: '#fff', borderBottom: i < searchResults.length - 1 ? `1px solid ${t.border}` : 'none', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.gold, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '3px' }}>Brand Profile</div>
                            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 400, color: t.text }}>{r.brand.name}</div>
                            {(r.brand.origin || r.brand.foundingYear) && (
                              <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 300, marginTop: '2px' }}>
                                {[r.brand.foundingYear ? `Est. ${r.brand.foundingYear}` : null, r.brand.origin].filter(Boolean).join(' · ')}
                              </div>
                            )}
                          </div>
                          <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ color: t.textDim, flexShrink: 0 }}><path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      </Link>
                    )
                  }
                  if (r.type === 'series') {
                    return (
                      <Link key={`s-${r.brandSlug}-${r.seriesName}`} href={`/resources-on-guns/${r.brandSlug}`} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: '#fff', borderBottom: i < searchResults.length - 1 ? `1px solid ${t.border}` : 'none', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '2px', border: `1.5px solid ${t.gold}`, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.textDim, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '3px' }}>Model Series — {r.brandName}</div>
                            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 400, color: t.text }}>{r.seriesName}</div>
                          </div>
                          <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ color: t.textDim, flexShrink: 0 }}><path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      </Link>
                    )
                  }
                  if (r.type === 'catalog') {
                    return (
                      <Link key={`cat-${r.brandSlug}-${r.title}`} href={`/resources-on-guns/${r.brandSlug}`} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: '#fff', borderBottom: i < searchResults.length - 1 ? `1px solid ${t.border}` : 'none', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                          <svg width="11" height="13" viewBox="0 0 11 13" fill="none" style={{ flexShrink: 0, color: t.textDim }}>
                            <path d="M1 1h6l3 3v8H1V1z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                            <path d="M7 1v3h3" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M2.5 6.5h6M2.5 8.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                          </svg>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.textDim, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '3px' }}>Product Catalog — {r.brandName}</div>
                            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 400, color: t.text }}>{r.title}</div>
                          </div>
                          <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ color: t.textDim, flexShrink: 0 }}><path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      </Link>
                    )
                  }
                  // type === 'page'
                  return (
                    <Link key={`p-${r.slug}`} href={`/resources-on-guns/${r.brandSlug}/${r.slug}`} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: '#fff', borderBottom: i < searchResults.length - 1 ? `1px solid ${t.border}` : 'none', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: t.border, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.textDim, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '3px' }}>Reference Page — {r.brandName}</div>
                          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 400, color: t.text }}>{r.title}</div>
                          {r.excerpt && <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 300, marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.excerpt}</div>}
                        </div>
                        <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ color: t.textDim, flexShrink: 0 }}><path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', color: t.textDim, fontWeight: 300, marginBottom: '16px' }}>
                  No results found for &ldquo;{searchQuery}&rdquo;
                </div>
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: `1px solid ${t.border}`, padding: '8px 20px', cursor: 'pointer', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.textMuted, fontFamily: 'var(--font-inter)' }}>
                  Clear search
                </button>
              </div>
            )}
          </div>
        ) : brands.length > 0 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '40px' }}>
              <div>
                <div style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '8px' }}>
                  Manufacturer Profiles
                </div>
                <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 400, color: t.text, margin: 0 }}>
                  Featured Manufacturers
                </h2>
              </div>
              <span style={{ fontSize: '11px', color: t.textDim, fontWeight: 300 }}>
                <span style={{ color: t.text, fontWeight: 400 }}>{brands.length}</span> {brands.length === 1 ? 'profile' : 'profiles'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {brands.map(b => <BrandCard key={b.id} brand={b} />)}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', color: t.textDim, fontWeight: 300, marginBottom: '12px' }}>
              Coming Soon
            </div>
            <p style={{ fontSize: '14px', fontWeight: 300, color: t.textDim, fontFamily: 'var(--font-inter)' }}>
              Manufacturer profiles are being built out. Check back soon.
            </p>
          </div>
        )}
      </div>

      {/* ── Browse articles CTA ───────────────────────────────────────────── */}
      <div style={{ background: t.bgSurface, borderTop: `1px solid ${t.border}`, padding: '52px 24px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 400, color: t.text, marginBottom: '12px' }}>
            Browse All Articles
          </div>
          <p style={{ fontSize: '14px', fontWeight: 300, color: t.textDim, fontFamily: 'var(--font-inter)', marginBottom: '28px', lineHeight: 1.7 }}>
            Collector&rsquo;s guides, brand spotlights, craft and engineering deep dives — all in our editorial archive.
          </p>
          <Link href="/articles" style={{ display: 'inline-block', padding: '13px 36px', border: `1px solid ${t.gold}`, color: t.gold, fontFamily: 'var(--font-inter)', fontSize: '9.5px', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
            View All Articles
          </Link>
        </div>
      </div>
    </div>
  )
}
