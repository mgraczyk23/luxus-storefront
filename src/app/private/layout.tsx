import type { ReactNode } from "react"
import { getSiteSettings, imageUrl } from "@/lib/payload"

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings().catch(() => null)
  const logoUrl  = imageUrl(settings?.branding?.logo ?? null) ?? "/logo.png"

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", color: "#1a1a1a", fontFamily: "'Inter', sans-serif" }}>
      <header style={{
        borderBottom: "1px solid #e4e4e6",
        padding: "0 40px",
        height: "68px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "#ffffff",
      }}>
        <a
          href="/"
          style={{
            position: "absolute",
            left: "40px",
            fontSize: "10px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#aaa",
            textDecoration: "none",
          }}
        >
          ← Back to Store
        </a>
        <a href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Luxus Collection"
            style={{ height: "36px", objectFit: "contain" }}
          />
        </a>
      </header>

      {children}
    </div>
  )
}
