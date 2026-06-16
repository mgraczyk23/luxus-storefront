// Safari private browsing and iOS Advanced Privacy Protection block localStorage
// with a SecurityError. All localStorage access must go through these wrappers.

export function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

export function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch { /* private browsing / storage denied */ }
}

export function safeRemove(key: string): void {
  try { localStorage.removeItem(key) } catch { /* private browsing / storage denied */ }
}
