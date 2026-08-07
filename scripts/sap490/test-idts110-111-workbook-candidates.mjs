import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
import JSZip from 'jszip';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const unitFile = path.join(root, 'docs/sap490/generated/Unit_Test_IDTS_SAP01_en_candidate_v0.5.xlsx');
const uatFile = path.join(root, 'docs/sap490/generated/UAT_IDTS_SAP01_en_candidate_v0.3.xlsx');
for (const file of [unitFile, uatFile]) assert.ok((await fs.stat(file)).size > 100_000, `${file} must exist and be non-empty`);

const unit = await SpreadsheetFile.importXlsx(await FileBlob.load(unitFile));
const uat = await SpreadsheetFile.importXlsx(await FileBlob.load(uatFile));
assert.deepEqual(unit.worksheets.items.map((sheet) => sheet.name), ['Cover', 'Histories', 'UT', 'Evidence']);
assert.deepEqual(uat.worksheets.items.map((sheet) => sheet.name), ['Cover', 'Histories', 'Test Scenario', 'Test Cases', 'Test Result']);

const unitIds = unit.worksheets.getItem('UT').getRange('B8:B195').values.flat().map(String);
const uatIds = uat.worksheets.getItem('Test Cases').getRange('B8:B97').values.flat().map(String);
const unitLinkLabels = unit.worksheets.getItem('UT').getRange('BL8:BL195').values.flat().map(String);
const uatLinkLabels = uat.worksheets.getItem('Test Cases').getRange('CA8:CA97').values.flat().map(String);
assert.equal(unitIds.length, 188);
assert.equal(new Set(unitIds).size, 188);
assert.equal(uatIds.length, 90);
assert.equal(new Set(uatIds).size, 90);
assert.ok(unitIds.every((id) => id.startsWith('UT-')));
assert.ok(uatIds.every((id) => id.startsWith('UAT-')));
assert.ok(unitLinkLabels.every((label) => label === 'Evidence'));
assert.ok(uatLinkLabels.every((label) => label === 'Evidence'));
const unitXml = await (await JSZip.loadAsync(await fs.readFile(unitFile))).file('xl/worksheets/sheet3.xml').async('string');
const uatXml = await (await JSZip.loadAsync(await fs.readFile(uatFile))).file('xl/worksheets/sheet4.xml').async('string');
assert.equal((unitXml.match(/<x:hyperlink\b/g) || []).length, 188);
assert.equal((uatXml.match(/<x:hyperlink\b/g) || []).length, 90);
assert.ok(unitXml.includes('location="Evidence!A1"'));
assert.ok(uatXml.includes("location=\"'Test Result'!A6\""));

console.log('PASS: candidate workbook contracts preserve sheet order and contain 188/90 unique catalog IDs.');
