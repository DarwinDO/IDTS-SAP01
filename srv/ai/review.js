// Human review boundary for persisted AI suggestions.
// Breakpoint chính: `reviewAiSuggestion` để kiểm actor, trạng thái PENDING và conditional UPDATE.
'use strict'

const cds = require('@sap/cds')
const { SELECT, UPDATE } = cds.ql

const { REVIEW_STATES } = require('./audit')
const { USER_ROLE } = require('../bug-service/constants')
const { resolveRequestUser } = require('../bug-service/helpers')

const REVIEWER_ROLES = new Set([
  USER_ROLE.TESTER,
  USER_ROLE.DEVELOPER,
  USER_ROLE.PM
])

async function acceptAiSuggestion (req, entities) {
  return reviewAiSuggestion(req, entities, REVIEW_STATES.ACCEPTED)
}

async function rejectAiSuggestion (req, entities) {
  return reviewAiSuggestion(req, entities, REVIEW_STATES.REJECTED)
}

async function ignoreAiSuggestion (req, entities) {
  return reviewAiSuggestion(req, entities, REVIEW_STATES.IGNORED)
}

async function reviewAiSuggestion (req, entities, nextState) {
  // Chỉ nhận ID audit; actor/reviewer luôn lấy từ session CAP, không lấy từ payload client.
  const suggestionID = cleanSuggestionID(req.data?.suggestionID)
  if (!suggestionID) {
    return req.reject(400, 'A valid AI suggestion ID is required.', 'suggestionID')
  }

  const actor = await resolveRequestUser(req, entities)
  if (!actor || !REVIEWER_ROLES.has(actor.role_code)) {
    return req.reject(403, 'You are not allowed to review this AI suggestion.')
  }

  const tx = cds.tx(req)
  const suggestion = await tx.run(
    SELECT.one.from('idts.cap.AiSuggestions')
      .columns('ID', 'bug_ID', 'featureType_code', 'reviewState_code', 'expiresAt')
      .where({ ID: suggestionID })
  )
  // 404 cũng được dùng khi Bug đích không còn đọc được để không xác nhận sự tồn tại của dữ liệu ngoài scope.
  if (!suggestion) return req.reject(404, 'AI suggestion was not found.')

  const bug = await tx.run(
    SELECT.one.from(entities.Bugs)
      .columns('ID')
      .where({ ID: suggestion.bug_ID })
  )
  if (!bug) return req.reject(404, 'AI suggestion was not found.')

  if (suggestion.reviewState_code !== REVIEW_STATES.PENDING || isExpired(suggestion.expiresAt)) {
    return req.reject(409, 'This AI suggestion is no longer pending review.')
  }

  const reviewedAt = new Date().toISOString()
  // Conditional UPDATE chặn hai reviewer cùng chốt một suggestion. Request thua race nhận 409.
  const affected = await tx.run(
    UPDATE('idts.cap.AiSuggestions')
      .set({
        reviewState_code: nextState,
        reviewedBy_ID: actor.ID,
        reviewedAt
      })
      .where({
        ID: suggestionID,
        reviewState_code: REVIEW_STATES.PENDING
      })
  )
  if (Number(affected) !== 1) {
    return req.reject(409, 'This AI suggestion is no longer pending review.')
  }

  const state = await tx.run(
    SELECT.one.from('idts.cap.AiSuggestionReviewStates')
      .columns('name')
      .where({ code: nextState, active: true })
  )

  return {
    suggestionID,
    bugID: suggestion.bug_ID,
    featureTypeCode: suggestion.featureType_code,
    reviewStateCode: nextState,
    reviewStateName: state?.name || nextState,
    reviewedByID: actor.ID,
    reviewedByDisplayName: actor.displayName,
    reviewedAt
  }
}

function cleanSuggestionID (value) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : null
}

function isExpired (value) {
  if (!value) return false
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp <= Date.now()
}

module.exports = {
  acceptAiSuggestion,
  rejectAiSuggestion,
  ignoreAiSuggestion,
  reviewAiSuggestion
}
