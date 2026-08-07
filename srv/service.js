// File này là “bảng điều phối” của BugService: CAP nhận request OData tại đây,
// rồi chuyển request sang module nghiệp vụ phù hợp trong `srv/bug-service/`, `srv/email/` hoặc `srv/ai/`.
// Khi chưa biết request đi đâu, đặt breakpoint đầu tiên trong `init()` và breakpoint thứ hai tại handler được đăng ký bên dưới.
const cds = require('@sap/cds')

const {
  ACTION,
  STATUS
} = require('./bug-service/constants')

const {
  recordCommentCreateSideEffects,
  recordCreateSideEffects,
  recordUpdateSideEffects
} = require('./bug-service/history')

const {
  enrichBugCapabilities,
  enrichBugDisplayFields,
  ensureCapabilitySelectDependencies,
  readAssignableDevelopers
} = require('./bug-service/read-models')
const {
  ensureHistoryEventSelectDependencies,
  enrichHistoryEventPayload
} = require('./bug-service/history-read-models')

const { readDeveloperWorkloads } = require('./bug-service/monitoring')
const { readBugStatusMetrics } = require('./bug-service/status-metrics')
const { registerReadOnlyEntityGuards } = require('./bug-service/guards')
const { prepareBugWrite } = require('./bug-service/bug-write')
const { bugIDFrom, readBug } = require('./bug-service/helpers')
const { assertBugOpenForMutation, enforceBugCreatePermission, enforceBugEditPermission } = require('./bug-service/permissions')
const {
  assignToDeveloper,
  reassignRetestOwner,
  resubmitToDeveloper,
  addComment,
  transitionBug
} = require('./bug-service/actions')
const {
  prepareCommentCreate,
  prepareCommentMutation,
  prepareAttachmentWrite
} = require('./bug-service/content')
const {
  prepareDraftNew,
  prepareDraftPatch,
  handleDraftSave
} = require('./bug-service/drafts')
const {
  processEmailOutboxBatch,
  shouldStartEmailWorker,
  startEmailWorker
} = require('./email/worker')
const {
  suggestSimilarBugs,
  suggestClassification,
  summarizeBugHandoff,
  explainSmartAssignment,
  acceptAiSuggestion,
  rejectAiSuggestion,
  ignoreAiSuggestion,
  applyClassificationSuggestion,
  confirmDuplicateSuggestion,
  readAiOperationalMetrics
} = require('./ai')

