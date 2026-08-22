'use strict'

const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const readSource = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')

const IDS = Object.freeze({
  administrator: '82000000-0000-4000-8000-000000000001',
  targetDeveloper: '82000000-0000-4000-8000-000000000002',
  concurrentTarget: '82000000-0000-4000-8000-000000000003',
  partialTarget: '82000000-0000-4000-8000-000000000004',
  testerTarget: '82000000-0000-4000-8000-000000000005',
  pmTarget: '82000000-0000-4000-8000-000000000006',
  inactiveTarget: '82000000-0000-4000-8000-000000000007',
  linkedTarget: '82000000-0000-4000-8000-000000000008',
  nonLegacyTarget: '82000000-0000-4000-8000-000000000009',
  staleTarget: '82000000-0000-4000-8000-000000000012',
  emailCollisionUser: '82000000-0000-4000-8000-000000000013',
  verificationInactiveTarget: '82000000-0000-4000-8000-000000000041',
  verificationPartialTarget: '82000000-0000-4000-8000-000000000042',
  verificationRoleTarget: '82000000-0000-4000-8000-000000000043',
  verificationPmTarget: '82000000-0000-4000-8000-000000000044',
  verificationEmailTarget: '82000000-0000-4000-8000-000000000045',
  verificationIdentityTarget: '82000000-0000-4000-8000-000000000046',
  profile: '82000000-0000-4000-8000-000000000010',
  responsibility: '82000000-0000-4000-8000-000000000011',
  component: '82000000-0000-4000-8000-000000000020',
  defectCategory: '82000000-0000-4000-8000-000000000021',
  componentCategory: '82000000-0000-4000-8000-000000000022',
  bug: '82000000-0000-4000-8000-000000000030',
  comment: '82000000-0000-4000-8000-000000000031'
})

const TARGET_EMAIL = 'linked.developer@example.invalid'
const FIXTURE_NOW = new Date('2026-08-22T08:00:00.000Z')
const CORRELATION_MISMATCH_OPERATION_ID = '82000000-0000-4000-8000-000000000047'

function fixtureSigningKey () {
  return `fixture-signing-key-${'x'.repeat(40)}`
}

function fixtureHash (value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex')
}

function extractNamedBlock (source, kind, name) {
  const start = source.search(new RegExp(`\\b${kind}\\s+${name}\\b`))
  if (start < 0) return ''
  const open = source.indexOf('{', start)
  if (open < 0) return ''

  let depth = 0
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    if (source[index] === '}') depth -= 1
    if (depth === 0) return source.slice(start, index + 1)
  }
  return ''
}

function fixtureXsuaaUser (cds, email) {
  return new cds.User({
    id: 'fixture-sap-login',
    roles: ['authenticated-user'],
    attr: { email },
    authInfo: {
      token: {
        origin: 'fixture-origin',
        issuer: 'https://issuer.example.invalid',
        payload: {
          user_id: 'fixture-platform-user',
          user_uuid: 'fixture-subject',
          sub: 'fixture-subject'
        }
      }
    }
  })
}

