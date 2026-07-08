const cds = require('@sap/cds')

const { SELECT } = cds.ql

const {
  ALLOWED_TRANSITIONS,
  CAPABILITY_FIELDS,
  COMMENT_ROLES,
  COORDINATOR_ROLES,
  DEVELOPER_STATUSES,
  FIELD_CONTROL,
  PROCESSOR_ROLE,
  STATUS,
  TESTER_STATUSES,
  USER_ROLE
} = require('./constants')

const {
  resolveRequestUser,
  trimToNull
} = require('./helpers')

const DISPLAY_FIELDS = new Set([
  'reporterDisplayName',
  'assigneeDisplayName',
  'nextProcessorUserDisplayName',
  'nextProcessorRoleName',
  'currentActionOwnerDisplayName'
])

async function readAssignableDevelopers (req, entities) {
  const tx = cds.tx(req)
  const criteria = assignableDeveloperCriteria(req)
  let rows = await buildAssignableDeveloperRows(tx, entities, criteria)

  rows = rows
    .filter(row => filterAssignableDeveloperRow(row, criteria))
    .sort((left, right) => left.developerName.localeCompare(right.developerName))

  const total = rows.length
  rows = applyLimit(rows, req.query?.SELECT?.limit)
    .map(toPublicAssignableDeveloperRow)
  rows.$count = total
  return rows
}

async function buildAssignableDeveloperRows (tx, entities, criteria = {}) {
  let rows

  if (criteria.componentCategoryID) {
    const responsibilities = await tx.run(
      SELECT.from(entities.DeveloperResponsibilities)
        .columns(
          'ID',
          'developerProfile_ID',
          'componentCategory_ID',
          'sapModule_ID',
          'responsibilityLevel_code',
          'active',
          { ref: ['developerProfile', 'active'], as: 'developerActive' },
          { ref: ['developerProfile', 'user', 'displayName'], as: 'developerName' },
          { ref: ['developerProfile', 'user', 'email'], as: 'developerEmail' },
          { ref: ['developerProfile', 'workloadLimit'], as: 'workloadLimit' },
          { ref: ['developerProfile', 'availabilityStatus', 'name'], as: 'availabilityStatusName' },
          { ref: ['developerProfile', 'availabilityStatus', 'criticality'], as: 'availabilityCriticality' },
          { ref: ['componentCategory', 'component', 'name'], as: 'applicationComponentName' },
          { ref: ['componentCategory', 'defectCategory', 'name'], as: 'defectCategoryName' },
          { ref: ['sapModule', 'name'], as: 'sapModuleName' },
          { ref: ['responsibilityLevel', 'name'], as: 'responsibilityLevelName' }
        )
        .where({ active: true, componentCategory_ID: criteria.componentCategoryID })
    )

    const filteredResponsibilities = responsibilities.filter(row => {
      if (!row.developerActive) return false
      if (!criteria.sapModuleID) return true
      return !row.sapModule_ID || row.sapModule_ID === criteria.sapModuleID
    })

    const byDeveloper = new Map()
    for (const row of filteredResponsibilities) {
      const current = byDeveloper.get(row.developerProfile_ID)
      if (!current || shouldPreferAssignableResponsibility(row, current, criteria.sapModuleID)) {
        byDeveloper.set(row.developerProfile_ID, row)
      }
    }

    rows = [...byDeveloper.values()].map(row => ({
      ID: row.developerProfile_ID,
      developerProfileID: row.developerProfile_ID,
      componentCategoryID: row.componentCategory_ID,
      sapModuleID: row.sapModule_ID || null,
      developerName: row.developerName,
      developerEmail: row.developerEmail,
      workloadLimit: row.workloadLimit ?? null,
      availabilityStatusName: row.availabilityStatusName,
      availabilityCriticality: row.availabilityCriticality,
      applicationComponentName: row.applicationComponentName,
      defectCategoryName: row.defectCategoryName,
      sapModuleName: row.sapModuleName || null,
      responsibilityLevelName: row.responsibilityLevelName || null,
      active: !!row.developerActive
    }))
  } else {
    const profiles = await tx.run(
      SELECT.from(entities.DeveloperProfiles)
        .columns(
          'ID',
          'active',
          'workloadLimit',
          { ref: ['user', 'displayName'], as: 'developerName' },
          { ref: ['user', 'email'], as: 'developerEmail' },
          { ref: ['availabilityStatus', 'name'], as: 'availabilityStatusName' },
          { ref: ['availabilityStatus', 'criticality'], as: 'availabilityCriticality' }
        )
        .where({ active: true })
    )

    rows = profiles.map(row => ({
      ID: row.ID,
      developerProfileID: row.ID,
      componentCategoryID: null,
      sapModuleID: null,
      developerName: row.developerName,
      developerEmail: row.developerEmail,
      workloadLimit: row.workloadLimit ?? null,
      availabilityStatusName: row.availabilityStatusName,
      availabilityCriticality: row.availabilityCriticality,
      applicationComponentName: null,
      defectCategoryName: null,
      sapModuleName: null,
      responsibilityLevelName: null,
      active: !!row.active
    }))
  }

  return rows
}