module.exports = class BugService extends cds.ApplicationService {
  async init () {
    // CAP gọi `init()` đúng một lần khi khởi động service. `this.entities` là các entity đã được expose
    // bởi `srv/service.cds`; các module con nhận cùng object này để query đúng projection/entity runtime.
    const entities = this.entities
    const { Bugs, Comments, HistoryEvents } = entities
    const Attachments = entities['Bugs.attachments']

    const commentTargets = [Comments, Comments?.drafts].filter(Boolean)
    const attachmentTargets = [Attachments, Attachments?.drafts].filter(Boolean)
    const historyEventTargets = [HistoryEvents, HistoryEvents?.drafts].filter(Boolean)

    // Nhóm READ: guard chặn client ghi vào read model; before-handler bổ sung cột phụ thuộc
    // trước khi CAP chạy SELECT, còn after-handler làm giàu kết quả trước khi trả JSON cho UI.
    registerReadOnlyEntityGuards(this, entities)
    this.before('READ', Bugs, req => ensureCapabilitySelectDependencies(req))
    this.before('READ', Bugs.drafts, req => ensureCapabilitySelectDependencies(req))
    for (const target of historyEventTargets) {
      this.before('READ', target, req => ensureHistoryEventSelectDependencies(req))
    }
    // Nhóm ghi Bug active và draft: mọi đường tạo/sửa đều đi qua validation backend.
    // Vì vậy người gọi OData trực tiếp cũng không thể bỏ qua role, code-list hoặc ownership chỉ bằng cách né UI.
    this.before('CREATE', Bugs, req => prepareBugWrite(req, entities, { isCreate: true }))
    this.before('NEW', Bugs.drafts, async req => {
      // `NEW` là lúc Fiori tạo bản nháp rỗng. Kiểm quyền ngay tại đây để Developer không thể mở flow Create,
      // sau đó `prepareDraftNew` ép reporter theo user đang đăng nhập thay vì tin reporter do client gửi.
      const actor = await enforceBugCreatePermission(req, entities)
      await prepareDraftNew(req, actor)
    })
    this.before('EDIT', Bugs, async req => {
      const bug = await readBug(req, entities, bugIDFrom(req))
      if (!bug) return req.reject(404, 'Bug not found.')
      await enforceBugEditPermission(req, entities, bug)
    })
    this.before('UPDATE', Bugs, req => prepareBugWrite(req, entities, { isCreate: false }))
    this.before('PATCH', Bugs.drafts, req => prepareDraftPatch(req, entities))
    this.before('DELETE', Bugs, async req => {
      const bug = await readBug(req, entities, bugIDFrom(req))
      if (!bug) return req.reject(404, 'Bug not found.')
      assertBugOpenForMutation(req, bug)
      return req.reject(405, 'Bug deletion is not supported. Use the lifecycle actions instead.')
    })

    // Comment và attachment có cả entity active lẫn draft. Cùng một validator được gắn vào hai target
    // để rule không thay đổi theo việc người dùng đang sửa draft hay Bug đã lưu.
    for (const target of commentTargets) {
      this.before('CREATE', target, req => prepareCommentCreate(req, entities))
      this.before(['PUT', 'UPDATE', 'PATCH', 'DELETE'], target, req => prepareCommentMutation(req, entities))
    }

    for (const target of attachmentTargets) {
      this.before(['CREATE', 'PUT', 'UPDATE', 'PATCH', 'DELETE'], target, req => prepareAttachmentWrite(req, entities))
    }

    // Các after-handler chạy sau khi thay đổi chính đã thành công. Chúng tạo history/notification;
    // nếu debug thấy Bug đã lưu nhưng thiếu audit, bắt đầu ở các hàm `record*SideEffects` này.
    this.after('CREATE', Bugs, (data, req) => recordCreateSideEffects(req, data, entities))
    this.after('UPDATE', Bugs, (data, req) => recordUpdateSideEffects(req, entities))

    for (const target of commentTargets) {
      this.after('CREATE', target, (data, req) => recordCommentCreateSideEffects(req, data, entities))
    }

    this.after('READ', Bugs, async (bugs, req) => {
      await enrichBugDisplayFields(bugs, req, entities)
      await enrichBugCapabilities(bugs, req, entities)
    })
    this.after('READ', Bugs.drafts, async (bugs, req) => {
      await enrichBugDisplayFields(bugs, req, entities)
      await enrichBugCapabilities(bugs, req, entities)
    })
    for (const target of historyEventTargets) {
      this.after('READ', target, async (events, req) => enrichHistoryEventPayload(events, req, entities))
    }

    // Hai read model này tự tính dữ liệu thay vì để CAP SELECT projection thông thường:
    // một cái cấp danh sách có thể assign, cái còn lại cấp workload cho Smart Assign/Dashboard.
    this.on('READ', entities.AssignableDevelopers, req => readAssignableDevelopers(req, entities))
    this.on('READ', entities.DeveloperWorkloads, req => readDeveloperWorkloads(req, entities))
    // Bốn action AI đều là review-only: module `srv/ai/` dựng input và trả gợi ý;
    // gọi action tại đây không tự ghi classification, assignee hoặc status vào database.
    this.on('suggestSimilarBugs', req => suggestSimilarBugs(req, entities))
    this.on('suggestClassification', req => suggestClassification(req, entities))
    this.on('summarizeBugHandoff', req => summarizeBugHandoff(req, entities))
    this.on('explainSmartAssignment', req => explainSmartAssignment(req, entities))
    // Ba action review chỉ chốt trạng thái audit PENDING bằng actor đã xác thực.
    // Action apply riêng chỉ cho Tester/PM và vẫn kiểm lại payload/catalog trước khi sửa classification.
    this.on('acceptAiSuggestion', req => acceptAiSuggestion(req, entities))
    this.on('rejectAiSuggestion', req => rejectAiSuggestion(req, entities))
    this.on('ignoreAiSuggestion', req => ignoreAiSuggestion(req, entities))
    this.on('applyClassificationSuggestion', req => applyClassificationSuggestion(req, entities))
    // Confirmation không tin candidate content từ client và không đổi status của hai Bug.
    this.on('confirmDuplicateSuggestion', req => confirmDuplicateSuggestion(req, entities))
    this.on('readAiOperationalMetrics', req => readAiOperationalMetrics(req))
    this.on('readBugStatusMetrics', req => readBugStatusMetrics(req))
    this.on('processEmailOutbox', () => processEmailOutboxBatch({ tx: cds.db }))
    // `SAVE` là ranh giới draft → active. `handleDraftSave` validate lần cuối, gọi `next()` để CAP persist,
    // rồi mới ghi history/attachment side effects. Breakpoint tại đây phân biệt lỗi trước save với lỗi sau persist.
    this.on('SAVE', Bugs.drafts, (req, next) => handleDraftSave(req, entities, next))

    // Action nghiệp vụ từ Object Page đi vào các handler dưới đây. Các action chuyển status dùng chung
    // `transitionBug`: đó là nơi kiểm quyền, kiểm transition, update DB và ghi side effects.
    this.on('assignToDeveloper', req => assignToDeveloper(req, entities))
    this.on('reassignRetestOwner', req => reassignRetestOwner(req, entities))
    this.on('addComment', req => addComment(req, entities))
    this.on('moveToPendingAssignment', req => transitionBug(req, entities, {
      status: STATUS.PENDING_ASSIGNMENT,
      actionType: ACTION.MOVE_TO_PENDING_ASSIGNMENT,
      clearAssignee: true
    }))
    this.on('markInReview', req => transitionBug(req, entities, {
      status: STATUS.IN_REVIEW,
      actionType: ACTION.MARK_IN_REVIEW,
      requireAssignee: true
    }))
    this.on('requestMoreInformation', req => transitionBug(req, entities, {
      status: STATUS.NEED_MORE_INFORMATION,
      actionType: ACTION.REQUEST_MORE_INFORMATION,
      reason: req.data.reason,
      requireAssignee: true,
      requireReason: true
    }))
    this.on('resubmitToDeveloper', req => resubmitToDeveloper(req, entities))
    this.on('rejectBug', req => transitionBug(req, entities, {
      status: STATUS.REJECTED,
      actionType: ACTION.REJECT_BUG,
      reason: req.data.reason,
      requireAssignee: true,
      requireReason: true
    }))
    this.on('startProgress', req => transitionBug(req, entities, {
      status: STATUS.IN_PROGRESS,
      actionType: ACTION.START_PROGRESS,
      requireAssignee: true
    }))
    this.on('resolveBug', req => transitionBug(req, entities, {
      status: STATUS.RESOLVED,
      actionType: ACTION.RESOLVE_BUG,
      reason: req.data.note,
      requireAssignee: true,
      requireReason: true
    }))
    this.on('sendToRetest', req => transitionBug(req, entities, {
      status: STATUS.RETEST_REQUIRED,
      actionType: ACTION.SEND_TO_RETEST
    }))
    this.on('closeBug', req => transitionBug(req, entities, {
      status: STATUS.CLOSED,
      actionType: ACTION.CLOSE_BUG
    }))
    this.on('reopenBug', req => transitionBug(req, entities, {
      status: STATUS.REOPENED,
      actionType: ACTION.REOPEN_BUG,
      reason: req.data.reason,
      requireReason: true
    }))

    // `super.init()` cho CAP hoàn tất đăng ký service sau khi custom handler đã được gắn.
    // Worker email khởi động sau đó và đọc outbox đã commit, không gửi mail trong transaction của action Bug.
    await super.init()
    if (shouldStartEmailWorker()) startEmailWorker()
  }
}
