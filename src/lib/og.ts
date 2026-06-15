import type { Metadata } from 'next'

const LOGO = '/logo.webp'

/**
 * Generates consistent openGraph + twitter metadata for any page.
 * Falls back to the company logo when no specific image is supplied.
 */
export function ogMeta(
  title: string,
  description?: string | null,
  image?: string | null,
  type: 'website' | 'article' = 'website',
): Pick<Metadata, 'openGraph' | 'twitter'> {
  const img = image || LOGO
  return {
    openGraph: {
      title,
      description: description ?? undefined,
      type,
      images: [img],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description ?? undefined,
      images: [img],
    },
  }
}
