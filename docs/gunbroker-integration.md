# GunBroker API Integration

## Overview

The storefront fetches live auction listings from GunBroker and displays them in the "Currently on GunBroker" section on the home page. The section is hidden automatically when there are no active listings.

## Architecture

```
HomePage (client) → useEffect → /api/gunbroker/listings (Next.js route, 5-min edge cache)
                                    → src/lib/gunbroker.ts (server-side)
                                        → POST /Users/AccessToken  (auth, cached 50 min)
                                        → GET  /ItemsSelling       (active listings)
```

## Environment Variables

Set these in Vercel → Project Settings → Environment Variables:

| Variable | Description | Sandbox value |
|---|---|---|
| `GUNBROKER_DEV_KEY` | Developer API key | `f88e4dcf-0363-4324-b09d-e09d99b17a2a` |
| `GUNBROKER_USERNAME` | GunBroker account username | your sandbox username |
| `GUNBROKER_PASSWORD` | GunBroker account password | your sandbox password |
| `GUNBROKER_SANDBOX` | Set to `"true"` for sandbox | `true` |

For production: remove `GUNBROKER_SANDBOX` (or set to `false`) and update `GUNBROKER_DEV_KEY` to the production key.

## API Endpoints Used

Base URLs:
- Sandbox: `https://api.sandbox.gunbroker.com/v1`
- Production: `https://api.gunbroker.com/v1`

### Authentication — `POST /Users/AccessToken`

**Headers:** `X-DevKey`, `Content-Type: application/json`, `User-Agent`

**Body:**
```json
{ "Username": "...", "Password": "..." }
```

**Response:**
```json
{ "AccessToken": "eyJ..." }
```

Token is cached in-process for 50 minutes. On a 401 response the token is discarded and re-auth is attempted once automatically.

### Active Listings — `GET /ItemsSelling`

**Headers:** `X-DevKey`, `X-AccessToken`, `User-Agent`

**Query params used:** `PageSize=8&PageIndex=0`

**Key response fields:**

| API field | Our field | Notes |
|---|---|---|
| `ItemID` | `id` | |
| `Title` | `title` | |
| `ThumbnailURL` | `thumbnail` | |
| `BidPrice` | `currentBid` | Falls back to `Price` |
| `Bids` | `bidCount` | |
| `EndingDate` | `timeLeft` | Computed as "2d 14h" format |
| `HasBuyNow` + `BuyNowPrice` | `buyNowPrice` | null if no buy-now option |
| `HasReserveBeenMet` | `reserveMet` | |

## User-Agent Requirement

GunBroker requires a specific User-Agent format per their security policy:

```
Format:  Software/Seller/Versionnumber/ApplicationName
Used:    LuxusStorefront/LuxusCollection/1.0/AuctionSync
```

This is set in `src/lib/gunbroker.ts` as `USER_AGENT` and applied to every request.

## Switching to Production

1. Activate the production API key with GunBroker
2. In Vercel, update:
   - `GUNBROKER_DEV_KEY` → production key
   - `GUNBROKER_SANDBOX` → remove or set to `false`
   - `GUNBROKER_USERNAME` / `GUNBROKER_PASSWORD` → production account credentials
3. Redeploy — no code changes needed

## Caching

- **Access token**: cached in-process (per serverless function instance) for 50 minutes
- **Listing results**: Next.js `revalidate: 300` on the fetch → edge cached for 5 minutes
- **API route** (`/api/gunbroker/listings`): `export const revalidate = 300` → ISR cached 5 minutes

## Files

| File | Purpose |
|---|---|
| `src/lib/gunbroker.ts` | Auth, token cache, listings fetch, response mapping |
| `src/app/api/gunbroker/listings/route.ts` | Next.js API route serving listing JSON |
| `src/components/home/HomePage.tsx` | Fetches `/api/gunbroker/listings` on mount; renders auction section |

## Troubleshooting

**Section not appearing on home page**
- Check that `GUNBROKER_DEV_KEY`, `GUNBROKER_USERNAME`, `GUNBROKER_PASSWORD` are all set in Vercel
- Verify there are active listings on your GunBroker account (the section auto-hides when empty)
- Check Vercel function logs for auth errors

**401 errors in logs**
- Token may have expired and re-auth failed — verify credentials are correct
- Sandbox and production use different dev keys; confirm `GUNBROKER_SANDBOX` matches the key in use

**Listings showing sandbox.gunbroker.com links on production**
- `GUNBROKER_SANDBOX` is still set to `"true"` — remove it or set to `"false"`
