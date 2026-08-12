'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const schema = fs.readFileSync(path.join(root, 'db/schema.cds'), 'utf8')
const authSource = fs.readFileSync(path.join(root, 'srv/auth.js'), 'utf8')
const helperSource = fs.readFileSync(path.join(root, 'srv/bug-service/helpers.js'), 'utf8')
const userAdminSource = fs.readFileSync(path.join(root, 'srv/user-admin.js'), 'utf8')

assert.match(schema, /externalIdentityOrigin\s*:\s*String\(120\)/)
assert.match(schema, /externalIdentityIssuer\s*:\s*String\(500\)/)
assert.match(schema, /externalIdentitySubject\s*:\s*String\(255\)/)
assert.match(schema, /externalIdentityKeyHash\s*:\s*String\(64\)/)
assert.match(schema, /@assert\.unique\.userExternalIdentity:\s*\[\s*externalIdentityKeyHash\s*\]/)
for (const source of [authSource, helperSource, userAdminSource]) {
  assert.match(source, /selectActiveUserForRequest/)
}

const {
  identityKeyHash,
  identityKeyFromRequestUser,
  selectActiveUserForRequest
} = require('../../srv/auth/identity-map')

const requestUser = {
  id: 'mutable-login-name',
  attr: {
    email: 'Renamed.User@Example.Invalid',
    origin: 'sap.default',
    issuer: 'https://issuer.example.invalid',
    user_uuid: 'Stable-Subject-01'
  }
}
const identity = identityKeyFromRequestUser(requestUser)
assert.equal(identity.origin, 'sap.default')
assert.equal(identity.issuer, 'https://issuer.example.invalid')
assert.equal(identity.subject, 'Stable-Subject-01')
assert.match(identity.keyHash, /^[a-f0-9]{64}$/)
assert.notEqual(
  identityKeyHash({ origin: 'a', issuer: 'b\0c', subject: 'd' }),
  identityKeyHash({ origin: 'a\0b', issuer: 'c', subject: 'd' })
)

const uuidIdentity = identityKeyFromRequestUser({
  id: 'mutable-login-name',
  attr: {
    origin: 'idts-ias-pilot',
    issuer: 'https://issuer.example.invalid',
    user_uuid: 'stable-user-uuid',
    sub: 'stable-subject'
  }
})
assert.equal(uuidIdentity.subject, 'stable-user-uuid')

const subjectIdentity = identityKeyFromRequestUser({
  id: 'mutable-login-name',
  attr: {
    origin: 'idts-ias-pilot',
    issuer: 'https://issuer.example.invalid',
    sub: 'stable-subject'
  }
})
assert.equal(subjectIdentity, null)

const renamedLinkedUser = {
  ID: '10000000-0000-0000-0000-000000000001',
  email: 'old.user@example.invalid',
  displayName: 'Old User',
  active: true,
  externalIdentityKeyHash: identity.keyHash
}
assert.equal(selectActiveUserForRequest([renamedLinkedUser], requestUser), renamedLinkedUser)

const conflictingLinkedUser = {
  ...renamedLinkedUser,
  email: 'renamed.user@example.invalid',
  externalIdentityKeyHash: 'f'.repeat(64)
}
assert.equal(selectActiveUserForRequest([conflictingLinkedUser], requestUser), null)

const unlinkedExternalUser = {
  ...renamedLinkedUser,
  email: 'renamed.user@example.invalid',
  externalIdentityKeyHash: null
}
assert.equal(selectActiveUserForRequest([unlinkedExternalUser], requestUser), null)

const inactiveLegacyUser = { ...unlinkedExternalUser, active: false }
assert.equal(selectActiveUserForRequest([inactiveLegacyUser], requestUser), null)

const localUser = {
  id: '10000000-0000-0000-0000-000000000001',
  attr: {
    user_ID: '10000000-0000-0000-0000-000000000001',
    email: 'legacy@example.invalid'
  }
}
assert.equal(identityKeyFromRequestUser(localUser), null)
assert.equal(selectActiveUserForRequest([{
  ...unlinkedExternalUser,
  ID: localUser.id,
  email: 'legacy@example.invalid'
}], localUser)?.ID, localUser.id)

const duplicateEmailRows = [
  { ...unlinkedExternalUser, ID: 'row-1', email: 'duplicate@example.invalid' },
  { ...unlinkedExternalUser, ID: 'row-2', email: 'duplicate@example.invalid' }
]
assert.equal(selectActiveUserForRequest(duplicateEmailRows, {
  id: 'duplicate@example.invalid',
  attr: { email: 'duplicate@example.invalid' }
}), null)

assert.equal(selectActiveUserForRequest([unlinkedExternalUser], {
  id: 'renamed.user@example.invalid',
  attr: { origin: 'sap.default' }
}), null)
assert.equal(selectActiveUserForRequest([unlinkedExternalUser], {
  id: 'renamed.user@example.invalid',
  attr: { email: 'renamed.user@example.invalid' }
}, { requireExternalIdentity: true }), null)

const displayNameOnly = {
  id: 'unrelated-id',
  attr: { displayName: 'Legacy Person' }
}
assert.equal(selectActiveUserForRequest([{
  ...unlinkedExternalUser,
  displayName: 'Legacy Person'
}], displayNameOnly), null)

console.log('IDTS immutable identity mapping contract: PASS')
