'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const cds = require('@sap/cds')
const { DELETE, INSERT, SELECT } = cds.ql
const { decodeRows } = require('../btp/lib/hana-migration')

const ACTIVE_DELETE_ORDER = Object.freeze([
  'idts.cap.AiSuggestions',
  'idts.cap.DuplicateLinks',
  'idts.cap.NotificationDeliveries',
  'idts.cap.Notifications',
  'idts.cap.HistoryLogs',
  'idts.cap.HistoryEvents',
  'idts.cap.Bugs.attachments',
  'idts.cap.Comments',
  'idts.cap.Bugs'
])

const INSERT_ORDER = Object.freeze([
  'idts.cap.Bugs',
  'idts.cap.Comments',
  'idts.cap.HistoryEvents',
  'idts.cap.HistoryLogs'
])

const EXPECTED_COUNTS = Object.freeze({
  'idts.cap.Bugs': 6,
  'idts.cap.Comments': 10,
  'idts.cap.HistoryEvents': 24,
  'idts.cap.HistoryLogs': 46
})

const OMITTED_ACTIVE_ENTITIES = Object.freeze([
  'idts.cap.AiSuggestions',
  'idts.cap.DuplicateLinks',
  'idts.cap.NotificationDeliveries',
  'idts.cap.Notifications',
  'idts.cap.Bugs.attachments'
])

const DRAFT_DELETE_ORDER = Object.freeze([
  'BUGSERVICE_AISUGGESTIONS_DRAFTS',
  'BUGSERVICE_NOTIFICATIONDELIVERIES_DRAFTS',
  'BUGSERVICE_NOTIFICATIONS_DRAFTS',
  'BUGSERVICE_HISTORYLOGS_DRAFTS',
  'BUGSERVICE_HISTORYEVENTS_DRAFTS',
  'BUGSERVICE_BUGS_ATTACHMENTS_DRAFTS',
  'BUGSERVICE_COMMENTS_DRAFTS',
  'BUGSERVICE_DUPLICATELINKS_DRAFTS',
  'BUGSERVICE_BUGS_DRAFTS',
  'DRAFT_DRAFTADMINISTRATIVEDATA'
])

const REFERENCE_SOURCES = Object.freeze({
  users: ['idts.cap.Users', 'ID', true],
  developerProfiles: ['idts.cap.DeveloperProfiles', 'ID', true],
  sapModules: ['idts.cap.SAPModules', 'ID', true],
  applicationComponents: ['idts.cap.ApplicationComponents', 'ID', true],
  defectCategories: ['idts.cap.DefectCategories', 'ID', true],
  componentCategories: ['idts.cap.ComponentCategories', 'ID', true],
  statusCodes: ['idts.cap.StatusValues', 'code', false],
  priorityCodes: ['idts.cap.PriorityValues', 'code', false],
  severityCodes: ['idts.cap.SeverityValues', 'code', false],
  environmentCodes: ['idts.cap.EnvironmentValues', 'code', false],
  processorRoleCodes: ['idts.cap.ProcessorRoleValues', 'code', false],
  actionTypeCodes: ['idts.cap.ActionTypes', 'code', false],
  userRoleCodes: ['idts.cap.UserRoles', 'code', false]
})

