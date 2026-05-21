import { getProducts, getCollections, getCategories } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import HomePage from "@/components/home/HomePage"

export const revalidate = 60

const FALLBACK_HERO = {
  label: "Featured Piece",
  title: "Nighthawk Custom Agent",
  caliber: ".45 ACP" as string | null,
  action: "Single Action" as string | null,
  price: 3499 as number | null,
  contactForPricing: false,
  handle: null as string | null,
}

const FALLBACK_COLLECTIONS = [
  { id: "1", name: "1911 Series"        },
  { id: "2", name: "Heritage Revolvers"  },
  { id: "3", name: "Modern Classics"    },
  { id: "4", name: "Presentation Grade" },
]

const FALLBACK_CATEGORIES = [
  { id: "1", name: "Engraved"        },
  { id: "2", name: "Limited Edition" },
  { id: "3", name: "Prototype"       },
  { id: "4", name: "Competition"     },
]

export default async function Home() {
  const [productsRes, collectionsRes, categoriesRes] = await Promise.allSettled([
    getProducts({
      order: "-created_at",
      limit: "8",
      fields: "+variants,+variants.prices,+images,+categories",
    }),
    getCollections(),
    getCategories(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawProducts = productsRes.status === "fulfilled" ? (productsRes.value.products ?? []) : []
  const products = rawProducts.map(mapMedusaProduct)

  const collections = collectionsRes.status === "fulfilled"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (collectionsRes.value.collections ?? []).map((c: any) => ({ id: c.id as string, name: (c.title ?? c.name) as string }))
    : FALLBACK_COLLECTIONS

  const categories = categoriesRes.status === "fulfilled"
    ? (categoriesRes.value.product_categories ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((c: any) => !c.parent_category_id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((c: any) => ({ id: c.id as string, name: c.name as string }))
    : FALLBACK_CATEGORIES

  const first = products[0]
  const heroProduct = first
    ? {
        label: "Featured Piece",
        title: first.title,
        caliber: first.attributes.caliber,
        action: first.attributes.action,
        price: first.price,
        contactForPricing: first.contact_for_pricing,
        handle: first.handle,
      }
    : FALLBACK_HERO

  return (
    <HomePage
      heroProduct={heroProduct}
      products={products}
      collections={collections}
      categories={categories}
    />
  )
}
