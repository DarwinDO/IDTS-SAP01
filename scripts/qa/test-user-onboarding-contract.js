'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

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

function main () {
  const serviceSource = fs.readFileSync(path.join(__dirname, '../../srv/user-admin.cds'), 'utf8')
  const handlerSource = fs.readFileSync(path.join(__dirname, '../../srv/user-admin.js'), 'utf8')
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

main()
