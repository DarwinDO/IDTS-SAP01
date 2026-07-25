#!/usr/bin/env node
'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const Module = require('module')
const fs = require('node:fs')
const path = require('node:path')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return originalResolve.call(this, request, parent, isMain, options)
}

const cds = require('@sap/cds')
const { SELECT } = cds.ql
const {
  aggregateAiOperationalMetrics,
  createAiProvider,
  createAiSuggestion,
  normalizeAiConfig,
  safeOperationalMetric
} = require('../../srv/ai')
const { containsUnsafeDiagnosticText } = require('../../srv/ai/safety')
const {
  physicalColumns,
  physicalTable,
  statements: migrationStatements
} = require('../db/migrate-idts97-ai-metrics')

const RESULTS = []
let PASS = 0
let FAIL = 0

const BUG_ID = '90000000-0000-0000-0000-000000000001'
const DONHV_ID = '10000000-0000-0000-0000-000000000001'

function rec (label, pass, detail = '') {
  const icon = pass ? 'PASS' : 'FAIL'
  if (pass) PASS++; else FAIL++
  console.log(`  ${icon}  ${label}${detail ? ' | ' + detail : ''}`)
  RESULTS.push({ label, pass, detail })
}

function expectEqual (label, actual, expected) {
  rec(label, actual === expected, `actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`)
}

function expectTruthy (label, actual) {
  rec(label, Boolean(actual), `actual=${JSON.stringify(actual)}`)
}

function expectNoUnsafeDiagnostic (label, value) {
  const unsafe = containsUnsafeDiagnosticText(value)
  rec(label, !unsafe, unsafe ? JSON.stringify(value) : 'no unsafe detail detected')
}

async function createMetricRow (db, overrides = {}) {
  return createAiSuggestion(db, {
    bugID: BUG_ID,
    requestedByID: DONHV_ID,
    featureType: 'BUG_SUMMARY',
    providerAlias: 'mock',
    modelAlias: 'idts-97-model',
    operationStatus: 'SUCCESS',
    latencyMs: 10,
    reviewState: 'PENDING',
    suggestionPayload: { providerStatus: 'SUCCESS', summary: 'Safe aggregate fixture.' },
    summary: 'Safe aggregate fixture.',
    ...overrides
  })
}

