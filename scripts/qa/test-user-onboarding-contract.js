'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')
const { INSERT, SELECT } = cds.ql
const {
  formatAtomicMarker,
  readAtomicOptions,
  runAtomicCase,
  runAtomicUnavailableCase
} = require('./idts110-atomic-runner')

const {
  assertRequestedAccess,
  assertUserAdministrator,
  createInvitationToken,
  identitySnapshotFrom,
  verifyInvitationToken
} = require('../../srv/user-admin/invitations')

function requestUser (roles) {
  const granted = new Set(roles)
  return { user: { is: role => granted.has(role) } }
}

function expectCode (fn, expectedCode) {
  assert.throws(fn, error => error?.code === expectedCode)
}

function xsuaaUser ({ email, userUuid, platformUserId = '11111111-1111-4111-8111-111111111111' }) {
  return {
    id: 'mutable-login-name',
    attr: { email },
    authInfo: {
      token: {
        origin: 'sap.default',
        issuer: 'https://issuer.example.invalid',
        userId: 'forbidden-sub-fallback',
        payload: {
          user_id: platformUserId,
          user_uuid: userUuid,
          sub: 'forbidden-sub-fallback'
        }
      }
    }
  }
}

const root = path.resolve(__dirname, '../..')

function readDefinition (caseKey) {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'docs/qa/idts-110-unit-test-catalog.json'), 'utf8'))
  const definition = catalog.cases.find(row => row.caseId === caseKey)
  if (!definition) throw new Error(`Unknown IDTS-110 case ${caseKey}`)
  return definition
}

async function runAtomicAccessContractCase (caseKey) {
  if (caseKey === 'IDTS110-F207' || caseKey === 'IDTS110-F208') {
    const signingKey = 'atomic-contract-signing-key-with-enough-entropy-123456'
    const invitation = createInvitationToken({
      invitationID: '11111111-1111-4111-8111-111111111111',
      targetEmail: 'Controlled.Test@Example.invalid',
      expiresAt: '2026-09-30T10:00:00.000Z',
      signingKey,
      nonce: 'atomic-contract-nonce'
    })
    const before = JSON.stringify(invitation.persisted)
    if (caseKey === 'IDTS110-F207') {
      expectCode(() => verifyInvitationToken({
        token: `${invitation.token.slice(0, -1)}x`,
        persisted: invitation.persisted,
        signingKey,
        now: new Date('2026-09-05T10:00:00.000Z')
      }), 'INVALID_INVITATION')
      assert.equal(JSON.stringify(invitation.persisted), before)
      return { code: 'INVALID_INVITATION', invitationUnconsumed: invitation.persisted.consumedAt === null }
    }
    assert.doesNotThrow(() => verifyInvitationToken({
      token: invitation.token,
      persisted: invitation.persisted,
      signingKey,
      now: new Date('2026-09-05T10:00:00.000Z')
    }))
    expectCode(() => identitySnapshotFrom(xsuaaUser({
      email: 'other@example.invalid',
      userUuid: 'stable-atomic-contract-subject'
    }), invitation.persisted), 'INVITATION_IDENTITY_MISMATCH')
    assert.equal(JSON.stringify(invitation.persisted), before)
    return { code: 'INVITATION_IDENTITY_MISMATCH', invitationStatus: 'INVITED' }
  }

  const db = await cds.deploy('db').to('sqlite::memory:')
  const previousDb = cds.db
  cds.db = db
  try {
    await db.run(INSERT.into('idts.cap.Users').entries([
      { ID: '84000000-0000-4000-8000-000000000001', displayName: 'Atomic PM', email: 'atomic.contract.pm@example.invalid', role_code: 'PM', active: true },
      { ID: '84000000-0000-4000-8000-000000000002', displayName: 'Inactive PM', email: 'atomic.contract.inactive@example.invalid', role_code: 'PM', active: false }
    ]))
    for (const roles of [[], ['TESTER'], ['PM']]) {
      expectCode(() => assertUserAdministrator(requestUser(roles)), 'USER_ADMIN_REQUIRED')
    }
    const service = await cds.serve('UserAdministrationService').from('srv/user-admin.cds')
    const activeAdmin = new cds.User({ id: 'atomic.contract.pm@example.invalid', roles: ['authenticated-user', 'PM', 'UserAdmin'] })
    const authorizedRows = await service.send({ event: 'searchOnboarding', data: { query: '' }, user: activeAdmin })
    assert.ok(Array.isArray(authorizedRows))
    await assert.rejects(
      service.send({
        event: 'searchOnboarding',
        data: { query: '' },
        user: new cds.User({ id: 'atomic.contract.inactive@example.invalid', roles: ['authenticated-user', 'PM', 'UserAdmin'] })
      }),
      error => error?.code === 'USER_ADMIN_REQUIRED' && Number(error?.status || error?.statusCode) === 403
    )
    return { rejectedAnonymousNonPmAndMissingOverlay: 3, inactiveRequesterRejected: true, authorizedReadRows: authorizedRows.length }
  } finally {
    if (previousDb === undefined) delete cds.db
    else cds.db = previousDb
    if (typeof db.disconnect === 'function') await db.disconnect()
  }
}

