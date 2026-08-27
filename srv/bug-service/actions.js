// Học nhanh (DonHV): implementation thật của assign/comment/lifecycle action. Breakpoint `transitionBug` để hiểu status, owner, history và notification đổi cùng nhau thế nào.
const cds = require('@sap/cds')

const { INSERT, SELECT, UPDATE } = cds.ql

const {
  ACTION,
  COMMENT_ROLES,
  COORDINATOR_ROLES,
  EVENT,
  STATUS
} = require('./constants')

const {
  bugIDFrom,
  readBug,
  reasonTarget,
  resolveRequestUser,
  trimToNull,
  userIDForDeveloper
} = require('./helpers')

const {
  actorForAction,
  writeHistoryEvent,
  writeNotificationForStatus
} = require('./history')

const { writeNotificationAndSchedule } = require('../email/worker')
const { readActiveIdentityAccessByUser } = require('../access/identity-readiness')

const { determineNextProcessor, validateAssignee, validateTransition } = require('./bug-write')
const { assertBugOpenForMutation, enforceActionPermission } = require('./permissions')

async function assignToDeveloper (req, entities) {
  // Action `assignToDeveloper` từ Object Page gọi vào đây. Hàm đọc Bug hiện tại, kiểm quyền điều phối,
  // kiểm Developer phù hợp rồi update assignee/status/next processor trong cùng transaction.
  const assigneeID = trimToNull(req.data.assigneeID)
  if (!assigneeID) {
    return req.reject(400, 'Assign Developer requires an assigneeID parameter.', 'assigneeID')
  }

  return transitionBug(req, entities, {
    status: STATUS.ASSIGNED,
    actionType: ACTION.ASSIGN_TO_DEVELOPER,
    reason: req.data.note,
    assigneeID,
    clearRejectionReason: true
  })
}

