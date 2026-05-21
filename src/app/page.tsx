import { getProducts, getCollections, getCategories } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import HomePage from "@/components/home/HomePage"

export const revalidate = 60

// Shared fields string — use * prefix (not +) so URLSearchParams encodes it as %2A,
// which Medusa decodes back to * and expands the relation correctly.
const PRODUCT_FIELDS = "*variants,*variants.prices,*images,*categories,+metadata"

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
  const [productsRes, collectionsRes, categoriesRes, catCountRes] = await Promise.allSettled([
    getProducts({ order: "-created_at", limit: "8", fields: PRODUCT_FIELDS }),
    getCollections(),
    getCategories(),
    // Fetch product→category associations to sort categories by inventory depth
    getProducts({ limit: "500", fields: "id,*categories" }),
  ])

  // Build a count map: categoryId → number of products
  const catCountMap: Record<string, number> = {}
  if (catCountRes.status === "fulfilled") {
    for (const p of (catCountRes.value.products ?? [])) {
      for (const c of (p.categories ?? [])) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const id = (c as any).id as string | undefined
        if (id) catCountMap[id] = (catCountMap[id] ?? 0) + 1
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawProducts = productsRes.status === "fulfilled" ? (productsRes.value.products ?? []) : []
  const products = rawProducts.map(mapMedusaProduct)

  // Look for a collection titled "Featured" to power the Featured Collection section.
  // If it exists, fetch those products; otherwise fall back to newest 4.
  const allCollections: { id: string; title?: string; name?: string }[] =
    collectionsRes.status === "fulfilled" ? (collectionsRes.value.collections ?? []) : []

  const featuredCollection = allCollections.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => (c.title ?? c.name ?? "").toLowerCase() === "featured"
  )

  let featuredProducts = products.slice(0, 4)
  if (featuredCollection) {
    const featuredRes = await getProducts({
      "collection_id[]": featuredCollection.id,
      limit: "4",
      fields: PRODUCT_FIELDS,
    }).catch(() => null)
    if (featuredRes && featuredRes.products?.length) {
      featuredProducts = featuredRes.products.map(mapMedusaProduct)
    }
  }

  const collections = allCollections
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((c: any) => ({ id: c.id as string, name: (c.title ?? c.name) as string }))
    .filter(c => c.name.toLowerCase() !== "featured")  // hide "Featured" from browse tabs

  const displayCollections = collections.length > 0 ? collections : FALLBACK_COLLECTIONS

  const categories = categoriesRes.status === "fulfilled"
    ? (categoriesRes.value.product_categories ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((c: any) => !c.parent_category_id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((c: any) => ({ id: c.id as string, name: c.name as string }))
        .sort((a: { id: string }, b: { id: string }) =>
          (catCountMap[b.id] ?? 0) - (catCountMap[a.id] ?? 0)
        )
    : FALLBACK_CATEGORIES

  const displayCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES

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

  // New arrivals = most recent products not already in the featured set
  const featuredIds = new Set(featuredProducts.map(p => p.id))
  const newArrivals = products.filter(p => !featuredIds.has(p.id)).slice(0, 4)

  return (
    <HomePage
      heroProduct={heroProduct}
      featuredProducts={featuredProducts}
      newArrivals={newArrivals.length > 0 ? newArrivals : products.slice(0, 4)}
      collections={displayCollections}
      categories={displayCategories}
    />
  )
}
