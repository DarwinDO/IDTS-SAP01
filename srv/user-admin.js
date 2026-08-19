'use strict'

const crypto = require('node:crypto')
const cds = require('@sap/cds')
const { DELETE, INSERT, SELECT, UPDATE } = cds.ql

const {
  assertRequestedAccess,
  assertUserAdministrator,
  createInvitationToken,
  identitySnapshotFrom,
  invitationIDFromToken,
  verifyInvitationToken
} = require('./user-admin/invitations')
const { getUserAdminConfig } = require('./user-admin/config')
const { scheduleImmediateEmailOutbox } = require('./email/worker')
const { identityKeyHash, selectActiveUserForRequest } = require('./auth/identity-map')
const { isXsuaaRuntime } = require('./auth/platform-role')
const {
  normalizeDeveloperProfileInput,
  assertDeveloperProfileForRole
} = require('./user-admin/developer-profile')

const OPEN_STATUSES = [
  'INVITED',
  'IDENTITY_VERIFIED',
  'PENDING_APPROVAL',
  'PROVISION_QUEUED',
  'PROVISIONING',
  'ROLE_CHANGE_QUEUED',
  'ROLE_CHANGING',
  'REVOKE_QUEUED',
  'REVOKING',
  'RETRYABLE_FAILURE',
  'BLOCKED_MANUAL_REVIEW',
  'ACTIVE'
]

class UserAdministrationService extends cds.ApplicationService {
  async init () {
    for (const entity of ['OnboardingRequests', 'AvailabilityStatuses', 'ResponsibilityLevels', 'SAPModules', 'ComponentCategories']) {
      this.before('READ', entity, req => requireActiveUserAdministrator(req))
    }
    this.on('requestOnboarding', req => requestOnboarding(req))
    this.on('verifySapIdentity', req => verifySapIdentity(req))
    this.on('searchOnboarding', req => searchOnboarding(req))
    this.on('approveProvisioning', req => approveProvisioning(req))
    this.on('requestRoleChange', req => requestRoleChange(req))
    this.on('readDeveloperProfile', req => readDeveloperProfile(req))
    this.on('updateDeveloperProfile', req => updateDeveloperProfile(req))
    this.on('requestRevoke', req => requestRevoke(req))
    this.on('retryAccessOperation', req => retryAccessOperation(req))
    this.on('reconcileAccessOperation', req => reconcileAccessOperation(req))
    return super.init()
  }
}

async function searchOnboarding (req) {
  const query = normalizeSearchQuery(req.data.query)
  const tx = cds.tx(req)
  await requireActiveUserAdministrator(req, tx)

  const selection = SELECT.from('idts.cap.UserOnboardingRequests')
    .columns(
      'ID',
      'targetEmailNormalized',
      'requestedRole_code',
      'userAdminRequested',
      'status_code',
      'expiresAt',
      'verifiedAt',
      'provisionedAt',
      'revokedAt',
      'provisioningVersion',
      'activeUser_ID',
      'latestOperation_ID',
      'lastErrorCode',
      'lastErrorSummary'
    )
    .orderBy('createdAt desc')
    .limit(200)
  if (query) selection.where`contains(targetEmailNormalized, ${query})`
  return tx.run(selection)
}

async function requestOnboarding (req) {
  const access = assertRequestedAccess(req.data.requestedRole, req.data.userAdminRequested)
  const developerProfile = normalizeDeveloperProfileInput(req.data.developerProfile)
  assertDeveloperProfileForRole(access.requestedRole, developerProfile)
  const targetEmail = normalizeEmail(req.data.email)
  if (!targetEmail) throw serviceError(400, 'INVALID_INVITATION_EMAIL', 'A valid invitation email is required.')

  const config = invitationConfig()
  const tx = cds.tx(req)
  const requestedBy = await requireActiveUserAdministrator(req, tx)
  await validateDeveloperProfileCatalog(tx, developerProfile)
  const now = req.timestamp || new Date()

  await tx.run(
    UPDATE('idts.cap.UserOnboardingRequests').set({
      status_code: 'FAILED',
      openRequestKey: null,
      lastErrorCode: 'INVITATION_EXPIRED',
      lastErrorSummary: 'Invitation expired before identity verification.'
    }).where({
      targetEmailNormalized: targetEmail,
      status_code: 'INVITED',
      expiresAt: { '<=': now.toISOString() }
    })
  )

  const existing = await tx.run(
    SELECT.one.from('idts.cap.UserOnboardingRequests')
      .columns('ID')
      .where({ targetEmailNormalized: targetEmail, status_code: { in: OPEN_STATUSES } })
  )
  if (existing) throw serviceError(409, 'ONBOARDING_ALREADY_OPEN', 'An onboarding request is already open for this identity.')

  const invitationID = cds.utils.uuid()
  const correlationId = cds.utils.uuid()
  const expiresAt = new Date(now.getTime() + config.invitationTtlMinutes * 60000).toISOString()
  const invitation = createInvitationToken({
    invitationID,
    targetEmail,
    expiresAt,
    signingKey: config.invitationSigningKey
  })
  const openRequestKey = crypto.createHash('sha256').update(targetEmail).digest('hex')

  try {
    await tx.run(INSERT.into('idts.cap.UserOnboardingRequests').entries({
      ID: invitationID,
      targetEmailNormalized: targetEmail,
      openRequestKey,
      requestedRole_code: access.requestedRole,
      userAdminRequested: access.userAdminRequested,
      status_code: 'INVITED',
      requestedBy_ID: requestedBy.ID,
      expiresAt,
      tokenNonce: invitation.persisted.tokenNonce,
      tokenHash: invitation.persisted.tokenHash,
      correlationId
    }))
  } catch (error) {
    if (isOpenRequestConstraintError(error)) {
      throw serviceError(409, 'ONBOARDING_ALREADY_OPEN', 'An onboarding request is already open for this identity.')
    }
    throw error
  }
  await persistDesiredDeveloperProfile(tx, invitationID, developerProfile)
  await tx.run(INSERT.into('idts.cap.UserOnboardingDeliveries').entries({
    ID: cds.utils.uuid(),
    onboardingRequest_ID: invitationID,
    recipientEmail: targetEmail,
    templateKey: 'IDTS_USER_ONBOARDING_V1',
    status_code: 'PENDING',
    attemptCount: 0
  }))
  scheduleImmediateEmailOutbox(req)

  return onboardingResult({
    ID: invitationID,
    targetEmailNormalized: targetEmail,
    requestedRole_code: access.requestedRole,
    userAdminRequested: access.userAdminRequested,
    status_code: 'INVITED',
    expiresAt,
    correlationId
  })
}

