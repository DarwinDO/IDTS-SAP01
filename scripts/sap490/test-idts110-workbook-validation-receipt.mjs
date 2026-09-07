#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const candidate = 'docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.6_candidate.xlsx';
const receiptPath = 'docs/pm/evidence/idts-110/workbook-v06-validation-receipt.json';
const pdfPath = '.tmp/idts-110/v06-final-bound/Unit_Test_IDTS_SAP01_en_v0.6_candidate.pdf';
const reportPath = '.tmp/idts-110/workbook-v06-report.md';
const validator = 'scripts/sap490/test-idts110-unit-test-workbook.mjs';

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').toUpperCase();
}

function pdfPageCount(filePath) {
  const result = spawnSync('pdfinfo', [filePath], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const pages = Number((result.stdout || '').match(/^Pages:\s+(\d+)$/m)?.[1]);
  assert.ok(Number.isSafeInteger(pages), 'pdfinfo must report a valid page count');
  return pages;
}

assert.equal(path.basename(candidate), 'Unit_Test_IDTS_SAP01_en_v0.6_candidate.xlsx');
assert.equal(fs.existsSync(candidate), true, 'final v0.6 candidate must exist');
assert.equal(fs.existsSync(receiptPath), true, 'final v0.6 receipt must exist');
assert.equal(fs.existsSync(pdfPath), true, 'final v0.6 PDF must exist');
assert.equal(fs.existsSync(reportPath), true, 'final v0.6 report must exist');

const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
assert.equal(receipt.kind, 'idts-110-workbook-validation-receipt');
assert.equal(receipt.findings.length, 0);
assert.deepEqual(receipt.statuses, { 'Candidate PASS': 265, Blocked: 13 });
assert.equal(Object.hasOwn(receipt.statuses, 'Mapping Only'), false);
assert.deepEqual(receipt.hyperlinks, { ut: 278, evidence: 0 });
assert.equal(receipt.officeCli.validation, 'PASS');
assert.equal(receipt.fidelity.status, 'PASS');

assert.equal(receipt.candidate.fileSha256, sha256(candidate), 'receipt candidate hash must bind the exact final XLSX bytes');
assert.equal(receipt.candidate.fileSizeBytes, fs.statSync(candidate).size, 'receipt candidate size must bind the exact final XLSX bytes');
assert.equal(receipt.validatorSha256, sha256(validator), 'receipt must bind the validator that produced it');

assert.ok(receipt.pdf, 'receipt must bind the final PDF');
assert.equal(receipt.pdf.fileSha256, sha256(pdfPath), 'receipt PDF hash must bind the exact final PDF bytes');
assert.equal(receipt.pdf.fileSizeBytes, fs.statSync(pdfPath).size, 'receipt PDF size must bind the exact final PDF bytes');
assert.equal(receipt.pdf.pageCount, 391);
assert.equal(receipt.pdf.evidencePages, 278);
assert.equal(receipt.pdf.otherSheetPages, 113);
assert.equal(receipt.pdf.pageCount, receipt.pdf.evidencePages + receipt.pdf.otherSheetPages);
assert.equal(pdfPageCount(pdfPath), receipt.pdf.pageCount, 'receipt PDF page count must match the rendered final PDF');

const report = fs.readFileSync(reportPath, 'utf8');
for (const binding of [
  receiptPath,
  receipt.candidate.fileSha256,
  String(receipt.candidate.fileSizeBytes),
  receipt.pdf.fileSha256,
  String(receipt.pdf.fileSizeBytes),
  String(receipt.pdf.pageCount),
  String(receipt.pdf.evidencePages),
  String(receipt.pdf.otherSheetPages)
]) assert.ok(report.includes(binding), `report must derive ${binding} from the final receipt`);

console.log('IDTS-110 v0.6 workbook validation receipt contract: PASS');
