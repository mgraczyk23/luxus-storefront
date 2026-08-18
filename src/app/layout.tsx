import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import Script from "next/script"
import ConsentBanner from "@/components/ConsentBanner"
import GtmLinkTracker from "@/components/GtmLinkTracker"
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
  const gtmId     = settings.analytics?.googleTagManagerId?.trim() || null
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
        {/* Google Tag Manager — loaded unconditionally like Klaviyo above.
            GTM itself is just a script loader and sets no cookies; any tag
            configured inside it that needs consent (e.g. Google Ads) should
            use GTM's own Consent Mode rather than being gated here. */}
        {gtmId && (
          <>
            <Script id="gtm-init" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');`}</Script>
            <noscript>
              <iframe src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
            </noscript>
            <GtmLinkTracker />
          </>
        )}

        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>

        <ConsentBanner gaId={gaId} phKey={phKey} />

        {/* Klaviyo onsite JS — loaded unconditionally so popup forms and
            back-in-stock subscriptions work for all visitors. Form signup
            is the user's explicit consent; no passive tracking fires until
            the visitor interacts with a form. */}
        {klaviyoId && (
          <>
            <Script id="klaviyo-init" strategy="afterInteractive">{`!function(){if(!window.klaviyo){window._klOnsite=window._klOnsite||[];try{window.klaviyo=new Proxy({},{get:function(n,i){return"push"===i?function(){var n;(n=window._klOnsite).push.apply(n,arguments)}:function(){for(var n=arguments.length,o=new Array(n),w=0;w<n;w++)o[w]=arguments[w];var t="function"==typeof o[o.length-1]?o.pop():void 0,e=new Promise((function(n){window._klOnsite.push([i].concat(o,[function(i){t&&t(i),n(i)}]))}));return e}}})}catch(n){window.klaviyo=window.klaviyo||[],window.klaviyo.push=function(){var n;(n=window._klOnsite).push.apply(n,arguments)}}}}();`}</Script>
            <Script
              src={`https://static.klaviyo.com/onsite/js/${klaviyoId}/klaviyo.js?company_id=${klaviyoId}`}
              strategy="afterInteractive"
            />
          </>
        )}
      </body>
    </html>
  )
}
