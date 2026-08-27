'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const cds = require('@sap/cds')

const FORBIDDEN_FIELDS = [
  'dismissedAt',
  'snoozedUntil',
  'preference',
  'pushToken',
  'recipientEmail',
  'providerMessageId',
  'lockToken'
]

async function main () {
  const model = await cds.load('db/schema.cds')
  const definitions = model.definitions
  const notifications = definitions['idts.cap.Notifications']
  const inbox = definitions['idts.cap.UserNotificationInboxEntries']
  const digests = definitions['idts.cap.NotificationDigestDeliveries']

  const services = await cds.load('srv')
  assert.equal(services.definitions['BugService.Notifications'].elements.sourceKey, undefined,
    'private producer idempotency keys must not be published through BugService')

  assert.ok(inbox, 'personal notification inbox entity exists')
  assert.ok(digests, 'notification digest delivery entity exists')
  assert.equal(notifications.elements.sourceKey.type, 'cds.String')
  assert.equal(notifications.elements.sourceKey.length, 255)
  assert.equal(inbox.elements.readAt.type, 'cds.Timestamp')

  assert.deepEqual(uniqueFields(notifications, 'notificationSourceKey'), ['sourceKey'])
  assert.deepEqual(uniqueFields(inbox, 'inboxBugSource'), ['bugNotification'])
  assert.deepEqual(uniqueFields(inbox, 'inboxAccessSource'), ['accessAuditEvent'])
  assert.deepEqual(
    uniqueFields(digests, 'digestRecipientDateType'),
    ['recipient', 'businessDate', 'digestType']
  )

  for (const field of FORBIDDEN_FIELDS) {
    assert.equal(inbox.elements[field], undefined, `inbox does not persist ${field}`)
  }

  const db = await cds.deploy('db').to('sqlite::memory:')
  const { INSERT } = cds.ql
  const base = { bug_ID: '90000000-0000-0000-0000-000000000001', recipient_ID: '10000000-0000-0000-0000-000000000001', eventType_code: 'UPDATED', deliveryStatus_code: 'SENT' }
  const source = 'f1000000-0000-4000-8000-000000000001'
  await db.run(INSERT.into('idts.cap.Notifications').entries({ ...base, ID: source, sourceKey: 'N1_UNIQUE_TEST' }))
  await assert.rejects(db.run(INSERT.into('idts.cap.Notifications').entries({ ...base, ID: cds.utils.uuid(), sourceKey: 'N1_UNIQUE_TEST' })), /unique/i)
  await db.run(INSERT.into('idts.cap.Notifications').entries([
    { ...base, ID: cds.utils.uuid(), sourceKey: null }, { ...base, ID: cds.utils.uuid(), sourceKey: null }
  ]))
  const occurredAt = '2026-08-27T00:00:00.000Z'
  const entry = { recipient_ID: base.recipient_ID, bugNotification_ID: source, occurredAt }
  await db.run(INSERT.into('idts.cap.UserNotificationInboxEntries').entries({ ...entry, ID: cds.utils.uuid() }))
  await assert.rejects(db.run(INSERT.into('idts.cap.UserNotificationInboxEntries').entries({ ...entry, ID: cds.utils.uuid() })), /unique/i)
  const audit = cds.utils.uuid()
  await db.run(INSERT.into('idts.cap.UserIdentityAuditEvents').entries({ ID: audit, targetUser_ID: base.recipient_ID, action: 'CHANGE_ROLE', result: 'APPLIED', correlationId: cds.utils.uuid() }))
  const accessEntry = { recipient_ID: base.recipient_ID, accessAuditEvent_ID: audit, occurredAt }
  await db.run(INSERT.into('idts.cap.UserNotificationInboxEntries').entries({ ...accessEntry, ID: cds.utils.uuid() }))
  await assert.rejects(db.run(INSERT.into('idts.cap.UserNotificationInboxEntries').entries({ ...accessEntry, ID: cds.utils.uuid() })), /unique/i)
  const digest = { recipient_ID: base.recipient_ID, businessDate: '2026-08-27', digestType: 'DAILY', windowStart: occurredAt, windowEnd: occurredAt, snapshotAt: occurredAt, itemCount: 1, subject: 'Test digest', textBody: 'Test only', htmlBody: '<p>Test only</p>', status_code: 'PENDING' }
  await db.run(INSERT.into('idts.cap.NotificationDigestDeliveries').entries({ ...digest, ID: cds.utils.uuid() }))
  await assert.rejects(db.run(INSERT.into('idts.cap.NotificationDigestDeliveries').entries({ ...digest, ID: cds.utils.uuid() })), /unique/i)

  console.log('IDTS My Notifications model contract: PASS')
}

function uniqueFields (definition, name) {
  return definition[`@assert.unique.${name}`]?.map(item => item['='])
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(() => cds.shutdown())
