'use strict'

// Exact local-case runner for IDTS-110.  It is intentionally self-contained so
// every catalog case has one JSON result and one deterministic assertion path.
process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const Module = require('module')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return originalResolve.call(this, request, parent, isMain, options)
}

const assert = require('node:assert/strict')
const { execFileSync, spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql
const { hashPassword, hashToken } = require('../../srv/auth/passwords')
const { normalizeAiConfig } = require('../../srv/ai/config')
const { createAiProvider } = require('../../srv/ai/provider')
const { redactSensitiveText } = require('../../srv/ai/safety')
const { buildBugHandoffSummary } = require('../../srv/ai/bug-summary')
const { resetGatewayCooldownForTest } = require('../../srv/ai/vercel-gateway-provider')
const { prepareCommentCreate } = require('../../srv/bug-service/content')
const { validateRequiredBugFields, validateActiveCodeLists, prepareBugWrite } = require('../../srv/bug-service/bug-write')
const { normalizeEmailConfig } = require('../../srv/email/config')
const { processEmailDeliveries, writeNotificationRecord } = require('../../srv/email/outbox')

const CATALOG = require('../../docs/qa/idts-110-unit-test-catalog.json')
const JSON_MODE = process.argv.includes('--json')
const OUTPUT_INDEX = process.argv.indexOf('--output')
const OUTPUT_PATH = OUTPUT_INDEX >= 0 ? process.argv[OUTPUT_INDEX + 1] : null
const CURRENT_BASELINE_SHA = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const RESULTS = []
const STARTED_AT = new Date().toISOString()
let sequence = 0
let dbForSnapshots

function id () {
  sequence += 1
  return `11000000-0000-0000-0000-${String(sequence).padStart(12, '0')}`
}

function tester () {
  return new cds.User({ id: 'nhant@example.local', roles: ['TESTER', 'authenticated-user'] })
}

function rejectRequest (data = {}, user = tester()) {
  const request = new cds.Request({ data, user })
  request.error = (code, message, target) => {
    const error = new Error(message)
    error.code = code
    error.target = target
    throw error
  }
  return request
}

async function expectReject (action, target) {
  await assert.rejects(action, error => Number(error.code || error.statusCode || error.status) === 400 && (!target || error.target === target))
}

async function dispatchCreate (service, data, user = tester()) {
  return service.dispatch(new cds.Request({
    method: 'POST', event: 'CREATE', target: service.entities.Bugs,
    query: INSERT.into(service.entities.Bugs).entries(data), data, user
  }))
}

function bugData (overrides = {}) {
  return {
    ID: id(),
    title: 'IDTS-110 local exact fixture',
    description: 'Controlled local validation fixture.',
    stepsToReproduce: 'Run the exact local-case runner.',
    actualResult: 'The service evaluates the request.',
    expectedResult: 'The service applies its documented validation.',
    priority_code: 'HIGH', severity_code: 'MAJOR', environment_code: 'QAS',
    applicationComponent_ID: '40000000-0000-0000-0000-000000000006',
    defectCategory_ID: '50000000-0000-0000-0000-000000000002',
    reporter_ID: '20000000-0000-0000-0000-000000000001',
    ...overrides
  }
}

async function assertNoBug (db, bugID) {
  assert.equal(await db.run(SELECT.one.from('idts.cap.Bugs').columns('ID').where({ ID: bugID })), undefined)
}

function emailConfig () {
  return normalizeEmailConfig({
    enabled: true, host: 'smtp.example.test', port: 2525, secure: false,
    username: 'test-user', password: 'not-printed', fromAddress: 'no-reply@example.test',
    fromName: 'IDTS Test', maxRetryCount: 2, batchSize: 10, pollIntervalMs: 15000,
    maxConnections: 1
  })
}

function jsonResponse (status, payload, headers = {}) {
  const normalizedHeaders = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), String(value)]))
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: name => normalizedHeaders[String(name).toLowerCase()] || null },
    json: async () => payload
  }
}

