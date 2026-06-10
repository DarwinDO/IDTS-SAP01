const cds = require('@sap/cds')

const STATUS = {
  NEW: 'NEW',
  PENDING_ASSIGNMENT: 'PENDING_ASSIGNMENT',
  ASSIGNED: 'ASSIGNED',
  IN_REVIEW: 'IN_REVIEW',
  NEED_MORE_INFORMATION: 'NEED_MORE_INFORMATION',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  RETEST_REQUIRED: 'RETEST_REQUIRED',
  REJECTED: 'REJECTED',
  REOPENED: 'REOPENED',
  CLOSED: 'CLOSED'
}

const PROCESSOR_ROLE = {
  TESTER: 'TESTER',
  DEVELOPER: 'DEVELOPER',
  PM: 'PM',
  UNASSIGNED_QUEUE: 'UNASSIGNED_QUEUE',
  NONE: 'NONE'
}

const USER_ROLE = {
  TESTER: 'TESTER',
  DEVELOPER: 'DEVELOPER',
  PM: 'PM'
}

const ACTION = {
  CREATE: 'CREATE',
  EDIT: 'EDIT',
  ASSIGN: 'ASSIGN',
  REASSIGN: 'REASSIGN',
  STATUS_CHANGE: 'STATUS_CHANGE',
  REQUEST_INFO: 'REQUEST_INFO',
  REJECT: 'REJECT',
  RESOLVE: 'RESOLVE',
  RETEST: 'RETEST',
  CLOSE: 'CLOSE',
  REOPEN: 'REOPEN'
}

const COORDINATOR_ROLES = new Set([USER_ROLE.TESTER, USER_ROLE.PM])
const COMMENT_ROLES = new Set([USER_ROLE.TESTER, USER_ROLE.DEVELOPER, USER_ROLE.PM])
const DEVELOPER_ACTIONS = new Set([
  ACTION.STATUS_CHANGE,
  ACTION.REQUEST_INFO,
  ACTION.REJECT,
  ACTION.RESOLVE
])
const DEVELOPER_DIRECT_STATUSES = new Set([
  STATUS.IN_REVIEW,
  STATUS.NEED_MORE_INFORMATION,
  STATUS.IN_PROGRESS,
  STATUS.RESOLVED,
  STATUS.REJECTED
])

const EVENT = {
  ASSIGNED: 'ASSIGNED',
  NEED_MORE_INFORMATION: 'NEED_MORE_INFORMATION',
  UPDATED: 'UPDATED',
  REJECTED: 'REJECTED',
  CLOSED: 'CLOSED'
}

const ALLOWED_TRANSITIONS = {
  [STATUS.NEW]: [STATUS.PENDING_ASSIGNMENT, STATUS.ASSIGNED, STATUS.REJECTED],
  [STATUS.PENDING_ASSIGNMENT]: [STATUS.ASSIGNED, STATUS.REJECTED],
  [STATUS.ASSIGNED]: [
    STATUS.PENDING_ASSIGNMENT,
    STATUS.ASSIGNED,
    STATUS.IN_REVIEW,
    STATUS.NEED_MORE_INFORMATION,
    STATUS.IN_PROGRESS,
    STATUS.REJECTED
  ],
  [STATUS.IN_REVIEW]: [
    STATUS.ASSIGNED,
    STATUS.NEED_MORE_INFORMATION,
    STATUS.IN_PROGRESS,
    STATUS.RESOLVED,
    STATUS.REJECTED
  ],
  [STATUS.NEED_MORE_INFORMATION]: [STATUS.ASSIGNED, STATUS.IN_REVIEW, STATUS.REJECTED],
  [STATUS.IN_PROGRESS]: [STATUS.NEED_MORE_INFORMATION, STATUS.RESOLVED, STATUS.REJECTED],
  [STATUS.RESOLVED]: [STATUS.RETEST_REQUIRED, STATUS.CLOSED, STATUS.REOPENED],
  [STATUS.RETEST_REQUIRED]: [STATUS.CLOSED, STATUS.REOPENED],
  [STATUS.REJECTED]: [STATUS.PENDING_ASSIGNMENT, STATUS.ASSIGNED, STATUS.NEED_MORE_INFORMATION],
  [STATUS.REOPENED]: [STATUS.ASSIGNED, STATUS.IN_REVIEW, STATUS.IN_PROGRESS],
  [STATUS.CLOSED]: [STATUS.REOPENED]
}

