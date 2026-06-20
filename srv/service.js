const cds = require('@sap/cds')

const { INSERT, SELECT, UPDATE } = cds.ql

const {
  ALLOWED_TRANSITIONS,
  ACCEPTED_ATTACHMENT_MEDIA_TYPES,
  ACTION,
  ATTACHMENT_ROLES,
  COMMENT_ROLES,
  COORDINATOR_ROLES,
  DEVELOPER_ACTIONS,
  DEVELOPER_DIRECT_STATUSES,
  DEVELOPER_STATUSES,
  MAX_ATTACHMENT_BYTES,
  PROCESSOR_ROLE,
  READ_ONLY_ENTITY_NAMES,
  STATUS,
  TESTER_STATUSES,
  USER_ROLE
} = require('./bug-service/constants')

const {
  attachmentIDFrom,
  bugIDFrom,
  extractAttachmentContent,
  fileNameFromHeaders,
  firstUserByRole,
  isAttachmentContentRequest,
  isEnvelopeMediaType,
  nextBugNumber,
  normalizeMediaType,
  readAttachment,
  readBug,
  reasonTarget,
  requestHeaders,
  resolveRequestUser,
  trimToNull,
  userIDForDeveloper
} = require('./bug-service/helpers')

const {
  actorForAction,
  importantChanges,
  recordAttachmentWriteSideEffects,
  recordBugChangeSideEffects,
  recordCommentCreateSideEffects,
  recordCreateSideEffects,
  recordDraftAttachmentSaveSideEffects,
  recordUpdateSideEffects,
  writeHistoryEvent,
  writeNotificationForStatus,
  writeNotificationRecord
} = require('./bug-service/history')

const {
  enrichBugCapabilities,
  enrichBugDisplayFields,
  ensureCapabilitySelectDependencies,
  readAssignableDevelopers
} = require('./bug-service/read-models')

