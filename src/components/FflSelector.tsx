'use client'

import { useState, useRef, useCallback } from 'react'
import { useTheme } from '@/context/ThemeContext'
import type { FflDealer } from '@/app/api/ffl-search/route'

type Props = {
  onSelect: (dealer: { name: string; address1: string; city: string; state: string; zip: string; phone: string } | null) => void
  selected: { name: string; address1?: string; city: string; state: string; zip?: string } | null
  onManualMode: (active: boolean) => void
}

const TYPE_LABELS: Record<string, string> = {
  "01": "Dealer",
  "02": "Pawnbroker",
  "09": "Dealer",
}

export default function FflSelector({ onSelect, selected, onManualMode }: Props) {
  const { t }   = useTheme()
  const [mode, setMode]     = useState<'search' | 'manual'>('search')
  const [query, setQuery]   = useState('')
  const [zip,   setZip]     = useState('')
  const [state, setState]   = useState('')
  const [results, setResults]   = useState<FflDealer[]>([])
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (params: { zip?: string; q?: string; state?: string }) => {
    setLoading(true)
    setSearched(true)
    try {
      const qs = new URLSearchParams()
      if (params.zip)   qs.set('zip',   params.zip)
      if (params.q)     qs.set('q',     params.q)
      if (params.state) qs.set('state', params.state)
      const res  = await fetch(`/api/ffl-search?${qs}`)
      const data = await res.json()
      setResults(data.dealers ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleZipSearch = () => {
    if (!zip.trim() && !query.trim()) return
    search({ zip: zip.trim() || undefined, q: query.trim() || undefined, state: state.trim() || undefined })
  }

  const handleQueryChange = (v: string) => {
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (v.length < 2) { setResults([]); setSearched(false); return }
    debounceRef.current = setTimeout(() => {
      search({ q: v.trim(), zip: zip.trim() || undefined, state: state.trim() || undefined })
    }, 350)
  }

  const handleSelect = (d: FflDealer) => {
    onSelect({ name: d.bizName, address1: d.street, city: d.city, state: d.state, zip: d.zip5, phone: d.phone })
    setResults([])
    setSearched(false)
  }

  const handleClear = () => {
    onSelect(null)
    setQuery('')
    setZip('')
    setState('')
    setResults([])
    setSearched(false)
  }

  const inp: React.CSSProperties = {
    padding: '10px 13px',
    border: `1px solid ${t.border}`,
    background: '#fff',
    color: t.text,
    fontSize: '13px',
    fontFamily: 'var(--font-inter)',
    fontWeight: 300,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  }

  // ── Selected state ───────────────────────────────────────────────────────────
  if (selected && mode === 'search') {
    return (
      <div style={{ padding: '14px 16px', background: '#f8fdf8', border: `1px solid #b8d4b8`, borderLeft: `2px solid #4a8a4a`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4a8a4a', fontWeight: 600, marginBottom: '4px', fontFamily: 'var(--font-inter)' }}>FFL Dealer Selected</div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: t.text, marginBottom: '2px' }}>{selected.name}</div>
          <div style={{ fontSize: '11px', fontWeight: 300, color: t.textMuted }}>
            {selected.address1 && <>{selected.address1}, </>}{selected.city}, {selected.state}{selected.zip && ` ${selected.zip}`}
          </div>
        </div>
        <button onClick={handleClear} style={{ background: 'none', border: `1px solid #c8c8cc`, color: t.textMuted, padding: '5px 12px', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', cursor: 'pointer', fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = t.gold}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#c8c8cc'}>
          Change
        </button>
      </div>
    )
  }

  // ── Manual entry toggle ──────────────────────────────────────────────────────
  if (mode === 'manual') {
    return (
      <div>
        <button onClick={() => { setMode('search'); onManualMode(false) }} style={{ background: 'none', border: 'none', color: t.gold, fontSize: '10.5px', fontFamily: 'var(--font-inter)', cursor: 'pointer', padding: '0 0 14px', fontWeight: 400, letterSpacing: '0.02em' }}>
          ← Search for dealer instead
        </button>
        <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 300, lineHeight: 1.6 }}>
          Enter your FFL dealer&apos;s information below. We&apos;ll confirm their license before shipping.
        </div>
      </div>
    )
  }

  // ── Search UI ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Search inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginBottom: '10px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <input
            type="text"
            placeholder="Dealer name or city…"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={e => e.currentTarget.style.borderColor = t.gold}
            onBlur={e => e.currentTarget.style.borderColor = t.border}
            style={inp}
          />
        </div>
        <input
          type="text"
          placeholder="ZIP code"
          value={zip}
          maxLength={5}
          onChange={e => { setZip(e.target.value.replace(/\D/g, '')); setResults([]); setSearched(false) }}
          onFocus={e => e.currentTarget.style.borderColor = t.gold}
          onBlur={e => e.currentTarget.style.borderColor = t.border}
          style={inp}
        />
        <input
          type="text"
          placeholder="State (FL)"
          value={state}
          maxLength={2}
          onChange={e => { setState(e.target.value.toUpperCase().replace(/[^A-Z]/g, '')); setResults([]); setSearched(false) }}
          onFocus={e => e.currentTarget.style.borderColor = t.gold}
          onBlur={e => e.currentTarget.style.borderColor = t.border}
          style={inp}
        />
        <button
          onClick={handleZipSearch}
          disabled={!zip.trim() && !query.trim()}
          style={{ padding: '10px 18px', background: t.gold, color: '#fff', border: 'none', fontSize: '9.5px', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', fontWeight: 600, cursor: 'pointer', opacity: (!zip.trim() && !query.trim()) ? 0.5 : 1 }}>
          {loading ? '…' : 'Search'}
        </button>
      </div>

      {/* Results */}
      {loading && (
        <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px', color: t.textDim }}>Searching…</div>
      )}

      {!loading && searched && results.length === 0 && (
        <div style={{ padding: '16px', background: '#fafafa', border: `1px solid ${t.border}`, fontSize: '11.5px', color: t.textMuted, textAlign: 'center' }}>
          No dealers found. Try a different ZIP, city, or dealer name.
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ border: `1px solid ${t.border}`, maxHeight: '280px', overflowY: 'auto' }}>
          {results.map((d, i) => (
            <button
              key={d.id}
              onClick={() => handleSelect(d)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '13px 16px', background: '#fff',
                borderTop: i > 0 ? `1px solid ${t.border}` : 'none',
                border: 'none', cursor: 'pointer', transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#faf7f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: t.text, marginBottom: '2px' }}>{d.bizName}</div>
                  <div style={{ fontSize: '11px', fontWeight: 300, color: t.textMuted }}>
                    {d.street && <>{d.street}, </>}{d.city}, {d.state} {d.zip5}
                    {d.phone && <> · {d.phone}</>}
                  </div>
                </div>
                <span style={{ fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.gold, border: `1px solid ${t.gold}40`, padding: '2px 7px', flexShrink: 0, fontWeight: 500 }}>
                  {TYPE_LABELS[d.licenseType] ?? 'FFL'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Manual fallback */}
      <div style={{ marginTop: '10px', textAlign: 'right' }}>
        <button onClick={() => { setMode('manual'); onManualMode(true) }} style={{ background: 'none', border: 'none', color: t.textMuted, fontSize: '10px', fontFamily: 'var(--font-inter)', cursor: 'pointer', padding: 0, fontWeight: 400, letterSpacing: '0.02em', textDecoration: 'underline', textDecorationColor: `${t.textMuted}60` }}>
          Can&apos;t find my dealer — enter manually
        </button>
      </div>
    </div>
  )
}
