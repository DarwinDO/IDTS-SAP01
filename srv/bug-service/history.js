// Học nhanh (DonHV): ghi audit/history và notification side effect sau business change thành công; không dùng UI wording làm source of truth.
const cds = require('@sap/cds')

const { INSERT, SELECT } = cds.ql

const {
  ACTION,
  EVENT,
  HISTORY_FIELD_LABELS,
  STATUS
} = require('./constants')

const {
  bugIDFrom,
  displayCodeListName,
  displayComponentCategory,
  displayDeveloperName,
  displayEntityNameByID,
  displayProcessorRole,
  displayStatus,
  displayUserName,
  firstUserByRole,
  readBug,
  resolveRequestUser,
  toHistoryValue,
  trimToNull,
  userIDForDeveloper
} = require('./helpers')

const { writeNotificationRecord } = require('../email/outbox')
const { getEmailConfig } = require('../email/config')

async function recordCreateSideEffects (req, data, entities) {
  if (!data?.ID) return
  const bug = await readBug(req, entities, data.ID)
  const actor = await resolveRequestUser(req, entities)
  const actorID = actor?.ID || bug.reporter_ID || (await firstUserByRole(req, entities, 'TESTER'))?.ID

  await writeHistoryEvent(req, entities, {
    bugID: data.ID,
    actorID,
    actionType: ACTION.CREATE,
    reason: 'Bug report created.',
    summary: `Created bug report with initial status ${await displayStatus(req, entities, bug.status_code)}.`,
    changes: [
      {
        fieldName: 'status',
        oldValue: null,
        newValue: bug.status_code
      }
    ]
  })

  await writeNotificationForStatus(req, entities, bug, bug.status_code)
}

async function recordUpdateSideEffects (req, entities) {
  const changes = req._importantChanges || []
  await recordBugChangeSideEffects(req, entities, changes, req._finalBug)
}

async function recordBugChangeSideEffects (req, entities, changes, finalBug) {
  if (!changes.length || !finalBug?.ID) return
  const actor = await resolveRequestUser(req, entities)
  const actorID = actor?.ID || finalBug.reporter_ID || (await firstUserByRole(req, entities, 'PM'))?.ID
  const eventActionType = changes.some(change => change.fieldName === 'assignee')
    ? actionTypeForChange(changes.find(change => change.fieldName === 'assignee'))
    : actionTypeForChange(changes[0])

  await writeHistoryEvent(req, entities, {
    bugID: finalBug.ID,
    actorID,
    actionType: eventActionType,
    changes,
    reason: trimToNull(changes.find(change => change.fieldName === 'rejectionReason')?.newValue)
  })

  const statusChange = changes.find(change => change.fieldName === 'status')
  const assigneeChange = changes.find(change => change.fieldName === 'assignee')
  if (statusChange) {
    await writeNotificationForStatus(req, entities, finalBug, statusChange.newValue)
  } else if (assigneeChange?.newValue) {
    await writeNotificationForStatus(req, entities, finalBug, STATUS.ASSIGNED)
  }
}

async function recordCommentCreateSideEffects (req, data, entities) {
  if (!data?.bug_ID || !data?.author_ID) return

  await writeHistoryEvent(req, entities, {
    bugID: data.bug_ID,
    actorID: data.author_ID,
    actionType: ACTION.EDIT,
    reason: null,
    summary: 'Added a comment.',
    changes: [
      {
        fieldName: 'comment',
        oldValue: null,
        newValue: data.content
      }
    ]
  })
}

async function recordDraftAttachmentSaveSideEffects (req, data, entities) {
  const bugID = data?.ID || bugIDFrom(req)
  if (!bugID) return

  const previousActiveAttachments = req._preSaveActiveAttachments || []
  const previousActiveIds = new Set(previousActiveAttachments.map(attachment => attachment.ID))
  const activeAttachments = await cds.tx(req).run(
    SELECT.from(entities['Bugs.attachments'])
      .columns('ID', 'up__ID', 'filename', 'mimeType', 'fileSize')
      .where({ up__ID: bugID })
  )

  const addedAttachments = activeAttachments.filter(attachment => !previousActiveIds.has(attachment.ID))
  if (!addedAttachments.length) return

  const actor = await resolveRequestUser(req, entities)
  const activeBug = await readBug(req, entities, bugID)
  const actorID = actor?.ID || activeBug?.reporter_ID || (await firstUserByRole(req, entities, 'TESTER'))?.ID
  if (!actorID) return

  const changes = addedAttachments.map(attachment => ({
    fieldName: 'attachment',
    oldValue: null,
    newValue: attachment.ID,
    oldValueDisplay: null,
    newValueDisplay: trimToNull(attachment.filename) || attachment.ID
  }))

  const summary = addedAttachments.length === 1
    ? `Added attachment ${changes[0].newValueDisplay}.`
    : `Added ${addedAttachments.length} attachments.`

  await writeHistoryEvent(req, entities, {
    bugID,
    actorID,
    actionType: ACTION.EDIT,
    summary,
    changes
  })
}

