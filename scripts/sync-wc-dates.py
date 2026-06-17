#!/usr/bin/env python3
"""
sync-wc-dates.py
Pulls publish dates from WooCommerce and writes them to the created_at column
in Medusa's PostgreSQL database.  Nothing else is changed — product status,
title, description, pricing, variants, and metadata are untouched.

Matching order:
  1. Variant SKU  (WooCommerce SKU ↔ Medusa variant SKU)
  2. Slug / handle (WooCommerce product slug ↔ Medusa product handle)

Products that can't be matched are listed in the report for manual review.

Usage:
  pip install requests psycopg2-binary
  python3 scripts/sync-wc-dates.py
"""

import requests
import psycopg2
import json
import sys
from datetime import datetime, timezone

# ── Configuration ─────────────────────────────────────────────────────────────
WC_URL       = "https://luxuscap.com"
WC_KEY       = "ck_278d583188fe6dc0f2942ea26dc10d177c6b3543"
WC_SECRET    = "cs_5d7fba6335fa5841268dd195d31ec5ef725800e4"

MEDUSA_URL   = "https://api.luxus-collection.com"
MEDUSA_EMAIL = ""   # ← your Medusa admin email
MEDUSA_PASS  = ""   # ← your Medusa admin password

# PostgreSQL connection string for the Medusa database.
# Format: postgresql://user:password@host:port/dbname
DATABASE_URL = ""   # ← your Medusa DATABASE_URL

REPORT_FILE  = "wc_date_sync_report.json"
# ─────────────────────────────────────────────────────────────────────────────


def medusa_auth():
    r = requests.post(
        f"{MEDUSA_URL}/auth/admin/emailpass",
        json={"email": MEDUSA_EMAIL, "password": MEDUSA_PASS},
    )
    if not r.ok:
        print(f"Medusa auth failed: {r.status_code} {r.text}")
        sys.exit(1)
    return r.json()["token"]


def fetch_wc_products():
    products = []
    page = 1
    while True:
        r = requests.get(
            f"{WC_URL}/wp-json/wc/v3/products",
            auth=(WC_KEY, WC_SECRET),
            params={"per_page": 100, "page": page, "status": "publish"},
        )
        r.raise_for_status()
        batch = r.json()
        if not batch:
            break
        products.extend(batch)
        print(f"  WC: fetched {len(products)} products...", end="\r", flush=True)
        page += 1
    print(f"  WC: {len(products)} published products total          ")
    return products


def fetch_medusa_products(headers):
    products = []
    offset = 0
    limit = 100
    while True:
        r = requests.get(
            f"{MEDUSA_URL}/admin/products",
            headers=headers,
            params={"limit": limit, "offset": offset},
        )
        r.raise_for_status()
        data = r.json()
        batch = data.get("products", [])
        if not batch:
            break
        products.extend(batch)
        print(f"  Medusa: fetched {len(products)} products...", end="\r", flush=True)
        if len(products) >= data.get("count", 0):
            break
        offset += limit
    print(f"  Medusa: {len(products)} products total          ")
    return products


def parse_wc_date(date_str: str) -> datetime:
    """Parse WooCommerce date_created (local time, no tz) → UTC datetime."""
    # WooCommerce returns ISO 8601 without timezone offset, e.g. "2023-04-12T14:30:00"
    dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        # Treat naive datetimes as UTC
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def main():
    if not MEDUSA_EMAIL or not MEDUSA_PASS:
        print("ERROR: fill in MEDUSA_EMAIL and MEDUSA_PASS at the top of this script.")
        sys.exit(1)
    if not DATABASE_URL:
        print("ERROR: fill in DATABASE_URL at the top of this script.")
        sys.exit(1)

    print("Authenticating with Medusa...")
    token = medusa_auth()
    headers = {"Authorization": f"Bearer {token}"}

    print("Fetching WooCommerce products...")
    wc_products = fetch_wc_products()

    print("Fetching Medusa products...")
    medusa_products = fetch_medusa_products(headers)

    # Build WooCommerce lookup indexes
    wc_by_sku  = {}
    wc_by_slug = {}
    for p in wc_products:
        wc_by_slug[p["slug"]] = p
        sku = (p.get("sku") or "").strip()
        if sku:
            wc_by_sku[sku] = p

    # Connect to PostgreSQL
    print("\nConnecting to Medusa database...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur  = conn.cursor()
    except Exception as e:
        print(f"Database connection failed: {e}")
        sys.exit(1)

    updated   = []
    failed    = []
    unmatched = []

    print("Matching and updating...\n")

    for mp in medusa_products:
        wc           = None
        match_method = None

        # 1. Match by variant SKU
        for v in mp.get("variants", []):
            sku = (v.get("sku") or "").strip()
            if sku and sku in wc_by_sku:
                wc = wc_by_sku[sku]
                match_method = f"SKU:{sku}"
                break

        # 2. Match by handle ↔ WooCommerce slug
        if wc is None:
            handle = mp.get("handle", "")
            if handle in wc_by_slug:
                wc = wc_by_slug[handle]
                match_method = f"slug:{handle}"

        if wc is None:
            unmatched.append(mp)
            continue

        wc_date_str = wc.get("date_created", "")
        if not wc_date_str:
            unmatched.append(mp)
            continue

        try:
            wc_dt = parse_wc_date(wc_date_str)
            cur.execute(
                "UPDATE product SET created_at = %s WHERE id = %s",
                (wc_dt, mp["id"]),
            )
            conn.commit()
            print(f"  ✓  {mp['title'][:52]:<52}  {wc_date_str[:10]}  [{match_method}]")
            updated.append({
                "medusa_title": mp["title"],
                "wc_title":     wc["name"],
                "date":         wc_date_str,
                "match":        match_method,
            })
        except Exception as e:
            conn.rollback()
            print(f"  ✗  {mp['title']}: {e}")
            failed.append({"title": mp["title"], "error": str(e)})

    cur.close()
    conn.close()

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"\n{'─' * 60}")
    print(f"Updated  : {len(updated)}")
    print(f"Failed   : {len(failed)}")
    print(f"No match : {len(unmatched)}")

    if unmatched:
        print("\nUnmatched products (need manual review):")
        for p in unmatched:
            print(f"  ·  {p['title']}  (handle: {p['handle']})")

    report = {
        "updated":   updated,
        "failed":    failed,
        "unmatched": [
            {"title": p["title"], "handle": p["handle"]}
            for p in unmatched
        ],
    }
    with open(REPORT_FILE, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\nFull report saved → {REPORT_FILE}")


if __name__ == "__main__":
    main()
