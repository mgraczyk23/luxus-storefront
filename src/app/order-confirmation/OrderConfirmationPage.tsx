'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { useCart } from '@/context/CartContext'

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'https://api.luxus-collection.com'
const MEDUSA_PK  = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

const fmt = (cents: number, currency = 'usd') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: 2 }).format(cents / 100)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

type ReceiptItem = { id: string; title: string; subtitle?: string; quantity: number; unit_price: number; subtotal: number; thumbnail?: string }
type Receipt = {
  id: string; display_id: number; invoice_number: string; created_at: string
  email: string; currency_code: string
  subtotal: number; shipping_total: number; tax_total: number; total: number
  billing_address: { first_name?: string; last_name?: string; address_1?: string; city?: string; province?: string; postal_code?: string; phone?: string } | null
  items: ReceiptItem[]
  metadata: Record<string, string>
  payment: { approval_code: string; txn_id: string; amount: string }
}

export default function OrderConfirmationPage() {
  const { t } = useTheme()
  const { clearCart } = useCart()
  const params = useSearchParams()
  const ref    = params.get('ref') ?? ''
  const oid    = params.get('oid') ?? ''
  const name   = params.get('name') ?? ''
  const method = params.get('method') ?? 'card'
  const isWire = method === 'wire'

const [receipt, setReceipt] = useState<Receipt | null>(null)

  useEffect(() => {
    if (!isWire) clearCart()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!oid || isWire) return
    fetch(`${MEDUSA_URL}/store/orders/receipt?id=${encodeURIComponent(oid)}`, {
      headers: { 'x-publishable-api-key': MEDUSA_PK },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) setReceipt(d) })
      .catch(() => {})
  }, [oid, isWire])

  const invoiceNumber = receipt?.invoice_number ?? (ref ? `LXC-${String(ref).padStart(6, '0')}` : '')

  const b = receipt?.billing_address
  const m = receipt?.metadata ?? {}

  return (
    <div style={{ background: t.bg, fontFamily: 'var(--font-inter)' }}>
      <style>{`
        @media print {
          header, footer, nav, .lxs-no-print { display: none !important; }
          body { background: #fff !important; }
          .lxs-invoice-wrap { max-width: 100% !important; padding: 0 !important; }
        }
      `}</style>

      {/* ── Print / Save buttons (hidden on print) ── */}
      <div className="lxs-no-print" style={{ borderBottom: `1px solid ${t.border}`, background: '#fff', padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button onClick={() => window.print()}
          style={{ padding: '9px 20px', background: t.gold, border: 'none', color: '#fff', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
          Print / Save PDF
        </button>
        <Link href="/shop"
          style={{ padding: '9px 20px', background: 'none', border: `1px solid ${t.border}`, color: t.text, fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-inter)' }}>
          Continue Shopping
        </Link>
      </div>

      {/* ── Invoice ── */}
      <div className="lxs-invoice-wrap" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px', paddingBottom: '24px', borderBottom: `2px solid ${t.gold}` }}>
          <div>
            <div style={{ fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', color: t.gold, fontWeight: 600, marginBottom: '4px' }}>Luxus Collection</div>
            <div style={{ fontSize: '11px', color: t.textMuted, lineHeight: 1.7 }}>
              luxus-collection.com<br />
              sales@luxus-collection.com
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 300, color: t.text, letterSpacing: '0.02em' }}>Invoice</div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: t.gold, letterSpacing: '0.08em', marginTop: '4px' }}>{invoiceNumber}</div>
            {receipt && <div style={{ fontSize: '11px', color: t.textMuted, marginTop: '4px' }}>{fmtDate(receipt.created_at)}</div>}
          </div>
        </div>

{/* Buyer + FFL columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.gold, fontWeight: 600, marginBottom: '10px' }}>Bill To</div>
            {b ? (
              <div style={{ fontSize: '12px', color: t.text, lineHeight: 1.8 }}>
                <strong>{b.first_name} {b.last_name}</strong><br />
                {b.address_1 && <>{b.address_1}<br /></>}
                {(b.city || b.province || b.postal_code) && <>{b.city}{b.city && b.province ? ', ' : ''}{b.province} {b.postal_code}<br /></>}
                United States<br />
                {b.phone && <>{b.phone}<br /></>}
                {receipt?.email && <>{receipt.email}</>}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: t.text, lineHeight: 1.8 }}>
                {name && <><strong>{name}</strong><br /></>}
                {m.buyer_address1 && <>{m.buyer_address1}<br /></>}
                {m.buyer_city && <>{m.buyer_city}{m.buyer_state ? `, ${m.buyer_state}` : ''} {m.buyer_zip}<br /></>}
              </div>
            )}
          </div>
          {(m.ffl_dealer_name || m.ffl_dealer_address1) && (
            <div>
              <div style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.gold, fontWeight: 600, marginBottom: '10px' }}>FFL Transfer Dealer</div>
              <div style={{ fontSize: '12px', color: t.text, lineHeight: 1.8 }}>
                {m.ffl_dealer_name && <><strong>{m.ffl_dealer_name}</strong><br /></>}
                {m.ffl_dealer_address1 && <>{m.ffl_dealer_address1}<br /></>}
                {m.ffl_dealer_city && <>{m.ffl_dealer_city}{m.ffl_dealer_state ? `, ${m.ffl_dealer_state}` : ''} {m.ffl_dealer_zip}<br /></>}
                {m.ffl_contact_name && <>{m.ffl_contact_name}<br /></>}
                {m.ffl_contact_phone && <>{m.ffl_contact_phone}<br /></>}
                {m.ffl_contact_email && <>{m.ffl_contact_email}</>}
              </div>
            </div>
          )}
        </div>

        {/* Line items */}
        {receipt?.items && receipt.items.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                {['Item', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                  <th key={h} style={{ padding: '8px 12px', fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: t.textDim, fontWeight: 600, textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receipt.items.map(item => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                  <td style={{ padding: '12px', fontSize: '13px', color: t.text }}>
                    <div style={{ fontWeight: 400 }}>{item.title}</div>
                    {item.subtitle && <div style={{ fontSize: '11px', color: t.textMuted, marginTop: '2px' }}>{item.subtitle}</div>}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: t.text, textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: t.text, textAlign: 'right' }}>{fmt(item.unit_price, receipt.currency_code)}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: t.text, textAlign: 'right' }}>{fmt(item.subtotal, receipt.currency_code)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <div style={{ minWidth: '240px' }}>
            {receipt ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px solid ${t.border}`, fontSize: '12px', color: t.textMuted }}>
                  <span>Subtotal</span><span>{fmt(receipt.subtotal, receipt.currency_code)}</span>
                </div>
                {receipt.shipping_total > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px solid ${t.border}`, fontSize: '12px', color: t.textMuted }}>
                    <span>Shipping</span><span>{fmt(receipt.shipping_total, receipt.currency_code)}</span>
                  </div>
                )}
                {receipt.tax_total > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px solid ${t.border}`, fontSize: '12px', color: t.textMuted }}>
                    <span>Tax</span><span>{fmt(receipt.tax_total, receipt.currency_code)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', fontSize: '15px', fontWeight: 500, color: t.text, background: '#fafaf8', border: `1px solid ${t.border}`, borderTop: `2px solid ${t.gold}` }}>
                  <span>Total</span><span>{fmt(receipt.total, receipt.currency_code)}</span>
                </div>
              </>
            ) : (
              <div style={{ padding: '10px 12px', fontSize: '13px', color: t.textMuted, border: `1px solid ${t.border}` }}>Loading order details…</div>
            )}
          </div>
        </div>

        {/* Payment info */}
        <div style={{ padding: '16px', background: '#fafaf8', border: `1px solid ${t.border}`, marginBottom: '32px' }}>
          <div style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.gold, fontWeight: 600, marginBottom: '10px' }}>Payment</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '8px', color: t.textDim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '3px' }}>Method</div>
              <div style={{ fontSize: '12px', color: t.text }}>Credit / Debit Card</div>
            </div>
            {receipt?.payment.approval_code && (
              <div>
                <div style={{ fontSize: '8px', color: t.textDim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '3px' }}>Approval Code</div>
                <div style={{ fontSize: '12px', color: t.text, fontFamily: 'monospace' }}>{receipt.payment.approval_code}</div>
              </div>
            )}
            {receipt?.payment.txn_id && (
              <div>
                <div style={{ fontSize: '8px', color: t.textDim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '3px' }}>Transaction ID</div>
                <div style={{ fontSize: '12px', color: t.text, fontFamily: 'monospace' }}>{receipt.payment.txn_id}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: '8px', color: t.textDim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '3px' }}>Status</div>
              <div style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 500 }}>Approved</div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div style={{ textAlign: 'center', fontSize: '11px', color: t.textMuted, lineHeight: 1.7, borderTop: `1px solid ${t.border}`, paddingTop: '20px' }}>
          All firearms require FFL transfer to a licensed dealer in your state.<br />
          We will contact you within one business day to confirm shipping details.<br />
          Questions? <a href="mailto:sales@luxus-collection.com" style={{ color: t.gold, textDecoration: 'none' }}>sales@luxus-collection.com</a>
        </div>

      </div>
    </div>
  )
}
