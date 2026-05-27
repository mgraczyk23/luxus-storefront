import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/context/ThemeContext"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { getSiteSettings } from "@/lib/payload"

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

export const metadata: Metadata = {
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
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <ThemeProvider>
          <Header />
          <main style={{ paddingTop: "68px" }}>
            {children}
          </main>
          <Footer settings={settings} />
        </ThemeProvider>
      </body>
    </html>
  )
}
