'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')
const { SELECT } = cds.ql

const {
  processEmailOutboxBatch,
  scheduleImmediateEmailOutbox,
  writeNotificationAndSchedule
} = require('../../srv/email/worker')
const {
  formatAtomicMarker,
  readAtomicOptions,
  runAtomicCase,
  runAtomicUnavailableCase
} = require('./idts110-atomic-runner')

function readDefinition (caseKey) {
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../../docs/qa/idts-110-unit-test-catalog.json'), 'utf8'))
  const definition = catalog.cases.find(row => row.caseId === caseKey)
  if (!definition) throw new Error(`Unknown IDTS-110 case ${caseKey}`)
  return definition
}

function fakeRequest () {
  const handlers = new Map()
  return {
    on (event, handler) {
      const registered = handlers.get(event) || []
      registered.push(handler)
      handlers.set(event, registered)
    },
    async emit (event) {
      for (const handler of handlers.get(event) || []) await handler()
    },
    handlerCount (event) {
      return (handlers.get(event) || []).length
    }
  }
}

function waitForDetachedWork () {
  return new Promise(resolve => setImmediate(resolve))
}

async function createAtomicKickFixture () {
  const csn = await cds.load(['db/schema.cds', 'srv/service.cds'])
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const bug = await db.run(SELECT.one.from('idts.cap.Bugs').columns('ID'))
  const recipient = await db.run(SELECT.one.from('idts.cap.Users').columns('ID').where({ active: true }))
  assert.ok(bug?.ID, 'atomic kick fixture has an active Bug')
  assert.ok(recipient?.ID, 'atomic kick fixture has an active recipient')
  return {
    db,
    bugID: bug.ID,
    recipientID: recipient.ID,
    config: {
      enabled: true,
      ready: true,
      baseUrl: 'https://idts.example.invalid',
      fromAddress: 'no-reply@example.invalid',
      fromName: 'IDTS Atomic',
      batchSize: 10,
      maxRetryCount: 1,
      pollIntervalMs: 15000
    },
    restore: async () => {
      if (typeof db.disconnect === 'function') await db.disconnect()
    }
  }
}

async function readAtomicKickState (db, sourceKey) {
  const notifications = await db.run(SELECT.from('idts.cap.Notifications').columns('ID', 'sourceKey').where({ sourceKey }))
  const deliveries = notifications.length
    ? await db.run(SELECT.from('idts.cap.NotificationDeliveries').columns('ID', 'notification_ID', 'status_code', 'attemptCount').where({ notification_ID: { in: notifications.map(row => row.ID) } }))
    : []
  return {
    notificationRows: notifications.length,
    notificationIDs: notifications.map(row => row.ID),
    sourceKeys: notifications.map(row => row.sourceKey),
    deliveryRows: deliveries.length,
    deliveryIDs: deliveries.map(row => row.ID),
    deliveryStatuses: deliveries.map(row => row.status_code),
    deliveryAttempts: deliveries.map(row => Number(row.attemptCount || 0))
  }
}

