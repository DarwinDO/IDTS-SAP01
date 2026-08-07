import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadUnitCases, loadUatCases } from './idts110-111-workbook-data.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const unit = await loadUnitCases(repoRoot);
const uat = await loadUatCases(repoRoot);

assert.equal(unit.length, 188);
assert.equal(uat.length, 90);
assert.equal(new Set(unit.map((item) => item.id)).size, 188);
assert.equal(new Set(uat.map((item) => item.id)).size, 90);
assert.ok(unit.every((item) => item.catalogStatus === 'NOT_RUN'));
assert.ok(uat.every((item) => item.catalogStatus === 'PREPARED'));
assert.ok(unit.every((item) => item.evidence.every((evidence) => /^[A-F0-9]{64}$/.test(evidence.sha256))));
assert.ok(uat.every((item) => item.evidence.every((evidence) => /^[A-F0-9]{64}$/.test(evidence.sha256))));
assert.ok(unit.some((item) => item.reviewDisposition === 'ACCEPTED_CANDIDATE'));
assert.ok(unit.some((item) => item.reviewDisposition === 'MAPPING_ONLY_NOT_PASS'));
assert.ok(uat.some((item) => item.reviewDisposition === 'MEETS_EXPECTED_RESULT'));
assert.ok(uat.some((item) => item.reviewDisposition === 'BLOCKED'));

console.log(`PASS: normalized ${unit.length} Unit and ${uat.length} UAT cases; IDs unique and accepted evidence hash-valid.`);
