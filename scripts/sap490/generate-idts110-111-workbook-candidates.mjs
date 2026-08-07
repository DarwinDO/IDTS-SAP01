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
async function restoreWorksheetPrintContracts(authorityFile, candidateFile) {
  const reference = await JSZip.loadAsync(await fs.readFile(authorityFile));
  const candidate = await JSZip.loadAsync(await fs.readFile(candidateFile));
  const sheetNames = Object.keys(reference.files).filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name));
  for (const name of sheetNames) {
    if (!candidate.file(name)) continue;
    const source = await reference.file(name).async('string');
    let target = await candidate.file(name).async('string');
    const prefix = target.match(/<([A-Za-z0-9_]+):worksheet\b/)?.[1];
    const q = (element) => prefix ? `${prefix}:${element}` : element;
    for (const element of ['pageMargins', 'pageSetup']) {
      const sourceTag = source.match(new RegExp(`<(?:[A-Za-z0-9_]+:)?${element}\\b[^>]*\\/?>`))?.[0];
      const targetPattern = new RegExp(`<(?:[A-Za-z0-9_]+:)?${element}\\b[^>]*\\/?>`);
      const normalized = sourceTag?.replace(new RegExp(`^<(?:[A-Za-z0-9_]+:)?${element}`), `<${q(element)}`);
      if (normalized && targetPattern.test(target)) target = target.replace(targetPattern, normalized);
      else if (normalized && element === 'pageSetup') {
        const marginsPattern = new RegExp(`<(?:[A-Za-z0-9_]+:)?pageMargins\\b[^>]*\\/?>`);
        target = marginsPattern.test(target)
          ? target.replace(marginsPattern, (tag) => `${tag}${normalized}`)
          : target.replace(`</${q('worksheet')}>`, `${normalized}</${q('worksheet')}>`);
      }
      else if (normalized) target = target.replace(`</${q('worksheet')}>`, `${normalized}</${q('worksheet')}>`);
      else target = target.replace(targetPattern, '');
    }
    const sourceViews = source.match(/<(?:[A-Za-z0-9_]+:)?sheetViews\b[^>]*>[\s\S]*?<\/(?:[A-Za-z0-9_]+:)?sheetViews>/)?.[0];
    const targetViewsPattern = /<(?:[A-Za-z0-9_]+:)?sheetViews\b[^>]*>[\s\S]*?<\/(?:[A-Za-z0-9_]+:)?sheetViews>/;
    if (sourceViews) {
      let normalizedViews = sourceViews.replace(/<(\/?)(?:[A-Za-z0-9_]+:)?(sheetViews|sheetView|pane|selection)\b/g, (_match, closing, element) => `<${closing}${q(element)}`);
      const viewOpen = new RegExp(`<${q('sheetView')}\\b[^>]*>`);
      normalizedViews = normalizedViews.replace(viewOpen, (tag) => {
        if (/\bshowGridLines=/.test(tag)) return tag;
        return tag.endsWith('/>') ? tag.replace(/\/>$/, ' showGridLines="0"/>') : tag.replace(/>$/, ' showGridLines="0">');
      });
      target = targetViewsPattern.test(target)
        ? target.replace(targetViewsPattern, normalizedViews)
        : target.replace(new RegExp(`(<${q('sheetFormatPr')}\\b)`), `${normalizedViews}$1`);
    }
    candidate.file(name, target);
  }
  await fs.writeFile(candidateFile, await candidate.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}
