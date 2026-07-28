'use strict'

const crypto = require('node:crypto')

const ENTITY_ORDER = Object.freeze([
  'idts.cap.UserRoles',
  'idts.cap.StatusValues',
  'idts.cap.PriorityValues',
  'idts.cap.SeverityValues',
  'idts.cap.EnvironmentValues',
  'idts.cap.ProcessorRoleValues',
  'idts.cap.AvailabilityStatuses',
  'idts.cap.ResponsibilityLevels',
  'idts.cap.ActionTypes',
  'idts.cap.NotificationEventTypes',
  'idts.cap.NotificationChannels',
  'idts.cap.NotificationDeliveryStatuses',
  'idts.cap.DuplicateRelationTypes',
  'idts.cap.AiSuggestionFeatureTypes',
  'idts.cap.AiSuggestionReviewStates',
  'idts.cap.Users',
  'idts.cap.DeveloperProfiles',
  'idts.cap.SAPModules',
  'idts.cap.ApplicationComponents',
  'idts.cap.SAPModuleComponents',
  'idts.cap.DefectCategories',
  'idts.cap.ComponentCategories',
  'idts.cap.DeveloperResponsibilities',
  'idts.cap.Bugs',
  'idts.cap.Comments',
  'idts.cap.Bugs.attachments',
  'idts.cap.HistoryEvents',
  'idts.cap.HistoryLogs',
  'idts.cap.Notifications',
  'idts.cap.NotificationDeliveries',
  'idts.cap.DuplicateLinks',
  'idts.cap.AiSuggestions'
])

const OMITTED_ENTITIES = Object.freeze([
  'idts.cap.AuthSessions'
])

function safeFileName (entity) {
  return `${entity.replace(/[^A-Za-z0-9.-]+/g, '_')}.json`
}

function postgresTableName (entity) {
  return entity.replace(/\./g, '_').toLowerCase()
}

function mapPostgresRowToCds (definition, row) {
  const columnMap = {}
  for (const [name, element] of Object.entries(definition?.elements || {})) {
    if (element.isAssociation) {
      for (const key of element.keys || []) {
        const suffix = key.as || key.ref.join('_')
        const logicalName = `${name}_${suffix}`
        columnMap[logicalName.toLowerCase()] = logicalName
      }
    } else if (!element.virtual) {
      columnMap[name.toLowerCase()] = name
    }
  }

  const mapped = {}
  for (const [physicalName, value] of Object.entries(row)) {
    const logicalName = columnMap[physicalName.toLowerCase()]
    if (!logicalName) {
      throw Object.assign(new Error(`Unknown PostgreSQL column ${physicalName}.`), {
        code: 'MIGRATION_SOURCE_COLUMN_UNKNOWN'
      })
    }
    if (Object.hasOwn(mapped, logicalName)) {
      throw Object.assign(new Error(`Duplicate PostgreSQL column mapping for ${logicalName}.`), {
        code: 'MIGRATION_SOURCE_COLUMN_DUPLICATE'
      })
    }
    mapped[logicalName] = value
  }
  return mapped
}

function prepareRowsForTarget (entity, rows) {
  return rows.map(row => {
    const copy = mapValues(row, value => value)

    if (entity === 'idts.cap.Users') {
      // BTP uses XSUAA. Password hashes and bearer sessions are deliberately
      // not moved into HANA.
      copy.passwordHash = null
    }

    if (
      entity === 'idts.cap.NotificationDeliveries' &&
      ['PENDING', 'FAILED'].includes(copy.status_code)
    ) {
      // Historical unsent mail must not be retried after cutover.
      copy.status_code = 'SKIPPED'
      copy.nextAttemptAt = null
      copy.lockToken = null
      copy.lockedUntil = null
      copy.lastErrorCode = 'MIGRATION_CUTOVER_SKIP'
      copy.lastErrorSummary = 'Historical unsent delivery was not retried after platform migration.'
    }

    if (
      entity === 'idts.cap.Notifications' &&
      ['PENDING', 'FAILED'].includes(copy.deliveryStatus_code)
    ) {
      copy.deliveryStatus_code = 'SKIPPED'
    }

    return copy
  })
}

function encodeRows (rows) {
  return rows.map(row => mapValues(row, value => {
    if (Buffer.isBuffer(value)) {
      return { __idtsType: 'Buffer', base64: value.toString('base64') }
    }
    return value
  }))
}

function decodeRows (rows) {
  return rows.map(row => mapValues(row, value => {
    if (
      value &&
      typeof value === 'object' &&
      value.__idtsType === 'Buffer' &&
      typeof value.base64 === 'string'
    ) {
      return Buffer.from(value.base64, 'base64')
    }
    return value
  }))
}

function mapValues (value, mapper) {
  const mapped = mapper(value)
  if (mapped !== value) return mapped
  if (Array.isArray(value)) return value.map(entry => mapValues(entry, mapper))
  if (!value || typeof value !== 'object' || value instanceof Date || Buffer.isBuffer(value)) {
    return value
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, mapValues(entry, mapper)])
  )
}

function sha256 (value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function stableJson (value) {
  return JSON.stringify(sortKeys(value), null, 2)
}

function sortKeys (value) {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (!value || typeof value !== 'object' || Buffer.isBuffer(value)) return value
  return Object.fromEntries(
    Object.keys(value).sort().map(key => [key, sortKeys(value[key])])
  )
}

function parseArgs (argv) {
  return Object.fromEntries(argv.slice(2).map(argument => {
    const [key, ...rest] = argument.replace(/^--/, '').split('=')
    return [key, rest.length ? rest.join('=') : true]
  }))
}

module.exports = {
  ENTITY_ORDER,
  OMITTED_ENTITIES,
  decodeRows,
  encodeRows,
  mapPostgresRowToCds,
  parseArgs,
  postgresTableName,
  prepareRowsForTarget,
  safeFileName,
  sha256,
  stableJson
}
