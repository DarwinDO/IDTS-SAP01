'use strict'

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

  console.log('IDTS My Notifications model contract: PASS')
}

function uniqueFields (definition, name) {
  return definition[`@assert.unique.${name}`]?.map(item => item['='])
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(() => cds.shutdown())
