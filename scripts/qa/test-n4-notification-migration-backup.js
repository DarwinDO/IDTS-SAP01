'use strict'

const assert = require('node:assert/strict')
const { generateKeyPairSync } = require('node:crypto')

const {
  DATASETS,
  canonicalizeNotificationBackup,
  decryptNotificationBackup,
  encryptNotificationBackup
} = require('../btp/n4-notification-migration-backup-contract')
const {
  runNotificationBackupRehearsal
} = require('../btp/run-n4-notification-migration-backup')

const notification = {
  ID: '10000000-0000-0000-0000-000000000001',
  createdAt: '2026-08-01T00:00:00.000Z',
  createdBy: 'system',
  modifiedAt: '2026-08-02T00:00:00.000Z',
  modifiedBy: 'system',
  bug_ID: '20000000-0000-0000-0000-000000000001',
  recipient_ID: '30000000-0000-0000-0000-000000000001',
  eventType_code: 'ASSIGNED',
  channel_code: 'EMAIL',
  deliveryStatus_code: 'SENT',
  message: 'private notification content',
  sentAt: '2026-08-02T01:00:00.000Z'
}
const eventType = {
  code: 'ASSIGNED',
  name: 'Assigned',
  descr: 'Bug was assigned to a developer',
  sortOrder: 10,
  active: true,
  criticality: 1
}
const rows = { notifications: [notification], eventTypes: [eventType] }

assert.deepEqual(DATASETS.map(({ key }) => key), ['notifications', 'eventTypes'])
const canonical = canonicalizeNotificationBackup(rows)
assert.equal(canonical.totalRowCount, 2)
assert.deepEqual(canonical.counts, { notifications: 1, eventTypes: 1 })
assert.match(canonical.sha256, /^[a-f0-9]{64}$/)
assert.throws(
  () => canonicalizeNotificationBackup({ ...rows, notifications: [{ ...notification, sourceKey: null }] }),
  /exact notification backup column contract/i
)
assert.throws(() => canonicalizeNotificationBackup({ ...rows, eventTypes: [] }), /non-empty/i)

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 3072,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
})
const envelope = encryptNotificationBackup(rows, publicKey)
assert.equal(JSON.stringify(envelope).includes(notification.message), false)
assert.equal(decryptNotificationBackup(envelope, privateKey).sha256, canonical.sha256)
assert.throws(
  () => decryptNotificationBackup({ ...envelope, tag: Buffer.alloc(16).toString('base64') }, privateKey)
)

function fakeDb (source = rows, restored = rows) {
  const calls = []
  return {
    calls,
    async run (sql, parameters = []) {
      calls.push({ sql, parameters })
      const dataset = DATASETS.find(({ table, tempTable }) => sql.includes(table) || sql.includes(tempTable))
      if (/^SELECT/i.test(sql.trim()) && dataset) {
        return sql.includes(dataset.tempTable) ? restored[dataset.key] : source[dataset.key]
      }
      return []
    }
  }
}

;(async () => {
  const emitted = []
  const db = fakeDb()
  const result = await runNotificationBackupRehearsal({ db, publicKey, emit: line => emitted.push(line) })
  assert.equal(result.totalRowCount, 2)
  assert.deepEqual(result.counts, canonical.counts)
  assert.equal(emitted.length, 2)
  assert.match(emitted[0], /^IDTS_N4_BACKUP_META=/)
  assert.match(emitted[1], /^IDTS_N4_BACKUP_ENVELOPE=/)
  assert.equal(emitted.join('\n').includes(notification.message), false)
  assert.equal(db.calls.filter(({ sql }) => /^CREATE LOCAL TEMPORARY COLUMN TABLE/i.test(sql)).length, 2)
  assert.equal(db.calls.filter(({ sql }) => /^INSERT INTO/i.test(sql)).length, 2)

  await assert.rejects(
    runNotificationBackupRehearsal({
      db: fakeDb(rows, { ...rows, notifications: [{ ...notification, message: 'changed' }] }),
      publicKey,
      emit: () => {}
    }),
    /restore rehearsal mismatch/i
  )

  console.log('N4 notification migration logical backup: PASS')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
