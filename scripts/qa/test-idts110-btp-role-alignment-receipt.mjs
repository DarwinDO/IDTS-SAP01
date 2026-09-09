import assert from 'node:assert/strict'
import fs from 'node:fs'

const file = process.argv[2]
if (!file) throw new Error('Usage: node scripts/qa/test-idts110-btp-role-alignment-receipt.mjs <sanitized-receipt.json>')

const receipt = JSON.parse(fs.readFileSync(file, 'utf8'))
const expected = new Map([
  ['UT-AUTH-014', 'Your SAP BTP role assignment is not valid for IDTS.'],
  ['UT-AUTH-015', 'Your SAP BTP role does not match your IDTS user profile.']
])

assert.equal(receipt.baselineSha, '0249a7362bffb7a2d753eb12ccaae7cc7eac212f')
assert.equal(receipt.cases.length, expected.size)
for (const result of receipt.cases) {
  assert.equal(result.httpStatus, 403, `${result.caseId} must fail closed`)
  assert.equal(result.safeMessage, expected.get(result.caseId), `${result.caseId} message mismatch`)
  assert.equal(result.identityDetailsExposed, false, `${result.caseId} exposed identity details`)
  assert.equal(result.businessMutationIssued, false, `${result.caseId} issued a business mutation`)
  assert.equal(result.rollbackRoleCollections.join(','), 'IDTS_TESTER', `${result.caseId} rollback mismatch`)
}

console.log('IDTS-110 BTP role-alignment receipts: 2 PASS / 0 FAIL')