async function runAtomicImmediateKickCase (caseKey) {
  const fixture = await createAtomicKickFixture()
  try {
    const sourceKey = `ATOMIC_KICK:${caseKey}`
    const request = fakeRequest()
    const counters = { spawn: 0, batch: 0, provider: 0, detachedTransactions: 0 }
    const scheduleResults = []
    const dependencies = {
      spawn (options, task) {
        counters.spawn += 1
        assert.equal(options.user, cds.User.privileged)
        const job = new EventEmitter()
        Promise.resolve()
          .then(() => fixture.db.tx(async tx => {
            counters.detachedTransactions += 1
            return task(tx)
          }))
          .then(result => job.emit('succeeded', result))
          .catch(error => job.emit('failed', error))
        return job
      },
      async processBatch (input) {
        counters.batch += 1
        assert.ok(input.tx, 'post-commit kick receives an isolated CAP transaction')
        return { sent: 0, failed: 0, skipped: 0 }
      }
    }
    const schedule = receivedRequest => {
      const registered = scheduleImmediateEmailOutbox(receivedRequest, dependencies)
      scheduleResults.push(registered ? 'REGISTERED' : 'DUPLICATE_IGNORED')
      return registered
    }
    const entry = {
      bugID: fixture.bugID,
      recipientID: fixture.recipientID,
      eventType: 'ASSIGNED',
      message: 'Atomic post-commit kick fixture.',
      sourceKey
    }
    const beforeDbState = await readAtomicKickState(fixture.db, sourceKey)
    const beforeState = { ...beforeDbState, spawnCount: counters.spawn, batchCount: counters.batch, providerCalls: counters.provider }

    if (caseKey === 'IDTS110-F246') {
      const pending = await fixture.db.tx(tx => writeNotificationAndSchedule(request, entry, { tx, config: fixture.config, schedule }))
      assert.equal(pending.deliveryStatus, 'PENDING')
      const pendingState = await readAtomicKickState(fixture.db, sourceKey)
      assert.equal(pendingState.notificationRows, 1)
      assert.equal(pendingState.deliveryRows, 1)
      assert.deepEqual(pendingState.deliveryStatuses, ['PENDING'])
      assert.deepEqual(scheduleResults, ['REGISTERED'])
      assert.equal(counters.spawn, 0, 'the kick waits for request commit')
      await request.emit('succeeded')
      await waitForDetachedWork()
      await waitForDetachedWork()
      assert.equal(counters.spawn, 1)
      assert.equal(counters.batch, 1)
      assert.equal(counters.detachedTransactions, 1)
      assert.equal(counters.provider, 0)
      const afterDbState = await readAtomicKickState(fixture.db, sourceKey)
      const afterState = { ...afterDbState, writePath: 'writeNotificationAndSchedule', pendingDeliveryRows: afterDbState.deliveryStatuses.filter(status => status === 'PENDING').length, kickCount: counters.batch, spawnCount: counters.spawn, providerCalls: counters.provider }
      assert.equal(afterState.pendingDeliveryRows, 1)
      const reloadState = await readAtomicKickState(fixture.db, sourceKey)
      assert.deepEqual(reloadState, afterDbState)
      return { beforeState, afterState, reloadState }
    }

    if (caseKey === 'IDTS110-F246R') {
      const first = await fixture.db.tx(tx => writeNotificationAndSchedule(request, entry, { tx, config: fixture.config, schedule }))
      const second = await fixture.db.tx(tx => writeNotificationAndSchedule(request, entry, { tx, config: fixture.config, schedule }))
      assert.equal(first.deliveryStatus, 'PENDING')
      assert.equal(second.deliveryStatus, 'PENDING')
      assert.equal(second.deliveryID, first.deliveryID)
      const pendingState = await readAtomicKickState(fixture.db, sourceKey)
      assert.equal(pendingState.notificationRows, 1)
      assert.equal(pendingState.deliveryRows, 1)
      assert.deepEqual(pendingState.deliveryStatuses, ['PENDING'])
      assert.deepEqual(scheduleResults, ['REGISTERED', 'DUPLICATE_IGNORED'])
      assert.equal(request.handlerCount('succeeded'), 1)
      await request.emit('succeeded')
      await waitForDetachedWork()
      await waitForDetachedWork()
      assert.equal(counters.spawn, 1)
      assert.equal(counters.batch, 1)
      assert.equal(counters.provider, 0)
      const afterDbState = await readAtomicKickState(fixture.db, sourceKey)
      const afterState = { ...afterDbState, writePath: 'writeNotificationAndSchedule', scheduleResults, deliveryRows: afterDbState.deliveryRows, kickCount: counters.batch, providerCalls: counters.provider }
      const reloadState = await readAtomicKickState(fixture.db, sourceKey)
      assert.deepEqual(reloadState, afterDbState)
      return { beforeState, afterState, reloadState }
    }

    if (caseKey === 'IDTS110-F246B') {
      await assert.rejects(fixture.db.tx(async tx => {
        const pending = await writeNotificationAndSchedule(request, entry, { tx, config: fixture.config, schedule })
        assert.equal(pending.deliveryStatus, 'PENDING')
        throw new Error('ATOMIC_KICK_ROLLBACK')
      }), /ATOMIC_KICK_ROLLBACK/)
      const rolledBackState = await readAtomicKickState(fixture.db, sourceKey)
      assert.equal(rolledBackState.notificationRows, 0)
      assert.equal(rolledBackState.deliveryRows, 0)
      await request.emit('failed')
      await waitForDetachedWork()
      assert.equal(counters.spawn, 0)
      assert.equal(counters.batch, 0)
      assert.equal(counters.provider, 0)
      const afterState = { ...rolledBackState, writePath: 'writeNotificationAndSchedule', rolledBack: true, providerCalls: counters.provider, kickCount: counters.batch, scheduleResults }
      const reloadState = await readAtomicKickState(fixture.db, sourceKey)
      assert.deepEqual(reloadState, rolledBackState)
      return { beforeState, afterState, reloadState }
    }

    throw new Error(`Unknown IDTS-110 case ${caseKey}`)
  } finally {
    await fixture.restore()
  }
}