async function verifySapIdentity (req) {
  const config = invitationConfig()
  const invitationID = invitationIDFromToken(req.data.token)
  const tx = cds.tx(req)
  const invitation = await tx.run(
    SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: invitationID })
  )
  if (!invitation) throw serviceError(400, 'INVALID_INVITATION', 'Invitation is invalid.')

  try {
    verifyInvitationToken({
      token: req.data.token,
      persisted: invitation,
      signingKey: config.invitationSigningKey,
      now: req.timestamp || new Date()
    })
  } catch (error) {
    if (error.code === 'INVITATION_ALREADY_USED') throw serviceError(409, error.code, error.message)
    if (error.code === 'INVITATION_EXPIRED') throw serviceError(410, error.code, error.message)
    throw serviceError(400, 'INVALID_INVITATION', 'Invitation is invalid.')
  }

  let identity
  try {
    identity = identitySnapshotFrom(req.user, invitation)
  } catch (error) {
    const status = error.code === 'INVITATION_IDENTITY_MISMATCH' ? 403 : 400
    throw serviceError(status, error.code, error.message)
  }

  const identityKeyHashValue = identityKeyHash(identity)

  const collision = await tx.run(
    SELECT.one.from('idts.cap.UserOnboardingRequests')
      .columns('ID')
      .where({
        ID: { '!=': invitation.ID },
        identityKeyHash: identityKeyHashValue
      })
  )
  if (collision) throw serviceError(409, 'EXTERNAL_IDENTITY_ALREADY_LINKED', 'SAP identity is already linked to another onboarding request.')

  const linkedUser = await tx.run(
    SELECT.one.from('idts.cap.Users')
      .columns('ID')
      .where({ externalIdentityKeyHash: identityKeyHashValue })
  )
  if (linkedUser) throw serviceError(409, 'EXTERNAL_IDENTITY_ALREADY_LINKED', 'SAP identity is already linked to an IDTS user.')
  const emailMatches = (await tx.run(SELECT.from('idts.cap.Users').columns('ID', 'email')))
    .filter(user => normalizeEmail(user.email) === invitation.targetEmailNormalized)
  if (emailMatches.length > 0) {
    throw serviceError(409, 'EMAIL_RECONCILIATION_REQUIRED', 'An existing IDTS user requires identity reconciliation.')
  }

  const verifiedAt = (req.timestamp || new Date()).toISOString()
  const approvalRequired = requiresProvisioningApproval(invitation)
  const operationID = approvalRequired ? null : cds.utils.uuid()
  const operationCorrelationId = approvalRequired ? invitation.correlationId : cds.utils.uuid()
  const nextStatus = approvalRequired ? 'PENDING_APPROVAL' : 'PROVISION_QUEUED'
  const nextVersion = approvalRequired ? 1 : 2
  const updated = await tx.run(
    UPDATE('idts.cap.UserOnboardingRequests').set({
      status_code: nextStatus,
      provisioningVersion: nextVersion,
      consumedAt: verifiedAt,
      verifiedAt,
      identityOrigin: identity.origin,
      identityIssuer: identity.issuer,
      identitySubject: identity.subject,
      identityPlatformUserId: identity.platformUserId,
      identityKeyHash: identityKeyHashValue,
      identityEmailNormalized: identity.emailNormalized,
      ...(approvalRequired ? {} : {
        approvedAt: verifiedAt,
        approvedBy_ID: invitation.requestedBy_ID,
        latestOperation_ID: operationID
      }),
      lastErrorCode: null,
      lastErrorSummary: null
    }).where({ ID: invitation.ID, status_code: 'INVITED', consumedAt: null })
  )
  if (updated !== 1) throw serviceError(409, 'INVITATION_ALREADY_USED', 'Invitation has already been used.')

  if (!approvalRequired) {
    const verifiedRequest = {
      ...invitation,
      status_code: nextStatus,
      provisioningVersion: nextVersion,
      verifiedAt,
      identityOrigin: identity.origin,
      identityIssuer: identity.issuer,
      identitySubject: identity.subject,
      identityPlatformUserId: identity.platformUserId,
      identityKeyHash: identityKeyHashValue,
      identityEmailNormalized: identity.emailNormalized
    }
    await insertAccessOperation(tx, {
      ID: operationID,
      request: verifiedRequest,
      operationType: 'PROVISION',
      requestedByID: invitation.requestedBy_ID,
      expectedVersion: nextVersion,
      correlationId: operationCorrelationId
    })
    await insertIdentityAudit(tx, {
      operationID,
      requestID: invitation.ID,
      actorID: invitation.requestedBy_ID,
      action: 'AUTO_APPROVE_PROVISIONING',
      fromState: 'INVITED',
      toState: nextStatus,
      correlationId: operationCorrelationId,
      summary: 'Standard-role provisioning queued after SAP identity verification.'
    })
  }
  return onboardingResult({
    ...invitation,
    status_code: nextStatus,
    provisioningVersion: nextVersion,
    verifiedAt,
    identityOrigin: identity.origin,
    identitySubject: identity.subject,
    correlationId: operationCorrelationId
  })
}

