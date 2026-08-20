'use strict'

const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql

const USERS = 'idts.cap.Users'
const SESSIONS = 'idts.cap.AuthSessions'
const REQUESTS = 'idts.cap.UserOnboardingRequests'

async function requestSuspend (req, dependencies) {
  const reason = dependencies.normalizeReason(req.data?.reason)
  const tx = cds.tx(req)
  const administrator = await dependencies.authorize(req, tx)
  const { user, request } = await dependencies.readActiveProvisionedUser(tx, req.data?.userID)
  dependencies.assertExpectedVersion(request, req.data?.expectedVersion)
  await lockUser(tx, user.ID)
  await assertNotFinalAdministrator(tx, user.ID)

  const now = req.timestamp || new Date()
  const userChanged = await tx.run(
    UPDATE(USERS).set({ active: false }).where({ ID: user.ID, active: true })
  )
  if (userChanged !== 1) throw accessError(409, 'ACCESS_USER_CHANGED', 'The user access record changed. Reload and try again.')
  await revokeActiveSessions(tx, user.ID, now)

  const nextVersion = request.provisioningVersion + 1
  const correlationId = cds.utils.uuid()
  const requestChanged = await tx.run(
    UPDATE(REQUESTS).set({
      status_code: 'SUSPENDED',
      provisioningVersion: nextVersion,
      lastErrorCode: null,
      lastErrorSummary: null
    }).where({
      ID: request.ID,
      status_code: 'ACTIVE',
      provisioningVersion: request.provisioningVersion
    })
  )
  if (requestChanged !== 1) throw accessError(409, 'ONBOARDING_VERSION_CONFLICT', 'The access record changed. Reload and try again.')

  await dependencies.insertIdentityAudit(tx, {
    operationID: null,
    requestID: request.ID,
    actorID: administrator.ID,
    targetUserID: user.ID,
    action: 'REQUEST_SUSPEND',
    fromState: 'ACTIVE',
    toState: 'SUSPENDED',
    correlationId,
    summary: reason
  })
  return dependencies.onboardingResult({
    ...request,
    status_code: 'SUSPENDED',
    provisioningVersion: nextVersion,
    correlationId
  })
}

async function requestReactivate (req, dependencies) {
  const reason = dependencies.normalizeReason(req.data?.reason)
  const tx = cds.tx(req)
  const administrator = await dependencies.authorize(req, tx)
  const { user, request } = await dependencies.readSuspendedProvisionedUser(tx, req.data?.userID)
  dependencies.assertExpectedVersion(request, req.data?.expectedVersion)
  await lockUser(tx, user.ID)

  const nextVersion = request.provisioningVersion + 1
  const operationID = cds.utils.uuid()
  const correlationId = cds.utils.uuid()
  await dependencies.insertAccessOperation(tx, {
    ID: operationID,
    request,
    operationType: 'REACTIVATE',
    requestedByID: administrator.ID,
    expectedVersion: nextVersion,
    correlationId
  })
  const requestChanged = await tx.run(
    UPDATE(REQUESTS).set({
      status_code: 'SUSPENDED',
      provisioningVersion: nextVersion,
      latestOperation_ID: operationID,
      lastErrorCode: null,
      lastErrorSummary: null
    }).where({
      ID: request.ID,
      status_code: 'SUSPENDED',
      provisioningVersion: request.provisioningVersion
    })
  )
  if (requestChanged !== 1) throw accessError(409, 'ONBOARDING_VERSION_CONFLICT', 'The access record changed. Reload and try again.')

  await dependencies.insertIdentityAudit(tx, {
    operationID,
    requestID: request.ID,
    actorID: administrator.ID,
    targetUserID: user.ID,
    action: 'REQUEST_REACTIVATE',
    fromState: 'SUSPENDED',
    toState: 'SUSPENDED',
    correlationId,
    summary: reason
  })
  return dependencies.onboardingResult({
    ...request,
    status_code: 'SUSPENDED',
    provisioningVersion: nextVersion,
    latestOperation_ID: operationID,
    correlationId
  })
}

async function assertNotFinalAdministrator (tx, targetUserID) {
  const target = await tx.run(
    SELECT.one.from(REQUESTS)
      .columns('ID')
      .where({
        activeUser_ID: targetUserID,
        status_code: 'ACTIVE',
        requestedRole_code: 'PM',
        userAdminRequested: true
      })
      .forUpdate()
  )
  if (!target) return

  const activeAdministrators = await tx.run(
    SELECT.from(REQUESTS)
      .columns('ID')
      .where({ status_code: 'ACTIVE', requestedRole_code: 'PM', userAdminRequested: true })
      .forUpdate()
  )
  if (activeAdministrators.length <= 1) {
    throw accessError(409, 'LAST_USER_ADMIN_REQUIRED', 'The last active UserAdmin cannot be removed.')
  }
}

async function revokeActiveSessions (tx, userID, at) {
  const revokedAt = at instanceof Date ? at.toISOString() : new Date(at).toISOString()
  return tx.run(UPDATE(SESSIONS).set({ revokedAt }).where({ user_ID: userID, revokedAt: null }))
}

async function lockUser (tx, userID) {
  return tx.run(SELECT.one.from(USERS).columns('ID').where({ ID: userID }).forUpdate())
}

function accessError (status, code, message) {
  return Object.assign(new Error(message), { status, statusCode: status, code })
}

module.exports = {
  requestSuspend,
  requestReactivate,
  assertNotFinalAdministrator,
  revokeActiveSessions
}
