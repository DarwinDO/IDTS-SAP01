'use strict'

const cds = require('@sap/cds')
const { SELECT } = cds.ql

const USERS = 'idts.cap.Users'
const REQUESTS = 'idts.cap.UserOnboardingRequests'
const OPERATIONS = 'idts.cap.UserAccessOperations'
const PROFILES = 'idts.cap.DeveloperProfiles'
const RESPONSIBILITIES = 'idts.cap.DeveloperResponsibilities'
const BUGS = 'idts.cap.Bugs'
const AUDIT_EVENTS = 'idts.cap.UserIdentityAuditEvents'

const RELEVANT_REQUEST_STATUSES = new Set([
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
  'ACTIVE',
  'REVOKED'
])

const SUSPENDED_REQUEST_STATUSES = new Set([
  'PROVISION_QUEUED',
  'PROVISIONING',
  'ROLE_CHANGE_QUEUED',
  'ROLE_CHANGING',
  'REVOKE_QUEUED',
  'REVOKING',
  'RETRYABLE_FAILURE',
  'BLOCKED_MANUAL_REVIEW'
])

const PENDING_OPERATION_STATES = new Set([
  'PENDING',
  'PROCESSING',
  'RETRYABLE_FAILURE',
  'BLOCKED_MANUAL_REVIEW'
])

const DEFAULT_PAGE_SIZE = 100
const MAX_PAGE_SIZE = 100
const MAX_PAGE_SKIP = 1000000

// Gate 2 chỉ đọc các cột allow-list rồi ghép trong request; không cache dữ liệu giữa hai request.
function registerActiveUserHandlers (service, { authorize }) {
  if (typeof authorize !== 'function') throw new TypeError('Active user authorization is required.')
  service.on('searchActiveUsers', req => searchActiveUsers(req, { authorize }))
  service.on('readActiveUserDetails', req => readActiveUserDetails(req, { authorize }))
}

async function searchActiveUsers (req, { authorize }) {
  const query = normalizeSearchQuery(req.data?.query)
  const includeNonActive = req.data?.includeNonActive === true
  const { skip, top } = normalizePaging(req.data)
  const tx = cds.tx(req)
  await authorize(req, tx)
  const rows = await buildReadModel(tx)
  return rows
    .filter(row => includeNonActive || row.accessState !== 'REVOKED')
    .filter(row => matchesQuery(row, query))
    .sort(compareRows)
    .slice(skip, skip + top)
    .map(toSummary)
}

async function readActiveUserDetails (req, { authorize }) {
  const userID = normalizeUuid(req.data?.userID)
  if (!userID) throw serviceError(400, 'INVALID_USER_ID', 'User ID is invalid.')
  const tx = cds.tx(req)
  await authorize(req, tx)
  const rows = await buildReadModel(tx, { includeDeveloperDetails: true })
  const row = rows.find(candidate => candidate.userID === userID)
  if (!row) throw serviceError(404, 'ACTIVE_USER_NOT_FOUND', 'User was not found.')
  const counts = await readActiveUserCounts(tx, row)
  return toDetails({ ...row, ...counts })
}

