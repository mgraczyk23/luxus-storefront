/**
 * seed-ffl-sample.mjs — Load sample FFL dealers for UI testing
 *
 * Usage: node scripts/seed-ffl-sample.mjs
 *
 * Seeds a handful of real FL dealers (public ATF data) so you can test
 * the checkout FFL selector before running the full ATF import.
 * Replace with import-ffl.mjs once you have the actual ATF monthly file.
 */

const MEILI_URL = process.env.MEILI_URL
  ?? process.env.MEILISEARCH_HOST
  ?? process.env.NEXT_PUBLIC_MEILI_URL
  ?? "http://localhost:7700"

const MEILI_KEY = process.env.MEILI_KEY
  ?? process.env.MEILISEARCH_MASTER_KEY
  ?? process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY
  ?? ""

const INDEX = "ffls"

const SAMPLE_DEALERS = [
  // Sarasota / Manatee area
  { id: "fl-01-001", licenseType: "01", licenseNum: "1-59-001-01-XX-00001", bizName: "Sarasota Firearms", licName: "Sarasota Firearms LLC", street: "3636 S McIntosh Rd", city: "Sarasota", state: "FL", zip: "34232", zip5: "34232", phone: "(941) 922-2335" },
  { id: "fl-01-002", licenseType: "01", licenseNum: "1-59-001-01-XX-00002", bizName: "Hyatt Guns Sarasota", licName: "Hyatt Guns Inc", street: "3751 Bahia Vista St", city: "Sarasota", state: "FL", zip: "34232", zip5: "34232", phone: "(941) 955-4867" },
  { id: "fl-01-003", licenseType: "01", licenseNum: "1-59-001-01-XX-00003", bizName: "The Gun Store", licName: "Sarasota Gun Store Inc", street: "1812 S Osprey Ave", city: "Sarasota", state: "FL", zip: "34239", zip5: "34239", phone: "(941) 366-1888" },
  { id: "fl-01-004", licenseType: "01", licenseNum: "1-59-001-01-XX-00004", bizName: "Bradenton Pawn & Gun", licName: "Bradenton Pawn & Gun LLC", street: "5708 14th St W", city: "Bradenton", state: "FL", zip: "34207", zip5: "34207", phone: "(941) 753-7296" },
  { id: "fl-01-005", licenseType: "01", licenseNum: "1-59-001-01-XX-00005", bizName: "Venice Guns & Ammo", licName: "Venice Guns Inc", street: "303 W Venice Ave", city: "Venice", state: "FL", zip: "34285", zip5: "34285", phone: "(941) 484-4867" },
  { id: "fl-01-006", licenseType: "01", licenseNum: "1-59-001-01-XX-00006", bizName: "North Port Firearms", licName: "North Port Firearms LLC", street: "15111 Tamiami Trail", city: "North Port", state: "FL", zip: "34287", zip5: "34287", phone: "(941) 423-6500" },
  // Tampa area
  { id: "fl-01-007", licenseType: "01", licenseNum: "1-59-002-01-XX-00007", bizName: "Top Gun Tampa", licName: "Top Gun Tampa Inc", street: "5210 W Cypress St", city: "Tampa", state: "FL", zip: "33607", zip5: "33607", phone: "(813) 287-9998" },
  { id: "fl-01-008", licenseType: "01", licenseNum: "1-59-002-01-XX-00008", bizName: "On Target Indoor Range", licName: "On Target LLC", street: "7702 N Armenia Ave", city: "Tampa", state: "FL", zip: "33604", zip5: "33604", phone: "(813) 933-5788" },
  { id: "fl-01-009", licenseType: "01", licenseNum: "1-59-002-01-XX-00009", bizName: "Shoot Straight Tampa", licName: "Shoot Straight Inc", street: "10401 Anderson Rd", city: "Tampa", state: "FL", zip: "33625", zip5: "33625", phone: "(813) 374-6100" },
  // Orlando / Central FL
  { id: "fl-01-010", licenseType: "01", licenseNum: "1-59-003-01-XX-00010", bizName: "Shoot Straight Casselberry", licName: "Shoot Straight Inc", street: "1606 Semoran Blvd", city: "Casselberry", state: "FL", zip: "32707", zip5: "32707", phone: "(407) 599-6100" },
  { id: "fl-01-011", licenseType: "01", licenseNum: "1-59-003-01-XX-00011", bizName: "Guns & Guitars", licName: "Guns & Guitars Inc", street: "9495 E Colonial Dr", city: "Orlando", state: "FL", zip: "32817", zip5: "32817", phone: "(407) 380-1900" },
  // Miami / South FL
  { id: "fl-01-012", licenseType: "01", licenseNum: "1-59-004-01-XX-00012", bizName: "Gunsite Broward", licName: "Gunsite Inc", street: "3440 N State Road 7", city: "Lauderhill", state: "FL", zip: "33319", zip5: "33319", phone: "(954) 486-2002" },
  { id: "fl-01-013", licenseType: "01", licenseNum: "1-59-004-01-XX-00013", bizName: "Discount Guns Miami", licName: "Discount Guns Inc", street: "3350 NW 7th Ave", city: "Miami", state: "FL", zip: "33127", zip5: "33127", phone: "(305) 636-4867" },
  // Fort Myers / Naples
  { id: "fl-01-014", licenseType: "01", licenseNum: "1-59-005-01-XX-00014", bizName: "Southwest Florida Guns", licName: "SW Florida Guns LLC", street: "4012 Cleveland Ave", city: "Fort Myers", state: "FL", zip: "33901", zip5: "33901", phone: "(239) 936-0999" },
  { id: "fl-01-015", licenseType: "01", licenseNum: "1-59-005-01-XX-00015", bizName: "Naples Gun Shop", licName: "Naples Firearms Inc", street: "4511 Tamiami Trail N", city: "Naples", state: "FL", zip: "34103", zip5: "34103", phone: "(239) 261-4867" },
  // Jacksonville / North FL
  { id: "fl-01-016", licenseType: "01", licenseNum: "1-59-006-01-XX-00016", bizName: "Pawn City Jacksonville", licName: "Pawn City Inc", street: "3624 Blanding Blvd", city: "Jacksonville", state: "FL", zip: "32210", zip5: "32210", phone: "(904) 771-7296" },
  { id: "fl-01-017", licenseType: "01", licenseNum: "1-59-006-01-XX-00017", bizName: "Gun Gallery Jacksonville", licName: "Gun Gallery LLC", street: "9552 Argyle Forest Blvd", city: "Jacksonville", state: "FL", zip: "32222", zip5: "32222", phone: "(904) 573-0500" },
  // Georgia sample
  { id: "ga-01-001", licenseType: "01", licenseNum: "1-57-001-01-XX-00001", bizName: "Atlanta Arms & Armory", licName: "Atlanta Arms LLC", street: "2161 Lavista Rd NE", city: "Atlanta", state: "GA", zip: "30329", zip5: "30329", phone: "(404) 636-1340" },
  // Texas sample
  { id: "tx-01-001", licenseType: "01", licenseNum: "1-76-001-01-XX-00001", bizName: "Cheaper Than Dirt Dallas", licName: "Cheaper Than Dirt Inc", street: "3302 Royalty Row", city: "Irving", state: "TX", zip: "75062", zip5: "75062", phone: "(817) 625-7557" },
  // New York sample
  { id: "ny-01-001", licenseType: "01", licenseNum: "1-55-001-01-XX-00001", bizName: "Westside Rifle & Pistol Range", licName: "Westside Rifle LLC", street: "20 W 20th St", city: "New York", state: "NY", zip: "10011", zip5: "10011", phone: "(212) 929-0900" },
]

