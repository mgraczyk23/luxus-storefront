/**
 * import-ffl.mjs — Load ATF FFL database into Meilisearch
 *
 * Usage:
 *   node scripts/import-ffl.mjs /path/to/FFL06102026.txt
 *
 * Download the file from: https://fflezcheck.atf.gov/FFLEzCheck/fflDownloadDisplay.action
 * (requires your ATF FFL login — run monthly to keep data current)
 *
 * Official ATF fixed-width layout (1-indexed, 323 chars per record):
 *   FFL Number          1–15   (15)  — region+dist+county+type+expiry+seq
 *   License Name       16–65   (50)
 *   Business Name      66–115  (50)
 *   Premise Street    116–165  (50)
 *   Premise City      166–195  (30)
 *   Premise State     196–197   (2)
 *   Premise Zip       198–206   (9)
 *   Mailing Street    207–256  (50)
 *   Mailing City      257–286  (30)
 *   Mailing State     287–288   (2)
 *   Mailing Zip       289–297   (9)
 *   Voice Telephone   298–307  (10)
 *   LOA Issue Date    308–315   (8)  MMDDYYYY
 *   LOA Expiry Date   316–323   (8)  MMDDYYYY
 *
 * Only imports license types useful for customer FFL transfers:
 *   01 - Dealer in Firearms (most common)
 *   02 - Pawnbroker in Firearms
 *
 * Env vars:
 *   MEILI_URL  or  NEXT_PUBLIC_MEILI_URL       (default: http://localhost:7700)
 *   MEILI_KEY  or  MEILISEARCH_MASTER_KEY  or  NEXT_PUBLIC_MEILI_SEARCH_KEY
 */

import { existsSync } from "fs"
import { createInterface } from "readline"
import { createReadStream } from "fs"
import path from "path"

// ── Config ────────────────────────────────────────────────────────────────────

const MEILI_URL = process.env.MEILI_URL
  ?? process.env.MEILISEARCH_HOST
  ?? process.env.NEXT_PUBLIC_MEILI_URL
  ?? "http://localhost:7700"

const MEILI_KEY = process.env.MEILI_KEY
  ?? process.env.MEILISEARCH_MASTER_KEY
  ?? process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY
  ?? ""

const INDEX         = "ffls"
const BATCH         = 1000
const ALLOWED_TYPES = new Set(["01", "02"])

const filePath = process.argv[2]
if (!filePath) {
  console.error("Usage: node scripts/import-ffl.mjs /path/to/FFL-list.txt")
  process.exit(1)
}
if (!existsSync(filePath)) {
  console.error(`File not found: ${filePath}`)
  process.exit(1)
}

// ── Parser — official ATF fixed-width layout (0-indexed) ─────────────────────

function parseFixedLine(line) {
  if (line.length < 306) return null   // must have at least through phone

  const fflNum = line.slice(0, 15)     // chars 1–15

  return {
    fflNum,
    licType:    fflNum.slice(6, 8),    // chars 7–8 within FFL number = license type
    licName:    line.slice(15, 65).trim(),   // chars 16–65
    bizName:    line.slice(65, 115).trim(),  // chars 66–115
    street:     line.slice(115, 165).trim(), // chars 116–165
    city:       line.slice(165, 195).trim(), // chars 166–195
    state:      line.slice(195, 197).trim(), // chars 196–197
    zip:        line.slice(197, 206).trim(), // chars 198–206
    phone:      line.slice(297, 307).trim(), // chars 298–307
  }
}

function formatPhone(raw) {
  const d = raw.replace(/\D/g, "")
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  return raw
}

function toDoc(r) {
  return {
    id:          r.fflNum,                   // raw 15-char FFL number as unique key
    licenseNum:  r.fflNum,
    licenseType: r.licType,
    bizName:     r.bizName || r.licName,     // fall back to license name if no trade name
    licName:     r.licName,
    street:      r.street,
    city:        r.city,
    state:       r.state,
    zip5:        r.zip.slice(0, 5),
    phone:       formatPhone(r.phone),
  }
}

// ── Meilisearch helpers ───────────────────────────────────────────────────────

async function meili(method, endpoint, body) {
  const res = await fetch(`${MEILI_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${MEILI_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Meilisearch ${method} ${endpoint} → ${res.status}: ${err}`)
  }
  return res.json()
}

async function waitForTask(taskUid) {
  for (let i = 0; i < 180; i++) {
    const { status } = await meili("GET", `/tasks/${taskUid}`)
    if (status === "succeeded") return
    if (status === "failed") throw new Error(`Task ${taskUid} failed`)
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error("Timed out waiting for task")
}

// ── Setup ─────────────────────────────────────────────────────────────────────

async function setupIndex() {
  try {
    await meili("GET", `/indexes/${INDEX}`)
    console.log(`  ✓ Index '${INDEX}' already exists`)
  } catch {
    const { taskUid } = await meili("POST", "/indexes", { uid: INDEX, primaryKey: "id" })
    await waitForTask(taskUid)
    console.log(`  ✓ Created index '${INDEX}'`)
  }

  const { taskUid } = await meili("PATCH", `/indexes/${INDEX}/settings`, {
    searchableAttributes: ["bizName", "licName", "city", "state", "zip5", "street"],
    filterableAttributes: ["state", "licenseType", "zip5"],
    sortableAttributes:   ["bizName", "city"],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
    },
    pagination: { maxTotalHits: 500 },
  })
  await waitForTask(taskUid)
  console.log("  ✓ Index settings applied")
}

// ── Import ────────────────────────────────────────────────────────────────────

async function importFile() {
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity })

  let skipped  = 0
  let imported = 0
  let batch    = []

  const flush = async () => {
    if (batch.length === 0) return
    const { taskUid } = await meili("POST", `/indexes/${INDEX}/documents`, batch)
    await waitForTask(taskUid)
    imported += batch.length
    process.stdout.write(`\r  Imported ${imported.toLocaleString()} records…`)
    batch = []
  }

  for await (const rawLine of rl) {
    const line = rawLine.replace(/\r$/, "")
    if (!line.trim()) continue

    const r = parseFixedLine(line)
    if (!r)                          { skipped++; continue }
    if (!ALLOWED_TYPES.has(r.licType)) { skipped++; continue }
    if (!r.city || !r.state)         { skipped++; continue }

    batch.push(toDoc(r))
    if (batch.length >= BATCH) await flush()
  }

  await flush()
  console.log(`\n  ✓ Done — ${imported.toLocaleString()} dealers imported, ${skipped.toLocaleString()} skipped`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Meilisearch: ${MEILI_URL}`)
  console.log(`File: ${path.resolve(filePath)}\n`)

  console.log("Setting up index…")
  await setupIndex()

  console.log("\nImporting FFL records…")
  await importFile()

  const stats = await meili("GET", `/indexes/${INDEX}/stats`)
  console.log(`\nIndex '${INDEX}': ${stats.numberOfDocuments.toLocaleString()} total documents`)
  console.log("\n✅ FFL import complete!")
  console.log("Run this script monthly after downloading the updated ATF FFL list.")
}

main().catch(e => { console.error(e.message); process.exit(1) })
