import Header from "@/components/Header"
import Footer from "@/components/Footer"
import AnnouncementBar from "@/components/AnnouncementBar"
import AgeGate from "@/components/AgeGate"
import { getSiteSettings, imageUrl } from "@/lib/payload"

// Public-facing layout: site chrome (announcement bar, header, footer) wraps
// every customer-facing page. The /private rooms use their own bare layout so
// staff views render without this chrome. Keeping request-header reads out of
// the root layout lets these pages render as cached static HTML.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  const ann = settings.announcement
  const annActive = ann.enabled && !!ann.message
  const logoUrl = imageUrl(settings.branding?.logo ?? null) ?? undefined

  return (
    <>
      <AgeGate />
      {annActive && <AnnouncementBar message={ann.message!} link={ann.link} />}
      <Header logoUrl={logoUrl} />
      <main style={{ paddingTop: "calc(68px + var(--ann-h, 0px))" }}>
        {children}
      </main>
      <Footer settings={settings} logoUrl={logoUrl} />
    </>
  )
}
