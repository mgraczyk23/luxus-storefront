/**
 * One-time migration: push all active Payload subscribers into Klaviyo.
 *
 * Usage:
 *   KLAVIYO_PRIVATE_KEY=pk_xxx KLAVIYO_LIST_ID=LISTID node scripts/klaviyo-migrate.mjs
 *
 * Reads env vars from the shell (or prefix the command as above).
 * Processes in batches of 100. Safe to re-run — Klaviyo is idempotent on existing profiles.
 */

const PAYLOAD_URL    = process.env.PAYLOAD_CMS_URL    ?? 'https://api.luxus-collection.com/cms'
const PAYLOAD_KEY    = process.env.PAYLOAD_API_KEY    ?? ''
const KLAVIYO_KEY    = process.env.KLAVIYO_PRIVATE_KEY ?? ''
const KLAVIYO_LIST   = process.env.KLAVIYO_LIST_ID    ?? ''
const BATCH_SIZE     = 100

if (!KLAVIYO_KEY || !KLAVIYO_LIST) {
  console.error('KLAVIYO_PRIVATE_KEY and KLAVIYO_LIST_ID are required')
  process.exit(1)
}

// ── Fetch all active subscribers from Payload ──────────────────────────────

async function fetchAllSubscribers() {
  const subscribers = []
  let page = 1
  while (true) {
    const url = `${PAYLOAD_URL}/api/subscribers?where[status][equals]=active&limit=100&page=${page}&depth=0`
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(PAYLOAD_KEY ? { Authorization: `users API-Key ${PAYLOAD_KEY}` } : {}),
      },
    })
    if (!res.ok) throw new Error(`Payload fetch failed: ${res.status}`)
    const data = await res.json()
    const docs = data?.docs ?? []
    subscribers.push(...docs)
    if (subscribers.length >= (data?.totalDocs ?? 0) || docs.length === 0) break
    page++
  }
  return subscribers
}

// ── Push a batch to Klaviyo ────────────────────────────────────────────────

async function pushBatch(batch) {
  const subscriptions = batch.map(sub => {
    const nameParts = (sub.name ?? '').trim().split(' ')
    return {
      channels: { email: { marketing: { consent: 'SUBSCRIBED' } } },
      profile: {
        data: {
          type: 'profile',
          attributes: {
            email: sub.email,
            ...(nameParts[0] ? { first_name: nameParts[0] } : {}),
            ...(nameParts[1] ? { last_name: nameParts.slice(1).join(' ') } : {}),
          },
        },
      },
    }
  })

  const res = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${KLAVIYO_KEY}`,
      'Content-Type': 'application/json',
      revision: '2024-10-15',
    },
    body: JSON.stringify({
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: { list_id: KLAVIYO_LIST, subscriptions },
      },
    }),
  })

  if (!res.ok && res.status !== 202) {
    const body = await res.text()
    throw new Error(`Klaviyo batch failed (${res.status}): ${body}`)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching active subscribers from Payload...')
  const subscribers = await fetchAllSubscribers()
  console.log(`Found ${subscribers.length} active subscribers`)

  if (subscribers.length === 0) {
    console.log('Nothing to migrate.')
    return
  }

  let pushed = 0
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE)
    await pushBatch(batch)
    pushed += batch.length
    console.log(`  Pushed ${pushed}/${subscribers.length}`)
  }

  console.log(`Done. ${pushed} subscribers migrated to Klaviyo list ${KLAVIYO_LIST}.`)
}

main().catch(err => { console.error(err); process.exit(1) })