async function main () {
  const schema = readSource('db/schema.cds')
  const service = readSource('srv/user-admin.cds')
  const provisioning = readSource('srv/provisioning-broker.js')
  const accessProvisioning = readSource('broker/lib/access-provisioning.js')

  assert.match(schema, /linkTargetUser\s*:\s*Association to Users/, 'missing existing-user link target association')
  assert.match(schema, /linkSourceEmailNormalized\s*:\s*String\(255\)/, 'missing existing-user source email snapshot')
  assert.match(service, /action requestExistingUserIdentityLink\([\s\S]*userID\s*:\s*UUID[\s\S]*email\s*:\s*String\(255\)/, 'missing existing-user identity-link action')
  assert.match(provisioning, /operation\.operationType === 'LINK_EXISTING'/, 'missing LINK_EXISTING provisioning branch')
  assert.match(provisioning, /request\.correlationId\s*!==\s*operation\.correlationId/, 'existing link completion must bind request and operation correlation')
  assert.match(provisioning, /const lockedUsers = await tx\.run\([\s\S]*SELECT\.from\('idts\.cap\.Users'\)[\s\S]*\.forUpdate\(\)/, 'existing link completion must lock Users before collision checks')
  assert.match(accessProvisioning, /'LINK_EXISTING'/, 'missing read-only LINK_EXISTING broker contract')

  const publicDeclarations = [
    ['OnboardingResult', extractNamedBlock(service, 'type', 'OnboardingResult')],
    ['OnboardingRequestSummary', extractNamedBlock(service, 'type', 'OnboardingRequestSummary')],
    ['OnboardingRequests', extractNamedBlock(service, 'entity', 'OnboardingRequests')]
  ]
  for (const [name, declaration] of publicDeclarations) {
    assert.ok(declaration, `missing public declaration: ${name}`)
    assert.doesNotMatch(
      declaration,
      /linkTargetUser|linkSourceEmailNormalized|identityOrigin|identityIssuer|identitySubject|identityPlatformUserId|identityKeyHash/,
      `${name} exposes identity-link internals`
    )
  }

  await runEphemeralBehavioralContract()

  console.log('Gate 3B existing-user identity-link contract: PASS')
}

async function runEphemeralBehavioralContract () {
  let cds
  try {
    cds = require('@sap/cds')
  } catch {
    throw new Error('EPHEMERAL_SQLITE_FIXTURE_UNAVAILABLE: CAP runtime dependency is not materialized')
  }

  let db
  try {
    db = await cds.deploy('db').to('sqlite::memory:')
  } catch {
    throw new Error('EPHEMERAL_SQLITE_FIXTURE_UNAVAILABLE: CAP SQLite deployment could not start')
  }

  const previousDb = cds.db
  const previousIdts = cds.env.idts
  const previousAuth = cds.env.requires?.auth
  cds.db = db
  cds.env.idts = {
    ...(previousIdts || {}),
    userAdmin: {
      ...((previousIdts && previousIdts.userAdmin) || {}),
      invitationSigningKey: fixtureSigningKey(),
      invitationTtlMinutes: 60,
      invitationBaseUrl: 'https://idts.example.invalid/onboarding/continue'
    }
  }

  try {
    await seedFixture(cds, db)
    const requestContext = await assertExistingLinkRequest(cds, db)
    const verifiedContext = await assertExistingLinkVerification(cds, db, requestContext)
    await assertReadOnlyProviderContract()
    await assertAtomicCompletion(cds, db, verifiedContext)
    await assertAssignmentReadinessContract(db)
  } finally {
    cds.env.requires.auth = previousAuth
    cds.env.idts = previousIdts
    if (previousDb === undefined) delete cds.db
    else cds.db = previousDb
    if (typeof db.disconnect === 'function') await db.disconnect()
  }
}

async function seedFixture (cds, db) {
  const { INSERT } = cds.ql
  await db.run(INSERT.into('idts.cap.UserRoles').entries([
    { code: 'PM', name: 'Project Manager', active: true },
    { code: 'DEVELOPER', name: 'Developer', active: true },
    { code: 'TESTER', name: 'Tester', active: true }
  ]))
  await db.run(INSERT.into('idts.cap.UserOnboardingStatuses').entries([
    'INVITED', 'PROVISION_QUEUED', 'PROVISIONING', 'ACTIVE'
  ].map(code => ({ code, name: code, active: true }))))
  await db.run(INSERT.into('idts.cap.NotificationDeliveryStatuses').entries([
    { code: 'PENDING', name: 'Pending', active: true }
  ]))
  await db.run(INSERT.into('idts.cap.AvailabilityStatuses').entries([
    { code: 'AVAILABLE', name: 'Available', active: true, criticality: 1 }
  ]))
  await db.run(INSERT.into('idts.cap.ResponsibilityLevels').entries([
    { code: 'PRIMARY', name: 'Primary', active: true }
  ]))
  await db.run(INSERT.into('idts.cap.StatusValues').entries([
    { code: 'ASSIGNED', name: 'Assigned', active: true }
  ]))
  await db.run(INSERT.into('idts.cap.PriorityValues').entries([
    { code: 'MEDIUM', name: 'Medium', active: true }
  ]))
  await db.run(INSERT.into('idts.cap.SeverityValues').entries([
    { code: 'MEDIUM', name: 'Medium', active: true }
  ]))
  await db.run(INSERT.into('idts.cap.ApplicationComponents').entries({
    ID: IDS.component,
    code: 'FIXTURE_COMPONENT',
    name: 'Fixture Component',
    active: true
  }))
  await db.run(INSERT.into('idts.cap.DefectCategories').entries({
    ID: IDS.defectCategory,
    code: 'FIXTURE_CATEGORY',
    name: 'Fixture Category',
    active: true
  }))
  await db.run(INSERT.into('idts.cap.ComponentCategories').entries({
    ID: IDS.componentCategory,
    component_ID: IDS.component,
    defectCategory_ID: IDS.defectCategory,
    active: true
  }))
  await db.run(INSERT.into('idts.cap.Users').entries([
    {
      ID: IDS.administrator,
      displayName: 'Fixture Administrator',
      email: 'fixture.pm@example.invalid',
      role_code: 'PM',
      active: true
    },
    {
      ID: IDS.targetDeveloper,
      displayName: 'Fixture Legacy Developer',
      email: 'legacy.developer@example.local',
      role_code: 'DEVELOPER',
      active: true
    },
    {
      ID: IDS.concurrentTarget,
      displayName: 'Fixture Concurrent Developer',
      email: 'concurrent.developer@example.local',
      role_code: 'DEVELOPER',
      active: true
    },
    {
      ID: IDS.partialTarget,
      displayName: 'Fixture Partial Developer',
      email: 'partial.developer@example.local',
      role_code: 'DEVELOPER',
      externalIdentityOrigin: 'fixture-origin',
      active: true
    },
    {
      ID: IDS.testerTarget,
      displayName: 'Fixture Legacy Tester',
      email: 'legacy.tester@example.local',
      role_code: 'TESTER',
      active: true
    },
    {
      ID: IDS.pmTarget,
      displayName: 'Fixture PM Target',
      email: 'legacy.pm@example.local',
      role_code: 'PM',
      active: true
    },
    {
      ID: IDS.inactiveTarget,
      displayName: 'Fixture Inactive Developer',
      email: 'inactive.developer@example.local',
      role_code: 'DEVELOPER',
      active: false
    },
    {
      ID: IDS.linkedTarget,
      displayName: 'Fixture Linked Developer',
      email: 'linked.developer@example.invalid',
      role_code: 'DEVELOPER',
      externalIdentityOrigin: 'fixture-origin',
      externalIdentityIssuer: 'fixture-issuer',
      externalIdentitySubject: 'fixture-subject',
      externalIdentityKeyHash: fixtureHash('fixture-linked'),
      active: true
    },
    {
      ID: IDS.nonLegacyTarget,
      displayName: 'Fixture Nonlegacy Developer',
      email: 'nonlegacy.developer@example.invalid',
      role_code: 'DEVELOPER',
      active: true
    },
    {
      ID: IDS.staleTarget,
      displayName: 'Fixture Stale Legacy Developer',
      email: 'stale.developer@example.local',
      role_code: 'DEVELOPER',
      active: true
    },
    {
      ID: IDS.emailCollisionUser,
      displayName: 'Fixture Email Collision',
      email: 'reserved.identity@example.invalid',
      role_code: 'TESTER',
      active: true
    },
    {
      ID: IDS.verificationInactiveTarget,
      displayName: 'Fixture Verification Inactive Target',
      email: 'verification.inactive@example.local',
      role_code: 'DEVELOPER',
      active: true
    },
    {
      ID: IDS.verificationPartialTarget,
      displayName: 'Fixture Verification Partial Target',
      email: 'verification.partial@example.local',
      role_code: 'DEVELOPER',
      active: true
    },
    {
      ID: IDS.verificationRoleTarget,
      displayName: 'Fixture Verification Role Target',
      email: 'verification.role@example.local',
      role_code: 'TESTER',
      active: true
    },
    {
      ID: IDS.verificationPmTarget,
      displayName: 'Fixture Verification PM Target',
      email: 'verification.pm@example.local',
      role_code: 'DEVELOPER',
      active: true
    },
    {
      ID: IDS.verificationEmailTarget,
      displayName: 'Fixture Verification Email Target',
      email: 'verification.email@example.local',
      role_code: 'DEVELOPER',
      active: true
    },
    {
      ID: IDS.verificationIdentityTarget,
      displayName: 'Fixture Verification Identity Target',
      email: 'verification.identity@example.local',
      role_code: 'DEVELOPER',
      active: true
    }
  ]))
  await db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries({
    ID: '82000000-0000-4000-8000-000000000014',
    targetEmailNormalized: 'stale.invitation@example.invalid',
    linkTargetUser_ID: IDS.staleTarget,
    linkSourceEmailNormalized: 'stale.developer@example.local',
    openRequestKey: fixtureHash(JSON.stringify(['LINK_EXISTING', IDS.staleTarget])),
    requestedRole_code: 'DEVELOPER',
    userAdminRequested: false,
    status_code: 'INVITED',
    requestedBy_ID: IDS.administrator,
    expiresAt: '2026-08-22T07:00:00.000Z',
    tokenNonce: 'fixture-stale-nonce',
    tokenHash: fixtureHash('fixture-stale-token'),
    correlationId: '82000000-0000-4000-8000-000000000015'
  }))
  await db.run(INSERT.into('idts.cap.DeveloperProfiles').entries({
    ID: IDS.profile,
    user_ID: IDS.targetDeveloper,
    availabilityStatus_code: 'AVAILABLE',
    workloadLimit: 3,
    active: true
  }))
  await db.run(INSERT.into('idts.cap.DeveloperResponsibilities').entries({
    ID: IDS.responsibility,
    developerProfile_ID: IDS.profile,
    componentCategory_ID: IDS.componentCategory,
    responsibilityLevel_code: 'PRIMARY',
    active: true
  }))
  await db.run(INSERT.into('idts.cap.Bugs').entries({
    ID: IDS.bug,
    bugNumber: 'FIXTURE-001',
    title: 'Fixture bug',
    description: 'Fixture description',
    status_code: 'ASSIGNED',
    priority_code: 'MEDIUM',
    severity_code: 'MEDIUM',
    stepsToReproduce: 'Fixture steps',
    actualResult: 'Fixture actual result',
    expectedResult: 'Fixture expected result',
    applicationComponent_ID: IDS.component,
    defectCategory_ID: IDS.defectCategory,
    componentCategory_ID: IDS.componentCategory,
    reporter_ID: IDS.administrator,
    retestOwner_ID: IDS.administrator,
    assignee_ID: IDS.profile
  }))
  await db.run(INSERT.into('idts.cap.Comments').entries({
    ID: IDS.comment,
    bug_ID: IDS.bug,
    author_ID: IDS.administrator,
    authorRole_code: 'PM',
    content: 'Fixture comment'
  }))
}

async function assertExistingLinkRequest (cds, db) {
  const { SELECT } = cds.ql
  const service = await cds.serve('UserAdministrationService').from('srv/user-admin.cds')
  const administrator = new cds.User({
    id: 'fixture.pm@example.invalid',
    roles: ['authenticated-user', 'PM', 'UserAdmin']
  })
  const originalSpawn = cds.spawn
  cds.spawn = () => ({ on () { return this } })
  try {
    const created = await service.send({
      event: 'requestExistingUserIdentityLink',
      data: { userID: IDS.targetDeveloper, email: TARGET_EMAIL },
      user: administrator,
      timestamp: FIXTURE_NOW
    })
    assert.equal(created.status, 'INVITED', 'existing-user link request must start as INVITED')
    assert.equal(created.requestedRole, 'DEVELOPER', 'link request must derive the target role')
    assert.equal(Object.hasOwn(created, 'identitySubject'), false, 'public result exposes identity subject')
    assert.deepEqual(Object.keys(created).sort(), [
      'ID', 'correlationId', 'expiresAt', 'provisionedAt', 'provisioningVersion',
      'requestedRole', 'revokedAt', 'status', 'targetEmail', 'userAdminRequested', 'verifiedAt'
    ].sort(), 'link result must remain the standard safe onboarding result')

    const request = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: created.ID }))
    assert.equal(request.linkTargetUser_ID, IDS.targetDeveloper, 'request must target the selected existing user')
    assert.equal(request.linkSourceEmailNormalized, 'legacy.developer@example.local', 'request must snapshot the legacy email')
    assert.equal(request.requestedRole_code, 'DEVELOPER', 'request must persist the server-derived role')

    const delivery = await db.run(SELECT.from('idts.cap.UserOnboardingDeliveries').where({ onboardingRequest_ID: request.ID }))
    assert.equal(delivery.length, 1, 'link request must create one delivery')
    assert.equal(delivery[0].templateKey, 'IDTS_EXISTING_USER_IDENTITY_LINK_V1', 'link request must use the link template')

    const expectLinkRejected = async ({ user, userID, email, code }) => {
      await assert.rejects(
        () => service.send({
          event: 'requestExistingUserIdentityLink',
          data: { userID, email },
          user,
          timestamp: FIXTURE_NOW
        }),
        error => error?.code === code &&
          !String(error?.message || '').includes(email) &&
          !/fixture-origin|fixture-subject|fixture-platform-user/.test(String(error?.message || '')),
        `link request must reject safely with ${code}`
      )
    }

    for (const user of [
      new cds.User({ id: 'fixture.anonymous', roles: ['authenticated-user'] }),
      new cds.User({ id: 'fixture.tester', roles: ['authenticated-user', 'TESTER'] }),
      new cds.User({ id: 'fixture.developer', roles: ['authenticated-user', 'DEVELOPER'] }),
      new cds.User({ id: 'fixture.pm', roles: ['authenticated-user', 'PM'] }),
      new cds.User({ id: 'fixture.multi-role', roles: ['authenticated-user', 'PM', 'TESTER', 'UserAdmin'] })
    ]) {
      await expectLinkRejected({
        user,
        userID: IDS.testerTarget,
        email: 'unauthorized.link@example.invalid',
        code: 'USER_ADMIN_REQUIRED'
      })
    }

    const requestCountBeforeInvalidEmail = (await db.run(SELECT.from('idts.cap.UserOnboardingRequests'))).length
    await expectLinkRejected({
      user: administrator,
      userID: IDS.testerTarget,
      email: 'not-an-email',
      code: 'INVALID_INVITATION_EMAIL'
    })
    assert.equal(
      (await db.run(SELECT.from('idts.cap.UserOnboardingRequests'))).length,
      requestCountBeforeInvalidEmail,
      'invalid link email must not insert a request'
    )

    await expectLinkRejected({ user: administrator, userID: '82000000-0000-4000-8000-000000000099', email: 'missing.target@example.invalid', code: 'IDENTITY_LINK_TARGET_NOT_FOUND' })
    await expectLinkRejected({ user: administrator, userID: IDS.pmTarget, email: 'pm.target@example.invalid', code: 'IDENTITY_LINK_TARGET_ROLE_INVALID' })
    await expectLinkRejected({ user: administrator, userID: IDS.inactiveTarget, email: 'inactive.target@example.invalid', code: 'IDENTITY_LINK_TARGET_INACTIVE' })
    await expectLinkRejected({ user: administrator, userID: IDS.partialTarget, email: 'partial.target@example.invalid', code: 'IDENTITY_LINK_TARGET_IDENTITY_CONFLICT' })
    await expectLinkRejected({ user: administrator, userID: IDS.linkedTarget, email: 'linked.target@example.invalid', code: 'IDENTITY_LINK_TARGET_ALREADY_LINKED' })
    await expectLinkRejected({ user: administrator, userID: IDS.nonLegacyTarget, email: 'nonlegacy.target@example.invalid', code: 'IDENTITY_LINK_TARGET_NOT_LEGACY' })
    await expectLinkRejected({ user: administrator, userID: IDS.testerTarget, email: 'RESERVED.IDENTITY@EXAMPLE.INVALID', code: 'EMAIL_RECONCILIATION_REQUIRED' })

    const testerCreated = await service.send({
      event: 'requestExistingUserIdentityLink',
      data: { userID: IDS.testerTarget, email: 'linked.tester@example.invalid' },
      user: administrator,
      timestamp: FIXTURE_NOW
    })
    assert.equal(testerCreated.requestedRole, 'TESTER', 'link request must derive the legacy Tester role')
    assert.equal(testerCreated.userAdminRequested, false, 'existing-user link must never request UserAdmin')

    const staleCreated = await service.send({
      event: 'requestExistingUserIdentityLink',
      data: { userID: IDS.staleTarget, email: 'stale.replacement@example.invalid' },
      user: administrator,
      timestamp: FIXTURE_NOW
    })
    const staleRequest = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: '82000000-0000-4000-8000-000000000014' }))
    assert.equal(staleRequest.status_code, 'FAILED', 'expired link invitation must be closed before reinviting')
    assert.equal(staleRequest.openRequestKey, null, 'expired link invitation must release its target lock')
    assert.equal(staleCreated.requestedRole, 'DEVELOPER', 'reinvitation must still derive the target role')

    const concurrent = await Promise.allSettled([
      service.send({
        event: 'requestExistingUserIdentityLink',
        data: { userID: IDS.concurrentTarget, email: 'concurrent.one@example.invalid' },
        user: administrator,
        timestamp: FIXTURE_NOW
      }),
      service.send({
        event: 'requestExistingUserIdentityLink',
        data: { userID: IDS.concurrentTarget, email: 'concurrent.two@example.invalid' },
        user: administrator,
        timestamp: FIXTURE_NOW
      })
    ])
    assert.equal(concurrent.filter(result => result.status === 'fulfilled').length, 1, 'concurrent link requests must create one winner')
    assert.equal(concurrent.filter(result => result.status === 'rejected').length, 1, 'concurrent link requests must reject one loser')
    assert.equal(concurrent.find(result => result.status === 'rejected').reason?.code, 'EXISTING_IDENTITY_LINK_ALREADY_OPEN',
      'concurrent link loser must use the safe existing-link-open code')
    const concurrentRequests = await db.run(SELECT.from('idts.cap.UserOnboardingRequests').where({ linkTargetUser_ID: IDS.concurrentTarget }))
    assert.equal(concurrentRequests.length, 1, 'concurrent link requests must persist one request')
    const concurrentDeliveries = await db.run(SELECT.from('idts.cap.UserOnboardingDeliveries').where({ onboardingRequest_ID: concurrentRequests[0].ID }))
    assert.equal(concurrentDeliveries.length, 1, 'concurrent link requests must persist one delivery')

    return { service, request }
  } finally {
    cds.spawn = originalSpawn
  }
}

