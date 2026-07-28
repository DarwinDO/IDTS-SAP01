'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const cds = require('@sap/cds')

const {
  ENTITY_ORDER,
  OMITTED_ENTITIES,
  encodeRows,
  mapPostgresRowToCds,
  parseArgs,
  postgresTableName,
  prepareRowsForTarget,
  safeFileName,
  sha256,
  stableJson
} = require('./lib/hana-migration')

let exportStage = 'startup'
let currentEntity = null

function renderPsqlJson (postgresID, sql) {
  const result = spawnSync(
    'render',
    ['psql', postgresID, '-c', sql, '-o', 'json', '--', '-t', '-A', '-q'],
    {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      windowsHide: true
    }
  )
  if (result.status !== 0) {
    throw Object.assign(new Error('Render PostgreSQL query failed.'), {
      code: 'RENDER_PSQL_QUERY_FAILED'
    })
  }
  const wrapper = JSON.parse(result.stdout)
  return JSON.parse(String(wrapper.output || '[]').trim() || '[]')
}

function readRowsWithRenderCli (postgresID, entity, definition) {
  const table = postgresTableName(entity)
  const byteaColumns = renderPsqlJson(
    postgresID,
    `SELECT COALESCE(json_agg(column_name)::text, '[]') FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}' AND data_type = 'bytea'`
  )
  const rows = renderPsqlJson(
    postgresID,
    `SELECT COALESCE(json_agg(source_row)::text, '[]') FROM (SELECT * FROM "${table}") AS source_row`
  )
  return rows.map(row => {
    for (const column of byteaColumns) {
      const value = row[column]
      if (typeof value === 'string' && value.startsWith('\\x')) {
        row[column] = Buffer.from(value.slice(2), 'hex')
      }
    }
    return mapPostgresRowToCds(definition, row)
  })
}

async function main () {
  const args = parseArgs(process.argv)
  const renderPostgresID = args['render-postgres-id']
  if (typeof renderPostgresID !== 'string' || !/^dpg-[a-z0-9-]+$/i.test(renderPostgresID)) {
    throw Object.assign(new Error('A Render PostgreSQL instance ID is required.'), {
      code: 'RENDER_POSTGRES_ID_REQUIRED'
    })
  }
  const output = path.resolve(String(args.output || `.tmp/idts-113-migration/${Date.now()}`))
  fs.mkdirSync(output, { recursive: true })

  exportStage = 'load-model'
  const model = cds.linked(await cds.load('*'))
  const entities = []

  for (const entity of ENTITY_ORDER) {
    exportStage = 'read-entity'
    currentEntity = entity
    const sourceRows = readRowsWithRenderCli(renderPostgresID, entity, model.definitions[entity])
    const rows = encodeRows(prepareRowsForTarget(entity, sourceRows))
    const file = safeFileName(entity)
    const content = stableJson(rows)
    fs.writeFileSync(path.join(output, file), content, 'utf8')
    entities.push({ entity, file, count: rows.length, sha256: sha256(content) })
  }

  const manifest = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    sourceKind: 'postgres-render-cli',
    policy: {
      preserveIds: true,
      omittedEntities: OMITTED_ENTITIES,
      clearUserPasswordHash: true,
      historicalUnsentDelivery: 'SKIPPED'
    },
    entities
  }
  const manifestContent = stableJson(manifest)
  exportStage = 'write-manifest'
  fs.writeFileSync(path.join(output, 'manifest.json'), manifestContent, 'utf8')

  console.log(JSON.stringify({
    mode: 'export',
    output,
    entityCount: entities.length,
    rowCount: entities.reduce((sum, entry) => sum + entry.count, 0),
    manifestSha256: sha256(manifestContent)
  }, null, 2))
}

main()
  .catch(error => {
    console.error(JSON.stringify({
      code: error?.code || 'BTP_MIGRATION_EXPORT_FAILED',
      stage: exportStage,
      entity: currentEntity,
      cause: String(error?.name || 'Error').slice(0, 80),
      message: 'Shared QA export failed. Private connection details were not printed.'
    }))
    process.exitCode = 1
  })
