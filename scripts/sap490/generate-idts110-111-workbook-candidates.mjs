import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { imageSize } from 'image-size';
import JSZip from 'jszip';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
import { loadUnitCases, loadUatCases } from './idts110-111-workbook-data.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const authorityRoot = path.resolve(repoRoot, '..', '..', 'IDTS-SAP01', '.tmp', 'official-submission-audit');
const outputRoot = path.join(repoRoot, 'docs', 'sap490', 'generated');
const UNIT_AUTHORITY = path.join(authorityRoot, 'GFA24SAP04_Unit_Test.xlsx');
const UAT_AUTHORITY = path.join(authorityRoot, 'GFA24SAP04_UAT.xlsx');
const UNIT_OUTPUT = path.join(outputRoot, 'Unit_Test_IDTS_SAP01_en_candidate_v0.5.xlsx');
const UAT_OUTPUT = path.join(outputRoot, 'UAT_IDTS_SAP01_en_candidate_v0.3.xlsx');
const UNIT_SHA = 'C1B812DD6AE8A95146F1EB553601D93FBF99CCEA336E8D7FDCA6626D86C90ED7';
const UAT_SHA = 'E96753C4EADED1AE25D3651C5F8F759BC74A534FE0975AAF2CF479F04F964D9E';

const hashFile = async (file) => crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex').toUpperCase();
const assertAuthority = async (file, expected) => {
  const actual = await hashFile(file);
  if (actual !== expected) throw new Error(`Authority hash mismatch for ${file}: ${actual}`);
};
async function sanitizedImportCopy(authorityFile) {
  const zip = await JSZip.loadAsync(await fs.readFile(authorityFile));
  for (const name of Object.keys(zip.files).filter((item) => /^xl\/comments\d+\.xml$/i.test(item))) {
    const xml = await zip.file(name).async('string');
    zip.file(name, xml.replace(/<author\s*><\/author>/g, '<author>Official Template</author>'));
  }
  const people = zip.file('xl/persons/person.xml');
  if (people) {
    const xml = await people.async('string');
    if (!/<x18tc:person\s/i.test(xml)) {
      zip.remove('xl/persons/person.xml');
      for (const relationName of Object.keys(zip.files).filter((item) => /\.rels$/i.test(item))) {
        const relation = await zip.file(relationName).async('string');
        zip.file(relationName, relation.replace(/<Relationship\b[^>]*Type="[^"]*\/person"[^>]*\/>/g, ''));
      }
      const types = await zip.file('[Content_Types].xml').async('string');
      zip.file('[Content_Types].xml', types.replace(/<Override\b[^>]*PartName="\/xl\/persons\/person\.xml"[^>]*\/>/g, ''));
    }
  }
  const temporaryDir = path.join(repoRoot, '.tmp', 'sap490-workbook-candidate-build');
  await fs.mkdir(temporaryDir, { recursive: true });
  const output = path.join(temporaryDir, path.basename(authorityFile));
  await fs.writeFile(output, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  return output;
}
const set = (sheet, address, value) => { sheet.getRange(address).values = [[value ?? '']]; };
const safeFormulaText = (value) => String(value || '').startsWith('=') ? `'${value}` : String(value || '');

async function addEvidenceBlocks(sheet, cases, startRow, endColumn) {
  sheet.deleteAllDrawings();
  sheet.getRange(`A${startRow}:${endColumn}1048576`).clear();
  let row = startRow;
  const anchors = new Map();
  for (const testCase of cases) {
    anchors.set(testCase.id, row);
    set(sheet, `A${row}`, `Case: ${testCase.id}`);
    set(sheet, `C${row}`, `${testCase.reviewDisposition} — ${testCase.reviewNote || ''}`);
    sheet.getRange(`A${row}:${endColumn}${row}`).format.rowHeight = 24;
    row += 2;
    if (!testCase.evidence.length) {
      set(sheet, `C${row}`, 'No valid case-specific image evidence');
      row += 2;
      continue;
    }
    for (const evidence of testCase.evidence) {
      const absolute = path.join(repoRoot, evidence.path);
      const bytes = await fs.readFile(absolute);
      const dimensions = imageSize(bytes);
      const widthPx = Math.min(720, dimensions.width || 720);
      const heightPx = Math.max(80, Math.round(widthPx * (dimensions.height || 400) / (dimensions.width || 720)));
      set(sheet, `C${row}`, `${evidence.reviewBlocked ? 'REVIEW BLOCKED — ' : ''}${evidence.caption} — SHA-256 ${evidence.sha256}`);
      const mime = path.extname(absolute).toLowerCase() === '.jpg' || path.extname(absolute).toLowerCase() === '.jpeg' ? 'image/jpeg' : 'image/png';
      sheet.images.add({
        dataUrl: `data:${mime};base64,${bytes.toString('base64')}`,
        anchor: { from: { row, col: 2 }, extent: { widthPx, heightPx } }
      });
      const occupiedRows = Math.ceil(heightPx / 22) + 2;
      sheet.getRange(`A${row + 1}:${endColumn}${row + occupiedRows - 1}`).format.rowHeight = 16.5;
      row += occupiedRows;
    }
    row += 1;
  }
  return { lastRow: row - 1, anchors };
}

export async function generateUnitCandidate() {
  await assertAuthority(UNIT_AUTHORITY, UNIT_SHA);
  const cases = await loadUnitCases(repoRoot);
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(await sanitizedImportCopy(UNIT_AUTHORITY)));
  const unit = workbook.worksheets.getItem('UT');
  const evidence = workbook.worksheets.getItem('Evidence');
  const evidenceLayout = await addEvidenceBlocks(evidence, cases, 1, 'Z');
  unit.getRange('B8:BR1084').unmerge();
  unit.getRange('B8:BR1084').clear();
  for (let index = 0; index < cases.length; index += 1) {
    const row = 8 + index;
    unit.getRange(`B${row}:BR${row}`).copyFrom(unit.getRange('B10:BR10'), 'all');
    unit.getRange(`B${row}:BR${row}`).clear();
    for (const range of [`B${row}:D${row}`, `E${row}:X${row}`, `Y${row}:AW${row}`, `AX${row}:BC${row}`, `BD${row}:BI${row}`, `BJ${row}:BK${row}`, `BL${row}:BR${row}`]) unit.getRange(range).merge();
    const item = cases[index];
    set(unit, `B${row}`, item.id);
    set(unit, `E${row}`, safeFormulaText(`${item.title}\nPreconditions: ${item.preconditions}\nSteps:\n${item.steps}`));
    set(unit, `Y${row}`, safeFormulaText(item.expected));
    set(unit, `AX${row}`, 'NhanT execution / DonHV review');
    set(unit, `BD${row}`, 'Candidate only');
    set(unit, `BJ${row}`, `${item.catalogStatus} | ${item.reviewDisposition}`);
    unit.getRange(`BL${row}`).formulas = [[`=HYPERLINK("#Evidence!A${evidenceLayout.anchors.get(item.id)}","Evidence")`]];
    unit.getRange(`B${row}:BR${row}`).format.rowHeight = 72;
  }
  set(workbook.worksheets.getItem('Cover'), 'N3', 'IDTS-SAP01');
  set(workbook.worksheets.getItem('Cover'), 'N4', 'Issue and Defect Tracking System');
  set(workbook.worksheets.getItem('Histories'), 'D4', 'Candidate v0.5 — 188 catalog cases; evidence remains subject to exact-hash approval.');
  await fs.mkdir(outputRoot, { recursive: true });
  await (await SpreadsheetFile.exportXlsx(workbook)).save(UNIT_OUTPUT);
  return { output: UNIT_OUTPUT, cases: cases.length, evidence: cases.reduce((sum, item) => sum + item.evidence.length, 0), evidenceLastRow: evidenceLayout.lastRow };
}

export async function generateUatCandidate() {
  await assertAuthority(UAT_AUTHORITY, UAT_SHA);
  const cases = await loadUatCases(repoRoot);
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(await sanitizedImportCopy(UAT_AUTHORITY)));
  const scenarios = workbook.worksheets.getItem('Test Scenario');
  const testCases = workbook.worksheets.getItem('Test Cases');
  const results = workbook.worksheets.getItem('Test Result');
  const evidenceLayout = await addEvidenceBlocks(results, cases, 6, 'P');
  const domains = [...new Set(cases.map((item) => item.area))];
  scenarios.getRange('B8:CI1429').clear();
  domains.forEach((domain, index) => {
    set(scenarios, `B${8 + index}`, index + 1);
    set(scenarios, `E${8 + index}`, domain);
  });
  testCases.getRange('B8:CI1429').unmerge();
  testCases.getRange('B8:CI1429').clear();
  for (let index = 0; index < cases.length; index += 1) {
    const row = 8 + index;
    testCases.getRange(`B${row}:CI${row}`).copyFrom(testCases.getRange('B8:CI8'), 'all');
    testCases.getRange(`B${row}:CI${row}`).clear();
    for (const range of [`B${row}:D${row}`, `E${row}:X${row}`, `Y${row}:AO${row}`, `AP${row}:BN${row}`, `BO${row}:BT${row}`, `BU${row}:BZ${row}`, `CA${row}:CB${row}`]) testCases.getRange(range).merge();
    const item = cases[index];
    set(testCases, `B${row}`, item.id);
    set(testCases, `E${row}`, safeFormulaText(`${item.title}\nSteps:\n${item.steps}`));
    set(testCases, `Y${row}`, safeFormulaText(item.preconditions));
    set(testCases, `AP${row}`, safeFormulaText(item.expected));
    set(testCases, `BO${row}`, item.catalogStatus);
    set(testCases, `BU${row}`, item.reviewDisposition);
    testCases.getRange(`CA${row}`).formulas = [[`=HYPERLINK("#'Test Result'!A${evidenceLayout.anchors.get(item.id)}","Evidence")`]];
    testCases.getRange(`B${row}:CI${row}`).format.rowHeight = 84;
  }
  set(testCases, 'BO7', 'Catalog Status');
  set(testCases, 'BU7', 'Review Disposition');
  set(testCases, 'CA7', 'Evidence');
  set(workbook.worksheets.getItem('Cover'), 'N3', 'IDTS-SAP01');
  set(workbook.worksheets.getItem('Cover'), 'N4', 'Issue and Defect Tracking System');
  set(workbook.worksheets.getItem('Histories'), 'D4', 'Candidate v0.3 — 90 catalog cases; MEETS is not final UAT sign-off.');
  await fs.mkdir(outputRoot, { recursive: true });
  await (await SpreadsheetFile.exportXlsx(workbook)).save(UAT_OUTPUT);
  return { output: UAT_OUTPUT, cases: cases.length, evidence: cases.reduce((sum, item) => sum + item.evidence.length, 0), evidenceLastRow: evidenceLayout.lastRow };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const unit = await generateUnitCandidate();
  console.log(JSON.stringify(unit));
  const uat = await generateUatCandidate();
  console.log(JSON.stringify(uat));
}
