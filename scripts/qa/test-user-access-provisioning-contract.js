'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const {
  BUSINESS_ROLE_COLLECTIONS,
  requestedRoleCollections,
  executeAccessChange,
  safeProvisioningFailure
} = require('../../broker/lib/access-provisioning')
const { processOneAccessOperation } = require('../../broker/worker')

async function main () {
  assert.deepEqual(BUSINESS_ROLE_COLLECTIONS, {
    PM: 'IDTS_PM',
    TESTER: 'IDTS_TESTER',
    DEVELOPER: 'IDTS_DEVELOPER'
  })
  assert.deepEqual(requestedRoleCollections({ requestedRole: 'TESTER', userAdminRequested: false }), ['IDTS_TESTER'])
  assert.deepEqual(requestedRoleCollections({ requestedRole: 'PM', userAdminRequested: true }), ['IDTS_PM', 'IDTS_USER_ADMIN'])
  assert.throws(
    () => requestedRoleCollections({ requestedRole: 'DEVELOPER', userAdminRequested: true }),
    error => error?.code === 'USER_ADMIN_REQUIRES_PM'
  )
  assert.throws(
    () => requestedRoleCollections({ requestedRole: 'ADMIN', userAdminRequested: false }),
    error => error?.code === 'INVALID_BUSINESS_ROLE'
  )

  const state = new Set(['NON_IDTS_EXISTING'])
  const calls = []
  const provider = {
    listRoleCollections: async () => [...state],
    assignRoleCollection: async name => { calls.push(['ASSIGN', name]); state.add(name) },
    unassignRoleCollection: async name => { calls.push(['REVOKE', name]); state.delete(name) }
  }

  const assigned = await executeAccessChange({
    action: 'ASSIGN',
    requestedRole: 'PM',
    userAdminRequested: true,
    provider
  })
  assert.deepEqual(assigned, { action: 'ASSIGN', changed: ['IDTS_PM', 'IDTS_USER_ADMIN'], finalRoleCollections: ['IDTS_PM', 'IDTS_USER_ADMIN'] })
  assert.deepEqual(calls, [['ASSIGN', 'IDTS_PM'], ['ASSIGN', 'IDTS_USER_ADMIN']])
  assert.equal(state.has('NON_IDTS_EXISTING'), true)

  const driftedRevokeState = new Set(['IDTS_PM', 'IDTS_USER_ADMIN', 'IDTS_TESTER', 'NON_IDTS_EXISTING'])
  await executeAccessChange({
    action: 'REVOKE',
    requestedRole: 'PM',
    userAdminRequested: true,
    provider: {
      listRoleCollections: async () => [...driftedRevokeState],
      assignRoleCollection: async name => driftedRevokeState.add(name),
      unassignRoleCollection: async name => driftedRevokeState.delete(name)
    }
  })
  assert.deepEqual([...driftedRevokeState], ['NON_IDTS_EXISTING'])

  const invalidOverlayState = new Set(['IDTS_TESTER', 'IDTS_USER_ADMIN'])
  await assert.rejects(executeAccessChange({
    action: 'ASSIGN',
    requestedRole: 'TESTER',
    userAdminRequested: false,
    provider: {
      listRoleCollections: async () => [...invalidOverlayState],
      assignRoleCollection: async name => invalidOverlayState.add(name),
      unassignRoleCollection: async name => invalidOverlayState.delete(name)
    }
  }), error => error?.code === 'USER_ADMIN_REQUIRES_PM')

  calls.length = 0
  const idempotent = await executeAccessChange({
    action: 'ASSIGN',
    requestedRole: 'PM',
    userAdminRequested: true,
    provider
  })
  assert.deepEqual(idempotent.changed, [])
  assert.deepEqual(calls, [])

  calls.length = 0
  const revoked = await executeAccessChange({
    action: 'REVOKE',
    requestedRole: 'PM',
    userAdminRequested: true,
    provider
  })
  assert.deepEqual(revoked.changed, ['IDTS_USER_ADMIN', 'IDTS_PM'])
  assert.deepEqual(calls, [['REVOKE', 'IDTS_USER_ADMIN'], ['REVOKE', 'IDTS_PM']])
  assert.equal(state.has('NON_IDTS_EXISTING'), true)

  const conflictingState = new Set(['IDTS_DEVELOPER'])
  await assert.rejects(executeAccessChange({
    action: 'ASSIGN',
    requestedRole: 'TESTER',
    userAdminRequested: false,
    provider: {
      listRoleCollections: async () => [...conflictingState],
      assignRoleCollection: async name => conflictingState.add(name),
      unassignRoleCollection: async name => conflictingState.delete(name)
    }
  }), error => error?.code === 'MULTIPLE_BUSINESS_ROLES')
  assert.deepEqual([...conflictingState], ['IDTS_DEVELOPER'])

  const roleChangeState = new Set(['IDTS_TESTER', 'NON_IDTS_EXISTING'])
  const roleChangeCalls = []
  const roleChanged = await executeAccessChange({
    action: 'CHANGE_ROLE',
    requestedRole: 'DEVELOPER',
    userAdminRequested: false,
    provider: {
      listRoleCollections: async () => [...roleChangeState],
      assignRoleCollection: async name => { roleChangeCalls.push(['ASSIGN', name]); roleChangeState.add(name) },
      unassignRoleCollection: async name => { roleChangeCalls.push(['REVOKE', name]); roleChangeState.delete(name) }
    }
  })
  assert.deepEqual(roleChanged.changed, ['IDTS_DEVELOPER'])
  assert.deepEqual(roleChangeCalls, [['REVOKE', 'IDTS_TESTER'], ['ASSIGN', 'IDTS_DEVELOPER']])
  assert.deepEqual([...roleChangeState].sort(), ['IDTS_DEVELOPER', 'NON_IDTS_EXISTING'])

  const compensationState = new Set()
  await assert.rejects(executeAccessChange({
    action: 'ASSIGN',
    requestedRole: 'PM',
    userAdminRequested: true,
    provider: {
      listRoleCollections: async () => [...compensationState],
      assignRoleCollection: async name => {
        if (name === 'IDTS_USER_ADMIN') throw Object.assign(new Error('private provider detail'), { code: 'PROVIDER_DENIED' })
        compensationState.add(name)
      },
      unassignRoleCollection: async name => compensationState.delete(name)
    }
  }), error => error?.code === 'PROVIDER_DENIED')
  assert.deepEqual([...compensationState], [])

  assert.deepEqual(safeProvisioningFailure(Object.assign(new Error('secret private endpoint'), { code: 'PROVIDER_DENIED' })), {
    code: 'PROVIDER_DENIED',
    summary: 'The access provider rejected the requested change.',
    retryable: false
  })
  const safeProviderFailures = [
    ['PROVIDER_REQUEST_INVALID', false],
    ['PROVIDER_AUTHENTICATION_FAILED', false],
    ['PROVIDER_FORBIDDEN', false],
    ['PROVIDER_SCOPE_MISSING', false],
    ['PROVIDER_CONFLICT', false],
    ['PROVIDER_RATE_LIMITED', true],
    ['PROVIDER_UPSTREAM_5XX', true],
    ['PROVIDER_TIMEOUT', true],
    ['PROVIDER_NETWORK_FAILURE', true],
    ['PROVIDER_RESPONSE_INVALID', false]
  ]
  for (const [code, retryable] of safeProviderFailures) {
    const safe = safeProvisioningFailure(Object.assign(new Error('private provider detail'), { code }))
    assert.equal(safe.code, code)
    assert.equal(safe.retryable, retryable)
    assert.equal(safe.summary.includes('private provider detail'), false)
  }
  assert.deepEqual(safeProvisioningFailure(new Error('token=must-not-leak')), {
    code: 'PROVISIONING_FAILED',
    summary: 'The access change could not be completed.',
    retryable: false
  })

  const completedPayloads = []
  const workerState = new Set()
  const processed = await processOneAccessOperation({
    capClient: {
      claimNextAccessOperation: async () => ({
        operationID: '11111111-1111-4111-8111-111111111111',
        operationType: 'PROVISION',
        targetEmail: 'controlled@example.invalid',
        identityOrigin: 'sap.default',
        identityIssuer: 'https://issuer.example.invalid',
        identitySubject: 'stable-subject',
        identityPlatformUserId: '11111111-1111-4111-8111-111111111112',
        desiredBusinessRole: 'TESTER',
        desiredUserAdmin: false,
        leaseToken: 'f'.repeat(64)
      }),
      completeAccessOperation: async payload => { completedPayloads.push(payload); return { status: 'ACTIVE' } }
    },
    providerFactory: {
      forIdentity: ({ origin, issuer, email, subject, platformUserId }) => {
        assert.deepEqual({ origin, issuer, email, subject, platformUserId }, {
          origin: 'sap.default',
          issuer: 'https://issuer.example.invalid',
          email: 'controlled@example.invalid',
          subject: 'stable-subject',
          platformUserId: '11111111-1111-4111-8111-111111111112'
        })
        return {
          listRoleCollections: async () => [...workerState],
          assignRoleCollection: async name => workerState.add(name),
          unassignRoleCollection: async name => workerState.delete(name)
        }
      }
    }
  })
  assert.deepEqual(processed, { processed: true, status: 'ACTIVE' })
  assert.equal(completedPayloads.length, 1)
  assert.equal(completedPayloads[0].resultCode, 'APPLIED')
  assert.equal(completedPayloads[0].safeCode, 'ROLE_COLLECTIONS_VERIFIED')
  assert.equal('targetEmail' in completedPayloads[0], false)
  assert.equal('identitySubject' in completedPayloads[0], false)

  const sameSubjectDifferentIssuer = new Set()
  const identityTuples = []
  for (const issuer of ['https://issuer-a.example.invalid', 'https://issuer-b.example.invalid']) {
    await processOneAccessOperation({
      capClient: {
        claimNextAccessOperation: async () => ({
          operationID: issuer.includes('issuer-a')
            ? '33333333-3333-4333-8333-333333333333'
            : '44444444-4444-4444-8444-444444444444',
          operationType: 'PROVISION',
          targetEmail: 'controlled@example.invalid',
          identityOrigin: 'sap.default',
          identityIssuer: issuer,
          identitySubject: 'same-subject',
          identityPlatformUserId: issuer.includes('issuer-a')
            ? '33333333-3333-4333-8333-333333333334'
            : '44444444-4444-4444-8444-444444444445',
          desiredBusinessRole: 'TESTER',
          desiredUserAdmin: false,
          leaseToken: 'd'.repeat(64)
        }),
        completeAccessOperation: async () => ({ status: 'ACTIVE' })
      },
      providerFactory: {
        forIdentity: tuple => {
          identityTuples.push(tuple)
          return {
            listRoleCollections: async () => [...sameSubjectDifferentIssuer],
            assignRoleCollection: async name => sameSubjectDifferentIssuer.add(name),
            unassignRoleCollection: async name => sameSubjectDifferentIssuer.delete(name)
          }
        }
      }
    })
  }
  assert.notEqual(identityTuples[0].issuer, identityTuples[1].issuer)

  const factoryFailureCompletions = []
  const factoryFailure = await processOneAccessOperation({
    capClient: {
      claimNextAccessOperation: async () => ({
        operationID: '22222222-2222-4222-8222-222222222222',
        operationType: 'PROVISION',
        targetEmail: 'controlled@example.invalid',
        identityOrigin: 'sap.default',
        identityIssuer: 'https://issuer.example.invalid',
        identitySubject: 'stable-subject',
        identityPlatformUserId: '22222222-2222-4222-8222-222222222223',
        desiredBusinessRole: 'TESTER',
        desiredUserAdmin: false,
        leaseToken: 'e'.repeat(64)
      }),
      completeAccessOperation: async payload => { factoryFailureCompletions.push(payload); return { status: 'BLOCKED_MANUAL_REVIEW' } }
    },
    providerFactory: {
      forIdentity: () => { throw Object.assign(new Error('private provider setup detail'), { code: 'PROVIDER_UNAVAILABLE' }) }
    }
  })
  assert.deepEqual(factoryFailure, { processed: true, status: 'BLOCKED_MANUAL_REVIEW' })
  assert.equal(factoryFailureCompletions.length, 1)
  assert.equal(factoryFailureCompletions[0].resultCode, 'RETRYABLE_FAILURE')
  assert.equal(factoryFailureCompletions[0].safeCode, 'PROVIDER_UNAVAILABLE')

  let ambiguousCompletionCount = 0
  const ambiguousProviderState = new Set()
  await assert.rejects(processOneAccessOperation({
    capClient: {
      claimNextAccessOperation: async () => ({
        operationID: '55555555-5555-4555-8555-555555555555',
        operationType: 'PROVISION',
        targetEmail: 'controlled@example.invalid',
        identityOrigin: 'sap.default',
        identityIssuer: 'https://issuer.example.invalid',
        identitySubject: 'stable-subject',
        identityPlatformUserId: '55555555-5555-4555-8555-555555555556',
        desiredBusinessRole: 'TESTER',
        desiredUserAdmin: false,
        leaseToken: 'c'.repeat(64)
      }),
      completeAccessOperation: async () => {
        ambiguousCompletionCount += 1
        throw Object.assign(new Error('private CAP completion transport detail'), { code: 'CAP_COMPLETION_UNAVAILABLE' })
      }
    },
    providerFactory: {
      forIdentity: () => ({
        listRoleCollections: async () => [...ambiguousProviderState],
        assignRoleCollection: async name => ambiguousProviderState.add(name),
        unassignRoleCollection: async name => ambiguousProviderState.delete(name)
      })
    }
  }), error => error?.code === 'CAP_COMPLETION_UNAVAILABLE')
  assert.equal(ambiguousCompletionCount, 1, 'an ambiguous success completion must never be rewritten as a failure completion')

  const service = fs.readFileSync(path.join(__dirname, '../../srv/user-admin.cds'), 'utf8')
  const schema = fs.readFileSync(path.join(__dirname, '../../db/schema.cds'), 'utf8')
  const security = JSON.parse(fs.readFileSync(path.join(__dirname, '../../xs-security.json'), 'utf8'))
  assert.match(service, /action approveProvisioning\(/)
  assert.match(service, /action requestRoleChange\(/)
  assert.match(service, /action requestRevoke\(/)
  assert.match(service, /action retryAccessOperation\(/)
  assert.match(service, /action reconcileAccessOperation\(/)
  assert.match(service, /type DeveloperProfileInput/)
  assert.match(service, /responsibilities\s*:\s*array of DeveloperResponsibilityInput/)
  assert.match(service, /action readDeveloperProfile\(/)
  assert.match(service, /action updateDeveloperProfile\(/)
  assert.match(service, /entity ApplicationComponents as projection on db\.ApplicationComponents/)
  assert.match(service, /entity DefectCategories as projection on db\.DefectCategories/)
  assert.match(schema, /entity UserAccessOperations/)
  assert.match(schema, /entity UserIdentityAuditEvents/)
  assert.match(schema, /entity UserOnboardingDeveloperProfiles/)
  assert.match(schema, /entity UserOnboardingDeveloperResponsibilities/)
  assert.match(schema, /entity DeveloperProfileAdministrationStates/)
  assert.doesNotMatch(schema, /developerAvailabilityStatus\s*:/)
  assert.doesNotMatch(schema, /developerWorkloadLimit\s*:/)
  const developerProfiles = schema.match(/entity DeveloperProfiles[\s\S]*?\n}/)?.[0] || ''
  assert.doesNotMatch(developerProfiles, /administrationVersion/)
  assert.deepEqual(
    security.scopes.find(scope => scope.name === '$XSAPPNAME.ProvisioningBroker')?.['grant-as-authority-to-apps'],
    ['$XSAPPNAME(application,idts-user-access-broker)']
  )
  assert.equal(security['role-templates'].some(template => template.name === 'ProvisioningBroker'), false)

  console.log('IDTS user access provisioning contract: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
