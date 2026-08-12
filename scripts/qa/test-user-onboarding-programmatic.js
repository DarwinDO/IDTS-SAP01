'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'
process.env.IDTS_EMAIL_ENABLED = 'false'

const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql

const {
  createInvitationToken,
  invitationIDFromToken
} = require('../../srv/user-admin/invitations')
const { identityKeyHash } = require('../../srv/auth/identity-map')
const { processUserOnboardingDeliveries } = require('../../srv/user-admin/delivery')

const SIGNING_KEY = 'local-programmatic-invitation-signing-key-123456789'
const PM_ID = '71000000-0000-4000-8000-000000000001'

async function expectRejected (operation, status, code) {
  await assert.rejects(operation, error => Number(error?.status || error?.statusCode) === status && error?.code === code)
}

async function main () {
  cds.env.idts = cds.env.idts || {}
  cds.env.idts.userAdmin = {
    invitationSigningKey: SIGNING_KEY,
    invitationTtlMinutes: 60,
    invitationBaseUrl: 'https://idts.example.invalid/onboarding/continue'
  }

  const db = await cds.deploy('db').to('sqlite::memory:')
  cds.db = db
  let immediateSpawnCount = 0
  const originalSpawn = cds.spawn
  cds.spawn = (_options, task) => {
    immediateSpawnCount += 1
    const job = new EventEmitter()
    Promise.resolve(task(db))
      .then(result => job.emit('succeeded', result))
      .catch(error => job.emit('failed', error))
    return job
  }
  await db.run(INSERT.into('idts.cap.Users').entries({
    ID: PM_ID,
    displayName: 'Controlled PM',
    email: 'pm@example.invalid',
    role_code: 'PM',
    active: true
  }))

  const service = await cds.serve('UserAdministrationService').from('srv/user-admin.cds')
  const administrator = new cds.User({
    id: 'pm@example.invalid',
    roles: ['authenticated-user', 'PM', 'UserAdmin']
  })

  const created = await service.send({
    event: 'requestOnboarding',
    data: {
      email: 'Controlled.Test@Example.invalid',
      requestedRole: 'TESTER',
      userAdminRequested: false
    },
    user: administrator
  })
  assert.equal(created.targetEmail, 'controlled.test@example.invalid')
  assert.equal(created.requestedRole, 'TESTER')
  assert.equal(created.status, 'INVITED')
  assert.equal(created.userAdminRequested, false)
  assert.equal('token' in created, false)
  assert.equal('tokenHash' in created, false)
  assert.equal('tokenNonce' in created, false)
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(immediateSpawnCount, 1)

  const searchResults = await service.send({
    event: 'searchOnboarding',
    data: { query: 'CONTROLLED.TEST' },
    user: administrator
  })
  assert.equal(searchResults.length, 1)
  assert.equal(searchResults[0].targetEmailNormalized, 'controlled.test@example.invalid')
  assert.equal(searchResults[0].requestedRole_code, 'TESTER')
  assert.equal(searchResults[0].status_code, 'INVITED')
  assert.equal('identitySubject' in searchResults[0], false)
  assert.equal('identityIssuer' in searchResults[0], false)

  await expectRejected(service.send({
    event: 'searchOnboarding',
    data: { query: 'controlled.test' },
    user: new cds.User({ id: 'pm@example.invalid', roles: ['authenticated-user', 'PM'] })
  }), 403, 'USER_ADMIN_REQUIRED')

  await expectRejected(service.send({
    event: 'READ',
    query: SELECT.from(service.entities.OnboardingRequests),
    user: new cds.User({ id: 'pm@example.invalid', roles: ['authenticated-user', 'PM'] })
  }), 403, 'USER_ADMIN_REQUIRED')

  await db.run(UPDATE('idts.cap.Users').set({ active: false }).where({ ID: PM_ID }))
  await expectRejected(service.send({
    event: 'READ',
    query: SELECT.from(service.entities.OnboardingRequests),
    user: administrator
  }), 403, 'USER_ADMIN_REQUIRED')
  await db.run(UPDATE('idts.cap.Users').set({ active: true }).where({ ID: PM_ID }))

  const serviceContract = require('node:fs').readFileSync(require('node:path').join(__dirname, '../../srv/user-admin.cds'), 'utf8')
  assert.doesNotMatch(serviceContract, /\btokenHash\b|\btokenNonce\b|\bidentityIssuer\b/)
  assert.match(serviceContract, /verifySapIdentity\(token\s*:\s*String\(2048\)\)/)
  assert.match(serviceContract, /searchOnboarding\(query\s*:\s*String\(255\)\)/)

  const persisted = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: created.ID }))
  assert.equal(persisted.targetEmailNormalized, 'controlled.test@example.invalid')
  assert.equal(persisted.requestedRole_code, 'TESTER')
  assert.equal(persisted.requestedBy_ID, PM_ID)
  assert.equal(persisted.status_code, 'INVITED')
  assert.equal(persisted.tokenHash.length, 64)

  const delivery = await db.run(SELECT.one.from('idts.cap.UserOnboardingDeliveries').where({ onboardingRequest_ID: created.ID }))
  assert.equal(delivery.status_code, 'PENDING')
  assert.equal(delivery.recipientEmail, 'controlled.test@example.invalid')
  assert.equal(delivery.attemptCount, 0)

  const sentMessages = []
  const sendResult = await processUserOnboardingDeliveries({
    tx: db,
    emailConfig: {
      ready: true,
      batchSize: 10,
      maxRetryCount: 2,
      pollIntervalMs: 15000,
      fromAddress: 'no-reply@example.invalid',
      fromName: 'IDTS'
    },
    invitationConfig: {
      invitationSigningKey: SIGNING_KEY,
      invitationBaseUrl: 'https://idts.example.invalid/onboarding/continue'
    },
    sendMail: async message => {
      sentMessages.push(message)
      return { messageId: 'controlled-provider-message-id' }
    },
    now: new Date('2026-08-12T10:05:00.000Z'),
    workerID: 'onboarding-programmatic-worker'
  })
  assert.deepEqual(sendResult, { sent: 1, failed: 0, skipped: 0 })
  assert.equal(sentMessages.length, 1)
  assert.match(sentMessages[0].subject, /IDTS access invitation/)
  assert.match(sentMessages[0].text, /Continue with SAP/)
  assert.match(sentMessages[0].text, /https:\/\/idts\.example\.invalid\/onboarding\/continue#token=/)
  assert.doesNotMatch(sentMessages[0].text, /\?token=/)
  assert.doesNotMatch(JSON.stringify(persisted), /local-programmatic-invitation-signing-key/)
  assert.doesNotMatch(JSON.stringify(delivery), /onboarding\/continue\?token=/)

  const sentDelivery = await db.run(SELECT.one.from('idts.cap.UserOnboardingDeliveries').where({ ID: delivery.ID }))
  assert.equal(sentDelivery.status_code, 'SENT')
  assert.equal(sentDelivery.providerMessageId, 'controlled-provider-message-id')
  assert.equal(sentDelivery.lockedUntil, null)
  assert.equal(sentDelivery.lockToken, null)

  await expectRejected(service.send({
    event: 'requestOnboarding',
    data: { email: 'controlled.test@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
    user: administrator
  }), 409, 'ONBOARDING_ALREADY_OPEN')
  await expectRejected(service.send({
    event: 'requestOnboarding',
    data: { email: 'other@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
    user: new cds.User({ id: 'pm@example.invalid', roles: ['authenticated-user', 'PM'] })
  }), 403, 'USER_ADMIN_REQUIRED')

  const regenerated = createInvitationToken({
    invitationID: persisted.ID,
    targetEmail: persisted.targetEmailNormalized,
    expiresAt: persisted.expiresAt,
    signingKey: SIGNING_KEY,
    nonce: persisted.tokenNonce
  })
  const verifiedIdentityKeyHash = identityKeyHash({
    origin: 'sap.default',
    issuer: 'https://issuer.example.invalid',
    subject: 'stable-user-uuid-001'
  })
  await db.run(UPDATE('idts.cap.Users').set({ externalIdentityKeyHash: verifiedIdentityKeyHash }).where({ ID: PM_ID }))
  await expectRejected(service.send({
    event: 'verifySapIdentity',
    data: { token: regenerated.token },
    user: new cds.User({
      id: 'mutable-login-name',
      roles: ['authenticated-user'],
      attr: {
        email: 'controlled.test@example.invalid',
        origin: 'sap.default',
        iss: 'https://issuer.example.invalid',
        user_uuid: 'stable-user-uuid-001'
      }
    })
  }), 409, 'EXTERNAL_IDENTITY_ALREADY_LINKED')
  await db.run(UPDATE('idts.cap.Users').set({ externalIdentityKeyHash: null }).where({ ID: PM_ID }))

  const verified = await service.send({
    event: 'verifySapIdentity',
    data: { token: regenerated.token },
    user: new cds.User({
      id: 'mutable-login-name',
      roles: ['authenticated-user'],
      attr: {
        email: 'controlled.test@example.invalid',
        origin: 'sap.default',
        iss: 'https://issuer.example.invalid',
        user_uuid: 'stable-user-uuid-001'
      }
    })
  })
  assert.equal(verified.status, 'IDENTITY_VERIFIED')
  assert.equal('identityOrigin' in verified, false)
  assert.equal('identitySubject' in verified, false)
  assert.equal('tokenHash' in verified, false)

  const verifiedRow = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: created.ID }))
  assert.ok(verifiedRow.consumedAt)
  assert.ok(verifiedRow.verifiedAt)
  assert.equal(verifiedRow.identityOrigin, 'sap.default')
  assert.equal(verifiedRow.identitySubject, 'stable-user-uuid-001')
  assert.equal(verifiedRow.identityIssuer, 'https://issuer.example.invalid')
  assert.equal(verifiedRow.identityKeyHash.length, 64)

  await expectRejected(service.send({
    event: 'verifySapIdentity',
    data: { token: regenerated.token },
    user: new cds.User({
      id: 'mutable-login-name',
      roles: ['authenticated-user'],
      attr: {
        email: 'controlled.test@example.invalid',
        origin: 'sap.default',
        iss: 'https://issuer.example.invalid',
        user_uuid: 'stable-user-uuid-001'
      }
    })
  }), 409, 'INVITATION_ALREADY_USED')

  await expectRejected(service.send({
    event: 'verifySapIdentity',
    data: { token: 'a'.repeat(2049) },
    user: new cds.User({ id: 'oversized-token-user', roles: ['authenticated-user'] })
  }), 400, 'ASSERT_DATA_TYPE')
  assert.throws(
    () => invitationIDFromToken('a'.repeat(2049)),
    error => error?.status === 400 && error?.code === 'INVALID_INVITATION'
  )

  const failingInvite = await service.send({
    event: 'requestOnboarding',
    data: {
      email: 'controlled.developer@example.invalid',
      requestedRole: 'DEVELOPER',
      userAdminRequested: false
    },
    user: administrator
  })
  await new Promise(resolve => setImmediate(resolve))
  const providerError = Object.assign(new Error('private-host.example invalid-api-key-value'), {
    code: 'BREVO_API_FAILED'
  })
  const failureResult = await processUserOnboardingDeliveries({
    tx: db,
    emailConfig: {
      ready: true,
      batchSize: 10,
      maxRetryCount: 2,
      pollIntervalMs: 15000,
      fromAddress: 'no-reply@example.invalid',
      fromName: 'IDTS'
    },
    invitationConfig: {
      invitationSigningKey: SIGNING_KEY,
      invitationBaseUrl: 'https://idts.example.invalid/onboarding/continue'
    },
    sendMail: async () => { throw providerError },
    now: new Date('2026-08-12T10:10:00.000Z'),
    workerID: 'onboarding-failure-worker'
  })
  assert.deepEqual(failureResult, { sent: 0, failed: 1, skipped: 0 })
  const failedDelivery = await db.run(
    SELECT.one.from('idts.cap.UserOnboardingDeliveries').where({ onboardingRequest_ID: failingInvite.ID })
  )
  assert.equal(failedDelivery.status_code, 'FAILED')
  assert.equal(failedDelivery.lastErrorCode, 'BREVO_API_FAILED')
  assert.equal(failedDelivery.lastErrorSummary, 'Email provider API request failed.')
  assert.ok(failedDelivery.nextAttemptAt)
  assert.equal(failedDelivery.lockedUntil, null)
  assert.equal(failedDelivery.lockToken, null)
  assert.doesNotMatch(JSON.stringify(failedDelivery), /private-host|invalid-api-key-value/)
  const failedRequest = await db.run(
    SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: failingInvite.ID })
  )
  assert.equal(failedRequest.lastErrorCode, 'BREVO_API_FAILED')
  assert.equal(failedRequest.lastErrorSummary, 'Email provider API request failed.')
  assert.doesNotMatch(JSON.stringify(failedRequest), /private-host|invalid-api-key-value/)

  const concurrentResults = await Promise.allSettled([
    service.send({
      event: 'requestOnboarding',
      data: { email: 'concurrent@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
      user: administrator
    }),
    service.send({
      event: 'requestOnboarding',
      data: { email: 'CONCURRENT@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
      user: administrator
    })
  ])
  assert.equal(concurrentResults.filter(result => result.status === 'fulfilled').length, 1)
  const concurrentFailure = concurrentResults.find(result => result.status === 'rejected')?.reason
  assert.equal(concurrentFailure?.code, 'ONBOARDING_ALREADY_OPEN')
  const concurrentRows = await db.run(
    SELECT.from('idts.cap.UserOnboardingRequests').where({ targetEmailNormalized: 'concurrent@example.invalid' })
  )
  assert.equal(concurrentRows.length, 1)

  const expiredInviteID = '73000000-0000-4000-8000-000000000001'
  await db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries({
    ID: expiredInviteID,
    targetEmailNormalized: 'expired@example.invalid',
    openRequestKey: require('node:crypto').createHash('sha256').update('expired@example.invalid').digest('hex'),
    requestedRole_code: 'TESTER',
    userAdminRequested: false,
    status_code: 'INVITED',
    requestedBy_ID: PM_ID,
    expiresAt: '2020-01-01T00:00:00.000Z',
    tokenNonce: 'expired-controlled-nonce',
    tokenHash: require('node:crypto').createHash('sha256').update('expired-controlled-token').digest('hex'),
    correlationId: '74000000-0000-4000-8000-000000000001'
  }))
  const reinvited = await service.send({
    event: 'requestOnboarding',
    data: { email: 'expired@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
    user: administrator
  })
  assert.equal(reinvited.status, 'INVITED')
  assert.notEqual(reinvited.ID, expiredInviteID)
  const expiredRow = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: expiredInviteID }))
  assert.equal(expiredRow.status_code, 'FAILED')
  assert.equal(expiredRow.openRequestKey, null)
  assert.equal(expiredRow.lastErrorCode, 'INVITATION_EXPIRED')
  assert.equal(expiredRow.lastErrorSummary, 'Invitation expired before identity verification.')

  cds.spawn = originalSpawn

  console.log('IDTS user onboarding programmatic checks: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
