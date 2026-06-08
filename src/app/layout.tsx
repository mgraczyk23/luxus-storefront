import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
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

  return {
    title: {
      default: "Luxus Collection — Fine Firearms",
      template: "%s | Luxus Collection",
    },
    description: "A boutique destination for the serious collector. Curating the world's finest production and custom pistols.",
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://luxus-collection.com"),
    openGraph: {
      siteName: "Luxus Collection",
      type: "website",
    },
    icons: {
      icon:     faviconUrl,
      shortcut: faviconUrl,
      apple:    faviconUrl,
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  const ann = settings.announcement
  const annActive = ann.enabled && !!ann.message
  const logoUrl = imageUrl(settings.branding?.logo ?? null) ?? undefined

  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable}`}
      style={annActive ? { '--ann-h': '36px' } as React.CSSProperties : {}}
    >
      <body>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              {annActive && <AnnouncementBar message={ann.message!} link={ann.link} />}
              <Header logoUrl={logoUrl} />
              <main style={{ paddingTop: "calc(68px + var(--ann-h, 0px))" }}>
                {children}
              </main>
              <Footer settings={settings} logoUrl={logoUrl} />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