async function assertExistingLinkVerification (cds, db, { service, request }) {
  const { SELECT, UPDATE } = cds.ql
  const { createInvitationToken } = require('../../srv/user-admin/invitations')
  const { identityKeyHash } = require('../../srv/auth/identity-map')
  const administrator = new cds.User({
    id: 'fixture.pm@example.invalid',
    roles: ['authenticated-user', 'PM', 'UserAdmin']
  })
  const prepareVerification = async (userID, email) => {
    const created = await service.send({
      event: 'requestExistingUserIdentityLink',
      data: { userID, email },
      user: administrator,
      timestamp: FIXTURE_NOW
    })
    const staged = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: created.ID }))
    return {
      request: staged,
      token: createInvitationToken({
        invitationID: staged.ID,
        targetEmail: email,
        expiresAt: staged.expiresAt,
        signingKey: fixtureSigningKey(),
        nonce: staged.tokenNonce
      }).token,
      email
    }
  }
  const assertRejectedWithoutWrites = async ({ request: staged, token, email }, code) => {
    let rejection
    await assert.rejects(
      () => service.send({
        event: 'verifySapIdentity',
        data: { token },
        user: fixtureXsuaaUser(cds, email),
        timestamp: FIXTURE_NOW
      }),
      error => {
        rejection = error
        return error?.code === code
      },
      `verification must fail closed with ${code}`
    )
    const safeMessage = String(rejection?.message || '')
    for (const privateValue of [
      email,
      'changed.source@example.local',
      'legacy.developer@example.local',
      'https://issuer.example.invalid',
      'fixture-origin',
      'fixture-subject',
      'fixture-platform-user',
      token,
      fixtureHash('fixture-linked')
    ]) {
      assert.equal(safeMessage.includes(privateValue), false, `${code} must not expose private identity material`)
    }
    const after = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: staged.ID }))
    const operation = await db.run(SELECT.one.from('idts.cap.UserAccessOperations').where({ onboardingRequest_ID: staged.ID }))
    const audits = await db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({
      onboardingRequest_ID: staged.ID,
      action: 'QUEUE_LINK_EXISTING'
    }))
    assert.equal(after.status_code, 'INVITED', `${code} must leave the invitation state unchanged`)
    assert.equal(after.consumedAt, null, `${code} must not consume the invitation`)
    assert.equal(operation, undefined, `${code} must not queue an operation`)
    assert.equal(audits.length, 0, `${code} must not append a queue audit`)
  }

  const staleSource = await prepareVerification(IDS.staleTarget, 'verification.stale@example.invalid')
  await db.run(UPDATE('idts.cap.Users').set({ email: 'changed.source@example.local' }).where({ ID: IDS.staleTarget }))
  await assertRejectedWithoutWrites(staleSource, 'IDENTITY_LINK_TARGET_CHANGED')

  const changedRole = await prepareVerification(IDS.verificationRoleTarget, 'verification.role@example.invalid')
  await db.run(UPDATE('idts.cap.Users').set({ role_code: 'DEVELOPER' }).where({ ID: IDS.verificationRoleTarget }))
  await assertRejectedWithoutWrites(changedRole, 'IDENTITY_LINK_TARGET_CHANGED')

  const inactive = await prepareVerification(IDS.verificationInactiveTarget, 'verification.inactive@example.invalid')
  await db.run(UPDATE('idts.cap.Users').set({ active: false }).where({ ID: IDS.verificationInactiveTarget }))
  await assertRejectedWithoutWrites(inactive, 'IDENTITY_LINK_TARGET_CHANGED')

  const partialIdentity = await prepareVerification(IDS.verificationPartialTarget, 'verification.partial@example.invalid')
  for (const [field, value] of [
    ['externalIdentityOrigin', 'another-origin'],
    ['externalIdentityIssuer', 'https://another-issuer.example.invalid'],
    ['externalIdentitySubject', 'another-subject'],
    ['externalIdentityKeyHash', fixtureHash('another-identity')]
  ]) {
    await db.run(UPDATE('idts.cap.Users').set({ [field]: value }).where({ ID: IDS.verificationPartialTarget }))
    await assertRejectedWithoutWrites(partialIdentity, 'IDENTITY_LINK_TARGET_CHANGED')
    await db.run(UPDATE('idts.cap.Users').set({ [field]: null }).where({ ID: IDS.verificationPartialTarget }))
  }

  const pmTarget = await prepareVerification(IDS.verificationPmTarget, 'verification.pm@example.invalid')
  await db.run(UPDATE('idts.cap.Users').set({ role_code: 'PM' }).where({ ID: IDS.verificationPmTarget }))
  await assertRejectedWithoutWrites(pmTarget, 'IDENTITY_LINK_TARGET_CHANGED')

  const emailCollision = await prepareVerification(IDS.verificationEmailTarget, 'verification.email@example.invalid')
  await db.run(UPDATE('idts.cap.Users').set({ email: emailCollision.email }).where({ ID: IDS.emailCollisionUser }))
  await assertRejectedWithoutWrites(emailCollision, 'EMAIL_RECONCILIATION_REQUIRED')
  await db.run(UPDATE('idts.cap.Users').set({ email: 'reserved.identity@example.invalid' }).where({ ID: IDS.emailCollisionUser }))

  const identityCollision = await prepareVerification(IDS.verificationIdentityTarget, 'verification.identity@example.invalid')
  await db.run(UPDATE('idts.cap.Users').set({
    externalIdentityOrigin: 'fixture-origin',
    externalIdentityIssuer: 'https://issuer.example.invalid',
    externalIdentitySubject: 'fixture-subject',
    externalIdentityKeyHash: identityKeyHash({
      origin: 'fixture-origin',
      issuer: 'https://issuer.example.invalid',
      subject: 'fixture-subject',
      platformUserId: 'fixture-platform-user'
    })
  }).where({ ID: IDS.emailCollisionUser }))
  await assertRejectedWithoutWrites(identityCollision, 'EXTERNAL_IDENTITY_ALREADY_LINKED')
  await db.run(UPDATE('idts.cap.Users').set({
    externalIdentityOrigin: null,
    externalIdentityIssuer: null,
    externalIdentitySubject: null,
    externalIdentityKeyHash: null
  }).where({ ID: IDS.emailCollisionUser }))

  const token = createInvitationToken({
    invitationID: request.ID,
    targetEmail: TARGET_EMAIL,
    expiresAt: request.expiresAt,
    signingKey: fixtureSigningKey(),
    nonce: request.tokenNonce
  }).token
  const verified = await service.send({
    event: 'verifySapIdentity',
    data: { token },
    user: fixtureXsuaaUser(cds, TARGET_EMAIL),
    timestamp: FIXTURE_NOW
  })
  assert.equal(verified.status, 'PROVISION_QUEUED', 'verified link request must queue provisioning')
  assert.equal(verified.provisioningVersion, 2, 'verified link request must use version 2')
  assert.equal(Object.hasOwn(verified, 'identityIssuer'), false, 'verification result exposes identity issuer')

  const persisted = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: request.ID }))
  const operation = await db.run(SELECT.one.from('idts.cap.UserAccessOperations').where({ onboardingRequest_ID: request.ID }))
  assert.equal(persisted.status_code, 'PROVISION_QUEUED', 'verified request state must be queued')
  assert.equal(operation.operationType, 'LINK_EXISTING', 'verification must queue LINK_EXISTING')
  assert.equal(operation.state, 'PENDING', 'verified link operation must start pending')
  assert.equal(operation.expectedVersion, 2, 'verified link operation must use request version 2')
  assert.equal(operation.desiredRole_code, 'DEVELOPER', 'operation role must be server-derived')
  assert.equal(operation.desiredUserAdmin, false, 'existing-user link must not request UserAdmin')
  assert.equal(persisted.correlationId, operation.correlationId, 'verified link request and operation must share exact correlation')

  const audit = await db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({ onboardingRequest_ID: request.ID }))
  assert.equal(audit.some(row => row.action === 'QUEUE_LINK_EXISTING'), true, 'link queue must append the safe queue audit')
  assert.equal(audit.some(row => /@|fixture-origin|fixture-subject/.test(String(row.detailsSummary || ''))), false, 'link queue audit must not contain identity values')

  await assert.rejects(
    () => service.send({
      event: 'verifySapIdentity',
      data: { token },
      user: fixtureXsuaaUser(cds, TARGET_EMAIL),
      timestamp: FIXTURE_NOW
    }),
    error => error?.code === 'INVITATION_ALREADY_USED',
    'a repeated verification token must fail closed'
  )
  return { request: persisted, operation, correlationMismatchRequest: emailCollision.request }
}

