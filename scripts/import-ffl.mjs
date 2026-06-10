/**
 * import-ffl.mjs — Load ATF FFL database into Meilisearch
 *
 * Usage:
 *   node scripts/import-ffl.mjs /path/to/0626-ffl-list.txt
 *
 * Download the file from: https://fflezcheck.atf.gov/FFLEzCheck/fflDownloadDisplay.action
 * (requires your ATF FFL login — run monthly to keep data current)
 *
 * Supports:
 *   - Fixed-width ASCII format (post Sep 2013)
 *   - Pipe-delimited format (pre Sep 2013 and some export variants)
 *
 * Only imports license types useful for customer transfers:
 *   01 - Dealer in Firearms (most common)
 *   02 - Pawnbroker
 *   09 - Dealer in Destructive Devices (includes some dealers)
 *
 * Env vars (reads from .env.local or process.env):
 *   MEILI_URL  or  NEXT_PUBLIC_MEILI_URL  (default: http://localhost:7700)
 *   MEILI_KEY  or  NEXT_PUBLIC_MEILI_SEARCH_KEY  or  MEILISEARCH_MASTER_KEY
 */

import { readFileSync, existsSync } from "fs"
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

const INDEX   = "ffls"
const BATCH   = 1000
const ALLOWED_TYPES = new Set(["01", "02", "09"])

const filePath = process.argv[2]
if (!filePath) {
  console.error("Usage: node scripts/import-ffl.mjs /path/to/ffl-list.txt")
  process.exit(1)
}
if (!existsSync(filePath)) {
  console.error(`File not found: ${filePath}`)
  process.exit(1)
}

// ── Fixed-width field spec ────────────────────────────────────────────────────
// ATF format as of Sep 2013 (each field is right-padded with spaces)
// Verified against actual ATF FFL file (FFL06102026.txt)
const FIXED_FIELDS = [
  ["licRegn",     1],
  ["licDist",     2],
  ["licCnty",     3],
  ["licType",     2],
  ["licXprdte",   2],  // 2-char coded expiry (e.g. "7D"), NOT 8
  ["licSeqn",     5],
  ["licName",    25],
  ["bizName",    75],  // 75 chars, NOT 50
  ["street",     50],
  ["city",       30],  // 30 chars, NOT 25
  ["state",       2],
  ["zip",         9],
  ["mailStreet", 50],
  ["mailCity",   30],  // 30 chars, NOT 25
  ["mailState",   2],
  ["mailZip",     9],
  ["phone",      10],
  // Remaining bytes (16) are date metadata — ignored
]

const FIXED_WIDTH = FIXED_FIELDS.reduce((s, [, w]) => s + w, 0)  // 307

function parseFixedLine(line) {
  if (line.length < FIXED_WIDTH - 30) return null  // too short
  let pos = 0
  const obj = {}
  for (const [name, width] of FIXED_FIELDS) {
    obj[name] = line.slice(pos, pos + width).trim()
    pos += width
  }
  return obj
}

function parsePipeLine(line) {
  const parts = line.split("|")
  if (parts.length < 12) return null
  return {
    licRegn:    parts[0]?.trim() ?? "",
    licDist:    parts[1]?.trim() ?? "",
    licCnty:    parts[2]?.trim() ?? "",
    licType:    parts[3]?.trim() ?? "",
    licXprdte:  parts[4]?.trim() ?? "",
    licSeqn:    parts[5]?.trim() ?? "",
    licName:    parts[6]?.trim() ?? "",
    bizName:    parts[7]?.trim() ?? "",
    street:     parts[8]?.trim() ?? "",
    city:       parts[9]?.trim() ?? "",
    state:      parts[10]?.trim() ?? "",
    zip:        parts[11]?.trim() ?? "",
    mailStreet: parts[12]?.trim() ?? "",
    mailCity:   parts[13]?.trim() ?? "",
    mailState:  parts[14]?.trim() ?? "",
    mailZip:    parts[15]?.trim() ?? "",
    phone:      parts[16]?.trim() ?? "",
  }
}

function parseLine(line, isPipe) {
  return isPipe ? parsePipeLine(line) : parseFixedLine(line)
}

function makeId(r) {
  return `${r.licRegn}-${r.licDist}-${r.licCnty}-${r.licType}-${r.licXprdte}-${r.licSeqn}`
}

function formatPhone(raw) {
  const d = raw.replace(/\D/g, "")
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
  return raw
}

function toDoc(r) {
  const zip5 = r.zip.slice(0, 5)
  return {
    id:          makeId(r),
    licenseType: r.licType,
    licenseNum:  `${r.licRegn}-${r.licDist}-${r.licCnty}-${r.licType}-${r.licXprdte}-${r.licSeqn}`,
    bizName:     r.bizName || r.licName,
    licName:     r.licName,
    street:      r.street,
    city:        r.city,
    state:       r.state,
    zip:         r.zip,
    zip5:        zip5,
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
  for (let i = 0; i < 120; i++) {
    const { status } = await meili("GET", `/tasks/${taskUid}`)
    if (status === "succeeded") return
    if (status === "failed") throw new Error(`Task ${taskUid} failed`)
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error("Timed out waiting for task")
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function setupIndex() {
  // Create or update index
  try {
    await meili("GET", `/indexes/${INDEX}`)
    console.log(`  ✓ Index '${INDEX}' already exists`)
  } catch {
    const { taskUid } = await meili("POST", "/indexes", { uid: INDEX, primaryKey: "id" })
    await waitForTask(taskUid)
    console.log(`  ✓ Created index '${INDEX}'`)
  }

  // Configure searchable, filterable, sortable attributes
  const { taskUid: t1 } = await meili("PATCH", `/indexes/${INDEX}/settings`, {
    searchableAttributes: ["bizName", "licName", "city", "state", "zip5", "street"],
    filterableAttributes: ["state", "licenseType", "zip5"],
    sortableAttributes: ["bizName", "city"],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
    },
    pagination: { maxTotalHits: 500 },
  })
  await waitForTask(t1)
  console.log("  ✓ Index settings applied")
}

async function importFile() {
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity })

  let lineNo   = 0
  let isPipe   = null
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
    lineNo++
    const line = rawLine.replace(/\r$/, "")
    if (!line.trim()) continue

    // Auto-detect format from first real line
    if (isPipe === null) {
      isPipe = line.includes("|")
      console.log(`  Format detected: ${isPipe ? "pipe-delimited" : "fixed-width ASCII"}`)
    }

    const r = parseLine(line, isPipe)
    if (!r) { skipped++; continue }

    // Skip non-dealer license types
    if (!ALLOWED_TYPES.has(r.licType)) { skipped++; continue }

    // Skip records without a business location
    if (!r.city || !r.state) { skipped++; continue }

    batch.push(toDoc(r))
    if (batch.length >= BATCH) await flush()
  }

  await flush()
  console.log(`\n  ✓ Done — ${imported.toLocaleString()} dealers imported, ${skipped.toLocaleString()} skipped`)
}

async function main() {
  console.log(`Meilisearch: ${MEILI_URL}`)
  console.log(`File: ${path.resolve(filePath)}\n`)

  console.log("Setting up index…")
  await setupIndex()

  console.log("\nImporting FFL records…")
  await importFile()

  // Show a quick count
  const stats = await meili("GET", `/indexes/${INDEX}/stats`)
  console.log(`\nIndex '${INDEX}': ${stats.numberOfDocuments.toLocaleString()} total documents`)
  console.log("\n✅ FFL import complete!")
  console.log("Run this script monthly after downloading the updated ATF FFL list.")
}

main().catch(e => { console.error(e.message); process.exit(1) })