function assignableDeveloperCriteria (req) {
  const where = req.query?.SELECT?.where || []
  const search = req.query?.SELECT?.search
  return {
    componentCategoryID: eqValueFromWhere(where, 'componentCategoryID'),
    sapModuleID: eqValueFromWhere(where, 'sapModuleID'),
    developerProfileID: eqValueFromWhere(where, 'developerProfileID'),
    active: eqValueFromWhere(where, 'active'),
    search: searchTermFromCqn(search)
  }
}

function eqValueFromWhere (where, property) {
  for (let index = 0; index < where.length - 2; index += 1) {
    const left = where[index]
    const operator = where[index + 1]
    const right = where[index + 2]
    if (operator !== '=') continue

    if (left?.ref?.at(-1) === property && right && Object.prototype.hasOwnProperty.call(right, 'val')) {
      return right.val
    }

    if (right?.ref?.at(-1) === property && left && Object.prototype.hasOwnProperty.call(left, 'val')) {
      return left.val
    }
  }
  return null
}

function searchTermFromCqn (search) {
  if (!search) return null
  if (typeof search === 'string') return trimToNull(search)
  if (Array.isArray(search)) {
    const parts = search
      .map(entry => entry?.val)
      .filter(value => typeof value === 'string')
    return trimToNull(parts.join(' '))
  }
  return null
}

function shouldPreferAssignableResponsibility (candidate, current, sapModuleID) {
  if (sapModuleID) {
    const candidateExact = candidate.sapModule_ID === sapModuleID
    const currentExact = current.sapModule_ID === sapModuleID
    if (candidateExact !== currentExact) return candidateExact
  }

  const candidatePrimary = candidate.responsibilityLevel_code === 'PRIMARY'
  const currentPrimary = current.responsibilityLevel_code === 'PRIMARY'
  if (candidatePrimary !== currentPrimary) return candidatePrimary

  if (!current.sapModule_ID && candidate.sapModule_ID) return false
  if (!candidate.sapModule_ID && current.sapModule_ID) return true

  return String(candidate.ID).localeCompare(String(current.ID)) < 0
}

function filterAssignableDeveloperRow (row, criteria) {
  if (criteria.active !== null && criteria.active !== undefined && !!row.active !== !!criteria.active) {
    return false
  }

  if (criteria.developerProfileID && row.developerProfileID !== criteria.developerProfileID) {
    return false
  }

  if (!criteria.search) return true

  const haystack = [row.developerName, row.developerEmail]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(criteria.search.toLowerCase())
}

function toPublicAssignableDeveloperRow (row) {
  const { workloadLimit, ...publicRow } = row
  return publicRow
}

function applyLimit (rows, limit) {
  if (!limit) return rows
  const offset = Number(limit.offset?.val || 0)
  const top = Number(limit.rows?.val || rows.length)
  return rows.slice(offset, offset + top)
}

