import { getBrands, getBrandsForSearch, getAllResourcePagesForSearch } from "@/lib/payload"
import ResourcesHubPage from "./ResourcesHubPage"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Resources on Guns | Luxus Collection",
  description: "Deep dives into the history, engineering, and craftsmanship of the world's finest firearms manufacturers.",
}

export const revalidate = 300

export default async function Page() {
  const [brands, brandsForSearch, resourcePages] = await Promise.all([
    getBrands({ hubOnly: true }).catch(() => []),
    getBrandsForSearch().catch(() => []),
    getAllResourcePagesForSearch().catch(() => []),
  ])
  return <ResourcesHubPage brands={brands} brandsForSearch={brandsForSearch} resourcePages={resourcePages} />
}
