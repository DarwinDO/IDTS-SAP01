'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')
const { Client } = require('pg')

const {
  encodeRows,
  mapPostgresRowToCds,
  parseArgs,
  postgresTableName,
  sha256,
  stableJson
} = require('../btp/lib/hana-migration')

const RESTORED_ENTITIES = Object.freeze([
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

async function buildPackage ({ sourceUrl, sourceBackup, approvedBackupSha256, model }) {
  const backupSha256 = sha256(fs.readFileSync(sourceBackup))
  if (!/^[a-f0-9]{64}$/i.test(approvedBackupSha256 || '') || backupSha256 !== approvedBackupSha256.toLowerCase()) {
    throw coded('BASELINE_BACKUP_CHECKSUM_MISMATCH', 'Source backup does not match the approved SHA-256.')
  }
  const sourceHost = new URL(sourceUrl).hostname.toLowerCase()
  if (!['localhost', '127.0.0.1', '::1'].includes(sourceHost)) {
    throw coded('BASELINE_SOURCE_NOT_LOCAL', 'The disposable restore source must be local-only.')
  }
  const client = new Client({ connectionString: sourceUrl, ssl: false })
  await client.connect()
  try {
    const users = (await readPhysicalRows(client, 'idts.cap.Users'))
      .map(row => mapPostgresRowToCds(model.definitions['idts.cap.Users'], row))
    assertDefaultUsers(users)
    const sourceTesterIds = new Set(
      users.filter(row => row.role_code === 'TESTER' && row.active === true).map(row => row.ID)
    )

    const entities = []
    for (const entity of RESTORED_ENTITIES) {
      const definition = model.definitions[entity]
      if (!definition) throw coded('BASELINE_MODEL_ENTITY_MISSING', `Model entity is missing: ${entity}`)
      const physicalRows = await readPhysicalRows(client, entity)
      const rows = physicalRows.map(row => normalizeTemporalValues(definition, mapPostgresRowToCds(definition, row)))
      if (entity === 'idts.cap.Bugs') {
        for (const row of rows) {
          row.retestOwner_ID = sourceTesterIds.has(row.reporter_ID) ? row.reporter_ID : null
        }
      }
      if (rows.length !== EXPECTED_COUNTS[entity]) {
        throw coded('BASELINE_COUNT_MISMATCH', `${entity} expected ${EXPECTED_COUNTS[entity]} rows but found ${rows.length}.`)
      }
      entities.push({ entity, rows: encodeRows(rows) })
    }

    validatePackageClosure(entities)
    const referenceSets = collectReferenceSets(entities)
    const packageBody = {
      schemaVersion: 2,
      policy: {
        preserveCurrentUsers: true,
        preserveCurrentDeveloperProfiles: true,
        preserveCurrentCodeLists: true,
        clearCurrentBugDrafts: true,
        expectedPreservedCounts: { users: 14, developerProfiles: 12 },
        transformations: [{
          entity: 'idts.cap.Bugs',
          field: 'retestOwner_ID',
          rule: 'Set to reporter_ID only when the source reporter is the active Tester; otherwise null.',
          reason: 'Seed the approved retest-owner business rule for the clean six-Bug baseline.'
        }],
        omittedHistoricalData: [
          'idts.cap.Bugs.attachments',
          'idts.cap.Notifications',
          'idts.cap.NotificationDeliveries',
          'idts.cap.DuplicateLinks',
          'idts.cap.AiSuggestions'
        ],
        omissionReason: 'Avoid stale delivery/AI audit and attachment metadata without verified S3 binary provenance.'
      },
      source: {
        backupSha256,
        defaultUserCount: 4,
        defaultUsers: users.map(row => ({ idHash: hashId(row.ID), roleCode: row.role_code }))
          .sort((left, right) => left.idHash.localeCompare(right.idHash))
      },
      referenceSets,
      entities: entities.map(entry => ({
        entity: entry.entity,
        count: entry.rows.length,
        rows: entry.rows
      }))
    }
    const content = stableJson(packageBody)
    return { ...packageBody, packageSha256: sha256(content) }
  } finally {
    await client.end()
  }
}

async function readPhysicalRows (client, entity) {
  const table = postgresTableName(entity)
  const exists = await client.query(
    'SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2',
    ['public', table]
  )
  if (exists.rows[0].count !== 1) throw coded('BASELINE_SOURCE_TABLE_MISSING', `Source table is missing: ${table}`)
  const result = await client.query(`SELECT * FROM "${table.replaceAll('"', '""')}" ORDER BY 1`)
  return result.rows
}

function assertDefaultUsers (users) {
  const roleCounts = users.reduce((counts, user) => {
    if (user.active === true) counts[user.role_code] = (counts[user.role_code] || 0) + 1
    return counts
  }, {})
  const valid = users.length === 4 &&
    new Set(users.map(user => user.ID)).size === 4 &&
    users.every(user => typeof user.ID === 'string' && user.ID.length > 0) &&
    roleCounts.PM === 1 && roleCounts.TESTER === 1 && roleCounts.DEVELOPER === 2
  if (!valid) throw coded('BASELINE_DEFAULT_USERS_INVALID', 'Backup must contain four active default users: one PM, one Tester, and two Developers.')
}

function normalizeTemporalValues (definition, row) {
  const normalized = { ...row }
  for (const [field, value] of Object.entries(normalized)) {
    if (!(value instanceof Date)) continue
    const element = definition.elements?.[field]
    normalized[field] = element?.type === 'cds.Date'
      ? value.toISOString().slice(0, 10)
      : value.toISOString()
  }
  return normalized
}

function validatePackageClosure (entities) {
  const byEntity = Object.fromEntries(entities.map(entry => [entry.entity, entry.rows]))
  const bugs = new Set(byEntity['idts.cap.Bugs'].map(row => required(row, 'ID', 'Bug')))
  const events = new Set(byEntity['idts.cap.HistoryEvents'].map(row => required(row, 'ID', 'HistoryEvent')))
  for (const row of byEntity['idts.cap.Comments']) requireReference(bugs, required(row, 'bug_ID', 'Comment.bug_ID'), 'Comment.bug_ID')
  for (const row of byEntity['idts.cap.HistoryEvents']) requireReference(bugs, required(row, 'bug_ID', 'HistoryEvent.bug_ID'), 'HistoryEvent.bug_ID')
  for (const row of byEntity['idts.cap.HistoryLogs']) {
    requireReference(bugs, required(row, 'bug_ID', 'HistoryLog.bug_ID'), 'HistoryLog.bug_ID')
    requireReference(events, required(row, 'event_ID', 'HistoryLog.event_ID'), 'HistoryLog.event_ID')
  }
}

function required (row, field, label) {
  const value = row[field]
  if (value === undefined || value === null || value === '') throw coded('BASELINE_REQUIRED_REFERENCE_MISSING', `${label} is required.`)
  return value
}

function requireReference (set, value, label) {
  if (!set.has(value)) throw coded('BASELINE_REFERENCE_CLOSURE_INVALID', `${label} does not resolve inside the package.`)
}

function collectReferenceSets (entities) {
  const byEntity = Object.fromEntries(entities.map(entry => [entry.entity, entry.rows]))
  const bugs = byEntity['idts.cap.Bugs']
  const comments = byEntity['idts.cap.Comments']
  const events = byEntity['idts.cap.HistoryEvents']
  const logs = byEntity['idts.cap.HistoryLogs']
  return {
    users: uniqueHashes([
      ...bugs.flatMap(row => [row.reporter_ID, row.retestOwner_ID, row.nextProcessorUser_ID]),
      ...comments.map(row => row.author_ID),
      ...events.map(row => row.actor_ID),
      ...logs.map(row => row.actor_ID)
    ]),
    developerProfiles: uniqueHashes(bugs.map(row => row.assignee_ID)),
    sapModules: uniqueHashes(bugs.map(row => row.sapModule_ID)),
    applicationComponents: uniqueHashes(bugs.map(row => row.applicationComponent_ID)),
    defectCategories: uniqueHashes(bugs.map(row => row.defectCategory_ID)),
    componentCategories: uniqueHashes(bugs.map(row => row.componentCategory_ID)),
    statusCodes: uniqueValues(bugs.map(row => row.status_code)),
    priorityCodes: uniqueValues(bugs.map(row => row.priority_code)),
    severityCodes: uniqueValues(bugs.map(row => row.severity_code)),
    environmentCodes: uniqueValues(bugs.map(row => row.environment_code)),
    processorRoleCodes: uniqueValues(bugs.map(row => row.nextProcessorRole_code)),
    actionTypeCodes: uniqueValues([...events, ...logs].map(row => row.actionType_code)),
    userRoleCodes: uniqueValues([...comments, ...events, ...logs].map(row => row.actorRole_code || row.authorRole_code))
  }
}

function uniqueHashes (values) {
  return uniqueValues(values).map(hashId).sort()
}

function uniqueValues (values) {
  return [...new Set(values.filter(value => value !== undefined && value !== null && value !== ''))].sort()
}

function hashId (value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex')
}

function coded (code, message) {
  return Object.assign(new Error(message), { code })
}

async function main () {
  const args = parseArgs(process.argv)
  const sourceUrlFile = path.resolve(String(args['source-url-file'] || ''))
  const sourceBackup = path.resolve(String(args['source-backup'] || ''))
  const approvedBackupSha256 = String(args['approved-backup-sha256'] || '').toLowerCase()
  const output = path.resolve(String(args.output || ''))
  if (!sourceUrlFile || !fs.existsSync(sourceUrlFile)) throw coded('BASELINE_SOURCE_URL_FILE_MISSING', 'Private source URL file is missing.')
  if (!sourceBackup || !fs.existsSync(sourceBackup)) throw coded('BASELINE_SOURCE_BACKUP_MISSING', 'Source backup is missing.')
  if (!output) throw coded('BASELINE_OUTPUT_REQUIRED', 'Output path is required.')
  const sourceUrl = fs.readFileSync(sourceUrlFile, 'utf8').trim()
  const model = cds.linked(await cds.load('*'))
  const data = await buildPackage({ sourceUrl, sourceBackup, approvedBackupSha256, model })
  fs.mkdirSync(path.dirname(output), { recursive: true })
  fs.writeFileSync(output, stableJson(data), { encoding: 'utf8', mode: 0o600 })
  console.log(JSON.stringify({
    mode: 'build-clean-baseline',
    output,
    usersVerified: data.source.defaultUserCount,
    counts: Object.fromEntries(data.entities.map(entry => [entry.entity, entry.count])),
    packageSha256: data.packageSha256,
    omittedHistoricalData: data.policy.omittedHistoricalData
  }, null, 2))
}

if (require.main === module) {
  main().catch(error => {
    console.error(JSON.stringify({
      code: error.code || 'BASELINE_BUILD_FAILED',
      message: 'Clean baseline package build failed. Credentials and row contents were not printed.'
    }))
    process.exitCode = 1
  }).finally(() => cds.shutdown())
}

module.exports = {
  EXPECTED_COUNTS,
  RESTORED_ENTITIES,
  assertDefaultUsers,
  collectReferenceSets,
  normalizeTemporalValues,
  validatePackageClosure
}