async function buildReadModel (tx, { includeDeveloperDetails = false } = {}) {
  const users = await tx.run(
    SELECT.from(USERS).columns(
      'ID',
      'displayName',
      'email',
      'role_code',
      'active',
      'externalIdentityKeyHash'
    ).orderBy('displayName asc', 'email asc', 'ID asc')
  )
  if (users.length === 0) return []

  const userIDs = users.map(user => user.ID)
  const requests = await tx.run(
    SELECT.from(REQUESTS).columns(
      'ID',
      'activeUser_ID',
      'targetEmailNormalized',
      'requestedRole_code',
      'userAdminRequested',
      'status_code',
      'identityKeyHash',
      'latestOperation_ID',
      'provisionedAt',
      'revokedAt',
      'lastErrorCode',
      'lastErrorSummary',
      'createdAt',
      'modifiedAt'
    ).where({ activeUser_ID: { in: userIDs } })
  )

  const operationIDs = [...new Set(requests.map(request => request.latestOperation_ID).filter(Boolean))]
  const operations = operationIDs.length === 0
    ? []
    : await tx.run(
        SELECT.from(OPERATIONS).columns(
          'ID',
          'onboardingRequest_ID',
          'operationType',
          'state',
          'safeResultCode',
          'completedAt',
          'createdAt',
          'modifiedAt'
        ).where({ ID: { in: operationIDs } })
      )

  const developerUsers = users.filter(user => user.role_code === 'DEVELOPER')
  const developerUserIDs = developerUsers.map(user => user.ID)
  const profiles = developerUserIDs.length === 0
    ? []
    : await tx.run(
        SELECT.from(PROFILES).columns(
          'ID',
          'user_ID',
          'availabilityStatus_code',
          'workloadLimit',
          'active'
        ).where({ user_ID: { in: developerUserIDs }, active: true })
      )
  const profileIDs = profiles.map(profile => profile.ID)
  const responsibilities = profileIDs.length === 0
    ? []
    : await tx.run(
        SELECT.from(RESPONSIBILITIES).columns(
          'developerProfile_ID',
          'active'
        ).where({ developerProfile_ID: { in: profileIDs } })
      )
  const bugs = !includeDeveloperDetails || profileIDs.length === 0
    ? []
    : await tx.run(
        SELECT.from(BUGS).columns(
          'assignee_ID',
          'status_code'
        ).where({ assignee_ID: { in: profileIDs } })
      )

  const requestsByUser = groupBy(requests, row => row.activeUser_ID)
  const operationsByID = new Map(operations.map(operation => [operation.ID, operation]))
  const profilesByUser = new Map(profiles.map(profile => [profile.user_ID, profile]))
  const responsibilityCounts = countBy(
    responsibilities.filter(row => row.active === true),
    row => row.developerProfile_ID
  )
  const openBugCounts = countBy(
    bugs.filter(row => row.status_code !== 'CLOSED'),
    row => row.assignee_ID
  )
  const requestCounts = countBy(requests, row => row.activeUser_ID)

  return users.map(user => {
    const selected = selectUserRequest(requestsByUser.get(user.ID) || [])
    const request = selected.request
    const operation = request?.latestOperation_ID ? operationsByID.get(request.latestOperation_ID) : null
    const profile = profilesByUser.get(user.ID) || null
    const activeResponsibilityCount = profile ? responsibilityCounts.get(profile.ID) || 0 : 0
    const identityLinked = !selected.ambiguous && Boolean(
      user.externalIdentityKeyHash &&
      request?.identityKeyHash &&
      user.externalIdentityKeyHash === request.identityKeyHash
    )
    const accessState = identityLinked
      ? deriveAccessState({ userActive: user.active === true, requestStatus: request?.status_code })
      : 'INCOMPLETE'
    const developerReady = user.role_code === 'DEVELOPER' &&
      user.active === true &&
      profile?.active === true &&
      activeResponsibilityCount > 0
    const pending = operation && PENDING_OPERATION_STATES.has(operation.state) ? operation : null

    return {
      userID: user.ID,
      displayName: String(user.displayName || ''),
      email: normalizeContactEmail(user.email),
      businessRole: user.role_code || null,
      userAdminCapability: identityLinked &&
        request?.status_code === 'ACTIVE' &&
        request.userAdminRequested === true &&
        user.role_code === 'PM',
      accessState,
      identityLinked,
      developerReady,
      activeResponsibilityCount,
      pendingOperationType: pending?.operationType || null,
      pendingOperationState: pending?.state || null,
      lastSafeResultCode: operation?.safeResultCode || null,
      lastReconciledAt: operation?.state === 'SUCCEEDED'
        ? operation.completedAt || null
        : request?.status_code === 'ACTIVE'
          ? request.provisionedAt || null
          : request?.status_code === 'REVOKED'
            ? request.revokedAt || null
            : null,
      requestCount: requestCounts.get(user.ID) || 0,
      auditEventCount: 0,
      developerProfile: profile
        ? {
            ID: profile.ID,
            availabilityStatus: profile.availabilityStatus_code || null,
            workloadLimit: profile.workloadLimit ?? null,
            openBugImpactCount: openBugCounts.get(profile.ID) || 0
          }
        : null
    }
  })
}

async function readActiveUserCounts (tx, row) {
  const requestRows = await tx.run(
    SELECT.from(REQUESTS).columns('ID').where({ activeUser_ID: row.userID })
  )
  if (row.email) {
    requestRows.push(...await tx.run(
      SELECT.from(REQUESTS).columns('ID').where({ targetEmailNormalized: row.email })
    ))
  }
  const auditRows = await tx.run(
    SELECT.from(AUDIT_EVENTS).columns('ID').where({ targetUser_ID: row.userID })
  )
  return {
    requestCount: new Set(requestRows.map(request => request.ID)).size,
    auditEventCount: auditRows.length
  }
}

