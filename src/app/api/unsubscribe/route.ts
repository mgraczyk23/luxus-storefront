import { NextRequest, NextResponse } from "next/server"
import { klaviyoSuppress } from "@/lib/klaviyo"

const PAYLOAD_URL = process.env.PAYLOAD_CMS_URL ?? "https://api.luxus-collection.com/cms"

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")
  if (!email) {
    return new NextResponse("Missing email", { status: 400 })
  }

  try {
    // Find subscriber by email
    const findRes = await fetch(
      `${PAYLOAD_URL}/api/subscribers?where[email][equals]=${encodeURIComponent(email)}&limit=1`,
      { headers: { "Content-Type": "application/json" } }
    )
    const findData = await findRes.json()
    const subscriber = findData?.docs?.[0]

    if (!subscriber) {
      return new NextResponse(unsubscribePage("You were not found in our list — you may have already unsubscribed."), {
        status: 200, headers: { "Content-Type": "text/html" },
      })
    }

    await Promise.all([
      fetch(`${PAYLOAD_URL}/api/subscribers/${subscriber.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "unsubscribed" }),
      }),
      klaviyoSuppress(email),
    ])

    return new NextResponse(unsubscribePage("You have been unsubscribed and will no longer receive article notifications."), {
      status: 200, headers: { "Content-Type": "text/html" },
    })
  } catch {
    return new NextResponse(unsubscribePage("Something went wrong. Please contact us at info@luxus-collection.com."), {
      status: 500, headers: { "Content-Type": "text/html" },
    })
  }
}

function unsubscribePage(message: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribe — Luxus Collection</title>
  <style>body{font-family:'Georgia',serif;background:#faf9f7;color:#1a1a1a;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .box{max-width:480px;text-align:center;padding:48px 32px}
  .brand{font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#c9a96e;margin-bottom:24px}
  h1{font-size:26px;font-weight:400;margin:0 0 16px}p{font-size:14px;color:#6b6560;line-height:1.8;margin:0 0 28px}
  a{color:#c9a96e;font-size:12px}</style></head>
  <body><div class="box"><div class="brand">Luxus Collection</div>
  <h1>Newsletter</h1><p>${message}</p>
  <a href="/">Return to site</a></div></body></html>`
}
