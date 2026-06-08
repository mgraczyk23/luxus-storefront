# Classifieds Section — Build Plan

**Status:** Planning — pinned pending decisions on monetization and operational details
**Last updated:** 2026-06-08

---

## Overview

A classifieds marketplace section within luxus-collection.com where registered users can post firearms for sale. No payment is processed on-site for transactions — the platform connects buyer and seller only. Styled to match the Luxus Collection brand; inspired by GunInternational.com but with a modern, curated UX.

**URL root:** `/classifieds`

---

## Architecture Decisions (Confirmed)

- **Data storage:** Dedicated PostgreSQL tables in the existing database (Option B) — not Payload CMS. Chosen for scalability, performance, and long-term maintainability.
- **Search:** Meilisearch (already running) — `classifieds` index, full-text + faceted filters
- **Images:** S3, `classifieds/` prefix, same bucket as existing media
- **Auth:** Existing Medusa customer accounts — no separate login. Sellers get a `classifieds_profiles` row on first use.
- **Notifications/email:** Resend (already set up)
- **API:** Next.js API routes

---

## Decisions Still Needed

These must be resolved before Phase 1 build begins:

1. **Listing fees** — Per-listing fee (like GI Basic at $20), monthly subscription tiers, or start free to build volume?
2. **Approval flow** — Admin approval required before listing goes live, or auto-publish with flagging?
3. **Parts & accessories** — Guns only at launch, or include accessories/ammo?
4. **Photo limit** — How many photos per listing? (GunInternational Basic = 15)
5. **Listing duration** — 90 days like GunInternational, or a different period?

---

## Reference: GunInternational Model

GunInternational.com membership tiers for reference:

| Tier | Monthly Fee | Per-Listing Fee | Photos | Featured Spots |
|---|---|---|---|---|
| Basic | None | $20/gun, $4/parts | 15 | None |
| Premium | $24.99 | $15/gun, $2/parts (after 30 free) | 20 | 6 gun + 6 parts |
| Platinum | $299–$799 (scales with inventory) | Included | 25 | 15 gun + 15 parts |

Key features on GI: 90-day listing expiry (free renewal), Buy Now option, Watch List, Wish List (email alert on new matches), contact form routing, seller inbox, View All By This Seller, FFL database, listing history.

---

## Database Schema

### `classifieds_profiles`
| column | type | notes |
|---|---|---|
| `customer_id` | varchar PK | Medusa customer ID |
| `display_name` | varchar | shown on listings (not real name) |
| `state` | varchar | seller location |
| `contact_preference` | enum | `email` or `on_site_form` |
| `phone` | varchar | optional, shown only if seller opts in |
| `is_ffl` | boolean | FFL dealer flag |
| `ffl_number` | varchar | optional |
| `verified` | boolean | admin-toggled trust badge |
| `created_at` | timestamptz | |

### `classifieds_listings`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `customer_id` | varchar | FK → Medusa customer |
| `status` | enum | `draft`, `pending_review`, `active`, `sale_pending`, `sold`, `expired`, `removed` |
| `title` | varchar | required — manufacturer + model + caliber minimum |
| `slug` | varchar | URL-safe title slug |
| `description` | text | full description |
| `price_cents` | integer | asking price in cents |
| `buy_now` | boolean | enables Buy Now button |
| `manufacturer` | varchar | |
| `model` | varchar | |
| `caliber` | varchar | |
| `condition` | enum | `new`, `excellent`, `very_good`, `good`, `fair`, `poor` |
| `barrel_length` | varchar | |
| `year_made` | integer | |
| `serial_number` | varchar | required, not displayed publicly |
| `firearm_type` | varchar | handgun, rifle, shotgun, revolver, etc. |
| `is_curio_relic` | boolean | qualifies as C&R |
| `is_antique` | boolean | pre-1899 |
| `location_state` | varchar | seller's state |
| `location_city` | varchar | optional |
| `featured` | boolean | highlighted placement |
| `view_count` | integer | default 0 |
| `expires_at` | timestamptz | 90 days from activation |
| `listed_at` | timestamptz | when first made active |
| `sold_at` | timestamptz | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `classifieds_listing_images`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `listing_id` | uuid FK | |
| `s3_key` | varchar | S3 object key under `classifieds/` |
| `url` | varchar | public URL |
| `position` | integer | display order, 0 = lead photo |
| `created_at` | timestamptz | |

### `classifieds_messages`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `listing_id` | uuid FK | |
| `sender_customer_id` | varchar | null if guest contact (if allowed) |
| `sender_name` | varchar | |
| `sender_email` | varchar | |
| `body` | text | |
| `read` | boolean | seller has read it |
| `created_at` | timestamptz | |

### `classifieds_watchlist`
| column | type | notes |
|---|---|---|
| `customer_id` | varchar | |
| `listing_id` | uuid | |
| `created_at` | timestamptz | |
| PK | `(customer_id, listing_id)` | |