async function applyInternalHyperlinks(candidateFile, sheetXmlName, links) {
  const zip = await JSZip.loadAsync(await fs.readFile(candidateFile));
  let xml = await zip.file(sheetXmlName).async('string');
  const prefix = xml.match(/<([A-Za-z0-9_]+):worksheet\b/)?.[1];
  const q = (element) => prefix ? `${prefix}:${element}` : element;
  xml = xml.replace(new RegExp(`<${q('hyperlinks')}\\b[^>]*>[\\s\\S]*?<\\/${q('hyperlinks')}>`), '');
  const nodes = links.map(({ ref, location }) => `<${q('hyperlink')} ref="${ref}" location="${location}" display="Evidence"/>`).join('');
  const block = `<${q('hyperlinks')}>${nodes}</${q('hyperlinks')}>`;
  const anchorPattern = new RegExp(`(<${q('pageMargins')}\\b)`);
  xml = anchorPattern.test(xml) ? xml.replace(anchorPattern, `${block}$1`) : xml.replace(`</${q('worksheet')}>`, `${block}</${q('worksheet')}>`);
  zip.file(sheetXmlName, xml);
  await fs.writeFile(candidateFile, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}
const set = (sheet, address, value) => { sheet.getRange(address).values = [[value ?? '']]; };
const safeFormulaText = (value) => String(value || '').startsWith('=') ? `'${value}` : String(value || '');
const compactUnitAction = (steps) => {
  const lines = String(steps || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const branch = lines.find((line) => /^Execute only this branch using:/i.test(line));
  return (branch || lines[0] || 'Execute the case-specific branch.').replace(/^Execute only this branch using:\s*/i, '');
};
const unitTesterLabel = (value) => ({
  ACCEPTED_CANDIDATE: 'NhanT candidate',
  MAPPING_ONLY_NOT_PASS: 'Mapping only',
  BLOCKED_PENDING_MEMBER_EVIDENCE: 'Pending member evidence',
  HELD_FOR_EXACT_HEAD_ACCEPTANCE: 'Held for review'
}[value] || 'Pending review');
const uatDisplayDisposition = (value) => ({
  MEETS_EXPECTED_RESULT: 'MEETS',
  DOES_NOT_MEET_EXPECTED_RESULT: 'NOT MET',
  RERUN_REQUIRED_CURRENT_RUNTIME: 'RERUN',
  BLOCKED: 'BLOCK',
  PREPARED: 'PREPARED'
}[value] || 'REVIEW');
const visibleEvidence = (testCase) => testCase.id === 'UAT-AUTH-001' ? [] : testCase.evidence;
const formatSerialList = (serials) => {
  if (serials.length < 2) return `Case ${serials[0]}`;
  if (serials.length === 2) return `Cases ${serials[0]} and ${serials[1]}`;
  return `Cases ${serials.slice(0, -1).join(', ')}, and ${serials.at(-1)}`;
};
const normalizeUatReviewText = (value, serialById) => String(value || '')
  .replace(/\b(UAT|UT)-([A-Z]+)-(\d+)((?:\/\d+)+)/g, (_match, prefix, domain, first, rest) => {
    const ids = [first, ...rest.slice(1).split('/')].map((suffix) => `${prefix}-${domain}-${suffix}`);
    const serials = ids.map((id) => serialById.get(id)).filter(Boolean);
    return serials.length === ids.length ? formatSerialList(serials) : 'related test cases';
  })
  .replace(/\b(?:UAT|UT)-[A-Z]+-\d+\b/g, (id) => serialById.has(id) ? `Case ${serialById.get(id)}` : 'a related test case')
  .replace(/\bcandidate PASS only\b/gi, 'candidate evidence that meets the expected result')
  .replace(/\bcandidate PASS\b/gi, 'candidate evidence that meets the expected result')
  .replace(/\bPASS\b/g, 'positive result')
  .replace(/\bFAIL\b/g, 'negative result');
const evidenceSummary = (testCase, serialById) => {
  const unitSummary = {
    ACCEPTED_CANDIDATE: 'Local candidate evidence only; no final PASS or workbook approval.',
    MAPPING_ONLY_NOT_PASS: 'No individual case execution is proven.',
    BLOCKED_PENDING_MEMBER_EVIDENCE: 'Blocked pending member-owned case evidence.',
    HELD_FOR_EXACT_HEAD_ACCEPTANCE: 'Held pending exact-head evidence review.'
  }[testCase.reviewDisposition];
  if (unitSummary) return unitSummary;
  if (testCase.id === 'UAT-AUTH-001') {
    return 'The available screenshot shows the IDTS List Report only and contains unrelated runtime rows. It does not prove the profile identity/session assertions, so the image is omitted and the assertions remain pending case-specific evidence. Candidate review only; not final UAT sign-off.';
  }
  const note = normalizeUatReviewText(testCase.reviewNote, serialById).replace(/\s+/g, ' ').trim();
  return `${note || 'No reviewer narrative recorded.'} Candidate review only; not final UAT sign-off.`;
};
const evidenceDispositionLabel = (value) => ({
  ACCEPTED_CANDIDATE: 'CANDIDATE EVIDENCE',
  MAPPING_ONLY_NOT_PASS: 'MAPPING',
  BLOCKED_PENDING_MEMBER_EVIDENCE: 'BLOCKED',
  HELD_FOR_EXACT_HEAD_ACCEPTANCE: 'HELD'
}[value] || uatDisplayDisposition(value));

async function addEvidenceBlocks(sheet, cases, startRow, endColumn, clearEndRow, clearEndColumn = endColumn) {
  sheet.deleteAllDrawings();
  sheet.getRange(`A${startRow}:${clearEndColumn}${clearEndRow}`).unmerge();
  sheet.getRange(`A${startRow}:${clearEndColumn}${clearEndRow}`).clear();
  sheet.getRange(`A${startRow}:${clearEndColumn}${clearEndRow}`).format.fill = '#FFFFFF';
  sheet.getRange(`A${startRow}:${clearEndColumn}${clearEndRow}`).format.borders = { preset: 'all', style: 'thin', color: '#FFFFFF' };
  let row = startRow;
  const anchors = new Map();
  const serialById = new Map(cases.map((testCase, index) => [testCase.id, index + 1]));
  for (const [caseIndex, testCase] of cases.entries()) {
    const summary = evidenceSummary(testCase, serialById);
    const displayedEvidence = visibleEvidence(testCase);
    anchors.set(testCase.id, row);
    sheet.getRange(`A${row}:B${row}`).merge();
    sheet.getRange(`C${row}:${endColumn}${row}`).merge();
    set(sheet, `A${row}`, `Case: ${caseIndex + 1}`);
    const displayedEvidenceDisposition = testCase.id === 'UAT-AUTH-001' ? 'REVIEW' : evidenceDispositionLabel(testCase.reviewDisposition);
    set(sheet, `C${row}`, `${displayedEvidenceDisposition} — ${summary}`);
    const summaryHeight = Math.min(360, Math.max(66, 18 + Math.ceil(summary.length / 65) * 18));
    sheet.getRange(`A${row}:${endColumn}${row}`).format.rowHeight = testCase.reviewDisposition === 'HELD_FOR_EXACT_HEAD_ACCEPTANCE' ? Math.max(90, summaryHeight) : summaryHeight;
    sheet.getRange(`A${row}:${endColumn}${row}`).format.wrapText = true;
    sheet.getRange(`A${row}:${endColumn}${row}`).format.font = { name: 'Times New Roman', size: 10 };
    sheet.getRange(`A${row}:${endColumn}${row}`).format.fill = '#BDD6EE';
    sheet.getRange(`A${row}:B${row}`).format.borders = { preset: 'outside', style: 'thin', color: '#000000' };
    sheet.getRange(`C${row}:${endColumn}${row}`).format.borders = { preset: 'outside', style: 'thin', color: '#000000' };
    row += 2;
    if (!displayedEvidence.length) {
      sheet.getRange(`C${row}:${endColumn}${row}`).merge();
      set(sheet, `C${row}`, testCase.id === 'UAT-AUTH-001'
        ? 'Source screenshot omitted from the submission because it contains unrelated runtime rows and does not prove the profile assertion. Details only; no positive result is claimed.'
        : 'No valid case-specific image evidence. Details only; no image or positive result is claimed.');
      sheet.getRange(`C${row}:${endColumn}${row}`).format.wrapText = true;
      sheet.getRange(`C${row}:${endColumn}${row}`).format.font = { name: 'Times New Roman', size: 10 };
      sheet.getRange(`C${row}:${endColumn}${row}`).format.rowHeight = 60;
      row += 2;
      continue;
    }
    for (const evidence of displayedEvidence) {
      const absolute = path.join(repoRoot, evidence.path);
      const bytes = await fs.readFile(absolute);
      const dimensions = imageSize(bytes);
      const widthPx = Math.min(300, dimensions.width || 300);
      const heightPx = Math.max(80, Math.round(widthPx * (dimensions.height || 400) / (dimensions.width || 720)));
      sheet.getRange(`C${row}:${endColumn}${row}`).merge();
      const visibleCaption = normalizeUatReviewText(evidence.caption, serialById);
      set(sheet, `C${row}`, `${evidence.reviewBlocked ? 'REVIEW BLOCKED — ' : 'LOCAL CANDIDATE EVIDENCE — '}${visibleCaption} — SHA-256 ${evidence.sha256}`);
      sheet.getRange(`C${row}:${endColumn}${row}`).format.rowHeight = 84;
      sheet.getRange(`C${row}:${endColumn}${row}`).format.wrapText = true;
      sheet.getRange(`C${row}:${endColumn}${row}`).format.font = { name: 'Times New Roman', size: 8 };
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
  const evidenceLayout = await addEvidenceBlocks(evidence, cases, 1, 'F', 1055, 'Z');
  const unitLinks = [];
  unit.getRange('B8:BR1084').unmerge();
  unit.getRange('B8:BR1084').clear();
  for (let index = 0; index < cases.length; index += 1) {
    const row = 8 + index;
    unit.getRange(`B${row}:BR${row}`).copyFrom(unit.getRange('B10:BR10'), 'all');
    unit.getRange(`B${row}:BR${row}`).clear();
    for (const range of [`B${row}:D${row}`, `E${row}:X${row}`, `Y${row}:AW${row}`, `AX${row}:BC${row}`, `BD${row}:BI${row}`, `BJ${row}:BK${row}`, `BL${row}:BR${row}`]) unit.getRange(range).merge();
    const item = cases[index];
    set(unit, `B${row}`, index + 1);
    unit.getRange(`B${row}:D${row}`).format.font = { size: 8 };
    set(unit, `E${row}`, safeFormulaText(`${item.title}\nPrecondition: ${item.preconditions}\nAction: ${compactUnitAction(item.steps)}`));
    unit.getRange(`E${row}:AW${row}`).format.wrapText = true;
    unit.getRange(`E${row}:X${row}`).format.font = { name: 'Times New Roman', size: 10 };
    set(unit, `Y${row}`, safeFormulaText(item.expected));
    set(unit, `AX${row}`, unitTesterLabel(item.reviewDisposition));
    set(unit, `BD${row}`, '');
    set(unit, `BJ${row}`, 'NOT RUN');
    unit.getRange(`BJ${row}:BK${row}`).format.font = { name: 'Times New Roman', size: 8 };
    set(unit, `BL${row}`, 'Evidence');
    unit.getRange(`BL${row}:BR${row}`).format.font = { color: '#0563C1', underline: true };
    for (const range of [`B${row}:D${row}`, `E${row}:X${row}`, `Y${row}:AW${row}`, `AX${row}:BC${row}`, `BD${row}:BI${row}`, `BJ${row}:BK${row}`, `BL${row}:BR${row}`]) {
      unit.getRange(range).format.borders = { preset: 'outside', style: 'thin', color: '#000000' };
    }
    unitLinks.push({ ref: `BL${row}`, location: `Evidence!A${evidenceLayout.anchors.get(item.id)}` });
    unit.getRange(`B${row}:BR${row}`).format.rowHeight = 108;
  }
  const cover = workbook.worksheets.getItem('Cover');
  const histories = workbook.worksheets.getItem('Histories');
  set(cover, 'N11', 'SAP CAP / Fiori'); set(cover, 'Z11', 'Issue and Defect Tracking System');
  set(cover, 'N12', 'IDTS-SAP01'); set(cover, 'N13', 'IDTS Unit Test');
  set(cover, 'N14', '08.08.2026'); set(cover, 'Z14', '08.08.2026');
  set(cover, 'U19', ''); set(cover, 'Z19', ''); set(cover, 'AE19', 'DonHV');
  set(histories, 'D3', 'OFFICIAL SUBMISSIONS authority retained for template structure only.');
  set(histories, 'F3', '08.08.2026'); set(histories, 'G3', 'Template authority');
  set(histories, 'C4', 'Candidate v0.5'); set(histories, 'D4', '188 catalog cases; visible results remain NOT RUN; evidence is subject to exact-hash approval.');
  set(histories, 'E4', 'UT / Evidence'); set(histories, 'F4', '08.08.2026'); set(histories, 'G4', 'DonHV — candidate compilation');
  histories.getRange('B2:G2').format.rowHeight = 30; histories.getRange('B3:G4').format.rowHeight = 48;
  set(unit, 'B3', 'IDTS-SAP01'); set(unit, 'L3', 'Issue and Defect Tracking System — Unit Test');
  set(unit, 'AO3', 'DonHV'); set(unit, 'AX3', '08.08.2026'); set(unit, 'BE3', ''); set(unit, 'BL3', '');
  await fs.mkdir(outputRoot, { recursive: true });
  await (await SpreadsheetFile.exportXlsx(workbook)).save(UNIT_OUTPUT);
  await restoreWorksheetPrintContracts(UNIT_AUTHORITY, UNIT_OUTPUT);
  await applyInternalHyperlinks(UNIT_OUTPUT, 'xl/worksheets/sheet3.xml', unitLinks);
  return { output: UNIT_OUTPUT, cases: cases.length, evidence: cases.reduce((sum, item) => sum + item.evidence.length, 0), evidenceLastRow: evidenceLayout.lastRow };
}

export async function generateUatCandidate() {
  await assertAuthority(UAT_AUTHORITY, UAT_SHA);
  const cases = await loadUatCases(repoRoot);
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(await sanitizedImportCopy(UAT_AUTHORITY)));
  const scenarios = workbook.worksheets.getItem('Test Scenario');
  const testCases = workbook.worksheets.getItem('Test Cases');
  const results = workbook.worksheets.getItem('Test Result');
  const evidenceLayout = await addEvidenceBlocks(results, cases, 1, 'F', 1429, 'Y');
  const uatLinks = [];
  const domains = [...new Set(cases.map((item) => item.area))];
  scenarios.getRange('E3:S3').unmerge();
  scenarios.getRange('E3:S3').clear();
  scenarios.getRange('A4:S1006').unmerge();
  scenarios.getRange('A4:S1006').clear();
  domains.forEach((domain, index) => {
    const row = 4 + index;
    set(scenarios, `A${row}`, index + 1);
    set(scenarios, `B${row}`, domain);
    set(scenarios, `C${row}`, 'IDTS application');
    set(scenarios, `D${row}`, 'N/A');
    set(scenarios, `E${row}`, `${domain} UAT cases`);
    scenarios.getRange(`A${row}:E${row}`).format.wrapText = true;
    scenarios.getRange(`A${row}:E${row}`).format.rowHeight = 60;
  });
  testCases.getRange('B8:CI1429').unmerge();
  testCases.getRange('B8:CI1429').clear();
  for (let index = 0; index < cases.length; index += 1) {
    const row = 8 + index;
    testCases.getRange(`B${row}:CI${row}`).copyFrom(testCases.getRange('B8:CI8'), 'all');
    testCases.getRange(`B${row}:CI${row}`).clear();
    for (const range of [`B${row}:D${row}`, `E${row}:X${row}`, `Y${row}:AO${row}`, `AP${row}:BN${row}`, `BO${row}:BT${row}`, `BU${row}:BZ${row}`, `CA${row}:CB${row}`, `CC${row}:CI${row}`]) testCases.getRange(range).merge();
    const item = cases[index];
    set(testCases, `B${row}`, index + 1);
    testCases.getRange(`B${row}:D${row}`).format.font = { size: 6 };
    set(testCases, `E${row}`, safeFormulaText(`${item.title}\nSteps:\n${item.steps}`));
    set(testCases, `Y${row}`, safeFormulaText(item.preconditions));
    set(testCases, `AP${row}`, safeFormulaText(item.expected));
    testCases.getRange(`E${row}:BN${row}`).format.wrapText = true;
    set(testCases, `BO${row}`, item.reviewDisposition === 'PREPARED' ? 'Pending' : 'NhanT candidate');
    set(testCases, `BU${row}`, '');
    const displayedDisposition = item.id === 'UAT-AUTH-001' ? 'REVIEW' : uatDisplayDisposition(item.reviewDisposition);
    set(testCases, `CA${row}`, displayedDisposition);
    testCases.getRange(`BO${row}:BZ${row}`).format.font = { name: 'Times New Roman', size: 8 };
    testCases.getRange(`CA${row}:CB${row}`).format.font = { name: 'Times New Roman', size: 8, bold: true };
    set(testCases, `CC${row}`, visibleEvidence(item).length ? 'Evidence' : 'Details');
    testCases.getRange(`CC${row}:CI${row}`).format.font = { name: 'Times New Roman', size: 9, color: '#0563C1', underline: true };
    for (const range of [`BO${row}:BT${row}`, `BU${row}:BZ${row}`, `CA${row}:CB${row}`, `CC${row}:CI${row}`]) {
      testCases.getRange(range).format.borders = { preset: 'outside', style: 'thin', color: '#000000' };
      testCases.getRange(range).format.horizontalAlignment = 'center';
      testCases.getRange(range).format.verticalAlignment = 'center';
    }
    uatLinks.push({ ref: `CC${row}`, location: `'Test Result'!A${evidenceLayout.anchors.get(item.id)}` });
    testCases.getRange(`B${row}:CI${row}`).format.rowHeight = 84;
  }
  set(testCases, 'BO6', 'Test Results'); set(testCases, 'BO7', 'Tester');
  set(testCases, 'BU7', 'Test Date'); set(testCases, 'CA7', 'Result'); set(testCases, 'CC6', 'Evidence');
  for (const range of ['BO6:CB6', 'BO7:BT7', 'BU7:BZ7', 'CA7:CB7', 'CC6:CI7']) {
    testCases.getRange(range).format.fill = '#BDD6EE';
    testCases.getRange(range).format.font = { name: 'Times New Roman', size: 12, bold: true };
    testCases.getRange(range).format.horizontalAlignment = 'center';
    testCases.getRange(range).format.verticalAlignment = 'center';
    testCases.getRange(range).format.borders = { preset: 'outside', style: 'thin', color: '#000000' };
  }
  const cover = workbook.worksheets.getItem('Cover');
  const histories = workbook.worksheets.getItem('Histories');
  set(cover, 'N11', 'SAP CAP / Fiori'); set(cover, 'Z11', 'Issue and Defect Tracking System');
  set(cover, 'N12', 'IDTS-SAP01'); set(cover, 'N13', 'IDTS User Acceptance Test');
  set(cover, 'N14', '08.08.2026'); set(cover, 'Z14', '08.08.2026');
  set(cover, 'U19', ''); set(cover, 'Z19', ''); set(cover, 'AE19', 'DonHV');
  set(histories, 'D3', 'OFFICIAL SUBMISSIONS authority retained for template structure only.');
  set(histories, 'F3', '08.08.2026'); set(histories, 'G3', 'Template authority');
  set(histories, 'C4', 'Candidate v0.3'); set(histories, 'D4', '90 catalog cases; review dispositions are candidate-only and not final UAT sign-off.');
  set(histories, 'E4', 'Test Scenario / Test Cases / Test Result'); set(histories, 'F4', '08.08.2026'); set(histories, 'G4', 'DonHV — candidate compilation');
  histories.getRange('B2:G2').format.rowHeight = 30; histories.getRange('B3:G4').format.rowHeight = 48;
  set(testCases, 'B3', 'Issue and Defect Management'); set(testCases, 'L3', 'End-to-end IDTS UAT');
  set(testCases, 'BF3', 'DonHV'); set(testCases, 'BO3', '08.08.2026'); set(testCases, 'BV3', ''); set(testCases, 'CC3', '');
  await fs.mkdir(outputRoot, { recursive: true });
  await (await SpreadsheetFile.exportXlsx(workbook)).save(UAT_OUTPUT);
  await restoreWorksheetPrintContracts(UAT_AUTHORITY, UAT_OUTPUT);
  await applyInternalHyperlinks(UAT_OUTPUT, 'xl/worksheets/sheet4.xml', uatLinks);
  return { output: UAT_OUTPUT, cases: cases.length, evidence: cases.reduce((sum, item) => sum + visibleEvidence(item).length, 0), evidenceLastRow: evidenceLayout.lastRow };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const unit = await generateUnitCandidate();
  console.log(JSON.stringify(unit));
  const uat = await generateUatCandidate();
  console.log(JSON.stringify(uat));
}