function requiresProvisioningApproval (request) {
  return request?.requestedRole_code === 'PM' || request?.userAdminRequested === true
}

async function approveProvisioning (req) {
  const tx = cds.tx(req)
  const administrator = await requireActiveUserAdministrator(req, tx)
  const request = await readOnboardingRequest(tx, req.data.requestID)
  assertExpectedVersion(request, req.data.expectedVersion)
  if (request.status_code !== 'PENDING_APPROVAL') {
    throw serviceError(409, 'ONBOARDING_STATE_CONFLICT', 'The onboarding request is not awaiting approval.')
  }

  const nextVersion = request.provisioningVersion + 1
  const correlationId = cds.utils.uuid()
  const operationID = cds.utils.uuid()
  const changed = await tx.run(
    UPDATE('idts.cap.UserOnboardingRequests').set({
      status_code: 'PROVISION_QUEUED',
      provisioningVersion: nextVersion,
      approvedAt: (req.timestamp || new Date()).toISOString(),
      approvedBy_ID: administrator.ID,
      latestOperation_ID: operationID,
      lastErrorCode: null,
      lastErrorSummary: null
    }).where({
      ID: request.ID,
      status_code: 'PENDING_APPROVAL',
      provisioningVersion: request.provisioningVersion
    })
  )
  if (changed !== 1) throw serviceError(409, 'ONBOARDING_VERSION_CONFLICT', 'The onboarding request changed. Reload and try again.')

  await insertAccessOperation(tx, {
    ID: operationID,
    request,
    operationType: 'PROVISION',
    requestedByID: administrator.ID,
    expectedVersion: nextVersion,
    correlationId
  })
  await insertIdentityAudit(tx, {
    operationID,
    requestID: request.ID,
    actorID: administrator.ID,
    action: 'APPROVE_PROVISIONING',
    fromState: request.status_code,
    toState: 'PROVISION_QUEUED',
    correlationId,
    summary: 'Provisioning approved and queued.'
  })

  return onboardingResult({
    ...request,
    status_code: 'PROVISION_QUEUED',
    provisioningVersion: nextVersion,
    correlationId
  })
}

async function requestRoleChange (req) {
  const access = assertRequestedAccess(req.data.requestedRole, req.data.userAdminRequested)
  const developerProfile = normalizeDeveloperProfileInput(req.data.developerProfile)
  assertDeveloperProfileForRole(access.requestedRole, developerProfile)
  const reason = normalizeReason(req.data.reason)
  const tx = cds.tx(req)
  const administrator = await requireActiveUserAdministrator(req, tx)
  const { user, request } = await readActiveProvisionedUser(tx, req.data.userID)
  await validateDeveloperProfileCatalog(tx, developerProfile)
  assertExpectedVersion(request, req.data.expectedVersion)
  if (request.requestedRole_code === access.requestedRole && request.userAdminRequested === access.userAdminRequested) {
    throw serviceError(409, 'ACCESS_ALREADY_DESIRED', 'The requested access is already active.')
  }
  await assertLastAdministratorSafety(tx, request, access)
  await persistDesiredDeveloperProfile(tx, request.ID, developerProfile)
  return queueFailClosedAccessChange(req, tx, {
    administrator,
    request,
    user,
    operationType: 'CHANGE_ROLE',
    queuedState: 'ROLE_CHANGE_QUEUED',
    requestedRole: access.requestedRole,
    userAdminRequested: access.userAdminRequested,
    reason
  })
}

