// File này điều khiển ba chặng draft của Fiori: NEW tạo nháp, PATCH cập nhật từng phần,
// và SAVE kích hoạt nháp thành Bug active. Hãy bắt đầu debug ở đây khi lỗi chỉ xuất hiện trong Create/Edit draft.
const cds = require('@sap/cds')

const { SELECT } = cds.ql

const {
  bugIDFrom,
  readBug,
  resolveRequestUser
} = require('./helpers')

const {
  importantChanges,
  recordBugChangeSideEffects,
  recordDraftAttachmentSaveSideEffects
} = require('./history')
const {
  validateActiveCodeLists,
  validateRequiredBugFields
} = require('./bug-write')
const { assertBugOpenForMutation } = require('./permissions')

async function prepareDraftPatch (req, entities) {
  // Fiori gọi PATCH nhiều lần khi người dùng đổi field. `req.data` thường chỉ có field vừa đổi,
  // nên phải đọc draft hiện tại rồi merge để validation nhìn thấy toàn bộ trạng thái form.
  const bugID = bugIDFrom(req)
  if (!bugID) return

  const currentDraft = await cds.tx(req).run(SELECT.one.from(entities.Bugs.drafts).where({ ID: bugID }))
  if (!currentDraft) return

  assertBugOpenForMutation(req, currentDraft)
  if (currentDraft.HasActiveEntity) {
    const activeBug = await readBug(req, entities, bugID)
    assertBugOpenForMutation(req, activeBug)
  }
  delete req.data.reporter_ID
  delete req.data.retestOwner_ID

  const merged = { ...currentDraft, ...req.data }
  // Kiểm code-list ngay lúc PATCH để UI nhận lỗi đúng field sớm, không chờ đến Save.
  await validateActiveCodeLists(req, entities, merged)
  if (merged.applicationComponent_ID && merged.defectCategory_ID) {
    const componentCategory = await cds.tx(req).run(SELECT.one.from(entities.ComponentCategories).where({
      component_ID: merged.applicationComponent_ID,
      defectCategory_ID: merged.defectCategory_ID,
      active: true
    }))
    // ComponentCategory là cặp hợp lệ giữa Application Component và Defect Category.
    // Backend tự gắn ID khi cặp active tồn tại; nếu không thì xóa ID dẫn xuất cũ.
    if (componentCategory) {
      req.data.componentCategory_ID = componentCategory.ID
    } else {
      req.data.componentCategory_ID = null
    }
  } else {
    req.data.componentCategory_ID = null
  }
}

async function prepareDraftNew (req, actor) {
  // `service.js` gọi sau khi kiểm quyền NEW. Reporter luôn lấy từ actor đã xác thực,
  // nên client không thể tạo Bug dưới tên user khác bằng cách sửa payload.
  if (!actor) {
    return req.reject(
      403,
      'An active IDTS user is required to create a bug report.',
      'reporter_ID'
    )
  }

  // Reporter is system-managed. Never trust a client-supplied reporter for a
  // new draft; bind it to the authenticated IDTS user instead.
  req.data.reporter_ID = actor.ID
  req.data.retestOwner_ID = actor.ID
}

async function ensureDraftReporterForSave (req, entities, draft, actor) {
  // Draft mới đã có reporter từ `prepareDraftNew`. Nhánh fallback chỉ cứu draft cũ;
  // nếu không resolve được actor thì SAVE dừng để tránh Bug không rõ người báo.
  if (draft.reporter_ID) {
    if (!draft.HasActiveEntity && !draft.retestOwner_ID) draft.retestOwner_ID = draft.reporter_ID
    return draft.reporter_ID
  }

  if (!actor && entities) actor = await resolveRequestUser(req, entities)

  if (!actor) {
    return req.reject(
      403,
      'An active IDTS user is required to activate a bug draft.',
      'reporter_ID'
    )
  }

  // This fallback supports drafts created before IDTS-49. The active CREATE
  // handler still applies the authoritative system-managed fields afterward.
  draft.reporter_ID = actor.ID
  if (!draft.HasActiveEntity && !draft.retestOwner_ID) draft.retestOwner_ID = actor.ID
  return actor.ID
}

async function handleDraftSave (req, entities, next) {
  // Thứ tự bắt buộc: validate → chụp trạng thái cũ → CAP persist qua `next()` → side effects.
  // Đặt breakpoint lần lượt ở bốn dòng dưới để biết lỗi trước DB commit hay sau persist.
  await validateDraftForSave(req, entities)
  await captureDraftSaveState(req, entities)
  const result = await next()
  await recordDraftBugSaveSideEffects(req, result, entities)
  await recordDraftAttachmentSaveSideEffects(req, result, entities)
  return result
}

async function validateDraftForSave (req, entities) {
  // SAVE là hàng rào cuối: đọc lại draft trong transaction hiện tại, bảo đảm reporter,
  // rồi kiểm field bắt buộc và code-list. Không tin dữ liệu chỉ vì PATCH trước đó hợp lệ.
  const bugID = bugIDFrom(req)
  if (!bugID) return

  const draft = await cds.tx(req).run(SELECT.one.from(entities.Bugs.drafts).where({ ID: bugID }))
  if (!draft) return

  assertBugOpenForMutation(req, draft)
  if (draft.HasActiveEntity) {
    const activeBug = await readBug(req, entities, bugID)
    assertBugOpenForMutation(req, activeBug)
  }

  await ensureDraftReporterForSave(req, entities, draft)
  validateRequiredBugFields(req, draft, { rejectFirst: true })
  await validateActiveCodeLists(req, entities, draft)
}

async function captureDraftSaveState (req, entities) {
  // Chụp Bug active và attachment metadata trước SAVE vào `req` để bước sau tính diff.
  // Đây là dữ liệu tạm trong một request, không phải field được lưu vào database.
  const bugID = bugIDFrom(req)
  if (!bugID) return

  req._preSaveActiveBug = await readBug(req, entities, bugID)
  req._preSaveActiveAttachments = await cds.tx(req).run(
    SELECT.from(entities['Bugs.attachments'])
      .columns('ID', 'up__ID', 'filename', 'mimeType', 'fileSize')
      .where({ up__ID: bugID })
  )
}

async function recordDraftBugSaveSideEffects (req, data, entities) {
  // Chỉ edit draft của Bug đã active mới có `oldBug`; create lần đầu không đi nhánh diff này.
  // Sau persist, đọc bản active mới, tính field thực sự đổi rồi ghi History/Notification.
  const oldBug = req._preSaveActiveBug
  const bugID = data?.ID || bugIDFrom(req)
  if (!oldBug || !bugID) return

  const activeBug = await readBug(req, entities, bugID)
  if (!activeBug) return

  const changes = importantChanges(oldBug, activeBug)
  await recordBugChangeSideEffects(req, entities, changes, activeBug)
}

module.exports = {
  ensureDraftReporterForSave,
  prepareDraftPatch,
  prepareDraftNew,
  handleDraftSave,
  validateDraftForSave
}
