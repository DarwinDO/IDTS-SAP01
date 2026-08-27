// Học nhanh (DonHV): ghi audit/history và notification side effect sau business change thành công; không dùng UI wording làm source of truth.
const cds = require('@sap/cds')

const { INSERT, SELECT } = cds.ql

const {
  ACTION,
  EVENT,
  HISTORY_FIELD_LABELS,
  PRIORITY_RANK,
  SEVERITY_RANK,
  STATUS
} = require('./constants')
const { readActiveIdentityAccessByUser } = require('../access/identity-readiness')

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

const { writeNotificationAndSchedule } = require('../email/worker')

async function recordCreateSideEffects (req, data, entities) {
  // after CREATE Bug gọi vào đây: tạo event “Create” và notification phù hợp sau khi Bug chính đã tồn tại.
  if (!data?.ID) return
  const bug = await readBug(req, entities, data.ID)
  const actor = await resolveRequestUser(req, entities)
  const actorID = actor?.ID || bug.reporter_ID || (await firstUserByRole(req, entities, 'TESTER'))?.ID

  const historyID = await writeHistoryEvent(req, entities, {
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

  await writeNotificationForStatus(req, entities, bug, bug.status_code, { historyID })
}

async function recordUpdateSideEffects (req, entities) {
  // after UPDATE dùng snapshot `_oldBug/_finalBug` do bug-write chuẩn bị để không query và đoán lại thay đổi.
  const changes = req._importantChanges || []
  await recordBugChangeSideEffects(req, entities, changes, req._finalBug)
}

async function recordBugChangeSideEffects (req, entities, changes, finalBug) {
  // Điều phối side effect cho một danh sách change: ghi HistoryEvent/Logs trước, rồi tạo notification nếu status cần báo.
  if (!changes.length || !finalBug?.ID) return
  const actor = await resolveRequestUser(req, entities)
  const actorID = actor?.ID || finalBug.reporter_ID || (await firstUserByRole(req, entities, 'PM'))?.ID
  const eventActionType = changes.some(change => change.fieldName === 'assignee')
    ? actionTypeForChange(changes.find(change => change.fieldName === 'assignee'))
    : actionTypeForChange(changes[0])

  const historyID = await writeHistoryEvent(req, entities, {
    bugID: finalBug.ID,
    actorID,
    actionType: eventActionType,
    changes,
    reason: trimToNull(changes.find(change => change.fieldName === 'rejectionReason')?.newValue)
  })

  const statusChange = changes.find(change => change.fieldName === 'status')
  const assigneeChange = changes.find(change => change.fieldName === 'assignee')
  const previousAssigneeUserID = assigneeChange?.oldValue
    ? await userIDForDeveloper(req, entities, assigneeChange.oldValue)
    : null
  const ownerChange = changes.find(change => change.fieldName === 'nextProcessorUser')
  if (statusChange || assigneeChange || ownerChange) {
    const lifecycleStatus = statusChange?.newValue ||
      (assigneeChange?.newValue ? STATUS.ASSIGNED :
        (assigneeChange ? STATUS.PENDING_ASSIGNMENT : finalBug.status_code))
    await writeNotificationForStatus(req, entities, finalBug, lifecycleStatus, {
      historyID,
      changes,
      previousAssigneeUserID
    })
  }
  await writeEscalationNotifications(req, entities, finalBug, changes, historyID)
}

async function writeEscalationNotifications (req, entities, bug, changes, historyID) {
  const escalations = [
    escalationForChange(changes, 'priority', PRIORITY_RANK, EVENT.PRIORITY_ESCALATED),
    escalationForChange(changes, 'severity', SEVERITY_RANK, EVENT.SEVERITY_ESCALATED)
  ].filter(Boolean)
  if (!escalations.length) return

  const assigneeUserID = await userIDForDeveloper(req, entities, bug.assignee_ID)
  const directRecipientIDs = [...new Set([assigneeUserID, bug.nextProcessorUser_ID].filter(Boolean))]
  const material = bug.priority_code === 'CRITICAL' || ['CRITICAL', 'BLOCKER'].includes(bug.severity_code)
  const pmRecipientIDs = material ? await activeAlignedPmIDs(req, entities) : []
  const recipientIDs = [...new Set([...directRecipientIDs, ...pmRecipientIDs])]
  const readiness = await readActiveIdentityAccessByUser(cds.tx(req), recipientIDs)

  for (const escalation of escalations) {
    for (const recipientID of recipientIDs) {
      if (!readiness.get(recipientID)?.ready) continue
      await writeNotificationAndSchedule(req, {
        bugID: bug.ID,
        recipientID,
        eventType: escalation.eventType,
        message: `${bug.bugNumber || 'Bug'} ${escalation.fieldName} increased.`,
        sourceKey: `STATUS:${historyID}:${recipientID}:${escalation.eventType}`,
        emailRequired: material
      })
    }
  }
}

function escalationForChange (changes, fieldName, ranks, eventType) {
  const change = changes.find(item => item.fieldName === fieldName)
  return change && ranks[change.newValue] > ranks[change.oldValue] ? { eventType, fieldName } : null
}

async function activeAlignedPmIDs (req, entities) {
  const tx = cds.tx(req)
  const pms = await tx.run(SELECT.from(entities.Users).columns('ID').where({ active: true, role_code: 'PM' }))
  const readiness = await readActiveIdentityAccessByUser(tx, pms.map(pm => pm.ID))
  return pms.map(pm => pm.ID).filter(id => readiness.get(id)?.ready)
}

async function recordCommentCreateSideEffects (req, data, entities) {
  // Sau khi comment persist, ghi event/comment notification với actor thật; lỗi trước INSERT không tạo audit giả.
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
  // Sau draft SAVE, so attachment metadata trước/sau để ghi add/remove event; binary S3 không được nhúng vào history.
  const bugID = data?.ID || bugIDFrom(req)
  if (!bugID) return

  const previousActiveAttachments = req._preSaveActiveAttachments || []
  const previousActiveIds = new Set(previousActiveAttachments.map(attachment => attachment.ID))
  const activeAttachments = await cds.tx(req).run(
    SELECT.from(entities['Bugs.attachments'])
      .columns('ID', 'up__ID', 'filename', 'mimeType', 'fileSize')
      .where({ up__ID: bugID })
  )

  const activeIds = new Set(activeAttachments.map(attachment => attachment.ID))
  const addedAttachments = activeAttachments.filter(attachment => !previousActiveIds.has(attachment.ID))
  const removedAttachments = previousActiveAttachments.filter(attachment => !activeIds.has(attachment.ID))
  if (!addedAttachments.length && !removedAttachments.length) return

  const actor = await resolveRequestUser(req, entities)
  const activeBug = await readBug(req, entities, bugID)
  const actorID = actor?.ID || activeBug?.reporter_ID || (await firstUserByRole(req, entities, 'TESTER'))?.ID
  if (!actorID) return

  const addedChanges = addedAttachments.map(attachment => ({
    fieldName: 'attachment',
    oldValue: null,
    newValue: attachment.ID,
    oldValueDisplay: null,
    newValueDisplay: trimToNull(attachment.filename) || attachment.ID
  }))
  const removedChanges = removedAttachments
    .map(attachment => buildAttachmentDeleteAuditEntry({
      attachmentID: attachment.ID,
      bugID,
      filename: attachment.filename,
      actorID
    })?.changes?.[0])
    .filter(Boolean)
  const changes = [...addedChanges, ...removedChanges]

  let summary
  if (addedChanges.length && removedChanges.length) {
    summary = `Updated attachments: added ${addedChanges.length}, removed ${removedChanges.length}.`
  } else if (removedChanges.length === 1) {
    summary = `Deleted attachment ${removedChanges[0].oldValueDisplay}.`
  } else if (removedChanges.length > 1) {
    summary = `Deleted ${removedChanges.length} attachments.`
  } else if (addedChanges.length === 1) {
    summary = `Added attachment ${addedChanges[0].newValueDisplay}.`
  } else {
    summary = `Added ${addedChanges.length} attachments.`
  }

  await writeHistoryEvent(req, entities, {
    bugID,
    actorID,
    actionType: ACTION.EDIT,
    summary,
    changes
  })
}

function buildAttachmentDeleteAuditEntry (snapshot) {
  const filename = trimToNull(snapshot?.filename)?.slice(0, 255) || snapshot?.attachmentID
  if (!snapshot?.attachmentID || !snapshot?.bugID || !snapshot?.actorID) return null

  return {
    bugID: snapshot.bugID,
    actorID: snapshot.actorID,
    actionType: ACTION.EDIT,
    summary: `Deleted attachment ${filename}.`,
    changes: [{
      fieldName: 'attachment',
      oldValue: snapshot.attachmentID,
      newValue: null,
      oldValueDisplay: filename,
      newValueDisplay: null
    }]
  }
}

function importantChanges (oldBug, finalBug) {
  // So các field nghiệp vụ được audit và trả danh sách old/new; field kỹ thuật ngoài allow-list bị bỏ qua có chủ ý.
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
  // Suy ra loại event từ field/status đổi để timeline dùng icon/label đúng thay vì mọi thứ đều là Edit.
  if (change.fieldName === 'status') return ACTION.STATUS_CHANGE
  if (change.fieldName === 'assignee') return change.oldValue ? ACTION.REASSIGN : ACTION.ASSIGN
  if (change.fieldName === 'rejectionReason') return ACTION.REJECT
  return ACTION.EDIT
}

async function writeHistoryEvent (req, entities, entry) {
  // Ghi HistoryEvent và các HistoryLogs trong transaction của request; đây là ranh giới persistence của audit.
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
  return eventID
}

async function enrichHistoryChanges (req, entities, changes) {
  // Bổ sung label và display value cho UUID/code trước khi lưu, giúp người đọc không phải giải mã raw ID.
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
  // Map tên field kỹ thuật sang nhãn nghiệp vụ; fallback giữ tên để field mới không biến mất khỏi audit.
  return HISTORY_FIELD_LABELS[fieldName] || fieldName
}

async function historyValueDisplay (req, entities, fieldName, value) {
  // Chọn helper lookup theo loại field (status, user, developer, catalog, component/category).
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
    case 'retestOwner':
      return displayUserName(req, entities, value)
    case 'nextProcessorRole':
      return displayProcessorRole(req, entities, value)
    default:
      return String(value)
  }
}

function buildHistorySummary (actionType, changes) {
  // Tạo câu summary ngắn theo action; full old/new vẫn được lưu trong HistoryLogs.
  const statusChange = findHistoryChange(changes, 'status')
  const assigneeChange = findHistoryChange(changes, 'assignee')

  switch (actionType) {
    case ACTION.CREATE:
      return `Created bug report.${statusChangeSuffix(statusChange)}`
    case ACTION.ASSIGN:
    case ACTION.ASSIGN_TO_DEVELOPER:
      return `${assigneeChange?.newValueDisplay ? `Assigned bug to ${assigneeChange.newValueDisplay}.` : 'Assigned bug to a developer.'}${statusChangeSuffix(statusChange)}`
    case ACTION.REASSIGN:
      if (statusChange?.newValue === STATUS.PENDING_ASSIGNMENT && !assigneeChange?.newValue) {
        return 'Moved bug to Pending Assignment.'
      }
      return `${assigneeChange?.newValueDisplay ? `Reassigned bug to ${assigneeChange.newValueDisplay}.` : 'Reassigned bug.'}${statusChangeSuffix(statusChange)}`
    case ACTION.REASSIGN_RETEST_OWNER:
      return 'Reassigned the Tester responsible for retest.'
    case ACTION.MOVE_TO_PENDING_ASSIGNMENT:
      return 'Moved bug to Pending Assignment.'
    case ACTION.MARK_IN_REVIEW:
      return 'Marked bug as In Review.'
    case ACTION.REQUEST_INFO:
    case ACTION.REQUEST_MORE_INFORMATION:
      return `Requested more information.${statusChangeSuffix(statusChange)}`
    case ACTION.RESUBMIT_TO_DEVELOPER:
      return 'Resubmitted bug to the assigned developer after additional information was provided.'
    case ACTION.REJECT:
    case ACTION.REJECT_BUG:
      return `Rejected bug for follow-up.${statusChangeSuffix(statusChange)}`
    case ACTION.START_PROGRESS:
      return 'Started progress on the bug.'
    case ACTION.RESOLVE:
    case ACTION.RESOLVE_BUG:
      return `Marked bug as resolved.${statusChangeSuffix(statusChange)}`
    case ACTION.RETEST:
      return `Moved bug to retest.${statusChangeSuffix(statusChange)}`
    case ACTION.SEND_TO_RETEST:
      return `Sent bug to retest.${statusChangeSuffix(statusChange)}`
    case ACTION.CLOSE:
    case ACTION.CLOSE_BUG:
      return `Closed bug.${statusChangeSuffix(statusChange)}`
    case ACTION.REOPEN:
    case ACTION.REOPEN_BUG:
      return `Reopened bug.${statusChangeSuffix(statusChange)}`
    case ACTION.STATUS_CHANGE:
      return statusActionSummary(statusChange)
    case ACTION.EDIT:
    default:
      return genericEditSummary(changes)
  }
}

function findHistoryChange (changes, fieldName) {
  // Tìm change theo field để các summary chuyên biệt lấy đúng old/new mà không phụ thuộc vị trí array.
  return changes.find(change => change.fieldName === fieldName)
}

function statusChangeSuffix (change) {
  // Dựng hậu tố status cũ → mới bằng display value, tránh lộ code kỹ thuật khi đã có label.
  if (!change || change.oldValueDisplay === change.newValueDisplay) return ''
  const fromPart = change.oldValueDisplay ? ` from ${change.oldValueDisplay}` : ''
  const toPart = change.newValueDisplay ? change.newValueDisplay : 'Unknown'
  return ` Status changed${fromPart} to ${toPart}.`
}

function statusActionSummary (statusChange) {
  // Chọn câu nghiệp vụ cho từng status đích; không đưa “next processor” kỹ thuật vào summary user-facing.
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
  // Fallback cho edit không thuộc action chuyên biệt: liệt kê field label quan trọng, giới hạn độ dài.
  const labels = [...new Set(changes.map(change => change.fieldLabel).filter(Boolean))]
  if (!labels.length) return 'Updated bug details.'
  if (labels.length === 1) return `Updated ${labels[0].toLowerCase()}.`
  if (labels.length <= 3) return `Updated ${labels.join(', ')}.`
  return `Updated ${labels.length} bug fields.`
}

async function writeNotificationForStatus (req, entities, bug, status, context = {}) {
  // Xác định recipient từ status/next owner rồi ghi notification + email outbox; không gửi provider trực tiếp ở đây.
  const notification = buildLifecycleNotification({ bug, status, ...context })
  if (!notification?.recipientID || !notification.eventType) return

  await writeNotificationAndSchedule(req, {
    bugID: bug.ID,
    recipientID: notification.recipientID,
    eventType: notification.eventType,
    message: notification.message,
    sourceKey: notification.sourceKey,
    emailRequired: notification.emailRequired
  })
}

function buildLifecycleNotification ({ bug, status, changes = [], historyID, previousAssigneeUserID } = {}) {
  // Mapping thuần từ status/Bug sang recipient và message intent; return null khi trạng thái không cần thông báo.
  if (!bug || !historyID) return null
  const assigneeChanged = changes.some(change => change.fieldName === 'assignee')
  const ownerChanged = changes.some(change => change.fieldName === 'nextProcessorUser')
  const recipientID = status === STATUS.CLOSED ? bug.reporter_ID : bug.nextProcessorUser_ID
  if (status === STATUS.PENDING_ASSIGNMENT && previousAssigneeUserID) {
    return notificationWithSource(bug, historyID, {
      recipientID: previousAssigneeUserID,
      eventType: EVENT.ASSIGNMENT_REMOVED,
      emailRequired: false,
      message: `${bug.bugNumber || 'Bug'} was moved to Pending Assignment.`
    })
  }
  if (status === STATUS.ASSIGNED && bug.nextProcessorUser_ID) {
    return notificationWithSource(bug, historyID, {
      recipientID: bug.nextProcessorUser_ID,
      eventType: assigneeChanged && changes.find(change => change.fieldName === 'assignee')?.oldValue ? EVENT.REASSIGNED : EVENT.ASSIGNED,
      emailRequired: true,
      message: `${bug.bugNumber || 'Bug'} has been ${assigneeChanged ? 'reassigned' : 'assigned'}.`
    })
  }

  if (status === STATUS.NEED_MORE_INFORMATION && bug.nextProcessorUser_ID) {
    return notificationWithSource(bug, historyID, {
      recipientID: bug.nextProcessorUser_ID,
      eventType: EVENT.NEED_MORE_INFORMATION,
      emailRequired: true,
      message: `${bug.bugNumber || 'Bug'} needs more information.`
    })
  }

  if (status === STATUS.REJECTED && bug.nextProcessorUser_ID) {
    return notificationWithSource(bug, historyID, {
      recipientID: bug.nextProcessorUser_ID,
      eventType: EVENT.REJECTED,
      emailRequired: true,
      message: `${bug.bugNumber || 'Bug'} was rejected and needs follow-up.`
    })
  }

  if (status === STATUS.RESOLVED && bug.nextProcessorUser_ID) {
    return notificationWithSource(bug, historyID, {
      recipientID: bug.nextProcessorUser_ID,
      eventType: EVENT.RESOLVED,
      emailRequired: true,
      message: `${bug.bugNumber || 'Bug'} is resolved and ready for verification.`
    })
  }

  if (status === STATUS.RETEST_REQUIRED && bug.nextProcessorUser_ID) {
    return notificationWithSource(bug, historyID, {
      recipientID: bug.nextProcessorUser_ID,
      eventType: EVENT.RETEST_REQUIRED,
      emailRequired: true,
      message: `${bug.bugNumber || 'Bug'} requires retest.`
    })
  }

  if (status === STATUS.REOPENED && bug.nextProcessorUser_ID) {
    return notificationWithSource(bug, historyID, {
      recipientID: bug.nextProcessorUser_ID,
      eventType: EVENT.REOPENED,
      emailRequired: true,
      message: `${bug.bugNumber || 'Bug'} was reopened and needs follow-up.`
    })
  }

  if (status === STATUS.CLOSED && bug.reporter_ID) {
    return notificationWithSource(bug, historyID, {
      recipientID: bug.reporter_ID,
      eventType: EVENT.CLOSED,
      emailRequired: true,
      message: `${bug.bugNumber || 'Bug'} has been closed.`
    })
  }

  if ([STATUS.IN_REVIEW, STATUS.IN_PROGRESS].includes(status) && ownerChanged && bug.nextProcessorUser_ID) {
    return notificationWithSource(bug, historyID, {
      recipientID: bug.nextProcessorUser_ID,
      eventType: EVENT.OWNER_CHANGED,
      emailRequired: true,
      message: `${bug.bugNumber || 'Bug'} is now assigned to you for the current workflow step.`
    })
  }

  return null
}

function notificationWithSource (bug, historyID, notification) {
  return {
    ...notification,
    message: notification.message || `${bug.bugNumber || 'Bug'} was updated.`,
    sourceKey: `STATUS:${historyID}:${notification.recipientID}`
  }
}

async function actorForAction (req, entities, bug, actionType) {
  // Resolve actor cho audit; với dữ liệu legacy có fallback an toàn, nhưng ưu tiên session user hiện tại.
  const actor = await resolveRequestUser(req, entities)
  if (actor) return actor.ID

  if ([
    ACTION.REQUEST_INFO,
    ACTION.REJECT,
    ACTION.RESOLVE,
    ACTION.STATUS_CHANGE,
    ACTION.MARK_IN_REVIEW,
    ACTION.REQUEST_MORE_INFORMATION,
    ACTION.REJECT_BUG,
    ACTION.START_PROGRESS,
    ACTION.RESOLVE_BUG
  ].includes(actionType)) {
    const assigneeUserID = await userIDForDeveloper(req, entities, bug.assignee_ID)
    if (assigneeUserID) return assigneeUserID
  }

  if ([
    ACTION.ASSIGN,
    ACTION.REASSIGN,
    ACTION.RETEST,
    ACTION.CLOSE,
    ACTION.REOPEN,
    ACTION.ASSIGN_TO_DEVELOPER,
    ACTION.MOVE_TO_PENDING_ASSIGNMENT,
    ACTION.RESUBMIT_TO_DEVELOPER,
    ACTION.SEND_TO_RETEST,
    ACTION.CLOSE_BUG,
    ACTION.REOPEN_BUG
  ].includes(actionType)) {
    if (bug.nextProcessorUser_ID) return bug.nextProcessorUser_ID
    if (bug.reporter_ID) return bug.reporter_ID
  }

  return bug.reporter_ID || (await firstUserByRole(req, entities, 'PM'))?.ID
}

module.exports = {
  recordCreateSideEffects,
  recordUpdateSideEffects,
  recordBugChangeSideEffects,
  writeEscalationNotifications,
  recordCommentCreateSideEffects,
  recordDraftAttachmentSaveSideEffects,
  buildAttachmentDeleteAuditEntry,
  importantChanges,
  writeHistoryEvent,
  writeNotificationForStatus,
  buildLifecycleNotification,
  actorForAction
}