async function requestRevoke (req) {
  const reason = normalizeReason(req.data.reason)
  const tx = cds.tx(req)
  const administrator = await requireActiveUserAdministrator(req, tx)
  const { user, request } = await readActiveProvisionedUser(tx, req.data.userID)
  assertExpectedVersion(request, req.data.expectedVersion)
  await assertLastAdministratorSafety(tx, request, { requestedRole: null, userAdminRequested: false })
  return queueFailClosedAccessChange(req, tx, {
    administrator,
    request,
    user,
    operationType: 'REVOKE',
    queuedState: 'REVOKE_QUEUED',
    requestedRole: request.requestedRole_code,
    userAdminRequested: request.userAdminRequested,
    reason
  })
}

async function retryAccessOperation (req) {
  return requeueAccessOperation(req, {
    requiredState: 'RETRYABLE_FAILURE',
    legacyState: 'BLOCKED_MANUAL_REVIEW',
    legacySafeResultCode: 'PROVIDER_DENIED',
    errorCode: 'ACCESS_OPERATION_NOT_RETRYABLE',
    errorMessage: 'The access operation cannot be retried.',
    auditAction: 'RETRY_ACCESS_OPERATION',
    auditSummary: 'Access operation queued for a bounded retry.'
  })
}

async function readDeveloperProfile (req) {
  const tx = cds.tx(req)
  await requireActiveUserAdministrator(req, tx)
  const { user, profile } = await readDeveloperTarget(tx, req.data.userID)
  const administrationVersion = await readDeveloperProfileAdministrationVersion(tx, profile.ID)
  return developerProfileResult(tx, user, profile, administrationVersion)
}

async function updateDeveloperProfile (req) {
  const desiredProfile = normalizeDeveloperProfileInput(req.data.desiredProfile)
  assertDeveloperProfileForRole('DEVELOPER', desiredProfile)
  normalizeReason(req.data.reason)
  const tx = cds.tx(req)
  const administrator = await requireActiveUserAdministrator(req, tx)
  await validateDeveloperProfileCatalog(tx, desiredProfile)
  const { user, profile } = await readDeveloperTarget(tx, req.data.userID, true)
  const administrationState = await tx.run(
    SELECT.one.from('idts.cap.DeveloperProfileAdministrationStates').where({ developerProfile_ID: profile.ID })
  )
  const administrationVersion = administrationState?.administrationVersion || 0
  if (!Number.isInteger(req.data.expectedVersion) || administrationVersion !== req.data.expectedVersion) {
    throw serviceError(409, 'DEVELOPER_PROFILE_VERSION_CONFLICT', 'The Developer profile changed. Reload and try again.')
  }

  const nextVersion = administrationVersion + 1
  const changed = await tx.run(UPDATE('idts.cap.DeveloperProfiles').set({
    availabilityStatus_code: desiredProfile.availabilityStatusCode,
    workloadLimit: desiredProfile.workloadLimit,
    active: true
  }).where({ ID: profile.ID }))
  if (changed !== 1) throw serviceError(409, 'DEVELOPER_PROFILE_VERSION_CONFLICT', 'The Developer profile changed. Reload and try again.')
  if (administrationState) {
    const stateChanged = await tx.run(UPDATE('idts.cap.DeveloperProfileAdministrationStates').set({
      administrationVersion: nextVersion
    }).where({ ID: administrationState.ID, administrationVersion }))
    if (stateChanged !== 1) throw serviceError(409, 'DEVELOPER_PROFILE_VERSION_CONFLICT', 'The Developer profile changed. Reload and try again.')
  } else {
    await tx.run(INSERT.into('idts.cap.DeveloperProfileAdministrationStates').entries({
      ID: cds.utils.uuid(),
      developerProfile_ID: profile.ID,
      administrationVersion: nextVersion
    }))
  }

  const existing = await tx.run(
    SELECT.from('idts.cap.DeveloperResponsibilities').where({ developerProfile_ID: profile.ID })
  )
  const desiredTuples = new Set()
  for (const responsibility of desiredProfile.responsibilities) {
    const tuple = responsibilityTuple(responsibility.componentCategoryID, responsibility.sapModuleID)
    desiredTuples.add(tuple)
    const current = existing.find(row => responsibilityTuple(row.componentCategory_ID, row.sapModule_ID) === tuple)
    if (current) {
      await tx.run(UPDATE('idts.cap.DeveloperResponsibilities').set({
        responsibilityLevel_code: responsibility.responsibilityLevelCode,
        active: true
      }).where({ ID: current.ID }))
      await appendDeveloperAdministrationAudit(tx, administrator.ID, user.ID, 'DEVELOPER_RESPONSIBILITY_UPDATED')
    } else {
      await tx.run(INSERT.into('idts.cap.DeveloperResponsibilities').entries({
        ID: cds.utils.uuid(),
        developerProfile_ID: profile.ID,
        componentCategory_ID: responsibility.componentCategoryID,
        sapModule_ID: responsibility.sapModuleID,
        responsibilityLevel_code: responsibility.responsibilityLevelCode,
        active: true
      }))
      await appendDeveloperAdministrationAudit(tx, administrator.ID, user.ID, 'DEVELOPER_RESPONSIBILITY_ADDED')
    }
  }
  for (const current of existing.filter(row => row.active && !desiredTuples.has(responsibilityTuple(row.componentCategory_ID, row.sapModule_ID)))) {
    await tx.run(UPDATE('idts.cap.DeveloperResponsibilities').set({ active: false }).where({ ID: current.ID, active: true }))
    await appendDeveloperAdministrationAudit(tx, administrator.ID, user.ID, 'DEVELOPER_RESPONSIBILITY_DEACTIVATED')
  }
  await appendDeveloperAdministrationAudit(tx, administrator.ID, user.ID, 'DEVELOPER_PROFILE_UPDATED')
  return developerProfileResult(tx, user, {
    ...profile,
    availabilityStatus_code: desiredProfile.availabilityStatusCode,
    workloadLimit: desiredProfile.workloadLimit,
    active: true
  }, nextVersion)
}

