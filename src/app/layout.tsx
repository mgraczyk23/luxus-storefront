import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import ConsentBanner from "@/components/ConsentBanner"
import "./globals.css"
import { ThemeProvider } from "@/context/ThemeContext"
import { AuthProvider } from "@/context/AuthContext"
import { CartProvider } from "@/context/CartContext"
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
    ...(semrush ? { other: { 'semrush-site-verification': semrush } } : {}),
  }
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  const ann = settings.announcement
  const annActive = ann.enabled && !!ann.message
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
              {children}
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>

        <ConsentBanner gaId={gaId} klaviyoId={klaviyoId} phKey={phKey} />
      </body>
    </html>
  )
}
