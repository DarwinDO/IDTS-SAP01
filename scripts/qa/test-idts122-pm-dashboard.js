#!/usr/bin/env node
'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const ROOT = path.resolve(__dirname, '../..')
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8')
const serviceCds = read('srv/service.cds')
const serviceJs = read('srv/service.js')
const dashboard = read('app/bug-management-ui/webapp/dashboard-page.js')
const manifest = read('app/bug-management-ui/webapp/manifest.json')
const listReportAnnotations = read('app/bug-management-ui/annotations/list-report.cds')

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

check('dashboard tiles carry allowlisted role-specific filter intent', () => {
  assert.match(dashboard, /"Created by me"[\s\S]*?reporter_ID: userID,[\s\S]*?exclude_closed: "true"/)
  assert.match(dashboard, /"Need my input"[\s\S]*?nextProcessorUser_ID: userID,[\s\S]*?exclude_closed: "true"/)
  assert.match(dashboard, /"Retest required"[\s\S]*?status_code: "RETEST_REQUIRED"[\s\S]*?nextProcessorUser_ID: userID/)
  assert.match(dashboard, /"Assigned to me"[\s\S]*?\{ assignee_ID: profileID \}/)
  assert.match(dashboard, /\["status_code", "reporter_ID", "nextProcessorUser_ID", "assignee_ID", "exclude_closed"\]/)
  assert.match(dashboard, /URLSearchParams/)
  assert.match(listReportAnnotations, /UI\.SelectionFields\s*:\s*\[[\s\S]*reporter_ID/)
})

check('List Report applies dashboard filters before automatically executing search', () => {
  assert.match(manifest, /sap\.fe\.templates\.ListReport\.ListReportController/)
  const extension = read('app/bug-management-ui/webapp/ext/listreport/ListReportController.controller.js')
  assert.match(extension, /DASHBOARD_UUID_FILTERS\s*=\s*\["reporter_ID", "nextProcessorUser_ID", "assignee_ID"\]/)
  assert.match(extension, /filters\.push\(\{ property: "status_code", operator: "EQ", value: statusCode \}\)/)
  assert.match(extension, /property: "status_code", operator: "NE", value: "CLOSED"/)
  assert.match(extension, /setFilterValues\(filter\.property, filter\.operator, filter\.value\)/)
  assert.match(extension, /await\s+Promise\.all/)
  assert.match(extension, /await\s+extensionAPI\.refresh\(\)/)
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

async function checkTesterDashboardDoesNotRequestDeveloperWorkloads () {
  const calls = []
  const testerID = '10000000-0000-0000-0000-000000000004'
  let dashboardModel

  class Control {
    constructor (settings) { this.settings = settings || {} }
    addStyleClass () { return this }
    setModel () { return this }
    placeAt () { return this }
    setBusy () { return this }
    addDependent () { return this }
    open () { return this }
    close () { return this }
    destroy () { return this }
  }
  Control.show = () => {}

  class JSONModel extends Control {
    constructor (data) {
      super()
      this.data = data
      dashboardModel = this
    }
    setData (data) { this.data = data }
    setProperty () {}
  }

  class ResourceModel extends Control {
    getResourceBundle () { return Promise.resolve({ getText: key => key }) }
  }

  const loginSession = {
    getUser: () => ({ ID: testerID, role_code: 'TESTER', displayName: 'NhanT' }),
    getToken: () => 'test-token'
  }
  const bugResponse = {
    value: [{
      ID: '20000000-0000-0000-0000-000000000001',
      IsActiveEntity: true,
      bugNumber: 'BUG-TEST',
      title: 'Tester dashboard regression',
      status_code: 'RETEST_REQUIRED',
      reporter_ID: testerID,
      nextProcessorUser_ID: testerID,
      isRetestRequired: true
    }]
  }

  const sandbox = {
    Promise,
    URLSearchParams,
    window: { location: { href: '' } },
    fetch: async url => {
      calls.push(url)
      if (url.includes('/DeveloperWorkloads')) {
        return { ok: false, json: async () => ({ error: { code: '403' } }) }
      }
      return { ok: true, json: async () => bugResponse }
    },
    sap: {
      ui: {
        require: (dependencies, callback) => callback(...dependencies.map(name => {
          if (name === 'sap/ui/model/json/JSONModel') return JSONModel
          if (name === 'sap/ui/model/resource/ResourceModel') return ResourceModel
          if (name.endsWith('/ProfileShell')) return { createHeaderButton: () => null }
          if (name.endsWith('/LoginController')) return loginSession
          if (name === 'sap/ui/Device') return { system: { phone: false } }
          return Control
        }))
      }
    }
  }

  vm.runInNewContext(dashboard, sandbox, { filename: 'dashboard-page.js' })
  await new Promise(resolve => setImmediate(resolve))

  assert.equal(calls.some(url => url.includes('/DeveloperWorkloads')), false)
  assert.equal(dashboardModel.data.roleMessage, 'Track bugs you reported and items waiting for your next action.')
  assert.equal(dashboardModel.data.tiles.length, 3)
  assert.equal(dashboardModel.data.focusBugs.length, 1)
  console.log('PASS Tester dashboard skips DeveloperWorkloads and still renders Bugs')
}

checkTesterDashboardDoesNotRequestDeveloperWorkloads()
  .then(() => console.log('TOTAL: 8 PASS / 8 checks'))
  .catch(error => {
    console.error(error.stack || error.message)
    process.exitCode = 1
  })
