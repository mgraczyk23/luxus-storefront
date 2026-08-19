import Link from "next/link"
import Image from "next/image"

// Self-contained branded 404 body. Next.js renders not-found.tsx within the ROOT
// layout (not route-group layouts), so this page has no site header/footer — it
// carries its own logo + CTAs to stay on-brand and navigable. Colors mirror the
// light theme tokens in ThemeContext so it matches without needing client JS.
const t = {
  bg: "#ffffff",
  border: "#e4e4e6",
  gold: "#7e5e10",
  text: "#1a1a1a",
  textMuted: "#525258",
}

export default function NotFoundContent() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "80px 24px",
        background: t.bg,
        fontFamily: "var(--font-inter), sans-serif",
      }}
    >
      <Link href="/" aria-label="Luxus Collection — home" style={{ display: "block", marginBottom: "40px" }}>
        <Image
          src="/logo.webp"
          alt="Luxus Collection"
          width={160}
          height={40}
          priority
          style={{ height: "38px", width: "auto", filter: "brightness(0.68) saturate(1.1)" }}
        />
      </Link>

      <h1
        style={{
          fontFamily: "var(--font-playfair), serif",
          fontWeight: 300,
          fontSize: "clamp(34px, 6vw, 56px)",
          color: t.text,
          lineHeight: 1.1,
          margin: "0 0 16px",
          letterSpacing: "0.01em",
        }}
      >
        Page Not Found
      </h1>

      <p
        style={{
          fontSize: "14px",
          fontWeight: 300,
          color: t.textMuted,
          maxWidth: "460px",
          lineHeight: 1.7,
          margin: "0 0 36px",
          letterSpacing: "0.01em",
        }}
      >
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
        The piece you seek may have found a new home.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "center" }}>
        <Link
          href="/"
          style={{
            padding: "13px 30px",
            background: t.gold,
            color: "#ffffff",
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 600,
            textDecoration: "none",
            borderRadius: "1px",
          }}
        >
          Return Home
        </Link>
        <Link
          href="/shop"
          style={{
            padding: "13px 30px",
            background: "transparent",
            color: t.text,
            border: `1px solid ${t.border}`,
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 600,
            textDecoration: "none",
            borderRadius: "1px",
          }}
        >
          Browse the Collection
        </Link>
      </div>
    </div>
  )
}
