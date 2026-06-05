import { getProducts, getCollections, getCategories, getProductTags } from "@/lib/api"
import { mapMedusaProduct } from "@/lib/medusa"
import { getPosts, getHeroSlides, getShopTileImages, imageUrl } from "@/lib/payload"
import HomePage from "@/components/home/HomePage"

export const revalidate = false

// Shared fields string — use * prefix (not +) so URLSearchParams encodes it as %2A,
// which Medusa decodes back to * and expands the relation correctly.
const PRODUCT_FIELDS = "*variants,*variants.prices,*variants.inventory_quantity,categories.id,categories.name,categories.handle,+metadata,*tags,*type"

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
  const [productsRes, collectionsRes, categoriesRes, catCountRes, articlesRes, heroSlidesRes, tileImagesRes, tagsRes] = await Promise.allSettled([
    getProducts({ order: "-created_at", limit: "8", fields: PRODUCT_FIELDS }),
    getCollections(),
    getCategories(),
    // Fetch product→category+brand associations to sort categories and derive live brand list
    getProducts({ limit: "200", fields: "id,*categories" }),
    getPosts({ limit: 6, noContent: true }),
    getHeroSlides(),
    getShopTileImages(),
    getProductTags(),
  ])

  // Build count maps from the combined product fetch
  const catCountMap: Record<string, number> = {}
  const brandCountMap: Record<string, number> = {}
  if (catCountRes.status === "fulfilled") {
    for (const p of (catCountRes.value.products ?? [])) {
      // Category counts
      for (const c of (p.categories ?? [])) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const id = (c as any).id as string | undefined
        if (id) catCountMap[id] = (catCountMap[id] ?? 0) + 1
      }
      // Brand counts from attribute_values
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const av of (p.attribute_values ?? [])) {
        if ((av as any).attribute_type?.slug === 'brand' && (av as any).value) {
          const brand = String((av as any).value).trim()
          if (brand) brandCountMap[brand] = (brandCountMap[brand] ?? 0) + 1
        }
      }
    }
  }

  const toSlug = (s: string) => s.toLowerCase()
    .replace(/\s*&\s*/g, '-').replace(/\s+and\s+/g, '-')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

  const brands = Object.entries(brandCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => ({ name, slug: toSlug(name) }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawProducts = productsRes.status === "fulfilled" ? (productsRes.value.products ?? []) : []
  const products = rawProducts.map(mapMedusaProduct).filter(p => !p.is_backroom_hidden)

  const allCollections: { id: string; title?: string; name?: string }[] =
    collectionsRes.status === "fulfilled" ? (collectionsRes.value.collections ?? []) : []

  const allTags = tagsRes.status === "fulfilled" ? tagsRes.value.product_tags : []
  const featuredTag = allTags.find(t => t.value.toLowerCase() === "featured")

  // Primary: query by "Featured" tag (many-to-many — product stays in its own collection)
  // Fallback: featured collection, then newest 4 products
  let featuredProducts = products.slice(0, 4)
  if (featuredTag) {
    const tagRes = await getProducts({
      "tag_id[]": featuredTag.id,
      limit: "4",
      fields: PRODUCT_FIELDS,
    }).catch(() => null)
    if (tagRes?.products?.length) {
      featuredProducts = tagRes.products.map(mapMedusaProduct).filter(p => !p.is_backroom_hidden)
    }
  }
  if (featuredProducts === products.slice(0, 4)) {
    // No tagged products yet — try the featured collection as fallback
    const featuredCollection = allCollections.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => (c.title ?? c.name ?? "").toLowerCase() === "featured"
    )
    if (featuredCollection) {
      const colRes = await getProducts({
        "collection_id[]": featuredCollection.id,
        limit: "4",
        fields: PRODUCT_FIELDS,
      }).catch(() => null)
      if (colRes?.products?.length) {
        featuredProducts = colRes.products.map(mapMedusaProduct).filter(p => !p.is_backroom_hidden)
      }
    }
  }

  const tileImages = tileImagesRes.status === "fulfilled" ? tileImagesRes.value : { collections: {} as Record<string,string>, categories: {} as Record<string,string>, models: {} as Record<string,string> }

  const collections = allCollections
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((c: any) => ({
      id: c.id as string,
      name: (c.title ?? c.name) as string,
      handle: c.handle as string | undefined,
      imageUrl: c.handle ? (tileImages.collections[c.handle as string] ?? undefined) : undefined,
    }))
    .filter(c => c.name.toLowerCase() !== "featured")  // hide "Featured" from browse tabs

  const displayCollections = collections.length > 0 ? collections : FALLBACK_COLLECTIONS

  const categories = categoriesRes.status === "fulfilled"
    ? (categoriesRes.value.product_categories ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((c: any) => !c.parent_category_id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((c: any) => ({
          id: c.id as string,
          name: c.name as string,
          handle: c.handle as string | undefined,
          imageUrl: c.handle ? (tileImages.categories[c.handle as string] ?? undefined) : undefined,
        }))
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

  const articles = articlesRes.status === "fulfilled"
    ? articlesRes.value.docs.map(p => ({
        id:       p.id,
        title:    p.title,
        slug:     p.slug,
        category: p.category,
        excerpt:  p.excerpt,
        date:     p.publishedAt
          ? new Date(p.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
          : "",
        img: imageUrl(p.featuredImage),
      }))
    : []

  const heroSlides = heroSlidesRes.status === "fulfilled" ? heroSlidesRes.value : []

  return (
    <HomePage
      heroProduct={heroProduct}
      heroSlides={heroSlides}
      featuredProducts={featuredProducts}
      newArrivals={newArrivals.length > 0 ? newArrivals : products.slice(0, 4)}
      collections={displayCollections}
      categories={displayCategories}
      articles={articles}
      brands={brands}
    />
  )
}
