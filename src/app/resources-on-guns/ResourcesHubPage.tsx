'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/context/ThemeContext'
import { imageUrl, type PayloadBrand } from '@/lib/payload'

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

export default function ResourcesHubPage({ brands }: { brands: PayloadBrand[] }) {
  const { t } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')

  const q = searchQuery.trim().toLowerCase()
  const filteredBrands = q
    ? brands.filter(b =>
        b.name?.toLowerCase().includes(q) ||
        b.origin?.toLowerCase().includes(q) ||
        b.tagline?.toLowerCase().includes(q)
      )
    : brands

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

      {/* ── Brand grid ───────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 24px 80px' }}>
        {brands.length > 0 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '40px' }}>
              <div>
                <div style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.gold, fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '8px' }}>
                  Manufacturer Profiles
                </div>
                <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 400, color: t.text, margin: 0 }}>
                  {q ? `Results for "${searchQuery}"` : 'Featured Manufacturers'}
                </h2>
              </div>
              <span style={{ fontSize: '11px', color: t.textDim, fontWeight: 300 }}>
                <span style={{ color: t.text, fontWeight: 400 }}>{filteredBrands.length}</span> {filteredBrands.length === 1 ? 'profile' : 'profiles'}
              </span>
            </div>
            {filteredBrands.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {filteredBrands.map(b => <BrandCard key={b.id} brand={b} />)}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', color: t.textDim, fontWeight: 300, marginBottom: '16px' }}>
                  No profiles found for &ldquo;{searchQuery}&rdquo;
                </div>
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: `1px solid ${t.border}`, padding: '8px 20px', cursor: 'pointer', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.textMuted, fontFamily: 'var(--font-inter)' }}>
                  Clear search
                </button>
              </div>
            )}
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
