// Học nhanh (DonHV): bảo vệ comment và attachment. Browser có thể validate sớm, nhưng file/comment an toàn phải được xác nhận lại tại đây.
const cds = require('@sap/cds')

const { SELECT } = cds.ql

const {
  ATTACHMENT_ROLES,
  COMMENT_ROLES
} = require('./constants')
const { assertActiveActor, assertBugOpenForMutation, isAssignedDeveloper } = require('./permissions')

const {
  resolveRequestUser,
  trimToNull
} = require('./helpers')

async function prepareCommentCreate (req, entities) {
  // Chạy trước CREATE Comment active/draft. Hàm gắn Bug cha và author từ request đã xác thực,
  // đồng thời chặn nội dung rỗng; client không được tự giả author bằng payload.
  req.data.content = trimToNull(req.data.content)
  if (!req.data.content) {
    return req.reject(400, 'Comment content is required.', 'content')
  }

  const bug = await readParentBugForContent(req, entities, req.data.bug_ID)
  if (!bug) return req.reject(404, 'Bug not found.')
  assertBugOpenForMutation(req, bug)

  const actor = assertActiveActor(req, await resolveRequestUser(req, entities))
  if (!COMMENT_ROLES.has(actor.role_code)) {
    return req.reject(403, 'Only Tester, Developer, or PM users can add comments.')
  }

  if (req.data.author_ID && req.data.author_ID !== actor.ID) {
    return req.reject(403, 'Users cannot create comments on behalf of another user.', 'author')
  }

  req.data.author_ID = actor.ID
  req.data.authorRole_code = actor.role_code

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

async function prepareAttachmentWrite (req, entities) {
  // Chạy trước mọi thao tác ghi/xóa attachment. Hàm kiểm quyền trên Bug cha và chuẩn hóa metadata;
  // binary thật đi qua storage adapter/S3, còn DB chỉ giữ metadata và storage reference.
  const actor = assertActiveActor(req, await resolveRequestUser(req, entities))

  const bug = await readParentBugForContent(req, entities, req.data?.up__ID)
  if (!bug) return req.reject(404, 'Bug not found.')
  assertBugOpenForMutation(req, bug)

  const isAssigned = actor?.role_code === 'DEVELOPER'
    ? await isAssignedDeveloper(req, entities, actor.ID, bug)
    : false
  assertAttachmentPermission(req, actor, isAssigned)

  const contentLength = Number(req.http?.req?.headers?.['content-length'])
  if (Number.isFinite(contentLength) && contentLength > 0) {
    req.data.fileSize = contentLength
  }
}

function assertAttachmentPermission (req, actor, isAssignedDeveloperActor) {
  assertActiveActor(req, actor)
  if (!ATTACHMENT_ROLES.has(actor.role_code)) {
    return req.reject(403, 'Only Tester, Developer, or PM users can manage attachments.')
  }
  if (actor?.role_code === 'DEVELOPER' && !isAssignedDeveloperActor) {
    return req.reject(403, 'Only the assigned developer, Tester, or PM can manage Bug attachments.')
  }
}

async function prepareCommentMutation (req, entities) {
  const bug = await readParentBugForComment(req, entities)
  if (!bug) return req.reject(404, 'Bug not found.')
  assertBugOpenForMutation(req, bug)
}

async function readParentBugForContent (req, entities, suppliedParentID) {
  const parameterIDs = (req.params || []).map(parameter => parameter?.ID).filter(Boolean)
  const candidateBugIDs = [suppliedParentID, ...parameterIDs].filter(Boolean)

  for (const candidateID of candidateBugIDs) {
    const activeBug = await cds.tx(req).run(SELECT.one.from(entities.Bugs).where({ ID: candidateID }))
    if (activeBug) return activeBug
    const draftBug = await cds.tx(req).run(SELECT.one.from(entities.Bugs.drafts).where({ ID: candidateID }))
    if (draftBug) return draftBug
  }

  const attachmentID = req.data?.ID || parameterIDs[parameterIDs.length - 1]
  const attachmentTarget = entities['Bugs.attachments']
  const attachmentDraftTarget = attachmentTarget?.drafts
  if (!attachmentID || !attachmentTarget) return null

  const activeAttachment = await cds.tx(req).run(
    SELECT.one.from(attachmentTarget).columns('up__ID').where({ ID: attachmentID })
  )
  const draftAttachment = activeAttachment || !attachmentDraftTarget
    ? null
    : await cds.tx(req).run(
      SELECT.one.from(attachmentDraftTarget).columns('up__ID').where({ ID: attachmentID })
    )
  const bugID = activeAttachment?.up__ID || draftAttachment?.up__ID
  if (!bugID) return null

  const activeBug = await cds.tx(req).run(SELECT.one.from(entities.Bugs).where({ ID: bugID }))
  if (activeBug) return activeBug
  return cds.tx(req).run(SELECT.one.from(entities.Bugs.drafts).where({ ID: bugID }))
}

async function readParentBugForComment (req, entities) {
  const parameterIDs = (req.params || []).map(parameter => parameter?.ID).filter(Boolean)
  const commentID = req.data?.ID || parameterIDs[parameterIDs.length - 1]
  if (!commentID) return null

  const commentTargets = [entities.Comments, entities.Comments?.drafts].filter(Boolean)
  for (const target of commentTargets) {
    const comment = await cds.tx(req).run(
      SELECT.one.from(target).columns('bug_ID').where({ ID: commentID })
    )
    if (!comment?.bug_ID) continue
    return readParentBugForContent(req, entities, comment.bug_ID)
  }
  return null
}

module.exports = {
  readParentBugForContent,
  prepareCommentCreate,
  prepareCommentMutation,
  prepareAttachmentWrite,
  assertAttachmentPermission
}