async function enrichBugDisplayFields (bugs, req, entities) {
  const rows = Array.isArray(bugs) ? bugs : [bugs].filter(Boolean)
  if (!rows.length) return

  await fillMissingBugDisplayKeys(rows, req, entities)

  const tx = cds.tx(req)
  const assigneeIDs = [...new Set(rows.map(row => row.assignee_ID).filter(Boolean))]
  const userIDs = [...new Set(rows.flatMap(row => [row.reporter_ID, row.nextProcessorUser_ID]).filter(Boolean))]
  const roleCodes = [...new Set(rows.map(row => row.nextProcessorRole_code).filter(Boolean))]

  const profiles = assigneeIDs.length
    ? await tx.run(
      SELECT.from(entities.DeveloperProfiles)
        .columns('ID', 'user_ID')
        .where({ ID: { in: assigneeIDs } })
    )
    : []

  for (const profile of profiles) {
    if (profile.user_ID) userIDs.push(profile.user_ID)
  }

  const distinctUserIDs = [...new Set(userIDs.filter(Boolean))]

  const users = distinctUserIDs.length
    ? await tx.run(
      SELECT.from(entities.Users)
        .columns('ID', 'displayName')
        .where({ ID: { in: distinctUserIDs } })
    )
    : []
  const userNameByID = new Map(users.map(user => [user.ID, user.displayName]))
  const profileNameByID = new Map(
    profiles.map(profile => [profile.ID, userNameByID.get(profile.user_ID)])
  )
  const processorRoles = roleCodes.length
    ? await tx.run(
      SELECT.from(entities.ProcessorRoleValues)
        .columns('code', 'name')
        .where({ code: { in: roleCodes } })
    )
    : []
  const roleNameByCode = new Map(processorRoles.map(role => [role.code, role.name]))

  for (const row of rows) {
    row.reporterDisplayName = row.reporter_ID ? userNameByID.get(row.reporter_ID) || null : null
    row.assigneeDisplayName = row.assignee_ID ? profileNameByID.get(row.assignee_ID) || null : null
    row.nextProcessorUserDisplayName = row.nextProcessorUser_ID ? userNameByID.get(row.nextProcessorUser_ID) || null : null
    row.nextProcessorRoleName = row.nextProcessorRole_code ? roleNameByCode.get(row.nextProcessorRole_code) || null : null
    row.currentActionOwnerDisplayName = deriveCurrentActionOwnerDisplayName(row)
  }
}

function deriveCurrentActionOwnerDisplayName (row) {
  const status = row.status_code
  if (!status || status === STATUS.CLOSED) return null

  if (DEVELOPER_STATUSES.has(status)) {
    return row.assigneeDisplayName ||
      row.nextProcessorUserDisplayName ||
      currentActionOwnerQueueLabel(row.nextProcessorRole_code, row.nextProcessorRoleName)
  }

  if (status === STATUS.PENDING_ASSIGNMENT) {
    return currentActionOwnerQueueLabel(row.nextProcessorRole_code, row.nextProcessorRoleName) ||
      row.nextProcessorUserDisplayName ||
      null
  }

  if (TESTER_STATUSES.has(status)) {
    if (row.nextProcessorRole_code === PROCESSOR_ROLE.PM || row.nextProcessorRole_code === PROCESSOR_ROLE.UNASSIGNED_QUEUE) {
      return currentActionOwnerQueueLabel(row.nextProcessorRole_code, row.nextProcessorRoleName) ||
        row.nextProcessorUserDisplayName ||
        null
    }

    return row.nextProcessorUserDisplayName ||
      currentActionOwnerQueueLabel(row.nextProcessorRole_code, row.nextProcessorRoleName) ||
      row.reporterDisplayName ||
      null
  }

  return row.nextProcessorUserDisplayName ||
    currentActionOwnerQueueLabel(row.nextProcessorRole_code, row.nextProcessorRoleName) ||
    null
}

function currentActionOwnerQueueLabel (roleCode, roleName) {
  if (!roleCode) return roleName || null

  switch (roleCode) {
    case PROCESSOR_ROLE.PM:
      return roleName || 'Project Manager'
    case PROCESSOR_ROLE.UNASSIGNED_QUEUE:
      return roleName || 'Unassigned Queue'
    case PROCESSOR_ROLE.TESTER:
      return roleName || 'Tester'
    case PROCESSOR_ROLE.DEVELOPER:
      return roleName || 'Developer'
    case PROCESSOR_ROLE.NONE:
      return null
    default:
      return roleName || null
  }
}