function importantChanges (oldBug, finalBug) {
  const tracked = [
    ['title', 'title'],
    ['description', 'description'],
    ['status_code', 'status'],
    ['priority_code', 'priority'],
    ['severity_code', 'severity'],
    ['environment_code', 'environment'],
    ['environmentDetail', 'environmentDetail'],
    ['assignee_ID', 'assignee'],
    ['sapModule_ID', 'sapModule'],
    ['applicationComponent_ID', 'applicationComponent'],
    ['defectCategory_ID', 'defectCategory'],
    ['componentCategory_ID', 'componentCategory'],
    ['stepsToReproduce', 'stepsToReproduce'],
    ['actualResult', 'actualResult'],
    ['expectedResult', 'expectedResult'],
    ['testCaseRef', 'testCaseRef'],
    ['testRunRef', 'testRunRef'],
    ['plannedCompletionDate', 'plannedCompletionDate'],
    ['dueDate', 'dueDate'],
    ['estimatedEffortHours', 'estimatedEffortHours'],
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

async function writeHistoryEvent (req, entities, entry) {
  if (!entry.actorID) return
  const tx = cds.tx(req)
  const actor = await tx.run(SELECT.one.from(entities.Users).where({ ID: entry.actorID }))
  if (!actor) return

  const changes = await enrichHistoryChanges(req, entities, entry.changes || [])
  if (!changes.length) return

  const reason = trimToNull(entry.reason)
  const summary = trimToNull(entry.summary) || buildHistorySummary(entry.actionType, changes)
  const eventID = cds.utils.uuid()

  await tx.run(INSERT.into(entities.HistoryEvents).entries({
    ID: eventID,
    bug_ID: entry.bugID,
    actor_ID: entry.actorID,
    actorRole_code: actor.role_code,
    actionType_code: entry.actionType,
    summary,
    reason
  }))

  await tx.run(INSERT.into(entities.HistoryLogs).entries(
    changes.map(change => ({
      bug_ID: entry.bugID,
      event_ID: eventID,
      actor_ID: entry.actorID,
      actorRole_code: actor.role_code,
      actionType_code: entry.actionType,
      fieldName: change.fieldName,
      fieldLabel: change.fieldLabel,
      oldValue: toHistoryValue(change.oldValue),
      oldValueDisplay: toHistoryValue(change.oldValueDisplay),
      newValue: toHistoryValue(change.newValue),
      newValueDisplay: toHistoryValue(change.newValueDisplay),
      reason
    }))
  ))
}

async function enrichHistoryChanges (req, entities, changes) {
  const enriched = []

  for (const change of changes) {
    enriched.push({
      ...change,
      fieldLabel: change.fieldLabel || historyFieldLabel(change.fieldName),
      oldValueDisplay: change.oldValueDisplay ?? await historyValueDisplay(req, entities, change.fieldName, change.oldValue),
      newValueDisplay: change.newValueDisplay ?? await historyValueDisplay(req, entities, change.fieldName, change.newValue)
    })
  }

  return enriched
}

function historyFieldLabel (fieldName) {
  return HISTORY_FIELD_LABELS[fieldName] || fieldName
}

async function historyValueDisplay (req, entities, fieldName, value) {
  if (value === null || value === undefined || value === '') return null

  switch (fieldName) {
    case 'priority':
      return displayCodeListName(req, entities.PriorityValues, value)
    case 'severity':
      return displayCodeListName(req, entities.SeverityValues, value)
    case 'environment':
      return displayCodeListName(req, entities.EnvironmentValues, value)
    case 'status':
      return displayStatus(req, entities, value)
    case 'assignee':
      return displayDeveloperName(req, entities, value)
    case 'sapModule':
      return displayEntityNameByID(req, entities.SAPModules, value)
    case 'applicationComponent':
      return displayEntityNameByID(req, entities.ApplicationComponents, value)
    case 'defectCategory':
      return displayEntityNameByID(req, entities.DefectCategories, value)
    case 'componentCategory':
      return displayComponentCategory(req, entities, value)
    case 'nextProcessorUser':
      return displayUserName(req, entities, value)
    case 'nextProcessorRole':
      return displayProcessorRole(req, entities, value)
    default:
      return String(value)
  }
}

function buildHistorySummary (actionType, changes) {
  const statusChange = findHistoryChange(changes, 'status')
  const assigneeChange = findHistoryChange(changes, 'assignee')

  switch (actionType) {
    case ACTION.CREATE:
      return `Created bug report.${statusChangeSuffix(statusChange)}`
    case ACTION.ASSIGN:
      return `${assigneeChange?.newValueDisplay ? `Assigned bug to ${assigneeChange.newValueDisplay}.` : 'Assigned bug to a developer.'}${statusChangeSuffix(statusChange)}`
    case ACTION.REASSIGN:
      if (statusChange?.newValue === STATUS.PENDING_ASSIGNMENT && !assigneeChange?.newValue) {
        return 'Moved bug to Pending Assignment.'
      }
      return `${assigneeChange?.newValueDisplay ? `Reassigned bug to ${assigneeChange.newValueDisplay}.` : 'Reassigned bug.'}${statusChangeSuffix(statusChange)}`
    case ACTION.REQUEST_INFO:
      return `Requested more information.${statusChangeSuffix(statusChange)}`
    case ACTION.REJECT:
      return `Rejected bug for follow-up.${statusChangeSuffix(statusChange)}`
    case ACTION.RESOLVE:
      return `Marked bug as resolved.${statusChangeSuffix(statusChange)}`
    case ACTION.RETEST:
      return `Moved bug to retest.${statusChangeSuffix(statusChange)}`
    case ACTION.CLOSE:
      return `Closed bug.${statusChangeSuffix(statusChange)}`
    case ACTION.REOPEN:
      return `Reopened bug.${statusChangeSuffix(statusChange)}`
    case ACTION.STATUS_CHANGE:
      return statusActionSummary(statusChange)
    case ACTION.EDIT:
    default:
      return genericEditSummary(changes)
  }
}

function findHistoryChange (changes, fieldName) {
  return changes.find(change => change.fieldName === fieldName)
}

function statusChangeSuffix (change) {
  if (!change || change.oldValueDisplay === change.newValueDisplay) return ''
  const fromPart = change.oldValueDisplay ? ` from ${change.oldValueDisplay}` : ''
  const toPart = change.newValueDisplay ? change.newValueDisplay : 'Unknown'
  return ` Status changed${fromPart} to ${toPart}.`
}

function statusActionSummary (statusChange) {
  if (!statusChange?.newValueDisplay) return 'Updated workflow status.'

  switch (statusChange.newValueDisplay) {
    case 'In Review':
      return 'Moved bug to In Review.'
    case 'In Progress':
      return 'Started working on the bug.'
    default:
      return `Changed status to ${statusChange.newValueDisplay}.`
  }
}

function genericEditSummary (changes) {
  const labels = [...new Set(changes.map(change => change.fieldLabel).filter(Boolean))]
  if (!labels.length) return 'Updated bug details.'
  if (labels.length === 1) return `Updated ${labels[0].toLowerCase()}.`
  if (labels.length <= 3) return `Updated ${labels.join(', ')}.`
  return `Updated ${labels.length} bug fields.`
}

async function writeNotificationForStatus (req, entities, bug, status) {
  const notification = notificationTargetForStatus(bug, status)
  if (!notification?.recipientID || !notification.eventType) return

  await writeNotificationRecord(cds.tx(req), {
    bugID: bug.ID,
    recipientID: notification.recipientID,
    eventType: notification.eventType,
    message: notification.message
  }, getEmailConfig())
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

module.exports = {
  recordCreateSideEffects,
  recordUpdateSideEffects,
  recordBugChangeSideEffects,
  recordCommentCreateSideEffects,
  recordDraftAttachmentSaveSideEffects,
  importantChanges,
  writeHistoryEvent,
  writeNotificationForStatus,
  actorForAction
}
