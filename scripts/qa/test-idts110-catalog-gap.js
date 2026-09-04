'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))
const proposalInput = readJson('docs/pm/evidence/idts-110/catalog-gap-proposal-input.json')

assert.equal(proposalInput.sourceWorkbook, 'SU26SAP01_GSU26SAP01_Unit_Test (1).xlsx')
assert.equal(proposalInput.sourceBaseline, '9d5aad699662bde65a747de4c0d631678de639e4')
assert.equal(proposalInput.proposals.length, 15)
assert.deepEqual(proposalInput.proposals.map(row => row.sourceNumber), Array.from({ length: 15 }, (_, index) => index + 189))
for (const proposal of proposalInput.proposals) {
  assert.equal(Number.isInteger(proposal.sourceNumber), true)
  assert.equal(typeof proposal.title, 'string')
  assert.equal(typeof proposal.precondition, 'string')
  assert.equal(typeof proposal.action, 'string')
  assert.equal(typeof proposal.expectedResult, 'string')
  assert.equal(proposal.suppliedResult, 'O')
}
console.log('IDTS-110 catalog gap contract: PASS')
