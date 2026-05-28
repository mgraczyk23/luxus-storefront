import type { Metadata } from "next"
import { getAboutPageImages, getAboutPageText, getBrands } from "@/lib/payload"
import AboutPage from "./AboutPage"

export const metadata: Metadata = {
  title: "About Us",
  description: "Luxus Collection — a boutique destination for the serious collector. Our story, philosophy, and the standard behind every piece we carry.",
}

export default async function Page() {
  const [images, text, brands] = await Promise.all([
    getAboutPageImages(),
    getAboutPageText(),
    getBrands({ featuredOnly: true }),
  ])
  return <AboutPage images={images} text={text} brands={brands} />
}
