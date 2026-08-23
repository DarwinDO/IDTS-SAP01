'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { encryptCatalogBackup } = require('../btp/gate5-business-catalog-backup-contract')

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'idts-g5-catalog-custody-'))
const publicPath = path.join(root, 'public.pem')
const privateDirectory = path.join(root, 'private')
const envelopePath = path.join(root, 'catalog-backup-envelope.json')
const keyScript = path.resolve(__dirname, '..', 'btp', 'user-admin-logical-backup-key.ps1')
const verifyScript = path.resolve(__dirname, '..', 'btp', 'verify-gate5-business-catalog-backup.ps1')
const common = {
  createdAt: '2026-01-01T00:00:00.000Z', createdBy: 'system',
  modifiedAt: '2026-01-02T00:00:00.000Z', modifiedBy: 'system', active: true
}
const rows = {
  sapModules: [{ ...common, ID: '00000000-0000-0000-0000-000000000001', code: 'MM', name: 'Materials Management' }],
  applicationComponents: [{ ...common, ID: '00000000-0000-0000-0000-000000000002', code: 'APP', name: 'Application', componentType: null }],
  defectCategories: [{ ...common, ID: '00000000-0000-0000-0000-000000000003', code: 'DEF', name: 'Defect', categoryType: 'FUNCTIONAL' }],
  componentCategories: [{ ...common, ID: '00000000-0000-0000-0000-000000000004', component_ID: '00000000-0000-0000-0000-000000000002', defectCategory_ID: '00000000-0000-0000-0000-000000000003' }]
}

try {
  const created = spawnSync('pwsh', ['-NoProfile', '-File', keyScript, '-PublicOutputPath', publicPath, '-PrivateDirectory', privateDirectory], { encoding: 'utf8' })
  assert.equal(created.status, 0, created.stderr)
  fs.writeFileSync(envelopePath, JSON.stringify(encryptCatalogBackup(rows, fs.readFileSync(publicPath, 'utf8'))), { flag: 'wx' })

  const verified = spawnSync('pwsh', ['-NoProfile', '-File', verifyScript, '-EnvelopePath', envelopePath, '-PrivateDirectory', privateDirectory], { encoding: 'utf8' })
  assert.equal(verified.status, 0, `${verified.stdout}\n${verified.stderr}`)
  assert.match(verified.stdout.trim(), /^IDTS_GATE5_VERIFY_RESULT=PASS;TOTAL=4;COUNTS_B64=[A-Za-z0-9+/=]+;DIGEST_PREFIX=[a-f0-9]{12}$/)
  assert.equal(verified.stdout.includes('Materials Management'), false)

  console.log('Gate 5 Business Catalog backup custody: PASS')
} finally {
  fs.rmSync(root, { recursive: true, force: true })
}
