// Học nhanh (DonHV): bảo vệ comment và attachment. Browser có thể validate sớm, nhưng file/comment an toàn phải được xác nhận lại tại đây.
const cds = require('@sap/cds')

const { SELECT } = cds.ql

const {
  ATTACHMENT_ROLES,
  COMMENT_ROLES
} = require('./constants')

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

  const actor = await resolveRequestUser(req, entities)
  if (actor) {
    if (!COMMENT_ROLES.has(actor.role_code)) {
      return req.reject(403, 'Only Tester, Developer, or PM users can add comments.')
    }

    if (req.data.author_ID && req.data.author_ID !== actor.ID) {
      return req.reject(403, 'Users cannot create comments on behalf of another user.', 'author')
    }

    req.data.author_ID = actor.ID
    req.data.authorRole_code = actor.role_code
  }

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
  const actor = await resolveRequestUser(req, entities)

  if (actor && !ATTACHMENT_ROLES.has(actor.role_code)) {
    return req.reject(403, 'Only Tester, Developer, or PM users can upload attachments.')
  }

  const contentLength = Number(req.http?.req?.headers?.['content-length'])
  if (Number.isFinite(contentLength) && contentLength > 0) {
    req.data.fileSize = contentLength
  }
}

module.exports = {
  prepareCommentCreate,
  prepareAttachmentWrite
}
