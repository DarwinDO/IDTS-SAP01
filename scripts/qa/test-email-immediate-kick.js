'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')

const {
  processEmailOutboxBatch,
  scheduleImmediateEmailOutbox,
  writeNotificationAndSchedule
} = require('../../srv/email/worker')

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

async function main () {
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

  const combined = await processEmailOutboxBatch({
    tx,
    dependencies: {
      emailConfig: { enabled: true, ready: true },
      invitationConfig: { ready: true },
      createSender () {
        return { sendMail: async () => ({}), close () {} }
      },
      async processNotifications () {
        return { sent: 2, failed: 1, skipped: 0 }
      },
      async processInvitations () {
        return { sent: 1, failed: 0, skipped: 1 }
      }
    }
  })
  assert.deepEqual(combined, { sent: 3, failed: 1, skipped: 1 })

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
