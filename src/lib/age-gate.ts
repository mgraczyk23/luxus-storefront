// Shared age-verification state, used by AgeGate (which owns the dialog and
// writes this state) and by anything that must not load until age has been
// verified (e.g. KlaviyoLoader). Kept separate from AgeGate.tsx so it can be
// imported by a second client component without pulling in the dialog UI.

export const AGE_VERIFIED_COOKIE = 'lxs_age_verified'
export const AGE_VERIFIED_EVENT = 'lxs:age-verified'

// Search engine crawlers and AI agents (ChatGPT/Claude/Perplexity browsing
// on a user's behalf, etc.) shouldn't be blocked by the age-verification
// dialog — it's a real-user-facing gate, not content worth hiding from
// indexing/agents. Real browser UAs never contain these substrings, so this
// is safe as a plain substring match with no false positives.
const BOT_UA_PATTERN = /bot|crawler|spider|facebookexternalhit|ia_archiver|chatgpt-user|anthropic-ai|perplexity-user|claude-web|meta-externalagent|cohere-ai/i

export function isBotUserAgent(ua: string): boolean {
  return BOT_UA_PATTERN.test(ua)
}

export function isAgeVerified(): boolean {
  try {
    const hasCookie = document.cookie.split('; ').some(r => r.startsWith(AGE_VERIFIED_COOKIE + '=1'))
    const hasSession = sessionStorage.getItem(AGE_VERIFIED_COOKIE) === '1'
    return hasCookie || hasSession
  } catch {
    return false
  }
}

export function setAgeVerified(remember: boolean) {
  if (remember) {
    const maxAge = 30 * 24 * 60 * 60
    document.cookie = `${AGE_VERIFIED_COOKIE}=1;path=/;max-age=${maxAge};samesite=lax`
  } else {
    sessionStorage.setItem(AGE_VERIFIED_COOKIE, '1')
  }
  window.dispatchEvent(new Event(AGE_VERIFIED_EVENT))
}
