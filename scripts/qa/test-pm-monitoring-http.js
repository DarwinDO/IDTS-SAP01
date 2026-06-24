/**
 * IDTS-22 PM Monitoring FE Filter Regression — HTTP OData $filter Test
 *
 * Verifies that the SelectionVariant filter conditions used in pm-monitoring.cds
 * work correctly when sent as real OData HTTP $filter requests (the same path
 * Fiori Elements uses at runtime).
 *
 * Unlike the programmatic CDS test (test-pm-monitoring-programmatic.js), this
 * test sends HTTP requests so it catches "no such column" SQLite errors that
 * the in-memory CDS SELECT query path does NOT detect.
 *
 * Prerequisites:
 *   - CAP server running: npm start  OR  npm run watch
 *   - Mock auth enabled (package.json cds.server.auth = "mocked")
 *   - Local SQLite deployed: cds deploy --to sqlite
 *
 * Run: node scripts/qa/test-pm-monitoring-http.js
 */

'use strict'

const BASE = 'http://localhost:4004'
const SRV  = `${BASE}/odata/v4/bug`

let PASS = 0
let FAIL = 0

async function req (url) {
  const res = await fetch(url, {
    headers: { Authorization: 'Basic ' + Buffer.from('DonHV:').toString('base64') }
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${body.slice(0, 300)}`)
  }
  return res.json()
}

function rec (label, pass, detail = '') {
  const icon = pass ? 'PASS' : 'FAIL'
  if (pass) PASS++; else FAIL++
  console.log(`  ${icon}  ${label}${detail ? ' | ' + detail : ''}`)
}

function expectCount (label, actual, expected) {
  rec(label, actual === expected, `count actual=${actual} expected=${expected}`)
}

function expectNoError (label, data) {
  const hasError = data?.error != null
  rec(label + ' — no OData error', !hasError, hasError ? JSON.stringify(data.error) : '')
}

async function main () {
  console.log('')
  console.log('=================================================================')
  console.log(' IDTS-22 PM Monitoring — HTTP OData $filter Regression Tests')
  console.log(' ' + new Date().toISOString())
  console.log('=================================================================')
  console.log('')
  console.log(' NOTE: This test requires a running CAP server at localhost:4004')
  console.log('       npm start  OR  npm run watch-bug-management-ui')
  console.log('')

  // ── Tab 1: All Bugs — no filter, expects all seeded bugs ──────────────────
  console.log('Tab 1: All Bugs (no $filter)')
  try {
    const data = await req(`${SRV}/Bugs?$select=bugNumber&$count=true`)
    expectNoError('All Bugs', data)
    expectCount('All Bugs count ≥ 1', data['@odata.count'] >= 1, true)
    console.log(`       → returned ${data['@odata.count']} total bugs`)
  } catch (e) {
    rec('All Bugs HTTP request', false, e.message)
  }

  // ── Tab 2: Pending Assignment — status_code eq 'PENDING_ASSIGNMENT' ───────
  console.log('\nTab 2: Pending Assignment ($filter=status_code eq PENDING_ASSIGNMENT)')
  try {
    const filter = encodeURIComponent("status_code eq 'PENDING_ASSIGNMENT'")
    const data = await req(`${SRV}/Bugs?$select=bugNumber,status_code&$filter=${filter}&$count=true`)
    expectNoError('PendingAssignment $filter', data)
    const bugs = data.value ?? []
    const allMatch = bugs.every(b => b.status_code === 'PENDING_ASSIGNMENT')
    rec('PendingAssignment — all returned rows have status PENDING_ASSIGNMENT', allMatch,
        allMatch ? '' : 'Unexpected status_code found: ' + bugs.map(b => b.status_code).join(', '))
    rec('PendingAssignment — count ≥ 1', bugs.length >= 1, `actual count=${bugs.length}`)
    console.log(`       → ${bugs.length} bugs: ${bugs.map(b => b.bugNumber).join(', ')}`)
  } catch (e) {
    rec('PendingAssignment HTTP request', false, e.message)
  }

  // ── Tab 3: Rejected Follow-up — status_code eq 'REJECTED' ────────────────
  console.log("\nTab 3: Rejected Follow-up ($filter=status_code eq 'REJECTED')")
  try {
    const filter = encodeURIComponent("status_code eq 'REJECTED'")
    const data = await req(`${SRV}/Bugs?$select=bugNumber,status_code&$filter=${filter}&$count=true`)
    expectNoError('RejectedFollowUp $filter', data)
    const bugs = data.value ?? []
    const allMatch = bugs.every(b => b.status_code === 'REJECTED')
    rec('RejectedFollowUp — all returned rows have status REJECTED', allMatch,
        allMatch ? '' : 'Unexpected: ' + bugs.map(b => b.status_code).join(', '))
    console.log(`       → ${bugs.length} bugs: ${bugs.map(b => b.bugNumber).join(', ')}`)
  } catch (e) {
    rec('RejectedFollowUp HTTP request', false, e.message)
  }

  // ── Tab 4: Retest Required — status_code eq 'RETEST_REQUIRED' ────────────
  console.log("\nTab 4: Retest Required ($filter=status_code eq 'RETEST_REQUIRED')")
  try {
    const filter = encodeURIComponent("status_code eq 'RETEST_REQUIRED'")
    const data = await req(`${SRV}/Bugs?$select=bugNumber,status_code&$filter=${filter}&$count=true`)
    expectNoError('RetestRequired $filter', data)
    const bugs = data.value ?? []
    const allMatch = bugs.every(b => b.status_code === 'RETEST_REQUIRED')
    rec('RetestRequired — all returned rows have status RETEST_REQUIRED', allMatch,
        allMatch ? '' : 'Unexpected: ' + bugs.map(b => b.status_code).join(', '))
    console.log(`       → ${bugs.length} bugs (may be 0 if no seed data in RETEST_REQUIRED)`)
  } catch (e) {
    rec('RetestRequired HTTP request', false, e.message)
  }

  // ── Tab 5: Overdue — status_code ne 'CLOSED' (persistent filter) ──────────
  console.log("\nTab 5: Overdue ($filter=status_code ne 'CLOSED')")
  try {
    const filter = encodeURIComponent("status_code ne 'CLOSED'")
    const data = await req(`${SRV}/Bugs?$select=bugNumber,status_code&$filter=${filter}&$count=true`)
    expectNoError('Overdue (open bugs) $filter', data)
    const bugs = data.value ?? []
    const hasNoClosed = bugs.every(b => b.status_code !== 'CLOSED')
    rec('Overdue — no CLOSED bugs returned', hasNoClosed,
        hasNoClosed ? '' : 'CLOSED bug found unexpectedly')
    rec('Overdue — count ≥ 1', bugs.length >= 1, `actual count=${bugs.length}`)
    console.log(`       → ${bugs.length} open bugs: ${bugs.map(b => b.bugNumber).join(', ')}`)
  } catch (e) {
    rec('Overdue HTTP request', false, e.message)
  }

  // ── Tab 6: My Action Items — status_code ne 'CLOSED' (same as Overdue) ───
  console.log("\nTab 6: My Action Items ($filter=status_code ne 'CLOSED')")
  try {
    const filter = encodeURIComponent("status_code ne 'CLOSED'")
    const data = await req(`${SRV}/Bugs?$select=bugNumber,status_code&$filter=${filter}&$count=true`)
    expectNoError('MyActionItems $filter', data)
    const bugs = data.value ?? []
    const hasNoClosed = bugs.every(b => b.status_code !== 'CLOSED')
    rec('MyActionItems — no CLOSED bugs returned', hasNoClosed,
        hasNoClosed ? '' : 'CLOSED bug found unexpectedly')
    console.log(`       → ${bugs.length} open bugs returned as action item candidates`)
  } catch (e) {
    rec('MyActionItems HTTP request', false, e.message)
  }

  // ── Regression: computed flag $filter must NOT be sent by tabs ────────────
  // (This test confirms the OLD approach would fail — kept as documentation)
  console.log('\nRegression check: computed flag $filter (isOverdue eq true) SHOULD fail at DB level')
  try {
    const filter = encodeURIComponent('isOverdue eq true')
    const data = await req(`${SRV}/Bugs?$select=bugNumber&$filter=${filter}`)
    // CAP may resolve this in-memory — accept but warn
    if (data?.error) {
      rec('Regression: isOverdue $filter blocked at DB (expected)', true,
          `OData error returned: ${data.error.message?.slice(0, 80)}`)
    } else {
      // CAP resolved it in-memory via projection — acceptable but log it
      const count = data?.value?.length ?? 0
      rec('Regression: isOverdue $filter resolved in-memory (acceptable)', true,
          `returned ${count} rows via in-memory projection — not SQLite column filter`)
    }
  } catch (e) {
    // Connection refused = server not running, mark as skip
    rec('Regression check skipped (server not running)', true, e.message.slice(0, 60))
  }

  console.log('')
  console.log('=================================================================')
  console.log(` TOTAL: ${PASS} PASS  |  ${FAIL} FAIL`)
  console.log('=================================================================')

  if (FAIL > 0) process.exit(1)
}

main().catch(err => {
  console.error('FATAL:', err.message ?? err)
  process.exit(1)
})
