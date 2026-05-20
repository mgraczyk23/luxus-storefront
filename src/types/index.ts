// ── Medusa native types (extended) ───────────────────────────────────────────

export type ProductHighlight = {
  title: string
  body: string
}

export type ProductMetadata = {
  highlights?: ProductHighlight[]
  in_the_box?: string[]
  extra_specs?: Record<string, string>
}

// ── Custom module response shapes ─────────────────────────────────────────────

export type ProductDetail = {
  id: string
  short_description: string | null
  optics_ready: boolean
  contact_for_pricing: boolean
  primary_category: string | null
  engraver: string | null
  seo_meta_title: string | null
  seo_meta_description: string | null
}

export type SpecRow = {
  label: string
  value: string
}

export type ProductSpecsResponse = {
  specs: SpecRow[] | null
}

export type ProductDetailsResponse = {
  product_detail: ProductDetail | null
}

export type AttributeValue = {
  id: string
  value: string
  attribute_type: {
    id: string
    name: string
    slug: string
  }
}

export type ProductAttributesResponse = {
  attribute_values: AttributeValue[]
}
