'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const cds = require('@sap/cds')
const { DELETE, INSERT, SELECT } = cds.ql

const PM_ID = '71000000-0000-4000-8000-000000000001'
const ORIGIN = 'sap.default'
const ISSUER = 'https://issuer.example.invalid'
const SUBJECT = 'controlled-pm-user-uuid'

function pmUser (roles = ['authenticated-user', 'PM', 'UserAdmin']) {
  return new cds.User({
    id: 'mutable-pm-login',
    roles,
    authInfo: {
      token: {
        origin: ORIGIN,
        issuer: ISSUER,
        payload: {
          user_id: 'controlled-platform-user-id',
          user_uuid: SUBJECT
        }
      }
    }
  })
}

async function expectRejected (operation, status, code) {
  await assert.rejects(operation, error => Number(error?.status || error?.statusCode) === status && error?.code === code)
}

async function main () {
  const db = await cds.deploy('db').to('sqlite::memory:')
  cds.db = db
  await db.run(DELETE.from('idts.cap.Users'))
  await db.run(INSERT.into('idts.cap.Users').entries({
    ID: PM_ID,
    displayName: 'Controlled PM',
    email: 'pm@example.invalid',
    role_code: 'PM',
    active: true
  }))

  cds.env.requires.auth = { kind: 'xsuaa' }
  process.env.IDTS_USER_ADMIN_BOOTSTRAP_TARGET_SHA256 = crypto.createHash('sha256').update(PM_ID).digest('hex')

  const service = await cds.serve('UserAdministrationService').from('srv/user-admin.cds')
  const linked = await service.send({ event: 'bootstrapCurrentIdentityLink', user: pmUser() })
  assert.equal(linked.status, 'LINKED')
  assert.match(linked.correlationId, /^[0-9a-f-]{36}$/i)
  assert.equal(linked.authorityFingerprintPrefix.length, 12)

  const row = await db.run(SELECT.one.from('idts.cap.Users').where({ ID: PM_ID }))
  assert.equal(row.externalIdentityOrigin, ORIGIN)
  assert.equal(row.externalIdentityIssuer, ISSUER)
  assert.equal(row.externalIdentitySubject, SUBJECT)
  assert.match(row.externalIdentityKeyHash, /^[0-9a-f]{64}$/)
  assert.equal(row.email, 'pm@example.invalid')
  assert.equal(row.role_code, 'PM')
  assert.equal(row.active, true)

  const audits = await db.run(SELECT.from('idts.cap.UserIdentityAuditEvents'))
  assert.equal(audits.length, 1)
  assert.equal(audits[0].onboardingRequest_ID, null)
  assert.equal(audits[0].actor_ID, PM_ID)
  assert.equal(audits[0].targetUser_ID, PM_ID)
  assert.equal(audits[0].action, 'BOOTSTRAP_LINK')
  assert.equal(audits[0].result, 'LINKED')
  assert.match(audits[0].beforeIdentityHash, /^[0-9a-f]{64}$/)
  assert.match(audits[0].afterIdentityHash, /^[0-9a-f]{64}$/)

  const noOp = await service.send({ event: 'bootstrapCurrentIdentityLink', user: pmUser() })
  assert.equal(noOp.status, 'NO_OP')
  assert.equal(noOp.correlationId, linked.correlationId)
  assert.equal((await db.run(SELECT.from('idts.cap.UserIdentityAuditEvents'))).length, 1)

  await expectRejected(service.send({
    event: 'bootstrapCurrentIdentityLink',
    user: pmUser(['authenticated-user', 'PM', 'DEVELOPER', 'UserAdmin'])
  }), 403, 'USER_ADMIN_REQUIRED')

  process.env.IDTS_USER_ADMIN_BOOTSTRAP_TARGET_SHA256 = 'f'.repeat(64)
  await expectRejected(service.send({ event: 'bootstrapCurrentIdentityLink', user: pmUser() }), 403, 'BOOTSTRAP_TARGET_NOT_APPROVED')

  delete process.env.IDTS_USER_ADMIN_BOOTSTRAP_TARGET_SHA256
  console.log('User Administration identity bootstrap: PASS')
}

main().catch(error => {
  delete process.env.IDTS_USER_ADMIN_BOOTSTRAP_TARGET_SHA256
  console.error(`User Administration identity bootstrap: FAIL (${error.message})`)
  process.exitCode = 1
})
