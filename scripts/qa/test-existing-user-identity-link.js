'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const readSource = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')

async function main () {
  const schema = readSource('db/schema.cds')
  const service = readSource('srv/user-admin.cds')
  const provisioning = readSource('srv/provisioning-broker.js')
  const accessProvisioning = readSource('broker/lib/access-provisioning.js')
  const publicProjection = service

  assert.match(schema, /linkTargetUser\s*:\s*Association to Users/, 'missing existing-user link target association')
  assert.match(schema, /linkSourceEmailNormalized\s*:\s*String\(255\)/, 'missing existing-user source email snapshot')
  assert.match(service, /action requestExistingUserIdentityLink\([\s\S]*userID\s*:\s*UUID[\s\S]*email\s*:\s*String\(255\)/, 'missing existing-user identity-link action')
  assert.match(provisioning, /operation\.operationType === 'LINK_EXISTING'/, 'missing LINK_EXISTING provisioning branch')
  assert.match(accessProvisioning, /'LINK_EXISTING'/, 'missing read-only LINK_EXISTING broker contract')
  assert.doesNotMatch(publicProjection, /linkSourceEmailNormalized|identityOrigin|identityIssuer|identitySubject|identityKeyHash/, 'public onboarding projection exposes identity-link internals')

  console.log('Gate 3B existing-user identity-link contract: PASS')
}

main().catch(error => {
  console.error(`${error.name}: ${error.message}`)
  process.exitCode = 1
})