async function fillMissingBugDisplayKeys (rows, req, entities) {
  const rowsNeedingLookup = rows
    .filter(row =>
      row.ID && (
        row.status_code === undefined ||
        row.reporter_ID === undefined ||
        row.assignee_ID === undefined ||
        row.nextProcessorUser_ID === undefined ||
        row.nextProcessorRole_code === undefined
      )
    )
  if (!rowsNeedingLookup.length) return

  await fillMissingBugDisplayKeysFromEntity(rowsNeedingLookup, entities.Bugs.drafts, req)
  await fillMissingBugDisplayKeysFromEntity(
    rowsNeedingLookup.filter(row =>
      row.status_code === undefined ||
      row.reporter_ID === undefined ||
      row.assignee_ID === undefined ||
      row.nextProcessorUser_ID === undefined ||
      row.nextProcessorRole_code === undefined
    ),
    entities.Bugs,
    req
  )
}

async function fillMissingBugDisplayKeysFromEntity (rows, entity, req) {
  if (!rows?.length || !entity) return

  const bugs = await cds.tx(req).run(
    SELECT.from(entity)
      .columns('ID', 'status_code', 'reporter_ID', 'assignee_ID', 'nextProcessorUser_ID', 'nextProcessorRole_code')
      .where({ ID: { in: rows.map(row => row.ID) } })
  )
  const bugByID = new Map(bugs.map(bug => [bug.ID, bug]))

  for (const row of rows) {
    const bug = bugByID.get(row.ID)
    if (!bug) continue
    if (row.status_code === undefined) row.status_code = bug.status_code
    if (row.reporter_ID === undefined) row.reporter_ID = bug.reporter_ID
    if (row.assignee_ID === undefined) row.assignee_ID = bug.assignee_ID
    if (row.nextProcessorUser_ID === undefined) row.nextProcessorUser_ID = bug.nextProcessorUser_ID
    if (row.nextProcessorRole_code === undefined) row.nextProcessorRole_code = bug.nextProcessorRole_code
  }
}

async function enrichBugCapabilities (bugs, req, entities) {
  const rows = Array.isArray(bugs) ? bugs : [bugs].filter(Boolean)
  if (!rows.length) return

  const capabilityInputs = await readCapabilityInputs(rows, req, entities)
  const actor = await resolveRequestUser(req, entities)
  if (!actor) {
    for (const row of rows) {
      row.canMarkInReview = false
      row.canStartProgress = false
      row.canResolve = false
      row.canRequestMoreInfo = false
      row.canReject = false
      row.canSendToRetest = false
      row.canClose = false
      row.canReopen = false
      row.canAssign = false
      row.canMoveToPending = false
      row.canResubmit = false
      row.canAddComment = false
      row.assigneeFieldControl = FIELD_CONTROL.READ_ONLY
    }
    return
  }

  const actorRole = actor.role_code
  const isCoordinator = COORDINATOR_ROLES.has(actorRole)

  let actorDeveloperProfileID = null
  if (actorRole === USER_ROLE.DEVELOPER) {
    const profile = await cds.tx(req).run(
      SELECT.one.from(entities.DeveloperProfiles).where({ user_ID: actor.ID })
    )
    if (profile) {
      actorDeveloperProfileID = profile.ID
    }
  }

  for (const row of rows) {
    const rowCapabilityInputs =
      capabilityInputs.byID.get(row.ID) ||
      capabilityInputs.byBugNumber.get(row.bugNumber) ||
      {}
    const status = row.status_code ?? rowCapabilityInputs.status_code
    const assigneeID = row.assignee_ID ?? rowCapabilityInputs.assignee_ID
    const allowedTransitions = ALLOWED_TRANSITIONS[status] || []
    const isAssignedDev = !!(actorDeveloperProfileID && assigneeID === actorDeveloperProfileID)

    row.canMarkInReview = allowedTransitions.includes(STATUS.IN_REVIEW) && isAssignedDev
    row.canStartProgress = allowedTransitions.includes(STATUS.IN_PROGRESS) && isAssignedDev
    row.canResolve = allowedTransitions.includes(STATUS.RESOLVED) && isAssignedDev
    row.canRequestMoreInfo = allowedTransitions.includes(STATUS.NEED_MORE_INFORMATION) && isAssignedDev
    row.canReject = allowedTransitions.includes(STATUS.REJECTED) && isAssignedDev

    row.canSendToRetest = allowedTransitions.includes(STATUS.RETEST_REQUIRED) && isCoordinator
    row.canClose = allowedTransitions.includes(STATUS.CLOSED) && isCoordinator
    row.canReopen = allowedTransitions.includes(STATUS.REOPENED) && isCoordinator
    row.canAssign = allowedTransitions.includes(STATUS.ASSIGNED) && isCoordinator
    row.canMoveToPending = allowedTransitions.includes(STATUS.PENDING_ASSIGNMENT) && isCoordinator
    row.canResubmit = status === STATUS.NEED_MORE_INFORMATION && allowedTransitions.includes(STATUS.ASSIGNED) && isCoordinator && !!assigneeID
    row.canAddComment = COMMENT_ROLES.has(actorRole)
    row.assigneeFieldControl = isCoordinator && (!status || allowedTransitions.includes(STATUS.ASSIGNED))
      ? FIELD_CONTROL.OPTIONAL
      : FIELD_CONTROL.READ_ONLY
  }
}