async function assertReadOnlyProviderContract () {
  const { executeAccessChange } = require('../../broker/lib/access-provisioning')
  const calls = []
  const provider = {
    listRoleCollections: async () => {
      calls.push('listRoleCollections')
      return ['IDTS_DEVELOPER']
    }
  }
  const result = await executeAccessChange({
    action: 'LINK_EXISTING',
    requestedRole: 'DEVELOPER',
    userAdminRequested: false,
    provider
  })
  assert.deepEqual(result, {
    action: 'LINK_EXISTING',
    changed: [],
    finalRoleCollections: ['IDTS_DEVELOPER']
  }, 'exact existing-user role readback must be a NOOP')
  assert.deepEqual(calls, ['listRoleCollections'], 'LINK_EXISTING must call only listRoleCollections')
  assert.deepEqual(Object.keys(provider), ['listRoleCollections'], 'LINK_EXISTING provider contract must expose no write method')

  for (const roleCollections of [
    [],
    ['IDTS_TESTER'],
    ['IDTS_DEVELOPER', 'IDTS_TESTER'],
    ['IDTS_DEVELOPER', 'IDTS_USER_ADMIN'],
    ['IDTS_DEVELOPER', 'IDTS_DEVELOPER']
  ]) {
    const negativeCalls = []
    await assert.rejects(
      () => executeAccessChange({
        action: 'LINK_EXISTING',
        requestedRole: 'DEVELOPER',
        userAdminRequested: false,
        provider: {
          listRoleCollections: async () => {
            negativeCalls.push('listRoleCollections')
            return roleCollections
          }
        }
      }),
      error => error?.code === (roleCollections.includes('IDTS_USER_ADMIN')
        ? 'USER_ADMIN_REQUIRES_PM'
        : 'PROVISIONING_READBACK_MISMATCH')
    )
    assert.deepEqual(negativeCalls, ['listRoleCollections'], 'LINK_EXISTING mismatch must remain read-only')
  }

}

