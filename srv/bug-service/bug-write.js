// Pipeline chuẩn hóa và kiểm tra Bug trước khi CAP ghi CREATE/UPDATE vào database.
// Breakpoint đầu tiên ở `prepareBugWrite`; từ đó đi xuống validator tương ứng với field/status đang sai.
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

async function prepareBugWrite (req, entities, { isCreate }) {
  // `service.js` trigger hàm này trước CREATE/UPDATE active Bug. Input thật nằm trong `req.data`;
  // khi update phải đọc `oldBug` để ghép field cũ với payload PATCH/UPDATE chỉ chứa phần thay đổi.
  const bugID = req.params?.[0]?.ID || req.data?.ID
  const oldBug = isCreate ? {} : await readBug(req, entities, bugID)

  if (!isCreate && !oldBug) {
    return req.reject(404, 'Bug not found.')
  }

  if (isCreate) {
    // Bug number và reporter là field do server quản lý. Không nhận hai giá trị này từ browser,
    // nếu không client có thể giả người báo hoặc tự chọn số Bug trùng.
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

  // Ba bước dưới kiểm từ chung đến riêng: field bắt buộc → catalog active → cặp component/category.
  // Mỗi validator gắn `target` vào lỗi để Fiori đặt message dưới đúng field.
  const merged = { ...oldBug, ...req.data }
  validateRequiredBugFields(req, merged)
  await validateActiveCodeLists(req, entities, merged)
  await deriveOrValidateComponentCategory(req, entities, merged)

  // Assignee quyết định trạng thái khởi đầu: có assignee thì Assigned, chưa có thì Pending Assignment.
  // Cùng rule áp dụng khi coordinator thay đổi assignee trên Bug hiện có.
  const finalData = { ...oldBug, ...req.data }
  if (isCreate) {
    req.data.status_code = finalData.assignee_ID ? STATUS.ASSIGNED : STATUS.PENDING_ASSIGNMENT
  } else if (oldBug.assignee_ID !== finalData.assignee_ID) {
    req.data.status_code = finalData.assignee_ID ? STATUS.ASSIGNED : STATUS.PENDING_ASSIGNMENT
  }

  // Quyền được kiểm sau khi backend đã suy ra status cuối, để không kiểm nhầm payload chưa hoàn chỉnh.
  // Sau đó mới kiểm transition, lý do reject và tính hợp lệ của assignee.
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

  // `nextProcessor` là người/role cần xử lý bước kế tiếp, khác với assignee kỹ thuật.
  // Kết quả được ghi vào payload để persist cùng Bug trong một transaction.
  const nextProcessor = await determineNextProcessor(req, entities, { ...finalData, ...req.data })
  req.data.nextProcessorUser_ID = nextProcessor.userID
  req.data.nextProcessorRole_code = nextProcessor.roleCode

  // Ba field bắt đầu bằng `_` chỉ sống trong request. After-handler trong `history.js` dùng chúng
  // để ghi audit/notification mà không query và tính diff lại.
  req._oldBug = oldBug
  req._finalBug = { ...finalData, ...req.data }
  req._importantChanges = isCreate ? [] : importantChanges(oldBug, req._finalBug)
}

async function validateActiveCodeLists (req, entities, bug) {
  // Chạy cho Priority, Severity và Environment. Giá trị phải là chuỗi đã trim và phải trỏ tới
  // catalog row đang active; UI value help không thay thế được kiểm tra này vì API có thể bị gọi trực tiếp.
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

    // `definition.entity` nối tên field với projection catalog tương ứng trong `service.cds`.
    // Breakpoint tại query để xem rawValue và target khi một code nhìn đúng trên UI nhưng bị 400.
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
  // Draft SAVE dùng `rejectFirst=true` để dừng ở lỗi đầu tiên; active write có thể gom nhiều
  // `req.error` để Fiori hiển thị cùng lúc các field còn thiếu.
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
  // Application Component và Defect Category người dùng chọn phải tồn tại thành một cặp active.
  // Backend tra cặp đó rồi tự gắn `componentCategory_ID`, không yêu cầu UI tự biết ID trung gian.
  if (!bug.applicationComponent_ID || !bug.defectCategory_ID) return

  const componentCategory = await resolveComponentCategory(req, entities, bug)

  if (bug.componentCategory_ID && bug.componentCategory_ID !== componentCategory.ID) {
    return req.reject(
      400,
      'Component Category does not match the selected Application Component and Defect Category.',
      'componentCategory'
    )
  }

  // Ghi vào cả payload (`req.data`) lẫn bản merged (`bug`) để validator chạy sau nhìn cùng kết quả.
  req.data.componentCategory_ID = componentCategory.ID
  bug.componentCategory_ID = componentCategory.ID
}

async function resolveComponentCategory (req, entities, bug) {
  // Helper dùng chung trả về cặp component/category active; caller quyết định cách ghi ID đã derive.
  if (!bug.applicationComponent_ID || !bug.defectCategory_ID) return null

  const componentCategory = await cds.tx(req).run(
    SELECT.one.from(entities.ComponentCategories).where({
      component_ID: bug.applicationComponent_ID,
      defectCategory_ID: bug.defectCategory_ID,
      active: true
    })
  )
  if (!componentCategory) {
    return req.reject(
      400,
      'The selected Application Component and Defect Category are not a valid Component Category.',
      'defectCategory'
    )
  }
  return componentCategory
}

async function validateAssignee (req, entities, bug) {
  // Assignee phải là DeveloperProfile active, đang nhận việc và có responsibility phù hợp
  // với component/category (và module nếu responsibility giới hạn module).
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

  // Query có thể trả nhiều responsibility; `.some` bên dưới chỉ cần một record phù hợp là đủ.
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
  // `ALLOWED_TRANSITIONS` trong constants.js là state machine duy nhất của lifecycle.
  // Breakpoint tại `allowed` để phân biệt lỗi mapping action với rule transition thật.
  if (!fromStatus || fromStatus === toStatus) return
  const allowed = ALLOWED_TRANSITIONS[fromStatus] || []
  if (!allowed.includes(toStatus)) {
    return req.reject(400, `Status transition from ${fromStatus} to ${toStatus} is not allowed.`, 'status')
  }
}

async function determineNextProcessor (req, entities, bug) {
  // Hàm này không update DB trực tiếp; nó chỉ trả `{ userID, roleCode }` cho caller persist.
  // Thứ tự nhánh đi từ trạng thái kết thúc, hàng đợi PM, trạng thái Developer, rồi trạng thái Tester.
  if (bug.status_code === STATUS.CLOSED) {
    return { userID: null, roleCode: PROCESSOR_ROLE.NONE }
  }

  if (bug.status_code === STATUS.PENDING_ASSIGNMENT) {
    const pm = await firstUserByRole(req, entities, 'PM')
    return { userID: pm?.ID || null, roleCode: PROCESSOR_ROLE.PM }
  }

  if (DEVELOPER_STATUSES.has(bug.status_code)) {
    // Assignee là DeveloperProfile nên phải map sang Users.ID để notification/action-owner dùng được.
    // Nếu mapping mất, fallback PM để Bug không rơi vào hàng đợi không người xử lý.
    const assigneeUserID = await userIDForDeveloper(req, entities, bug.assignee_ID)
    if (assigneeUserID) return { userID: assigneeUserID, roleCode: PROCESSOR_ROLE.DEVELOPER }
    const pm = await firstUserByRole(req, entities, 'PM')
    return { userID: pm?.ID || null, roleCode: PROCESSOR_ROLE.PM }
  }

  if (TESTER_STATUSES.has(bug.status_code)) {
    // Các bước cần Tester ưu tiên reporter ban đầu; chỉ fallback Tester đầu tiên khi dữ liệu cũ thiếu reporter.
    const testerID = bug.reporter_ID || (await firstUserByRole(req, entities, 'TESTER'))?.ID
    return { userID: testerID || null, roleCode: PROCESSOR_ROLE.TESTER }
  }

  const tester = await firstUserByRole(req, entities, 'TESTER')
  return { userID: bug.reporter_ID || tester?.ID || null, roleCode: PROCESSOR_ROLE.UNASSIGNED_QUEUE }
}

module.exports = {
  prepareBugWrite,
  determineNextProcessor,
  resolveComponentCategory,
  validateActiveCodeLists,
  validateRequiredBugFields,
  validateAssignee,
  validateTransition
}