function validatePackage (data) {
  if (data?.schemaVersion !== 2) throw coded('CLEAN_BASELINE_SCHEMA_INVALID', 'Unsupported clean baseline schema.')
  if (data?.policy?.preserveCurrentUsers !== true) throw coded('CLEAN_BASELINE_POLICY_INVALID', 'Current user preservation policy is required.')
  if (data?.policy?.preserveCurrentDeveloperProfiles !== true || data?.policy?.preserveCurrentCodeLists !== true) {
    throw coded('CLEAN_BASELINE_POLICY_INVALID', 'Developer profile and code-list preservation policies are required.')
  }
  if (data?.policy?.clearCurrentBugDrafts !== true) throw coded('CLEAN_BASELINE_POLICY_INVALID', 'Bug draft cleanup policy is required.')
  if (data?.source?.defaultUserCount !== 4 || data.source.defaultUsers?.length !== 4) {
    throw coded('CLEAN_BASELINE_USERS_INVALID', 'Four default user fingerprints are required.')
  }
  const defaultHashes = data.source.defaultUsers.map(user => user.idHash)
  const roleCounts = data.source.defaultUsers.reduce((counts, user) => {
    counts[user.roleCode] = (counts[user.roleCode] || 0) + 1
    return counts
  }, {})
  if (new Set(defaultHashes).size !== 4 || defaultHashes.some(hash => !/^[a-f0-9]{64}$/i.test(hash)) ||
    roleCounts.PM !== 1 || roleCounts.TESTER !== 1 || roleCounts.DEVELOPER !== 2) {
    throw coded('CLEAN_BASELINE_USERS_INVALID', 'Default user fingerprints or roles are invalid.')
  }
  if (data.policy.expectedPreservedCounts?.users !== 14 || data.policy.expectedPreservedCounts?.developerProfiles !== 12) {
    throw coded('CLEAN_BASELINE_PRESERVATION_INVALID', 'Expected HANA preservation counts must be Users=14 and DeveloperProfiles=12.')
  }
  const body = { ...data }
  delete body.packageSha256
  if (sha256(stableJson(body)) !== data.packageSha256) throw coded('CLEAN_BASELINE_CHECKSUM_MISMATCH', 'Package checksum mismatch.')
  const entries = data.entities || []
  const inventory = new Map(entries.map(entry => [entry.entity, entry]))
  if (inventory.size !== entries.length || entries.length !== INSERT_ORDER.length || entries.some(entry => !INSERT_ORDER.includes(entry.entity))) {
    throw coded('CLEAN_BASELINE_INVENTORY_INVALID', 'Package entity inventory contains a duplicate, missing, or unexpected entity.')
  }
  for (const entity of INSERT_ORDER) {
    if (!inventory.has(entity)) throw coded('CLEAN_BASELINE_ENTITY_MISSING', `Missing package entity: ${entity}`)
    if (inventory.get(entity).count !== inventory.get(entity).rows?.length) {
      throw coded('CLEAN_BASELINE_COUNT_MISMATCH', `Package count mismatch: ${entity}`)
    }
  }
  for (const [entity, expected] of Object.entries(EXPECTED_COUNTS)) {
    if (inventory.get(entity).count !== expected) throw coded('CLEAN_BASELINE_ENTITY_COUNT_INVALID', `${entity} must contain exactly ${expected} rows.`)
  }
  return inventory
}

async function validateReferences (db, data) {
  const results = {}
  for (const [name, [entity, column, hashed]] of Object.entries(REFERENCE_SOURCES)) {
    const expected = data.referenceSets?.[name] || []
    const rows = expected.length ? await db.run(SELECT.from(entity).columns(column)) : []
    const actual = new Set(rows.map(row => {
      const value = rowValue(row, column)
      return hashed ? hashId(value) : String(value)
    }))
    const missing = expected.filter(value => !actual.has(String(value)))
    results[name] = { expected: expected.length, missing: missing.length }
    if (missing.length) throw coded('CLEAN_BASELINE_REFERENCE_MISSING', `${name} has ${missing.length} missing references.`)
  }
  const users = await db.run(SELECT.from('idts.cap.Users').columns('ID', 'active', 'role_code'))
  const activeUsers = new Map(users
    .filter(row => [true, 1, '1'].includes(rowValue(row, 'active')))
    .map(row => [hashId(rowValue(row, 'ID')), String(rowValue(row, 'role_code'))]))
  const missingDefaultUsers = data.source.defaultUsers.filter(user => activeUsers.get(user.idHash) !== user.roleCode)
  if (missingDefaultUsers.length) throw coded('CLEAN_BASELINE_DEFAULT_USER_MISSING', 'One or more default users are missing or inactive in HANA.')
  results.defaultUsers = { expected: 4, missing: 0 }
  results.currentUsersPreserved = users.length
  return results
}

