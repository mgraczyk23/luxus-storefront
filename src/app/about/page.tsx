import type { Metadata } from "next"
import { getAboutPageImages, getBrands } from "@/lib/payload"
import AboutPage from "./AboutPage"

export const metadata: Metadata = {
  title: "About Us",
  description: "Luxus Collection — a boutique destination for the serious collector. Our story, philosophy, and the standard behind every piece we carry.",
}

export default async function Page() {
  const [images, brands] = await Promise.all([
    getAboutPageImages(),
    getBrands({ featuredOnly: true }),
  ])
  return <AboutPage images={images} brands={brands} />
}
