'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const cds = require('@sap/cds')

const ENTITY = 'idts.cap.UserAccessNotificationDeliveries'

async function main () {
  const model = await cds.load('db/schema.cds')
  const delivery = model.definitions[ENTITY]

  assert.ok(delivery, `${ENTITY} exists`)
  assert.equal(delivery.elements.ID?.key, true, 'access delivery has a cuid key')
  for (const field of ['createdAt', 'createdBy', 'modifiedAt', 'modifiedBy']) {
    assert.ok(delivery.elements[field], `access delivery has managed field ${field}`)
  }

  const expected = {
    sourceAuditEvent: ['idts.cap.UserIdentityAuditEvents', true],
    targetUser: ['idts.cap.Users', true],
    recipientEmail: ['cds.String', true, 255],
    eventType: ['cds.String', true, 40],
    templateKey: ['cds.String', true, 80],
    subject: ['cds.String', true, 255],
    textBody: ['cds.LargeString', true],
    htmlBody: ['cds.LargeString', true],
    status: ['idts.cap.NotificationDeliveryStatuses', true],
    attemptCount: ['cds.Integer', true],
    nextAttemptAt: ['cds.Timestamp', false],
    lastAttemptAt: ['cds.Timestamp', false],
    sentAt: ['cds.Timestamp', false],
    lastErrorCode: ['cds.String', false, 80],
    lastErrorSummary: ['cds.String', false, 500],
    providerMessageId: ['cds.String', false, 255],
    lockedUntil: ['cds.Timestamp', false],
    lockToken: ['cds.String', false, 64]
  }

  for (const [name, [typeOrTarget, notNull, length]] of Object.entries(expected)) {
    const element = delivery.elements[name]
    assert.ok(element, `access delivery field ${name} exists`)
    assert.equal(element.target || element.type, typeOrTarget, `access delivery field ${name} type`)
    assert.equal(element.notNull === true, notNull, `access delivery field ${name} nullability`)
    if (length !== undefined) assert.equal(element.length, length, `access delivery field ${name} length`)
  }
  assert.equal(delivery.elements.attemptCount.default?.val, 0, 'attempt count defaults to zero')

  const unique = delivery['@assert.unique.accessAuditDelivery']
  assert.deepEqual(unique?.map(item => item['=']), ['sourceAuditEvent'], 'source audit event is unique')

  const bugDelivery = model.definitions['idts.cap.NotificationDeliveries']
  assert.deepEqual(
    bugDelivery['@assert.unique.notificationChannel']?.map(item => item['=']),
    ['notification', 'channel'],
    'Bug delivery uniqueness remains unchanged'
  )
  const onboardingDelivery = model.definitions['idts.cap.UserOnboardingDeliveries']
  assert.deepEqual(
    onboardingDelivery['@assert.unique.onboardingRequestDelivery']?.map(item => item['=']),
    ['onboardingRequest'],
    'onboarding delivery uniqueness remains unchanged'
  )

  console.log('IDTS user access notification contract: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(() => cds.shutdown())
