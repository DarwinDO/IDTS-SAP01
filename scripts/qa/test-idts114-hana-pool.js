const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

process.env.CDS_ENV = 'production'

const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')
)
const productionDb = pkg.cds?.requires?.db?.['[production]']
const acquireTimeoutMillis = productionDb?.pool?.acquireTimeoutMillis

assert.equal(productionDb?.kind, 'hana')
assert.equal(acquireTimeoutMillis, 10000)

const cds = require('@sap/cds')
assert.equal(cds.env.requires.db?.kind, 'hana')
assert.equal(cds.env.requires.db?.pool?.acquireTimeoutMillis, 10000)

console.log('IDTS-114 HANA pool checks: 4/4 PASS')