### `classifieds_saved_searches`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `customer_id` | varchar | |
| `name` | varchar | user-defined label |
| `criteria` | jsonb | filter criteria (type, caliber, manufacturer, price range, state) |
| `email_alerts` | boolean | notify on new matches |
| `created_at` | timestamptz | |

---

## URL Structure

```
/classifieds                        Browse / search all listings
/classifieds/post                   Create a listing (auth required)
/classifieds/[id]-[slug]            Single listing detail page
/classifieds/seller/[id]            All active listings from one seller
/account/listings                   Seller's listing management dashboard
/account/watchlist                  Saved listings
/account/saved-searches             Wish list / saved search alerts
/admin/classifieds                  Admin moderation dashboard
```

---

## Build Phases

### Phase 1 — Foundation (Database + API)
*No user-facing UI. Pure backend.*

- [ ] Write SQL migration for all 6 tables
- [ ] API route: `POST /api/classifieds/listings` — create listing (auth required)
- [ ] API route: `GET /api/classifieds/listings` — browse/search (public, Meilisearch)
- [ ] API route: `GET /api/classifieds/listings/[id]` — single listing (public)
- [ ] API route: `PATCH /api/classifieds/listings/[id]` — edit listing (auth, owner only)
- [ ] API route: `DELETE /api/classifieds/listings/[id]` — remove listing (auth, owner only)
- [ ] API route: `POST /api/classifieds/listings/[id]/status` — change status (auth)
- [ ] API route: `POST /api/classifieds/upload` — S3 image upload (auth)
- [ ] Meilisearch `classifieds` index setup + sync hook on listing create/update/status change
- [ ] Resend email templates:
  - [ ] Listing approved / now live
  - [ ] Listing expiring — 7 days notice
  - [ ] Listing expiring — 3 days notice
  - [ ] Listing expiring — 1 day notice
  - [ ] Contact message received (to seller)
  - [ ] Wish list match found (nightly job)

### Phase 2 — Public Browse
*Buyer-facing pages, no account required.*

- [ ] `/classifieds` — browse page with Meilisearch search + filters (type, caliber, manufacturer, condition, price range, state)
- [ ] `/classifieds/[id]-[slug]` — listing detail page: photo lightbox, full specs, contact form, "View all by seller" link
- [ ] `/classifieds/seller/[id]` — all active listings from one seller

### Phase 3 — Seller Tools
*Account required. Builds on existing Medusa auth.*

- [ ] Seller profile setup flow (shown on first visit to `/classifieds/post`)
- [ ] `/classifieds/post` — multi-step listing form: Details → Specs → Photos → Preview → Submit
- [ ] Photo upload UI: drag-to-reorder, first photo = lead, max photo limit TBD
- [ ] Buy Now option on listing form
- [ ] `/account/listings` — seller dashboard: all listings by status, sort/filter
- [ ] Actions: Edit, Renew, Mark Sale Pending, Mark Sold, Make Active/Inactive, Remove
- [ ] Expiry countdown + one-click renewal
- [ ] Listing history view

### Phase 4 — Buyer Tools
*Account required.*

- [ ] Watch List — save listing, view at `/account/watchlist`, remove saved items
- [ ] Wish List / Saved Searches — criteria form, email alerts toggle, manage at `/account/saved-searches`
- [ ] Nightly job: match new listings against saved searches, send Resend emails on matches
- [ ] Seller/buyer message inbox (stored contact messages)

### Phase 5 — Admin Moderation
- [ ] `/admin/classifieds` — moderation dashboard
- [ ] View pending listings (pending_review status)
- [ ] Approve (→ active), Reject (→ removed), Flag
- [ ] Filter by status, date, seller
- [ ] Bulk actions: approve all pending, remove all expired
- [ ] Listing history per seller

### Phase 6 — Monetization
*Only if paid listing model is chosen (pending decision).*

- [ ] Stripe integration for listing fees / subscriptions (separate from Elavon product payments)
- [ ] Featured listing placement — highlighted card, pinned to top of category
- [ ] Billing history in seller account (`/account/billing`)
- [ ] Membership tier logic (if applicable)

---

## Key Rules (from GunInternational model, to adapt)

- Listings must use **actual photos of the specific firearm** — no manufacturer stock photos
- Each listing represents **one specific gun with its own serial number**
- Sellers are obligated to complete a sale if a buyer clicks Buy Now
- 3-day inspection / return period recommended (buyer/seller to agree)
- All transactions directly between buyer and seller — site facilitates discovery only
- Sellers must comply with all federal, state, and local firearms transfer laws
- FFL transfer required for interstate handgun sales

---

## Notes

- Build after core commerce site is complete (payment flow, manufacturer profiles, Klaviyo)
- Guest contact (no account to message a seller) — TBD
- FFL dealer database / searchable FFL directory — Phase 2 stretch goal
- Parts & accessories category — TBD (pending decision #3)
