# Luxus Collection — Work Log

Running history of all work completed across sessions. Updated continuously as work is done.
References both repos: `luxus-storefront` (Next.js / Vercel) and `luxus-commerce` (Medusa + Payload / AWS Lightsail).

---

## 2026-05-14 to 2026-05-21 — Foundation

### Infrastructure
- AWS Lightsail 8 GB server provisioned
- Docker Compose stack: Medusa 2.15, Payload CMS 3.x, PostgreSQL 16, Redis 7, Meilisearch 1.11, Nginx 1.27
- SSL via Nginx for `api.luxus-collection.com`
- S3 bucket `luxus-collection-media` (us-east-1) for product images
- Vercel deployment at `dev.luxus-collection.com` (auto-deploys on push to `main`)

### Medusa Backend — Custom Modules
- `product_details` — short_description, contact_for_pricing, primary_category, engraver, seo_meta_title, seo_meta_description
- `product_specs` — overall_length, weight, frame_material, grip, sights, finish
- `product_attributes` — brand, model, caliber, action, barrel_length (multi-value, authoritative source)
- `inventory_management` — consignment flag, backroom flag (admin-only, never exposed to store API)
- `offers` — buyer offer submissions with status, expiry, admin email notification
- `auction` — GunBroker listing fields (listing_id, current_bid, reserve, end_date, etc.)

### Medusa Admin Widgets
All widgets live in `luxus-commerce/services/medusa/apps/backend/src/admin/components/`:
- `product-details.tsx` — short_description, optics_ready, contact_for_pricing, primary_category, engraver, SEO fields
- `product-pricing.tsx` — dollar input with auto cents conversion, live storefront preview link
- `product-attributes.tsx` — brand/model/caliber/action/barrel_length (multi-select chips, saves to attributes module)
- `product-specs.tsx` — overall_length, weight, frame_material, grip, sights, finish
- `product-highlights.tsx` — up to 4 highlight blocks
- `product-extra-specs.tsx` — additional spec table rows (key/value)
- `product-in-the-box.tsx` — "What's in the box" list
- `product-inventory.tsx` — consignment/backroom flags (admin visibility only)
- `product-auction.tsx` — GunBroker auction fields
- `Invoice.tsx` — print-ready invoice renderer (see below)

### Storefront — Initial Build
- Next.js App Router, light mode only (all dark mode code removed)
- `src/lib/api.ts` — `storeFetch()` with `x-publishable-api-key` header, all store API helpers
- `src/lib/medusa.ts` — `mapMedusaProduct()` reads from attributes module (primary) with metadata fallback
  - `buildAttrMap()` groups attribute_values by attribute_type.slug
  - `pickAttr()` prefers attribute_values, falls back to metadata
  - Handles multi-brand products (e.g. Hilton Yam / 10-8 Performance)
- Product fields string uses `*` prefix (not `+`) for relations — `*attribute_values,*attribute_values.attribute_type`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` set in Vercel — store API working, 461 products live

---

## 2026-05-22 — Multi-Brand Fix + Dropdown Hover Fix

### Bug: Multi-brand products not showing all brands
- Root cause: `mapMedusaProduct` was reading from `metadata.brand` (single string) rather than `attribute_values`
- Fix: rewrote data layer to use `attribute_values` module as authoritative source
- `buildAttrMap()` correctly handles multiple values per attribute type

### Bug: Header dropdown closing when mouse moves toward it
- Root cause: gap between nav link and dropdown allowed `mouseleave` to fire
- Fix: added negative `top` offset / `paddingTop` to dropdown so hover area is continuous

---

## 2026-05-26 — Phase 4 Emails, Offers Page, Payload CMS Posts, Blog

### Resend Email Integration
- All contact forms wired to Resend via `/api/contact` route
- Offer form (`/api/offers`) → Medusa store endpoint → admin notification email
- Newsletter signup wired to Payload Subscribers collection
- `RESEND_API_KEY` set in Vercel environment variables

### Payload CMS — Posts Collection
- Posts collection: title, slug, excerpt, category, status (draft/published), publishedAt, featured flag, readTime, featuredImage (upload), author group, tags, content (Lexical rich text), SEO fields
- Public GET access at `/api/posts`
- `afterChange` hook triggers storefront revalidation on publish

### Storefront — Articles / Blog
- `/articles` — live Payload data, 12/page, category tabs, pagination, newsletter signup
- `/article/[slug]` — reading progress bar, floating ToC, Lexical renderer, Continue Reading, comments
- `src/lib/payload.ts` — `getPosts()`, `getPost()`, `getComments()`, `createComment()`, `parseLexical()`
- Home page editorial section wired to live Payload posts

### Payload CMS — Subscribers Collection
- Subscribers collection with email, source, createdAt
- Duplicate prevention, public POST access
- `afterChange` hook sends welcome email via Resend

---

## 2026-05-27 (Session 1) — Site Settings, Invoice, SEO, Module Fixes

### Payload CMS — SiteSettings Global
Added global `site-settings` with groups:
- `contact` — phone, phoneTollFree, emailInfo, emailSupport, emailSales, emailPress
- `address` — line1, city, state, zip
- `hours` — weekdayOpen, weekdayClose, saturdayOpen, saturdayClose, timezone, sundayClosed
- `social` — facebook, instagram, linkedin, twitter, youtube, pinterest
- `banking` — bankName, accountName, routingNumber, accountNumber, swiftCode, location, memo
- `announcement` — enabled (checkbox), message, link

Migration `20260527_173301` adds banking columns. Applied (Payload batch 6).
`afterChange` hook calls `/api/revalidate?tag=site-settings` on save.

### Storefront — SiteSettings Wired
- `src/lib/payload.ts` — `SiteSettings` type + `SETTINGS_FALLBACK` + `getSiteSettings()`
- `src/app/layout.tsx` — async, fetches settings, passes to Footer
- `src/app/contact/ContactPage.tsx` — all phone/email/address/hours/social from settings
- `src/app/support/SupportPage.tsx` — business hours, phone, email from settings
- `src/components/Footer.tsx` — phone, email, social icons from settings (social conditional on configured URLs)

### Medusa Admin — Invoice System
- `Invoice.tsx` — 522-line print-ready invoice renderer
  - `BankingInfo` type exported, `DEFAULT_BANKING` fallback
  - Wire section renders conditionally per field
  - Fixed hardcoded wrong phone `(813) 997-6996` → `(941) 253-3660`
- `orders/[id]/invoice/page.tsx` — fetches banking from Payload public API in parallel with order
  - `fetchBanking()` hits `https://api.luxus-collection.com/cms/api/globals/site-settings`
  - Passes `banking={banking}` to Invoice component

### SEO Meta — Product Pages
- `src/lib/medusa.ts` — added `seo_meta_title`, `seo_meta_description` to `MappedProduct`
- `src/app/product/[handle]/page.tsx` — `generateMetadata` now calls `getProductDetails()` in parallel
  - Uses `seo_meta_title` / `seo_meta_description` with fallback chain to title/short_description/overview

### Medusa — Custom Module Update Bug Fix
All 4 admin routes had silent no-ops using `updateXxx({ id }, data)` form.
Fixed to array-with-id form: `updateXxx([{ id, ...data }])` in:
- `admin/products/[id]/details/route.ts`
- `admin/products/[id]/specs/route.ts`
- `admin/products/[id]/inventory-info/route.ts`
- `admin/products/[id]/auction/route.ts`

### Medusa — syncMetadata()
Added to `details/route.ts`: copies `contact_for_pricing`, `primary_category`, `short_description`, `engraver` from product_details module into core `product.metadata` JSON column via Knex raw SQL so storefront reads them without N+1.

### Medusa — Product Revalidation
- `src/api/middlewares.ts` — `storefrontRevalidateMiddleware` fires on POST/PUT/DELETE to `/admin/products*`
- `src/subscribers/product-changed.ts` — listens to product.*.created/updated/deleted events, calls `/api/revalidate`
- Fixed `revalidateTag(tag, {})` — this Next.js version requires 2 arguments

### Commits
- `luxus-storefront` `b6fb1bf` — Wire SEO meta fields to product pages; add banking to SiteSettings
- `luxus-storefront` `b844ed0` — Wire Site Settings global into storefront — contact, support, footer
- `luxus-commerce` `872ee2f` — Fix custom module update bug; add storefront revalidation on product changes
- `luxus-commerce` `c9c3bac` — Add invoice system, Create Sale, and banking management via Payload

---

## 2026-05-27 (Session 2) — TS Fixes, Audit, CMS Planning

