import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const output = path.join(root, 'docs/pm/evidence/idts-110-111-workbook-candidates/rendered');
const jobs = [
  ['docs/sap490/generated/Unit_Test_IDTS_SAP01_en_candidate_v0.5.xlsx', 'UT', 'B1:X12', 'unit-ut-case-content.png'],
  ['docs/sap490/generated/Unit_Test_IDTS_SAP01_en_candidate_v0.5.xlsx', 'UT', 'Y1:BR12', 'unit-ut-results.png'],
  ['docs/sap490/generated/Unit_Test_IDTS_SAP01_en_candidate_v0.5.xlsx', 'Evidence', 'A1:N10', 'unit-evidence-first-block.png'],
  ['docs/sap490/generated/UAT_IDTS_SAP01_en_candidate_v0.3.xlsx', 'Test Cases', 'B1:AO12', 'uat-test-cases-content.png'],
  ['docs/sap490/generated/UAT_IDTS_SAP01_en_candidate_v0.3.xlsx', 'Test Cases', 'AP1:CI12', 'uat-test-cases-results.png'],
  ['docs/sap490/generated/UAT_IDTS_SAP01_en_candidate_v0.3.xlsx', 'Test Cases', 'B11:AO16', 'uat-test-cases-5-8-content.png'],
  ['docs/sap490/generated/UAT_IDTS_SAP01_en_candidate_v0.3.xlsx', 'Test Cases', 'AP11:CI16', 'uat-test-cases-5-8-results.png'],
  ['docs/sap490/generated/UAT_IDTS_SAP01_en_candidate_v0.3.xlsx', 'Test Result', 'A1:P10', 'uat-evidence-first-block.png']
];

await fs.mkdir(output, { recursive: true });
const cache = new Map();
for (const [relativeFile, sheetName, range, filename] of jobs) {
  if (!cache.has(relativeFile)) cache.set(relativeFile, await SpreadsheetFile.importXlsx(await FileBlob.load(path.join(root, relativeFile))));
  const blob = await cache.get(relativeFile).render({ sheetName, range, format: 'png', scale: 1 });
  await fs.writeFile(path.join(output, filename), new Uint8Array(await blob.arrayBuffer()));
  console.log(`${filename}: ${sheetName}!${range}`);
}
