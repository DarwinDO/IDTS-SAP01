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

const unitNumbers = unit.worksheets.getItem('UT').getRange('B8:B195').values.flat().map(Number);
const uatNumbers = uat.worksheets.getItem('Test Cases').getRange('B8:B97').values.flat().map(Number);
const uatScenarioNumbers = uat.worksheets.getItem('Test Scenario').getRange('A4:A15').values.flat().map(Number);
const unitLinkLabels = unit.worksheets.getItem('UT').getRange('BL8:BL195').values.flat().map(String);
const unitResults = unit.worksheets.getItem('UT').getRange('BJ8:BJ195').values.flat().map(String);
const uatLinkLabels = uat.worksheets.getItem('Test Cases').getRange('CC8:CC97').values.flat().map(String);
const uatHeaders = uat.worksheets.getItem('Test Cases').getRange('BO6:CC7').values.flat().map(String);
assert.deepEqual(unitNumbers, Array.from({ length: 188 }, (_, index) => index + 1));
assert.deepEqual(uatNumbers, Array.from({ length: 90 }, (_, index) => index + 1));
assert.deepEqual(uatScenarioNumbers, Array.from({ length: 12 }, (_, index) => index + 1));
assert.ok(unitLinkLabels.every((label) => label === 'Evidence'));
assert.ok(unitResults.every((result) => result === 'NOT RUN'));
assert.ok(uatLinkLabels.every((label) => label === 'Evidence' || label === 'Details'));
for (const header of ['Test Results', 'Tester', 'Test Date', 'Result', 'Evidence']) assert.ok(uatHeaders.includes(header), `missing official UAT header ${header}`);
const unitXml = await (await JSZip.loadAsync(await fs.readFile(unitFile))).file('xl/worksheets/sheet3.xml').async('string');
const uatZip = await JSZip.loadAsync(await fs.readFile(uatFile));
const uatScenarioXml = await uatZip.file('xl/worksheets/sheet3.xml').async('string');
const uatXml = await uatZip.file('xl/worksheets/sheet4.xml').async('string');
const xlsxCellStyle = (xml, reference) => {
  const match = xml.match(new RegExp(`<x:c\\b[^>]*\\br="${reference}"[^>]*\\bs="(\\d+)"`));
  assert.ok(match, `missing serialized style for ${reference}`);
  return match[1];
};
assert.equal((unitXml.match(/<x:hyperlink\b/g) || []).length, 188);
assert.equal((uatXml.match(/<x:hyperlink\b/g) || []).length, 90);
assert.ok(unitXml.includes('location="Evidence!A1"'));
assert.ok(uatXml.includes("location=\"'Test Result'!A1\""));
assert.ok(/<x:pane\b[^>]*topLeftCell="C4"/.test(uatScenarioXml), 'UAT Test Scenario freeze pane C4 must be preserved');
for (const column of ['B', 'E', 'Y', 'AP']) {
  const expectedStyle = xlsxCellStyle(uatXml, `${column}12`);
  for (const row of [13, 14, 50, 97]) {
    assert.equal(xlsxCellStyle(uatXml, `${column}${row}`), expectedStyle, `UAT Test Cases ${column}${row} must match the generated case-row style from ${column}12`);
  }
}

const forbiddenSampleTerms = /Credit Memo|WS92400001|ZCR4|ZG24|NamNH|HuyNB|Le Minh Thao|Hoàng Giao|Thế Hoàng/i;
const forbiddenScenarioTerms = /Create substitution|Adopt substitution|Create Sales Order|Create Outbound Delivery|VL01N/i;
for (const workbook of [unit, uat]) {
  for (const sheet of workbook.worksheets.items) {
    const text = sheet.getUsedRange().values.flat().filter((value) => value !== null && value !== undefined).join('\n');
    assert.ok(!forbiddenSampleTerms.test(text), `${sheet.name} retains OFFICIAL SUBMISSIONS sample business data`);
    assert.ok(!forbiddenScenarioTerms.test(text), `${sheet.name} retains OFFICIAL SUBMISSIONS sample scenario data`);
    assert.ok(!/DonHV accepted/i.test(text), `${sheet.name} contains unsupported DonHV approval wording`);
  }
}

const uatEvidenceText = uat.worksheets.getItem('Test Result').getUsedRange().values.flat().filter((value) => typeof value === 'string').join('\n');
assert.match(String(uat.worksheets.getItem('Test Result').getRange('C1').values[0][0]), /^REVIEW\b/, 'UAT serial 1 evidence banner must match the non-positive REVIEW main-table disposition');
assert.ok(!uatEvidenceText.includes('...'), 'UAT evidence presentation must not contain literal mid-sentence truncation');
assert.ok(!/\bUAT-[A-Z]+-\d+\b/.test(uatEvidenceText), 'UAT evidence presentation must use visible case serials instead of technical test IDs');
assert.ok(!/\bCases? \d+(?:\/\d{3})+\b/.test(uatEvidenceText), 'UAT evidence presentation must expand shorthand technical references into complete visible case serials');
assert.ok(!/\bcandidate PASS\b/i.test(uatEvidenceText), 'UAT evidence presentation must not promote candidate evidence to PASS');

console.log('PASS: candidate workbook contracts preserve sheet order, use serials 1-188 / 1-90 and scenarios 1-12, keep Unit results NOT RUN, scrub sample content, avoid truncated/technical-ID UAT narratives, and retain traceable evidence/details links.');