async function main () {
  const migrationSource = fs.readFileSync(
    path.resolve(__dirname, '../db/migrate-idts97-ai-metrics.js'),
    'utf8'
  )
  expectTruthy('migration uses exactly two additive idempotent columns',
    migrationStatements.length === 2 &&
    migrationStatements.every(statement => statement.includes('ADD COLUMN IF NOT EXISTS')))
  expectEqual('migration targets the CAP PostgreSQL physical table name',
    physicalTable, 'idts_cap_aisuggestions')
  expectEqual('migration targets lower-case PostgreSQL physical column names',
    physicalColumns.join(','), 'operationstatus,latencyms')
  expectTruthy('migration is explicit execute and dry-run by default',
    migrationSource.includes("process.argv.includes('--execute')") &&
    migrationSource.includes("mode: 'dry-run'"))
  expectTruthy('migration does not invoke CAP deploy or a child process',
    !migrationSource.includes("require('@sap/cds')") &&
    !migrationSource.includes("require('node:child_process')"))
  expectTruthy('migration redacts PostgreSQL URLs',
    migrationSource.includes('[REDACTED_POSTGRES_URL]'))

  console.log('')
  console.log('======================================================')
  console.log(' IDTS-97 Privacy-safe AI Operational Metrics')
  console.log(' ' + new Date().toISOString())
  console.log('======================================================')

  const emitted = []
  const provider = createAiProvider(normalizeAiConfig({
    enabled: true,
    provider: 'mock',
    modelAlias: 'idts-97-model'
  }), {
    metricsLogger: {
      info: (message, metric) => emitted.push({ message, metric })
    }
  })
  const providerResult = await provider.chat({
    featureType: 'bug_summary',
    messages: [{ role: 'user', content: `Bearer ${'a'.repeat(40)} should never reach metrics` }]
  })
  expectEqual('provider request succeeds while emitting metrics', providerResult.status, 'SUCCESS')
  expectEqual('provider emits exactly one operational metric', emitted.length, 1)
  expectEqual('metric captures feature type', emitted[0]?.metric?.featureType, 'BUG_SUMMARY')
  expectEqual('metric captures safe provider alias', emitted[0]?.metric?.providerAlias, 'mock')
  expectEqual('metric captures success outcome', emitted[0]?.metric?.outcome, 'SUCCESS')
  expectTruthy('metric captures non-negative latency', emitted[0]?.metric?.latencyMs >= 0)
  expectNoUnsafeDiagnostic('metric log excludes prompt and secret text', emitted)

  const resilientProvider = createAiProvider(normalizeAiConfig({
    enabled: true,
    provider: 'mock',
    modelAlias: 'idts-97-model'
  }), {
    metricsLogger: {
      info: () => { throw new Error('Synthetic metrics sink failure') }
    }
  })
  const resilientResult = await resilientProvider.chat({
    featureType: 'bug_summary',
    messages: [{ role: 'user', content: 'Normal Bug workflow must continue.' }]
  })
  expectEqual('metrics sink failure does not change provider success', resilientResult.status, 'SUCCESS')
  expectTruthy('metrics sink failure still returns provider data', resilientResult.data?.text)

  const unsafeInputMetric = safeOperationalMetric({
    featureType: 'bug summary',
    operation: 'chat with raw prompt',
    providerAlias: `xkeysib-${'9'.repeat(30)}`,
    modelAlias: `Bearer ${'b'.repeat(40)}`,
    status: 'AI_TIMEOUT',
    durationMs: 12.6,
    rawPrompt: 'must not be copied'
  })
  expectEqual('timeout remains a distinct outcome', unsafeInputMetric.outcome, 'TIMEOUT')
  expectEqual('latency is normalized to an integer', unsafeInputMetric.latencyMs, 13)
  expectNoUnsafeDiagnostic('safe metric allowlist drops raw fields and redacts aliases', unsafeInputMetric)
  expectEqual('safe metric does not copy rawPrompt', Object.hasOwn(unsafeInputMetric, 'rawPrompt'), false)

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const service = await cds.serve('BugService').from(csn)

  const accepted = await createMetricRow(db, {
    operationStatus: 'SUCCESS',
    latencyMs: 10,
    reviewState: 'ACCEPTED'
  })
  await createMetricRow(db, {
    operationStatus: 'AI_TIMEOUT',
    latencyMs: 30,
    reviewState: 'REJECTED'
  })
  await createMetricRow(db, {
    operationStatus: 'AI_CONFIGURATION_INCOMPLETE',
    latencyMs: 5,
    reviewState: 'IGNORED'
  })
  await createMetricRow(db, {
    operationStatus: 'AI_PROVIDER_ERROR',
    latencyMs: null,
    reviewState: 'PENDING'
  })

  expectEqual('audit persists operation status', accepted.operationStatus, 'SUCCESS')
  expectEqual('audit persists latency', accepted.latencyMs, 10)
  const projected = await service.tx({
    user: new cds.User({ id: 'DonHV', roles: ['PM', 'authenticated-user'] })
  }).run(
    SELECT.one.from('BugService.AiSuggestions')
      .columns('operationStatus', 'latencyMs')
      .where({ ID: accepted.ID })
  )
  expectEqual('read-only projection exposes safe operation status', projected.operationStatus, 'SUCCESS')
  expectEqual('read-only projection exposes safe latency', projected.latencyMs, 10)

  const sampleAggregate = aggregateAiOperationalMetrics([
    { featureType_code: 'BUG_SUMMARY', providerAlias: 'mock', modelAlias: 'idts-97-model', operationStatus: 'SUCCESS', latencyMs: 10, reviewState_code: 'ACCEPTED' },
    { featureType_code: 'BUG_SUMMARY', providerAlias: 'mock', modelAlias: 'idts-97-model', operationStatus: 'AI_TIMEOUT', latencyMs: 30, reviewState_code: 'REJECTED' },
    { featureType_code: 'BUG_SUMMARY', providerAlias: 'mock', modelAlias: 'idts-97-model', operationStatus: 'AI_CONFIGURATION_INCOMPLETE', latencyMs: 5, reviewState_code: 'IGNORED' },
    { featureType_code: 'BUG_SUMMARY', providerAlias: 'mock', modelAlias: 'idts-97-model', operationStatus: 'AI_PROVIDER_ERROR', latencyMs: null, reviewState_code: 'PENDING' }
  ], {
    windowStart: '2026-07-01T00:00:00.000Z',
    windowEnd: '2026-07-31T00:00:00.000Z'
  })[0]
  expectEqual('aggregate counts all audited feature requests', sampleAggregate.requestCount, 4)
  expectEqual('aggregate counts successes', sampleAggregate.successCount, 1)
  expectEqual('aggregate counts failures', sampleAggregate.failureCount, 3)
  expectEqual('aggregate distinguishes timeout', sampleAggregate.timeoutCount, 1)
  expectEqual('aggregate distinguishes provider unavailable', sampleAggregate.unavailableCount, 1)
  expectEqual('aggregate counts accepted review', sampleAggregate.acceptedCount, 1)
  expectEqual('aggregate counts rejected review', sampleAggregate.rejectedCount, 1)
  expectEqual('aggregate counts ignored review', sampleAggregate.ignoredCount, 1)
  expectEqual('aggregate counts pending review', sampleAggregate.pendingCount, 1)
  expectEqual('aggregate counts latency samples only', sampleAggregate.latencySampleCount, 3)
  expectEqual('aggregate calculates average latency', sampleAggregate.averageLatencyMs, 15)
  expectEqual('aggregate calculates max latency', sampleAggregate.maxLatencyMs, 30)
  expectNoUnsafeDiagnostic('aggregate output contains allowlisted metadata only', sampleAggregate)

  const apiAggregate = await service.tx({
    user: new cds.User({ id: 'DonHV', roles: ['PM', 'authenticated-user'] })
  }, tx => tx.send('readAiOperationalMetrics', { windowDays: 30 }))
  expectEqual('PM can read operational aggregate', apiAggregate.length, 1)
  expectEqual('PM aggregate reads persisted request count', apiAggregate[0]?.requestCount, 4)
  expectEqual('PM aggregate reads review outcomes', apiAggregate[0]?.acceptedCount, 1)
  expectNoUnsafeDiagnostic('PM aggregate API exposes no sensitive content', apiAggregate)

  let nonPmRejected = false
  try {
    await service.tx({
      user: new cds.User({ id: 'DatDT', roles: ['Tester', 'authenticated-user'] })
    }, tx => tx.send('readAiOperationalMetrics', { windowDays: 30 }))
  } catch (error) {
    nonPmRejected = Number(error.code || error.status || error.statusCode) === 403
  }
  expectEqual('non-PM cannot read operational aggregate', nonPmRejected, true)

  console.log('')
  console.log('Safe aggregate sample:')
  console.log(JSON.stringify(sampleAggregate, null, 2))
  console.log('')
  console.log('======================================================')
  console.log(` TOTAL: ${PASS} PASS  |  ${FAIL} FAIL  |  ${RESULTS.length} checks`)
  console.log('======================================================')

  if (FAIL > 0) process.exit(1)
}

main().catch(error => {
  console.error('FATAL:', error.message)
  console.error(error.stack?.substring(0, 1000))
  process.exit(1)
})
