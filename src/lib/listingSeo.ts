const TAIL_FULL = 'Rare, collectible, and historically significant firearms curated for the serious collector.'
const TAIL_SHORT = 'Rare, collectible, and historically significant firearms.'
const MIN_DESCRIPTION = 110
const MAX_DESCRIPTION = 160

// Appends as much of `tail` as fits after `lead` (at a word boundary) without
// exceeding MAX_DESCRIPTION — only reached for names long enough that even
// TAIL_SHORT would push past the limit.
function truncateTail(lead: string, tail: string): string {
  const budget = MAX_DESCRIPTION - lead.length - 1
  if (budget <= 0) return lead.slice(0, MAX_DESCRIPTION)
  let out = ''
  for (const word of tail.split(' ')) {
    const candidate = `${out} ${word}`.trim()
    if (candidate.length > budget) break
    out = candidate
  }
  out = out.replace(/[.,;:\s]+$/, '')
  return out ? `${lead} ${out}.` : lead
}

// Shared title/description template for brand, category, model, and collection
// listing pages — these all previously used a static, near-identical one-liner
// with no "for sale"/"shop" language and no per-page differentiation. Builds
// both from just the resolved name, so every page gets real copy without
// anyone maintaining it by hand, and always lands within the 110–160 character
// range search engines display in full (tries the longer tail first for short
// names, falls back to a shorter one — and finally a truncated one — as the
// name gets longer).
//
// `bareNoun`: pass true when `heading` already reads as a plural noun on its
// own (category names like "Rifles", "Handguns") — false when it needs
// "firearms" appended to read naturally (brand names, model numbers).
export function buildListingMeta(heading: string, opts?: { bareNoun?: boolean }) {
  const subject = opts?.bareNoun ? heading : `${heading} firearms`
  const lead = `Shop ${subject} for sale at Luxus Collection.`

  const title = `${heading} | Luxus Collection Firearms for Sale`

  let description = `${lead} ${TAIL_FULL}`
  if (description.length > MAX_DESCRIPTION) description = `${lead} ${TAIL_SHORT}`
  if (description.length > MAX_DESCRIPTION) description = truncateTail(lead, TAIL_SHORT)
  // Every real page name produces a description well past MIN_DESCRIPTION
  // once a tail is attached — this only matters for a pathological
  // (near-160-char) name where truncateTail has nothing left to add.
  if (description.length < MIN_DESCRIPTION) description = `${lead} ${TAIL_SHORT}`.slice(0, MAX_DESCRIPTION)

  return { title, description }
}
