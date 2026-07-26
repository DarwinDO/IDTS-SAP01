// Chỉ áp dụng classification suggestion đã được accept và vẫn khớp catalog thật.
// Breakpoint chính: `applyClassificationSuggestion` để kiểm role, snapshot cũ và patch allow-list.
'use strict'

const cds = require('@sap/cds')
const { SELECT, UPDATE } = cds.ql

const { FEATURE_TYPES, REVIEW_STATES } = require('./audit')
const { ACTION, COORDINATOR_ROLES } = require('../bug-service/constants')
const { importantChanges, writeHistoryEvent } = require('../bug-service/history')
const { resolveRequestUser } = require('../bug-service/helpers')
const {
  resolveComponentCategory,
  validateActiveCodeLists,
  validateAssignee
} = require('../bug-service/bug-write')
const { enforceBugWritePermission } = require('../bug-service/permissions')

const SOURCE_FIELDS = Object.freeze({
  sapModuleID: 'sapModule_ID',
  applicationComponentID: 'applicationComponent_ID',
  defectCategoryID: 'defectCategory_ID',
  priorityCode: 'priority_code',
  severityCode: 'severity_code'
})

const SUGGESTION_FIELDS = Object.freeze({
  sapModule: {
    bugField: 'sapModule_ID',
    entity: 'SAPModules',
    kind: 'id'
  },
  applicationComponent: {
    bugField: 'applicationComponent_ID',
    entity: 'ApplicationComponents',
    kind: 'id'
  },
  defectCategory: {
    bugField: 'defectCategory_ID',
    entity: 'DefectCategories',
    kind: 'id'
  },
  priority: {
    bugField: 'priority_code',
    entity: 'PriorityValues',
    kind: 'code'
  },
  severity: {
    bugField: 'severity_code',
    entity: 'SeverityValues',
    kind: 'code'
  }
})

const APPLICABLE_STATUSES = new Set(['SUGGESTED', 'LOW_CONFIDENCE'])

async function applyClassificationSuggestion (req, entities) {
  const suggestionID = cleanSuggestionID(req.data?.suggestionID)
  if (!suggestionID) {
    return req.reject(400, 'A valid AI suggestion ID is required.', 'suggestionID')
  }

  const actor = await resolveRequestUser(req, entities)
  if (!actor || !COORDINATOR_ROLES.has(actor.role_code)) {
    return req.reject(403, 'Only Tester or PM users can apply classification suggestions.')
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
  if (suggestion.featureType_code !== FEATURE_TYPES.CLASSIFICATION) {
    return req.reject(400, 'This AI suggestion is not a classification suggestion.')
  }
  if (suggestion.reviewState_code !== REVIEW_STATES.ACCEPTED || isExpired(suggestion.expiresAt)) {
    return req.reject(409, 'Only an accepted, current classification suggestion can be applied.')
  }

  const bug = await tx.run(
    SELECT.one.from(entities.Bugs).where({ ID: suggestion.bug_ID })
  )
  if (!bug) return req.reject(404, 'AI suggestion was not found.')

  const payload = parsePayload(req, suggestion.suggestionPayload)
  const patch = await buildGroundedPatch(req, entities, payload.suggestions)
  const nextBug = { ...bug, ...patch }

  const componentCategory = await resolveComponentCategory(req, entities, nextBug)
  if (componentCategory) {
    patch.componentCategory_ID = componentCategory.ID
    nextBug.componentCategory_ID = componentCategory.ID
  }

  await validateActiveCodeLists(req, entities, nextBug)
  await enforceBugWritePermission(req, entities, bug, nextBug, { isCreate: false })
  if (nextBug.assignee_ID) await validateAssignee(req, entities, nextBug)

  if (matchesPatch(bug, patch)) {
    return tx.run(SELECT.one.from(entities.Bugs).where({ ID: bug.ID }))
  }

  assertCurrentSource(req, bug, payload.sourceClassification)

  const affected = await tx.run(
    UPDATE(entities.Bugs)
      .set(patch)
      .where({
        ID: bug.ID,
        ...sourceWhere(payload.sourceClassification)
      })
  )
  if (Number(affected) !== 1) {
    return req.reject(409, 'The Bug classification changed after this suggestion was created.')
  }

  const finalBug = { ...bug, ...patch }
  const changes = importantChanges(bug, finalBug).filter(change =>
    [
      'sapModule',
      'applicationComponent',
      'defectCategory',
      'componentCategory',
      'priority',
      'severity'
    ].includes(change.fieldName)
  )
  await writeHistoryEvent(req, entities, {
    bugID: bug.ID,
    actorID: actor.ID,
    actionType: ACTION.EDIT,
    summary: 'Applied an accepted classification suggestion.',
    changes
  })

  return tx.run(SELECT.one.from(entities.Bugs).where({ ID: bug.ID }))
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
    !Array.isArray(payload.suggestions) ||
    !payload.sourceClassification ||
    typeof payload.sourceClassification !== 'object' ||
    Array.isArray(payload.sourceClassification) ||
    Object.keys(SOURCE_FIELDS).some(field => !(field in payload.sourceClassification))
  ) {
    return req.reject(400, 'AI suggestion payload is not valid.')
  }
  return payload
}