async function assertAtomicCompletion (cds, db, { request, operation, correlationMismatchRequest }) {
  const { INSERT, SELECT, UPDATE } = cds.ql
  const before = await preservationSnapshot(db)
  const previousAuth = cds.env.requires.auth
  cds.env.requires.auth = { kind: 'xsuaa' }
  try {
    const brokerService = await cds.serve('ProvisioningBrokerService').from('srv/provisioning-broker.cds')
    const brokerUser = new cds.User({ id: 'fixture-broker', roles: ['authenticated-user', 'ProvisioningBroker'] })
    const claim = await brokerService.send({
      event: 'claimNextAccessOperation',
      data: {},
      user: brokerUser,
      timestamp: FIXTURE_NOW
    })
    assert.equal(claim.operationID, operation.ID, 'broker must claim the link operation')
    assert.equal(claim.operationType, 'LINK_EXISTING', 'broker must preserve LINK_EXISTING')

    const completionResults = await Promise.allSettled([
      brokerService.send({
        event: 'completeAccessOperation',
        data: {
          operationID: operation.ID,
          leaseToken: claim.leaseToken,
          resultCode: 'NOOP_ALREADY_DESIRED',
          safeCode: 'ROLE_COLLECTIONS_VERIFIED',
          providerCorrelationHash: null
        },
        user: brokerUser,
        timestamp: FIXTURE_NOW
      }),
      brokerService.send({
        event: 'completeAccessOperation',
        data: {
          operationID: operation.ID,
          leaseToken: claim.leaseToken,
          resultCode: 'NOOP_ALREADY_DESIRED',
          safeCode: 'ROLE_COLLECTIONS_VERIFIED',
          providerCorrelationHash: null
        },
        user: brokerUser,
        timestamp: FIXTURE_NOW
      })
    ])
    assert.equal(completionResults.filter(result => result.status === 'fulfilled').length, 1, 'one concurrent link completion must win')
    assert.equal(completionResults.filter(result => result.status === 'rejected').length, 1, 'one concurrent link completion must reject')
    const completed = completionResults.find(result => result.status === 'fulfilled').value
    assert.equal(completed.status, 'ACTIVE', 'read-only provider proof must activate the link request')

    const after = await preservationSnapshot(db)
    assert.deepEqual(after.userIDs, before.userIDs, 'link completion must not create or replace a user')
    assert.deepEqual(after.user, before.user, 'link completion must preserve display name, role, active state, and password fields')
    assert.equal(after.profileID, before.profileID, 'link completion must preserve Developer Profile ID')
    assert.deepEqual(after.responsibilityIDs, before.responsibilityIDs, 'link completion must preserve responsibility IDs')
    assert.deepEqual(after.bugAssignments, before.bugAssignments, 'link completion must preserve Bug assignees')
    assert.equal(after.commentCount, before.commentCount, 'link completion must preserve comments')
    assert.deepEqual(after.historyEventIDs, before.historyEventIDs, 'link completion must preserve history events')
    assert.deepEqual(after.notificationIDs, before.notificationIDs, 'link completion must preserve notifications')

    const linkedUser = await db.run(SELECT.one.from('idts.cap.Users').where({ ID: IDS.targetDeveloper }))
    const linkedRequest = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: request.ID }))
    const linkedOperation = await db.run(SELECT.one.from('idts.cap.UserAccessOperations').where({ ID: operation.ID }))
    assert.equal(linkedUser.ID, IDS.targetDeveloper, 'link completion must update the selected user row')
    assert.equal(linkedUser.email, TARGET_EMAIL, 'link completion must update the verified contact email')
    assert.equal(linkedUser.externalIdentityKeyHash, linkedRequest.identityKeyHash, 'link completion must persist the verified identity hash')
    assert.equal(linkedRequest.status_code, 'ACTIVE', 'link completion must activate the request')
    assert.equal(linkedRequest.activeUser_ID, IDS.targetDeveloper, 'activeUser must remain the selected user')
    assert.equal(linkedOperation.state, 'SUCCEEDED', 'link completion must succeed the operation')

    const audit = await db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({ operation_ID: operation.ID }))
    assert.equal(audit.some(row => row.action === 'LINK_EXISTING'), true, 'link completion must append LINK_EXISTING audit')

    const mismatchBefore = await db.run(SELECT.one.from('idts.cap.Users').where({ ID: IDS.verificationEmailTarget }))
    await db.run(UPDATE('idts.cap.UserOnboardingRequests').set({
      status_code: 'PROVISION_QUEUED',
      consumedAt: FIXTURE_NOW.toISOString(),
      verifiedAt: FIXTURE_NOW.toISOString(),
      identityOrigin: 'fixture-origin',
      identityIssuer: 'https://issuer.example.invalid',
      identitySubject: 'correlation-mismatch-subject',
      identityPlatformUserId: 'fixture-platform-user',
      identityKeyHash: fixtureHash('correlation-mismatch'),
      identityEmailNormalized: 'verification.email@example.invalid',
      provisioningVersion: 2,
      latestOperation_ID: CORRELATION_MISMATCH_OPERATION_ID,
      correlationId: '82000000-0000-4000-8000-000000000048'
    }).where({ ID: correlationMismatchRequest.ID }))
    await db.run(INSERT.into('idts.cap.UserAccessOperations').entries({
      ID: CORRELATION_MISMATCH_OPERATION_ID,
      onboardingRequest_ID: correlationMismatchRequest.ID,
      operationType: 'LINK_EXISTING',
      state: 'PENDING',
      requestedBy_ID: correlationMismatchRequest.requestedBy_ID,
      idempotencyKey: fixtureHash('correlation-mismatch-operation'),
      expectedVersion: 2,
      desiredRole_code: 'DEVELOPER',
      desiredUserAdmin: false,
      correlationId: '82000000-0000-4000-8000-000000000049',
      attemptCount: 0
    }))
    const mismatchClaim = await brokerService.send({
      event: 'claimNextAccessOperation',
      data: {},
      user: brokerUser,
      timestamp: FIXTURE_NOW
    })
    assert.equal(mismatchClaim.operationID, CORRELATION_MISMATCH_OPERATION_ID, 'mismatch fixture must claim its link operation')
    const mismatchResult = await brokerService.send({
      event: 'completeAccessOperation',
      data: {
        operationID: CORRELATION_MISMATCH_OPERATION_ID,
        leaseToken: mismatchClaim.leaseToken,
        resultCode: 'NOOP_ALREADY_DESIRED',
        safeCode: 'ROLE_COLLECTIONS_VERIFIED',
        providerCorrelationHash: null
      },
      user: brokerUser,
      timestamp: FIXTURE_NOW
    })
    assert.equal(mismatchResult.status, 'BLOCKED_MANUAL_REVIEW', 'correlation mismatch must fail closed')
    const mismatchAfter = await db.run(SELECT.one.from('idts.cap.Users').where({ ID: IDS.verificationEmailTarget }))
    const mismatchRequest = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: correlationMismatchRequest.ID }))
    const mismatchOperation = await db.run(SELECT.one.from('idts.cap.UserAccessOperations').where({ ID: CORRELATION_MISMATCH_OPERATION_ID }))
    const mismatchAudits = await db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({ operation_ID: CORRELATION_MISMATCH_OPERATION_ID }))
    assert.equal(mismatchAfter.email, mismatchBefore.email, 'correlation mismatch must not update the target email')
    assert.equal(mismatchAfter.externalIdentityKeyHash, mismatchBefore.externalIdentityKeyHash, 'correlation mismatch must not materialize identity')
    assert.equal(mismatchRequest.status_code, 'BLOCKED_MANUAL_REVIEW', 'correlation mismatch must block the request')
    assert.equal(mismatchRequest.activeUser_ID, null, 'correlation mismatch must not assign an active user')
    assert.equal(mismatchOperation.state, 'BLOCKED_MANUAL_REVIEW', 'correlation mismatch must block the operation')
    assert.equal(mismatchAudits.some(row => row.toState === 'ACTIVE' || row.result === 'APPLIED'), false, 'correlation mismatch must not append a completion audit')

  } finally {
    cds.env.requires.auth = previousAuth
  }
}

