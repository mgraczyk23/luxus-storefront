const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "https://api.luxus-collection.com"
const PK      = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

async function storeFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PK,
      ...(init?.headers ?? {}),
    },
    next: { revalidate: 60, tags: ["products"] },
  })
  if (!res.ok) throw new Error(`Store API error ${res.status}: ${path}`)
  return res.json()
}

// ── Products ──────────────────────────────────────────────────────────────────

export function getProducts(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : ""
  return storeFetch<{ products: any[]; count: number }>(`/store/products${qs}`)
}

export function getProduct(handle: string) {
  return storeFetch<{ products: any[] }>(
    `/store/products?handle=${encodeURIComponent(handle)}&fields=*variants,*variants.prices,*images,*categories,*collection,+metadata,*attribute_values,*attribute_values.attribute_type`
  )
}

// ── Custom module endpoints ───────────────────────────────────────────────────

export function getProductSpecs(productId: string) {
  return storeFetch<{ specs: { label: string; value: string }[] | null }>(
    `/store/products/${productId}/specs`
  )
}

export function getProductDetails(productId: string) {
  return storeFetch<{ product_detail: any | null }>(
    `/store/products/${productId}/details`
  )
}

export function getProductAttributes(productId: string) {
  return storeFetch<{ attribute_values: any[] }>(
    `/store/products/${productId}/attributes`
  )
}

// ── Categories & Collections ──────────────────────────────────────────────────

export function getCategories() {
  return storeFetch<{ product_categories: any[] }>(
    "/store/product-categories?fields=id,name,handle,parent_category_id"
  )
}

export function getCategory(handle: string) {
  return storeFetch<{ product_categories: any[] }>(
    `/store/product-categories?handle=${encodeURIComponent(handle)}`
  )
}

export function getCollections() {
  return storeFetch<{ collections: any[] }>("/store/collections")
}

export function getCollection(handle: string) {
  return storeFetch<{ collections: any[] }>(
    `/store/collections?handle=${encodeURIComponent(handle)}`
  )
}

// ── Cart ──────────────────────────────────────────────────────────────────────

export function createCart(regionId: string) {
  return storeFetch<{ cart: any }>("/store/carts", {
    method: "POST",
    body: JSON.stringify({ region_id: regionId }),
    next: { revalidate: 0 },
  })
}

export function getCart(cartId: string) {
  return storeFetch<{ cart: any }>(`/store/carts/${cartId}`, {
    next: { revalidate: 0 },
  })
}

export function addToCart(cartId: string, variantId: string, quantity = 1) {
  return storeFetch<{ cart: any }>(`/store/carts/${cartId}/line-items`, {
    method: "POST",
    body: JSON.stringify({ variant_id: variantId, quantity }),
    next: { revalidate: 0 },
  })
}

// ── Regions ───────────────────────────────────────────────────────────────────

export function getRegions() {
  return storeFetch<{ regions: any[] }>("/store/regions")
}
