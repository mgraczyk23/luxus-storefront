import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import { headers } from "next/headers"
import ConsentBanner from "@/components/ConsentBanner"
import "./globals.css"
import { ThemeProvider } from "@/context/ThemeContext"
import { AuthProvider } from "@/context/AuthContext"
import { CartProvider } from "@/context/CartContext"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import AnnouncementBar from "@/components/AnnouncementBar"
import { getSiteSettings, imageUrl } from "@/lib/payload"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const faviconUrl = imageUrl(settings.branding?.favicon ?? null) ?? '/favicon.ico'
  const semrush = settings.analytics?.semrushVerification

  return {
    title: {
      default: "Luxus Collection",
      template: "%s",  // no suffix — each page title is used exactly as set
    },
    description: "A boutique destination for the serious collector. Curating the world's finest production and custom pistols.",
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://luxus-collection.com"),
    openGraph: {
      siteName: "Luxus Collection",
      type: "website",
      images: ['/logo.webp'],
    },
    twitter: {
      card: 'summary_large_image',
    },
    icons: {
      icon:     [faviconUrl, { url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      shortcut: faviconUrl,
      apple:    '/apple-touch-icon.png',
    },
    themeColor: '#ffffff',
    ...(semrush ? { other: { 'semrush-site-verification': semrush } } : {}),
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers()
  const isPrivate = h.get("x-is-private") === "1"

  const settings = await getSiteSettings()
  const ann = settings.announcement
  const annActive = !isPrivate && ann.enabled && !!ann.message
  const logoUrl = imageUrl(settings.branding?.logo ?? null) ?? undefined
  const gaId      = settings.analytics?.googleAnalyticsId?.trim() || null
  const phKey     = settings.analytics?.postHogApiKey?.trim() || null
  const klaviyoId = process.env.NEXT_PUBLIC_KLAVIYO_SITE_ID?.trim() || null
  const showCategoryBadge = settings.productCards?.showCategoryBadge !== false

  return (
    <html
      lang="en"
      className={[
        inter.variable,
        playfair.variable,
        !showCategoryBadge ? 'lxs-no-cat-badge' : '',
      ].filter(Boolean).join(' ')}
      style={annActive ? { '--ann-h': '36px' } as React.CSSProperties : {}}
    >
      <body>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              {annActive && <AnnouncementBar message={ann.message!} link={ann.link} />}
              {!isPrivate && <Header logoUrl={logoUrl} />}
              <main style={{ paddingTop: isPrivate ? 0 : "calc(68px + var(--ann-h, 0px))" }}>
                {children}
              </main>
              {!isPrivate && <Footer settings={settings} logoUrl={logoUrl} />}
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>

        <ConsentBanner gaId={gaId} klaviyoId={klaviyoId} phKey={phKey} />
      </body>
    </html>
  )
}
