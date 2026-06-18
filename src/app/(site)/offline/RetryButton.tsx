'use client'

export default function RetryButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      style={{
        padding: '10px 28px',
        fontSize: '11px',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        fontWeight: 600,
        background: 'transparent',
        border: '1px solid #c09530',
        color: '#c09530',
        cursor: 'pointer',
      }}
    >
      Try Again
    </button>
  )
}
