import { getBrands, getBrandsForSearch, getAllResourcePagesForSearch } from "@/lib/payload"
import ResourcesHubPage from "./ResourcesHubPage"
import type { Metadata } from "next"
import { ogMeta } from "@/lib/og"

const title = "Resources on Guns | Luxus Collection"
const description = "Deep dives into the history, engineering, and craftsmanship of the world's finest firearms manufacturers."

export const metadata: Metadata = {
  title,
  description,
  ...ogMeta(title, description, { url: '/resources-on-guns' }),
  alternates: { canonical: '/resources-on-guns' },
}

export const revalidate = 300

export default async function Page() {
  const [brands, brandsForSearch, resourcePages] = await Promise.all([
    getBrands({ hubOnly: true }).catch(() => []),
    getBrandsForSearch().catch(() => []),
    getAllResourcePagesForSearch().catch(() => []),
  ])
  // getBrands() returns its CMS-curated sortOrder (used as-is elsewhere, e.g.
  // the About page's featured-brands carousel) — this page's full manufacturer
  // list is alphabetized instead, on request, to make it easier to scan.
  const alphabeticalBrands = [...brands].sort((a, b) => a.name.localeCompare(b.name))
  return <ResourcesHubPage brands={alphabeticalBrands} brandsForSearch={brandsForSearch} resourcePages={resourcePages} />
}
