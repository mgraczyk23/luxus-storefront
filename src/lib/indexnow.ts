// IndexNow — pushes changed/new URLs to Bing + Yandex immediately instead of
// waiting for them to re-crawl the sitemap. Google does not participate.
// Key is public (not a secret) — it just proves we own the site, same idea
// as a Search Console verification file.
const INDEXNOW_KEY = "005d4bb89107d727bd6b07010a018a74"
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://luxus-collection.com"

export async function submitIndexNow(paths: string[]): Promise<void> {
  const clean = paths.filter(p => p.startsWith("/"))
  if (clean.length === 0) return

  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
        urlList: clean.map(p => `${SITE}${p}`),
      }),
    })
  } catch {
    // best-effort — a failed ping shouldn't break revalidation
  }
}

// Maps a revalidation tag to the specific page it identifies, when the tag
// already encodes a slug (e.g. Payload's afterChange hooks fire `post-${slug}`,
// `brand-${slug}`, etc.). Returns [] when the tag doesn't map to one exact URL
// (blanket tags like "products" or "posts" cover many pages, not one new one).
const TAG_URL_PATTERNS: [RegExp, (slug: string) => string][] = [
  [/^post-(.+)$/, slug => `/article/${slug}`],
  [/^brand-(.+)$/, slug => `/brand/${slug}`],
  [/^resource-brand-(.+)$/, slug => `/resources-on-guns/${slug}`],
]

export function pathForTag(tag: string): string[] {
  for (const [re, build] of TAG_URL_PATTERNS) {
    const m = tag.match(re)
    if (m) return [build(m[1])]
  }
  return []
}