### TypeScript Errors Fixed (luxus-commerce `09fa1c8`)
4 pre-existing errors eliminated:
- `(data[0] as any).attribute_values` in admin + store attributes routes
  (Medusa's `Product` type has `attribute_value` singular; our custom query field is plural)
- `as InstanceType<typeof AuctionService>` cast in auction route POST + PUT

### Live Site Audit
- All pages return 200, no render errors
- 461 products in Medusa, store API working (publishable key confirmed in Vercel)
- Filters working
- Site Settings data live on contact page (phone, address)
- Banking fields live in Payload API
- SEO meta wired on product pages
- Hero carousel redesigned (intentional) — 5 gradient placeholder slides, no images yet
- About page has gray placeholder boxes where photos should be
- GunBroker section uses mock data (waiting on API key)
- `announcement` field in SiteSettings exists but nothing renders it yet

### Identified CMS Gaps (to build)
1. Hero Slides global — image + kicker + caption per slide, feeds HeroSection carousel
2. Brands collection — logo, origin, description (feeds About page + /brand/[slug] headers)
3. About Page global or images for showroom/team photos
4. Announcement bar — wire SiteSettings.announcement into layout.tsx
5. FAQ collection — replace hardcoded FAQ_DATA array
6. Policy pages — shipping, returns, privacy, terms as Payload content

---

---

## 2026-05-27 (Session 3) — CMS Image Management

### Payload CMS additions
Three new content types registered in `payload.config.ts`:

**`HeroSlides` global** (`src/globals/HeroSlides.ts`)
- Array of up to 6 slides: enabled checkbox, image upload (relation to media), kicker text, caption text
- `afterChange` hook triggers `revalidate?tag=hero-slides`
- Falls back to gradient placeholder slides when no CMS data

**`Brands` collection** (`src/collections/Brands.ts`)
- Fields: name, slug (unique, must match Medusa attribute slug), origin, description, logo (upload), featured flag, sortOrder
- Public read access; linked to `/brand/[slug]` pages
- `afterChange` hook triggers `revalidate?tag=brands`

**`AboutPage` global** (`src/globals/AboutPage.ts`)
- 5 named image slots: heroImage (4:5 portrait), storyImageMain (tall), storyImageLeft, storyImageRight, valuesImage (1:1 square)
- `afterChange` hook triggers `revalidate?tag=about-page`
- All fields optional — falls back to `ImgBox` gradient placeholders

### Storefront wiring
- `src/lib/payload.ts` — added `HeroSlide` type, `getHeroSlides()`, `PayloadBrand` type, `getBrands()`, `AboutPageImages` type, `getAboutPageImages()`
- `src/app/page.tsx` — fetches `getHeroSlides()` in parallel with other data; passes `heroSlides` prop to `HomePage`
- `src/components/home/HomePage.tsx` — accepts `heroSlides?: HeroSlide[]` prop; passes to `<HeroSection slides={...} />`
- `src/app/about/page.tsx` — converted to async server component; fetches images + featured brands in parallel
- `src/app/about/AboutPage.tsx`:
  - Accepts `images: AboutPageImages` and `brands: PayloadBrand[]` props
  - Each `ImgBox` replaced with conditional `<Image>` / fallback pattern
  - `BrandTile` updated to accept logo + slug; renders logo when available; links to `/brand/[slug]`
  - Brand section uses CMS brands when available, falls back to hardcoded array
- `src/app/api/revalidate/route.ts` — allowlist extended: `hero-slides`, `about-page`, `brands`

### Payload migration
- Container rebuild required to pick up new collections/globals
- Migration auto-created on startup (Payload handles schema via `syncMigrations` or manual `migrate:create`)
- Build running in background

### S3 direct-serve configuration
- By default Payload proxies media downloads through the Lightsail server
- Fixed: added `generateFileURL` to `s3Storage` plugin — all media URLs are now
  `https://luxus-collection-media.s3.us-east-1.amazonaws.com/cms/{filename}`
- Files upload directly to S3 (already working), now served directly from S3 too
- **Requires one AWS console step:** S3 bucket policy must allow public GetObject on `cms/*` prefix
  (see "One-time AWS setup" section below)

### One-time AWS setup required
In AWS Console → S3 → luxus-collection-media → Permissions → Bucket Policy:
Add this statement to the existing policy (or create the policy if none exists):
```json
{
  "Sid": "PublicReadCMSMedia",
  "Effect": "Allow",
  "Principal": "*",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::luxus-collection-media/cms/*"
}
```
After adding this, all CMS images will serve directly from S3. No server involved.

### Commits
- `luxus-storefront` `0b4aa84` — Add CMS-managed images: hero slides, about page, brand logos
- `luxus-commerce` `f01bed4` — Add HeroSlides, AboutPage, Brands to Payload; serve media directly from S3

### How to use (once Payload is rebuilt)
1. Go to Payload CMS admin → **Hero Slides** → add slides with photos
2. Go to **Brands** → create brand entries, mark featured, upload logos
3. Go to **About Page** → upload photos for each slot
4. Changes publish instantly via on-demand revalidation (no redeploy needed)

## 2026-05-27 (continued) — Shop Tile Images

### ShopTileImages Payload global
- New global: `services/payload/src/globals/ShopTileImages.ts`
  - Two arrays: `collections[]` and `categories[]`, each row is `{ handle, image }`
  - Handle must match the Medusa URL slug exactly (case-sensitive, lowercase-hyphen)
  - Includes detailed inline instructions in the admin UI for non-technical users
  - `afterChange` hook → `revalidate?tag=shop-tile-images`
- Registered in `payload.config.ts`
- Migration `20260527_185508`: creates `shop_tile_images`, `shop_tile_images_collections`, `shop_tile_images_categories` tables
- Container rebuilt, migration applied

### Storefront wiring
- `src/lib/payload.ts` — added `ShopTileImageMap` type and `getShopTileImages()` function
- `src/app/page.tsx`:
  - `getShopTileImages()` added to `Promise.allSettled` (7th entry)
  - Collections mapped with `imageUrl: tileImages.collections[handle]`
  - Categories mapped with `imageUrl: tileImages.categories[handle]`
- `src/components/home/HomePage.tsx`:
  - `ShopItem` type already had `imageUrl?: string`
  - `CategoryTile` renders `<Image>` when `item.imageUrl` is set, falls back to `<ImgBox>` placeholder
  - Dark gradient overlay on real images, light gradient on placeholders
- `src/app/api/revalidate/route.ts` — `shop-tile-images` added to allowed tags

### How to use
1. Go to Payload CMS admin → **Shop Tile Images**
2. Under "Collection Tile Images", add a row: paste the handle from the URL (e.g. `1911-series`) and upload a landscape photo
3. Under "Category Tile Images", same process (e.g. handle `engraved`)
4. Save — images appear on the home page within 5 minutes

### Commits
- `luxus-storefront` `af1d7e3` — Add Payload CMS image management — hero slides, about page, shop tiles
- `luxus-commerce` `cba3281` — Add ShopTileImages Payload global with migration

---

## 2026-05-27 (continued) — Image URL Fix + Announcement Bar

### S3 Image URL iteration
After the CMS image management build, two fixes were needed:
1. `4d77753` — Images routed through Payload proxy (workaround for S3 policy not yet set)
2. `a922ca4` — Fixed TDZ crash: `tileImages` was referenced before declaration in `page.tsx`
3. `5752c4f` — **Final state:** Reverted `imageUrl()` back to direct S3 URLs (`https://luxus-collection-media.s3.us-east-1.amazonaws.com/cms/{filename}`)

Current image state: media URLs point directly to S3. CMS images will show correctly once the S3 bucket policy allows public `GetObject` on the `cms/*` prefix (see Architecture Notes).

### Announcement Bar
- `src/components/AnnouncementBar.tsx` — new component, reads from `SiteSettings.announcement`
  - Renders a full-width bar above the Header when `announcement.enabled = true`
  - Shows `announcement.message` with optional link
  - Dismissible via localStorage key
- `src/app/layout.tsx` — `<AnnouncementBar settings={settings} />` inserted above `<Header>`
- `src/components/Header.tsx` — removed old static announcement reference

**Commit:** `luxus-storefront` `31958cc`

---

## 2026-05-27 (continued) — Shop By Directory Pages

### New pages: `/shop/brands`, `/shop/collections`, `/shop/categories`
Three directory/index pages that let visitors browse by brand, collection, or category before choosing a product.

- `src/app/shop/brands/page.tsx` — fetches all products with attribute_values to compute brand counts; builds brand list with item count
- `src/app/shop/collections/page.tsx` — fetches Medusa collections via `medusa.store.collection.list()`; shows name + product count
- `src/app/shop/categories/page.tsx` — fetches Medusa categories; shows name + product count
- `src/app/shop/ShopByDirectory.tsx` — shared client component: square responsive grid cards (aspect-ratio 1/1), hover effect, breadcrumb, item count badge; links to existing `/brand/[slug]`, `/collection/[slug]`, `/category/[slug]` filter pages
- `src/app/globals.css` — added `.lxs-shop-by-page`, `.lxs-shop-by-grid` with `min-width: 0` to prevent mobile overflow

### Navigation updates
- `src/components/Header.tsx` — desktop "Shop By" dropdown links updated to file-based routes
- Mobile nav gained a "Shop By" section above Editorial (Brand, Collection, Category links)

**Commits:** `luxus-storefront` `822c0fc`, `78d4d21`, `13ef7c5`, `e93a663`

---

## 2026-05-27 (continued) — Policy Pages CMS + Payload Globals

### Payload CMS — Policy Globals
Three new globals added to Payload (`services/payload/src/globals/`):
- `ShippingPolicy.ts` — slug `shipping-policy`
- `PrivacyPolicy.ts` — slug `privacy-policy`
- `TermsPolicy.ts` — slug `terms-policy`

Each global has:
- `lastUpdated` text field
- `sections` array with `heading` + `body` fields
- `afterChange` hook → `revalidate?tag=policy-shipping|policy-privacy|policy-terms`
- Public read access

Migration `20260527_230000.ts` creates 6 tables:
`shipping_policy`, `shipping_policy_sections`, `privacy_policy`, `privacy_policy_sections`, `terms_policy`, `terms_policy_sections`

`importMap.js` corrected from 1-entry to full 54-entry version (see CMS White Page section below).
Dockerfile updated: `RUN npm run generate:importmap` runs before build; `RUN rm -f .next/lock && npm run build` prevents stale lock.

### Storefront — Policy Pages Wiring
- `src/lib/payload.ts` — added `PolicySection`, `PolicyData` types and `getPolicy(slug)` function
  - Fetches from Payload; falls back to full hardcoded policy content if CMS is empty
  - All original policy text preserved in `POLICY_FALLBACK_SECTIONS`
- `src/components/PolicyPage.tsx` — stripped 750+ lines of hardcoded content; now driven entirely by `PolicyData` prop
- `src/app/shipping/page.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx` — converted to async server components, call `getPolicy()`, pass `data` prop; `export const revalidate = 300`
- `src/app/api/revalidate/route.ts` — `policy-shipping`, `policy-privacy`, `policy-terms` added to `ALLOWED_TAGS`

**Commits:** `luxus-storefront` `0e82a7c`, `luxus-commerce` `2221c1f`

---

## 2026-05-28 — CMS White Page Fix

### Root Cause
After adding the 3 policy globals and rebuilding the Docker container, Payload CMS admin showed a blank white page (HTTP 200 but no rendered content).

Root cause: the `importMap.js` file was compiled into the `.next` bundle with only 1 entry (CollectionCards) instead of the full 54 entries. All Lexical editor components and the S3 upload handler were missing from the runtime import map. The Payload admin RSC tree resolved all component references as `undefined` → rendered null → white page.

### Why it happened
`npx payload generate:importmap` is environment-sensitive. When run in certain container contexts (partial env vars via `--env-file` without `DATABASE_URL` and `PAYLOAD_PUBLIC_SERVER_URL` being explicitly set), it only discovers 1 component. With a complete env (including those two vars), it discovers all 25 components and writes the 54-line file.

### Fix
1. Started a named rebuild container (`payload-rebuild`) from the existing image with full env via `--env-file`
2. `docker exec payload-rebuild npx payload generate:importmap` → confirmed 54-line output
3. `docker exec payload-rebuild sh -c "rm -f .next/lock && npm run build"` → compiled successfully (~127s)
4. `docker commit --change 'CMD ...'` → new `luxus-commerce-payload:latest`
5. `docker compose up -d payload` → production restarted with correct image
6. Verified: `GET /cms/admin` returns 200 with real RSC payload; all 3 policy globals accessible via API

### Dockerfile (already updated in `2221c1f`)
```dockerfile
RUN npm run generate:importmap    # must run before build
RUN rm -f .next/lock && npm run build
```
Future Dockerfile builds will be correct. The fix tonight was a Docker image rebuild only — no source changes.

---

## Known Issues / Deferred

| Issue | Status | Notes |
|---|---|---|
| S3 public bucket policy | Pending AWS console step | Add `PublicReadCMSMedia` statement to `luxus-collection-media` bucket policy so `cms/*` images serve directly (see Session 3 above) |
| CMS policy content | Empty | Shipping/Privacy/Terms globals exist; content must be entered via Payload admin |
| GunBroker auctions section | Mock data | Waiting on API key from GunBroker |
| Cart page `/cart` | Prototype only | Blocked on payment processor |
| Account page `/account` | Mock data | Blocked on Medusa customer auth |
| Auth page `/auth` | Prototype | Blocked on customer auth |
| Storefront `/invoice/[orderId]` | Mock data | Real invoice is in Medusa admin; customer-facing storefront version is a prototype |
| Meilisearch search | Not wired | Running on server, needs storefront integration |
| Payment processor | Not started | Must be firearms-friendly: EPIC, TacticalPay, PaymentCloud |
| FFL compliance | Not started | FastBound API, dealer network lookup |
| VIP/Backroom area | Not started | Password-protected route for is_backroom products |
| Sitemap / robots.txt | Not started | SEO crawlability |
| JSON-LD structured data | Not started | Product schema for Google rich results |
| FAQ collection | Not started | Currently hardcoded in `FAQPage.tsx`; planned as Payload collection |

---

## 2026-05-28 — Classifieds Section Added to Scope

Post-SOW feature added at owner's request. A peer-to-peer classifieds marketplace within luxus-collection.com where registered users can post guns for sale. No payment processed on-site — GunInternational.com style but modern and Luxus-themed.

Key decisions logged:
- Registered users only (requires account system to be built first)
- Seller chooses contact method: on-site form or direct contact info displayed
- Fully separate from Medusa store (own pages, own data, own URL structure at `/classifieds`)
- Data storage and search architecture to be decided when closer to building — Meilisearch is the natural fit for listing search; Payload vs. dedicated storage will be evaluated for admin manageability at scale
- Priority: after core site, manufacturer profiles, payment flow, and customer accounts are complete

Full spec in memory: `feature_classifieds.md`

---

## 2026-05-28 — SOW Review + Platform Decisions

Reviewed the full 35-page SOW (`Cluade Ecommerce Platform SOW.pdf` in luxus-commerce root). Confirmed decisions:

### Payment Processing
- **Elavon Converge Pay** — confirmed firearms-approved merchant account. Replaces SOW's EPIC/TacticalPay/PaymentCloud recommendation.
- Integration method TBD (Converge.js embedded vs. hosted payment page) — confirm with Elavon before building.
- Wire/check payment flow still required as separate manual payment method.

### Email Architecture
- **Klaviyo** — marketing email platform. No account yet. Replaces custom Resend cron + Payload Subscribers for newsletter.
- **Resend** — transactional email only (order confirmation, shipping, payment received, account creation — templates still to build).
- Newsletter migration plan: create Klaviyo account → update signup API → export Payload subscribers to Klaviyo → remove weekly cron.

### Manufacturer Profile Hub
- **Full hub from start**, built incrementally. Modeled on luxuscap.com/resources-on-guns/.
- Each brand gets: hero image, founding year, location, rich text history/philosophy, gallery images, Mux video embed, linked Medusa products, SEO fields.
- Articles in the Posts collection link to brands by slug.
- Storefront `/brand/[slug]` page becomes full editorial hub (not just a product listing).

### FastBound
- No account yet. Using paper A&D book. To be integrated when ready to scale.

### Next Build Priority
- Manufacturer profile hub (expand Brands collection in Payload + rebuild brand page in storefront)

---

## Architecture Notes

### Critical: Never expose inventory_management module to store API
The `inventory_management` module contains consignment/backroom flags and cost data. These must NEVER appear in any `/store/*` route response.

### Domain switch is LAST
`luxus-collection.com` currently points elsewhere. Vercel deployment is at `dev.luxus-collection.com`. Domain switch happens ONLY after everything else is complete and tested.

### This Next.js version has breaking changes
- `revalidateTag(tag, profile)` requires 2 arguments — pass `{}` as second arg
- Read `node_modules/next/dist/docs/` before writing new Next.js API code

### Medusa custom module update pattern
Always use array-with-id form: `service.updateXxx([{ id, ...data }])`
The selector+data form `service.updateXxx({ id }, data)` silently no-ops in this version.

### Payload CMS importMap is environment-sensitive
`npx payload generate:importmap` must run in an environment that has `DATABASE_URL` and `PAYLOAD_PUBLIC_SERVER_URL` set to produce the full 54-entry map. Without these, it may produce only 1 entry (CollectionCards), causing the admin white page. The Dockerfile is already corrected: `generate:importmap` runs before `npm run build`.

### CMS image serving
All Payload CMS media uploads go to S3 (`cms/` prefix on `luxus-collection-media` bucket). `imageUrl()` in `src/lib/payload.ts` returns direct S3 URLs. These require the bucket's public read policy to include the `cms/*` prefix. Until that policy is in place, uploaded images will return 403.

### Content management summary
All content that should be editable without a code deploy lives in Payload CMS:
- **Hero slides** — images, kicker text, captions (global: `hero-slides`)
- **Shop tile images** — collection/category card images on home page (global: `shop-tile-images`)
- **Brands** — full manufacturer hub: name, logo, heroImage, tagline, foundingYear, origin, history (Lexical), modelSeries[], gallery[], timeline[], SEO (collection: `brands`)
- **About page images** — hero, story, values photos (global: `about-page`)
- **Site settings** — phone, email, hours, social links, banking info, announcement bar (global: `site-settings`)
- **Articles / Blog** — full editorial posts with Lexical editor, optional `brand` relationship (collection: `posts`)
- **Policy pages** — shipping, privacy, terms sections (globals: `shipping-policy`, `privacy-policy`, `terms-policy`)

---

## 2026-05-28 — Manufacturer Profile Hub

### Payload CMS — Brands collection expanded
New fields added to `brands` collection (migration `20260528_000000` applied on restart):
- `heroImage` — widescreen header image for brand hub page
- `tagline` — short phrase shown under brand name
- `foundingYear` — numeric year established
- `history` — Lexical richText (main editorial body: paragraphs, headings, quotes, embedded images)
- `modelSeries[]` — array: name, yearIntroduced, description (richText), image, productHandle (Medusa link)
- `gallery[]` — array: image + optional caption
- `timeline[]` — array: year, title, body, optional image
- `seoTitle` / `seoDescription` — sidebar SEO override fields
- `afterChange` hook — revalidates `brands` and `brand-{slug}` cache tags on save

### Payload CMS — Posts collection updated
- Added optional `brand` relationship field (sidebar position)
- Articles tagged with a brand appear in the "Articles & Resources" section on that brand's hub page

### Storefront — /brand/[slug] rebuilt as full editorial hub
`src/app/brand/[slug]/page.tsx` (server component) now:
- Fetches brand editorial data from Payload CMS (`getBrand(slug)`)
- Fetches linked articles from Payload (`getPostsByBrand(brandId)`)
- Fetches Medusa products filtered by brand attribute
- All fetches run in parallel

`src/app/brand/[slug]/BrandHubPage.tsx` (new client component) renders:
- **Hero** — full-width hero image with overlay, brand name, tagline
- **Meta bar** — founding year + location
- **History** — Lexical richText rendered using inline LexBlock/InlineNode renderer
- **Model Series** — card grid, each with image, name, year, description excerpt; links to Medusa product handle if set
- **Photo Gallery** — responsive image grid with captions
- **Brand Timeline** — vertical timeline with year markers
- **Articles & Resources** — article cards (featured image, category, title, excerpt)
- **Available for Purchase** — product card grid (up to 8; "View All" link to /shop?brand=X if more)
- Graceful degradation — if no Payload brand record exists, shows only products (existing behavior preserved)

### Storefront — src/lib/payload.ts updated
- Added `PayloadBrandFull`, `PayloadModelSeries`, `PayloadGalleryItem`, `PayloadTimelineItem` types
- Added `getBrand(slug)` — fetches single brand with depth=2 (resolves all image relationships)
- Added `getPostsByBrand(brandId, limit=8)` — fetches published posts where brand relationship equals brandId
- Refactored `getBrands()` to use shared `mapBrandBase()` helper

### Technical notes
- `payload-types.ts` manually updated to add `Brand` interface + `BrandsSelect<T>` + `brands` in Config — needed because the auto-generated file was stale (Brands collection added after last `generate:types` run)
- Migration uses direct FK column `brand_id integer` on `posts` table (Payload stores `hasMany: false` relationship as direct FK, not rels table)
- **Comments** — article comments with moderation workflow (collection: `comments`)

---

## 2026-05-28 — Resources on Guns, Bug Fixes, CMS Expansion, Sell Your Gun

### Resources on Guns section
- Built out a CMS-driven article/resource system so new pages and content can be created and managed without code changes
- Pattern mirrors Luxuscap.com approach: Payload CMS `posts` collection drives content, storefront renders dynamically
- Fixed bugs introduced during initial build-out (Payload test content not appearing on site, pricing display issues, bullet point formatting, mobile layout)
- **Available for Purchase** section: fixed wrong price displaying; formatting now matches store page style
- Current content is placeholder/test content mirroring Luxuscap.com — will need to rewrite for Luxus Collection

### About page — CMS wired up
- Expanded `AboutPage` global in Payload from 5 image-only fields to ~50 total fields covering all text content
- Sections covered: Hero (headline, description, 3 stats × 2 fields each), Our Story (7 fields), Philosophy (6 card fields), Mission/Pillars (12 fields), Curation Standard (10 fields), FFL Compliance (3 fields including license number)
- Migration `20260528_040000.ts` — ALTER TABLE to add all new columns (nullable)
- `admin.group` NOT used (Payload 3.x doesn't support it — would cause TypeScript build error)
- Seeded CMS via SQL with all existing hardcoded copy as starting values
- Storefront `AboutPage.tsx` now resolves all text via `c = { field: text.field ?? "hardcoded default" }` pattern
- FFL license number: previously hardcoded placeholder "1-59-XXX-XX-XX-55688" — now editable in CMS under Globals → About Page → FFL License Number

### Consignment page — CMS wired up, renamed to "Sell Your Gun"
- Created `ConsignmentPage` Payload global with 18 text fields: headline, intro, differentiation box, option headings/bodies, commission note, form heading, 4 process steps, outright box body
- Migration `20260528_050000.ts` — CREATE TABLE for new global
- Commission note supports `**bold**` markdown syntax; `renderNote()` parser in `ConsignmentPage.tsx` renders bold spans
- Phone, email, and business hours pulled from `SiteSettings` global (not duplicated) — edit once, updates everywhere
- Seeded CMS with all existing hardcoded copy

### Route rename: /consignment → /sell-your-gun
- Directory moved: `src/app/consignment/` → `src/app/sell-your-gun/`
- Permanent redirect added to `next.config.ts`: `/consignment` → `/sell-your-gun`
- Updated all internal links: Header nav, Header mobile nav, Header dropdown, Footer, Support page "Submit a Consignment" card
- Breadcrumb updated: "Consignment" → "Sell Your Gun"
- `activePage` detection in Header handles both paths (returns `'consignment'` for active state)

### Migration index fix
- `20260528_030000` (policy globals from previous session) was missing from `migrations/index.ts` — added it along with 040000 and 050000

### Payload build and deployment
- All three new migrations built and applied via `npx payload migrate`
- Payload Docker image rebuilt; all migrations ran clean

### Commits pushed to Vercel
- All accumulated changes (Resources on Guns, About CMS, Consignment CMS, route rename) committed and pushed
- Vercel deployment triggered

### Key technical notes
- Payload snake_case rule: underscores are inserted before uppercase letters ONLY, not before numbers — `stat1Number` → `stat1_number` (not `stat_1_number`)
- Docker exec heredoc limitation: `<<'EOF'` doesn't work with `docker exec`; workaround is write SQL to temp file, `docker cp` to container, then `psql -f /tmp/file.sql`
- Stale `.next` cache after directory rename shows false TypeScript errors referencing old path — safe to ignore; filter with `grep -v validator.ts`
- **Subscribers** — newsletter subscribers (collection: `subscribers`)

---

## 2026-05-29 — Sell Your Gun options, CMS revalidation fix, Contact/Support CMS, live map

### Sell Your Gun page — Classifieds option + link system
- Added a 3rd option to the "Consign or Sell — What's the Difference?" box for the Classifieds section
- Added option3–5 slots in Payload CMS (heading + body + link + link text each); options 4–5 are blank spares for future use
- Links appear **after** body text as a small gold arrow link, not on the heading — separate link-text field controls the label
- Added link + link-text fields to options 1–2 as well for consistency
- Added link + link-text to the "Prefer to Sell Outright?" sidebar box
- Seeded option3 with "Classifieds" / "Browse Classifieds" → `/classifieds`
- Migrations: `20260529_000000` (option3–5 slots), `20260529_010000` (link text fields)

### CMS → storefront revalidation — critical bug fix
- **Root cause 1**: `STOREFRONT_URL` and `REVALIDATE_SECRET` were not passed to the Payload Docker container via `docker-compose.yml`. Every CMS save silently did nothing — the `if (!secret) return` guard exited immediately.
- **Root cause 2**: `consignment-page` and `faq-page` tags were missing from the storefront's allowed-tag allowlist in `src/app/api/revalidate/route.ts`, causing 400 errors even when the hook did fire.
- Fix: Added both env vars to `docker-compose.yml` Payload service; added missing tags to the allowlist.
- Manually triggered revalidation for `consignment-page`, `about-page`, and `faq-page` after deploy to flush stale cached content.
- **Going forward**: saving any global in the Payload admin now instantly updates the live site.

### Contact page — wired to Payload CMS
- New `ContactPage` global: headline, intro paragraph, 10 topic slots for the form dropdown (7 pre-seeded, 3 spare), sub-text for Email / Sales / Press channel cards, and all 4 "What To Expect" cards (title + body)
- Migration: `20260529_020000` (CREATE TABLE contact_page)
- Seeded with all existing hardcoded copy

### Support page — wired to Payload CMS
- New `SupportPage` global: headline, intro, 10 topic slots (8 pre-seeded), email card sub-text, full FFL Transfer section (headline, intro, fee note, all 5 steps), and 3 info cards at the bottom
- Info Card 1 (Legal Compliance) now has the FFL license number editable in CMS — no code deploy needed to update it
- Migration: `20260529_030000` (CREATE TABLE support_page)
- Seeded with all existing hardcoded copy
- Both Contact and Support added to revalidation allowlist

### Contact page — live Google Maps embed
- Replaced the decorative placeholder with a real `<iframe>` Google Maps embed
- Auto-generates embed URL from the address already in Site Settings — works immediately with no extra steps
- Added `mapEmbedUrl` field to the `address` group in `SiteSettings` Payload global — user can paste a custom Google Maps share embed URL to override (better zoom, exact pin, etc.)
- Migration: `20260529_040000` (ALTER TABLE site_settings ADD COLUMN address_map_embed_url)
- Address overlay card (name + street) stays pinned over the map corner

### CMS content management summary — pages now fully editable
All key public pages are now CMS-driven: Hero, About, FAQ, Sell Your Gun, Contact, Support, Shipping/Privacy/Terms policies, Site Settings (phone, email, address, hours, social, announcement bar), Articles/Blog, Brands hub, Resources on Guns.

### Pending items
- Resources on Guns content needs rewrite (currently Luxuscap.com test content)
- FFL license number: update via CMS → Globals → About Page AND Support Page → Info Card 1 Body
- Custom map embed URL: get precise pin from Google Maps → Share → Embed → paste src URL into CMS → Site Settings → Address → Map Embed URL
- SOW remaining items: FastBound, GunBroker, classifieds section, manufacturer profile hub, etc.

### Contact page — Support link moved into dropdown
- Desktop header: "Support" removed from top-level nav, added as second item in the Contact dropdown (Contact Us → Support → Sell Your Gun)
- Contact nav item now highlights gold when on any of the three pages
- Mobile nav unchanged — Support remains in the "Help" section

### Contact page — live Google Maps embed
- Replaced the decorative placeholder with a real `<iframe>` Google Maps embed
- Auto-generates embed URL from the address already in Site Settings — works immediately
- Added `mapEmbedUrl` field to the `address` group in the `SiteSettings` Payload global (migration `20260529_040000`)
- To get a precise embed: Google Maps → search address → Share → Embed a map → copy the src URL → paste into CMS → Site Settings → Address → Map Embed URL

### Footer — CMS managed
- Footer brand blurb, copyright line, and legal/FFL compliance line now editable in CMS → Site Settings → Footer
- Migration `20260529_050000` — ALTER TABLE site_settings ADD COLUMN footer_blurb, footer_copyright_line, footer_legal_line
- Seeded with current copy; fallbacks in Footer.tsx ensure no content disappears if fields are blank

---

## 2026-05-29 (continued) — Featured page, product tags/types, FFL block

### Featured page — built from scratch
- New route: `/featured` (was referenced in footer but page didn't exist)
- **Products section**: pulls from Medusa "Featured" tag (primary) + "featured" collection (fallback) + newest 4 (last fallback)
- **Classifieds preview section**: 4 mock listings (Colt Python, Walther PPK/S, Korth Combat, SIG P210 Legend) — "Coming Soon" ribbon on each card
- **Waitlist CTA** at bottom links to /contact for classifieds early access
- **Payload CMS**:
  - `FeaturedPage` global: headline, intro, classifieds section headline/intro/badge
  - `FeaturedClassifieds` collection: title, price, priceNote, condition, category, brand, model, caliber, description, location, listedBy, featuredImage, sortOrder, active
  - Migration `20260529_060000` — CREATE TABLE featured_page + featured_classifieds
- Responsive grids: 4-col products (→ 3 → 2 → 1), 3-col classifieds (→ 2 → 1)
- Both globals/collections registered in payload.config.ts

### Medusa product tags and types — wired into storefront
- `MappedProduct` now includes `tags: string[]` and `is_firearm: boolean`
- `is_firearm` derived from product type value === "Firearm" (case-insensitive)
- Added `getProductTags()` and `getProductTypes()` to `src/lib/api.ts`
- `*tags,*type` added to PRODUCT_FIELDS on home page, shop page, product detail page, and featured page
- Featured page queries by the "Featured" tag (many-to-many — product stays in its own collection and gets the tag simultaneously); falls back to the "featured" collection
- Home page featured section updated to use the same tag-based logic

### Product detail page — FFL Transfer Required block
- Block previously always showed on every product detail page
- Now gated on `product.is_firearm === true` — non-firearm products show nothing
- Restyled: solid gold left border (3px), gold shield icon, gold heading, body in textMuted
- Added "How FFL transfers work →" link pointing to /support#ffl
- For non-firearm products (accessories, etc.): leave product type blank in Medusa admin

### Bulk product type assignment
- All 493 existing products had no type set
- SQL UPDATE ran directly on the Medusa postgres database to set all to "Firearm" type (`ptyp_01KST78SJY7TWJ40JBJVRGE9DG`)
- 498 total products now classified as Firearm
- Going forward: new firearm products → set type to "Firearm"; non-firearm products → leave type blank

### Pending items
- Resources on Guns content needs rewrite (currently Luxuscap.com test content)
- FFL license number: update in CMS → About Page + Support Page → Info Card 1
- Custom map embed URL: paste precise Google Maps share URL into Site Settings
- Featured classifieds are mock data — replace when classifieds section is built
- SOW remaining items: FastBound, GunBroker, classifieds section, manufacturer hub, etc.

### Contact info deduplication — all hardcoded phone/email replaced
Previously, phone numbers and email addresses were hardcoded in 6 separate files. A phone number change required a code deploy to update them all. Now every location pulls from SiteSettings.

**Files updated:**
- `src/app/product/[handle]/ProductDetailPage.tsx` — inquiry section phone/toll-free/info@, error message sales@
- `src/app/faq/FAQPage.tsx` — "Still Have Questions?" contact cards; hours string also from settings
- `src/app/product/[handle]/print/PrintPage.tsx` — print sheet contact block
- `src/components/PolicyPage.tsx` — policy pages footer contact block (applies to /privacy, /shipping, /terms)
- `src/app/invoice/[orderId]/InvoicePage.tsx` — invoice masthead phone/toll-free AND address (line1, city, state, zip)

**Pattern:** Each server `page.tsx` now calls `getSiteSettings()` in parallel with its existing data fetches and passes `settings` as a prop. Client components use `settings?.contact.phone ?? "fallback"` so pages never break if CMS is unreachable.

**Result:** Edit phone, toll-free, or email once in CMS → Globals → Site Settings → Contact Information and all 6 locations update simultaneously.

### Shop by Model directory page
- New route `/shop/models` — dynamic directory built from the attributes module
- Reads every unique model value across all products, counts inventory per model, sorts by count
- Same card UI pattern as `/shop/brands`, `/shop/collections`, `/shop/categories`
- Tile images managed via CMS: **Globals → Shop Tile Images → Model Tile Images** (new array added to the existing global)
- Handle = model name as a URL slug (e.g., "Python" → `python`, "P210 Legend" → `p210-legend`)
- Clicking a card goes to the existing `/shop/model/[slug]` filtered listing (already built)
- Migration `20260529_070000` — CREATE TABLE shop_tile_images_models (matches sub-table structure of collections/categories)
- `getShopTileImages()` updated to return `models: ShopTileImageMap` alongside existing collections/categories maps
- `ShopByDirectory` updated: added `'model'` to the type union
- **Header**: Models added to Shop By dropdown (desktop) and Shop By section (mobile)
- **Footer**: Models added to Shop column; other Shop links corrected from `?by=` query params to proper `/shop/*` directory URLs

### TypeScript build fix — tileImages fallback type
- `getShopTileImages()` return type gained a `models` property, but fallback objects in four `page.tsx` files used plain `{}` with no index signature
- TypeScript on Vercel rejected `tileImages.collections[handle]` because `{}` has no index signature
- Fixed in `src/app/page.tsx`, `src/app/shop/categories/page.tsx`, `src/app/shop/collections/page.tsx`, and `src/app/shop/models/page.tsx`
- All fallback objects now cast: `{ collections: {} as Record<string,string>, categories: {} as Record<string,string>, models: {} as Record<string,string> }`
- Build passes on Vercel after two-commit fix

---

## 2026-05-29 (continued) — Customer auth, account pages, password reset

### Customer accounts — fully wired (no longer a prototype)

**Auth library (`src/lib/auth.ts`)**
- `authSignIn`, `authRegister`, `createCustomerProfile`, `getCustomer`, `updateCustomer`, `getCustomerOrders`
- localStorage wishlist helpers: `getWishlist`, `isWishlisted`, `toggleWishlist` (key: `lxs_wishlist`)

**AuthContext (`src/context/AuthContext.tsx`)**
- Holds customer state, JWT token, loading state
- Hydrates from `localStorage` (`lxs_auth_token`) on mount; fetches `/store/customers/me` to validate
- Clears token automatically if expired (401 response)
- `signIn` → Medusa emailpass auth → store token → fetch customer
- `register` → create auth identity → create customer profile → auto sign-in
- `signOut` → clear token + customer state
- `updateProfile` → `POST /store/customers/me` → updates customer state

**Layout** — `AuthProvider` wraps app in `src/app/layout.tsx`

**AuthPage** — all `setTimeout` mocks replaced with real API calls; shows error messages on failure; redirects to `/account` on success

**AccountPage** — real customer name/email/member-since; real order history from `GET /store/orders`; localStorage wishlist with remove; real profile update (name, phone); redirects to `/auth` if not logged in

**ProductDetailPage** — wishlist button persists to localStorage; hydrates `wishlisted` state on mount

### Password reset — fully wired

**Flow:**
1. Click "Forgot password?" on sign-in form → inline email form appears
2. `POST /api/auth/forgot-password` (server route) → calls Medusa `reset-password` endpoint
3. Medusa fires `auth.password_reset` event → Medusa subscriber sends branded email via Resend with 15-minute token link to `/auth/reset?token=...`
4. User clicks link → `/auth/reset` page — enter new password with strength meter
5. `POST /api/auth/reset-password` (server route) → calls Medusa `update` endpoint server-side (avoids CORS)
6. Redirects to `/auth?reset=success` → shows "✓ Password updated" banner

**New files:**
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/auth/reset/page.tsx` + `ResetPasswordPage.tsx`
- `services/medusa/.../subscribers/auth-password-reset.ts` — Resend email on reset
- `services/medusa/.../subscribers/customer-welcome.ts` — Resend welcome email on registration

### Registration welcome email
- Medusa `customer.created` subscriber sends branded welcome email with name + link to collection

### CORS fix
- Added `dev.luxus-collection.com` to `STORE_CORS` and `AUTH_CORS` in Medusa env
- Medusa rebuilt and restarted

### Build fix
- `useSearchParams()` in `ResetPasswordPage` and `AuthPage` wrapped in `<Suspense>` — Vercel requires this for pages that use search params during static generation

### Key technical notes
- Medusa register token ≠ session token: `/auth/customer/emailpass/register` returns a register-only token; must call `/auth/customer/emailpass` (sign-in) separately to get a session token with `actor_id` set
- Password update uses reset token from event, NOT session token — update endpoint is `POST /auth/customer/emailpass/update` with `Authorization: Bearer {resetToken}`
- Welcome email fetches customer from Medusa's query graph in the subscriber to get email + first_name

### Auth-aware header and redirect polish
- **`/auth` redirects to `/account`** when already signed in — no more showing the login form to an authenticated user
- **Desktop header Account link** shows customer's first name when signed in (e.g., "James" instead of "Account")
- **Mobile nav Account section** adapts to auth state:
  - Header shows customer's full name when signed in
  - Items switch from Sign In/Register to My Account + Order History
  - Sign Out button appended at the bottom, styled in red
- Both desktop and mobile `Header` components now consume `useAuth()` context

---

## 2026-05-31 — CMS fix, brand profile improvements, content prompt

### Payload CMS admin — emergency fix
- **Bug**: `payload_locked_documents_rels` table was missing a `featured_classifieds_id` column
- Root cause: when the `FeaturedClassifieds` collection was added, the manual migration created the main `featured_classifieds` table but missed the relationship column Payload requires in its internal document-locking table (needed to track which user has a record open for editing)
- Fix: `ALTER TABLE payload_locked_documents_rels ADD COLUMN featured_classifieds_id` + index + FK — applied directly via `psql`, then Payload restarted
- CMS admin portal fully accessible again

### Brand profiles — Resources on Guns improvements
Three changes to the Model Series & Product Lines section:

1. **Models now show without a product URL** — previously the `.filter(m => m.productHandle)` in `ResourcesBrandPage.tsx` hid any model series entry that had no Medusa product link. Removed the filter so all entries always display. Enables brand profiles for historical brands and smaller manufacturers with no current inventory.
   - Cards **with** a product URL: clickable, hover effect, "Shop This Series" label
   - Cards **without** a product URL: non-interactive, "Model Overview" label, no hover lift

2. **Description field now rendered** — the rich text description from each Model Series CMS entry was parsed from Lexical JSON but never displayed. Now renders between the image and the footer strip using the existing `LexBlock` renderer.

3. **Visual polish** — description font reduced from 12.5px to 11.5px; cards now use flexbox column layout (`height: 100%`, `flex: 1` on description) so all cards in a row reach equal height regardless of description length; footer always pinned to the bottom.

### Content prompt — brand profiles
Created a structured AI prompt for drafting brand profile content covering all CMS fields: tagline, founding year, origin, history (4–6 paragraphs), model series entries (name, year, description), timeline milestones, and SEO title/description. Prompt requests a verification note for any facts that should be checked before publishing.

---

## 2026-06-01 — Product card UX overhaul, mobile grid fix

### Mobile grid fix — Model Series (1 column)
- Changed `.rp-series-grid` from `repeat(2, 1fr)` to `1fr` on the `max-width: 640px` breakpoint in `globals.css`
- Model Series cards on brand profile pages now stack single-column on mobile
- Tablet and desktop layout unchanged

### Product cards — wishlist heart, Add to Cart, click-anywhere navigation
All five product card implementations updated across the site: `ShopPage.tsx`, `ListingPage.tsx`, `HomePage.tsx`, `FeaturedPage.tsx`, `ResourcesBrandPage.tsx`

**Changes to every card:**

1. **Heart / Wishlist icon** — SVG heart button before the CTA. Fills red when item is wishlisted; persists to localStorage (`lxs_wishlist`). Clicking the heart does not navigate to the product page (stopPropagation).

2. **Conditional CTA:**
   - Items with a price → **Add to Cart** button (gold bordered, flashes "Added ✓" for 1.8s)
   - Items with "Contact Us For Pricing" → **View Details** text link (same as before)
   - Neither CTA navigates unless clicked directly (stopPropagation)

3. **Click-anywhere navigation** — outer card div has `onClick → router.push(/product/handle)`. Previously some cards used `<Link>` wrappers which conflicted with inner buttons; all converted to `div` + `useRouter`.

**CartContext (`src/context/CartContext.tsx`) — new file**
- localStorage cart (`lxs_cart`) — mirrors AuthContext pattern
- Provides: `cartItems`, `cartCount`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `isInCart`
- `CartProvider` added to `src/app/layout.tsx` wrapping the app
- `Header` now reads `cartCount` from CartContext directly (removed the `cartCount` prop that was always `0`)
- `MobileNav` also reads from CartContext (no longer takes a prop)

**MappedProduct** — added `variant_id: string | null` field (first variant's ID, for future Medusa cart API integration)

**Technical notes:**
- `WishlistItem.handle` is the key (not `id`) — all heart handlers pass full WishlistItem shape including `brand`, `caliber`, `action`, `contact_for_pricing`
- Cart is localStorage-only for now; Medusa cart API integration deferred until Elavon payment processor is set up

### Cart page — real data, demo removed
- Removed hardcoded `INITIAL_CART` demo items; page now reads from `CartContext` (`lxs_cart` localStorage)
- Product thumbnails shown with clean placeholder fallback
- Quantity `−` / `+` controls wired to `updateQuantity`
- "Save for Later" moves item to wishlist (localStorage) then removes from cart with "✓ Saved to Wishlist" confirmation
- Price row shows per-item price and qty-multiplied total when qty > 1
- Checkout replaced with "Contact Us to Order" → `/contact` with a note that online checkout is coming soon (Elavon pending)
- Empty-cart state and FFL notice retained

---

## 2026-06-01 (continued) — Transactional emails

Three new Medusa subscribers built and deployed. All follow the same Resend pattern as the existing welcome and password-reset emails.

### order-placed.ts — Order confirmation
- Event: `order.placed`
- Queries: order display_id, email, items (title/qty/price), shipping address, customer name, totals
- Email: itemized order table, subtotal/shipping/tax/total, FFL Transfer Required notice, "Ship To" address, "View Order" link
- Subject: `Order Confirmed — Luxus Collection #[display_id]`

### order-shipment.ts — Shipping notification  
- Event: `shipment.created`
- Queries: fulfillment → tracking_links + labels (fallback) → linked order → customer
- Email: tracking number(s) as clickable links when URL present, items shipped list, FFL next steps (Form 4473, bring ID)
- Gracefully handles missing tracking: "Tracking information will be emailed separately"
- Subject: `Your Order Has Shipped — Luxus Collection #[display_id]`

### payment-received.ts — Payment confirmation
- Event: `payment.captured`
- Queries: payment → payment_collection → orders → customer
- Email: amount received, date, order total, "1–2 business day" shipping promise
- Subject: `Payment Received — Luxus Collection #[display_id]`

### Shared details
- All three use `RESEND_API_KEY`, `STOREFRONT_URL`, `EMAIL_FROM` env vars (already set)
- Phone number pulled from SiteSettings DB: (941) 253-3660
- Address: 1199 N Beneva Rd, Sarasota, FL 34232
- Medusa rebuilt and restarted; all 6 subscribers confirmed compiled in container

### Visual polish — badge cleanup
- Removed green dot from "Available" badge on product cards (ShopPage, ListingPage, ResourcesBrandPage) — text only, padding fixed by restoring `display:flex; alignItems:center`
- Removed red pulsing dot from "Live" auction badge on home page (HomePage AuctionCard) — changed to green text + green border on white background, matching Available badge style

### Product Detail Page — four bug fixes + Related cards improvements
Four issues identified and fixed on the PDP:

1. **Stock badge dot removed** — Available/Unavailable badge on the main product image had a dot; removed to match listing card style
2. **Add to Cart wired** — main CTA button and sticky bar button now call `CartContext.addItem`; button turns green and shows "Added to Cart ✓" for 1.8s
3. **Breadcrumb brand link fixed** — was linking to `/brand/[slug]` (correct store page), then briefly changed to `/resources-on-guns/[slug]`, corrected back to `/brand/[slug]` which is the ListingPage filtered by brand
4. **RelatedCard updated** — "You May Also Consider" cards now match listing card behavior: click-anywhere navigation, heart/wishlist toggle, Add to Cart vs View Details conditional CTA

### You May Also Consider — layout improvements
- **Equal heights** — cards use `display:flex; flexDirection:column; height:100%`; image has `flexShrink:0`; body has `flex:1`; divider has `marginTop:auto` to pin price/CTA row to bottom; grid has `alignItems:stretch`
- **Price row alignment** — price span has `whiteSpace:nowrap; overflow:hidden; textOverflow:ellipsis` so it never wraps and stays on one line with heart + button
- **Mobile layout** — on ≤640px the price row switches to `flex-direction:column` (price above buttons) via `.lxs-related-price-row` CSS class

### Badge cleanup — Available/Unavailable dot
- Removed dot from product card Available badge: ShopPage, ListingPage, ResourcesBrandPage
- Fixed padding regression (restored `display:flex; alignItems:center` after dot removal)
- Removed red pulsing dot from GunBroker "Live" auction badge on home page → green text + green border, white background

### Mobile PDP — padding, form, related card alignment (multiple iterations)
- Added `lxs-pdp-section-wrap` class to hero, tabs, inquiry, and related sections → explicit `padding-left/right: 16px` on mobile (attribute selector approach was unreliable)
- Added `lxs-pdp-form-box` class to inquiry form white box → `padding: 20px` on mobile (was 36px)
- Added missing mobile overrides for `padding: 10px 40px` (sticky bar) and `padding: 60px 40px` (form success box)
- Related card price row on mobile: `flex-direction: column`, price text `text-align: center`, button group `margin: 0 auto` — price, heart, and Add to Cart all centered as a group
- Related card equal heights: flex column, `height: 100%`, `flex: 1` on body, `marginTop: auto` on divider
- Related card price span: `whiteSpace: nowrap` on desktop keeps everything on one line; reset on mobile so price is fully visible

---

## 2026-06-01 (continued) — Meilisearch search

### Meilisearch — full setup and storefront wiring

**Infrastructure:**
- Meilisearch was running but empty — created `products` index with searchable attributes (title, brand, model, caliber, action, short_description, sku), filterable attributes (brand, caliber, action, primary_category, in_stock, collection_handle), and sortable attributes (price, title)
- Indexed all 461 products from Medusa via `scripts/index-products.js`
- Created search-only API key (`199d91aa...`) for client use
- Exposed Meilisearch publicly via nginx: `https://search.luxus-collection.com` (SSL cert via certbot, Let's Encrypt)
- Added `MEILISEARCH_HOST` and `MEILISEARCH_API_KEY` to Vercel env vars (manual — Vercel CLI not installed)

**Medusa sync subscriber (`search-sync.ts`):**
- Listens to `product.product.created`, `product.product.updated`, `product.product.deleted`
- Upserts or deletes from Meilisearch index on every product change
- Uses `MEILISEARCH_HOST` / `MEILISEARCH_API_KEY` env vars (already in Medusa docker-compose)
- Medusa rebuilt and restarted; subscriber confirmed compiled

**Storefront:**
- `/api/search` Next.js API route — server-side proxy to Meilisearch; master key stays on server, works on Vercel without exposing port 7700
- `useSearch` hook — debounced 280ms, min 2 chars
- `SearchResultItem` — thumbnail, brand, title, caliber, price
- **Desktop header** — search icon → dropdown with live results + "View all N results" link; closes on outside click
- **Mobile header** — existing overlay now shows live results below input
- **Shop page** — reads `?q=` from URL, fetches Meilisearch results (up to 200), filters and rank-orders products by relevance; title shows `Results for "X"` with `× Clear search` button; search pill in filter toolbar
- **Inline search box** — added above product grid on shop page; pre-filled with current query; Search button + × clear button
- `clearSearch()` uses `window.location.href` (reliable cross-browser, bypasses Next.js router quirks)
- FilterPill × span enlarged to 16×16px click area (was 8×8px)

**Key technical notes:**
- `search.luxus-collection.com` DNS A record → 18.191.222.217; SSL cert expires 2026-08-30 (auto-renews via certbot cron)
- Meilisearch webroot path on host: `/var/lib/docker/volumes/luxus-commerce_certbot_webroot/_data`
- Search-only key is safe to expose client-side (actions: ["search"], indexes: ["products"] only)
- `window.location.href` used for search navigation instead of `router.push` to avoid stale closure issues in the URL sync useEffect

### Search additions — Articles, Resources on Guns, hyphen normalization

**Articles page search:**
- Search input above category tabs; filters by title, excerpt, category
- Instant client-side filtering; empty state with clear button
- Category tabs and search work together

**Resources on Guns search:**
- Two new payload.ts functions: `getBrandsForSearch()` (brands + modelSeries) and `getAllResourcePagesForSearch()` (all published resource pages with brand info)
- Hub page fetches both in parallel at build time
- Search shows categorized results in a unified list:
  - ● Brand Profile (gold dot) → `/resources-on-guns/[slug]`
  - ◻ Model Series (gold outline) → brand profile page
  - □ Reference Page (grey square) → `/resources-on-guns/[brand]/[slug]`
- Normal brand grid shown when no search query active

**Hyphen/separator normalization — all search surfaces:**
- Meilisearch: `nonSeparatorTokens: ["-", "."]` — "AR-15" indexes as single token "ar-15"; typo tolerance lowered from 5→4 chars so "ar15" (4 chars) gets 1 typo → matches "ar-15"
- `/api/search` route: runs query variants in parallel (original + stripped + spaced), deduplicates results
- Client-side (articles, resources): `normalize()` strips separators before comparing so "ar-15", "ar15", "AR 15" all match each other
- All 461 products re-indexed with updated Meilisearch tokenization settings

---

## 2026-06-04 — Shop By Brand, Bulk Inventory, Availability, Performance

### Shop By Brand — top 8 on home page
- `src/app/page.tsx`: capped brands array to `.slice(0, 8)` (already sorted by product count)
- `src/components/home/HomePage.tsx`: added "View All Brands →" link below tiles → `/shop/brands`
- Commit: `983f74c`

### Bulk inventory setup — 461 variants
All 461 products imported via the import API had no inventory items. Medusa admin showed "—" for all inventory; store API returned `inventory_quantity: null`.

**Script:** `luxus-commerce/scripts/bulk-set-inventory.mjs`
- Queries all variants with no linked inventory item (safe to re-run; skips existing)
- Generates proper Medusa-format IDs (`iitem_`, `pvitem_`, `ilev_` prefix + ULID)
- Inserts: `inventory_item` → `product_variant_inventory_item` link → `inventory_level` at "Luxus Collection" location
- `--dry-run` flag available

**Stock location IDs:**
- "Luxus Collection": `sloc_01KRM4E1EXP5DK3N9E6EPKFQ9B`
- "European Warehouse" (seed data): `sloc_01KRF9Y3TYECN9NH6ZACPWHHBG`
- "Web Site" sales channel: `sc_01KRF9Y3MZFHYPMTEJPH55QFSA`

**Sales channel fix:** "Luxus Collection" location wasn't linked to "Web Site" sales channel — inventory was invisible to the store API. Fixed with direct SQL insert into `sales_channel_stock_location`.

Result: 461 variants created, 0 errors. All products now return `inventory_quantity: 1`.

### Inventory status fix — storefront not showing real stock
**Root cause:** `*variants` field expansion doesn't include `inventory_quantity` by default. Every fetch returned `null`; fallback `?? 1` made everything appear Available.

**Fix:** Added `*variants.inventory_quantity` to PRODUCT_FIELDS in all 10 fetch sites (`page.tsx`, `shop/page.tsx`, `featured/page.tsx`, `brand/`, `resources-on-guns/`, `shop/model/`, `collection/`, `category/`, `product/`, `api.ts`).

**Fallback changed** in `src/lib/medusa.ts`: `inventory_quantity ?? 1` → `?? 0` (null = out of stock now that all products have inventory).

Commit: `1fb2c85`

**Going forward:** Set qty=0 in Medusa admin → "Out of Stock" on storefront. Products stay published regardless of stock status.

### Unavailable product card UX — all 5 listing pages
- Replaced centered dark overlay with top-right corner badge (dark red `#6a3a3a`, matches Available badge style)
- Price / "Contact Us for Pricing" row hidden entirely when `!in_stock`
- CTA changes to "View Details" link when out of stock
- `justifyContent: flex-end` on price row when out of stock
- HomePage and FeaturedPage also got grayscale image filter (previously missing)
- Commit: `a5aabd4`

### PDP — unavailable item changes
- Price block (both price and "Contact Us For Pricing") hidden when `!product.in_stock`
- CTA buttons: "Contact for Availability" (gold, opens new `ContactAvailabilityModal`) + "Request More Information"
- "Add to Cart" and "Make an Offer" not shown when unavailable
- Sticky bar: price hidden, "Contact for Availability" shown
- `src/components/ContactAvailabilityModal.tsx`: First Name, Last Name, Email, Phone, Message → POSTs to `/api/contact` with `mailbox: 'sales'`
- Commit: `fca860f`

### Pagination — scroll to top on page change
- `goToPage(n)` helper in ShopPage and ListingPage: `setPage(n)` + `window.scrollTo({ top: 0, behavior: 'smooth' })`
- Commit: `1b987d2`

### Availability filter — all store pages
- New `stockStatus: 'all' | 'in_stock' | 'out_of_stock'` field in `Filters` type
- Initialized from `?stock=` URL param; written back on change
- Three radio-style checkboxes below Price Range: "All Items" / "Available" (with count) / "Unavailable" (with count)
- Applies to Shop All, brand, category, collection, and model pages (all use ShopPage or ListingPage)
- Commits: `1bfda77`, `50ff44a` (TypeScript fix — added `'stockStatus'` to Omit list in toggleFilter)

### Performance overhaul — indefinite cache + generateStaticParams + on-change revalidation

**Root cause:** Two layers of 60-second timer cache were stacked — `storeFetch` had `revalidate: 60` and every page had `export const revalidate = 60`. Rebuilds happened on a timer regardless of whether anything changed. On-demand revalidation via webhooks was already wired but wasn't the primary cache mechanism.

**Fix 1 — kill timer cache (commit `75b3bc9`):**
- `storeFetch`: `revalidate: 60` → `revalidate: false`
- All 13 pages: `export const revalidate = 60` → `false`
- Home page brand-count fetch: reduced from 500 to 200 products

**Fix 2 — generateStaticParams (commit `75b3bc9`):**
Pre-builds all pages at deploy time so even the first visitor gets a CDN edge response:
- `product/[handle]` — all 462 handles at build time
- `brand/[slug]`, `category/[slug]`, `collection/[slug]` — from attribute_values / getCategories / getCollections

**Fix 3 — complete cache-on-change system (commit `ecb908b`):**
- All 21 `revalidate: 300` in `payload.ts` → `revalidate: false`
- Fixed `faq-page` typo → `faq` in revalidate route (FAQ revalidation was silently failing)
- Added `afterChange`/`afterDelete` hooks to `Posts.ts` and `FeaturedClassifieds.ts` in Payload — instant revalidation on save
- Payload container rebuilt and restarted

**Cache trigger map (complete):**

| Content | Trigger |
|---|---|
| Products | Medusa webhook → instant |
| Articles (Posts) | Payload hook → instant |
| Brand profiles | Payload hook → instant |
| Site Settings, Hero, Shop tiles, all CMS pages | Payload hooks → instant |
| Policies | Payload hooks → instant |
| Featured Classifieds | Payload hook → instant |
| FAQ items | Payload hook (was broken/typo, now fixed) → instant |

---

## 2026-06-05 — PDP Layout, Specs Tab, Product Types, Backroom, Performance

### PDP: H1 above breadcrumbs
- Added full-width title block between fixed header and breadcrumb bar
- H1 padding tuned: removed duplicate `paddingTop: "68px"` that was stacking on `<main>`'s existing offset (~136px gap was halved to ~68px)
- Commits: `616a8b8`, `a3e9c82`, `58d6d41`, `e5e7b37`

### PDP: tab bar scrollbar removed
- `overflowX: "auto"` on tab bar → `overflow: "hidden"` (both axes) to prevent implicit `auto` on Y axis from CSS spec
- Commit: `bfaa40c`

### PDP: Specifications tab — full data wiring

**Problem 1:** Mapper only handled 5 of 7 attribute types; `frame-color` and `magazine-capacity` were missing.

**Fix:** Added both to `MappedProduct.attributes`, `attribute_lists`, and `pickAttr` calls in `src/lib/medusa.ts`. Commit: `4576746`

**Problem 2:** Page was never fetching product specs from `/store/products/[id]/specs`.

**Fix:** Added `getProductSpecs(raw.id)` to the parallel `Promise.all` in `product/[handle]/page.tsx`. Fixed `getProductSpecs` return type in `api.ts` (`Record<string, string>` not `{label, value}[]`). Passed as `serverSpecs` prop to `ProductDetailPage`. Commit: `6114f1d`

**Medusa `/specs` route fix:** `ATTR_SPEC_SLUGS` was missing `brand` and `model`. "Capacity" renamed to "Magazine Capacity". Commerce repo commit: `32da375`

**Final specs tab field order (14 fields):**

| # | Field | Source |
|---|---|---|
| 1–7 | Brand, Model, Caliber, Action, Barrel Length, Magazine Capacity, Frame Color | attribute_values module |
| 8–13 | Overall Length, Weight, Frame Material, Grips, Sights, Finish | product_spec table |
| 14 | Optics Ready | product_detail table |
| + | Extra rows | metadata.extra_specs (admin-defined) |

### Collectible & Modern Firearms sections
- New routes: `/shop/collectible-firearms`, `/shop/modern-firearms` — both use ListingPage with full filter sidebar
- "Shop All" nav item gains hover dropdown: All Items / Collectible Firearms / Modern Firearms
- "Firearm Type" filter added to ShopPage with live counts and `?firetype=` URL param
- `MappedProduct.product_type` field added (from `p.type?.value`)

**Correction — tags not product type:** Initial build used Product Type (single-value field, wrong). User clarified Medusa Tags are the correct mechanism; "Collectibles Firearms" and "Modern Firearms" tags already existed.

**Revert:** All 462 products restored to "Firearm" product_type.

**Bulk tag insert:** "Collectibles Firearms" tag (`ptag_01KTBWHPPP9N4Y222CT102WWTP`) added to all 462 products via SQL `INSERT ... ON CONFLICT DO NOTHING`. 461 new rows (1 already existed).

**Storefront updated** to use `p.tags.includes('Collectibles Firearms')` / `p.tags.includes('Modern Firearms')` in all three places. PRODUCT_FIELDS changed from `*type` → `*tags`.

**Tag IDs:**
- Collectibles Firearms: `ptag_01KTBWHPPP9N4Y222CT102WWTP`
- Modern Firearms: `ptag_01KTBWFCFY1KD9P80JB2T9BY9A`
- Featured: `ptag_01KST7976CAR8RWEEVM0S7Z6N1`

Commits: `a743477` (product type, reverted), `68255ac` (tags, final)

### Product cards: right-click open in new tab
- All 5 card components were `<div onClick={() => router.push(...)}>` — no real anchor, no browser link context menu
- Fixed: replaced outer `<div>` with `<Link href={...}>` in ShopPage, ListingPage, HomePage, FeaturedPage, ResourcesBrandPage
- `handleViewDetails` functions removed; "View Details" button changed to `<span>`
- Heart and Add to Cart buttons retain `e.stopPropagation()`
- Commit: `ddf5356`

### Backroom / VIP filtering
**Problem:** Admin inventory widget has "Master Backroom" and "Backroom / VIP" flags but no storefront filtering existed — backroom products were showing publicly.

**Architecture:**
- On save, sync flag to `product.metadata.backroom_hidden = "true"` (or remove it when both off)
- `MappedProduct.is_backroom_hidden: boolean` reads from `metadata.backroom_hidden === "true"`
- All 8 public listing entry points filter `!p.is_backroom_hidden` server-side

**Sync fix:** Initial sync used `productService.listProducts` / `updateProducts` — silently failing in this Medusa version. Replaced with direct SQL: `UPDATE product SET metadata = COALESCE(metadata,'{}') || '{"backroom_hidden":"true"}'::jsonb WHERE id = $1`.

Added storefront revalidation at end of every widget save — site updates instantly.

Commits: `e4723b8` (storefront), `1f686db` (Medusa widget fix)

### DB connection pool cold-start fix
**Root cause:** Medusa and Payload had no pool settings — `pg` default closes idle connections after a short timeout. First request after quiet period: 5–8s reconnection penalty.

**Fix — `medusa-config.ts`:**
```ts
databaseDriverOptions: { connection: { pool: { min: 2, max: 10, idleTimeoutMillis: 300000 } } }
```

**Fix — `payload.config.ts`:**
```ts
db: postgresAdapter({ pool: { connectionString, min: 2, max: 10, idleTimeoutMillis: 300000 } })
```

`min: 2` keeps 2 connections alive at all times. Commerce commits: `5be5984` (Medusa), `e8d424f` (Payload).

### Performance: field optimization + cache pre-warming

**PRODUCT_FIELDS optimization (commits `d7e40be`, `9a74839`):**
- Removed `*images` from listing pages (cards use `thumbnail` only — saves ~1s per call)
- Changed `*categories,*collection` → scalar-only variants (saves ~1.1s)
- Removed `*attribute_values,*attribute_values.attribute_type` — attribute data already in `product.metadata` via `syncAttributeMetadata` (saves ~1.9s)
- **Gotcha:** Medusa v2 only returns default scalar fields when at least one `*relation` expansion is present. Fix: explicitly add `id,title,handle,subtitle,thumbnail` to PRODUCT_FIELDS.
- Result: each paginated API call drops from ~1.4s to ~0.56s

**Cache pre-warming (commits `0d1dd33`, `2aaab53`):**
- Root cause: `revalidateTag` clears route cache. First visitor triggers synchronous regeneration (~8s wait). Background fetch before any visitor arrives fixes this.
- `src/lib/warm-cache.ts`: `warmCache` + `TAG_PAGES` map — single source of truth shared by `/api/revalidate` and `/api/medusa-hook`
- All tags mapped to their affected pages; dynamic prefixes (`brand-`, `post-`, `resource-*`) warm parent listing pages

**Vercel build optimization:** `generateStaticParams` reduced from 500 to 50 products — avoids build timeout (462 × 4 API calls each was too slow).

### Import API bug fix — metadata mirroring
`short_description`, `engraver`, `primary_category`, and `contact_for_pricing` were written to custom module tables but the storefront mapper reads from `product.metadata`. Import now mirrors all of these to metadata.

Commerce commit: `d413024`

### Import / Update docs
- `docs/product-import-api.md` updated: added `model` attribute, renamed Capacity → Magazine Capacity, added spec display order table, added post-import steps, product tags, backroom examples
- `docs/product-update-api.md` NEW: covers getting admin JWT, updating core/details/specs/metadata/attributes, complete Python helper script
- `docs/product-update-api.md` correction: `build_attr_lookup` was calling a 404 endpoint; fixed to use single `GET /admin/product-attributes` response (types with nested values)
- Commerce commits: `96c8cb3`, `96a8a69`

### Orphaned attribute links fix
8 products crashed the admin widget with "Cannot read properties of null (reading 'id')". Join table had links to deleted attribute values.

Fix: `DELETE FROM product_product_product_attributes_attribute_value WHERE NOT EXISTS (SELECT 1 FROM attribute_value WHERE id = attribute_value_id)` — removed 16 orphaned rows.

Route also updated to filter nulls defensively. Commerce commit: `a0b04a6`

### Page white-space fixes
`<main>` in `layout.tsx` applies `paddingTop: calc(68px + var(--ann-h, 0px))`. Several pages had an additional `paddingTop: "68px"` on their first wrapper div (~136px gap). Fixed: `ArticlesPage.tsx`, `AuthPage.tsx`, `ResetPasswordPage.tsx`. Commits: `b50638f`, `743d55f`

### About page — story/curation image aspect ratios
- Story images: fixed `height: 320px` → `aspectRatio: "4/3"` (iPhone landscape ratio)
- Curation image: `1/1` → `4/3`
- Mobile: removed `position: sticky; top: 96px` from story images column (was causing 96px dead space when stacked) via `lxs-about-story-images` CSS class
- Commit: `82f0d1b`

### About page — Heritage Gallery section
**Payload (commerce commit `0e16f1a`):**
- Added `gallery` array (image + title + caption) to About Page global
- Added `galleryHeading` and `galleryIntro` text fields
- Migration `20260605_000000`: `about_page_gallery` table + new columns on `about_page`

**Storefront (commit `724a7a3`):**
- New `GallerySection` component: 3-col desktop / 2-col mobile grid, `4/3` aspect ratio, hover caption overlay
- Section hidden entirely when no gallery items added

**Lightbox zoom (commit `8b9a784`):**
- Click any image → full-screen overlay, `objectFit: contain`
- Prev/Next arrows, keyboard ← → / Escape, click backdrop to close
- Title + caption shown below image

### About page — hero background (commit `acd495f`)
- Replaced warm amber/cream gradient with cool neutral gray (`#f2f2f5 → #ececef → #e6e6ea`)
- Gold accents read clearly against neutral background

---

## 2026-06-08 — Hero Overhaul, Mobile Spacing, Product Cards, GunBroker Integration

### Hero slider — images not loading (grey background)
**Root cause:** S3 filenames with spaces (e.g. `Home page Slider 1.webp`) broke CSS `url()` parsing — browser stops at the first unquoted space.

**Fix (two-part):**
- `src/lib/payload.ts` — `imageUrl()` now calls `.replace(/ /g, "%20")` on all returned URLs. Applies to all images through this function (gallery, shop tiles, brand logos, etc.)
- `src/components/home/HeroSection.tsx` — CSS background wrapped in quotes: `` url("${slide.imageUrl}") ``

Commit: `3d746a4`

### Hero section overhaul

**Payload CMS — HeroSlides global expanded:**
- `wordmark` (text, default: "Luxus Collection") — rendered as `<h1>` on home page
- `tagline` (text, default: "The Forefront of Exclusive Firearms")
- `introBody` (textarea) — split on `\n\n` → paragraphs; hardcoded fallback if empty
- `featuredImages` (array, max 8) — each: `image` (upload) + `caption` (text, optional)

**Migration `20260608_000000`:**
- `ALTER TABLE hero_slides ADD COLUMN wordmark / tagline / intro_body`
- Created `hero_slides_featured_images` table
- Rebuilt Payload Docker container (TypeScript migration compiled at build time)

**Storefront — `HeroSection.tsx` (full rewrite):**
- Main carousel: dark `#1a1a1e` background, `background-size: contain`, height `clamp(260px, 40vh, 480px)`
- Wordmark rendered as `<h1>` — first H1 on the home page (SEO)
- Right column: `FeaturedSlider` — CMS-managed auto-advancing slider (5s), dots, caption
- Featured slider background fixed to match section (`t.bg`) — was mistakenly using `#1a1a1e`

Commits: `650218f` (overhaul), `24aaa47` (featured slider background fix)

### Mobile spacing — home page
All home page sections had 64px padding on mobile — excessive whitespace when scrolling.

| Breakpoint | Section | Before | After |
|---|---|---|---|
| ≤640px | `lxs-home-section` | 64px | 40px |
| ≤640px | `lxs-home-newsletter` | 56px | 36px |
| ≤640px | `lxs-home-hero-grid` | 48px/40px | 32px/28px |
| ≤640px | hero brand-intro | 36px/28px | 28px/16px |
| ≤380px | all sections | 48px | 32px |

Commits: `f1ced3a`, `dbcdc11`

### Product card mobile consistency fix
Home page, Featured page, and Resources Brand page cards were missing the CSS class names used by the mobile overrides in `globals.css`.

Missing classes added to all three files:
- `lxs-card-badge-cat` — moves category badge to bottom on mobile (avoids collision with availability badge)
- `lxs-card-price` — 14px font on mobile
- `lxs-card-brand`, `lxs-card-title`, `lxs-card-sub` — centered text on mobile
- `lxs-card-price-row` — stacks price + buttons vertically, centred on mobile

Commit: `390fe5e`

### GunBroker API integration

**Architecture:**
```
HomePage (client useEffect) → /api/gunbroker/listings (force-dynamic)
  → src/lib/gunbroker.ts (server-side)
      → POST /Users/AccessToken  (50-min token cache per instance)
      → GET  /ItemsSelling?PageSize=8&PageIndex=1
```

**`src/lib/gunbroker.ts`:**
- Env vars: `GUNBROKER_DEV_KEY`, `GUNBROKER_USERNAME`, `GUNBROKER_PASSWORD`, `GUNBROKER_SANDBOX`
- User-Agent: `LuxusStorefront/LuxusCollection/1.0/AuctionSync` (required format per GunBroker security policy)
- Module-level token cache (`_token`, `_tokenExp` — 50 min TTL); 401 triggers one re-auth retry
- `formatTimeLeft(iso)` → "2d 14h" / "5h 42m" / "18m"
- `mapItem()` — defensive camelCase/PascalCase field mapping
- `getSellerListings(limit=8)` — main export

**`src/app/api/gunbroker/listings/route.ts`:**
- `export const dynamic = 'force-dynamic'` (listings route always runs fresh — avoids caching an empty response before env vars are set)

**`src/components/home/HomePage.tsx`:**
- `useEffect` fetches `/api/gunbroker/listings` on mount
- Auction section auto-hides when `auctions.length === 0`
- "View All" link dynamically targets sandbox vs production domain

**Confirmed GunBroker sandbox API facts:**
- Auth response: `accessToken` (camelCase) — both cases handled
- Pagination: **1-based** (`PageIndex=1`, not 0 — API returns 400 on `PageIndex=0`)
- End date field: `endingDateTimeUTC` in `/ItemsSelling` (not `endingDate`)
- `currentBid` is 0 when no bids placed — falls back to `startingBid`/`minimumBid`
- Thumbnails served via Cloudinary (`res.cloudinary.com`) — added to `next.config.ts` remotePatterns
- Card label: "Starting Bid" when `bidCount === 0`, "Current Bid" otherwise

**Env vars configured in Vercel (sandbox):**
- `GUNBROKER_DEV_KEY`, `GUNBROKER_USERNAME`, `GUNBROKER_PASSWORD`, `GUNBROKER_SANDBOX=true`

**Switching to production:** Update `GUNBROKER_DEV_KEY` to production key, remove `GUNBROKER_SANDBOX`, redeploy. No code changes needed.

**Documentation:** `docs/gunbroker-integration.md` — architecture, env vars table, API field reference, sandbox→production switchover, troubleshooting.

Commits: `cf58a6f` (integration), `bc5008c` (debug route + force-dynamic), `d4db0f1` (token camelCase fix), `6df8598` (PageIndex=1), `6fa9db7` (Cloudinary domain + endingDateTimeUTC + Starting Bid label), `3d7ceed` (remove debug route)

### GunBroker: filter ended listings (commit `c98f8a2`)
- `/ItemsSelling` returns all seller listings including ended/sold ones
- Fix: `.filter(l => l.timeLeft !== 'Ended')` applied after `mapItem()` in both the main fetch path and the 401-retry path
- Ended auctions now drop off the home page automatically; section auto-hides when no live listings remain

### GunBroker: production env vars configured
- Vercel env vars updated with production credentials (production `GUNBROKER_DEV_KEY`, production `GUNBROKER_USERNAME`/`GUNBROKER_PASSWORD`, `GUNBROKER_SANDBOX` removed)
- Production API key activation request submitted to GunBroker — pending their approval
- No code changes needed when activated; site will automatically switch to serving live production auction listings

### Home page: reduce desktop section spacing (commit `651b011`)
- `lxs-home-section`: `96px → 72px` top/bottom padding on desktop
- `lxs-home-newsletter`: `80px → 64px`
- `lxs-home-hero-grid`: `80px → 64px` top, `60px → 48px` bottom
- Tablet (≤1024px): `72px → 56px` section, `64px → 52px` newsletter, hero-grid tightened to match
- Mobile (≤640px and ≤380px) unchanged — already cut in previous session
- Blog section ("From The Blog") now guarded by `articles.length > 0` — hides when no articles are published, consistent with Featured and GunBroker sections

---

## 2026-06-08 (continued) — CMS Logo & Favicon

### Overview
Logo and favicon are now managed through Payload CMS → Site Settings → Branding. Uploading a new file triggers instant revalidation — no code change or redeploy needed.

### Payload CMS — SiteSettings.ts
Added `branding` group as the first field group in the Site Settings global:
- `logo` — upload field (relationTo: media). Recommended: WebP or SVG, transparent background, ≥ 336×84 px.
- `favicon` — upload field (relationTo: media). Recommended: PNG or WebP, 64×64 px, square.

### Migration `20260608_010000`
- `ALTER TABLE site_settings ADD COLUMN branding_logo_id integer REFERENCES media(id) ON DELETE SET NULL`
- `ALTER TABLE site_settings ADD COLUMN branding_favicon_id integer REFERENCES media(id) ON DELETE SET NULL`
- Two indexes added; migration confirmed applied

### Storefront — `src/lib/payload.ts`
- Added `branding: { logo?: PayloadImage | null; favicon?: PayloadImage | null }` to `SiteSettings` type
- Added `branding: {}` to `SETTINGS_FALLBACK`
- `getSiteSettings()` unchanged — shallow spread already picks up `branding` from API response

### Storefront — `src/app/layout.tsx`
- Converted `export const metadata` → `export async function generateMetadata()` (async, fetches settings)
- If `settings.branding.favicon` is set, `icons: { icon, shortcut, apple }` all point to the CMS favicon URL
- Falls back silently to the static `src/app/favicon.ico` when no CMS favicon uploaded
- Computes `logoUrl = imageUrl(settings.branding.logo)` server-side and passes to both `<Header>` and `<Footer>`

### Storefront — `src/components/Header.tsx`
- Added `logoUrl?: string` prop to `Header` and `MobileNav`
- Desktop logo and mobile nav drawer logo: `src={logoUrl ?? "/logo.webp"}`
- `MobileNav` receives `logoUrl` from `Header` via prop

### Storefront — `src/components/Footer.tsx`
- Added `logoUrl?: string` prop to `Footer`
- Footer brand logo: `src={logoSrc}` where `logoSrc = logoUrl ?? '/logo.webp'`

### Fallback behaviour
All three locations (header, mobile nav, footer) fall back to the static `/public/logo.webp` if no CMS logo is uploaded. The static `favicon.ico` remains as fallback for the browser tab icon.

### Commits
- `651b011` — Home page: reduce desktop section spacing + guard blog section
- `9049fc8` — CMS-managed logo and favicon via Site Settings

---

## 2026-06-09 — Elavon Checkout, FAQ CMS, Medusa-Native Architecture

### Elavon Integration — Initial Lightbox Attempt (abandoned)

Began with Lightbox (iframe overlay) integration. `ConvergeLightbox.js` returns 404; `X-Frame-Options: SAMEORIGIN` blocks iframe. Switched to Hosted Payments redirect (full-page redirect to Elavon's servers).

Built initial HPP flow:
- `/api/elavon/token` — server-side proxy calling Elavon token endpoint
- `lxs_pending` cookie — base64 JSON with items/FFL/notes set before redirect
- `/api/elavon/complete` — handles Elavon POST-back, sends emails, clears cookie
- Wire/check payment option added alongside card

**Elavon IP whitelist problem**: Vercel has dynamic IPs; Elavon requires fixed IP for token requests.

**Fix**: Route all Elavon calls through Medusa backend (fixed AWS IP):
- New Medusa route: `POST /store/elavon/token`
- Middleware: `x-elavon-proxy-secret` required on all `/store/elavon/*` routes
- Elavon credentials (`ELAVON_MERCHANT_ID`, `ELAVON_USER_ID`, `ELAVON_PIN`) moved to Medusa `.env`; removed from Vercel
- `ELAVON_PROXY_SECRET` shared secret added to both Medusa and Vercel

**Elavon debugging**: 401 (wrong creds, fixed), 403 (HPP feature not enabled on account). User emailed Elavon support to enable HPP.

### FAQ CMS Seed

28 FAQ items seeded into Payload CMS via `scripts/seed-faq.mjs`. 6 categories: Ordering & Purchasing, FFL Transfers & Shipping, Products & Inventory, Payments & Pricing, Returns & Warranties, Consignment & Trade-In. FAQ page reads from CMS, revalidates on change.

### Medusa-Native Checkout Refactor (major)

User identified that custom `checkout-config` module was bypassing Medusa's built-in Tax Regions, Shipping Options, and Order management. Full refactor to use native Medusa:

**Elavon Payment Provider** (`src/modules/elavon-payment/`):
- `service.ts` — `AbstractPaymentProvider<ElavonConfig>` with `static identifier = "elavon"`
  - `initiatePayment`: calls Elavon token API, returns `{ id, data: { hostedUrl, cartId, status: 'pending' } }`
  - `authorizePayment`: checks `ssl_result === "0"` → AUTHORIZED
  - `getWebhookActionAndData`: returns `NOT_SUPPORTED`
  - Requires explicit `public constructor(cradle, config)` — AbstractPaymentProvider has protected constructor
- `index.ts` — `ModuleProvider(Modules.PAYMENT, { services: [ElavonPaymentService] })`
- Registered in `medusa-config.ts` nested under `@medusajs/medusa/payment` → stored as `pp_elavon_elavon` in DB (format: `pp_{moduleId}_{identifier}`)

**Finalize Route** (`src/api/store/elavon/finalize/route.ts`):
- `POST /store/elavon/finalize` — protected by proxy secret middleware
- Updates payment session with Elavon result data (ssl_result, ssl_txn_id, etc.)
- Runs `complete-cart` workflow → creates Medusa order
- Returns `{ orderId, displayId }`

**`checkout-config` module**: removed from `medusa-config.ts`

**Database setup** (done directly via psql — setup-checkout.mjs not fully run):
- US tax region (top-level, provider: tp_system)
- FL tax region (child, no provider per constraint)
- FL 7% tax rate (6% state + 1% Sarasota Co.), `is_default=true`
- FedEx Next Day Air shipping option — $85 flat rate, `manual_manual` provider, in Luxus Collection service zone (`serzo_01KS3225STX4SJTMBGW38CMGT1`)
- `pp_elavon_elavon` + `pp_system_default` both inserted into `region_payment_provider` for US region

**Storefront refactor** (commit `b702d25`):
- `CartContext.tsx` — added `variant_id: string | null` to `CartItem` type, populated on `addItem`
- `CheckoutPage.tsx` — full rewrite using Medusa cart API:
  - Creates Medusa cart on mount with variant_id line items
  - Auto-fetches + applies first shipping option
  - Debounced (500ms) address update on FFL state change → live Medusa tax recalculation
  - Card: initiates `pp_elavon_elavon` payment session → gets `hostedUrl` from session data → saves `lxs_cart` cookie → redirects to Elavon HPP
  - Wire: initiates `pp_system_default` → `POST /store/carts/:id/complete` → Medusa order → wire email via `/api/checkout/wire`
  - Totals display: subtotal, shipping, tax, total all from Medusa cart in cents
- `/api/elavon/complete` — rewritten:
  - Reads `lxs_cart` cookie for Medusa cart ID
  - Calls `POST /store/elavon/finalize` with proxy secret
  - Gets `{ orderId, displayId }` → sends styled confirmation emails → deletes cookie → redirects to order-confirmation
  - Edge case: if finalize fails (Elavon approved but Medusa had error) → redirects with `?warn=1`
- `OrderConfirmationPage` — added `warn=1` handling: shows amber notice to contact sales@

**Verified working**:
- Cart API: $14,500 product + $85 shipping + $1,020.95 FL 7% tax = $15,605.95 total ✓
- All 463 active published products accessible via store API ✓
- `pp_elavon_elavon` and `pp_system_default` both linked to US region ✓

**Still pending**: Elavon support team needs to enable HPP feature on account (403 awaiting their response). Once enabled, full card checkout can be tested end-to-end.

### Commits
- `fa52d07` — Elavon token: proxy through Medusa backend
- `538dea8` — Trigger redeploy: pick up ELAVON_PROXY_SECRET env var
- `8d51241` — Checkout: add live tax + shipping breakdown with rates from Medusa
- `b702d25` — Checkout: Medusa-native cart, orders, Elavon payment provider

---

## 2026-06-10 (continued from prior session)

### 1. Magazine Warning Modal
**File:** `src/app/product/[handle]/ProductDetailPage.tsx`

Full-screen acknowledgment modal when buyer selects a magazine-warning state on the PDP:
- Fixed overlay (`zIndex: 10001`), dark blur backdrop
- White card with 3px gold top border, warning triangle SVG icon
- Title: "Magazine Shipping Notice"; message: dynamic `magWarningText` + fixed explanation
- Single CTA: "I Understand — Continue" (gold button, must click to unlock CTAs)
- No dismiss/close — buyer must explicitly acknowledge
- `ctasBlocked = !restrictionCheck.ok || (hasMagWarning && !magWarningAcknowledged)`
- Commit: `b9344e6`

### 2. Transactional Emails — Shipped & Payment Received
**New Medusa route:** `POST /admin/orders/:id/notify`
- `{ type: "payment_received" }` — buyer + sales@ notification
- `{ type: "shipped", carrier, tracking_number }` — buyer email with tracking block + sales@ notification
- Both styled with Luxus dark header + gold accent

**New admin widget:** `order-notifications.tsx` (zone: `order.details.side.after`)
- One-click "Send Payment Confirmation" button with green checkmark on success
- "Mark as Shipped" with carrier dropdown + tracking number input

Commits: storefront `04f2153`, Medusa `fa2d4ef`. GunBroker live auction confirmed working.

### 3. Email Routing Corrections
Reverted Contact page mailbox from `sales@` → `info@` (had been accidentally changed).
`ADMIN_EMAIL` in Medusa `.env` changed from personal email → `sales@luxus-collection.com`.

| Form | Destination | Reply-to |
|---|---|---|
| Contact page | info@ | Customer email |
| Support page | support@ | Customer email |
| Product inquiry (PDP) | sales@ | Customer email |
| Sell Your Gun form | sales@ | — |
| New offer submitted | sales@ | — |
| Wire/card/offer checkout | sales@ | — |

### 4. Obsolete File Cleanup
Deleted:
- `src/app/api/checkout/rates/route.ts` — replaced by Medusa tax engine
- `src/app/api/elavon/token/route.ts` — replaced by Medusa-proxied endpoint
- `gunsinternational.txt` — reference file accidentally committed

Commits: `63ceed7`, `072ea5b`

### 5. Owner-Confirmed Features
- Cart page, FAQ→Payload CMS, Meilisearch search bar — all confirmed working in production

### 6. SEO Foundation
- **`src/app/robots.ts`** — allows all bots on `/`; disallows account/checkout/invoice/offer/auth/api; explicitly allows GPTBot, ClaudeBot, PerplexityBot, Googlebot
- **`src/app/sitemap.ts`** — static pages with priorities + dynamic products/brands/categories/collections/articles; excludes `backroom_hidden: "true"` products; `Promise.allSettled` for resilience
- **`PageSeo` Payload global** — 11 page groups each with title + description CMS fields
- **`getPageSeo()` in `payload.ts`** — fetches `/api/globals/page-seo` with tag revalidation
- All 6 static pages use `generateMetadata()` with CMS data + sensible fallback
- Basic Product JSON-LD added to `product/[handle]/page.tsx`

### 7. Schema.org Deep Review + Build-Out
**Product JSON-LD expanded** (`product/[handle]/page.tsx`):
- Added: `manufacturer`, `color` (frame_color), `material` (frame_material), `weight` (QuantitativeValue, ONZ), `itemCondition` (NewCondition), `category` (primary cat name), full product `image` array
- `additionalProperty` array: caliber, action, barrel_length, frame_color, finish, sights, overall_length, grip, frame_material
- Separate `BreadcrumbList` JSON-LD: Home → Shop → [Category] → [Product]

**WebSite + Organization JSON-LD added** (`src/app/page.tsx`):
- `getSiteSettings()` added to home page's `Promise.allSettled` call
- WebSite schema: name, url, SearchAction potentialAction (`/shop?q=…`)
- Organization schema: name, legalName, url, logo ImageObject, telephone, email, PostalAddress, sameAs (all social URLs)

**BlogPosting JSON-LD added** (`article/[slug]/page.tsx`):
- `getSiteSettings()` fetched in parallel with post + related posts
- headline, description, image, datePublished, dateModified, mainEntityOfPage
- author (Person), publisher (Organization with logo from SiteSettings)
- articleSection (post.category), keywords (post.tags joined)

**CMS: legalName field** added to SiteSettings branding group (Payload + storefront type)
- Used by Organization and BlogPosting publisher schemas

Commits: storefront `23599f7`, Payload `e43deba` (legalName field), `0607eb0` (PageSeo access fix).

### CMS DB Fixes (applied same session)
After rebuild, two DB errors prevented the CMS admin pages from loading:
1. **`branding_legal_name` column missing** — Payload rebuilt with the new field but auto-migration did not run. Fixed with `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS branding_legal_name VARCHAR(255);`
2. **`page_seo` table missing** — PageSeo global was registered in config but the table had never been created. Fixed with `CREATE TABLE page_seo (...)` matching Payload's exact column naming + `INSERT INTO page_seo DEFAULT VALUES` to seed the initial row.
3. **PageSeo missing `access: { read: () => true }`** — storefront fetches returned 403. Fixed in source + Payload rebuilt and restarted (`0607eb0`).

All three fixes confirmed working — both CMS pages load cleanly, `GET /api/globals/page-seo` returns 200 publicly.

---

## 19. State Restrictions — Magazine Capacity Improvements

### PDP Label
- "Your State" label changed to "Check Shipping Eligibility" with subline: "Select your state to verify this firearm can be shipped to you."
- Placeholder changed from "Select your state to check shipping eligibility…" → "Select your state…"
- Clean state message updated to "Ships to XX — no restrictions" (was just "Ships to XX")

### Magazine Warning Display
- When a state has a magazine restriction, the amber warning block now shows immediately on state selection (same as before) with updated text that includes specific limit info and a contact-us call to action:
  - "CO limits magazine capacity to 15 rounds. This firearm will ship without its magazines. Contact us at sales@luxus-collection.com if you have any questions before ordering."

### Magazine Capacity Rules — Backend
- `state_restriction` model: added `magazine_limit` (integer, nullable) and `firearm_type` (varchar, nullable)
- `Migration20260610500000`: ALTER TABLE adds both columns; applied via direct SQL (same auto-migration skip issue as Payload)
- Admin route: POST now accepts `magazine_limit` and `firearm_type`; duplicate check scoped by firearm_type so Illinois can have both `{ handgun, 15 }` and `{ rifle, 10 }` rules
- Product shipping restrictions widget: replaced "Ships with High-Capacity Magazines" toggle with **Magazine Capacity (rounds)** number input — saves to `product.metadata.magazine_capacity`
- State restrictions admin page: when type = Magazine Limit, shows two new fields: **Magazine Limit (rounds)** (required) and **Applies To** (All / Handguns only / Rifles only / Shotguns only); badge in table shows limit + firearm type

### Storefront Check Logic
- `state-restrictions.ts`: `StateRestriction` type gets `magazine_limit` + `firearm_type`; `checkState()` accepts `productCategories: string[]`; derives firearm type from category names (Handguns→handgun, Rifles→rifle, Shotguns→shotgun; Revolvers exempt — no detachable mags)
- Warning only fires when product's `magazine_capacity` exceeds the state's limit for that firearm type; blanket rules (no limit set) fall back to `has_high_capacity_magazine` flag for backward compat
- For multi-category products (e.g. Rifle + Handgun set), checks all applicable rules and warns on the most restrictive one
- `medusa.ts`: `shipping_flags` gains `magazine_capacity: number | null` (parsed from metadata)
- `ProductDetailPage.tsx`: passes `product.categories` to `checkState()`

### How to Configure
| State | Rules to add |
|---|---|
| Colorado | CO / Magazine Limit / 15 / All firearms |
| Illinois | IL / Magazine Limit / 15 / Handguns only + IL / Magazine Limit / 10 / Rifles only |

Commits: storefront `f29e190`, Medusa `b4597df`.

---

## 20. S3 Public Bucket Policy — CMS Media

Applied via AWS Console (CLI credentials on server lack s3:PutBucketPolicy permission).

**Changes made:**
- Disabled `BlockPublicPolicy` and `RestrictPublicBuckets` on `luxus-collection-media` bucket (ACL-based block settings left enabled)
- Added bucket policy statement `PublicReadCMSMedia`: `s3:GetObject` on `arn:aws:s3:::luxus-collection-media/cms/*`

Payload CMS media uploads (stored under `cms/` prefix) now serve directly as public URLs without signed tokens. Product/Medusa images outside `cms/` are unaffected. Confirmed working — CMS media URLs load directly in browser.

---

## Pending

- Elavon HPP activation: waiting on Elavon support to enable Hosted Payments on account
- End-to-end card checkout test once HPP enabled
- Domain switch to Vercel (VERY LAST)

---

## 21. Analytics — GA4, Hotjar, SEMrush (CMS-Configurable)

All three analytics/tracking services are now configurable from Payload CMS → Site Settings → Analytics & Tracking. No code deployments needed to switch them on/off.

### Payload CMS (SiteSettings.ts)
New `analytics` group with three fields:
- **Google Analytics 4 — Measurement ID** — format `G-XXXXXXXXXX`; found in GA4 → Admin → Data Streams
- **Hotjar — Site ID** — numeric ID from Hotjar → Settings → Sites & Organizations
- **SEMrush — Site Verification Code** — paste only the `content=""` value from the HTML tag method

DB columns added to `site_settings` (luxus_payload):
```sql
ALTER TABLE site_settings
  ADD COLUMN analytics_google_analytics_id TEXT,
  ADD COLUMN analytics_hotjar_id TEXT,
  ADD COLUMN analytics_semrush_verification TEXT;
```

### Storefront (layout.tsx)
- `generateMetadata()`: conditionally adds `other: { 'semrush-site-verification': ... }` meta tag when code is set
- `RootLayout` body: conditionally renders `<Script>` tags after `</ThemeProvider>`:
  - **GA4**: `gtag.js` src script + `ga4-init` inline initialization (both `strategy="afterInteractive"`)
  - **Hotjar**: `hotjar-init` inline script (`strategy="afterInteractive"`)
- All scripts use `next/script` with `afterInteractive` strategy so they don't block page load

### Type updates (src/lib/payload.ts)
- `SiteSettings` type: added `analytics: { googleAnalyticsId?, hotjarId?, semrushVerification? }`
- `SETTINGS_FALLBACK`: added `analytics: {}`

### How to activate
1. Open Payload CMS → Site Settings → Analytics & Tracking
2. Paste in the relevant ID/code for each service
3. Save — scripts load automatically on every page within seconds (Vercel fetches fresh settings on revalidation)

Commits: storefront `1078b86`, Payload `609d625`.

---

## 22. Analytics — PostHog correction (Hotjar → PostHog)

Hotjar was replaced with PostHog before any IDs were entered:
- Payload `SiteSettings.ts`: `hotjarId` field → `postHogApiKey` (label: "PostHog — Project API Key", placeholder: `phc_XXXXXXXXXX`)
- Storefront `layout.tsx`: Hotjar inline snippet replaced with the official PostHog initialization snippet (`strategy="afterInteractive"`)
- Storefront `payload.ts` type: `hotjarId?` → `postHogApiKey?`
- DB: `analytics_hotjar_id` column renamed to `analytics_post_hog_api_key` via `ALTER TABLE ... RENAME COLUMN`
- Payload container rebuilt and restarted

Commits: storefront `06c969f`, Payload `770977a`.

---

## 23. State Restrictions — Bug Fixes

### Fix 1: Select.Item empty string crash
The "Applies To" dropdown in the State Restrictions admin page used `value=""` for the "All firearms" option. Radix UI Select (used by Medusa admin) forbids empty string values — any page that rendered the add form crashed immediately.

**Fix:** Changed `value=""` → `value="all"` on the "All firearms" item; updated `handleAdd()` to treat `"all"` the same as unset (sends no `firearm_type` to the API).

Commit: Medusa `d6325f0`. Medusa container rebuilt.

### Fix 2: IL duplicate magazine_warning rules blocked by DB constraint

A `UNIQUE` index `sr_state_type_idx` on `(state_code, restriction_type)` prevented adding more than one magazine_warning rule per state — making Illinois-style split rules (rifles ≤10, handguns ≤15) impossible.

**Fix:** Dropped the old constraint and replaced with two partial indexes:
```sql
-- Non-magazine rules: still unique per state+type
CREATE UNIQUE INDEX sr_state_type_idx
  ON state_restriction (state_code, restriction_type)
  WHERE restriction_type != 'magazine_warning' AND deleted_at IS NULL;

-- Magazine rules: unique per state+type+firearm_type
CREATE UNIQUE INDEX sr_state_mag_firearm_idx
  ON state_restriction (state_code, restriction_type, firearm_type)
  WHERE restriction_type = 'magazine_warning' AND deleted_at IS NULL;
```

Applied directly via `docker exec luxus-postgres psql` — no container rebuild needed. Confirmed working: IL can now have both rifle (≤10) and handgun (≤15) magazine_warning rules simultaneously.

---

## 24. Shipping Flags — Save Fix + PDP Modal Removal

### Shipping flags not saving (threaded barrel, magazine capacity)
Root cause: same as the product-details widget issue — Medusa's product module service does not reliably merge individual metadata keys via the standard `POST /admin/products/:id` endpoint. The widget was silently succeeding (no error toast) but changes were not persisting.

**Fix:** Created a dedicated custom API route `POST /admin/products/:id/shipping-flags` that uses the same direct Knex SQL JSON-merge approach as the product-details route:
```sql
UPDATE product SET metadata = COALESCE(metadata, '{}'::jsonb) || ?::jsonb WHERE id = ?
```
Widget updated to call `/admin/products/:id/shipping-flags` instead of the built-in products endpoint.

Commit: Medusa `1f0b7c5`.

### PDP magazine warning modal removed
The acknowledgment modal that appeared on the Product Detail Page when a state had a magazine capacity limit has been removed. The amber inline warning text (e.g. "CO limits magazine capacity to 15 rounds…") still appears when a buyer selects their state, but the Add to Cart and Make an Offer buttons are no longer blocked. Modal acknowledgment is only enforced at checkout.

Changes to `ProductDetailPage.tsx`:
- Removed `magWarningModal` and `magWarningAcknowledged` state
- `ctasBlocked` now only triggers on hard blocks (`!restrictionCheck.ok`) — magazine warnings no longer block CTAs
- Removed the full-screen modal JSX (~35 lines)

Commit: storefront `036f74f`.

## 25. Shipping Flags — Widget Fix (2026-06-11)

**Problem:** Shipping flags (threaded barrel toggle, magazine capacity) still not saving after the custom route was added in section 24. The `POST /admin/products/:id/shipping-flags` route existed and was correctly registered, but the Medusa container had not been rebuilt after commit `1f0b7c5` was made, so the route was absent at runtime.

After rebuilding, the save still failed. Root cause: all 312+ products had `magazine_capacity` stored as a JSON array (`["7"]`) in their metadata — a legacy artifact from the original bulk import. The widget read `data.metadata.magazine_capacity` which was an array, then called `.trim()` on it, throwing a `TypeError`. This was silently caught, showing a "Failed to save" toast with no POST ever reaching the server.

**Fixes applied:**

1. **DB data migration** (direct SQL, no rebuild):
```sql
-- Fix arrays: ["7"] → "7"
UPDATE product
SET metadata = jsonb_set(metadata, '{magazine_capacity}', to_jsonb(metadata->'magazine_capacity'->>0))
WHERE metadata ? 'magazine_capacity' AND jsonb_typeof(metadata->'magazine_capacity') = 'array';
-- 312 rows updated
```

2. **Widget rewrite** (`product-shipping-restrictions.tsx`): Widget now fetches from `GET /admin/products/:id/shipping-flags` on mount (returns normalized `{ has_threaded_barrel: bool, magazine_capacity: number|null }`) instead of reading raw `data.metadata`. Falls back to metadata with safe coercion if the API call fails. This ensures the widget always works regardless of how values are stored in metadata.

Commits: Medusa `f01b712` (widget). DB fix applied in-place via SQL.

## 26. SEO — Meta Title Template Removal + Full Page CMS Control (2026-06-11)

**Problem:** All page titles had "| Luxus Collection" automatically appended via Next.js root layout template. User wants full manual control over every page title via CMS.

**Changes:**

1. **Root layout** (`layout.tsx`) — changed `template: "%s | Luxus Collection"` to `template: "%s"` (identity — no suffix appended). `default` fallback changed to `"Luxus Collection"`.

2. **Payload CMS PageSeo global** — added 8 new page groups so all public-facing pages are now controllable:
   - models ( /shop/models )
   - collectibleFirearms ( /shop/collectible-firearms )
   - modernFirearms ( /shop/modern-firearms )
   - featured ( /featured )
   - shipping ( /shipping )
   - terms ( /terms )
   - privacy ( /privacy )
   - home ( / ) — was in type but missing from CMS definition

3. **DB** — 14 new columns added to `page_seo` via direct SQL (auto-migrate skips).

4. **`payload.ts` type** — `PageSeoData` updated with 7 new optional page groups.

5. **12 page.tsx files** converted from static `metadata` export to `generateMetadata()` using `getPageSeo()`:
   - `/` (home), `/shipping`, `/terms`, `/privacy`, `/featured`, `/articles`
   - `/shop/brands`, `/shop/categories`, `/shop/collections`, `/shop/models`
   - `/shop/collectible-firearms`, `/shop/modern-firearms`

Pages intentionally left without CMS SEO: Cart, Checkout, Account, Auth, Invoice, Print (should not be indexed).

Commits: storefront `933d3b9`, Payload `3cb5aee`

## 27. SEO — Schema.org Offers Fix for Contact-For-Pricing Products (2026-06-11)

**Problem:** Google schema validator flagged a missing `price` field on products with "Contact Us For Pricing" or no price. The `offers` block was always emitted but `price` was conditionally omitted, leaving an invalid `Offer` with `priceCurrency` but no `price`.

**Fix:** The entire `offers` block is now skipped when `product.contact_for_pricing` is true or `product.price` is null/zero. Products with a real price are unaffected.

Commit: storefront `c1e2212`

## 28. SEO — Parameterized URL Cleanup (2026-06-11)

**Problem:** Site audit flagged four URLs that should not be indexed as separate pages:
- `/shop?order=newest` — generated by "View All" link in home page New Arrivals section
- `/contact?topic=Classifieds+Waitlist` — generated by "Get Early Access" button on Featured page (topic param was never read by the contact form; did nothing)
- `/shop?by=category` and `/shop?by=brand` — not in current code; old indexed URLs from a previous version of the shop page

**Fixes:**
1. Changed `href="/shop?order=newest"` → `href="/shop"` in `HomePage.tsx` (shop already defaults to newest sort)
2. Changed `href="/contact?topic=Classifieds+Waitlist"` → `href="/contact"` in `FeaturedPage.tsx`
3. Added `alternates: { canonical: '/shop' }` to shop page `generateMetadata` — consolidates any indexed `?by=*` or `?order=*` variants
4. Added `alternates: { canonical: '/contact' }` to contact page `generateMetadata`

Commit: storefront `3849460`

## 29. SEO — Canonical Tags for All Public Pages (2026-06-11)

Added `alternates: { canonical: '...' }` to every public-facing page's `generateMetadata`. Previously only `/shop` and `/contact` had canonical tags.

**26 pages now covered:**

Static (16): home `/`, about, articles, faq, featured, contact, support, sell-your-gun, shipping, terms, privacy, shop/brands, shop/categories, shop/collections, shop/models, shop/collectible-firearms, shop/modern-firearms

Dynamic (10): `/product/[handle]`, `/brand/[slug]`, `/category/[slug]`, `/collection/[slug]`, `/shop/model/[slug]`, `/article/[slug]`, `/resources-on-guns/[slug]`, `/resources-on-guns/[slug]/[articleSlug]`

Intentionally excluded: `/invoice/[orderId]` (private, not indexed) and `/product/[handle]/print` (already has `robots: "noindex"`).

Commit: storefront `ef692dc`

## 30. Backups — Nightly PostgreSQL Dumps to S3 (2026-06-11)

**Setup:** Automated nightly backups of both PostgreSQL databases to S3 bucket `luxus-collection-backups` (us-east-1).

**Discovery:**
- Existing `backup.sh` was failing silently — cron job existed (`0 3 * * *`) but log was empty
- Script referenced Docker upload volumes (`luxus-commerce_medusa_uploads`, `luxus-commerce_payload_uploads`) — both empty because all media is stored directly on S3, not in Docker volumes
- S3 bucket `luxus-collection-backups` did not exist — created via AWS CLI
- IAM user `luxus-collection-backups` has S3 object permissions but not bucket-level policy permissions (PutBucketVersioning denied — handled via script-level retention instead)

**Script rewrite (`/home/ubuntu/luxus-commerce/scripts/backup.sh`):**
- Dumps `luxus_medusa` (1.5MB gzipped) and `luxus_payload` (940KB gzipped) via `docker exec luxus-postgres pg_dump`
- Uploads both dumps to `s3://luxus-collection-backups/daily/`
- On Sundays: also copies to `s3://luxus-collection-backups/weekly/` with ISO week label
- Prunes daily/ files older than 30 days, weekly/ files older than 90 days
- Keeps 3 days of local copies in `/home/ubuntu/luxus-commerce/backups/` then deletes
- Fully tested: exit 0, "Backup completed successfully" logged

**Cron:** `0 3 * * * /home/ubuntu/luxus-commerce/scripts/backup.sh >> /var/log/luxus-backup.log 2>&1` (already configured, now works)

Commit: commerce `670b09a`

## 31. Backups — Monthly Project File Backup to S3 (2026-06-11)

Monthly tarballs of both project directories, source-only (no node_modules or build artifacts).

**What's included:**
- `luxus-storefront` — all source code + `.env.local` (not in git). Excludes `node_modules/` (628 MB) and `.next/` (245 MB). Compressed: 744 KB
- `luxus-commerce` — all source code + `.env` files + `docker-compose.yml` + scripts. Excludes all `node_modules/` (~1.9 GB total) and `services/payload/.next/` (78 MB). Compressed: 3.7 MB

**Retention:** 12 months, stored at `s3://luxus-collection-backups/monthly/`

**Cron:** `0 4 1 * * /home/ubuntu/luxus-commerce/scripts/backup-files.sh >> /var/log/luxus-backup.log 2>&1` (1st of each month, 04:00 UTC — 1 hour after the nightly DB backup)

**Tested:** Exit 0, both tarballs uploaded and verified in S3.

Commit: commerce `fd8bbec`

## 32. Monitoring — Sentry Error Tracking (2026-06-11)

Wired up `@sentry/nextjs` v10.57.0 using the Next.js 16 instrumentation API.

**Files created/modified:**
- `src/instrumentation.ts` — server-side Sentry init + exports `onRequestError = Sentry.captureRequestError` (catches all App Router server errors: RSC, route handlers, middleware)
- `src/instrumentation-client.ts` — client-side Sentry init (catches browser JS errors before React hydration)
- `next.config.ts` — wrapped with `withSentryConfig()`; source maps disabled until `SENTRY_AUTH_TOKEN` is added
- `.env.local` — `NEXT_PUBLIC_SENTRY_DSN` added for local dev
- Vercel — `NEXT_PUBLIC_SENTRY_DSN` added to all environments via dashboard

**What it captures:** Unhandled errors in server components, route handlers, client components. `tracesSampleRate: 1.0` (100% — small site). Noisy browser-extension errors filtered out via `ignoreErrors`.

**Source maps (future):** Add `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` to Vercel env vars, then set `sourcemaps: { disable: false }` in `next.config.ts`. This makes stack traces show real source file names instead of minified bundles.

Commit: storefront `ec9cd49`

## 33. Payments — Elavon Converge Lightbox (2026-06-11 continued)

Replaced the Hosted Payment Page (full-page redirect) with the **Converge Lightbox modal** (`PayWithConverge.open()`). The customer pays in a modal on the checkout page and never navigates away, eliminating all redirect complexity.

### What was removed
- `ssl_return_url`, `ssl_cancel_url`, HMAC signing, `lxs_cart` cookie (cross-origin SameSite issue), 303 redirect routing, `/api/elavon/complete`, `/api/elavon/cancel`

### What replaced it
- **`CheckoutPage.tsx`**: Loads `PayWithConverge.js` via Next.js `<Script>`. `handleCardPay()` calls `window.PayWithConverge.open({ ssl_txn_auth_token: token }, callbacks)` with 4 callbacks: `onCancelled`, `onDeclined`, `onError`, `onApproval`
- **`/api/elavon/finalize/route.ts`** (new storefront proxy): Receives Elavon result from `onApproval`, proxies to Medusa `/store/elavon/finalize` with `ELAVON_PROXY_SECRET`. Keeps the secret off the browser.
- **`/store/elavon/finalize/route.ts`** (Medusa): Merges Elavon result into payment session, runs `complete-cart` workflow
- **`CheckoutPage.tsx` prepareCart()**: Auto-adds first available shipping method if none selected — required by `complete-cart` workflow
- **Shipping option fix**: `so_5ad1659c05a140fed90118d438` ("Next Day Air") had `enabled_in_store = "false"` in DB; fixed via `UPDATE shipping_option_rule SET value = '"true"'`
- **Script environment**: `NEXT_PUBLIC_ELAVON_ENV=demo` for demo; defaults to production. Build-time baked — must be set before deploy.

Commits: storefront `c59e61c`, `716a316`, `6c20f4b`, `476f010`

## 34. Payments — Order Display Fixes After First Successful Lightbox Payment (2026-06-11)

After the first successful Lightbox payment (order `order_01KTWABDR6WR1D2NADGZG255K6`, approval code 036886), three display issues were found and fixed.

### Issue 1: Invoice totals all showing $0

**Root cause:** `query.graph` computed fields (`item_subtotal`, `tax_total`, `total`, `items.subtotal`) return 0 even when the underlying data is correct. Also, `items.quantity` is not available as `items.quantity` in the graph — it's at `items.detail.quantity`.

**Fix** (`/store/orders/receipt/route.ts`):
- Query `"summary"` field (stored JSONB: `{ current_order_total, original_order_total, ... }`) — this IS accessible via `query.graph`
- Query `"items.detail.quantity"` for quantity
- Query `"shipping_methods.raw_amount"` for shipping (raw JSONB cents value)
- Calculate: `itemSubtotal = unit_price × qty`, `shippingTotal = raw_amount.value`, `taxTotal = total − subtotal − shipping`
- Invoice now correctly shows: subtotal $5.00, shipping $0.00, tax $0.35, total $5.35

### Issue 2: Payment showing "authorized" not "captured" in admin

**Root cause:** Elavon `ccsale` is an immediate capture at Elavon's side, but Medusa's `complete-cart` workflow only calls `authorizePayment()`, leaving Medusa's internal state as "authorized".

**Fix** (`/store/elavon/finalize/route.ts`): After `complete-cart` completes, query the new order's payment ID via `query.graph`, then call `paymentModule.capturePayment({ payment_id })`. Non-fatal if it fails (money is already captured at Elavon).

### Issue 3: Order not appearing in customer order history

**Root cause:** `GET /store/orders/by-email` was missing `authenticate("customer", ["bearer"])` middleware. Medusa never parsed the JWT, so `req.auth_context` was always undefined and the route returned 401 silently.

**Fix** (`src/api/middlewares.ts`): Added `authenticate("customer", ["bearer"])` middleware for `/store/orders/by-email`. Also rewrote the route to use `query.graph` with `summary` field so returned order totals are correct.

### Issue 4: Invoice always shows shipping line

Changed invoice `OrderConfirmationPage.tsx` to always display shipping line (even at $0), per user request — every card order has a shipping method selected.

Commits: storefront `e7d2062`, Medusa `6e858ec`

---

## §35 — Email Order Totals Fix (2026-06-12)

### Problem
Order confirmation emails (and payment-received / notify emails) showed $0.00 for subtotal, tax, and total. Per-item prices were correct ($5.00) but all aggregate totals were $0.

### Root cause
`query.graph` computed fields (`order.total`, `order.item_total`, `order.tax_total`, `order.shipping_total`) return 0 for order entities. The email subscribers were querying these fields directly.

Secondary: `items.quantity` was being requested but the quantity lives in `items.detail.quantity` (the `order_item_detail` table, not `order_line_item`).

### Fix
Switched all three affected files to use `summary.current_order_total` (same pattern as the receipt endpoint) with manual calculation:
- `itemSubtotal = unit_price × detail.quantity` for each item
- `shippingTotal` from `shipping_methods.raw_amount.value`  
- `taxTotal = total − itemSubtotal − shippingTotal`

Files changed:
- `src/subscribers/order-placed.ts` — order confirmation email
- `src/subscribers/payment-received.ts` — payment confirmation email
- `src/api/admin/orders/[id]/notify/route.ts` — admin "Send Payment Confirmation" / "Mark as Shipped" emails (also switched from `orderModule.retrieveOrder` to `query.graph` for consistency)

Commit: Medusa `14f2d01`, container rebuilt 2026-06-12

---

## §36 — Medusa Admin Price Display Fix — Permanent (2026-06-12)

### Problem
Admin order page showed $535.00 / $500.00 instead of $5.35 / $5.00. Patches applied via `docker cp` were lost every time the container was recreated (`docker compose up -d` recreates the writable layer).

### Root cause
Medusa v2.15.1 admin SPA has three compiled JS chunk files with currency formatters that pass raw cent values directly to `Intl.NumberFormat.format()` without dividing by 100:
- `index-*.js` — `Bu` / `jve` functions (order summary section)
- `chunk-WATKBUHQ-*.js` — `le` function (payment section)
- `chunk-X6BAAGCL-*.js` — `O` / `I` functions (payment detail rows)

The order detail page lazy-loads the latter two; patching only the main index bundle left prices wrong in payment sections.

### Fix
Added a 13-line `RUN` block to the Dockerfile (builder stage, after `npm run build`) that patches all `*.js` files in the admin assets directory using `find | xargs sed`. Uses five `-e` patterns with `|` delimiter to avoid escaping `/100`. Because `find` searches all JS files by wildcard, the patch survives hash-based filename changes across minor Medusa builds. If a future Medusa upgrade changes the patterns, the `sed` silently no-ops and prices will display 100× again.

```dockerfile
RUN ASSETS=.medusa/server/public/admin/assets && \
    find "$ASSETS" -name "*.js" | xargs sed -i \
      -e 's|...format(e)|...format((e??0)/100)|g' \
      ...
```

Commit: Medusa `fd0e5ca`

---

## §37 — Sales Email Notifications (2026-06-12)

### Problem
No email was sent to the sales team when a customer placed an order or when a payment was captured. Only the buyer received emails.

### Fix
Two subscribers updated to `Promise.all([buyerEmail, salesEmail])`:

**`order-placed.ts`:** Sales gets "NEW ORDER — #N" email with: order number, customer name, email, order total, ship-to address, FFL dealer name, itemised product table, "View in Admin" button linking to `${MEDUSA_ADMIN_URL}/app/orders/${id}`.

**`payment-received.ts`:** Sales gets "PAYMENT CAPTURED — #N" email with: order number, customer name, email, amount, "View in Admin" button.

Sales address: `process.env.ADMIN_EMAIL ?? "sales@luxus-collection.com"`

Commit: Medusa `d4e25b8`

---

## §38 — FFL Address: Admin Display + Checkout Data Fix (2026-06-12)

### Problem
Two issues in the Medusa admin order page:
1. The **Shipping address** section showed the buyer's personal address, not the FFL dealer.
2. The **Billing address** section showed "Same as shipping address" because both addresses were identical in the DB — making it look like no billing address was on file.

Staff looking at an order could not confirm an FFL was associated with it from the built-in panels.

### Fix — Part 1: Checkout data model (`CheckoutPage.tsx`)
Changed how the cart is finalised before payment. `shipping_address` is now set to the FFL dealer's name and address (from `form.fflDealerName` / `form.fflDealerAddress1` etc.). `billing_address` remains the buyer's personal address. When no FFL is selected (e.g. accessories-only), both fall back to the buyer's address as before.

All new orders will have the correct data in Medusa's native address fields, so the built-in admin panels show FFL as shipping and buyer as billing automatically.

Commit: storefront `24b84c2`

### Fix — Part 2: Admin widget (`order-ffl.tsx`)
New Medusa admin widget in zone `order.details.side.before` that reads `ffl_dealer_*` and `buyer_*` from `order.metadata`. Shows a clear "FFL Transfer Destination" heading with FFL name + address, and a "Buyer Address" row beneath it. Works for all orders (reads from metadata, which is always populated regardless of what `shipping_address` contains in the DB).

"Manual entry" badge (grey, Medusa `Badge` component) shown when `meta.ffl_is_manual === "true"`.

Commit: Medusa `6d19490`

### Fix — Part 3: Existing test order corrected via API
For the existing test order (`order_01KTWABDR6WR1D2NADGZG255K6`), the `shipping_address` and `billing_address` DB records were updated via `POST /admin/orders/:id` (Medusa's `updateOrderWorkflow` accepts both fields). The built-in admin panels now show the correct data for this order too.

---

## §39 — FFL Admin Widget — Medusa UI Styling (2026-06-12)

### Problem
The FFL widget used a gold-bordered, invoice-style box that looked out of place in the Medusa admin UI.

### Fix
Rewrote `order-ffl.tsx` to match native Medusa admin component conventions exactly:
- **Heading**: `<Heading level="h2">` — same as "Customer", "Fulfillment" headers
- **Rows**: `<div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">` — identical to built-in address rows
- **Labels**: `<Text size="small" leading="compact" weight="plus">`
- **Values**: `<Text size="small" leading="compact">` with `break-words` spans and `<br />` between address lines
- **Badge**: `<Badge size="2xsmall" color="grey">Manual entry</Badge>` for manual FFL entries
- Extracted `AddressRow` helper component for reuse

Removed all custom inline styles (gold borders, background colours, `letterSpacing` overrides). Container rebuilt and redeployed.

---

## §40 — Internal Link Engine (2026-06-12)

### Goal
Auto-insert contextual internal links into article body text at build time, improving on-page SEO and cross-linking between content and products.

### Implementation

**New collection: `InternalLinks` (Payload CMS)**
Manual keyword → URL overrides. Admins can add, enable/disable, and prioritise entries via CMS admin (`SEO` group). Table: `internal_links` + FK column in `payload_locked_documents_rels` (created manually via SQL — Payload doesn't auto-migrate new collections).

**`src/lib/link-engine.ts`**
Plain async function (no `unstable_cache` — deprecated in Next.js 16). Each source `fetch()` uses `next: { revalidate: false, tags: [...] }` matching the pattern in `payload.ts` / `api.ts`.

Sources and priorities (highest wins on keyword conflict):
- Manual CMS overrides (`/api/internal-links`) — priority 10 (configurable)
- Article tags → article pages — priority 70
- Product brand+model compound ("Colt Single Action Army") → product page — priority 60
- Brand name → `/brand/[slug]` hub — priority 50
- Product model only ("Single Action Army") → product page — priority 45
- Category name → `/category/[handle]` — priority 40

Keyword matching: word-boundary regex `(?<![a-zA-Z0-9])(keyword)(?![a-zA-Z0-9])`, case-insensitive. Longest keyword wins on overlap ("Colt Single Action Army" beats "Colt"). Max 1 auto-link per paragraph; each destination URL used at most once per article.

Product attributes fetched with `fields=id,handle,*attribute_values,*attribute_values.attribute_type` — avoids exact title matching which almost never appears in article prose.

**`src/app/article/[slug]/page.tsx`**
Calls `getLinkDictionary()` + `injectLinks()` at build time; passes transformed `LexNode[]` to `ArticlePage` as `body` prop.

**`src/app/article/[slug]/ArticlePage.tsx`**
Auto-links render as `<a>` with `autoLink: true` flag — distinct style from external links (no `target="_blank"`).

Commits: `502e37d`, `2d843c6`, `3a4eb96`

---

## §41 — Auto-Link Visibility + Style (2026-06-12)

### Problem
Auto-links used `color: inherit` with a 53%-transparent gold underline — very hard to spot in article body text.

### Fix
Changed `InlineNode` in `ArticlePage.tsx` to use `color: t.goldDark` (`#c09530`, the bright warm amber from the theme) with a 60%-opacity underline of the same colour. Matches the site's gold palette, clearly readable, visually distinct from external/outbound links which use `t.gold` (`#7e5e10`, the darker olive-gold).

Commit: storefront `a82c2a9`

---