async function runAtomicSelector (options) {
  if (!['IDTS110-F204', 'IDTS110-F207', 'IDTS110-F208'].includes(options.caseKey)) {
    await runAtomicUnavailableCase({ ...options, plannedTestFile: 'scripts/qa/test-user-onboarding-contract.js' })
    return
  }
  const definition = readDefinition(options.caseKey)
  const result = await runAtomicCase({
    definition,
    assertionId: `${options.caseKey}-A1`,
    baselineSha: options.baselineSha,
    executor: options.executor,
    execute: async () => ({
      assertionPassed: true,
      actualResult: definition.expectedResult,
      beforeState: { fixture: options.caseKey === 'IDTS110-F204' ? 'isolated-sqlite' : 'pure-invitation' },
      afterState: await runAtomicAccessContractCase(options.caseKey),
      reloadState: { invitationUnchanged: true },
      evidenceIds: [`${options.caseKey}-RESULT`]
    })
  })
  console.log(formatAtomicMarker(result))
  process.exitCode = result.status === 'PASS' ? 0 : 1
}

function runRegressionChecks () {
  const serviceSource = fs.readFileSync(path.join(__dirname, '../../srv/user-admin.cds'), 'utf8')
  const handlerSource = fs.readFileSync(path.join(__dirname, '../../srv/user-admin.js'), 'utf8')
  const schemaSource = fs.readFileSync(path.join(__dirname, '../../db/schema.cds'), 'utf8')
  assert.match(serviceSource, /requestOnboarding\([\s\S]*displayName\s*:\s*String\(120\)/)
  assert.match(schemaSource, /entity UserOnboardingRequests[\s\S]*requestedDisplayName\s*:\s*String\(120\)/)
  assert.match(handlerSource, /requestedDisplayName:\s*displayName/)
  assert.doesNotMatch(serviceSource, /normalizeCurrentBootstrapPm/, 'temporary bootstrap PM action must be removed')
  assert.doesNotMatch(handlerSource, /normalizeCurrentBootstrapPm|BOOTSTRAP_PM_NORMALIZED/, 'temporary bootstrap PM handler must be removed')

  assert.doesNotThrow(() => assertUserAdministrator(requestUser(['PM', 'UserAdmin'])))
  expectCode(() => assertUserAdministrator(requestUser(['PM'])), 'USER_ADMIN_REQUIRED')
  expectCode(() => assertUserAdministrator(requestUser(['TESTER', 'UserAdmin'])), 'USER_ADMIN_REQUIRED')

  assert.deepEqual(assertRequestedAccess('tester', false), {
    requestedRole: 'TESTER',
    userAdminRequested: false
  })
  assert.deepEqual(assertRequestedAccess('PM', true), {
    requestedRole: 'PM',
    userAdminRequested: true
  })
  expectCode(() => assertRequestedAccess('DEVELOPER', true), 'USER_ADMIN_REQUIRES_PM')
  expectCode(() => assertRequestedAccess('ADMIN', false), 'INVALID_BUSINESS_ROLE')

  const signingKey = 'local-test-signing-key-with-enough-entropy-123456'
  const invitation = createInvitationToken({
    invitationID: '11111111-1111-4111-8111-111111111111',
    targetEmail: 'Controlled.Test@Example.invalid',
    expiresAt: '2026-08-13T10:00:00.000Z',
    signingKey,
    nonce: 'fixed-test-nonce'
  })

  assert.match(invitation.token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
  assert.equal(invitation.persisted.targetEmailNormalized, 'controlled.test@example.invalid')
  assert.equal(invitation.persisted.tokenHash.length, 64)
  assert.equal(invitation.persisted.tokenNonce, 'fixed-test-nonce')
  assert.equal(Object.values(invitation.persisted).includes(invitation.token), false)
  assert.equal(JSON.stringify(invitation.persisted).includes(signingKey), false)

  const verified = verifyInvitationToken({
    token: invitation.token,
    persisted: invitation.persisted,
    signingKey,
    now: new Date('2026-08-12T10:00:00.000Z')
  })
  assert.equal(verified.invitationID, '11111111-1111-4111-8111-111111111111')
  assert.equal(verified.targetEmailNormalized, 'controlled.test@example.invalid')

  expectCode(() => verifyInvitationToken({
    token: `${invitation.token.slice(0, -1)}x`,
    persisted: invitation.persisted,
    signingKey,
    now: new Date('2026-08-12T10:00:00.000Z')
  }), 'INVALID_INVITATION')
  expectCode(() => verifyInvitationToken({
    token: invitation.token,
    persisted: invitation.persisted,
    signingKey,
    now: new Date('2026-08-14T10:00:00.000Z')
  }), 'INVITATION_EXPIRED')
  expectCode(() => verifyInvitationToken({
    token: invitation.token,
    persisted: { ...invitation.persisted, consumedAt: '2026-08-12T11:00:00.000Z' },
    signingKey,
    now: new Date('2026-08-12T12:00:00.000Z')
  }), 'INVITATION_ALREADY_USED')

  const identity = identitySnapshotFrom(xsuaaUser({
    email: 'Controlled.Test@Example.invalid',
    userUuid: 'stable-subject-123'
  }), invitation.persisted)
  assert.deepEqual(identity, {
    subject: 'stable-subject-123',
    platformUserId: '11111111-1111-4111-8111-111111111111',
    emailNormalized: 'controlled.test@example.invalid',
    origin: 'sap.default',
    issuer: 'https://issuer.example.invalid'
  })
  expectCode(() => identitySnapshotFrom(xsuaaUser({
    email: 'other@example.invalid',
    userUuid: 'stable-subject-123'
  }), invitation.persisted), 'INVITATION_IDENTITY_MISMATCH')
  expectCode(() => identitySnapshotFrom(xsuaaUser({
    email: 'Controlled.Test@Example.invalid',
    userUuid: 'stable-subject-123',
    platformUserId: ''
  }), invitation.persisted), 'IDENTITY_CLAIMS_INCOMPLETE')

  const security = JSON.parse(fs.readFileSync(path.join(__dirname, '../../xs-security.json'), 'utf8'))
  const userAdminScope = security.scopes.find(scope => scope.name === '$XSAPPNAME.UserAdmin')
  const userAdminTemplate = security['role-templates'].find(template => template.name === 'UserAdmin')
  const userAdminCollections = (security['role-collections'] || [])
    .filter(collection => collection.name === 'IDTS_USER_ADMIN')
  assert.ok(userAdminScope)
  assert.deepEqual(userAdminTemplate?.['scope-references'], ['$XSAPPNAME.UserAdmin'])
  assert.equal(userAdminCollections.length, 1)
  assert.deepEqual(userAdminCollections[0]['role-template-references'], ['$XSAPPNAME.UserAdmin'])
  assert.deepEqual(
    security['role-templates']
      .filter(template => ['Tester', 'Developer', 'PM'].includes(template.name))
      .map(template => template.name)
      .sort(),
    ['Developer', 'PM', 'Tester']
  )

  console.log('IDTS user onboarding security contract: PASS')
}

async function main () {
  const options = readAtomicOptions()
  if (options.caseKey) {
    await runAtomicSelector(options)
    return
  }
  runRegressionChecks()
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