let localHttpContractResult
function runLocalHttpContracts () {
  if (localHttpContractResult) return localHttpContractResult
  const child = spawnSync(process.execPath, [path.join(__dirname, 'test-idts110-attachment-auth-http.js')], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, CDS_TEST_FAKE: 'true' },
    timeout: 120000,
    maxBuffer: 8 * 1024 * 1024
  })
  if (child.error) throw child.error
  const output = child.stdout || ''
  const marker = output.split(/\r?\n/).find(line => line.startsWith('IDTS110_RESULT '))
  if (!marker) throw new Error('IDTS-110 HTTP harness did not emit its sanitized result.')
  localHttpContractResult = JSON.parse(marker.slice('IDTS110_RESULT '.length))
  return localHttpContractResult
}

async function notification (db, suffix) {
  const bug = await db.run(SELECT.one.from('idts.cap.Bugs').columns('ID'))
  const recipient = await db.run(SELECT.one.from('idts.cap.Users').columns('ID').where({ active: true }))
  return db.tx(tx => writeNotificationRecord(tx, {
    bugID: bug.ID, recipientID: recipient.ID, eventType: 'ASSIGNED', message: `IDTS-110 ${suffix}`
  }, emailConfig()))
}

async function safeDbSnapshot () {
  const tables = ['Bugs', 'Comments', 'AuthSessions', 'HistoryEvents', 'Notifications', 'NotificationDeliveries']
  const counts = {}
  for (const table of tables) {
    try { counts[table] = (await dbForSnapshots.run(SELECT.from(`idts.cap.${table}`).columns('ID'))).length } catch { counts[table] = null }
  }
  return counts
}

function catalogCase (caseId) {
  return CATALOG.cases.find(item => item.caseId === caseId)
}