async function readDeveloperTarget (tx, userID, lock = false) {
  const user = await tx.run(SELECT.one.from('idts.cap.Users').where({ ID: userID, active: true, role_code: 'DEVELOPER' }))
  if (!user) throw serviceError(404, 'ACTIVE_DEVELOPER_NOT_FOUND', 'Active Developer was not found.')
  let query = SELECT.one.from('idts.cap.DeveloperProfiles').where({ user_ID: user.ID, active: true })
  if (lock) query = query.forUpdate()
  const profile = await tx.run(query)
  if (!profile) throw serviceError(409, 'DEVELOPER_PROFILE_INCOMPLETE', 'Developer profile is incomplete.')
  return { user, profile }
}

async function readDeveloperProfileAdministrationVersion (tx, profileID) {
  const state = await tx.run(
    SELECT.one.from('idts.cap.DeveloperProfileAdministrationStates')
      .columns('administrationVersion')
      .where({ developerProfile_ID: profileID })
  )
  return state?.administrationVersion || 0
}

async function developerProfileResult (tx, user, profile, administrationVersion) {
  const responsibilities = await tx.run(
    SELECT.from('idts.cap.DeveloperResponsibilities').where({ developerProfile_ID: profile.ID }).orderBy('createdAt asc')
  )
  const activeResponsibilityCount = responsibilities.filter(row => row.active).length
  const impact = await tx.run(
    SELECT.one.from('idts.cap.Bugs').columns('count(*) as count').where({
      assignee_ID: profile.ID,
      status_code: { '!=': 'CLOSED' }
    })
  )
  return {
    userID: user.ID,
    developerProfileID: profile.ID,
    availabilityStatusCode: profile.availabilityStatus_code,
    workloadLimit: profile.workloadLimit,
    administrationVersion,
    ready: user.active === true && profile.active === true && activeResponsibilityCount > 0,
    activeResponsibilityCount,
    openBugImpactCount: Number(impact?.count || 0),
    responsibilities: responsibilities.map(row => ({
      ID: row.ID,
      componentCategoryID: row.componentCategory_ID,
      sapModuleID: row.sapModule_ID || null,
      responsibilityLevelCode: row.responsibilityLevel_code,
      active: row.active === true
    }))
  }
}

async function appendDeveloperAdministrationAudit (tx, actorID, targetUserID, action) {
  await tx.run(INSERT.into('idts.cap.UserIdentityAuditEvents').entries({
    ID: cds.utils.uuid(),
    actor_ID: actorID,
    targetUser_ID: targetUserID,
    action,
    result: 'APPLIED',
    correlationId: cds.utils.uuid(),
    detailsSummary: 'Developer administration change applied.'
  }))
}

function responsibilityTuple (componentCategoryID, sapModuleID) {
  return `${componentCategoryID}|${sapModuleID || 'ANY'}`
}

async function validateDeveloperProfileCatalog (tx, profile) {
  if (!profile) return
  const availability = await tx.run(
    SELECT.one.from('idts.cap.AvailabilityStatuses').columns('code').where({
      code: profile.availabilityStatusCode,
      active: true
    })
  )
  if (!availability) throw serviceError(400, 'INVALID_DEVELOPER_AVAILABILITY', 'Developer availability is invalid or inactive.')

  for (const responsibility of profile.responsibilities) {
    const componentCategory = await tx.run(
      SELECT.one.from('idts.cap.ComponentCategories').columns(
        'ID',
        { ref: ['component', 'active'], as: 'componentActive' },
        { ref: ['defectCategory', 'active'], as: 'defectCategoryActive' }
      ).where({
        ID: responsibility.componentCategoryID,
        active: true
      })
    )
    if (!componentCategory || componentCategory.componentActive !== true || componentCategory.defectCategoryActive !== true) {
      throw serviceError(400, 'INVALID_COMPONENT_CATEGORY', 'Component Category is invalid or inactive.')
    }
    if (responsibility.sapModuleID) {
      const sapModule = await tx.run(
        SELECT.one.from('idts.cap.SAPModules').columns('ID').where({ ID: responsibility.sapModuleID, active: true })
      )
      if (!sapModule) throw serviceError(400, 'INVALID_SAP_MODULE', 'SAP Module is invalid or inactive.')
    }
    const level = await tx.run(
      SELECT.one.from('idts.cap.ResponsibilityLevels').columns('code').where({
        code: responsibility.responsibilityLevelCode,
        active: true
      })
    )
    if (!level) throw serviceError(400, 'INVALID_RESPONSIBILITY_LEVEL', 'Responsibility level is invalid or inactive.')
  }
}

