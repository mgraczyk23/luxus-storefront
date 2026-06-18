'use client'

import Link from 'next/link'
import Image from 'next/image'

export type DirectoryItem = {
  name: string
  href: string
  count: number
  imageUrl?: string
}

const PLAYFAIR = "var(--font-playfair), serif"

function DirectoryCard({ item, isBrand }: { item: DirectoryItem; isBrand: boolean }) {
  return (
    <Link href={item.href} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          border: '1px solid #e4e4e6',
          background: '#ffffff',
          transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.borderColor = '#c9a96e'
          el.style.transform = 'translateY(-2px)'
          el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.borderColor = '#e4e4e6'
          el.style.transform = ''
          el.style.boxShadow = ''
        }}
      >
        {/* Image area — 4:3 for collection/category/model (suits iPhone landscape photos); square for brand logos */}
        <div style={{
          aspectRatio: isBrand ? '1 / 1' : '4 / 3',
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: isBrand ? '#f8f7f4' : '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              style={{
                objectFit: isBrand ? 'contain' : 'cover',
                padding: isBrand ? '24px' : '0',
              }}
            />
          ) : (
            <span style={{
              fontSize: '36px',
              fontFamily: PLAYFAIR,
              color: isBrand ? '#c9a96e' : 'rgba(201,169,110,0.45)',
              fontWeight: 400,
              userSelect: 'none',
            }}>
              {item.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '15px 16px 17px' }}>
          <div style={{
            fontSize: '10px',
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: '#1a1a1a',
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            marginBottom: '3px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {item.name}
          </div>
          <div style={{
            fontSize: '9px',
            letterSpacing: '0.06em',
            color: '#9a9a9a',
            fontFamily: "'Inter', sans-serif",
          }}>
            {item.count > 0
              ? `${item.count} ${item.count === 1 ? 'firearm' : 'firearms'}`
              : 'Inquire for availability'}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function ShopByDirectory({
  type,
  title,
  items,
}: {
  type: 'brand' | 'collection' | 'category' | 'model'
  title: string
  items: DirectoryItem[]
}) {
  const isBrand = type === 'brand'

  const typeLabel = items.length === 1
    ? (type === 'category' ? 'category' : type === 'collection' ? 'collection' : type === 'model' ? 'model' : 'brand')
    : (type === 'category' ? 'categories' : type === 'collection' ? 'collections' : type === 'model' ? 'models' : 'brands')

  return (
    <div className="lxs-shop-by-page" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase',
        color: '#9a9a9a', marginBottom: '36px', fontFamily: "'Inter', sans-serif",
      }}>
        <Link href="/" style={{ color: '#9a9a9a', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#7e5e10')}
          onMouseLeave={e => (e.currentTarget.style.color = '#9a9a9a')}>
          Home
        </Link>
        <span style={{ color: '#d0d0d0' }}>›</span>
        <Link href="/shop" style={{ color: '#9a9a9a', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#7e5e10')}
          onMouseLeave={e => (e.currentTarget.style.color = '#9a9a9a')}>
          Shop
        </Link>
        <span style={{ color: '#d0d0d0' }}>›</span>
        <span style={{ color: '#525258' }}>{title}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{
          fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase',
          color: '#7e5e10', fontFamily: "'Inter', sans-serif", fontWeight: 500,
          marginBottom: '10px',
        }}>
          Browse
        </div>
        <h1 style={{
          fontFamily: PLAYFAIR,
          fontSize: 'clamp(28px, 3vw, 36px)',
          fontWeight: 400,
          color: '#1a1a1a',
          margin: 0,
          lineHeight: 1.2,
        }}>
          {title}
        </h1>
        {items.length > 0 && (
          <p style={{
            marginTop: '10px', marginBottom: 0,
            fontSize: '12px', color: '#707076',
            fontFamily: "'Inter', sans-serif", fontWeight: 300,
            letterSpacing: '0.02em',
          }}>
            {items.length} {typeLabel} available
          </p>
        )}
      </div>

      {/* Grid */}
      {items.length > 0 ? (
        <div className="lxs-shop-by-grid" style={{ display: 'grid', gap: '20px' }}>
          {items.map(item => (
            <DirectoryCard key={item.href} item={item} isBrand={isBrand} />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '80px 40px',
          fontSize: '13px', color: '#9a9a9a',
          fontFamily: "'Inter', sans-serif", fontWeight: 300,
          letterSpacing: '0.02em',
        }}>
          No items available at this time.
        </div>
      )}
    </div>
  )
}