async function preservationSnapshot (db) {
  const { SELECT } = require('@sap/cds').ql
  const users = await db.run(SELECT.from('idts.cap.Users').columns('ID').orderBy('ID asc'))
  const user = await db.run(SELECT.one.from('idts.cap.Users').columns(
    'ID', 'displayName', 'role_code', 'active', 'passwordHash', 'passwordChangedAt'
  ).where({ ID: IDS.targetDeveloper }))
  const profiles = await db.run(SELECT.from('idts.cap.DeveloperProfiles').columns('ID').where({ user_ID: IDS.targetDeveloper }))
  const responsibilities = await db.run(SELECT.from('idts.cap.DeveloperResponsibilities').columns('ID').where({ developerProfile_ID: IDS.profile }).orderBy('ID asc'))
  const bugs = await db.run(SELECT.from('idts.cap.Bugs').columns('ID', 'assignee_ID').orderBy('ID asc'))
  const comments = await db.run(SELECT.from('idts.cap.Comments').columns('ID').where({ bug_ID: IDS.bug }))
  const historyEvents = await db.run(SELECT.from('idts.cap.HistoryEvents').columns('ID').where({ bug_ID: IDS.bug }))
  const notifications = await db.run(SELECT.from('idts.cap.Notifications').columns('ID').where({ recipient_ID: IDS.targetDeveloper }))
  return {
    userIDs: users.map(row => row.ID),
    user,
    profileID: profiles[0]?.ID || null,
    responsibilityIDs: responsibilities.map(row => row.ID),
    bugAssignments: bugs.map(row => ({ ID: row.ID, assignee_ID: row.assignee_ID })),
    commentCount: comments.length,
    historyEventIDs: historyEvents.map(row => row.ID),
    notificationIDs: notifications.map(row => row.ID)
  }
}

