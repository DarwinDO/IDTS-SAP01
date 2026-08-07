import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

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
const unitLinks = unit.worksheets.getItem('UT').getRange('BL8:BL195').formulas.flat().map(String);
const uatLinks = uat.worksheets.getItem('Test Cases').getRange('CA8:CA97').formulas.flat().map(String);
assert.equal(unitIds.length, 188);
assert.equal(new Set(unitIds).size, 188);
assert.equal(uatIds.length, 90);
assert.equal(new Set(uatIds).size, 90);
assert.ok(unitIds.every((id) => id.startsWith('UT-')));
assert.ok(uatIds.every((id) => id.startsWith('UAT-')));
assert.equal(new Set(unitLinks).size, 188);
assert.equal(new Set(uatLinks).size, 90);
assert.ok(unitLinks.every((formula) => formula.includes('#Evidence!A')));
assert.ok(uatLinks.every((formula) => formula.includes("#'Test Result'!A")));

console.log('PASS: candidate workbook contracts preserve sheet order and contain 188/90 unique catalog IDs.');