async function runReset ({ db, data, execute, rehearse = false }) {
  const inventory = validatePackage(data)
  if (!execute) {
    const references = await validateReferences(db, data)
    const before = await safeCounts(db)
    assertPreservedCounts(before, data)
    const drafts = await safeDraftCounts(db)
    return { mode: 'dry-run', before, drafts, references, planned: packageCounts(inventory) }
  }

  let before
  let beforeDrafts
  let references
  let phase = 'transaction-start'
  try {
    await db.tx(async tx => {
      phase = 'validate-references'
      references = await validateReferences(tx, data)
      phase = 'capture-preserved-counts'
      before = await safeCounts(tx)
      assertPreservedCounts(before, data)
      phase = 'capture-draft-counts'
      beforeDrafts = await safeDraftCounts(tx)
      for (const entity of ACTIVE_DELETE_ORDER) {
        phase = `delete-active:${entity}`
        await tx.run(DELETE.from(entity))
      }
      phase = 'delete-outbox'
      await tx.run(DELETE.from('cds.outbox.Messages'))
      for (const table of DRAFT_DELETE_ORDER) {
        phase = `delete-draft:${table}`
        await tx.run(`DELETE FROM "${table}"`)
      }
      for (const entity of INSERT_ORDER) {
        phase = `insert:${entity}`
        const rows = decodeRows(inventory.get(entity).rows)
        if (rows.length) await tx.run(INSERT.into(entity).entries(rows))
      }
      phase = 'postcheck-active-counts'
      const inside = await safeCounts(tx)
      const expected = packageCounts(inventory)
      for (const [entity, count] of Object.entries(expected)) {
        if (inside[entity] !== count) throw coded('CLEAN_BASELINE_POSTCHECK_FAILED', `${entity} expected ${count}, got ${inside[entity]}.`)
      }
      for (const entity of OMITTED_ACTIVE_ENTITIES) {
        if (inside[entity] !== 0) throw coded('CLEAN_BASELINE_OMITTED_DATA_PRESENT', `${entity} must be empty after reset.`)
      }
      if (inside['cds.outbox.Messages'] !== 0) throw coded('CLEAN_BASELINE_OUTBOX_PRESENT', 'CAP outbox must be empty after reset.')
      assertPreservedCounts(inside, data)
      phase = 'postcheck-draft-counts'
      const draftCounts = await safeDraftCounts(tx)
      if (Object.values(draftCounts).some(count => count !== 0)) throw coded('CLEAN_BASELINE_DRAFT_DATA_PRESENT', 'All BugService draft artifacts must be empty after reset.')
      if (rehearse) throw coded('CLEAN_BASELINE_REHEARSAL_ROLLBACK', 'Intentional rehearsal rollback.')
    })
  } catch (error) {
    if (rehearse && error.code === 'CLEAN_BASELINE_REHEARSAL_ROLLBACK') {
      const afterRollback = await safeCounts(db)
      const draftsAfterRollback = await safeDraftCounts(db)
      if (JSON.stringify(afterRollback) !== JSON.stringify(before) || JSON.stringify(draftsAfterRollback) !== JSON.stringify(beforeDrafts)) {
        throw coded('CLEAN_BASELINE_REHEARSAL_ROLLBACK_FAILED', 'Rehearsal rollback did not restore the pre-state.')
      }
      return { mode: 'rehearsal-rollback', before, afterRollback, references }
    }
    error.phase = phase
    error.safeDiagnostic = classifyDatabaseError(error)
    throw error
  }

  return { mode: 'execute', before, after: await safeCounts(db), references }
}

