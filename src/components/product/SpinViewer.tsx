'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'

export default function SpinViewer({ images, title }: { images: string[]; title?: string }) {
  const { t } = useTheme()
  const [frameIndex, setFrameIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const dragStartX = useRef<number | null>(null)
  const startFrame  = useRef(0)
  const total = images.length

  // Preload all frames
  useEffect(() => {
    let done = 0
    images.forEach(src => {
      const img = new window.Image()
      img.onload = () => { done++; if (done === images.length) setLoaded(true) }
      img.onerror = () => { done++; if (done === images.length) setLoaded(true) }
      img.src = src
    })
  }, [images])

  // Subtle auto-spin to reveal the 360° capability (first 6 frames, then stop)
  useEffect(() => {
    if (!loaded) return
    let frame = 0
    const id = setInterval(() => {
      frame++
      setFrameIndex(frame % total)
      if (frame >= 6) clearInterval(id)
    }, 80)
    return () => clearInterval(id)
  }, [loaded, total])

  const onDragStart = useCallback((x: number) => {
    dragStartX.current = x
    startFrame.current = frameIndex
    setIsDragging(true)
    setShowHint(false)
  }, [frameIndex])

  const onDragMove = useCallback((x: number) => {
    if (dragStartX.current === null) return
    const delta = x - dragStartX.current
    // 300px = full 360°
    const frameDelta = Math.round((delta / 300) * total)
    const next = ((startFrame.current - frameDelta) % total + total) % total
    setFrameIndex(next)
  }, [total])

  const onDragEnd = useCallback(() => {
    dragStartX.current = null
    setIsDragging(false)
  }, [])

  return (
    <div
      style={{ position: 'relative', aspectRatio: '4/3', background: '#fff', border: `1px solid ${t.border}`, overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none', touchAction: 'none' }}
      onMouseDown={e => onDragStart(e.clientX)}
      onMouseMove={e => { if (isDragging) onDragMove(e.clientX) }}
      onMouseUp={onDragEnd}
      onMouseLeave={onDragEnd}
      onTouchStart={e => onDragStart(e.touches[0].clientX)}
      onTouchMove={e => { e.preventDefault(); if (isDragging) onDragMove(e.touches[0].clientX) }}
      onTouchEnd={onDragEnd}
    >
      {/* Single image element — src swaps on drag */}
      {loaded ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={images[frameIndex]}
          alt={title ?? '360° product view'}
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '32px', height: '32px', border: `2px solid ${t.border}`, borderTopColor: t.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* 360° badge */}
      <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(255,255,255,0.92)', border: `1px solid ${t.gold}55`, padding: '4px 12px', fontSize: '8.5px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: t.gold, backdropFilter: 'blur(8px)', pointerEvents: 'none' }}>
        360°
      </div>

      {/* Drag hint — fades after first interaction */}
      {showHint && loaded && (
        <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.88)', border: `1px solid ${t.border}`, padding: '5px 14px', backdropFilter: 'blur(4px)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M3 5H11M3 5L5.5 2.5M3 5L5.5 7.5M11 5L8.5 2.5M11 5L8.5 7.5" stroke={t.textMuted} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: t.textMuted, fontWeight: 500 }}>Drag to spin</span>
        </div>
      )}

      {/* Frame counter */}
      <div style={{ position: 'absolute', bottom: 14, right: 14, fontSize: '8px', color: t.textDim, letterSpacing: '0.08em', fontFamily: "'Inter',sans-serif", pointerEvents: 'none' }}>
        {frameIndex + 1} / {total}
      </div>
    </div>
  )
}
