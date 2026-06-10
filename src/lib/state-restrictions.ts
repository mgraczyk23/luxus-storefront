const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'https://api.luxus-collection.com'
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

export type RestrictionType = 'banned' | 'no_threaded_barrel' | 'magazine_warning'

export type StateRestriction = {
  id: string
  state_code: string
  restriction_type: RestrictionType
  notes: string | null
  magazine_limit: number | null
  firearm_type: string | null
}

export type RestrictionCheckResult =
  | { ok: true; warning?: string }
  | { ok: false; reason: string }

let _cache: StateRestriction[] | null = null
let _cacheTs = 0
const CACHE_TTL = 5 * 60 * 1000

export async function fetchRestrictions(): Promise<StateRestriction[]> {
  if (_cache && Date.now() - _cacheTs < CACHE_TTL) return _cache
  try {
    const res = await fetch(`${MEDUSA_URL}/store/state-restrictions`, {
      headers: { 'x-publishable-api-key': PK },
      cache: 'no-store',
    })
    if (!res.ok) return _cache ?? []
    const { restrictions } = await res.json()
    _cache = restrictions ?? []
    _cacheTs = Date.now()
    return _cache!
  } catch {
    return _cache ?? []
  }
}

// Map Medusa category names → firearm type keys used on state restriction rules.
// Revolvers omitted intentionally — they have fixed cylinders, not detachable magazines,
// so magazine capacity laws generally do not apply to them.
function categoriesToFirearmTypes(categories: string[]): Set<string> {
  const types = new Set<string>()
  for (const cat of categories) {
    const c = cat.toLowerCase()
    if (c.includes('handgun') || c.includes('pistol')) types.add('handgun')
    if (c.includes('rifle'))                           types.add('rifle')
    if (c.includes('shotgun'))                         types.add('shotgun')
  }
  return types
}

const FIREARM_LABELS: Record<string, string> = { handgun: 'handguns', rifle: 'rifles', shotgun: 'shotguns' }

function buildWarning(stateCode: string, limit: number | null, firearamLabel: string): string {
  if (limit !== null) {
    return `${stateCode} limits magazine capacity to ${limit} rounds${firearamLabel}. This firearm will ship without its magazines. Contact us at sales@luxus-collection.com if you have any questions before ordering.`
  }
  return `${stateCode} restricts high-capacity magazines. This firearm will ship without its magazines. Contact us at sales@luxus-collection.com if you have any questions before ordering.`
}

export function checkState(
  stateCode: string,
  restrictions: StateRestriction[],
  productMeta: Record<string, string | undefined>,
  productCategories: string[] = []
): RestrictionCheckResult {
  const code = stateCode.toUpperCase().trim()
  if (!code) return { ok: true }

  const forState = restrictions.filter(r => r.state_code === code)
  if (forState.length === 0) return { ok: true }

  // Hard block 1: blanket ban
  if (forState.some(r => r.restriction_type === 'banned')) {
    return { ok: false, reason: `We do not ship to ${code}. We are unable to process sales to this state.` }
  }

  // Hard block 2: threaded barrel
  if (productMeta.has_threaded_barrel === 'true' && forState.some(r => r.restriction_type === 'no_threaded_barrel')) {
    return { ok: false, reason: `This firearm has a threaded barrel which cannot be shipped to ${code} under state law.` }
  }

  // Soft warning: magazine capacity rules
  const magRules = forState.filter(r => r.restriction_type === 'magazine_warning')
  if (magRules.length === 0) return { ok: true }

  const productCapacity = productMeta.magazine_capacity ? parseInt(productMeta.magazine_capacity, 10) : null
  const firearamTypes   = categoriesToFirearmTypes(productCategories)

  // Find the most restrictive applicable rule (lowest limit) that this product exceeds.
  let worstLimit: number | null = null
  let worstFirearmLabel = ''

  for (const rule of magRules) {
    const ruleApplies = !rule.firearm_type || firearamTypes.has(rule.firearm_type)
    if (!ruleApplies) continue

    if (rule.magazine_limit !== null && rule.magazine_limit !== undefined) {
      // Capacity-based rule: warn only if product capacity exceeds the state limit
      if (productCapacity !== null && !isNaN(productCapacity) && productCapacity > rule.magazine_limit) {
        if (worstLimit === null || rule.magazine_limit < worstLimit) {
          worstLimit = rule.magazine_limit
          worstFirearmLabel = rule.firearm_type
            ? ` for ${FIREARM_LABELS[rule.firearm_type] ?? rule.firearm_type}`
            : ''
        }
      }
    } else {
      // Blanket rule (no limit set) — warn if product has high-cap flag or known capacity > 10
      if (productMeta.has_high_capacity_magazine === 'true' || (productCapacity !== null && productCapacity > 10)) {
        return { ok: true, warning: buildWarning(code, null, '') }
      }
    }
  }

  if (worstLimit !== null) {
    return { ok: true, warning: buildWarning(code, worstLimit, worstFirearmLabel) }
  }

  return { ok: true }
}