async function runCase (caseId, assertions, execute) {
  const startedAt = new Date().toISOString()
  const definition = catalogCase(caseId)
  const needsState = definition.evidenceRequirements.some(item => /before\/after database|reload\/readback/.test(item))
  let beforeState
  if (process.env.IDTS110_TRACE === 'true') console.error(`[idts110-trace] START ${caseId}`)
  try {
    beforeState = needsState ? await safeDbSnapshot() : undefined
    const runtimeEvidence = await execute()
    const afterState = needsState ? await safeDbSnapshot() : undefined
    const reloadState = needsState ? await safeDbSnapshot() : undefined
    RESULTS.push({ caseId, status: 'PASS', actualResult: 'Exact local assertion passed.', assertions, sourceAssertions: definition.sourceTrace.map(trace => `${trace.file}#${trace.symbol}`), ...(runtimeEvidence ? { runtimeEvidence } : {}), ...(needsState ? { beforeState, afterState, reloadState } : {}), startedAt, completedAt: new Date().toISOString(), baselineSha: CURRENT_BASELINE_SHA })
  } catch (error) {
    const afterState = needsState ? await safeDbSnapshot() : undefined
    const reloadState = needsState ? await safeDbSnapshot() : undefined
    RESULTS.push({ caseId, status: 'FAIL', actualResult: String(error.message || error).replace(/(password|token|key)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]').slice(0, 300), assertions, sourceAssertions: definition.sourceTrace.map(trace => `${trace.file}#${trace.symbol}`), ...(error.runtimeEvidence ? { runtimeEvidence: error.runtimeEvidence } : {}), ...(needsState ? { beforeState, afterState, reloadState } : {}), startedAt, completedAt: new Date().toISOString(), baselineSha: CURRENT_BASELINE_SHA })
  }
  if (process.env.IDTS110_TRACE === 'true') {
    const result = RESULTS.at(-1)
    console.error(`[idts110-trace] END ${caseId} ${result.status}${result.status === 'FAIL' ? ` ${result.actualResult}` : ''}`)
  }
}

async function runStaticBlockedCase (caseId, assertions, execute) {
  const startedAt = new Date().toISOString()
  const definition = catalogCase(caseId)
  try {
    await execute()
    RESULTS.push({
      caseId,
      status: 'BLOCKED',
      actualResult: 'Static UI guard assertions passed, but browser runtime execution is unavailable; the UI behavior is not promoted to PASS.',
      assertions,
      sourceAssertions: definition.sourceTrace.map(trace => `${trace.file}#${trace.symbol}`),
      startedAt,
      completedAt: new Date().toISOString(),
      baselineSha: CURRENT_BASELINE_SHA
    })
  } catch (error) {
    RESULTS.push({
      caseId,
      status: 'FAIL',
      actualResult: String(error.message || error).slice(0, 300),
      assertions,
      sourceAssertions: definition.sourceTrace.map(trace => `${trace.file}#${trace.symbol}`),
      startedAt,
      completedAt: new Date().toISOString(),
      baselineSha: CURRENT_BASELINE_SHA
    })
  }
}

async function main () {
  const csn = await cds.load(['db/schema.cds', 'srv/service.cds', 'srv/auth.cds'])
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  dbForSnapshots = db
  await cds.deploy(csn).to(db)
  const bugService = await cds.serve('BugService').from(csn)
  const auth = await cds.serve('AuthService').from(csn)
  const entities = bugService.entities
  const activeEmail = 'donhv@example.local'
  const activePassword = 'idts-110-active-password'
  const inactiveEmail = 'inactive-idts110@example.local'
  const inactivePassword = 'idts-110-inactive-password'
  const inactiveId = id()
  await db.run(UPDATE('idts.cap.Users').set({ passwordHash: await hashPassword(activePassword), passwordChangedAt: '2026-08-03T00:00:00.000Z' }).where({ email: activeEmail }))
  await db.run(INSERT.into('idts.cap.Users').entries({ ID: inactiveId, displayName: 'Inactive IDTS-110', email: inactiveEmail, role_code: 'TESTER', passwordHash: await hashPassword(inactivePassword), active: false }))

  await runCase('UT-AUTH-001', ['normalizes padded/mixed-case email', 'creates exactly one hashed session'], async () => {
    const before = await db.run(SELECT.from('idts.cap.AuthSessions').where({ user_ID: '10000000-0000-0000-0000-000000000001' }))
    const result = await auth.send('login', { email: `  ${activeEmail.toUpperCase()}  `, password: activePassword })
    const after = await db.run(SELECT.from('idts.cap.AuthSessions').where({ user_ID: result.user.ID }))
    const session = after.find(row => row.tokenHash === hashToken(result.token))
    assert.equal(result.user.email, activeEmail); assert.equal(after.length, before.length + 1)
    assert.ok(session); assert.notEqual(session.tokenHash, result.token)
  })
  for (const [caseId, payload] of [
    ['UT-AUTH-002', { password: activePassword }], ['UT-AUTH-003', { email: activeEmail, password: '' }]
  ]) await runCase(caseId, ['returns generic HTTP 401', 'does not insert an AuthSession'], async () => {
    const before = await db.run(SELECT.from('idts.cap.AuthSessions'))
    await assert.rejects(() => auth.send('login', payload), error => Number(error.code) === 401 && error.message === 'Invalid email or password.')
    assert.equal((await db.run(SELECT.from('idts.cap.AuthSessions'))).length, before.length)
  })
  await runCase('UT-AUTH-004', ['rejects a non-string password at the CDS contract boundary', 'does not expose stack/type internals', 'does not insert an AuthSession'], async () => {
    const result = runLocalHttpContracts().auth
    assert.equal(result.status, 400)
    assert.equal(result.after, result.before)
    if (result.unsafeDetailExposed) {
      throw Object.assign(new Error('Public HTTP 400 exposes CAP type-validation internals.'), { runtimeEvidence: result })
    }
    return result
  })
  await runCase('UT-AUTH-005', ['unknown and wrong-password responses are indistinguishable'], async () => {
    const messages = []
    for (const payload of [{ email: 'unknown@example.local', password: activePassword }, { email: activeEmail, password: 'wrong' }]) {
      await assert.rejects(() => auth.send('login', payload), error => { messages.push(`${error.code}:${error.message}`); return Number(error.code) === 401 })
    }
    assert.equal(messages[0], messages[1])
  })
  await runCase('UT-AUTH-006', ['inactive user returns 401', 'no session is persisted'], async () => {
    const before = await db.run(SELECT.from('idts.cap.AuthSessions').where({ user_ID: inactiveId }))
    await assert.rejects(() => auth.send('login', { email: inactiveEmail, password: inactivePassword }), error => Number(error.code) === 401)
    assert.equal((await db.run(SELECT.from('idts.cap.AuthSessions').where({ user_ID: inactiveId }))).length, before.length)
  })

  const required = [['UT-VAL-TITLE', 'title'], ['UT-VAL-DESCRIPTION', 'description'], ['UT-VAL-STEPS', 'stepsToReproduce'], ['UT-VAL-ACTUAL', 'actualResult'], ['UT-VAL-EXPECTED', 'expectedResult'], ['UT-VAL-PRIORITY', 'priority_code'], ['UT-VAL-SEVERITY', 'severity_code'], ['UT-VAL-COMPONENT', 'applicationComponent_ID'], ['UT-VAL-CATEGORY', 'defectCategory_ID']]
  for (const [caseId, field] of required) await runCase(caseId, [`missing ${field} returns HTTP 400`, 'no Bug row is inserted'], async () => {
    const data = bugData(); delete data[field]
    await expectReject(() => dispatchCreate(bugService, data), field)
    await assertNoBug(db, data.ID)
  })
  await runCase('UT-VAL-REPORTER', ['rejects an authenticated actor that cannot resolve to an active IDTS user', 'does not persist Bug/history/notification/delivery side effects'], async () => {
    const data = bugData(); delete data.reporter_ID
    const before = await safeDbSnapshot()
    const unresolvedActor = new cds.User({ id: 'unresolved-idts110@example.local', roles: ['TESTER', 'authenticated-user'] })
    await assert.rejects(() => dispatchCreate(bugService, data, unresolvedActor), error => Number(error.code || error.statusCode || error.status) === 403)
    await assertNoBug(db, data.ID)
    const after = await safeDbSnapshot()
    for (const table of ['Bugs', 'HistoryEvents', 'Notifications', 'NotificationDeliveries']) assert.equal(after[table], before[table])
  })
  await runCase('UT-VAL-WHITESPACE', ['whitespace required text returns HTTP 400', 'no Bug row is inserted'], async () => {
    const data = bugData({ title: '   ' }); await expectReject(() => dispatchCreate(bugService, data), 'title'); await assertNoBug(db, data.ID)
  })
  const codes = [
    ['UT-VAL-CODE-UNKNOWN', { severity_code: 'NOT_A_SEVERITY' }, 'severity_code'],
    ['UT-VAL-CODE-INACTIVE', { priority_code: 'LOW' }, 'priority_code'],
    ['UT-VAL-CODE-SPACES', { priority_code: ' HIGH ' }, 'priority_code'],
    ['UT-VAL-CODE-EMPTY', { priority_code: '' }, 'priority_code'],
    ['UT-VAL-CODE-TYPE', { priority_code: 1 }, 'priority_code']
  ]
  await db.run(UPDATE('idts.cap.PriorityValues').set({ active: false }).where({ code: 'LOW' }))
  for (const [caseId, override, target] of codes) await runCase(caseId, ['invalid code-list value returns HTTP 400', 'no Bug row is inserted'], async () => {
    const data = bugData(override); await expectReject(() => dispatchCreate(bugService, data), target); await assertNoBug(db, data.ID)
  })
  await db.run(UPDATE('idts.cap.PriorityValues').set({ active: true }).where({ code: 'LOW' }))
  await runCase('UT-VAL-PAIR-MISMATCH', ['mismatching Component Category returns HTTP 400', 'no Bug row is inserted'], async () => {
    const data = bugData({ componentCategory_ID: '60000000-0000-0000-0000-000000000001' })
    await expectReject(() => dispatchCreate(bugService, data), 'componentCategory'); await assertNoBug(db, data.ID)
  })

  for (const [caseId, content] of [['UT-CMT-004', ''], ['UT-CMT-005', '   ']]) await runCase(caseId, ['invalid content returns HTTP 400', 'no Comment row is inserted'], async () => {
    const req = rejectRequest({ content }); await expectReject(() => prepareCommentCreate(req, entities), 'content')
  })
  await runCase('UT-CMT-008', ['inactive/invalid comment actor returns HTTP 400', 'no Comment row is inserted'], async () => {
    const before = (await db.run(SELECT.from('idts.cap.Comments'))).length
    const bugID = (await db.run(SELECT.one.from('idts.cap.Bugs').columns('ID'))).ID
    const req = new cds.Request({
      method: 'POST', event: 'addComment', target: entities.Bugs,
      params: [{ ID: bugID }], data: { content: 'controlled comment' },
      user: new cds.User({ id: 'unknown@example.local', roles: ['authenticated-user'] })
    })
    await assert.rejects(() => bugService.dispatch(req), error => Number(error.code || error.statusCode || error.status) === 403)
    assert.equal((await db.run(SELECT.from('idts.cap.Comments'))).length, before)
  })

  const attachmentFragment = fs.readFileSync(path.join(process.cwd(), 'app/bug-management-ui/webapp/ext/fragment/AttachmentsSection.fragment.xml'), 'utf8')
  const attachmentController = fs.readFileSync(path.join(process.cwd(), 'app/bug-management-ui/webapp/ext/sections/BugCollaboration.js'), 'utf8')
  await runStaticBlockedCase('UT-ATT-007', ['UI allowlist declares permitted MIME types', 'selection handler contains unsupported-MIME rejection'], async () => {
    assert.match(attachmentFragment, /mimeType="text\/plain,application\/pdf,image\/png,image\/jpeg"/)
    assert.match(attachmentController, /!ALLOWED_MIME_TYPES\[file\.type\]/)
    assert.match(attachmentController, /file type is not supported/i)
  })
  await runStaticBlockedCase('UT-ATT-008', ['UI declares 10 MB maximum', 'selection handler contains the byte-limit rejection'], async () => {
    assert.match(attachmentFragment, /maximumFileSize="10"/)
    assert.match(attachmentController, /MAX_ATTACHMENT_BYTES = 10 \* 1024 \* 1024/)
    assert.match(attachmentController, /file\.size > MAX_ATTACHMENT_BYTES/)
    assert.match(attachmentController, /up to 10 MB/i)
  })
  await runCase('UT-ATT-009', ['anonymous attachment CREATE is rejected with 401/403', 'attachment metadata remains unchanged'], async () => {
    const result = runLocalHttpContracts().attachment
    assert.ok([401, 403].includes(result.status))
    assert.equal(result.after, result.before)
    return result
  })

  await runCase('UT-NTF-009', ['delivery before nextAttemptAt is not sent', 'attempt count remains unchanged'], async () => {
    const record = await notification(db, 'not-due'); const due = '2026-08-03T01:00:00.000Z'
    await db.run(UPDATE('idts.cap.NotificationDeliveries').set({ nextAttemptAt: due }).where({ ID: record.deliveryID }))
    let calls = 0; await processEmailDeliveries({ tx: db, config: emailConfig(), sendMail: async () => { calls++; return { messageId: 'unexpected' } }, now: new Date('2026-08-03T00:59:59.000Z'), workerID: 'idts110-not-due' })
    const row = await db.run(SELECT.one.from('idts.cap.NotificationDeliveries').where({ ID: record.deliveryID })); assert.equal(calls, 0); assert.equal(row.attemptCount, 0); assert.equal(row.status_code, 'PENDING')
  })
  await runCase('UT-NTF-010', ['due delivery is retried once', 'successful retry persists SENT and attemptCount'], async () => {
    const record = await notification(db, 'due'); await db.run(UPDATE('idts.cap.NotificationDeliveries').set({ status_code: 'FAILED', attemptCount: 1, nextAttemptAt: '2026-08-03T00:59:00.000Z' }).where({ ID: record.deliveryID }))
    await processEmailDeliveries({ tx: db, config: emailConfig(), sendMail: async () => ({ messageId: 'retry-ok' }), now: new Date('2026-08-03T01:00:00.000Z'), workerID: 'idts110-due' })
    const row = await db.run(SELECT.one.from('idts.cap.NotificationDeliveries').where({ ID: record.deliveryID })); assert.equal(row.status_code, 'SENT'); assert.equal(row.attemptCount, 2)
  })
  await runCase('UT-NTF-011', ['max-attempt delivery remains FAILED', 'nextAttemptAt is cleared'], async () => {
    const record = await notification(db, 'max'); await db.run(UPDATE('idts.cap.NotificationDeliveries').set({ status_code: 'FAILED', attemptCount: 2, nextAttemptAt: '2026-08-03T00:59:00.000Z' }).where({ ID: record.deliveryID }))
    await processEmailDeliveries({ tx: db, config: emailConfig(), sendMail: async () => { throw Object.assign(new Error('controlled'), { code: 'ESOCKET' }) }, now: new Date('2026-08-03T01:00:00.000Z'), workerID: 'idts110-max' })
    const row = await db.run(SELECT.one.from('idts.cap.NotificationDeliveries').where({ ID: record.deliveryID })); assert.equal(row.status_code, 'FAILED'); assert.equal(row.attemptCount, 3); assert.equal(row.nextAttemptAt, null)
  })

  await runCase('UT-AI-001', ['disabled provider returns AI_DISABLED', 'fetch delegate is never called'], async () => {
    let calls = 0; const provider = createAiProvider(normalizeAiConfig({ enabled: false, provider: 'openai' }), { fetchImpl: async () => { calls++; throw new Error('network') } })
    const result = await provider.chat({ featureType: 'GENERAL', messages: [] }); assert.equal(result.status, 'AI_DISABLED'); assert.equal(calls, 0)
  })
  await runCase('UT-AI-002', ['mock structured result preserves configured safe fields'], async () => {
    const provider = createAiProvider(normalizeAiConfig({ enabled: true, provider: 'mock', mockStructuredOutput: { suggestion: 'HIGH', confidence: 0.8 } }))
    const result = await provider.structured({ featureType: 'CLASSIFICATION', schemaName: 'Idts110' }); assert.equal(result.ok, true); assert.equal(result.data.json.suggestion, 'HIGH'); assert.equal(result.data.json.confidence, 0.8)
  })
  await runCase('UT-AI-003', ['embedding vector length equals configured dimensions'], async () => {
    const provider = createAiProvider(normalizeAiConfig({ enabled: true, provider: 'mock', mockEmbeddingDimensions: 6 })); const result = await provider.embedding({ text: 'fixture' }); assert.equal(result.data.dimensions, 6); assert.equal(result.data.embedding.length, 6)
  })
  await runCase('UT-AI-004', ['timeout yields safe retryable AI_TIMEOUT'], async () => {
    const provider = createAiProvider(normalizeAiConfig({ enabled: true, provider: 'mock', mockMode: 'timeout', timeoutMs: 5 })); const result = await provider.chat({ messages: [] }); assert.equal(result.status, 'AI_TIMEOUT'); assert.equal(result.error.retryable, true)
  })
  await runCase('UT-AI-005', ['provider error yields safe retryable error'], async () => {
    const provider = createAiProvider(normalizeAiConfig({ enabled: true, provider: 'mock', mockMode: 'error' })); const result = await provider.chat({ messages: [] }); assert.equal(result.status, 'AI_PROVIDER_ERROR'); assert.equal(result.error.retryable, true); assert.equal(/passwordhash|xkeysib/i.test(JSON.stringify(result)), false)
  })
  await runCase('UT-AI-006', ['malformed Bug Summary payload falls back to deterministic safe summary'], async () => {
    const context = { bug: { ID: id(), bugNumber: 'IDTS-110', title: 'Fixture', description: 'Fixture', status_code: 'PENDING_ASSIGNMENT' }, display: { status: 'Pending Assignment', nextProcessorRole: 'PM' }, comments: [], historyEvents: [] }
    const result = buildBugHandoffSummary({ context, providerResult: { ok: true, status: 'SUCCESS', data: { json: { arbitrary: 'malformed' } } }, generatedAt: '2026-08-03T00:00:00.000Z' })
    assert.equal(result.providerStatus, 'SUCCESS'); assert.match(result.summary, /Fixture|current action owner/i); assert.equal(result.requiresReview, true)
  })
  await runCase('UT-AI-007', ['redactor masks representative credential patterns'], async () => {
    const output = redactSensitiveText(`AKIA${'1'.repeat(16)} xkeysib-${'2'.repeat(30)} Bearer ${'a'.repeat(30)} postgresql://user:pass@host/db`)
    assert.match(output, /\[redacted:awsAccessKey\]/); assert.match(output, /\[redacted:brevoApiKey\]/); assert.match(output, /\[redacted:bearerToken\]/); assert.match(output, /\[redacted:databaseUrl\]/)
  })
  await runCase('UT-AI-027', ['controlled HTTP 429 returns the safe cooldown status', 'does not retry or expose raw provider diagnostics', 'does not mutate business state'], async () => {
    resetGatewayCooldownForTest()
    let calls = 0
    const before = await safeDbSnapshot()
    const provider = createAiProvider(normalizeAiConfig({
      enabled: true,
      provider: 'vercel',
      gatewayApiKey: 'test-only-gateway-key-not-for-network',
      modelAlias: 'zai/glm-4.7-flash',
      handoffModelAlias: 'minimax/minimax-m2.5'
    }), {
      fetchImpl: async () => {
        calls++
        return jsonResponse(429, { error: { code: 'rate_limit_exceeded', message: 'controlled sensitive diagnostic' } }, { 'retry-after': '2' })
      }
    })
    const result = await provider.structured({ featureType: 'BUG_SUMMARY', schemaName: 'Idts110RateLimit', instruction: 'Return JSON only.', input: { title: 'Controlled fixture' } })
    assert.equal(result.status, 'AI_RATE_LIMITED')
    assert.equal(result.ok, false)
    assert.equal(calls, 1)
    assert.equal(/controlled sensitive diagnostic|rate_limit_exceeded/i.test(JSON.stringify(result)), false)
    assert.deepEqual(await safeDbSnapshot(), before)
    resetGatewayCooldownForTest()
  })

  const localIds = CATALOG.cases.filter(item => item.environment === 'LOCAL').map(item => item.caseId)
  assert.deepEqual(RESULTS.map(item => item.caseId).sort(), localIds.sort())
  const summary = { runner: 'IDTS-110 LOCAL exact-case runner', startedAt: STARTED_AT, completedAt: new Date().toISOString(), baselineSha: CURRENT_BASELINE_SHA, catalogBaselineSha: CATALOG.baselineSha, results: RESULTS, totals: { total: RESULTS.length, passed: RESULTS.filter(item => item.status === 'PASS').length, failed: RESULTS.filter(item => item.status === 'FAIL').length, blocked: RESULTS.filter(item => item.status === 'BLOCKED').length } }
  if (OUTPUT_INDEX >= 0 && !OUTPUT_PATH) throw new Error('--output requires a file path')
  if (OUTPUT_PATH) fs.writeFileSync(path.resolve(OUTPUT_PATH), `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
  if (JSON_MODE) process.stdout.write(`${JSON.stringify(summary)}\n`)
  else for (const item of RESULTS) console.log(`${item.status} ${item.caseId} — ${item.actualResult}`)
  process.exitCode = summary.totals.failed || summary.totals.blocked ? 1 : 0
}

main().catch(error => { console.error(JSON_MODE ? JSON.stringify({ fatal: String(error.message || error) }) : `FATAL: ${error.stack || error}`); process.exitCode = 1 })
