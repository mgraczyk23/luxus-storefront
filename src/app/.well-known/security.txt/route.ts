// RFC 9116 security.txt — https://www.rfc-editor.org/rfc/rfc9116
// Contact confirmed by the site owner (2026-08-21). Expires must be kept
// under ~1 year out per the RFC's own guidance and refreshed periodically —
// an expired security.txt is technically invalid.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luxus-collection.com'

export async function GET() {
  const body = [
    'Contact: mailto:support@luxus-collection.com',
    'Expires: 2027-08-21T00:00:00.000Z',
    'Preferred-Languages: en',
    `Canonical: ${SITE}/.well-known/security.txt`,
  ].join('\n') + '\n'

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