async function persistDesiredDeveloperProfile (tx, requestID, profile) {
  await tx.run(DELETE.from('idts.cap.UserOnboardingDeveloperProfiles').where({ onboardingRequest_ID: requestID }))
  await tx.run(DELETE.from('idts.cap.UserOnboardingDeveloperResponsibilities').where({ onboardingRequest_ID: requestID }))
  if (!profile) return
  await tx.run(INSERT.into('idts.cap.UserOnboardingDeveloperProfiles').entries({
    ID: cds.utils.uuid(),
    onboardingRequest_ID: requestID,
    availabilityStatus_code: profile.availabilityStatusCode,
    workloadLimit: profile.workloadLimit
  }))
  await persistDesiredDeveloperResponsibilities(tx, requestID, profile)
}

async function persistDesiredDeveloperResponsibilities (tx, requestID, profile) {
  if (!profile) return
  await tx.run(INSERT.into('idts.cap.UserOnboardingDeveloperResponsibilities').entries(
    profile.responsibilities.map(responsibility => ({
      ID: cds.utils.uuid(),
      onboardingRequest_ID: requestID,
      componentCategory_ID: responsibility.componentCategoryID,
      sapModule_ID: responsibility.sapModuleID,
      responsibilityLevel_code: responsibility.responsibilityLevelCode
    }))
  ))
}

async function reconcileAccessOperation (req) {
  return requeueAccessOperation(req, {
    requiredState: 'BLOCKED_MANUAL_REVIEW',
    requiredSafeResultCode: 'AMBIGUOUS_PROVIDER_OUTCOME',
    errorCode: 'ACCESS_OPERATION_NOT_RECONCILABLE',
    errorMessage: 'The access operation cannot be reconciled.',
    auditAction: 'RECONCILE_ACCESS_OPERATION',
    auditSummary: 'Access operation queued for provider-state reconciliation.'
  })
}

async function requeueAccessOperation (req, options) {
  const tx = cds.tx(req)
  const administrator = await requireActiveUserAdministrator(req, tx)
  const operation = await tx.run(
    SELECT.one.from('idts.cap.UserAccessOperations').where({ ID: req.data.operationID })
  )
  if (!operation) throw serviceError(404, 'ACCESS_OPERATION_NOT_FOUND', 'Access operation was not found.')
  const request = await readOnboardingRequest(tx, operation.onboardingRequest_ID)
  assertExpectedVersion(request, req.data.expectedVersion)
  const regularMatch =
    operation.state === options.requiredState &&
    request.status_code === options.requiredState &&
    (!options.requiredSafeResultCode || operation.safeResultCode === options.requiredSafeResultCode)
  const legacyMatch = Boolean(
    options.legacyState &&
    options.legacySafeResultCode &&
    operation.state === options.legacyState &&
    request.status_code === options.legacyState &&
    operation.safeResultCode === options.legacySafeResultCode &&
    request.lastErrorCode === options.legacySafeResultCode
  )
  if (!regularMatch && !legacyMatch) {
    throw serviceError(409, options.errorCode, options.errorMessage)
  }
  const nextVersion = request.provisioningVersion + 1
  const nextCorrelationId = cds.utils.uuid()
  const operationWhere = {
    ID: operation.ID,
    state: legacyMatch ? options.legacyState : options.requiredState
  }
  const expectedSafeResultCode = legacyMatch ? options.legacySafeResultCode : options.requiredSafeResultCode
  if (expectedSafeResultCode) operationWhere.safeResultCode = expectedSafeResultCode
  const changed = await tx.run(
    UPDATE('idts.cap.UserAccessOperations').set({
      state: 'PENDING',
      expectedVersion: nextVersion,
      idempotencyKey: provisioningIdempotencyKey(request.ID, operation.operationType, nextVersion),
      correlationId: nextCorrelationId,
      nextAttemptAt: null,
      completedAt: null,
      leaseTokenHash: null,
      leasedAt: null,
      leaseExpiresAt: null,
      safeResultCode: null,
      safeResultSummary: null,
      providerCorrelationHash: null
    }).where(operationWhere)
  )
  if (changed !== 1) throw serviceError(409, 'ONBOARDING_VERSION_CONFLICT', 'The access operation changed. Reload and try again.')
  const queuedState = queuedStateFor(operation.operationType)
  const requestChanged = await tx.run(UPDATE('idts.cap.UserOnboardingRequests').set({
    status_code: queuedState,
    provisioningVersion: nextVersion,
    latestOperation_ID: operation.ID,
    lastErrorCode: null,
    lastErrorSummary: null
  }).where({ ID: request.ID, provisioningVersion: request.provisioningVersion }))
  if (requestChanged !== 1) throw serviceError(409, 'ONBOARDING_VERSION_CONFLICT', 'The onboarding request changed. Reload and try again.')
  await insertIdentityAudit(tx, {
    operationID: operation.ID,
    requestID: request.ID,
    actorID: administrator.ID,
    action: options.auditAction,
    fromState: request.status_code,
    toState: queuedState,
    correlationId: nextCorrelationId,
    summary: options.auditSummary
  })
  return onboardingResult({ ...request, status_code: queuedState, provisioningVersion: nextVersion, correlationId: nextCorrelationId })
}

