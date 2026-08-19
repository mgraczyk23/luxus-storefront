import type { Metadata } from 'next'

const LOGO = '/logo.webp'

/**
 * Generates consistent openGraph + twitter metadata for any page.
 * Falls back to the company logo when no specific image is supplied.
 * Pass `url` (the page's canonical path, e.g. matching `alternates.canonical`)
 * so og:url is emitted — Next.js resolves it against `metadataBase`.
 */
export function ogMeta(
  title: string,
  description?: string | null,
  opts?: { image?: string | null; type?: 'website' | 'article'; url?: string },
): Pick<Metadata, 'openGraph' | 'twitter'> {
  const { image, type = 'website', url } = opts ?? {}
  const img = image || LOGO
  return {
    openGraph: {
      title,
      description: description ?? undefined,
      type,
      images: [img],
      ...(url ? { url } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description ?? undefined,
      images: [img],
    },
  }
}
