const KLAVIYO_KEY = process.env.KLAVIYO_PRIVATE_KEY ?? ''
const KLAVIYO_LIST_ID = process.env.KLAVIYO_LIST_ID ?? ''
const REVISION = '2024-10-15'

function kHeaders() {
  return {
    Authorization: `Klaviyo-API-Key ${KLAVIYO_KEY}`,
    'Content-Type': 'application/json',
    revision: REVISION,
  }
}

export async function klaviyoSubscribe(email: string, firstName?: string): Promise<boolean> {
  if (!KLAVIYO_KEY || !KLAVIYO_LIST_ID) return false
  try {
    const res = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
      method: 'POST',
      headers: kHeaders(),
      body: JSON.stringify({
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            list_id: KLAVIYO_LIST_ID,
            subscriptions: [{
              channels: { email: { marketing: { consent: 'SUBSCRIBED' } } },
              profile: {
                data: {
                  type: 'profile',
                  attributes: { email, ...(firstName ? { first_name: firstName } : {}) },
                },
              },
            }],
          },
        },
      }),
    })
    return res.ok || res.status === 202
  } catch { return false }
}

export async function klaviyoSuppress(email: string): Promise<boolean> {
  if (!KLAVIYO_KEY) return false
  try {
    const res = await fetch('https://a.klaviyo.com/api/profile-suppression-bulk-create-jobs/', {
      method: 'POST',
      headers: kHeaders(),
      body: JSON.stringify({
        data: {
          type: 'profile-suppression-bulk-create-job',
          attributes: {
            profiles: {
              data: [{ type: 'profile', attributes: { email } }],
            },
          },
        },
      }),
    })
    return res.ok || res.status === 202
  } catch { return false }
}

export async function klaviyoTrackEvent(
  email: string,
  eventName: string,
  properties: Record<string, unknown>,
): Promise<boolean> {
  if (!KLAVIYO_KEY) return false
  try {
    const res = await fetch('https://a.klaviyo.com/api/events/', {
      method: 'POST',
      headers: kHeaders(),
      body: JSON.stringify({
        data: {
          type: 'event',
          attributes: {
            metric: { data: { type: 'metric', attributes: { name: eventName } } },
            profile: { data: { type: 'profile', attributes: { email } } },
            properties,
          },
        },
      }),
    })
    return res.ok || res.status === 202
  } catch { return false }
}
