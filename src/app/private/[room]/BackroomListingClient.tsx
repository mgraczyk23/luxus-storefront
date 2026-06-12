'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MappedProduct } from '@/lib/medusa'

const GOLD   = "#7e5e10"
const BORDER = "#e4e4e6"
const MUTED  = "#525258"

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)

function PrivateCard({ product, room }: { product: MappedProduct; room: string }) {
  const [hov, setHov] = useState(false)
  const img = product.images[0] ?? product.thumbnail

  return (
    <Link
      href={`/private/${room}/${product.handle}`}
      style={{ textDecoration: "none", display: "block" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{
        border: `1px solid ${hov ? "#c8c8cc" : BORDER}`,
        borderRadius: "2px",
        overflow: "hidden",
        background: "#fff",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: hov ? "0 4px 16px rgba(0,0,0,0.06)" : "none",
        cursor: "pointer",
      }}>
        <div style={{ position: "relative", width: "100%", paddingTop: "75%", background: "#f5f5f7" }}>
          {img ? (
            <Image
              src={img}
              alt={product.title}
              fill
              style={{ objectFit: "contain", padding: "12px" }}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" opacity="0.15">
                <rect x="2" y="2" width="32" height="32" rx="1" stroke="#888" strokeWidth="1"/>
                <circle cx="12" cy="12" r="4" stroke="#888" strokeWidth="1"/>
                <path d="M2 26L12 16L18 22L26 12L34 22V34H2V26Z" stroke="#888" strokeWidth="1"/>
              </svg>
            </div>
          )}
          {!product.in_stock && (
            <div style={{
              position: "absolute", top: "10px", right: "10px",
              background: "rgba(255,255,255,0.92)", border: `1px solid ${BORDER}`,
              padding: "3px 8px", fontSize: "9px",
              letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED,
            }}>
              Sold
            </div>
          )}
        </div>

        <div style={{ padding: "14px 16px", borderTop: `1px solid ${BORDER}` }}>
          {product.attributes.brand && (
            <div style={{
              fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase",
              color: GOLD, fontWeight: 500, marginBottom: "4px",
            }}>
              {product.attributes.brand}
            </div>
          )}
          <div style={{
            fontSize: "14px", fontWeight: 400, color: "#1a1a1a",
            fontFamily: "var(--font-playfair), serif",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            marginBottom: "6px",
          }}>
            {product.title}
          </div>
          {product.attributes.caliber && (
            <div style={{ fontSize: "10px", color: MUTED, marginBottom: "8px", letterSpacing: "0.04em" }}>
              {product.attributes.caliber}
            </div>
          )}
          <div style={{ fontSize: "14px", fontWeight: 500, color: product.contact_for_pricing ? GOLD : "#1a1a1a" }}>
            {product.contact_for_pricing
              ? "Contact for pricing"
              : product.price !== null ? fmt(product.price) : "—"
            }
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function PrivateListingClient({
  room,
  roomName,
  products,
}: {
  room: string
  roomName: string
  products: MappedProduct[]
}) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = useCallback(async () => {
    setLoggingOut(true)
    await fetch("/api/backroom/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room }),
    })
    router.push(`/private/${room}/login`)
  }, [room, router])

  return (
    <div style={{ padding: "52px 40px 80px", maxWidth: "1440px", margin: "0 auto" }}>

      <div style={{ marginBottom: "40px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{
            fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase",
            color: GOLD, marginBottom: "10px", fontWeight: 500,
          }}>
            Private Collection
          </div>
          <h1 style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: "34px", fontWeight: 400, color: "#1a1a1a",
            margin: 0, letterSpacing: "0.01em",
          }}>
            {roomName}
          </h1>
          <p style={{ fontSize: "12px", color: MUTED, margin: "8px 0 0", letterSpacing: "0.04em" }}>
            {products.length} {products.length === 1 ? "item" : "items"}
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            background: "transparent",
            border: `1px solid ${BORDER}`,
            color: MUTED,
            padding: "8px 18px",
            fontSize: "10px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
            borderRadius: "2px",
            transition: "border-color 0.15s, color 0.15s",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {loggingOut ? "…" : "Sign Out"}
        </button>
      </div>

      <div style={{ height: "1px", background: BORDER, marginBottom: "40px" }} />

      {products.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "80px 0",
          color: "#ccc", fontSize: "15px",
          fontFamily: "var(--font-playfair), serif", fontStyle: "italic",
        }}>
          No items in this collection at this time.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
          {products.map(p => (
            <PrivateCard key={p.id} product={p} room={room} />
          ))}
        </div>
      )}
    </div>
  )
}
