const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'https://api.luxus-collection.com'
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

export type RestrictionType = 'banned' | 'no_threaded_barrel' | 'magazine_warning'

export type StateRestriction = {
  id: string
  state_code: string
  restriction_type: RestrictionType
  notes: string | null
}

export type RestrictionCheckResult =
  | { ok: true; warning?: string }
  | { ok: false; reason: string }

let _cache: StateRestriction[] | null = null
let _cacheTs = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

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

export function checkState(
  stateCode: string,
  restrictions: StateRestriction[],
  productMeta: Record<string, string | undefined>
): RestrictionCheckResult {
  const code = stateCode.toUpperCase().trim()
  if (!code) return { ok: true }

  const forState = restrictions.filter(r => r.state_code === code)
  if (forState.length === 0) return { ok: true }

  // Hard block 1: blanket ban
  if (forState.some(r => r.restriction_type === 'banned')) {
    return {
      ok: false,
      reason: `We do not ship to ${code}. We are unable to process sales to this state.`,
    }
  }

  // Hard block 2: threaded barrel restriction
  const hasThreaded = productMeta.has_threaded_barrel === 'true'
  if (hasThreaded && forState.some(r => r.restriction_type === 'no_threaded_barrel')) {
    return {
      ok: false,
      reason: `This firearm has a threaded barrel which cannot be shipped to ${code} under state law.`,
    }
  }

  // Soft warning: high-capacity magazine restriction
  const hasMags = productMeta.has_high_capacity_magazine === 'true'
  if (hasMags && forState.some(r => r.restriction_type === 'magazine_warning')) {
    return {
      ok: true,
      warning: `${code} restricts high-capacity magazines. This firearm will be shipped without its standard magazines. The firearm itself is unaffected.`,
    }
  }

  return { ok: true }
}
