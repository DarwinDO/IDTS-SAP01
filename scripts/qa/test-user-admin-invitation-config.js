'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const {
  INVITATION_CONFIG_SERVICE,
  getUserAdminConfig
} = require('../../srv/user-admin/config')

const signingKey = 'controlled-local-signing-key-12345678901234567890'
const baseUrl = 'https://idts.example.invalid/onboarding/continue/'

function bindingEnv (...bindings) {
  return {
    NODE_ENV: 'production',
    VCAP_SERVICES: JSON.stringify({
      'user-provided': bindings
    })
  }
}

function binding (credentials, name = INVITATION_CONFIG_SERVICE) {
  return { name, instance_name: name, credentials }
}

const configured = getUserAdminConfig({
  cdsEnv: { idts: { userAdmin: { invitationTtlMinutes: 90 } } },
  env: bindingEnv(binding({ invitationSigningKey: signingKey, invitationBaseUrl: baseUrl }))
})
assert.equal(configured.ready, true)
assert.equal(configured.invitationTtlMinutes, 90)
assert.equal(configured.invitationSigningKey, signingKey)
assert.equal(configured.invitationBaseUrl, baseUrl.slice(0, -1))

for (const env of [
  bindingEnv(),
  bindingEnv(binding({ invitationSigningKey: signingKey })),
  bindingEnv(binding({ invitationSigningKey: signingKey, invitationBaseUrl: baseUrl, unexpected: true })),
  bindingEnv(
    binding({ invitationSigningKey: signingKey, invitationBaseUrl: baseUrl }),
    binding({ invitationSigningKey: signingKey, invitationBaseUrl: baseUrl })
  ),
  { NODE_ENV: 'production', VCAP_SERVICES: '{invalid' }
]) {
  const result = getUserAdminConfig({
    cdsEnv: { idts: { userAdmin: { invitationSigningKey: signingKey, invitationBaseUrl: baseUrl } } },
    env
  })
  assert.equal(result.ready, false)
  assert.equal(result.invitationSigningKey, null)
  assert.equal(result.invitationBaseUrl, null)
}

const local = getUserAdminConfig({
  cdsEnv: {
    idts: {
      userAdmin: {
        invitationSigningKey: signingKey,
        invitationBaseUrl: baseUrl,
        invitationTtlMinutes: 60
      }
    }
  },
  env: { NODE_ENV: 'test' }
})
assert.equal(local.ready, true)
assert.equal(local.invitationBaseUrl, baseUrl.slice(0, -1))

const mta = fs.readFileSync(path.join(__dirname, '../../mta.yaml'), 'utf8')
assert.match(mta, /- name: idts-user-admin-invitation-config\s+type: org\.cloudfoundry\.existing-service\s+parameters:\s+service-name: idts-user-admin-invitation-config/)
const srvModule = mta.slice(mta.indexOf('  - name: idts-sap01-srv'), mta.indexOf('\n  - name: idts-sap01-db-deployer'))
assert.equal((srvModule.match(/- name: idts-user-admin-invitation-config/g) || []).length, 1)
assert.equal((mta.match(/service-name: idts-user-admin-invitation-config/g) || []).length, 1)

console.log('User Administration invitation config: PASS')
