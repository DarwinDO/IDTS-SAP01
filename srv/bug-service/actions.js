// Học nhanh (DonHV): implementation thật của assign/comment/lifecycle action. Breakpoint `transitionBug` để hiểu status, owner, history và notification đổi cùng nhau thế nào.
const cds = require('@sap/cds')

const { INSERT, SELECT, UPDATE } = cds.ql

const {
  ACTION,
  COORDINATOR_ROLES,
  STATUS
} = require('./constants')

const {
  bugIDFrom,
  readBug,
  reasonTarget,
  resolveRequestUser,
  trimToNull
} = require('./helpers')

const {
  actorForAction,
  writeHistoryEvent,
  writeNotificationForStatus
} = require('./history')

const { getEmailConfig } = require('../email/config')
const { writeNotificationRecord } = require('../email/outbox')

const { determineNextProcessor, validateAssignee, validateTransition } = require('./bug-write')
const { enforceActionPermission } = require('./permissions')

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
    await writeNotificationRecord(cds.tx(req), {
      bugID,
      recipientID: updatedBug.nextProcessorUser_ID,
      eventType: 'UPDATED',
      message: `${updatedBug.bugNumber || 'Bug'} was resubmitted with additional information.`
    }, getEmailConfig())
  }

  return updatedBug
}

async function addComment (req, entities) {
  const bugID = bugIDFrom(req)
  const bug = await readBug(req, entities, bugID)
  if (!bug) return req.reject(404, 'Bug not found.')

  const actor = await resolveRequestUser(req, entities)
  if (!actor || !new Set(['TESTER', 'DEVELOPER', 'PM']).has(actor.role_code)) {
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

// Một transition hợp lệ phải kiểm tra actor + trạng thái nguồn/đích + reason trước khi ghi audit/notification.
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

module.exports = {
  assignToDeveloper,
  resubmitToDeveloper,
  addComment,
  transitionBug
}
