const TAIL_FULL = 'Rare, collectible, and historically significant firearms curated for the serious collector.'
const TAIL_SHORT = 'Rare, collectible, and historically significant firearms.'
const MIN_DESCRIPTION = 110
const MAX_DESCRIPTION = 160

// Longest-to-shortest title suffixes, each tried in order — the first one
// that keeps the total at or under MIN_TITLE..MAX_TITLE wins. Consecutive
// suffixes are never more than ~13 chars apart (well under the 20-char-wide
// target window), which guarantees there's no heading length for which every
// tier is either too long or too short — one of them always lands in range.
const TITLE_MIN = 50
const TITLE_MAX = 70
const TITLE_SUFFIXES = [
  ' for Sale | Rare & Collectible | Luxus Collection',
  ' for Sale | Rare Finds | Luxus Collection',
  ' for Sale | Luxus Collection',
  ' | Luxus Collection',
]

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

// Builds a title in [TITLE_MIN, TITLE_MAX] for any heading length by trying
// each suffix tier longest-first. If even the shortest suffix pushes past
// TITLE_MAX (a pathologically long heading), the heading itself is truncated
// at a word boundary to make room.
function buildTitle(heading: string): string {
  for (const suffix of TITLE_SUFFIXES) {
    const candidate = `${heading}${suffix}`
    if (candidate.length <= TITLE_MAX) return candidate
  }
  const suffix = TITLE_SUFFIXES[TITLE_SUFFIXES.length - 1]
  const budget = TITLE_MAX - suffix.length - 1
  const truncated = heading.slice(0, Math.max(0, budget)).replace(/[.,;:\s]+$/, '')
  return `${truncated}…${suffix}`
}

// Shared title/description template for brand, category, model, and collection
// listing pages — these all previously used a static, near-identical one-liner
// with no "for sale"/"shop" language and no per-page differentiation. Builds
// both from just the resolved name, so every page gets real copy without
// anyone maintaining it by hand, and always lands within the length ranges
// search engines display in full: 50–70 characters for the title, 110–160
// for the description (each tries a longer variant first for short names,
// falling back to shorter ones — and finally a truncated one — as the name
// gets longer).
//
// `bareNoun`: pass true when `heading` already reads as a plural noun on its
// own (category names like "Rifles", "Handguns") — false when it needs
// "firearms" appended to read naturally (brand names, model numbers). Only
// affects the description; the title never appends "firearms" to the
// heading itself, so it doesn't need this distinction.
export function buildListingMeta(heading: string, opts?: { bareNoun?: boolean }) {
  const subject = opts?.bareNoun ? heading : `${heading} firearms`
  const lead = `Shop ${subject} for sale at Luxus Collection.`

  const title = buildTitle(heading)

  let description = `${lead} ${TAIL_FULL}`
  if (description.length > MAX_DESCRIPTION) description = `${lead} ${TAIL_SHORT}`
  if (description.length > MAX_DESCRIPTION) description = truncateTail(lead, TAIL_SHORT)
  // Every real page name produces a description well past MIN_DESCRIPTION
  // once a tail is attached — this only matters for a pathological
  // (near-160-char) name where truncateTail has nothing left to add.
  if (description.length < MIN_DESCRIPTION) description = `${lead} ${TAIL_SHORT}`.slice(0, MAX_DESCRIPTION)

  return { title, description }
}
