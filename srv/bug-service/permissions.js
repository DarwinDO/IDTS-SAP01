// Đây là lớp bảo vệ quyền ở backend. UI chỉ giúp ẩn/hiện nút cho dễ dùng;
// các hàm trong file này mới là nơi chặn request OData trực tiếp bằng role và ownership thật.
const {
  COORDINATOR_ROLES,
  DEVELOPER_ACTIONS,
  DEVELOPER_DIRECT_STATUSES,
  STATUS,
  USER_ROLE
} = require('./constants')

const {
  resolveRequestUser,
  userIDForDeveloper
} = require('./helpers')

// Chỉ các field nghiệp vụ này được coi là sửa Bug. Field kỹ thuật/draft và
// composition attachment không được đưa vào đây, nhờ vậy assignee có thể mở
// edit shell để upload file mà không có quyền sửa nội dung Bug.
const BUG_BUSINESS_FIELDS = [
  'title', 'description', 'stepsToReproduce', 'actualResult', 'expectedResult',
  'priority_code', 'severity_code', 'environment_code', 'environmentDetail',
  'sapModule_ID', 'applicationComponent_ID', 'defectCategory_ID',
  'componentCategory_ID', 'assignee_ID', 'status_code', 'rejectionReason',
  'testCaseRef', 'testRunRef', 'plannedCompletionDate', 'dueDate',
  'estimatedEffortHours', 'nextProcessorUser_ID', 'nextProcessorRole_code'
]

function assertActiveActor (req, actor) {
  if (!actor) {
    return req.reject(403, 'An active IDTS user is required for this operation.')
  }
  return actor
}

async function enforceBugWritePermission (req, entities, oldBug, nextBug, { isCreate }) {
  // `prepareBugWrite` gọi hàm này trước CREATE/UPDATE Bug active.
  // Với create, dùng rule riêng vì chưa có Bug cũ hay assignee để so sánh.
  if (isCreate) {
    return enforceBugCreatePermission(req, entities)
  }

  assertBugOpenForMutation(req, oldBug)

  // `actor` là Users row được map từ token/session, không phải role do browser tự gửi.
  // Breakpoint tại đây để kiểm tra ID, role_code và active khi request bị từ chối sai.
  const actor = assertActiveActor(req, await resolveRequestUser(req, entities))

  if (actor.role_code === USER_ROLE.DEVELOPER && hasBugBusinessChanges(oldBug, nextBug)) {
    return req.reject(
      403,
      'Developers cannot edit Bug fields. Use the permitted lifecycle actions, comments, or attachments.',
      firstChangedBugField(oldBug, nextBug)
    )
  }

  // So sánh ảnh chụp trước/sau để tách quyền đổi assignee khỏi quyền đổi status.
  const statusChanged = oldBug.status_code !== nextBug.status_code
  const assigneeChanged = oldBug.assignee_ID !== nextBug.assignee_ID

  if (assigneeChanged && !COORDINATOR_ROLES.has(actor.role_code)) {
    return req.reject(403, 'Only Tester or PM users can assign or reassign bugs.', 'assignee')
  }

  if (!statusChanged) return

  if (COORDINATOR_ROLES.has(actor.role_code)) return

  // Developer chỉ được đổi sang status nằm trong allow-list và chỉ trên Bug assign cho chính họ.
  // Cả ba điều kiện phải đúng; thiếu một điều kiện thì request bị 403 bên dưới.
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

async function enforceBugEditPermission (req, entities, bug) {
  assertBugOpenForMutation(req, bug)
  const actor = assertActiveActor(req, await resolveRequestUser(req, entities))
  if (COORDINATOR_ROLES.has(actor.role_code)) return
  if (actor.role_code === USER_ROLE.DEVELOPER && await isAssignedDeveloper(req, entities, actor.ID, bug)) return
  return req.reject(403, 'Only Tester, PM, or the assigned developer can open this Bug for editing.')
}

async function enforceDeveloperDraftFieldsUnchanged (req, entities, activeBug, draftOrPatch) {
  const actor = assertActiveActor(req, await resolveRequestUser(req, entities))
  if (actor.role_code !== USER_ROLE.DEVELOPER) return
  const nextBug = { ...activeBug, ...draftOrPatch }
  if (!hasBugBusinessChanges(activeBug, nextBug)) return
  return req.reject(
    403,
    'Developers cannot edit Bug fields. Use the permitted lifecycle actions, comments, or attachments.',
    firstChangedBugField(activeBug, nextBug)
  )
}

function firstChangedBugField (oldBug = {}, nextBug = {}) {
  return BUG_BUSINESS_FIELDS.find(field => normalizeComparable(oldBug[field]) !== normalizeComparable(nextBug[field]))
}

function hasBugBusinessChanges (oldBug, nextBug) {
  return !!firstChangedBugField(oldBug, nextBug)
}

function normalizeComparable (value) {
  if (value === undefined || value === '') return null
  return value instanceof Date ? value.toISOString() : String(value)
}

function assertBugOpenForMutation (req, bug) {
  if (bug?.status_code === STATUS.CLOSED) {
    return req.reject(409, 'Closed bugs are read-only. Reopen the bug before making changes.')
  }
}

async function enforceBugCreatePermission (req, entities) {
  // Handler `NEW Bugs.drafts` và create active gọi hàm này để resolve user một lần,
  // sau đó trả actor cho `prepareDraftNew` gắn reporter hệ thống.
  const actor = await resolveRequestUser(req, entities)
  return assertBugCreatePermission(req, actor)
}

function assertBugCreatePermission (req, actor) {
  // Chỉ Tester/PM (COORDINATOR_ROLES) được tạo Bug. Return actor khi hợp lệ
  // để caller tiếp tục dùng đúng Users.ID; `req.reject` dừng request khi không hợp lệ.
  if (!actor) {
    return req.reject(
      403,
      'An active IDTS user is required to create a bug report.',
      'reporter_ID'
    )
  }
  if (actor.role_code === USER_ROLE.TESTER) return actor
  return req.reject(403, 'Only Tester users can create bug reports.')
}

async function enforceActionPermission (req, entities, bug, actionType) {
  // `transitionBug`, assign và các action lifecycle gọi hàm này trước khi update database.
  // PM/Tester được điều phối; Developer cần action nằm trong allow-list và là assignee hiện tại.
  const actor = assertActiveActor(req, await resolveRequestUser(req, entities))

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
  // Bug giữ `assignee_ID` của Developers, còn session giữ `Users.ID`.
  // `userIDForDeveloper` nối hai mô hình này; so sánh trực tiếp hai loại ID sẽ sai.
  // Breakpoint tại return để xem mapping Developer → User khi Developer bị chặn nhầm.
  if (!userID || !bug?.assignee_ID) return false
  const assigneeUserID = await userIDForDeveloper(req, entities, bug.assignee_ID)
  return assigneeUserID === userID
}

module.exports = {
  BUG_BUSINESS_FIELDS,
  assertActiveActor,
  assertBugOpenForMutation,
  assertBugCreatePermission,
  enforceBugCreatePermission,
  enforceBugWritePermission,
  enforceBugEditPermission,
  enforceDeveloperDraftFieldsUnchanged,
  enforceActionPermission,
  hasBugBusinessChanges,
  isAssignedDeveloper
}