module.exports = class BugService extends cds.ApplicationService {
  async init () {
    const entities = this.entities
    const { Bugs, Comments, Attachments } = entities

    const commentTargets = [Comments, Comments?.drafts].filter(Boolean)
    const attachmentTargets = [Attachments, Attachments?.drafts].filter(Boolean)

    registerReadOnlyEntityGuards(this, entities)
    this.before('READ', Bugs, req => ensureCapabilitySelectDependencies(req))
    this.before('READ', Bugs.drafts, req => ensureCapabilitySelectDependencies(req))
    this.before('CREATE', Bugs, req => prepareBugWrite(req, entities, { isCreate: true }))
    this.before('UPDATE', Bugs, req => prepareBugWrite(req, entities, { isCreate: false }))
    this.before('PATCH', Bugs.drafts, req => prepareDraftPatch(req, entities))

    for (const target of commentTargets) {
      this.before('CREATE', target, req => prepareCommentCreate(req, entities))
    }

    for (const target of attachmentTargets) {
      this.before('CREATE', target, req => prepareAttachmentWrite(req, entities, { isCreate: true }))
      this.before('UPDATE', target, req => prepareAttachmentWrite(req, entities, { isCreate: false }))
      this.before('PATCH', target, req => prepareAttachmentWrite(req, entities, { isCreate: false }))
    }

    this.after('CREATE', Bugs, (data, req) => recordCreateSideEffects(req, data, entities))
    this.after('UPDATE', Bugs, (data, req) => recordUpdateSideEffects(req, entities))

    for (const target of commentTargets) {
      this.after('CREATE', target, (data, req) => recordCommentCreateSideEffects(req, data, entities))
    }

    for (const target of attachmentTargets) {
      this.after('CREATE', target, (data, req) => recordAttachmentWriteSideEffects(req, data, entities, { isCreate: true }))
      this.after('UPDATE', target, (data, req) => recordAttachmentWriteSideEffects(req, data, entities, { isCreate: false }))
      this.after('PATCH', target, (data, req) => recordAttachmentWriteSideEffects(req, data, entities, { isCreate: false }))
    }

    this.after('READ', Bugs, async (bugs, req) => {
      await enrichBugDisplayFields(bugs, req, entities)
      await enrichBugCapabilities(bugs, req, entities)
    })
    this.after('READ', Bugs.drafts, async (bugs, req) => {
      await enrichBugDisplayFields(bugs, req, entities)
      await enrichBugCapabilities(bugs, req, entities)
    })

    this.on('READ', entities.AssignableDevelopers, req => readAssignableDevelopers(req, entities))
    this.on('SAVE', Bugs.drafts, (req, next) => handleDraftSave(req, entities, next))

    this.on('assignToDeveloper', req => assignToDeveloper(req, entities))
    this.on('addComment', req => addComment(req, entities))
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
    this.on('resubmitToDeveloper', req => resubmitToDeveloper(req, entities))
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
      requireAssignee: true,
      requireReason: true
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

function registerReadOnlyEntityGuards (service, entities) {
  const targets = READ_ONLY_ENTITY_NAMES
    .flatMap(name => [entities[name], entities[name]?.drafts])
    .filter(Boolean)

  for (const target of targets) {
    for (const event of ['CREATE', 'UPDATE', 'PATCH', 'DELETE']) {
      service.before(event, target, req => {
        req.reject(405, `${target.name} is read-only in BugService.`)
      })
    }
  }
}

async function prepareBugWrite (req, entities, { isCreate }) {
  const bugID = bugIDFrom(req)
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

async function resubmitToDeveloper (req, entities) {
  const bugID = bugIDFrom(req)
  const oldBug = await readBug(req, entities, bugID)
  if (!oldBug) return req.reject(404, 'Bug not found.')

  const actor = await resolveRequestUser(req, entities)
  if (actor && !COORDINATOR_ROLES.has(actor.role_code)) {
    return req.reject(403, 'Only Tester or PM users can resubmit a bug to the developer.')
  }

  const note = trimToNull(req.data.note)
  if (!note) {
    return req.reject(400, 'Resubmitting to the developer requires an update summary.', 'note')
  }

  if (!oldBug.assignee_ID) {
    return req.reject(400, 'This action requires an assigned developer.', 'assignee')
  }

  validateTransition(req, oldBug.status_code, STATUS.ASSIGNED)

  const patch = {
    status_code: STATUS.ASSIGNED
  }

  const nextState = { ...oldBug, ...patch }
  const nextProcessor = await determineNextProcessor(req, entities, nextState)
  patch.nextProcessorUser_ID = nextProcessor.userID
  patch.nextProcessorRole_code = nextProcessor.roleCode

  const tx = cds.tx(req)
  await tx.run(UPDATE(entities.Bugs).set(patch).where({ ID: bugID }))

  const updatedBug = await tx.run(SELECT.one.from(entities.Bugs).where({ ID: bugID }))
  const actorUser = actor || (oldBug.reporter_ID
    ? await tx.run(SELECT.one.from(entities.Users).where({ ID: oldBug.reporter_ID }))
    : null)

  if (actorUser?.ID) {
    await tx.run(
      INSERT.into(entities.Comments).entries({
        ID: cds.utils.uuid(),
        bug_ID: bugID,
        author_ID: actorUser.ID,
        authorRole_code: actorUser.role_code,
        content: `Resubmitted after information request: ${note}`
      })
    )
  }

  const historyChanges = [
    {
      fieldName: 'status',
      oldValue: oldBug.status_code,
      newValue: updatedBug.status_code
    }
  ]

  if (oldBug.nextProcessorUser_ID !== updatedBug.nextProcessorUser_ID) {
    historyChanges.push({
      fieldName: 'nextProcessorUser',
      oldValue: oldBug.nextProcessorUser_ID,
      newValue: updatedBug.nextProcessorUser_ID
    })
  }

  if (oldBug.nextProcessorRole_code !== updatedBug.nextProcessorRole_code) {
    historyChanges.push({
      fieldName: 'nextProcessorRole',
      oldValue: oldBug.nextProcessorRole_code,
      newValue: updatedBug.nextProcessorRole_code
    })
  }

  await writeHistoryEvent(req, entities, {
    bugID,
    actorID: actorUser?.ID || oldBug.reporter_ID,
    actionType: ACTION.STATUS_CHANGE,
    reason: note,
    summary: 'Resubmitted bug to the assigned developer after additional information was provided.',
    changes: historyChanges
  })

  if (updatedBug.nextProcessorUser_ID) {
    await writeNotificationRecord(req, entities, {
      bugID,
      recipientID: updatedBug.nextProcessorUser_ID,
      eventType: 'UPDATED',
      message: `${updatedBug.bugNumber || 'Bug'} was resubmitted with additional information.`
    })
  }

  return updatedBug
}

async function addComment (req, entities) {
  const bugID = bugIDFrom(req)
  const bug = await readBug(req, entities, bugID)
  if (!bug) return req.reject(404, 'Bug not found.')

  const actor = await resolveRequestUser(req, entities)
  if (!actor || !COMMENT_ROLES.has(actor.role_code)) {
    return req.reject(403, 'Only Tester, Developer, or PM users can add comments.')
  }

  const content = trimToNull(req.data.content)
  if (!content) {
    return req.reject(400, 'Comment content is required.', 'content')
  }

  const tx = cds.tx(req)
  const commentID = cds.utils.uuid()
  await tx.run(
    INSERT.into(entities.Comments).entries({
      ID: commentID,
      bug_ID: bug.ID,
      author_ID: actor.ID,
      authorRole_code: actor.role_code,
      content
    })
  )

  await writeHistoryEvent(req, entities, {
    bugID: bug.ID,
    actorID: actor.ID,
    actionType: ACTION.EDIT,
    reason: null,
    summary: 'Added a comment.',
    changes: [
      {
        fieldName: 'comment',
        oldValue: null,
        newValue: content
      }
    ]
  })

  return tx.run(SELECT.one.from(entities.Bugs).where({ ID: bug.ID }))
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
  const historyChanges = [
    {
      fieldName: 'status',
      oldValue: oldBug.status_code,
      newValue: options.status
    }
  ]

  if (oldBug.assignee_ID !== updatedBug.assignee_ID) {
    historyChanges.push({
      fieldName: 'assignee',
      oldValue: oldBug.assignee_ID,
      newValue: updatedBug.assignee_ID
    })
  }

  if (oldBug.nextProcessorUser_ID !== updatedBug.nextProcessorUser_ID) {
    historyChanges.push({
      fieldName: 'nextProcessorUser',
      oldValue: oldBug.nextProcessorUser_ID,
      newValue: updatedBug.nextProcessorUser_ID
    })
  }

  if (oldBug.nextProcessorRole_code !== updatedBug.nextProcessorRole_code) {
    historyChanges.push({
      fieldName: 'nextProcessorRole',
      oldValue: oldBug.nextProcessorRole_code,
      newValue: updatedBug.nextProcessorRole_code
    })
  }

  await writeHistoryEvent(req, entities, {
    bugID,
    actorID,
    actionType: options.actionType,
    reason: trimToNull(options.reason),
    changes: historyChanges
  })

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

async function prepareAttachmentWrite (req, entities, { isCreate }) {
  const headers = requestHeaders(req)
  const actor = await resolveRequestUser(req, entities)
  const attachmentID = attachmentIDFrom(req)

  if (!isCreate && attachmentID) {
    req._oldAttachment = await readAttachment(req, req.target, attachmentID)
  }

  if (actor && !ATTACHMENT_ROLES.has(actor.role_code)) {
    return req.reject(403, 'Only Tester, Developer, or PM users can upload attachments.')
  }

  if (!req.data.ID && isCreate) {
    req.data.ID = cds.utils.uuid()
  }

  if (req.data.uploadedBy_ID && actor && req.data.uploadedBy_ID !== actor.ID) {
    return req.reject(403, 'Users cannot upload attachments on behalf of another user.', 'uploadedBy')
  }

  if (actor) {
    req.data.uploadedBy_ID = actor.ID
  }

  const uploadedByID = req.data.uploadedBy_ID || (isCreate ? null : undefined)
  if (uploadedByID === null) {
    return req.reject(400, 'Attachment uploader is required.', 'uploadedBy')
  }

  if (req.data.uploadedBy_ID) {
    const uploader = await cds.tx(req).run(SELECT.one.from(entities.Users).where({
      ID: req.data.uploadedBy_ID,
      active: true
    }))

    if (!uploader) {
      return req.reject(400, 'Attachment uploader must be an active user.', 'uploadedBy')
    }

    if (!ATTACHMENT_ROLES.has(uploader.role_code)) {
      return req.reject(400, 'Attachment uploader must be a Tester, Developer, or PM user.', 'uploadedBy')
    }
  }

  if (isCreate && !req.data.storageRef) {
    req.data.storageRef = `db://attachments/${req.data.ID}`
  }

  if (isAttachmentContentRequest(req) && req.data.content == null) {
    const binaryContent = await extractAttachmentContent(req)
    if (binaryContent) {
      req.data.content = binaryContent
      if (!req.data.fileSize) req.data.fileSize = binaryContent.length
    }
  }

  const headerMediaType = normalizeMediaType(headers['content-type'])
  req.data.fileName = trimToNull(req.data.fileName) || fileNameFromHeaders(headers) || req.data.fileName

  const explicitMediaType = normalizeMediaType(req.data.mediaType)
  if (explicitMediaType) {
    req.data.mediaType = explicitMediaType
  } else if (headerMediaType && !isEnvelopeMediaType(headerMediaType)) {
    req.data.mediaType = headerMediaType
  }

  const contentLength = Number(headers['content-length'])
  if (!isEnvelopeMediaType(headerMediaType) && Number.isFinite(contentLength) && contentLength > 0) {
    req.data.fileSize = contentLength
  }

  const mediaType = normalizeMediaType(req.data.mediaType)
  if (mediaType && !ACCEPTED_ATTACHMENT_MEDIA_TYPES.has(mediaType)) {
    return req.reject(400, `Unsupported attachment media type: ${mediaType}.`, 'mediaType')
  }

  if (Number.isFinite(Number(req.data.fileSize)) && Number(req.data.fileSize) > MAX_ATTACHMENT_BYTES) {
    return req.reject(413, `Attachment size exceeds the ${Math.floor(MAX_ATTACHMENT_BYTES / (1024 * 1024))} MB limit.`, 'fileSize')
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

async function prepareDraftPatch (req, entities) {
  const bugID = bugIDFrom(req)
  if (!bugID) return

  const currentDraft = await cds.tx(req).run(SELECT.one.from(entities.Bugs.drafts).where({ ID: bugID }))
  if (!currentDraft) return

  const merged = { ...currentDraft, ...req.data }
  if (merged.applicationComponent_ID && merged.defectCategory_ID) {
    const componentCategory = await cds.tx(req).run(SELECT.one.from(entities.ComponentCategories).where({
      component_ID: merged.applicationComponent_ID,
      defectCategory_ID: merged.defectCategory_ID,
      active: true
    }))
    if (componentCategory) {
      req.data.componentCategory_ID = componentCategory.ID
    } else {
      req.data.componentCategory_ID = null
    }
  } else {
    req.data.componentCategory_ID = null
  }
}

async function handleDraftSave (req, entities, next) {
  await captureDraftSaveState(req, entities)
  const result = await next()
  await recordDraftBugSaveSideEffects(req, result, entities)
  await recordDraftAttachmentSaveSideEffects(req, result, entities)
  return result
}

async function captureDraftSaveState (req, entities) {
  const bugID = bugIDFrom(req)
  if (!bugID) return

  req._preSaveActiveBug = await readBug(req, entities, bugID)
  req._preSaveActiveAttachments = await cds.tx(req).run(
    SELECT.from(entities.Attachments)
      .columns('ID', 'bug_ID', 'fileName', 'mediaType', 'fileSize')
      .where({ bug_ID: bugID })
  )
}

async function recordDraftBugSaveSideEffects (req, data, entities) {
  const oldBug = req._preSaveActiveBug
  const bugID = data?.ID || bugIDFrom(req)
  if (!oldBug || !bugID) return

  const activeBug = await readBug(req, entities, bugID)
  if (!activeBug) return

  const changes = importantChanges(oldBug, activeBug)
  await recordBugChangeSideEffects(req, entities, changes, activeBug)
}
