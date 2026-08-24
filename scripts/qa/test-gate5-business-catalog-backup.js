'use strict'

const assert = require('node:assert/strict')
const { generateKeyPairSync } = require('node:crypto')

const {
  CATALOGS,
  canonicalizeCatalogDocument,
  decryptCatalogBackup,
  encryptCatalogBackup
} = require('../btp/gate5-business-catalog-backup-contract')
const {
  runCatalogBackupRehearsal
} = require('../btp/run-gate5-business-catalog-backup')

const common = {
  createdAt: '2026-01-01T00:00:00.000Z',
  createdBy: 'system',
  modifiedAt: '2026-01-02T00:00:00.000Z',
  modifiedBy: 'system',
  active: true
}
const rows = {
  sapModules: [{ ...common, ID: '00000000-0000-0000-0000-000000000001', code: 'MM', name: 'Materials Management' }],
  applicationComponents: [{ ...common, ID: '00000000-0000-0000-0000-000000000002', code: 'APP', name: 'Application', componentType: null }],
  defectCategories: [{ ...common, ID: '00000000-0000-0000-0000-000000000003', code: 'DEF', name: 'Defect', categoryType: 'FUNCTIONAL' }],
  componentCategories: [{ ...common, ID: '00000000-0000-0000-0000-000000000004', component_ID: '00000000-0000-0000-0000-000000000002', defectCategory_ID: '00000000-0000-0000-0000-000000000003' }]
}

assert.deepEqual(CATALOGS.map(({ key }) => key), Object.keys(rows))
const canonical = canonicalizeCatalogDocument(rows)
assert.equal(canonical.totalRowCount, 4)
assert.match(canonical.sha256, /^[a-f0-9]{64}$/)
assert.deepEqual(canonical.counts, {
  sapModules: 1,
  applicationComponents: 1,
  defectCategories: 1,
  componentCategories: 1
})
assert.equal(canonicalizeCatalogDocument({ ...rows, sapModules: [...rows.sapModules].reverse() }).json, canonical.json)
assert.throws(() => canonicalizeCatalogDocument({ ...rows, sapModules: [] }), /non-empty/i)
assert.throws(() => canonicalizeCatalogDocument({ ...rows, sapModules: [{ ...rows.sapModules[0], extra: true }] }), /exact catalog column contract/i)

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 3072,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
})
const envelope = encryptCatalogBackup(rows, publicKey)
assert.equal(JSON.stringify(envelope).includes('Materials Management'), false)
const decrypted = decryptCatalogBackup(envelope, privateKey)
assert.equal(decrypted.sha256, canonical.sha256)
assert.deepEqual(decrypted.counts, canonical.counts)

function fakeDb (source = rows, restored = rows) {
  const calls = []
  return {
    calls,
    async run (sql, parameters = []) {
      calls.push({ sql, parameters })
      const catalog = CATALOGS.find(({ table, tempTable }) => sql.includes(table) || sql.includes(tempTable))
      if (/^SELECT/i.test(sql.trim()) && catalog) {
        return sql.includes(catalog.tempTable) ? restored[catalog.key] : source[catalog.key]
      }
      return []
    }
  }
}

;(async () => {
  const emitted = []
  const db = fakeDb()
  const result = await runCatalogBackupRehearsal({ db, publicKey, emit: line => emitted.push(line) })
  assert.equal(result.totalRowCount, 4)
  assert.deepEqual(result.counts, canonical.counts)
  assert.equal(emitted.length, 2)
  assert.match(emitted[0], /^IDTS_GATE5_BACKUP_META=/)
  assert.match(emitted[1], /^IDTS_GATE5_BACKUP_ENVELOPE=/)
  assert.equal(emitted.join('\n').includes('Materials Management'), false)
  assert.equal(db.calls.filter(({ sql }) => /^CREATE LOCAL TEMPORARY COLUMN TABLE/i.test(sql)).length, 4)
  assert.equal(db.calls.filter(({ sql }) => /^INSERT INTO/i.test(sql)).length, 4)

  await assert.rejects(
    runCatalogBackupRehearsal({
      db: fakeDb(rows, { ...rows, sapModules: [{ ...rows.sapModules[0], name: 'Changed' }] }),
      publicKey,
      emit: () => {}
    }),
    /restore rehearsal mismatch/i
  )

  console.log('Gate 5 Business Catalog logical backup: PASS')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
