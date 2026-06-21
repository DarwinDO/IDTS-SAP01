const cds = require('@sap/cds')

const { SELECT } = cds.ql

const {
  ACCEPTED_ATTACHMENT_MEDIA_TYPES,
  ATTACHMENT_ROLES,
  COMMENT_ROLES,
  MAX_ATTACHMENT_BYTES
} = require('./constants')

const {
  attachmentIDFrom,
  extractAttachmentContent,
  fileNameFromHeaders,
  isAttachmentContentRequest,
  isEnvelopeMediaType,
  normalizeMediaType,
  readAttachment,
  requestHeaders,
  resolveRequestUser,
  trimToNull
} = require('./helpers')

async function prepareCommentCreate (req, entities) {
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

async function prepareAttachmentWrite (req, entities, { isCreate }) {
  const headers = requestHeaders(req)
  const actor = await resolveRequestUser(req, entities)
  const attachmentID = attachmentIDFrom(req)

  if (!isCreate && attachmentID) {
    req._oldAttachment = await readAttachment(req, req.target, attachmentID)
  }

  if (actor && !ATTACHMENT_ROLES.has(actor.role_code)) {
    return req.reject(403, 'Only Tester, Developer, or PM users can upload attachments.')
  }

  if (!req.data.ID && isCreate) {
    req.data.ID = cds.utils.uuid()
  }

  if (req.data.uploadedBy_ID && actor && req.data.uploadedBy_ID !== actor.ID) {
    return req.reject(403, 'Users cannot upload attachments on behalf of another user.', 'uploadedBy')
  }

  if (actor) {
    req.data.uploadedBy_ID = actor.ID
  }

  const uploadedByID = req.data.uploadedBy_ID || (isCreate ? null : undefined)
  if (uploadedByID === null) {
    return req.reject(400, 'Attachment uploader is required.', 'uploadedBy')
  }

  if (req.data.uploadedBy_ID) {
    const uploader = await cds.tx(req).run(SELECT.one.from(entities.Users).where({
      ID: req.data.uploadedBy_ID,
      active: true
    }))

    if (!uploader) {
      return req.reject(400, 'Attachment uploader must be an active user.', 'uploadedBy')
    }

    if (!ATTACHMENT_ROLES.has(uploader.role_code)) {
      return req.reject(400, 'Attachment uploader must be a Tester, Developer, or PM user.', 'uploadedBy')
    }
  }

  if (isCreate && !req.data.storageRef) {
    req.data.storageRef = `db://attachments/${req.data.ID}`
  }

  if (isAttachmentContentRequest(req) && req.data.content == null) {
    const binaryContent = await extractAttachmentContent(req)
    if (binaryContent) {
      req.data.content = binaryContent
      if (!req.data.fileSize) req.data.fileSize = binaryContent.length
    }
  }

  const headerMediaType = normalizeMediaType(headers['content-type'])
  req.data.fileName = trimToNull(req.data.fileName) || fileNameFromHeaders(headers) || req.data.fileName

  const explicitMediaType = normalizeMediaType(req.data.mediaType)
  if (explicitMediaType) {
    req.data.mediaType = explicitMediaType
  } else if (headerMediaType && !isEnvelopeMediaType(headerMediaType)) {
    req.data.mediaType = headerMediaType
  }

  const contentLength = Number(headers['content-length'])
  if (!isEnvelopeMediaType(headerMediaType) && Number.isFinite(contentLength) && contentLength > 0) {
    req.data.fileSize = contentLength
  }

  const mediaType = normalizeMediaType(req.data.mediaType)
  if (mediaType && !ACCEPTED_ATTACHMENT_MEDIA_TYPES.has(mediaType)) {
    return req.reject(400, `Unsupported attachment media type: ${mediaType}.`, 'mediaType')
  }

  if (Number.isFinite(Number(req.data.fileSize)) && Number(req.data.fileSize) > MAX_ATTACHMENT_BYTES) {
    return req.reject(413, `Attachment size exceeds the ${Math.floor(MAX_ATTACHMENT_BYTES / (1024 * 1024))} MB limit.`, 'fileSize')
  }
}

module.exports = {
  prepareCommentCreate,
  prepareAttachmentWrite
}