function selectUserRequest (rows) {
  const relevant = rows
    .filter(row => RELEVANT_REQUEST_STATUSES.has(row.status_code))
    .sort(compareRequestRows)
  const activeRows = relevant.filter(row => row.status_code === 'ACTIVE')
  return {
    request: relevant[0] || null,
    ambiguous: activeRows.length > 1
  }
}

function deriveAccessState ({ userActive, requestStatus }) {
  if (userActive === true && requestStatus === 'ACTIVE') return 'ACTIVE'
  if (requestStatus === 'REVOKED') return 'REVOKED'
  if (userActive !== true && SUSPENDED_REQUEST_STATUSES.has(requestStatus)) return 'SUSPENDED'
  return 'INCOMPLETE'
}

function toSummary (row) {
  return {
    userID: row.userID,
    displayName: row.displayName,
    email: row.email,
    businessRole: row.businessRole,
    userAdminCapability: row.userAdminCapability,
    accessState: row.accessState,
    identityLinked: row.identityLinked,
    developerReady: row.developerReady,
    activeResponsibilityCount: row.activeResponsibilityCount,
    pendingOperationType: row.pendingOperationType,
    pendingOperationState: row.pendingOperationState,
    lastSafeResultCode: row.lastSafeResultCode,
    lastReconciledAt: row.lastReconciledAt
  }
}

function toDetails (row) {
  return {
    ...toSummary(row),
    requestCount: row.requestCount,
    auditEventCount: row.auditEventCount,
    developerProfileID: row.developerProfile?.ID || null,
    developerAvailabilityStatus: row.developerProfile?.availabilityStatus || null,
    developerWorkloadLimit: row.developerProfile?.workloadLimit ?? null,
    developerOpenBugImpactCount: row.developerProfile?.openBugImpactCount || 0
  }
}

function matchesQuery (row, query) {
  if (!query) return true
  return [
    row.displayName,
    row.email,
    row.businessRole,
    row.accessState,
    row.pendingOperationType,
    row.pendingOperationState
  ].filter(Boolean).join(' ').toLowerCase().includes(query)
}

function compareRows (left, right) {
  return compareText(
    `${left.displayName}\u0000${left.email}\u0000${left.userID}`,
    `${right.displayName}\u0000${right.email}\u0000${right.userID}`
  )
}

function compareRequestRows (left, right) {
  const leftTime = Date.parse(left.modifiedAt || left.createdAt || '') || 0
  const rightTime = Date.parse(right.modifiedAt || right.createdAt || '') || 0
  if (leftTime !== rightTime) return rightTime - leftTime
  return compareText(String(right.ID || ''), String(left.ID || ''))
}

function compareText (left, right) {
  const normalizedLeft = String(left || '').toLowerCase()
  const normalizedRight = String(right || '').toLowerCase()
  if (normalizedLeft < normalizedRight) return -1
  if (normalizedLeft > normalizedRight) return 1
  return 0
}

function groupBy (rows, keyOf) {
  const groups = new Map()
  for (const row of rows) {
    const key = keyOf(row)
    if (!key) continue
    const group = groups.get(key) || []
    group.push(row)
    groups.set(key, group)
  }
  return groups
}

function countBy (rows, keyOf) {
  const counts = new Map()
  for (const row of rows) {
    const key = keyOf(row)
    if (!key) continue
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return counts
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

function normalizePaging (data = {}) {
  const skip = data.skip === undefined || data.skip === null ? 0 : Number(data.skip)
  const top = data.top === undefined || data.top === null ? DEFAULT_PAGE_SIZE : Number(data.top)
  if (!Number.isInteger(skip) || skip < 0 || skip > MAX_PAGE_SKIP ||
    !Number.isInteger(top) || top < 1 || top > MAX_PAGE_SIZE) {
    throw serviceError(400, 'INVALID_PAGE', 'Page bounds are invalid.')
  }
  return { skip, top }
}

function normalizeContactEmail (value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeUuid (value) {
  const uuid = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(uuid) ? uuid : null
}

function serviceError (status, code, message) {
  return Object.assign(new Error(message), { status, statusCode: status, code })
}

module.exports = {
  registerActiveUserHandlers,
  searchActiveUsers,
  readActiveUserDetails,
  deriveAccessState
}