async function queueFailClosedAccessChange (req, tx, options) {
  const nextVersion = options.request.provisioningVersion + 1
  const correlationId = cds.utils.uuid()
  const operationID = cds.utils.uuid()
  const now = (req.timestamp || new Date()).toISOString()
  const userChanged = await tx.run(UPDATE('idts.cap.Users').set({ active: false }).where({ ID: options.user.ID, active: true }))
  if (userChanged !== 1) throw serviceError(409, 'ACCESS_USER_CHANGED', 'The user access record changed. Reload and try again.')
  await tx.run(UPDATE('idts.cap.AuthSessions').set({ revokedAt: now }).where({
    user_ID: options.user.ID,
    revokedAt: null
  }))
  const requestPatch = {
    requestedRole_code: options.requestedRole,
    userAdminRequested: options.userAdminRequested,
    status_code: options.queuedState,
    provisioningVersion: nextVersion,
    lastErrorCode: null,
    lastErrorSummary: null
  }
  const changed = await tx.run(UPDATE('idts.cap.UserOnboardingRequests').set(requestPatch).where({
    ID: options.request.ID,
    status_code: 'ACTIVE',
    provisioningVersion: options.request.provisioningVersion
  }))
  if (changed !== 1) throw serviceError(409, 'ONBOARDING_VERSION_CONFLICT', 'The access record changed. Reload and try again.')
  await insertAccessOperation(tx, {
    ID: operationID,
    request: { ...options.request, requestedRole_code: options.requestedRole, userAdminRequested: options.userAdminRequested },
    operationType: options.operationType,
    requestedByID: options.administrator.ID,
    expectedVersion: nextVersion,
    correlationId
  })
  await insertIdentityAudit(tx, {
    operationID,
    requestID: options.request.ID,
    actorID: options.administrator.ID,
    targetUserID: options.user.ID,
    action: options.operationType === 'REVOKE' ? 'REQUEST_REVOKE' : 'REQUEST_ROLE_CHANGE',
    fromState: options.request.status_code,
    toState: options.queuedState,
    correlationId,
    summary: options.reason
  })
  return onboardingResult({
    ...options.request,
    ...requestPatch,
    correlationId
  })
}

async function readOnboardingRequest (tx, ID) {
  const request = await tx.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID }))
  if (!request) throw serviceError(404, 'ONBOARDING_REQUEST_NOT_FOUND', 'Onboarding request was not found.')
  return request
}

async function readActiveProvisionedUser (tx, userID) {
  const user = await tx.run(SELECT.one.from('idts.cap.Users').where({ ID: userID, active: true }))
  if (!user) throw serviceError(404, 'ACTIVE_USER_NOT_FOUND', 'Active user was not found.')
  const request = await tx.run(
    SELECT.one.from('idts.cap.UserOnboardingRequests').where({ activeUser_ID: user.ID, status_code: 'ACTIVE' })
  )
  if (!request) throw serviceError(409, 'ACTIVE_ACCESS_NOT_RECONCILED', 'Active access is not reconciled.')
  return { user, request }
}

function assertExpectedVersion (request, expectedVersion) {
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0 || request.provisioningVersion !== expectedVersion) {
    throw serviceError(409, 'ONBOARDING_VERSION_CONFLICT', 'The onboarding request changed. Reload and try again.')
  }
}

async function assertLastAdministratorSafety (tx, request, desiredAccess) {
  const removesUserAdmin = request.userAdminRequested === true && desiredAccess.userAdminRequested !== true
  if (!removesUserAdmin) return
  const activeAdmins = await tx.run(
    SELECT.from('idts.cap.UserOnboardingRequests')
      .columns('ID')
      .where({ status_code: 'ACTIVE', requestedRole_code: 'PM', userAdminRequested: true })
      .forUpdate()
  )
  if (activeAdmins.length <= 1) {
    throw serviceError(409, 'LAST_USER_ADMIN_REQUIRED', 'The last active UserAdmin cannot be removed.')
  }
}

