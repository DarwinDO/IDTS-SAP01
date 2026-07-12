// Học nhanh (DonHV): pipeline validate/chuẩn bị dữ liệu Bug trước CREATE/UPDATE. Đây là breakpoint đầu tiên khi field bị reject hoặc persist sai.
const cds = require('@sap/cds')

const { SELECT } = cds.ql

const {
  ALLOWED_TRANSITIONS,
  DEVELOPER_STATUSES,
  PROCESSOR_ROLE,
  STATUS,
  TESTER_STATUSES
} = require('./constants')

const {
  firstUserByRole,
  nextBugNumber,
  readBug,
  resolveRequestUser,
  trimToNull,
  userIDForDeveloper
} = require('./helpers')

const { importantChanges } = require('./history')
const { enforceBugWritePermission } = require('./permissions')

const CODE_LIST_FIELDS = [
  { field: 'priority_code', label: 'Priority', entity: 'PriorityValues' },
  { field: 'severity_code', label: 'Severity', entity: 'SeverityValues' },
  { field: 'environment_code', label: 'Environment', entity: 'EnvironmentValues' }
]

// Giữ validation ở backend để draft, UI và OData trực tiếp đều nhận cùng business rule.
async function prepareBugWrite (req, entities, { isCreate }) {
  const bugID = req.params?.[0]?.ID || req.data?.ID
  const oldBug = isCreate ? {} : await readBug(req, entities, bugID)

  if (!isCreate && !oldBug) {
    return req.reject(404, 'Bug not found.')
  }

  if (isCreate) {
    req.data.bugNumber = await nextBugNumber(req, entities)

    const actor = await resolveRequestUser(req, entities)
    let resolvedReporterId = null
    if (actor) {
      resolvedReporterId = actor.ID
    } else {
      const fallbackTester = await firstUserByRole(req, entities, 'TESTER')
      if (fallbackTester) resolvedReporterId = fallbackTester.ID
    }
    req.data.reporter_ID = resolvedReporterId
  }

  const merged = { ...oldBug, ...req.data }
  validateRequiredBugFields(req, merged)
  await validateActiveCodeLists(req, entities, merged)
  await deriveOrValidateComponentCategory(req, entities, merged)

  const finalData = { ...oldBug, ...req.data }
  if (isCreate) {
    req.data.status_code = finalData.assignee_ID ? STATUS.ASSIGNED : STATUS.PENDING_ASSIGNMENT
  } else if (oldBug.assignee_ID !== finalData.assignee_ID) {
    req.data.status_code = finalData.assignee_ID ? STATUS.ASSIGNED : STATUS.PENDING_ASSIGNMENT
  }

  const finalStatus = req.data.status_code || finalData.status_code
  await enforceBugWritePermission(req, entities, oldBug, { ...finalData, ...req.data, status_code: finalStatus }, { isCreate })

  if (!isCreate && req.data.status_code && oldBug.status_code !== req.data.status_code) {
    validateTransition(req, oldBug.status_code, req.data.status_code)
  }

  if (finalStatus === STATUS.REJECTED && !trimToNull(finalData.rejectionReason)) {
    return req.reject(400, 'Rejected bugs must have a rejection reason.', 'rejectionReason')
  }

  if (finalData.assignee_ID) {
    await validateAssignee(req, entities, finalData)
  }

  if (finalStatus === STATUS.PENDING_ASSIGNMENT) {
    req.data.assignee_ID = null
  }

  if (finalStatus !== STATUS.REJECTED && finalStatus !== oldBug.status_code && req.data.rejectionReason === undefined) {
    req.data.rejectionReason = null
  }

  const nextProcessor = await determineNextProcessor(req, entities, { ...finalData, ...req.data })
  req.data.nextProcessorUser_ID = nextProcessor.userID
  req.data.nextProcessorRole_code = nextProcessor.roleCode

  req._oldBug = oldBug
  req._finalBug = { ...finalData, ...req.data }
  req._importantChanges = isCreate ? [] : importantChanges(oldBug, req._finalBug)
}

async function validateActiveCodeLists (req, entities, bug) {
  for (const definition of CODE_LIST_FIELDS) {
    const rawValue = bug[definition.field]

    if (rawValue === null || rawValue === undefined) {
      continue
    }

    if (typeof rawValue !== 'string' || rawValue.trim() !== rawValue || rawValue.length === 0) {
      return req.reject(
        400,
        `${definition.label} must reference an active catalog value.`,
        definition.field
      )
    }

    const target = entities[definition.entity]
    const activeValue = await cds.tx(req).run(
      SELECT.one.from(target).columns('code').where({ code: rawValue, active: true })
    )

    if (!activeValue) {
      return req.reject(
        400,
        `${definition.label} must reference an active catalog value.`,
        definition.field
      )
    }
  }
}

