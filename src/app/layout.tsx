import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import Script from "next/script"
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
    },
    icons: {
      icon:     faviconUrl,
      shortcut: faviconUrl,
      apple:    faviconUrl,
    },
    ...(semrush ? { other: { 'semrush-site-verification': semrush } } : {}),
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  const ann = settings.announcement
  const annActive = ann.enabled && !!ann.message
  const logoUrl = imageUrl(settings.branding?.logo ?? null) ?? undefined
  const gaId   = settings.analytics?.googleAnalyticsId?.trim() || null
  const phKey  = settings.analytics?.postHogApiKey?.trim() || null

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

        {/* Google Analytics 4 */}
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}</Script>
          </>
        )}

        {/* PostHog */}
        {phKey && (
          <Script id="posthog-init" strategy="afterInteractive">{`
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.people.toString(20)+" (stub)"},o="init be qs fs gs rq on once off identify createAlias alias set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId setPersonPropertiesForFlags".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||(window.posthog=[]));
            posthog.init('${phKey}', { api_host: 'https://us.i.posthog.com', person_profiles: 'identified_only' });
          `}</Script>
        )}
      </body>
    </html>
  )
}
