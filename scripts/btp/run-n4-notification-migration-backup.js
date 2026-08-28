#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { createHdiDatabase } = require('./run-user-admin-logical-backup')
const {
  DATASETS,
  canonicalizeNotificationBackup,
  encryptNotificationBackup
} = require('./n4-notification-migration-backup-contract')

const PUBLIC_KEY_PATH = path.join(__dirname, 'n4-notification-migration-backup-public.pem')

function quoteIdentifier (value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function selectList (dataset, temporary = false) {
  return dataset.columns.map(([logical, physical]) =>
    `${quoteIdentifier(temporary ? logical : physical)} AS ${quoteIdentifier(logical)}`
  ).join(', ')
}

async function readDatasets (db, temporary = false) {
  const result = {}
  for (const dataset of DATASETS) {
    const table = temporary ? dataset.tempTable : dataset.table
    const orderBy = temporary ? dataset.orderBy : dataset.columns.find(([logical]) => logical === dataset.orderBy)[1]
    result[dataset.key] = await db.run(
      `SELECT ${selectList(dataset, temporary)} FROM ${quoteIdentifier(table)} ORDER BY ${quoteIdentifier(orderBy)}`
    )
  }
  return result
}

async function runNotificationBackupRehearsal ({ db, publicKey, emit = console.log }) {
  let safeStage = 'SOURCE_READ'
  try {
    const sourceRows = await readDatasets(db)
    const source = canonicalizeNotificationBackup(sourceRows)

    for (const dataset of DATASETS) {
      safeStage = `TEMP_CREATE_${dataset.key}`
      await db.run(`CREATE LOCAL TEMPORARY COLUMN TABLE ${quoteIdentifier(dataset.tempTable)} (${dataset.tempColumns})`)
      const logical = dataset.columns.map(([name]) => name)
      const insert = `INSERT INTO ${quoteIdentifier(dataset.tempTable)} (${logical.map(quoteIdentifier).join(', ')}) VALUES (${logical.map(() => '?').join(', ')})`
      safeStage = `TEMP_INSERT_${dataset.key}`
      for (const row of sourceRows[dataset.key]) await db.run(insert, logical.map(column => row[column]))
    }

    safeStage = 'TEMP_READBACK'
    let restored
    try {
      restored = canonicalizeNotificationBackup(await readDatasets(db, true))
    } catch {
      throw new Error('The session-local notification restore rehearsal mismatch was detected.')
    }
    if (source.sha256 !== restored.sha256 || source.totalRowCount !== restored.totalRowCount) {
      throw new Error('The session-local notification restore rehearsal mismatch was detected.')
    }

    safeStage = 'ENCRYPT'
    const envelope = encryptNotificationBackup(sourceRows, publicKey)
    const meta = {
      totalRowCount: source.totalRowCount,
      counts: source.counts,
      digestPrefix: source.sha256.slice(0, 12),
      digestPrefixes: source.digestPrefixes
    }
    emit(`IDTS_N4_BACKUP_META=${Buffer.from(JSON.stringify(meta), 'utf8').toString('base64')}`)
    emit(`IDTS_N4_BACKUP_ENVELOPE=${Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64')}`)
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
    await runNotificationBackupRehearsal({ db, publicKey })
  } catch (error) {
    console.error(`IDTS_N4_BACKUP_RESULT=FAIL;CODE=${error?.safeStage || safeStage}`)
    process.exitCode = 1
  } finally {
    if (db) await db.disconnect()
  }
}

if (require.main === module) main()

module.exports = { readDatasets, runNotificationBackupRehearsal }