async function runAtomicSelector (options) {
  const supported = new Set(['IDTS110-F246', 'IDTS110-F246R', 'IDTS110-F246B'])
  if (!supported.has(options.caseKey)) {
    await runAtomicUnavailableCase({ ...options, plannedTestFile: 'scripts/qa/test-email-immediate-kick.js' })
    return
  }
  const definition = readDefinition(options.caseKey)
  const result = await runAtomicCase({
    definition,
    assertionId: `${options.caseKey}-A1`,
    baselineSha: options.baselineSha,
    executor: options.executor,
    execute: async () => ({
      ...(await runAtomicImmediateKickCase(options.caseKey)),
      assertionPassed: true,
      actualResult: definition.expectedResult,
      evidenceIds: [`${options.caseKey}-RESULT`]
    })
  })
  console.log(formatAtomicMarker(result))
  process.exitCode = result.status === 'PASS' ? 0 : 1
}

async function main () {
  const options = readAtomicOptions()
  if (options.caseKey) {
    await runAtomicSelector(options)
    return
  }
  assert.equal(typeof scheduleImmediateEmailOutbox, 'function', 'immediate kick API is exported')

  let spawnCount = 0
  let batchCount = 0
  const tx = { source: 'immediate-kick-test' }
  const dependencies = {
    spawn (options, task) {
      spawnCount += 1
      assert.equal(options.user, cds.User.privileged)
      const job = new EventEmitter()
      Promise.resolve()
        .then(() => task(tx))
        .then(result => job.emit('succeeded', result))
        .catch(error => job.emit('failed', error))
      return job
    },
    async processBatch (input) {
      batchCount += 1
      assert.equal(input.tx, tx)
      return { sent: 1, failed: 0, skipped: 0 }
    }
  }

  const committedRequest = fakeRequest()
  assert.equal(scheduleImmediateEmailOutbox(committedRequest, dependencies), true)
  assert.equal(scheduleImmediateEmailOutbox(committedRequest, dependencies), false, 'one request registers only one kick')
  assert.equal(committedRequest.handlerCount('succeeded'), 1)
  assert.equal(spawnCount, 0, 'provider work never starts before commit succeeds')

  await committedRequest.emit('succeeded')
  await waitForDetachedWork()
  assert.equal(spawnCount, 1)
  assert.equal(batchCount, 1)

  const rolledBackRequest = fakeRequest()
  assert.equal(scheduleImmediateEmailOutbox(rolledBackRequest, dependencies), true)
  await rolledBackRequest.emit('failed')
  await waitForDetachedWork()
  assert.equal(spawnCount, 1, 'failed requests never kick the outbox')

  const previousMode = process.env.IDTS_EMAIL_WORKER_MODE
  process.env.IDTS_EMAIL_WORKER_MODE = 'scheduler'
  const schedulerRequest = fakeRequest()
  assert.equal(scheduleImmediateEmailOutbox(schedulerRequest, dependencies), true)
  await schedulerRequest.emit('succeeded')
  await waitForDetachedWork()
  assert.equal(spawnCount, 2, 'scheduler mode keeps immediate one-shot delivery enabled')
  assert.equal(batchCount, 2)
  if (previousMode === undefined) delete process.env.IDTS_EMAIL_WORKER_MODE
  else process.env.IDTS_EMAIL_WORKER_MODE = previousMode

  assert.equal(scheduleImmediateEmailOutbox(null, dependencies), false)
  assert.equal(scheduleImmediateEmailOutbox({}, dependencies), false)

  const defaultSpawnRequest = fakeRequest()
  let defaultSpawnBatchCount = 0
  assert.equal(scheduleImmediateEmailOutbox(defaultSpawnRequest, {
    async processBatch ({ tx: detachedTx }) {
      assert.ok(detachedTx, 'CAP supplies the detached transaction')
      defaultSpawnBatchCount += 1
      return { sent: 0, failed: 0, skipped: 0 }
    }
  }), true)
  await defaultSpawnRequest.emit('succeeded')
  await waitForDetachedWork()
  await waitForDetachedWork()
  assert.equal(defaultSpawnBatchCount, 1, 'the default cds.spawn keeps its CAP receiver')

  assert.equal(typeof writeNotificationAndSchedule, 'function', 'notification orchestration API is exported')
  let writeCount = 0
  let scheduleCount = 0
  const orchestrationRequest = fakeRequest()
  const pendingResult = await writeNotificationAndSchedule(orchestrationRequest, {
    bugID: 'bug-pending',
    recipientID: 'recipient-pending',
    eventType: 'ASSIGNED',
    message: 'Pending delivery.'
  }, {
    tx,
    config: { enabled: true, ready: true },
    async writeRecord (receivedTx, entry, config) {
      writeCount += 1
      assert.equal(receivedTx, tx)
      assert.equal(entry.bugID, 'bug-pending')
      assert.equal(config.ready, true)
      return { notificationID: 'notification-pending', deliveryID: 'delivery-pending', deliveryStatus: 'PENDING' }
    },
    schedule (receivedReq) {
      scheduleCount += 1
      assert.equal(receivedReq, orchestrationRequest)
      return true
    }
  })
  assert.equal(pendingResult.deliveryStatus, 'PENDING')
  assert.equal(writeCount, 1)
  assert.equal(scheduleCount, 1)

  const skippedResult = await writeNotificationAndSchedule(fakeRequest(), {
    bugID: 'bug-skipped',
    recipientID: 'recipient-skipped',
    eventType: 'UPDATED',
    message: 'Skipped delivery.'
  }, {
    tx,
    config: { enabled: false, ready: false },
    async writeRecord () {
      writeCount += 1
      return { notificationID: 'notification-skipped', deliveryID: 'delivery-skipped', deliveryStatus: 'SKIPPED' }
    },
    schedule () {
      scheduleCount += 1
      return true
    }
  })
  assert.equal(skippedResult.deliveryStatus, 'SKIPPED')
  assert.equal(writeCount, 2)
  assert.equal(scheduleCount, 1, 'SKIPPED delivery never registers an immediate kick')

  const sharedCalls = []
  let senderCreates = 0
  let senderCloses = 0
  const combined = await processEmailOutboxBatch({
    tx,
    dependencies: {
      emailConfig: { enabled: true, ready: true },
      invitationConfig: { ready: true },
      createSender () {
        senderCreates += 1
        return {
          sendMail: async () => ({}),
          close () { senderCloses += 1 }
        }
      },
      async processNotifications (input) {
        sharedCalls.push(input)
        return { sent: 2, failed: 1, skipped: 0 }
      },
      async processInvitations (input) {
        sharedCalls.push(input)
        return { sent: 1, failed: 0, skipped: 1 }
      },
      async processAccess (input) {
        sharedCalls.push(input)
        return { sent: 4, failed: 2, skipped: 3 }
      },
      async processDigests (input) {
        sharedCalls.push(input)
        return { sent: 0, failed: 0, skipped: 0 }
      }
    }
  })
  assert.deepEqual(combined, { sent: 7, failed: 3, skipped: 4 })
  assert.equal(senderCreates, 1, 'one batch creates one sender')
  assert.equal(senderCloses, 1, 'one successful batch closes its sender once')
  assert.equal(sharedCalls.length, 4, 'one batch processes Bug, invitation, access, and digest deliveries once')
  for (const input of sharedCalls) {
    assert.equal(input.tx, tx, 'all processors share the batch transaction')
    assert.equal(input.sendMail, sharedCalls[0].sendMail, 'all processors share one sender')
  }
  assert.equal(sharedCalls[0].config.ready, true)
  assert.equal(sharedCalls[1].emailConfig.ready, true)
  assert.equal(sharedCalls[1].invitationConfig.ready, true)
  assert.equal(sharedCalls[2].config.ready, true)

  const missingInvitationCalls = []
  const missingInvitation = await processEmailOutboxBatch({
    tx,
    dependencies: {
      emailConfig: { enabled: true, ready: true },
      invitationConfig: { ready: false },
      createSender: () => ({ sendMail: async () => ({}), close () {} }),
      async processNotifications () {
        missingInvitationCalls.push('bug')
        return { sent: 1, failed: 0, skipped: 0 }
      },
      async processInvitations () {
        missingInvitationCalls.push('invitation')
        return { sent: 0, failed: 0, skipped: 0 }
      },
      async processAccess () {
        missingInvitationCalls.push('access')
        return { sent: 0, failed: 1, skipped: 0 }
      },
      async processDigests () {
        missingInvitationCalls.push('digest')
        return { sent: 0, failed: 0, skipped: 0 }
      }
    }
  })
  assert.deepEqual(missingInvitation, { sent: 1, failed: 1, skipped: 0 })
  assert.deepEqual(missingInvitationCalls, ['bug', 'access', 'digest'], 'missing invitation config never skips Bug, access, or digest processing')

  let failureCloses = 0
  await assert.rejects(processEmailOutboxBatch({
    tx,
    dependencies: {
      emailConfig: { enabled: true, ready: true },
      invitationConfig: { ready: true },
      createSender: () => ({ sendMail: async () => ({}), close () { failureCloses += 1 } }),
      async processNotifications () { throw new Error('controlled processor failure') },
      async processInvitations () { throw new Error('must not run after Bug failure') },
      async processAccess () { throw new Error('must not run after Bug failure') }
    }
  }), /controlled processor failure/)
  assert.equal(failureCloses, 1, 'one failed batch closes its sender once')

  const historySource = fs.readFileSync(path.join(__dirname, '../../srv/bug-service/history.js'), 'utf8')
  const actionsSource = fs.readFileSync(path.join(__dirname, '../../srv/bug-service/actions.js'), 'utf8')
  assert.match(historySource, /writeNotificationAndSchedule\(req,/)
  assert.match(actionsSource, /writeNotificationAndSchedule\(req,/)
  assert.doesNotMatch(historySource, /writeNotificationRecord\(cds\.tx\(req\)/)
  assert.doesNotMatch(actionsSource, /writeNotificationRecord\((?:cds\.tx\(req\)|tx)/)

  console.log('IDTS immediate email outbox kick checks: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