async function buildGroundedPatch (req, entities, suggestions) {
  const patch = {}
  const seen = new Set()

  for (const row of suggestions) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      return req.reject(400, 'AI suggestion payload is not valid.')
    }
    const field = typeof row.field === 'string' ? row.field.trim() : ''
    const definition = SUGGESTION_FIELDS[field]
    if (!definition || seen.has(field)) {
      return req.reject(400, 'AI suggestion contains an unsupported or duplicate classification field.')
    }
    seen.add(field)

    const hasValue = Boolean(cleanText(row.valueID) || cleanCode(row.valueCode))
    if (!hasValue) continue
    if (!APPLICABLE_STATUSES.has(row.status)) {
      return req.reject(400, 'AI suggestion contains a classification value that is not safe to apply.')
    }

    patch[definition.bugField] = await resolveCatalogValue(req, entities, definition, row)
  }

  if (!Object.keys(patch).length) {
    return req.reject(400, 'AI suggestion does not contain an applicable classification value.')
  }
  return patch
}

async function resolveCatalogValue (req, entities, definition, row) {
  const tx = cds.tx(req)
  const target = entities[definition.entity]

  if (definition.kind === 'code') {
    const code = cleanCode(row.valueCode)
    if (!code) return req.reject(400, 'AI suggestion catalog value is not valid.')
    const value = await tx.run(
      SELECT.one.from(target).columns('code').where({ code, active: true })
    )
    if (!value) return req.reject(400, 'AI suggestion catalog value is inactive or unavailable.')
    return value.code
  }

  const ID = cleanText(row.valueID)
  if (!ID) return req.reject(400, 'AI suggestion catalog value is not valid.')
  const value = await tx.run(
    SELECT.one.from(target).columns('ID', 'code').where({ ID, active: true })
  )
  if (!value) return req.reject(400, 'AI suggestion catalog value is inactive or unavailable.')

  const suppliedCode = cleanCode(row.valueCode)
  if (suppliedCode && suppliedCode !== cleanCode(value.code)) {
    return req.reject(400, 'AI suggestion catalog ID and code do not match.')
  }
  return value.ID
}

function assertCurrentSource (req, bug, source) {
  for (const [sourceField, bugField] of Object.entries(SOURCE_FIELDS)) {
    if (!(sourceField in source) || normalizeSourceValue(source[sourceField]) !== normalizeSourceValue(bug[bugField])) {
      return req.reject(409, 'The Bug classification changed after this suggestion was created.')
    }
  }
}

function sourceWhere (source) {
  return Object.fromEntries(
    Object.entries(SOURCE_FIELDS).map(([sourceField, bugField]) => [
      bugField,
      normalizeSourceValue(source[sourceField])
    ])
  )
}

function matchesPatch (bug, patch) {
  return Object.entries(patch).every(([field, value]) => bug[field] === value)
}

function normalizeSourceValue (value) {
  if (value === null || value === undefined || value === '') return null
  return String(value).trim()
}

function cleanSuggestionID (value) {
  const text = cleanText(value)
  return /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : null
}

function cleanText (value) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanCode (value) {
  return cleanText(value).toUpperCase()
}

function isExpired (value) {
  if (!value) return false
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp <= Date.now()
}

module.exports = {
  applyClassificationSuggestion,
  buildGroundedPatch
}
