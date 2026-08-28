'use strict'

const { createHash } = require('node:crypto')
const {
  decryptCanonicalDocument,
  encryptCanonicalDocument
} = require('./user-admin-logical-backup-contract')

const DATASETS = Object.freeze([
  {
    key: 'notifications',
    table: 'IDTS_CAP_NOTIFICATIONS',
    tempTable: '#IDTS_N4_NOTIFICATIONS_RESTORE',
    orderBy: 'ID',
    columns: Object.freeze([
      ['ID', 'ID'],
      ['createdAt', 'CREATEDAT'],
      ['createdBy', 'CREATEDBY'],
      ['modifiedAt', 'MODIFIEDAT'],
      ['modifiedBy', 'MODIFIEDBY'],
      ['bug_ID', 'BUG_ID'],
      ['recipient_ID', 'RECIPIENT_ID'],
      ['eventType_code', 'EVENTTYPE_CODE'],
      ['channel_code', 'CHANNEL_CODE'],
      ['deliveryStatus_code', 'DELIVERYSTATUS_CODE'],
      ['message', 'MESSAGE'],
      ['sentAt', 'SENTAT']
    ]),
    tempColumns: '"ID" NVARCHAR(36) NOT NULL, "createdAt" TIMESTAMP, "createdBy" NVARCHAR(255), "modifiedAt" TIMESTAMP, "modifiedBy" NVARCHAR(255), "bug_ID" NVARCHAR(36) NOT NULL, "recipient_ID" NVARCHAR(36) NOT NULL, "eventType_code" NVARCHAR(40) NOT NULL, "channel_code" NVARCHAR(40), "deliveryStatus_code" NVARCHAR(40) NOT NULL, "message" NVARCHAR(500), "sentAt" TIMESTAMP'
  },
  {
    key: 'eventTypes',
    table: 'IDTS_CAP_NOTIFICATIONEVENTTYPES',
    tempTable: '#IDTS_N4_EVENTTYPES_RESTORE',
    orderBy: 'code',
    columns: Object.freeze([
      ['code', 'CODE'],
      ['name', 'NAME'],
      ['descr', 'DESCR'],
      ['sortOrder', 'SORTORDER'],
      ['active', 'ACTIVE'],
      ['criticality', 'CRITICALITY']
    ]),
    tempColumns: '"code" NVARCHAR(40) NOT NULL, "name" NVARCHAR(120) NOT NULL, "descr" NVARCHAR(255), "sortOrder" INTEGER, "active" BOOLEAN, "criticality" INTEGER'
  }
])

function normalizeValue (value) {
  return value instanceof Date ? value.toISOString() : value
}

function canonicalizeRows (dataset, rows) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`${dataset.key} requires a non-empty row set.`)
  const expected = dataset.columns.map(([logical]) => logical).sort()
  const normalized = rows.map(row => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Row does not satisfy the exact notification backup column contract.')
    const keys = Object.keys(row).sort()
    if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
      throw new Error('Row does not satisfy the exact notification backup column contract.')
    }
    return Object.fromEntries(dataset.columns.map(([logical]) => {
      if (typeof row[logical] === 'undefined') throw new Error('Row does not satisfy the exact notification backup column contract.')
      return [logical, normalizeValue(row[logical])]
    }))
  }).sort((left, right) => String(left[dataset.orderBy]).localeCompare(String(right[dataset.orderBy])))
  if (new Set(normalized.map(row => row[dataset.orderBy])).size !== normalized.length) {
    throw new Error(`${dataset.key} contains duplicate restore keys.`)
  }
  return normalized
}

function canonicalizeNotificationBackup (source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('Notification backup source is invalid.')
  const keys = Object.keys(source).sort()
  const expected = DATASETS.map(({ key }) => key).sort()
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
    throw new Error('Notification backup source is invalid.')
  }
  const datasets = DATASETS.map(dataset => ({ key: dataset.key, rows: canonicalizeRows(dataset, source[dataset.key]) }))
  const document = { version: 1, datasets }
  const json = JSON.stringify(document)
  return {
    document,
    json,
    sha256: createHash('sha256').update(json, 'utf8').digest('hex'),
    totalRowCount: datasets.reduce((total, dataset) => total + dataset.rows.length, 0),
    counts: Object.fromEntries(datasets.map(dataset => [dataset.key, dataset.rows.length])),
    digestPrefixes: Object.fromEntries(datasets.map(dataset => [
      dataset.key,
      createHash('sha256').update(JSON.stringify(dataset.rows), 'utf8').digest('hex').slice(0, 12)
    ]))
  }
}

function encryptNotificationBackup (source, publicKey) {
  return encryptCanonicalDocument(canonicalizeNotificationBackup(source).json, publicKey)
}

function decryptNotificationBackup (envelope, privateKey) {
  const document = decryptCanonicalDocument(envelope, privateKey)
  if (document?.version !== 1 || !Array.isArray(document.datasets)) throw new Error('Notification backup document is invalid.')
  const source = Object.fromEntries(document.datasets.map(dataset => [dataset.key, dataset.rows]))
  return canonicalizeNotificationBackup(source)
}

module.exports = {
  DATASETS,
  canonicalizeNotificationBackup,
  decryptNotificationBackup,
  encryptNotificationBackup
}
