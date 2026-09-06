#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const receipt = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'idts110-workbook-receipt-')), 'receipt.json');
try {
  const result = spawnSync(process.execPath, [
    'scripts/sap490/test-idts110-unit-test-workbook.mjs',
    '--template=docs/sap490/templates/Deliverable_template/Unit_Test.xlsx',
    '--candidate=docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.5_candidate.xlsx',
    '--baseline=docs/pm/evidence/idts-110/workbook-template-baseline.json',
    `--receipt=${receipt}`
  ], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(receipt), true, 'validator must write the requested machine-readable receipt');
  const parsed = JSON.parse(fs.readFileSync(receipt, 'utf8'));
  assert.equal(parsed.kind, 'idts-110-workbook-validation-receipt');
  assert.equal(parsed.findings.length, 0);
  assert.deepEqual(parsed.statuses, { 'Candidate PASS': 130, 'Mapping Only': 135, Blocked: 13 });
  assert.deepEqual(parsed.hyperlinks, { ut: 278, evidence: 278 });
  assert.equal(parsed.officeCli.validation, 'PASS');
  assert.equal(parsed.fidelity.status, 'PASS');
  assert.match(parsed.candidate.fileSha256, /^[A-F0-9]{64}$/);
} finally {
  fs.rmSync(path.dirname(receipt), { recursive: true, force: true });
}

console.log('IDTS-110 workbook validation receipt contract: PASS');