const DEVELOPER_STATUSES = new Set([
  STATUS.ASSIGNED,
  STATUS.IN_REVIEW,
  STATUS.IN_PROGRESS,
  STATUS.REOPENED
])

const TESTER_STATUSES = new Set([
  STATUS.NEED_MORE_INFORMATION,
  STATUS.REJECTED,
  STATUS.RESOLVED,
  STATUS.RETEST_REQUIRED
])

module.exports = class BugService extends cds.ApplicationService {
  async init () {
    const entities = this.entities
    const { Bugs, Comments } = entities

    this.before('CREATE', Bugs, req => prepareBugWrite(req, entities, { isCreate: true }))
    this.before('UPDATE', Bugs, req => prepareBugWrite(req, entities, { isCreate: false }))
    this.before('CREATE', Comments, req => prepareCommentCreate(req, entities))
    this.after('CREATE', Bugs, (data, req) => recordCreateSideEffects(req, data, entities))
    this.after('UPDATE', Bugs, (data, req) => recordUpdateSideEffects(req, entities))

    this.on('assignToDeveloper', req => assignToDeveloper(req, entities))
    this.on('moveToPendingAssignment', req => transitionBug(req, entities, {
      status: STATUS.PENDING_ASSIGNMENT,
      actionType: ACTION.REASSIGN,
      reason: req.data.reason,
      clearAssignee: true,
      requireReason: false
    }))
    this.on('markInReview', req => transitionBug(req, entities, {
      status: STATUS.IN_REVIEW,
      actionType: ACTION.STATUS_CHANGE,
      reason: req.data.note,
      requireAssignee: true
    }))
    this.on('requestMoreInformation', req => transitionBug(req, entities, {
      status: STATUS.NEED_MORE_INFORMATION,
      actionType: ACTION.REQUEST_INFO,
      reason: req.data.reason,
      requireAssignee: true,
      requireReason: true
    }))
    this.on('rejectBug', req => transitionBug(req, entities, {
      status: STATUS.REJECTED,
      actionType: ACTION.REJECT,
      reason: req.data.reason,
      requireAssignee: true,
      requireReason: true
    }))
    this.on('startProgress', req => transitionBug(req, entities, {
      status: STATUS.IN_PROGRESS,
      actionType: ACTION.STATUS_CHANGE,
      reason: req.data.note,
      requireAssignee: true
    }))
    this.on('resolveBug', req => transitionBug(req, entities, {
      status: STATUS.RESOLVED,
      actionType: ACTION.RESOLVE,
      reason: req.data.note,
      requireAssignee: true
    }))
    this.on('sendToRetest', req => transitionBug(req, entities, {
      status: STATUS.RETEST_REQUIRED,
      actionType: ACTION.RETEST,
      reason: req.data.note
    }))
    this.on('closeBug', req => transitionBug(req, entities, {
      status: STATUS.CLOSED,
      actionType: ACTION.CLOSE,
      reason: req.data.note
    }))
    this.on('reopenBug', req => transitionBug(req, entities, {
      status: STATUS.REOPENED,
      actionType: ACTION.REOPEN,
      reason: req.data.reason,
      requireReason: true
    }))

    return super.init()
  }
}