async function safeCounts (db) {
  const entities = [...new Set([...ACTIVE_DELETE_ORDER, ...INSERT_ORDER, 'idts.cap.Users', 'idts.cap.DeveloperProfiles', 'cds.outbox.Messages'])]
  const counts = {}
  for (const entity of entities) {
    const row = await db.run(SELECT.one.from(entity).columns('count(*) as count'))
    counts[entity] = Number(rowValue(row, 'count'))
  }
  return counts
}

async function safeDraftCounts (db) {
  const counts = {}
  for (const table of DRAFT_DELETE_ORDER) {
    const rows = await db.run(`SELECT COUNT(*) AS "count" FROM "${table.replaceAll('"', '""')}"`)
    counts[table] = Number(rowValue(rows[0] || {}, 'count'))
  }
  return counts
}

function assertPreservedCounts (counts, data) {
  const expected = data.policy.expectedPreservedCounts
  if (counts['idts.cap.Users'] !== expected.users || counts['idts.cap.DeveloperProfiles'] !== expected.developerProfiles) {
    throw coded('CLEAN_BASELINE_PRESERVATION_MISMATCH', 'Current Users or DeveloperProfiles do not match the approved preservation baseline.')
  }
}

function packageCounts (inventory) {
  return Object.fromEntries(INSERT_ORDER.map(entity => [entity, inventory.get(entity).count]))
}

function hashId (value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex')
}

function rowValue (row, column) {
  if (Object.hasOwn(row, column)) return row[column]
  const match = Object.keys(row).find(key => key.toLowerCase() === column.toLowerCase())
  return match === undefined ? undefined : row[match]
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
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortKeys(value[key])]))
}

function coded (code, message) {
  return Object.assign(new Error(message), { code })
}

function classifyDatabaseError (error) {
  const message = String(error?.message || '')
  const patterns = [
    ['NULL_CONSTRAINT', /cannot insert null|not null constraint/i],
    ['UNIQUE_CONSTRAINT', /unique constraint|duplicate key/i],
    ['FOREIGN_KEY_CONSTRAINT', /foreign key|referential constraint/i],
    ['COLUMN_CONTRACT', /invalid column|column not found|unknown column/i],
    ['VALUE_TOO_LARGE', /value too large|string data right truncation/i],
    ['TYPE_CONVERSION', /inconsistent datatype|cannot convert|invalid number|invalid date/i]
  ]
  return patterns.find(([, pattern]) => pattern.test(message))?.[0] || 'UNCLASSIFIED_DATABASE_ERROR'
}

async function main () {
  const input = process.argv.find(argument => argument.startsWith('--input='))?.slice('--input='.length)
  const execute = process.argv.includes('--execute')
  const rehearse = process.argv.includes('--rehearse')
  if (!input || !fs.existsSync(input)) throw coded('CLEAN_BASELINE_INPUT_MISSING', 'Clean baseline package is missing.')
  const data = JSON.parse(fs.readFileSync(input, 'utf8'))
  const db = await cds.connect.to('db')
  if (cds.env.requires.db?.kind !== 'hana') throw coded('CLEAN_BASELINE_TARGET_INVALID', 'Target database must be SAP HANA.')
  const result = await runReset({ db, data, execute: execute || rehearse, rehearse })
  console.log(JSON.stringify(result, null, 2))
  if (execute && !rehearse) console.log('IDTS-122-CLEAN-BASELINE-COMPLETE')
}

if (require.main === module) {
  main().catch(error => {
    console.error(JSON.stringify({
      code: error.code || 'CLEAN_BASELINE_RESET_FAILED',
      phase: error.phase || undefined,
      diagnostic: error.safeDiagnostic || undefined,
      message: 'HANA clean baseline operation failed without printing credentials or row contents.'
    }))
    process.exitCode = 1
  }).finally(() => cds.shutdown())
}

module.exports = {
  ACTIVE_DELETE_ORDER,
  DRAFT_DELETE_ORDER,
  EXPECTED_COUNTS,
  INSERT_ORDER,
  OMITTED_ACTIVE_ENTITIES,
  runReset,
  validatePackage,
  validateReferences,
  classifyDatabaseError
}