function validateRequiredBugFields (req, bug, { rejectFirst = false } = {}) {
  const required = [
    ['title', 'Title is required.'],
    ['description', 'Description is required.'],
    ['stepsToReproduce', 'Steps to reproduce is required.'],
    ['actualResult', 'Actual result is required.'],
    ['expectedResult', 'Expected result is required.'],
    ['priority_code', 'Priority is required.'],
    ['severity_code', 'Severity is required.'],
    ['applicationComponent_ID', 'Application Component is required.'],
    ['defectCategory_ID', 'Defect Category is required.'],
    ['reporter_ID', 'Reporter is required.']
  ]

  for (const [field, message] of required) {
    if (!trimToNull(bug[field])) {
      if (rejectFirst) return req.reject(400, message, field)
      req.error(400, message, field)
    }
  }
}

async function deriveOrValidateComponentCategory (req, entities, bug) {
  if (!bug.applicationComponent_ID || !bug.defectCategory_ID) return

  const componentCategory = await SELECT.one.from(entities.ComponentCategories).where({
    component_ID: bug.applicationComponent_ID,
    defectCategory_ID: bug.defectCategory_ID,
    active: true
  })

  if (!componentCategory) {
    return req.reject(
      400,
      'The selected Application Component and Defect Category are not a valid Component Category.',
      'defectCategory'
    )
  }

  if (bug.componentCategory_ID && bug.componentCategory_ID !== componentCategory.ID) {
    return req.reject(
      400,
      'Component Category does not match the selected Application Component and Defect Category.',
      'componentCategory'
    )
  }

  req.data.componentCategory_ID = componentCategory.ID
  bug.componentCategory_ID = componentCategory.ID
}

async function validateAssignee (req, entities, bug) {
  const developer = await SELECT.one.from(entities.DeveloperProfiles).where({
    ID: bug.assignee_ID,
    active: true
  })

  if (!developer) {
    return req.reject(400, 'Assigned developer is not active or does not exist.', 'assignee')
  }

  if (developer.availabilityStatus_code === 'UNAVAILABLE') {
    return req.reject(400, 'Assigned developer is unavailable and cannot receive new bugs.', 'assignee')
  }

  const responsibilities = await SELECT.from(entities.DeveloperResponsibilities).where({
    developerProfile_ID: bug.assignee_ID,
    componentCategory_ID: bug.componentCategory_ID,
    active: true
  })

  const hasMatchingResponsibility = responsibilities.some(responsibility => {
    return !bug.sapModule_ID || !responsibility.sapModule_ID || responsibility.sapModule_ID === bug.sapModule_ID
  })

  if (!hasMatchingResponsibility) {
    return req.reject(
      400,
      'Assigned developer is not responsible for the selected component/category and SAP module scope.',
      'assignee'
    )
  }
}

function validateTransition (req, fromStatus, toStatus) {
  if (!fromStatus || fromStatus === toStatus) return
  const allowed = ALLOWED_TRANSITIONS[fromStatus] || []
  if (!allowed.includes(toStatus)) {
    return req.reject(400, `Status transition from ${fromStatus} to ${toStatus} is not allowed.`, 'status')
  }
}

async function determineNextProcessor (req, entities, bug) {
  if (bug.status_code === STATUS.CLOSED) {
    return { userID: null, roleCode: PROCESSOR_ROLE.NONE }
  }

  if (bug.status_code === STATUS.PENDING_ASSIGNMENT) {
    const pm = await firstUserByRole(req, entities, 'PM')
    return { userID: pm?.ID || null, roleCode: PROCESSOR_ROLE.PM }
  }

  if (DEVELOPER_STATUSES.has(bug.status_code)) {
    const assigneeUserID = await userIDForDeveloper(req, entities, bug.assignee_ID)
    if (assigneeUserID) return { userID: assigneeUserID, roleCode: PROCESSOR_ROLE.DEVELOPER }
    const pm = await firstUserByRole(req, entities, 'PM')
    return { userID: pm?.ID || null, roleCode: PROCESSOR_ROLE.PM }
  }

  if (TESTER_STATUSES.has(bug.status_code)) {
    const testerID = bug.reporter_ID || (await firstUserByRole(req, entities, 'TESTER'))?.ID
    return { userID: testerID || null, roleCode: PROCESSOR_ROLE.TESTER }
  }

  const tester = await firstUserByRole(req, entities, 'TESTER')
  return { userID: bug.reporter_ID || tester?.ID || null, roleCode: PROCESSOR_ROLE.UNASSIGNED_QUEUE }
}

module.exports = {
  prepareBugWrite,
  determineNextProcessor,
  validateActiveCodeLists,
  validateRequiredBugFields,
  validateAssignee,
  validateTransition
}