async function resubmitToDeveloper (req, entities) {
  // Tester gọi sau khi bổ sung thông tin. Hàm đưa Bug từ Need More Information trở lại Developer đã assign;
  // breakpoint ở đây để kiểm assignee cũ, actor hiện tại và status đích trước khi update.
  const bugID = bugIDFrom(req)
  const oldBug = await readBug(req, entities, bugID)
  if (!oldBug) return req.reject(404, 'Bug not found.')
  assertBugOpenForMutation(req, oldBug)

  const actor = await resolveRequestUser(req, entities)
  if (!actor || !COORDINATOR_ROLES.has(actor.role_code)) {
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

  const historyID = await writeHistoryEvent(req, entities, {
    bugID,
    actorID: actorUser?.ID || oldBug.reporter_ID,
    actionType: ACTION.RESUBMIT_TO_DEVELOPER,
    reason: note,
    summary: 'Resubmitted bug to the assigned developer after additional information was provided.',
    changes: historyChanges
  })

  if (updatedBug.nextProcessorUser_ID) {
    await writeNotificationAndSchedule(req, {
      bugID,
      recipientID: updatedBug.nextProcessorUser_ID,
      eventType: EVENT.RESUBMITTED,
      message: `${updatedBug.bugNumber || 'Bug'} was resubmitted with additional information.`,
      sourceKey: `STATUS:${historyID}:${updatedBug.nextProcessorUser_ID}`,
      emailRequired: true
    })
  }

  return updatedBug
}

async function addComment (req, entities, dependencies = {}) {
  // Bound action này tạo comment cho Bug đã active. Nội dung và actor được chuẩn hóa ở backend;
  // side effect history/notification chạy sau khi INSERT comment thành công.
  const bugID = bugIDFrom(req)
  const bug = await readBug(req, entities, bugID)
  if (!bug) return req.reject(404, 'Bug not found.')
  assertBugOpenForMutation(req, bug)

  const actor = await resolveRequestUser(req, entities)
  if (!actor || !COMMENT_ROLES.has(actor.role_code)) {
    return req.reject(403, 'Only Tester, Developer, or PM users can add comments.')
  }

  const content = trimToNull(req.data.content)
  if (!content) {
    return req.reject(400, 'Comment content is required.', 'content')
  }

  const tx = cds.tx(req)
  const recipients = await validateMentionRecipients({ tx, req, actor, mentionedUserIDs: req.data.mentionedUserIDs, entities })
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

  const historyID = await writeHistoryEvent(req, entities, {
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

  for (const recipient of recipients) {
    await writeNotificationAndSchedule(req, {
      bugID: bug.ID,
      recipientID: recipient.ID,
      eventType: EVENT.COMMENT_MENTIONED,
      message: `You were mentioned in a Bug comment: ${content.slice(0, 200)}`,
      sourceKey: `MENTION:${commentID}:${recipient.ID}`,
      emailRequired: true
    })
  }

  await dependencies.afterMentionWrites?.({ tx, commentID, historyID, recipients })

  return tx.run(SELECT.one.from(entities.Bugs).where({ ID: bug.ID }))
}

async function validateMentionRecipients ({ tx, req, actor, mentionedUserIDs, entities }) {
  // ID do UI chọn vẫn phải revalidate trước INSERT; text @name không có quyền tự tạo recipient.
  const ids = [...new Set((Array.isArray(mentionedUserIDs) ? mentionedUserIDs : []).map(id => typeof id === 'string' ? id.trim() : ''))]
  if (ids.some(id => !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))) {
    return req.reject(400, 'Mention recipients must be valid internal user IDs.', 'mentionedUserIDs')
  }
  if (ids.length > 20) return req.reject(400, 'At most 20 mention recipients can be selected.', 'mentionedUserIDs')
  const recipientIDs = ids.filter(id => id !== actor.ID)
  if (!recipientIDs.length) return []

  const users = await tx.run(SELECT.from(entities.Users).columns('ID', 'displayName', 'role_code', 'active').where({ ID: { in: recipientIDs } }))
  const recipients = recipientIDs.map(id => users.find(user => user.ID === id))
  const readiness = await readActiveIdentityAccessByUser(tx, recipientIDs)
  if (recipients.some(user => !user || user.active !== true || !COMMENT_ROLES.has(user.role_code) || !readiness.get(user.ID)?.ready)) {
    return req.reject(400, 'Mention recipients must be active, authorized internal users.', 'mentionedUserIDs')
  }
  return recipients
}

async function getMentionCandidates (req, entities) {
  // Chỉ trả DTO an toàn cho picker của Bug hiện tại; không lộ email, identity hash hoặc provider data.
  const bug = await readBug(req, entities, bugIDFrom(req))
  if (!bug) return req.reject(404, 'Bug not found.')
  assertBugOpenForMutation(req, bug)
  const actor = await resolveRequestUser(req, entities)
  if (!actor || !COMMENT_ROLES.has(actor.role_code)) {
    return req.reject(403, 'Only Tester, Developer, or PM users can add comments.')
  }

  const tx = cds.tx(req)
  // Không phân trang picker: trả trọn tập eligible để UI không âm thầm bỏ selection ở page sau.
  const users = await tx.run(SELECT.from(entities.Users)
    .columns('ID', 'displayName', 'role_code', 'active')
    .where({ active: true, role_code: { in: [...COMMENT_ROLES] } })
    .orderBy('displayName', 'ID'))
  const readiness = await readActiveIdentityAccessByUser(tx, users.map(user => user.ID))
  return users
    .filter(user => user.ID !== actor.ID && readiness.get(user.ID)?.ready)
    .map(user => ({ ID: user.ID, displayName: user.displayName, roleCode: user.role_code }))
}

// Một transition hợp lệ phải kiểm tra actor + trạng thái nguồn/đích + reason trước khi ghi audit/notification.
async function transitionBug (req, entities, options) {
  // Tất cả action đổi trạng thái dùng chung pipeline này: đọc Bug → kiểm quyền → kiểm điều kiện option
  // → tính next processor → update DB → ghi history/notification. `options` đến từ mapping trong service.js.
  const bugID = bugIDFrom(req)
  const oldBug = await readBug(req, entities, bugID)
  if (!oldBug) return req.reject(404, 'Bug not found.')

  if (options.actionType !== ACTION.REOPEN_BUG) assertBugOpenForMutation(req, oldBug)

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
    await validateAssignee(req, entities, nextState, {
      enforceCapacity: !!options.assigneeID && options.assigneeID !== oldBug.assignee_ID,
      enforceIdentityAccess: !!options.assigneeID && options.assigneeID !== oldBug.assignee_ID
    })
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

  const historyID = await writeHistoryEvent(req, entities, {
    bugID,
    actorID,
    actionType: options.actionType,
    reason: trimToNull(options.reason),
    changes: historyChanges
  })

  const assigneeChange = historyChanges.find(change => change.fieldName === 'assignee')
  await writeNotificationForStatus(req, entities, updatedBug, options.status, {
    historyID,
    changes: historyChanges,
    previousAssigneeUserID: assigneeChange?.oldValue
      ? await userIDForDeveloper(req, entities, assigneeChange.oldValue)
      : null
  })
  return updatedBug
}

async function reassignRetestOwner (req, entities) {
  const bugID = bugIDFrom(req)
  const oldBug = await readBug(req, entities, bugID)
  if (!oldBug) return req.reject(404, 'Bug not found.')

  const actor = await resolveRequestUser(req, entities)
  if (!actor || actor.role_code !== 'PM') {
    return req.reject(403, 'Only PM users can reassign the retest owner.')
  }

  const retestOwnerID = trimToNull(req.data.retestOwnerID)
  const reason = trimToNull(req.data.reason)
  if (!retestOwnerID) return req.reject(400, 'Retest owner is required.', 'retestOwnerID')
  if (!reason) return req.reject(400, 'Retest owner reassignment requires a reason.', 'reason')

  const target = await cds.tx(req).run(
    SELECT.one.from(entities.Users).columns('ID').where({
      ID: retestOwnerID,
      role_code: 'TESTER',
      active: true
    })
  )
  if (!target) return req.reject(400, 'Retest owner must be an active Tester.', 'retestOwnerID')
  if (oldBug.retestOwner_ID === target.ID) {
    return req.reject(409, 'Selected Tester is already responsible for retest.', 'retestOwnerID')
  }

  const patch = { retestOwner_ID: target.ID }
  if (oldBug.status_code === STATUS.CLOSED) {
    patch.nextProcessorUser_ID = null
    patch.nextProcessorRole_code = 'NONE'
  } else if (new Set([
    STATUS.NEED_MORE_INFORMATION,
    STATUS.REJECTED,
    STATUS.RESOLVED,
    STATUS.RETEST_REQUIRED
  ]).has(oldBug.status_code)) {
    patch.nextProcessorUser_ID = target.ID
    patch.nextProcessorRole_code = 'TESTER'
  }

  const tx = cds.tx(req)
  await tx.run(UPDATE(entities.Bugs).set(patch).where({ ID: bugID }))
  const updatedBug = await tx.run(SELECT.one.from(entities.Bugs).where({ ID: bugID }))
  const historyID = await writeHistoryEvent(req, entities, {
    bugID,
    actorID: actor.ID,
    actionType: ACTION.REASSIGN_RETEST_OWNER,
    reason,
    summary: 'Reassigned the Tester responsible for retest.',
    changes: [{
      fieldName: 'retestOwner',
      oldValue: oldBug.retestOwner_ID,
      newValue: target.ID
    }]
  })
  await writeNotificationAndSchedule(req, {
    bugID,
    recipientID: target.ID,
    eventType: EVENT.RETEST_OWNER_CHANGED,
    message: `${updatedBug.bugNumber || 'Bug'} was assigned to you for retest continuity.`,
    sourceKey: `STATUS:${historyID}:${target.ID}`,
    emailRequired: true
  })
  return updatedBug
}

module.exports = {
  assignToDeveloper,
  reassignRetestOwner,
  resubmitToDeveloper,
  addComment,
  getMentionCandidates,
  validateMentionRecipients,
  transitionBug
}
