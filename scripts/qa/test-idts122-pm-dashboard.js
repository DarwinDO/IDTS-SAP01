#!/usr/bin/env node
'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '../..')
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8')
const serviceCds = read('srv/service.cds')
const serviceJs = read('srv/service.js')
const dashboard = read('app/bug-management-ui/webapp/dashboard-page.js')
const manifest = read('app/bug-management-ui/webapp/manifest.json')

const REQUIRED_STATUSES = [
  'PENDING_ASSIGNMENT',
  'ASSIGNED',
  'IN_REVIEW',
  'NEED_MORE_INFORMATION',
  'IN_PROGRESS',
  'RESOLVED',
  'RETEST_REQUIRED',
  'REJECTED',
  'REOPENED',
  'CLOSED'
]

function check (label, fn) {
  fn()
  console.log(`PASS ${label}`)
}

check('CAP exposes PM-only status metrics contract', () => {
  assert.match(serviceCds, /type\s+BugStatusMetric\s*\{/)
  assert.match(serviceCds, /@\(requires:\s*'PM'\)\s*function\s+readBugStatusMetrics\(\)/s)
  assert.match(serviceJs, /this\.on\('readBugStatusMetrics'/)
})

check('dashboard uses backend status aggregate instead of top-200 Bugs for PM tiles', () => {
  assert.match(dashboard, /readBugStatusMetrics\(\)/)
  assert.doesNotMatch(dashboard, /function\s+pmDashboard\(bugs,\s*workloads\)/)
})

check('dashboard declares exactly the ten current business statuses and excludes NEW', () => {
  const match = dashboard.match(/var\s+PM_STATUS_TILES\s*=\s*\[([\s\S]*?)\n\s*\];/)
  assert.ok(match, 'PM_STATUS_TILES not found')
  for (const status of REQUIRED_STATUSES) assert.match(match[1], new RegExp(`statusCode:\\s*["']${status}["']`))
  assert.doesNotMatch(match[1], /statusCode:\s*["']NEW["']/)
  assert.equal((match[1].match(/statusCode:/g) || []).length, 10)
})

check('status tile navigation carries a filter and a supported List Report extension applies it', () => {
  assert.match(dashboard, /statusCode/)
  assert.match(dashboard, /encodeURIComponent\(statusCode\)/)
  assert.match(manifest, /sap\.fe\.templates\.ListReport\.ListReportController/)
  const extension = read('app/bug-management-ui/webapp/ext/listreport/ListReportController.controller.js')
  assert.match(extension, /setFilterValues\(["']status_code["']/)
})

check('AI operational contract exposes semantic outcome counts', () => {
  for (const field of [
    'badRequestCount',
    'rateLimitedCount',
    'provider5xxCount',
    'timeoutCount',
    'unavailableCount',
    'otherFailureCount'
  ]) assert.match(serviceCds, new RegExp(`${field}\\s*:\\s*Integer`))
})

check('dashboard no longer collapses every failure into unavailable', () => {
  assert.doesNotMatch(dashboard, /unavailableCount\s*\+=\s*Number\(row\.failureCount/)
  for (const field of ['badRequestCount', 'rateLimitedCount', 'provider5xxCount', 'otherFailureCount']) {
    assert.match(dashboard, new RegExp(field))
  }
})

console.log('TOTAL: 6 PASS / 6 checks')
