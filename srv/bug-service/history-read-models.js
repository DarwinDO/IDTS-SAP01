// Học nhanh (DonHV): biến audit thô thành HistoryEvents dễ đọc. Breakpoint enrich khi timeline có actor/status hiển thị sai.
const cds = require('@sap/cds')

const { SELECT } = cds.ql

const { trimToNull } = require('./helpers')
const { HISTORY_FIELD_LABELS } = require('./constants')

const VIRTUAL_HISTORY_EVENT_FIELDS = new Set([
  'changeCount',
  'groupedChangeContext'
])

const HISTORY_FIELD_ORDER = [
  'status',
  'assignee',
  'nextProcessorUser',
  'nextProcessorRole',
  'rejectionReason',
  'priority',
  'severity',
  'dueDate',
  'plannedCompletionDate',
  'estimatedEffortHours',
  'sapModule',
  'applicationComponent',
  'defectCategory',
  'componentCategory',
  'title',
  'description',
  'stepsToReproduce',
  'actualResult',
  'expectedResult',
  'testCaseRef',
  'testRunRef',
  'environment',
  'environmentDetail',
  'comment',
  'attachment'
]

const LONG_TEXT_FIELDS = new Set([
  'description',
  'stepsToReproduce',
  'actualResult',
  'expectedResult',
  'rejectionReason',
  'comment'
])

const LEGACY_HISTORY_FIELD_LABELS = new Map([
  ['Next Processor User', HISTORY_FIELD_LABELS.nextProcessorUser],
  ['Next Processor Role', HISTORY_FIELD_LABELS.nextProcessorRole]
])

function ensureHistoryEventSelectDependencies (req) {
  const columns = req.query?.SELECT?.columns
  if (!Array.isArray(columns) || !columns.length) return

  const selectedRefs = new Set(
    columns
      .map(column => Array.isArray(column?.ref) ? column.ref.join('/') : null)
      .filter(Boolean)
  )

  const requestsVirtualField = [...VIRTUAL_HISTORY_EVENT_FIELDS].some(field => selectedRefs.has(field))
  if (!requestsVirtualField) return

  if (!selectedRefs.has('ID')) {
    columns.push({ ref: ['ID'] })
  }
}

async function enrichHistoryEventPayload (events, req, entities) {
  const rows = Array.isArray(events) ? events : [events].filter(Boolean)
  if (!rows.length) return

  for (const row of rows) {
    row.changeCount = 0
    row.groupedChangeContext = null
  }

  const eventIDs = [...new Set(rows.map(row => row?.ID).filter(Boolean))]
  if (!eventIDs.length) return

  const historyLogs = await cds.tx(req).run(
    SELECT.from(entities.HistoryLogs)
      .columns(
        'ID',
        'event_ID',
        'fieldName',
        'fieldLabel',
        'oldValue',
        'oldValueDisplay',
        'newValue',
        'newValueDisplay',
        'createdAt'
      )
      .where({ event_ID: { in: eventIDs } })
  )

  const logsByEventID = new Map()
  for (const log of historyLogs) {
    const logs = logsByEventID.get(log.event_ID) || []
    logs.push(log)
    logsByEventID.set(log.event_ID, logs)
  }

  for (const row of rows) {
    const logs = normalizeHistoryLogs(Array.isArray(row.logs) && row.logs.length ? row.logs : logsByEventID.get(row.ID) || [])
    row.changeCount = logs.length
    row.groupedChangeContext = summarizeHistoryLogs(logs)
    if (Array.isArray(row.logs)) {
      row.logs = logs
    }
  }
}

function normalizeHistoryLogs (logs) {
  return [...logs]
    .map(normalizeHistoryLog)
    .sort(compareHistoryLogs)
}

function normalizeHistoryLog (log) {
  const normalized = { ...log }
  normalized.fieldLabel = historyDisplayLabel(normalized)
  return normalized
}

function historyDisplayLabel (log) {
  const fieldName = trimToNull(log.fieldName)
  if (fieldName && HISTORY_FIELD_LABELS[fieldName]) {
    return HISTORY_FIELD_LABELS[fieldName]
  }

  const fieldLabel = trimToNull(log.fieldLabel)
  if (!fieldLabel) return fieldName

  return LEGACY_HISTORY_FIELD_LABELS.get(fieldLabel) || fieldLabel
}

function compareHistoryLogs (left, right) {
  const fieldOrder = historyFieldOrderIndex(left.fieldName) - historyFieldOrderIndex(right.fieldName)
  if (fieldOrder !== 0) return fieldOrder

  const leftCreatedAt = String(left.createdAt || '')
  const rightCreatedAt = String(right.createdAt || '')
  if (leftCreatedAt !== rightCreatedAt) return leftCreatedAt.localeCompare(rightCreatedAt)

  const leftLabel = String(left.fieldLabel || left.fieldName || '')
  const rightLabel = String(right.fieldLabel || right.fieldName || '')
  if (leftLabel !== rightLabel) return leftLabel.localeCompare(rightLabel)

  return String(left.ID || '').localeCompare(String(right.ID || ''))
}

function historyFieldOrderIndex (fieldName) {
  const index = HISTORY_FIELD_ORDER.indexOf(fieldName)
  return index === -1 ? HISTORY_FIELD_ORDER.length : index
}

function summarizeHistoryLogs (logs) {
  const fragments = logs
    .map(formatHistoryLogFragment)
    .filter(Boolean)

  if (!fragments.length) return null
  if (fragments.length <= 3) return fragments.join(' · ')

  return `${fragments.slice(0, 3).join(' · ')} · +${fragments.length - 3} more changes`
}

function formatHistoryLogFragment (log) {
  const fieldName = trimToNull(log.fieldName)
  const fieldLabel = historyDisplayLabel(log)
  if (!fieldLabel) return null

  const oldValue = historyDisplayValue(log.oldValueDisplay, log.oldValue)
  const newValue = historyDisplayValue(log.newValueDisplay, log.newValue)

  if (fieldName === 'comment') return 'Comment added'

  if (fieldName === 'attachment') {
    if (!oldValue && newValue) return `Attachment: ${truncateHistoryValue(newValue, 60)}`
    if (oldValue && !newValue) return 'Attachment removed'
    if (oldValue && newValue && oldValue !== newValue) {
      return `Attachment: ${truncateHistoryValue(oldValue, 24)} → ${truncateHistoryValue(newValue, 24)}`
    }
    return 'Attachment updated'
  }

  if (LONG_TEXT_FIELDS.has(fieldName)) {
    if (!oldValue && newValue) return `${fieldLabel} added`
    if (oldValue && !newValue) return `${fieldLabel} cleared`
    return `${fieldLabel} updated`
  }

  if (!oldValue && newValue) {
    return `${fieldLabel}: ${truncateHistoryValue(newValue, 60)}`
  }

  if (oldValue && !newValue) {
    return `${fieldLabel} cleared`
  }

  if (oldValue === newValue) {
    return `${fieldLabel} updated`
  }

  return `${fieldLabel}: ${truncateHistoryValue(oldValue, 32)} → ${truncateHistoryValue(newValue, 32)}`
}

function historyDisplayValue (displayValue, rawValue) {
  return trimToNull(displayValue) || trimToNull(rawValue)
}

function truncateHistoryValue (value, maxLength) {
  const normalized = String(value).replace(/\s+/g, ' ').trim()
  if (!normalized) return normalized
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 1))}…`
}

module.exports = {
  ensureHistoryEventSelectDependencies,
  enrichHistoryEventPayload
}
