#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { createHdiDatabase } = require('./run-user-admin-logical-backup')
const {
  CATALOGS,
  canonicalizeCatalogDocument,
  encryptCatalogBackup
} = require('./gate5-business-catalog-backup-contract')

const PUBLIC_KEY_PATH = path.join(__dirname, 'gate5-business-catalog-backup-public.pem')

function quoteIdentifier (value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function selectList (catalog, temporary = false) {
  return catalog.columns.map(([logical, physical]) =>
    `${quoteIdentifier(temporary ? logical : physical)} AS ${quoteIdentifier(logical)}`
  ).join(', ')
}

async function readCatalogs (db, temporary = false) {
  const result = {}
  for (const catalog of CATALOGS) {
    const table = temporary ? catalog.tempTable : catalog.table
    result[catalog.key] = await db.run(`SELECT ${selectList(catalog, temporary)} FROM ${quoteIdentifier(table)} ORDER BY "${temporary ? 'ID' : 'ID'}"`)
  }
  return result
}

async function runCatalogBackupRehearsal ({ db, publicKey, emit = console.log }) {
  let safeStage = 'SOURCE_READ'
  try {
    const sourceRows = await readCatalogs(db)
    const source = canonicalizeCatalogDocument(sourceRows)

    for (const catalog of CATALOGS) {
      safeStage = `TEMP_CREATE_${catalog.key}`
      await db.run(`CREATE LOCAL TEMPORARY COLUMN TABLE ${quoteIdentifier(catalog.tempTable)} (${catalog.tempColumns})`)
      const logical = catalog.columns.map(([name]) => name)
      const insert = `INSERT INTO ${quoteIdentifier(catalog.tempTable)} (${logical.map(quoteIdentifier).join(', ')}) VALUES (${logical.map(() => '?').join(', ')})`
      safeStage = `TEMP_INSERT_${catalog.key}`
      for (const row of sourceRows[catalog.key]) await db.run(insert, logical.map(column => row[column]))
    }

    safeStage = 'TEMP_READBACK'
    let restored
    try {
      restored = canonicalizeCatalogDocument(await readCatalogs(db, true))
    } catch {
      throw new Error('The session-local catalog restore rehearsal mismatch was detected.')
    }
    if (source.sha256 !== restored.sha256 || source.totalRowCount !== restored.totalRowCount) {
      throw new Error('The session-local catalog restore rehearsal mismatch was detected.')
    }

    safeStage = 'ENCRYPT'
    const envelope = encryptCatalogBackup(sourceRows, publicKey)
    const meta = {
      totalRowCount: source.totalRowCount,
      counts: source.counts,
      digestPrefix: source.sha256.slice(0, 12),
      digestPrefixes: source.digestPrefixes
    }
    emit(`IDTS_GATE5_BACKUP_META=${Buffer.from(JSON.stringify(meta), 'utf8').toString('base64')}`)
    emit(`IDTS_GATE5_BACKUP_ENVELOPE=${Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64')}`)
    return { ...meta, envelope }
  } catch (error) {
    if (!error.safeStage) error.safeStage = safeStage
    throw error
  }
}

async function main () {
  let db
  let safeStage = 'CONNECT'
  try {
    db = await createHdiDatabase()
    safeStage = 'KEY_READ'
    const publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8')
    safeStage = 'REHEARSAL'
    await runCatalogBackupRehearsal({ db, publicKey })
  } catch (error) {
    console.error(`IDTS_GATE5_BACKUP_RESULT=FAIL;CODE=${error?.safeStage || safeStage}`)
    process.exitCode = 1
  } finally {
    if (db) await db.disconnect()
  }
}

if (require.main === module) main()

module.exports = { readCatalogs, runCatalogBackupRehearsal }
