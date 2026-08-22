'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const cds = require('@sap/cds')
const { INSERT, SELECT } = cds.ql

const PM_ID = '83000000-0000-4000-8000-000000000001'
const OTHER_ID = '83000000-0000-4000-8000-000000000002'
const BOOTSTRAP_CORRELATION = '83000000-0000-4000-8000-000000000003'
const ORIGIN = 'sap.default'
const ISSUER = 'https://issuer.example.invalid'
const SUBJECT = 'bootstrap-normalization-subject'
const PLATFORM_USER_ID = 'bootstrap-normalization-platform-user'
const CONTACT_EMAIL = 'normalized.pm@example.invalid'

function identityHash () {
  return crypto.createHash('sha256').update(JSON.stringify([ORIGIN, ISSUER, SUBJECT])).digest('hex')
}

function identityStateHash () {
  return crypto.createHash('sha256').update(JSON.stringify([ORIGIN, ISSUER, SUBJECT, identityHash()])).digest('hex')
}

function pmUser (roles = ['authenticated-user', 'PM', 'UserAdmin'], email = CONTACT_EMAIL) {
  return new cds.User({
    id: email,
    roles,
    attr: { email },
    authInfo: {
      token: {
        origin: ORIGIN,
        issuer: ISSUER,
        payload: {
          user_id: PLATFORM_USER_ID,
          user_uuid: SUBJECT
        }
      }
    }
  })
}

async function main () {
  const db = await cds.deploy('db').to('sqlite::memory:')
  const previousDb = cds.db
  const previousAuth = cds.env.requires?.auth
  cds.db = db
  cds.env.requires.auth = { kind: 'xsuaa' }

  try {
    await db.run(INSERT.into('idts.cap.Users').entries({
      ID: PM_ID,
      displayName: 'Bootstrap PM',
      email: 'bootstrap.pm@example.local',
      role_code: 'PM',
      active: true,
      externalIdentityOrigin: ORIGIN,
      externalIdentityIssuer: ISSUER,
      externalIdentitySubject: SUBJECT,
      externalIdentityKeyHash: identityHash()
    }))
    await db.run(INSERT.into('idts.cap.UserIdentityAuditEvents').entries({
      ID: '83000000-0000-4000-8000-000000000004',
      actor_ID: PM_ID,
      targetUser_ID: PM_ID,
      action: 'BOOTSTRAP_LINK',
      result: 'LINKED',
      fromState: 'UNLINKED',
      toState: 'LINKED',
      correlationId: BOOTSTRAP_CORRELATION,
      afterIdentityHash: identityStateHash(),
      detailsSummary: 'Controlled fixture bootstrap.'
    }))

    const service = await cds.serve('UserAdministrationService').from('srv/user-admin.cds')
    const normalized = await service.send({ event: 'normalizeCurrentBootstrapPm', user: pmUser() })
    assert.equal(normalized.status, 'NORMALIZED')
    assert.match(normalized.correlationId, /^[0-9a-f-]{36}$/i)

    const user = await db.run(SELECT.one.from('idts.cap.Users').where({ ID: PM_ID }))
    assert.equal(user.email, CONTACT_EMAIL)
    assert.equal(user.role_code, 'PM')
    assert.equal(user.active, true)
    assert.equal(user.externalIdentityKeyHash, identityHash())

    const requests = await db.run(SELECT.from('idts.cap.UserOnboardingRequests').where({ activeUser_ID: PM_ID }))
    assert.equal(requests.length, 1)
    assert.equal(requests[0].status_code, 'ACTIVE')
    assert.equal(requests[0].requestedRole_code, 'PM')
    assert.equal(requests[0].userAdminRequested, true)
    assert.equal(requests[0].targetEmailNormalized, CONTACT_EMAIL)
    assert.equal(requests[0].identityKeyHash, identityHash())
    assert.equal(requests[0].identityPlatformUserId, PLATFORM_USER_ID)
    assert.equal(requests[0].requestedBy_ID, PM_ID)

    const audit = await db.run(SELECT.one.from('idts.cap.UserIdentityAuditEvents').where({
      targetUser_ID: PM_ID,
      action: 'BOOTSTRAP_PM_NORMALIZED'
    }))
    assert.equal(audit.result, 'APPLIED')
    assert.equal(audit.actor_ID, PM_ID)
    assert.equal(String(audit.detailsSummary).includes(CONTACT_EMAIL), false)

    const activeUsers = await service.send({
      event: 'searchActiveUsers',
      data: { query: CONTACT_EMAIL, includeNonActive: false, skip: 0, top: 100 },
      user: pmUser()
    })
    assert.equal(activeUsers.length, 1)
    assert.equal(activeUsers[0].userID, PM_ID)
    assert.equal(activeUsers[0].email, CONTACT_EMAIL)
    assert.equal(activeUsers[0].businessRole, 'PM')
    assert.equal(activeUsers[0].accessState, 'ACTIVE')
    assert.equal(activeUsers[0].identityLinked, true)
    assert.equal(activeUsers[0].userAdminCapability, true)

    const noOp = await service.send({ event: 'normalizeCurrentBootstrapPm', user: pmUser() })
    assert.equal(noOp.status, 'NO_OP')
    assert.equal((await db.run(SELECT.from('idts.cap.UserOnboardingRequests').where({ activeUser_ID: PM_ID }))).length, 1)

    for (const caller of [
      pmUser(['authenticated-user', 'PM']),
      pmUser(['authenticated-user', 'PM', 'DEVELOPER', 'UserAdmin'])
    ]) {
      await assert.rejects(
        () => service.send({ event: 'normalizeCurrentBootstrapPm', user: caller }),
        error => error?.code === 'USER_ADMIN_REQUIRED'
      )
    }

    await db.run(INSERT.into('idts.cap.Users').entries({
      ID: OTHER_ID,
      displayName: 'Collision User',
      email: 'collision@example.invalid',
      role_code: 'TESTER',
      active: true
    }))
    await assert.rejects(
      () => service.send({ event: 'normalizeCurrentBootstrapPm', user: pmUser(undefined, 'collision@example.invalid') }),
      error => error?.code === 'BOOTSTRAP_PM_EMAIL_CONFLICT'
    )

    console.log('User Administration bootstrap PM normalization: PASS')
  } finally {
    cds.env.requires.auth = previousAuth
    cds.db = previousDb
    if (typeof db.disconnect === 'function') await db.disconnect()
  }
}

main().catch(error => {
  console.error(`User Administration bootstrap PM normalization: FAIL (${error.message})`)
  process.exitCode = 1
})