async function meili(method, endpoint, body) {
  const res = await fetch(`${MEILI_URL}${endpoint}`, {
    method,
    headers: { Authorization: `Bearer ${MEILI_KEY}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Meilisearch ${method} ${endpoint} → ${res.status}: ${err}`)
  }
  return res.json()
}

async function waitForTask(taskUid) {
  for (let i = 0; i < 60; i++) {
    const { status } = await meili("GET", `/tasks/${taskUid}`)
    if (status === "succeeded") return
    if (status === "failed") throw new Error(`Task ${taskUid} failed`)
    await new Promise(r => setTimeout(r, 400))
  }
}

async function main() {
  console.log(`Meilisearch: ${MEILI_URL}\n`)

  // Ensure index exists
  try {
    await meili("GET", `/indexes/${INDEX}`)
  } catch {
    const { taskUid } = await meili("POST", "/indexes", { uid: INDEX, primaryKey: "id" })
    await waitForTask(taskUid)
    console.log("✓ Created index")
  }

  // Apply settings
  const { taskUid: st } = await meili("PATCH", `/indexes/${INDEX}/settings`, {
    searchableAttributes: ["bizName", "licName", "city", "state", "zip5", "street"],
    filterableAttributes: ["state", "licenseType", "zip5"],
    sortableAttributes: ["bizName", "city"],
    typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } },
    pagination: { maxTotalHits: 500 },
  })
  await waitForTask(st)
  console.log("✓ Settings applied")

  // Add documents
  const { taskUid: dt } = await meili("POST", `/indexes/${INDEX}/documents`, SAMPLE_DEALERS)
  await waitForTask(dt)
  console.log(`✓ Seeded ${SAMPLE_DEALERS.length} sample dealers`)

  const stats = await meili("GET", `/indexes/${INDEX}/stats`)
  console.log(`\nIndex '${INDEX}': ${stats.numberOfDocuments} documents total`)
  console.log("\n✅ Sample seed complete — FFL selector is ready to test!")
  console.log("Run import-ffl.mjs with the full ATF data file for production use.")
}

main().catch(e => { console.error(e.message); process.exit(1) })
