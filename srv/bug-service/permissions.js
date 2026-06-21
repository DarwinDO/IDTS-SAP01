const {
  COORDINATOR_ROLES,
  DEVELOPER_ACTIONS,
  DEVELOPER_DIRECT_STATUSES,
  USER_ROLE
} = require('./constants')

const {
  resolveRequestUser,
  userIDForDeveloper
} = require('./helpers')

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

module.exports = {
  enforceBugWritePermission,
  enforceActionPermission,
  isAssignedDeveloper
}