async function insertAccessOperation (tx, options) {
  await tx.run(INSERT.into('idts.cap.UserAccessOperations').entries({
    ID: options.ID,
    onboardingRequest_ID: options.request.ID,
    operationType: options.operationType,
    state: 'PENDING',
    requestedBy_ID: options.requestedByID,
    idempotencyKey: provisioningIdempotencyKey(options.request.ID, options.operationType, options.expectedVersion),
    expectedVersion: options.expectedVersion,
    desiredRole_code: options.request.requestedRole_code,
    desiredUserAdmin: options.request.userAdminRequested === true,
    correlationId: options.correlationId,
    attemptCount: 0
  }))
}

async function insertIdentityAudit (tx, options) {
  await tx.run(INSERT.into('idts.cap.UserIdentityAuditEvents').entries({
    ID: cds.utils.uuid(),
    operation_ID: options.operationID || null,
    onboardingRequest_ID: options.requestID,
    actor_ID: options.actorID || null,
    targetUser_ID: options.targetUserID || null,
    action: options.action,
    result: 'QUEUED',
    fromState: options.fromState,
    toState: options.toState,
    correlationId: options.correlationId,
    detailsSummary: options.summary
  }))
}

function provisioningIdempotencyKey (requestID, operationType, expectedVersion) {
  return crypto.createHash('sha256')
    .update(JSON.stringify([requestID, operationType, expectedVersion]))
    .digest('hex')
}

function queuedStateFor (operationType) {
  if (operationType === 'REVOKE') return 'REVOKE_QUEUED'
  if (operationType === 'CHANGE_ROLE') return 'ROLE_CHANGE_QUEUED'
  return 'PROVISION_QUEUED'
}

function normalizeReason (value) {
  if (typeof value !== 'string') throw serviceError(400, 'ACCESS_CHANGE_REASON_REQUIRED', 'A reason is required.')
  const reason = value.trim()
  if (!reason || reason.length > 500 || /[\r\n]/.test(reason)) {
    throw serviceError(400, 'ACCESS_CHANGE_REASON_REQUIRED', 'A valid reason is required.')
  }
  return reason
}

async function resolveActiveRequester (tx, req) {
  const users = await tx.run(
    SELECT.from('idts.cap.Users')
      .columns('ID', 'displayName', 'email', 'role_code', 'active', 'externalIdentityKeyHash')
      .where({ active: true })
  )
  return selectActiveUserForRequest(users, req.user, { requireExternalIdentity: isXsuaaRuntime() })
}

async function requireActiveUserAdministrator (req, tx = cds.tx(req)) {
  assertUserAdministrator(req)
  const requester = await resolveActiveRequester(tx, req)
  if (!requester || requester.role_code !== 'PM') {
    throw serviceError(403, 'USER_ADMIN_REQUIRED', 'PM and UserAdmin authorization is required.')
  }
  return requester
}

function isOpenRequestConstraintError (error) {
  const detail = `${error?.code || ''} ${error?.message || ''} ${error?.constraint || ''}`.toLowerCase()
  return detail.includes('openrequestkey') || detail.includes('openonboardingrequest')
}

function onboardingResult (row) {
  return {
    ID: row.ID,
    targetEmail: row.targetEmailNormalized,
    requestedRole: row.requestedRole_code,
    userAdminRequested: row.userAdminRequested === true,
    status: row.status_code,
    expiresAt: row.expiresAt,
    verifiedAt: row.verifiedAt || null,
    provisionedAt: row.provisionedAt || null,
    revokedAt: row.revokedAt || null,
    provisioningVersion: Number.isInteger(row.provisioningVersion) ? row.provisioningVersion : 0,
    correlationId: row.correlationId
  }
}

function invitationConfig () {
  const config = getUserAdminConfig()
  if (!config.ready) {
    throw serviceError(503, 'INVITATION_CONFIG_UNAVAILABLE', 'User onboarding is temporarily unavailable.')
  }
  return config
}

function normalizeEmail (value) {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  return email.length <= 255 && !/[<>\r\n]/.test(email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? email
    : null
}

function normalizeSearchQuery (value) {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw serviceError(400, 'INVALID_SEARCH_QUERY', 'Search query is invalid.')
  const query = value.trim().toLowerCase()
  if (query.length > 255 || /[<>\r\n]/.test(query)) {
    throw serviceError(400, 'INVALID_SEARCH_QUERY', 'Search query is invalid.')
  }
  return query
}

function serviceError (status, code, message) {
  return Object.assign(new Error(message), { status, statusCode: status, code })
}

module.exports = UserAdministrationService
module.exports.requestOnboarding = requestOnboarding
module.exports.verifySapIdentity = verifySapIdentity
module.exports.searchOnboarding = searchOnboarding
module.exports.approveProvisioning = approveProvisioning
module.exports.requestRoleChange = requestRoleChange
module.exports.requestRevoke = requestRevoke
module.exports.retryAccessOperation = retryAccessOperation
module.exports.reconcileAccessOperation = reconcileAccessOperation
module.exports.requiresProvisioningApproval = requiresProvisioningApproval