function ensureCapabilitySelectDependencies (req) {
  const columns = req.query?.SELECT?.columns
  if (!Array.isArray(columns) || !columns.length) return

  const selectedRefs = new Set(
    columns
      .map(column => Array.isArray(column?.ref) ? column.ref.join('/') : null)
      .filter(Boolean)
  )

  const requestsCapabilityField = [...CAPABILITY_FIELDS].some(field => selectedRefs.has(field))
  const requestsDisplayField = [...DISPLAY_FIELDS].some(field => selectedRefs.has(field))
  if (!requestsCapabilityField && !requestsDisplayField) return

  const dependencies = new Set()

  if (requestsCapabilityField) {
    for (const dependency of ['ID', 'status_code', 'assignee_ID']) {
      dependencies.add(dependency)
    }
  }

  if (requestsDisplayField) {
    for (const dependency of ['ID', 'status_code', 'reporter_ID', 'assignee_ID', 'nextProcessorUser_ID', 'nextProcessorRole_code']) {
      dependencies.add(dependency)
    }
  }

  for (const dependency of dependencies) {
    if (!selectedRefs.has(dependency)) {
      columns.push({ ref: [dependency] })
      selectedRefs.add(dependency)
    }
  }
}

async function readCapabilityInputs (rows, req, entities) {
  const rowsNeedingLookup = rows.filter(row => row.ID || row.bugNumber)
  const capabilityInputsByBugID = new Map()
  const capabilityInputsByBugNumber = new Map()
  if (!rowsNeedingLookup.length) {
    return { byID: capabilityInputsByBugID, byBugNumber: capabilityInputsByBugNumber }
  }

  await readCapabilityInputsFromEntity(rowsNeedingLookup, entities.Bugs.drafts, req, capabilityInputsByBugID, capabilityInputsByBugNumber)
  await readCapabilityInputsFromEntity(rowsNeedingLookup, entities.Bugs, req, capabilityInputsByBugID, capabilityInputsByBugNumber)
  return { byID: capabilityInputsByBugID, byBugNumber: capabilityInputsByBugNumber }
}

async function readCapabilityInputsFromEntity (rows, entity, req, capabilityInputsByBugID, capabilityInputsByBugNumber) {
  if (!rows?.length || !entity) return

  const ids = [...new Set(rows.map(row => row.ID).filter(Boolean))]
  const bugNumbers = [...new Set(rows.map(row => row.bugNumber).filter(Boolean))]
  const bugs = []

  if (ids.length) {
    bugs.push(...await cds.tx(req).run(
      SELECT.from(entity)
        .columns('ID', 'bugNumber', 'status_code', 'assignee_ID')
        .where({ ID: { in: ids } })
    ))
  }

  if (bugNumbers.length) {
    bugs.push(...await cds.tx(req).run(
      SELECT.from(entity)
        .columns('ID', 'bugNumber', 'status_code', 'assignee_ID')
        .where({ bugNumber: { in: bugNumbers } })
    ))
  }

  for (const bug of bugs) {
    const entry = {
      status_code: bug.status_code,
      assignee_ID: bug.assignee_ID
    }
    if (bug.ID) capabilityInputsByBugID.set(bug.ID, entry)
    if (bug.bugNumber) capabilityInputsByBugNumber.set(bug.bugNumber, entry)
  }
}

module.exports = {
  readAssignableDevelopers,
  buildAssignableDeveloperRows,
  enrichBugDisplayFields,
  enrichBugCapabilities,
  ensureCapabilitySelectDependencies
}
