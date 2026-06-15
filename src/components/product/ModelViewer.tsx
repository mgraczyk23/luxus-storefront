'use client'

import { useState } from 'react'
import Script from 'next/script'
import { useTheme } from '@/context/ThemeContext'

// TypeScript declaration for the <model-viewer> custom element
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace React.JSX {
    interface IntrinsicElements {
      'model-viewer': React.HTMLAttributes<HTMLElement> & {
        src?: string
        alt?: string
        ar?: boolean | ''
        'camera-controls'?: boolean | ''
        'auto-rotate'?: boolean | ''
        'shadow-intensity'?: string
        exposure?: string
        'environment-image'?: string
        loading?: 'auto' | 'lazy' | 'eager'
        reveal?: 'auto' | 'interaction' | 'manual'
        style?: React.CSSProperties
      }
    }
  }
}

export default function ModelViewer({ src, title }: { src: string; title?: string }) {
  const { t } = useTheme()
  const [scriptLoaded, setScriptLoaded] = useState(false)

  return (
    <>
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        type="module"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      <div style={{ position: 'relative', aspectRatio: '4/3', background: '#f8f8f8', border: `1px solid ${t.border}`, overflow: 'hidden' }}>

        {/* Loading skeleton until script is ready */}
        {!scriptLoaded && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#f8f8f8' }}>
            <div style={{ width: '32px', height: '32px', border: `2px solid ${t.border}`, borderTopColor: t.gold, borderRadius: '50%', animation: 'spin3d 0.8s linear infinite' }} />
            <span style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.textDim, fontWeight: 500 }}>Loading 3D Model</span>
            <style>{`@keyframes spin3d { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        <model-viewer
          src={src}
          alt={title ?? '3D product model'}
          ar=""
          camera-controls=""
          auto-rotate=""
          shadow-intensity="1"
          exposure="1"
          loading="eager"
          reveal="auto"
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            opacity: scriptLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* 3D badge */}
        <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(255,255,255,0.92)', border: `1px solid ${t.gold}55`, padding: '4px 12px', fontSize: '8.5px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: t.gold, backdropFilter: 'blur(8px)', pointerEvents: 'none' }}>
          3D
        </div>

        {/* AR hint — only on mobile (model-viewer handles visibility automatically) */}
        <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.88)', border: `1px solid ${t.border}`, padding: '5px 14px', backdropFilter: 'blur(4px)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1L10 3.5V8.5L6 11L2 8.5V3.5L6 1Z" stroke={t.textMuted} strokeWidth="1" strokeLinejoin="round"/>
            <path d="M6 1V11M2 3.5L10 8.5M10 3.5L2 8.5" stroke={t.textMuted} strokeWidth="0.7" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: t.textMuted, fontWeight: 500 }}>Drag to rotate · Pinch to zoom</span>
        </div>
      </div>
    </>
  )
}