async function prepareBugWrite (req, entities, { isCreate }) {
  const bugID = bugIDFrom(req)
  const oldBug = isCreate ? {} : await readBug(req, entities, bugID)

  if (!isCreate && !oldBug) {
    return req.reject(404, 'Bug not found.')
  }

  if (isCreate && !req.data.bugNumber) {
    req.data.bugNumber = await nextBugNumber(req, entities)
  }

  if (isCreate && !req.data.reporter_ID) {
    const fallbackTester = await firstUserByRole(req, entities, 'TESTER')
    if (fallbackTester) req.data.reporter_ID = fallbackTester.ID
  }

  const merged = { ...oldBug, ...req.data }
  validateRequiredBugFields(req, merged)
  await deriveOrValidateComponentCategory(req, entities, merged)

  const finalData = { ...oldBug, ...req.data }
  if (isCreate && !finalData.status_code) {
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

async function assignToDeveloper (req, entities) {
  const assigneeID = trimToNull(req.data.assigneeID)
  if (!assigneeID) {
    return req.reject(400, 'Assign Developer requires an assigneeID parameter.', 'assigneeID')
  }

  return transitionBug(req, entities, {
    status: STATUS.ASSIGNED,
    actionType: ACTION.ASSIGN,
    reason: req.data.note,
    assigneeID,
    clearRejectionReason: true
  })
}

async function transitionBug (req, entities, options) {
  const bugID = bugIDFrom(req)
  const oldBug = await readBug(req, entities, bugID)
  if (!oldBug) return req.reject(404, 'Bug not found.')

  await enforceActionPermission(req, entities, oldBug, options.actionType)

  if (options.requireReason && !trimToNull(options.reason)) {
    return req.reject(400, 'This action requires a reason.', reasonTarget(options.actionType))
  }

  if (options.requireAssignee && !oldBug.assignee_ID && !options.assigneeID) {
    return req.reject(400, 'This action requires an assigned developer.', 'assignee')
  }

  validateTransition(req, oldBug.status_code, options.status)

  const patch = {
    status_code: options.status
  }

  if (options.assigneeID) patch.assignee_ID = options.assigneeID
  if (options.clearAssignee) patch.assignee_ID = null
  if (options.status === STATUS.REJECTED) patch.rejectionReason = trimToNull(options.reason)
  if (options.clearRejectionReason) patch.rejectionReason = null

  const nextState = { ...oldBug, ...patch }
  if (nextState.assignee_ID) {
    await validateAssignee(req, entities, nextState)
  }

  const nextProcessor = await determineNextProcessor(req, entities, nextState)
  patch.nextProcessorUser_ID = nextProcessor.userID
  patch.nextProcessorRole_code = nextProcessor.roleCode

  const tx = cds.tx(req)
  await tx.run(UPDATE(entities.Bugs).set(patch).where({ ID: bugID }))

  const updatedBug = await tx.run(SELECT.one.from(entities.Bugs).where({ ID: bugID }))
  const actorID = await actorForAction(req, entities, oldBug, options.actionType)

  await writeHistory(req, entities, {
    bugID,
    actorID,
    actionType: options.actionType,
    fieldName: 'status',
    oldValue: oldBug.status_code,
    newValue: options.status,
    reason: trimToNull(options.reason)
  })

  if (oldBug.assignee_ID !== updatedBug.assignee_ID) {
    await writeHistory(req, entities, {
      bugID,
      actorID,
      actionType: oldBug.assignee_ID ? ACTION.REASSIGN : ACTION.ASSIGN,
      fieldName: 'assignee',
      oldValue: oldBug.assignee_ID,
      newValue: updatedBug.assignee_ID,
      reason: trimToNull(options.reason)
    })
  }

  if (oldBug.nextProcessorUser_ID !== updatedBug.nextProcessorUser_ID) {
    await writeHistory(req, entities, {
      bugID,
      actorID,
      actionType: options.actionType,
      fieldName: 'nextProcessorUser',
      oldValue: oldBug.nextProcessorUser_ID,
      newValue: updatedBug.nextProcessorUser_ID,
      reason: trimToNull(options.reason)
    })
  }

  if (oldBug.nextProcessorRole_code !== updatedBug.nextProcessorRole_code) {
    await writeHistory(req, entities, {
      bugID,
      actorID,
      actionType: options.actionType,
      fieldName: 'nextProcessorRole',
      oldValue: oldBug.nextProcessorRole_code,
      newValue: updatedBug.nextProcessorRole_code,
      reason: trimToNull(options.reason)
    })
  }

  await writeNotificationForStatus(req, entities, updatedBug, options.status)
  return updatedBug
}

async function prepareCommentCreate (req, entities) {
  req.data.content = trimToNull(req.data.content)
  if (!req.data.content) {
    return req.reject(400, 'Comment content is required.', 'content')
  }

  const actor = await resolveRequestUser(req, entities)
  if (actor) {
    if (!COMMENT_ROLES.has(actor.role_code)) {
      return req.reject(403, 'Only Tester, Developer, or PM users can add comments.')
    }

    if (req.data.author_ID && req.data.author_ID !== actor.ID) {
      return req.reject(403, 'Users cannot create comments on behalf of another user.', 'author')
    }

    req.data.author_ID = actor.ID
    req.data.authorRole_code = actor.role_code
  }

  if (!req.data.author_ID) {
    return req.reject(400, 'Comment author is required.', 'author')
  }

  const author = await cds.tx(req).run(SELECT.one.from(entities.Users).where({
    ID: req.data.author_ID,
    active: true
  }))

  if (!author) {
    return req.reject(400, 'Comment author must be an active user.', 'author')
  }

  if (!COMMENT_ROLES.has(author.role_code)) {
    return req.reject(400, 'Comment author must be a Tester, Developer, or PM user.', 'authorRole')
  }

  if (!req.data.authorRole_code) {
    req.data.authorRole_code = author.role_code
  }
}

async function enforceBugWritePermission (req, entities, oldBug, nextBug, { isCreate }) {
  const actor = await resolveRequestUser(req, entities)
  if (!actor) return

  if (isCreate) {
    if (COORDINATOR_ROLES.has(actor.role_code)) return
    return req.reject(403, 'Only Tester or PM users can create bug reports.')
  }

  const statusChanged = oldBug.status_code !== nextBug.status_code
  const assigneeChanged = oldBug.assignee_ID !== nextBug.assignee_ID

  if (assigneeChanged && !COORDINATOR_ROLES.has(actor.role_code)) {
    return req.reject(403, 'Only Tester or PM users can assign or reassign bugs.', 'assignee')
  }

  if (!statusChanged) return

  if (COORDINATOR_ROLES.has(actor.role_code)) return

  const canDeveloperProcess = actor.role_code === USER_ROLE.DEVELOPER &&
    DEVELOPER_DIRECT_STATUSES.has(nextBug.status_code) &&
    await isAssignedDeveloper(req, entities, actor.ID, oldBug)

  if (canDeveloperProcess) return

  return req.reject(
    403,
    'Only the assigned developer, Tester, or PM can change the bug processing status.',
    'status'
  )
}

async function enforceActionPermission (req, entities, bug, actionType) {
  const actor = await resolveRequestUser(req, entities)
  if (!actor) return

  if (COORDINATOR_ROLES.has(actor.role_code)) return

  const canDeveloperProcess = actor.role_code === USER_ROLE.DEVELOPER &&
    DEVELOPER_ACTIONS.has(actionType) &&
    await isAssignedDeveloper(req, entities, actor.ID, bug)

  if (canDeveloperProcess) return

  return req.reject(
    403,
    'Only the assigned developer, Tester, or PM can perform this bug processing action.'
  )
}

async function isAssignedDeveloper (req, entities, userID, bug) {
  if (!userID || !bug?.assignee_ID) return false
  const assigneeUserID = await userIDForDeveloper(req, entities, bug.assignee_ID)
  return assigneeUserID === userID
}

async function resolveRequestUser (req, entities) {
  for (const candidate of requestUserCandidates(req)) {
    const user = await activeUserFromCandidate(req, entities, candidate)
    if (user) return user
  }

  return null
}

async function activeUserFromCandidate (req, entities, candidate) {
  const tx = cds.tx(req)

  const byID = await tx.run(SELECT.one.from(entities.Users).where({ ID: candidate, active: true }))
  if (byID) return byID

  const byEmail = await tx.run(SELECT.one.from(entities.Users).where({ email: candidate, active: true }))
  if (byEmail) return byEmail

  return tx.run(SELECT.one.from(entities.Users).where({ displayName: candidate, active: true }))
}

function requestUserCandidates (req) {
  const attributes = req.user?.attr || {}
  const values = [
    req.user?.id,
    attributes.email,
    attributes.user_name,
    attributes.login_name,
    attributes.name,
    attributes.given_name
  ]

  return values
    .flatMap(value => Array.isArray(value) ? value : [value])
    .map(value => typeof value === 'string' ? value.trim() : value)
    .filter(value => value && value !== 'anonymous')
}

function validateRequiredBugFields (req, bug) {
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
    if (!trimToNull(bug[field])) req.error(400, message, field)
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

async function recordCreateSideEffects (req, data, entities) {
  if (!data?.ID) return
  const bug = await readBug(req, entities, data.ID)
  const actorID = bug.reporter_ID || (await firstUserByRole(req, entities, 'TESTER'))?.ID

  await writeHistory(req, entities, {
    bugID: data.ID,
    actorID,
    actionType: ACTION.CREATE,
    fieldName: 'status',
    oldValue: null,
    newValue: bug.status_code,
    reason: 'Bug report created.'
  })

  await writeNotificationForStatus(req, entities, bug, bug.status_code)
}

async function recordUpdateSideEffects (req, entities) {
  const changes = req._importantChanges || []
  if (!changes.length) return

  const actorID = req._finalBug?.reporter_ID || (await firstUserByRole(req, entities, 'PM'))?.ID
  for (const change of changes) {
    await writeHistory(req, entities, {
      bugID: req._finalBug.ID,
      actorID,
      actionType: actionTypeForChange(change),
      fieldName: change.fieldName,
      oldValue: change.oldValue,
      newValue: change.newValue,
      reason: change.fieldName === 'rejectionReason' ? change.newValue : null
    })
  }

  const statusChange = changes.find(change => change.fieldName === 'status')
  if (statusChange) {
    await writeNotificationForStatus(req, entities, req._finalBug, statusChange.newValue)
  }
}

function importantChanges (oldBug, finalBug) {
  const tracked = [
    ['status_code', 'status'],
    ['assignee_ID', 'assignee'],
    ['sapModule_ID', 'sapModule'],
    ['applicationComponent_ID', 'applicationComponent'],
    ['defectCategory_ID', 'defectCategory'],
    ['componentCategory_ID', 'componentCategory'],
    ['nextProcessorUser_ID', 'nextProcessorUser'],
    ['nextProcessorRole_code', 'nextProcessorRole'],
    ['rejectionReason', 'rejectionReason']
  ]

  return tracked
    .filter(([field]) => oldBug[field] !== finalBug[field])
    .map(([field, fieldName]) => ({
      fieldName,
      oldValue: oldBug[field],
      newValue: finalBug[field]
    }))
}

function actionTypeForChange (change) {
  if (change.fieldName === 'status') return ACTION.STATUS_CHANGE
  if (change.fieldName === 'assignee') return change.oldValue ? ACTION.REASSIGN : ACTION.ASSIGN
  if (change.fieldName === 'rejectionReason') return ACTION.REJECT
  return ACTION.EDIT
}

async function writeHistory (req, entities, entry) {
  if (!entry.actorID) return
  const actor = await SELECT.one.from(entities.Users).where({ ID: entry.actorID })
  await cds.tx(req).run(INSERT.into(entities.HistoryLogs).entries({
    bug_ID: entry.bugID,
    actor_ID: entry.actorID,
    actorRole_code: actor?.role_code,
    actionType_code: entry.actionType,
    fieldName: entry.fieldName,
    oldValue: toHistoryValue(entry.oldValue),
    newValue: toHistoryValue(entry.newValue),
    reason: entry.reason
  }))
}

async function writeNotificationForStatus (req, entities, bug, status) {
  const notification = notificationTargetForStatus(bug, status)
  if (!notification?.recipientID || !notification.eventType) return

  await cds.tx(req).run(INSERT.into(entities.Notifications).entries({
    bug_ID: bug.ID,
    recipient_ID: notification.recipientID,
    eventType_code: notification.eventType,
    channel_code: 'IN_APP',
    deliveryStatus_code: 'PENDING',
    message: notification.message
  }))
}

function notificationTargetForStatus (bug, status) {
  if (status === STATUS.ASSIGNED && bug.nextProcessorUser_ID) {
    return {
      recipientID: bug.nextProcessorUser_ID,
      eventType: EVENT.ASSIGNED,
      message: `${bug.bugNumber || 'Bug'} has been assigned.`
    }
  }

  if (status === STATUS.NEED_MORE_INFORMATION && bug.nextProcessorUser_ID) {
    return {
      recipientID: bug.nextProcessorUser_ID,
      eventType: EVENT.NEED_MORE_INFORMATION,
      message: `${bug.bugNumber || 'Bug'} needs more information.`
    }
  }

  if (status === STATUS.REJECTED && bug.nextProcessorUser_ID) {
    return {
      recipientID: bug.nextProcessorUser_ID,
      eventType: EVENT.REJECTED,
      message: `${bug.bugNumber || 'Bug'} was rejected and needs follow-up.`
    }
  }

  if (status === STATUS.RESOLVED && bug.nextProcessorUser_ID) {
    return {
      recipientID: bug.nextProcessorUser_ID,
      eventType: EVENT.UPDATED,
      message: `${bug.bugNumber || 'Bug'} is resolved and ready for verification.`
    }
  }

  if (status === STATUS.RETEST_REQUIRED && bug.nextProcessorUser_ID) {
    return {
      recipientID: bug.nextProcessorUser_ID,
      eventType: EVENT.UPDATED,
      message: `${bug.bugNumber || 'Bug'} requires retest.`
    }
  }

  if (status === STATUS.REOPENED && bug.nextProcessorUser_ID) {
    return {
      recipientID: bug.nextProcessorUser_ID,
      eventType: EVENT.UPDATED,
      message: `${bug.bugNumber || 'Bug'} was reopened and needs follow-up.`
    }
  }

  if (status === STATUS.CLOSED && bug.reporter_ID) {
    return {
      recipientID: bug.reporter_ID,
      eventType: EVENT.CLOSED,
      message: `${bug.bugNumber || 'Bug'} has been closed.`
    }
  }

  return null
}

async function actorForAction (req, entities, bug, actionType) {
  const actor = await resolveRequestUser(req, entities)
  if (actor) return actor.ID

  if ([ACTION.REQUEST_INFO, ACTION.REJECT, ACTION.RESOLVE, ACTION.STATUS_CHANGE].includes(actionType)) {
    const assigneeUserID = await userIDForDeveloper(req, entities, bug.assignee_ID)
    if (assigneeUserID) return assigneeUserID
  }

  if ([ACTION.ASSIGN, ACTION.REASSIGN, ACTION.RETEST, ACTION.CLOSE, ACTION.REOPEN].includes(actionType)) {
    if (bug.nextProcessorUser_ID) return bug.nextProcessorUser_ID
    if (bug.reporter_ID) return bug.reporter_ID
  }

  return bug.reporter_ID || (await firstUserByRole(req, entities, 'PM'))?.ID
}

async function readBug (req, entities, bugID) {
  if (!bugID) return null
  return cds.tx(req).run(SELECT.one.from(entities.Bugs).where({ ID: bugID }))
}

async function nextBugNumber (req, entities) {
  const result = await cds.tx(req).run(SELECT.one.from(entities.Bugs).columns('count(*) as count'))
  const next = Number(result?.count || 0) + 1
  return `BUG-${String(next).padStart(4, '0')}`
}

async function firstUserByRole (req, entities, roleCode) {
  return cds.tx(req).run(SELECT.one.from(entities.Users).where({ role_code: roleCode, active: true }))
}

async function userIDForDeveloper (req, entities, developerProfileID) {
  if (!developerProfileID) return null
  const profile = await cds.tx(req).run(SELECT.one.from(entities.DeveloperProfiles).where({ ID: developerProfileID }))
  return profile?.user_ID || null
}

function bugIDFrom (req) {
  return req.params?.[0]?.ID || req.data?.ID
}

function trimToNull (value) {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed || null
}

function reasonTarget (actionType) {
  return actionType === ACTION.REOPEN ? 'reason' : 'reason'
}

function toHistoryValue (value) {
  if (value === null || value === undefined) return null
  return String(value).slice(0, 1000)
}
