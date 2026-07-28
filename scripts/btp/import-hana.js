'use strict'

const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')
const { DELETE, SELECT, UPSERT } = cds.ql

const {
  ENTITY_ORDER,
  decodeRows,
  entityKeyColumns,
  parseArgs,
  sha256
} = require('./lib/hana-migration')

const BATCH_SIZE = 100

async function main () {
  const args = parseArgs(process.argv)
  const input = path.resolve(String(args.input || ''))
  const execute = args.execute === true
  if (!input || !fs.existsSync(path.join(input, 'manifest.json'))) {
    throw Object.assign(new Error('Migration package is missing.'), { code: 'MIGRATION_PACKAGE_MISSING' })
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(input, 'manifest.json'), 'utf8'))
  validateManifest(input, manifest)

  if (!execute) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      input,
      targetKind: cds.env.requires.db?.kind || 'unknown',
      entityCount: manifest.entities.length,
      rowCount: manifest.entities.reduce((sum, entry) => sum + entry.count, 0)
    }, null, 2))
    return
  }

  const model = cds.linked(await cds.load('*'))
  const db = await cds.connect.to('db')
  if (cds.env.requires.db?.kind !== 'hana') {
    throw Object.assign(new Error('Target must use the SAP HANA production profile.'), {
      code: 'MIGRATION_TARGET_KIND_INVALID'
    })
  }
  const verification = []
  await db.tx(async tx => {
    // The HDI deployer loads reference seed rows. Replace them in reverse
    // dependency order so Render UUIDs and relationships remain authoritative.
    for (const entity of [...ENTITY_ORDER].reverse()) {
      await tx.run(DELETE.from(entity))
    }

    for (const entity of ENTITY_ORDER) {
      const entry = manifest.entities.find(candidate => candidate.entity === entity)
      const rows = decodeRows(JSON.parse(fs.readFileSync(path.join(input, entry.file), 'utf8')))
      for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
        await tx.run(UPSERT.into(entity).entries(rows.slice(offset, offset + BATCH_SIZE)))
      }
      const definition = model.definitions[entity]
      const keyColumns = entityKeyColumns(definition)
      if (!keyColumns.length) {
        throw Object.assign(new Error(`No key definition found for ${entity}.`), {
          code: 'MIGRATION_TARGET_KEY_MISSING'
        })
      }
      const sourceKeys = rows.map(row => rowKey(row, keyColumns))
      const targetRows = await tx.run(SELECT.from(entity).columns(...keyColumns))
      const targetKeys = new Set(targetRows.map(row => rowKey(row, keyColumns)))
      const missingKeys = sourceKeys.filter(key => !targetKeys.has(key))
      if (targetRows.length !== rows.length || missingKeys.length) {
        throw Object.assign(new Error(`Target verification failed for ${entity}.`), {
          code: 'MIGRATION_TARGET_KEY_MISMATCH'
        })
      }
      verification.push({ entity, imported: rows.length, verifiedKeys: sourceKeys.length })
    }
  })

  console.log(JSON.stringify({
    mode: 'execute',
    targetKind: cds.env.requires.db?.kind || 'unknown',
    verification
  }, null, 2))
}

function rowKey (row, keyColumns) {
  const values = keyColumns.map(column => row[column])
  if (values.some(value => value === undefined || value === null)) {
    throw Object.assign(new Error('Migration row is missing a required key.'), {
      code: 'MIGRATION_SOURCE_KEY_MISSING'
    })
  }
  return JSON.stringify(values)
}

function validateManifest (input, manifest) {
  if (manifest.schemaVersion !== 1) {
    throw Object.assign(new Error('Unsupported migration package schema.'), { code: 'MIGRATION_SCHEMA_UNSUPPORTED' })
  }
  if (manifest.policy?.omittedEntities?.includes('idts.cap.AuthSessions') !== true) {
    throw Object.assign(new Error('AuthSessions omission policy is missing.'), { code: 'MIGRATION_POLICY_INVALID' })
  }
  if (manifest.entities.length !== ENTITY_ORDER.length) {
    throw Object.assign(new Error('Migration entity inventory is incomplete.'), { code: 'MIGRATION_ENTITY_INVENTORY_INVALID' })
  }
  for (const entity of ENTITY_ORDER) {
    const entry = manifest.entities.find(candidate => candidate.entity === entity)
    if (!entry) throw Object.assign(new Error(`Missing ${entity}.`), { code: 'MIGRATION_ENTITY_MISSING' })
    const content = fs.readFileSync(path.join(input, entry.file), 'utf8')
    if (sha256(content) !== entry.sha256) {
      throw Object.assign(new Error(`Checksum mismatch for ${entity}.`), { code: 'MIGRATION_CHECKSUM_MISMATCH' })
    }
    if (JSON.parse(content).length !== entry.count) {
      throw Object.assign(new Error(`Row count mismatch for ${entity}.`), { code: 'MIGRATION_COUNT_MISMATCH' })
    }
  }
}

main()
  .catch(error => {
    console.error(JSON.stringify({
      code: error?.code || 'BTP_MIGRATION_IMPORT_FAILED',
      message: 'HANA import failed. Private connection details were not printed.'
    }))
    process.exitCode = 1
  })
  .finally(() => cds.shutdown())