async function assertAssignmentReadinessContract (db) {
  const { SELECT } = require('@sap/cds').ql
  const { hasActiveIdentityAccess } = require('../../srv/access/identity-readiness')
  const user = await db.run(SELECT.one.from('idts.cap.Users').where({ ID: IDS.targetDeveloper }))
  const request = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ linkTargetUser_ID: IDS.targetDeveloper, status_code: 'ACTIVE' }))
  assert.equal(hasActiveIdentityAccess(user, [request]), true, 'completed identity link must make the Developer assignment-ready')
  assert.equal(hasActiveIdentityAccess({ ...user, externalIdentityKeyHash: null }, [request]), false, 'unlinked Developer must not be assignment-ready')
  assert.equal(hasActiveIdentityAccess(user, [request, { ...request }]), false, 'ambiguous active identity access must fail closed')

  assert.match(readSource('srv/access/identity-readiness.js'), /function hasActiveIdentityAccess/, 'shared identity readiness predicate is missing')
  assert.match(readSource('srv/bug-service/bug-write.js'), /hasActiveIdentityAccess/, 'direct assignment does not use shared identity readiness')
  assert.match(readSource('srv/bug-service/read-models.js'), /hasActiveIdentityAccess/, 'Smart Assign candidates do not use shared identity readiness')
}

main().catch(error => {
  console.error(`${error.name}: ${error.message}`)
  process.exitCode = 1
})
