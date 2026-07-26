// Chỉ biến Similar Bugs suggestion đã được người có quyền Accept thành DuplicateLink.
// Breakpoint chính: `confirmDuplicateSuggestion` để kiểm tra actor, payload đã persist và transaction insert.
'use strict'

const crypto = require('node:crypto')
const cds = require('@sap/cds')
const { INSERT, SELECT } = cds.ql

const { FEATURE_TYPES, REVIEW_STATES } = require('./audit')
const { COORDINATOR_ROLES } = require('../bug-service/constants')
const { resolveRequestUser } = require('../bug-service/helpers')

async function confirmDuplicateSuggestion (req, entities) {
  const suggestionID = cleanUUID(req.data?.suggestionID)
  const candidateBugID = cleanUUID(req.data?.candidateBugID)
  if (!suggestionID) {
    return req.reject(400, 'A valid AI suggestion ID is required.', 'suggestionID')
  }
  if (!candidateBugID) {
    return req.reject(400, 'A valid candidate Bug ID is required.', 'candidateBugID')
  }

  const actor = await resolveRequestUser(req, entities)
  if (!actor || !COORDINATOR_ROLES.has(actor.role_code)) {
    return req.reject(403, 'Only Tester or PM users can confirm duplicate suggestions.')
  }

  const tx = cds.tx(req)
  const suggestion = await tx.run(
    SELECT.one.from('idts.cap.AiSuggestions')
      .columns(
        'ID',
        'bug_ID',
        'featureType_code',
        'reviewState_code',
        'suggestionPayload',
        'expiresAt'
      )
      .where({ ID: suggestionID })
  )
  if (!suggestion) return req.reject(404, 'AI suggestion was not found.')
  if (suggestion.featureType_code !== FEATURE_TYPES.DUPLICATE_DETECTION) {
    return req.reject(400, 'This AI suggestion is not a Similar Bugs suggestion.')
  }
  if (suggestion.reviewState_code !== REVIEW_STATES.ACCEPTED || isExpired(suggestion.expiresAt)) {
    return req.reject(409, 'Only an accepted, current Similar Bugs suggestion can be confirmed.')
  }

  const sourceBugID = cleanUUID(suggestion.bug_ID)
  if (!sourceBugID) return req.reject(404, 'AI suggestion was not found.')
  if (sourceBugID === candidateBugID) {
    return req.reject(400, 'A Bug cannot be linked to itself.')
  }

  const sourceBug = await tx.run(
    SELECT.one.from(entities.Bugs).columns('ID').where({ ID: sourceBugID })
  )
  if (!sourceBug) return req.reject(404, 'AI suggestion was not found.')

  const candidateBug = await tx.run(
    SELECT.one.from(entities.Bugs).columns('ID').where({ ID: candidateBugID })
  )
  if (!candidateBug) return req.reject(404, 'Candidate Bug was not found.')

  const payload = parsePayload(req, suggestion.suggestionPayload)
  const storedCandidate = payload.candidates.find(candidate =>
    cleanUUID(candidate?.bugID) === candidateBugID
  )
  if (!storedCandidate) {
    return req.reject(400, 'Candidate Bug was not part of the accepted Similar Bugs suggestion.')
  }

  const relationTypeCode = cleanCode(storedCandidate.suggestedRelationTypeCode)
  if (!relationTypeCode) {
    return req.reject(400, 'AI suggestion does not contain a valid duplicate relation type.')
  }
  const relationType = await tx.run(
    SELECT.one.from(entities.DuplicateRelationTypes)
      .columns('code')
      .where({ code: relationTypeCode, active: true })
  )
  if (!relationType) {
    return req.reject(400, 'AI suggestion duplicate relation type is inactive or unavailable.')
  }

  if (await duplicateLinkExists(tx, sourceBugID, candidateBugID)) {
    return req.reject(409, 'These Bugs are already linked.')
  }

  const ID = duplicateLinkID(sourceBugID, candidateBugID)
  try {
    await tx.run(
      INSERT.into('idts.cap.DuplicateLinks').entries({
        ID,
        sourceBug_ID: sourceBugID,
        targetBug_ID: candidateBugID,
        relationType_code: relationType.code
      })
    )
  } catch (error) {
    if (isConstraintConflict(error)) {
      return req.reject(409, 'These Bugs are already linked.')
    }
    throw error
  }

  return tx.run(
    SELECT.one.from(entities.DuplicateLinks).where({ ID })
  )
}

function parsePayload (req, value) {
  let payload
  try {
    payload = typeof value === 'string' ? JSON.parse(value) : value
  } catch (error) {
    void error
    return req.reject(400, 'AI suggestion payload is not valid.')
  }
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    !Array.isArray(payload.candidates)
  ) {
    return req.reject(400, 'AI suggestion payload is not valid.')
  }
  return payload
}

async function duplicateLinkExists (tx, firstBugID, secondBugID) {
  const rows = await tx.run(
    SELECT.from('idts.cap.DuplicateLinks')
      .columns('ID', 'sourceBug_ID', 'targetBug_ID')
      .where({
        sourceBug_ID: { in: [firstBugID, secondBugID] },
        targetBug_ID: { in: [firstBugID, secondBugID] }
      })
  )
  return rows.some(row =>
    (row.sourceBug_ID === firstBugID && row.targetBug_ID === secondBugID) ||
    (row.sourceBug_ID === secondBugID && row.targetBug_ID === firstBugID)
  )
}

function duplicateLinkID (firstBugID, secondBugID) {
  const pair = [firstBugID, secondBugID].sort().join(':')
  const hex = crypto.createHash('sha256')
    .update(`idts-duplicate-link:${pair}`)
    .digest('hex')
    .slice(0, 32)
    .split('')
  hex[12] = '5'
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)
  const value = hex.join('')
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
}

function cleanUUID (value) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(text)
    ? text.toLowerCase()
    : null
}

function cleanCode (value) {
  if (typeof value !== 'string') return null
  const text = value.trim().toUpperCase()
  return text || null
}

function isExpired (value) {
  if (!value) return false
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp <= Date.now()
}

function isConstraintConflict (error) {
  const text = [
    error?.code,
    error?.message,
    error?.cause?.code,
    error?.cause?.message
  ].filter(Boolean).join(' ')
  return /unique|duplicate|primary key/i.test(text)
}

module.exports = {
  confirmDuplicateSuggestion,
  duplicateLinkID
}
