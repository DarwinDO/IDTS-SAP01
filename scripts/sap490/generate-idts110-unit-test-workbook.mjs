#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const TASK_BASE = "2fc7c6e70ca2136e42a43ac9024878e41908f5b2";
const CREATED_DATE = "2026-09-06";
const DATA_START_ROW = 8;
const DATA_END_ROW = 285;
const EVIDENCE_START_ROW = 2;
const DATA_MERGES = ["B:D", "E:X", "Y:AW", "AX:BC", "BD:BI", "BJ:BK", "BL:BR"];
const CARD_RELATIVE_ROOT = "../../pm/evidence/idts-110/cards";

function parseArgs(argv) {
  return Object.fromEntries(argv.slice(2).map((arg) => {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    return match ? [match[1], match[2]] : [arg.replace(/^--/, ""), true];
  }));
}

function required(args, name) {
  const value = args[name];
  if (!value || typeof value !== "string") throw new Error(`Missing --${name}=...`);
  return value;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function clean(value) {
  return value == null ? "N/A" : String(value).trim() || "N/A";
}

function formatExecutionTime(iso) {
  if (!iso) return "N/A";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return date.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

function resultLabel(status, historical = false) {
  switch (status) {
    case "PASS": return "Candidate PASS";
    case "FAILED":
    case "FAIL": return "Failed";
    case "BLOCKED": return "Blocked";
    case "HELD": return "Held";
    case "MAPPING_ONLY_CANDIDATE": return "Mapping Only";
    case "MAPPING_ONLY": return "Mapping Only";
    case "NOT_RUN": return "Not Run";
    default: return historical ? "Not Run" : String(status || "Not Run");
  }
}

function historicalTestLabel(manifest) {
  const command = clean(manifest.testCommand);
  const commandMatch = command.match(/(?:node(?:\.exe)?|npm(?:\.cmd)?)\s+(?:run\s+)?([^\s]+\.js)/i);
  const file = commandMatch?.[1] || "historical suite";
  const assertions = [...(manifest.assertions || []), ...(manifest.sourceAssertions || [])]
    .map((item) => String(item).replace(/^.*#/, ""))
    .filter(Boolean);
  const label = assertions.length ? assertions[0] : "historical case evidence";
  return `${file} — ${label}${assertions.length > 1 ? ` (+${assertions.length - 1} checks)` : ""}`;
}

function caseText(caseDefinition, actual, limitation) {
  const steps = Array.isArray(caseDefinition.steps)
    ? caseDefinition.steps.map((step, index) => `${index + 1}. ${step}`).join(" ")
    : "N/A";
  return [
    clean(caseDefinition.objective || caseDefinition.title),
    `Precondition: ${clean(caseDefinition.preconditions)}`,
    `Input: ${clean(caseDefinition.input)}`,
    `Steps: ${steps}`
  ].join(" ");
}

function resultText(expected, actual, limitation) {
  if (clean(expected) === clean(actual)) {
    return [`Expected/actual: ${clean(actual)}`, `Limitation: ${clean(limitation)}`].join(" ");
  }
  return [
    `Expected: ${clean(expected)}`,
    `Actual: ${clean(actual)}`,
    `Limitation: ${clean(limitation)}`
  ].join(" ");
}

function cardFile(mentorNumber) {
  return `Case-${String(mentorNumber).padStart(3, "0")}.png`;
}

function escapeFormulaText(value) {
  return String(value).replaceAll('"', '""');
}

function cardFormula(mentorNumber) {
  return `=HYPERLINK("${escapeFormulaText(`${CARD_RELATIVE_ROOT}/${cardFile(mentorNumber)}`)}","Card")`;
}

function caseFormula(evidenceRow, mentorNumber) {
  return `=HYPERLINK("#Evidence!A${evidenceRow}","Case ${mentorNumber}")`;
}

async function loadHistoricalRecords(evidenceRoot, mapEntries, catalogByKey) {
  const existing = mapEntries.filter((entry) => entry.mentorNumber <= 188);
  const manifests = await Promise.all(existing.map(async (entry) => {
    const filePath = path.join(evidenceRoot, "cases", entry.internalCaseKey, "case-manifest.json");
    return { entry, manifest: await readJson(filePath) };
  }));
  return manifests.map(({ entry, manifest }) => {
    const definition = catalogByKey.get(entry.internalCaseKey);
    if (!definition) throw new Error(`Missing catalog definition for ${entry.internalCaseKey}`);
    const status = resultLabel(manifest.candidateExecutionStatus, true);
    const executedAt = manifest.executedAt || null;
    return {
      mentorNumber: entry.mentorNumber,
      caseKey: entry.internalCaseKey,
      definition,
      status,
      runId: `historical-${String(manifest.candidateExecutionStatus || "not-run").toLowerCase()}`,
      testFileLabel: historicalTestLabel(manifest),
      sourceBaselineSha: clean(manifest.baselineSha),
      deploySha: clean(manifest.deploySha),
      environment: clean(manifest.environment),
      executor: clean(manifest.executor),
      executedAt,
      actualResult: clean(manifest.actualResult),
      limitation: clean(manifest.limitations),
      evidenceKind: "HISTORICAL_CANDIDATE",
      artifactPath: path.join(evidenceRoot, "cases", entry.internalCaseKey, "result.png")
    };
  });
}

async function loadNewRecords(evidenceRoot, mapEntries, catalogByKey, aggregate) {
  const results = new Map((aggregate.results || []).map((result) => [result.caseKey, result]));
  const newEntries = mapEntries.filter((entry) => entry.mentorNumber > 188);
  const records = [];
  for (const entry of newEntries) {
    const definition = catalogByKey.get(entry.internalCaseKey);
    const result = results.get(entry.internalCaseKey);
    if (!definition || !result) throw new Error(`Missing new-case result or definition for ${entry.internalCaseKey}`);
    const manifestPath = path.join(evidenceRoot, "unit", entry.internalCaseKey, "case-manifest.json");
    await fs.access(manifestPath);
    const artifactName = result.evidenceKind === "UI_RUNTIME" ? "runtime.png" : "result.png";
    const artifactPath = path.join(evidenceRoot, "unit", entry.internalCaseKey, artifactName);
    await fs.access(artifactPath);
    records.push({
      mentorNumber: entry.mentorNumber,
      caseKey: entry.internalCaseKey,
      definition,
      status: resultLabel(result.status),
      runId: clean(aggregate.runId),
      testFileLabel: `${clean(result.testFile)} — ${clean(result.title)}`,
      sourceBaselineSha: clean(result.sourceBaselineSha),
      deploySha: clean(result.deployedSha),
      environment: clean(result.evidenceKind),
      executor: clean(result.executor),
      executedAt: result.completedAt || result.startedAt || null,
      actualResult: clean(result.actualResult),
      limitation: clean(result.limitation),
      evidenceKind: clean(result.evidenceKind),
      artifactPath
    });
  }
  return records;
}

function setMergedValue(sheet, address, value) {
  sheet.getRange(address).values = [[value]];
}

function applyNativeHyperlinks(outputPath, records) {
  const commands = [];
  for (const record of records) {
    const utRow = DATA_START_ROW + record.mentorNumber - 1;
    const evidenceRow = EVIDENCE_START_ROW + record.mentorNumber - 1;
    commands.push({
      command: "set",
      path: `/UT/BL${utRow}`,
      props: { link: `#Evidence!A${evidenceRow}`, display: `Case ${record.mentorNumber}` }
    });
    commands.push({
      command: "set",
      path: `/Evidence/K${evidenceRow}`,
      props: { link: `${CARD_RELATIVE_ROOT}/${cardFile(record.mentorNumber)}`, display: "Card" }
    });
  }
  const result = spawnSync("officecli", ["batch", outputPath, "--json"], {
    input: JSON.stringify(commands),
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`OfficeCLI native hyperlink patch failed: ${result.stderr || result.stdout}`);
}

function rawSet(outputPath, sheetName, xpath, action, xml) {
  const result = spawnSync("officecli", ["raw-set", outputPath, `/${sheetName}`, "--xpath", xpath, "--action", action, "--xml", xml], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024
  });
  if (result.error) throw result.error;
  return result;
}

function restoreTemplatePrintSetup(outputPath) {
  const setups = {
    Cover: {
      sheetPr: '<sheetPr><pageSetUpPr fitToPage="true" /></sheetPr>',
      margins: '<pageMargins left="0.39375" right="0.39375" top="0.7875" bottom="0.7875" header="0.511811023622047" footer="0" />',
      pageSetup: '<pageSetup paperSize="9" scale="100" fitToWidth="1" fitToHeight="1" pageOrder="downThenOver" orientation="landscape" blackAndWhite="false" draft="false" cellComments="none" horizontalDpi="300" verticalDpi="300" copies="1" />',
      printOptions: '<printOptions headings="false" gridLines="false" gridLinesSet="true" horizontalCentered="false" verticalCentered="false" />',
      headerFooter: '<headerFooter differentFirst="false" differentOddEven="false"><oddHeader></oddHeader><oddFooter>&amp;L&amp;F&amp;R&amp;P / </oddFooter></headerFooter>'
    },
    Histories: {
      sheetPr: '<sheetPr><pageSetUpPr fitToPage="true" /></sheetPr>',
      margins: '<pageMargins left="0.39375" right="0.39375" top="0.7875" bottom="0.7875" header="0.511811023622047" footer="0" />',
      pageSetup: '<pageSetup paperSize="9" scale="100" fitToWidth="1" fitToHeight="1" pageOrder="downThenOver" orientation="landscape" blackAndWhite="false" draft="false" cellComments="none" horizontalDpi="300" verticalDpi="300" copies="1" />',
      printOptions: '<printOptions headings="false" gridLines="false" gridLinesSet="true" horizontalCentered="false" verticalCentered="false" />',
      headerFooter: '<headerFooter differentFirst="false" differentOddEven="false"><oddHeader></oddHeader><oddFooter>&amp;L&amp;F&amp;R&amp;P / </oddFooter></headerFooter>'
    },
    UT: {
      sheetPr: '<sheetPr><pageSetUpPr fitToPage="true" /></sheetPr>',
      margins: '<pageMargins left="0.590277777777778" right="0.39375" top="0.590277777777778" bottom="0.590277777777778" header="0" footer="0" />',
      pageSetup: '<pageSetup paperSize="9" scale="100" fitToWidth="1" fitToHeight="0" pageOrder="downThenOver" orientation="landscape" blackAndWhite="false" draft="false" cellComments="none" horizontalDpi="300" verticalDpi="300" copies="1" />',
      printOptions: '<printOptions headings="false" gridLines="false" gridLinesSet="true" horizontalCentered="false" verticalCentered="false" />',
      headerFooter: '<headerFooter differentFirst="false" differentOddEven="false"><oddHeader>&amp;L文書ID：F400&amp;R単体テスト仕様書 - &amp;A</oddHeader><oddFooter>&amp;C&amp;P / </oddFooter></headerFooter>'
    },
    Evidence: {
      sheetPr: '<sheetPr><pageSetUpPr fitToPage="false" /></sheetPr>',
      margins: '<pageMargins left="0.747916666666667" right="0.747916666666667" top="0.984027777777778" bottom="0.984027777777778" header="0.511811023622047" footer="0.511811023622047" />',
      pageSetup: '<pageSetup paperSize="1" scale="100" fitToWidth="1" fitToHeight="1" pageOrder="downThenOver" orientation="portrait" blackAndWhite="false" draft="false" cellComments="none" horizontalDpi="300" verticalDpi="300" copies="1" />',
      printOptions: '<printOptions headings="false" gridLines="false" gridLinesSet="true" horizontalCentered="false" verticalCentered="false" />',
      headerFooter: '<headerFooter differentFirst="false" differentOddEven="false"><oddHeader></oddHeader><oddFooter></oddFooter></headerFooter>'
    }
  };
  for (const [sheetName, setup] of Object.entries(setups)) {
    const sheetPr = rawSet(outputPath, sheetName, "//x:sheetPr", "replace", setup.sheetPr);
    if (sheetPr.status !== 0) {
      const inserted = rawSet(outputPath, sheetName, "//x:sheetViews", "insertbefore", setup.sheetPr);
      if (inserted.status !== 0) throw new Error(`OfficeCLI sheet properties restoration failed for ${sheetName}: ${inserted.stderr || inserted.stdout}`);
    }
    const printOptions = rawSet(outputPath, sheetName, "//x:printOptions", "replace", setup.printOptions);
    if (printOptions.status !== 0) {
      const inserted = rawSet(outputPath, sheetName, "//x:pageMargins", "insertbefore", setup.printOptions);
      if (inserted.status !== 0) throw new Error(`OfficeCLI print-options restoration failed for ${sheetName}: ${inserted.stderr || inserted.stdout}`);
    }
    const margin = rawSet(outputPath, sheetName, "//x:pageMargins", "replace", setup.margins);
    if (margin.status !== 0) throw new Error(`OfficeCLI page-margin restoration failed for ${sheetName}: ${margin.stderr || margin.stdout}`);
    const pageSetup = rawSet(outputPath, sheetName, "//x:pageSetup", "replace", setup.pageSetup);
    if (pageSetup.status !== 0) {
      let inserted = rawSet(outputPath, sheetName, "//x:legacyDrawing", "insertbefore", setup.pageSetup);
      if (inserted.status !== 0) inserted = rawSet(outputPath, sheetName, "//x:worksheet", "append", setup.pageSetup);
      if (inserted.status !== 0) throw new Error(`OfficeCLI page-setup restoration failed for ${sheetName}: ${inserted.stderr || inserted.stdout}`);
    }
    const headerFooter = rawSet(outputPath, sheetName, "//x:headerFooter", "replace", setup.headerFooter);
    if (headerFooter.status !== 0) {
      let inserted = rawSet(outputPath, sheetName, "//x:pageSetup", "insertafter", setup.headerFooter);
      if (inserted.status !== 0) inserted = rawSet(outputPath, sheetName, "//x:worksheet", "append", setup.headerFooter);
      if (inserted.status !== 0) throw new Error(`OfficeCLI header/footer restoration failed for ${sheetName}: ${inserted.stderr || inserted.stdout}`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const templatePath = required(args, "template");
  const catalogPath = required(args, "catalog");
  const numberMapPath = required(args, "number-map");
  const resultsPath = required(args, "results");
  const evidenceRoot = required(args, "evidence-root");
  const outputPath = required(args, "output");

  const [catalog, numberMap, aggregate] = await Promise.all([
    readJson(catalogPath),
    readJson(numberMapPath),
    readJson(resultsPath)
  ]);
  if (!Array.isArray(catalog.cases) || catalog.cases.length !== 278) throw new Error("Catalog must contain exactly 278 cases");
  if (!Array.isArray(numberMap.entries) || numberMap.entries.length !== 278) throw new Error("Number map must contain exactly 278 entries");
  if (!Array.isArray(aggregate.results) || aggregate.results.length !== 90) throw new Error("Aggregate results must contain exactly 90 new-case results");

  const catalogByKey = new Map(catalog.cases.map((definition) => [definition.caseId, definition]));
  const keys = numberMap.entries.map((entry) => entry.internalCaseKey);
  const mentorNumbers = numberMap.entries.map((entry) => entry.mentorNumber);
  if (new Set(keys).size !== 278 || new Set(mentorNumbers).size !== 278 || mentorNumbers.some((number, index) => number !== index + 1)) {
    throw new Error("Number map must be a bijective 1..278 sequence");
  }
  for (const key of keys) if (!catalogByKey.has(key)) throw new Error(`Number map key absent from catalog: ${key}`);

  const historical = await loadHistoricalRecords(evidenceRoot, numberMap.entries, catalogByKey);
  const fresh = await loadNewRecords(evidenceRoot, numberMap.entries, catalogByKey, aggregate);
  const records = [...historical, ...fresh].sort((a, b) => a.mentorNumber - b.mentorNumber);
  if (records.length !== 278) throw new Error(`Expected 278 workbook records, got ${records.length}`);

  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(templatePath));
  const cover = workbook.worksheets.getItem("Cover");
  const histories = workbook.worksheets.getItem("Histories");
  const ut = workbook.worksheets.getItem("UT");
  const evidence = workbook.worksheets.getItem("Evidence");

  // Official cover geometry is retained; only the existing metadata cells are populated.
  setMergedValue(cover, "N11:T11", "IDTS-SAP490-UNIT");
  setMergedValue(cover, "Z11:AI11", "IDTS-110 atomic execution");
  setMergedValue(cover, "N12:AI12", "v0.5 candidate");
  setMergedValue(cover, "N13:AI13", "Atomic execution and workbook");
  setMergedValue(cover, "N14:T14", CREATED_DATE);
  setMergedValue(cover, "Z14:AI14", CREATED_DATE);
  setMergedValue(cover, "AE19:AI20", "Codex");

  // Keep the official history table and formulas; add a compact three-row candidate record.
  histories.getRange("B3:B3").values = [[1]];
  histories.getRange("C3:C6").values = [[0.5], [0.5], [0.5], [0.5]];
  histories.getRange("D3:D6").values = [
    ["IDTS-110 atomic execution; v0.5 candidate"],
    [`Source baseline: ${aggregate.sourceBaselineSha}`],
    [`Catalog SHA: ${aggregate.catalogSha}`],
    [`Approval PR #${aggregate.approvalReference?.pullRequest ?? 388}; merge ${aggregate.approvalReference?.mergeSha ?? aggregate.sourceBaselineSha}`]
  ];
  histories.getRange("E3:E6").values = [["UT"], ["UT"], ["UT"], ["UT"]];
  const createdDate = new Date(`${CREATED_DATE}T00:00:00Z`);
  histories.getRange("F3:F6").values = [[createdDate], [createdDate], [createdDate], [createdDate]];
  histories.getRange("F3:F6").format.numberFormat = "yyyy/mm/dd";
  histories.getRange("G3:G6").values = [["Codex"], [null], [null], [null]];
  histories.getRange("A3:Z6").format.rowHeight = 45;

  // Clone the official row-8 body style for every candidate row, then fill only the approved fields.
  const sourceBody = ut.getRange("A8:BV8");
  for (const record of records) {
    const row = DATA_START_ROW + record.mentorNumber - 1;
    if (row !== DATA_START_ROW) sourceBody.copyTo(ut.getRange(`A${row}:BV${row}`), "all");
    for (const merge of DATA_MERGES) {
      const [start, end] = merge.split(":");
      ut.mergeCells(`${start}${row}:${end}${row}`);
    }
    // The official row is a compact one-line row. A local 60pt body row keeps the required
    // requirement/result fields legible without changing columns, fonts, fills, or print setup.
    const expectedActualText = resultText(record.definition.expectedResult, record.actualResult, record.limitation);
    // Merged E:X cells cannot auto-fit in Excel. The full requirement/precondition/input/
    // numbered-step contract needs one bounded tall row so it remains readable at normal zoom.
    ut.getRange(`A${row}:BV${row}`).format.rowHeight = 380;
    setMergedValue(ut, `B${row}:D${row}`, String(record.mentorNumber));
    setMergedValue(ut, `E${row}`, caseText(record.definition, record.actualResult, record.limitation));
    setMergedValue(ut, `Y${row}:AW${row}`, expectedActualText);
    setMergedValue(ut, `AX${row}:BC${row}`, record.executor);
    setMergedValue(ut, `BD${row}:BI${row}`, formatExecutionTime(record.executedAt));
    setMergedValue(ut, `BJ${row}:BK${row}`, record.status);
    setMergedValue(ut, `BL${row}:BR${row}`, `Case ${record.mentorNumber}`);
    ut.getRange(`E${row}:X${row}`).format.wrapText = true;
    ut.getRange(`E${row}:X${row}`).format.verticalAlignment = "top";
    ut.getRange(`Y${row}:AW${row}`).format.wrapText = true;
    ut.getRange(`Y${row}:AW${row}`).format.verticalAlignment = "top";
    ut.getRange(`AX${row}:BC${row}`).format.wrapText = true;
    ut.getRange(`BD${row}:BI${row}`).format.wrapText = true;
    ut.getRange(`BJ${row}:BK${row}`).format.wrapText = true;
  }

  const headers = [[
    "Evidence ID",
    "Case",
    "Run ID",
    "Test file / assertion",
    "Source baseline",
    "Deploy SHA",
    "Environment / executor / time",
    "Result",
    "Actual result",
    "Limitation",
    "Artifact"
  ]];
  evidence.getRange("A1:K1").values = headers;
  evidence.getRange("A1:K1").format = {
    fill: "#BDD6EE",
    font: { name: "Times New Roman", size: 10, bold: true, color: "#000000" },
    wrapText: true,
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: { preset: "all", style: "thin", color: "#000000" }
  };
  evidence.getRange("A1:K1").format.rowHeight = 30;
  const evidenceRows = records.map((record) => {
    const evidenceId = `EVD-${String(record.mentorNumber).padStart(3, "0")}`;
    const environment = `${record.environment}; ${record.executor}; ${formatExecutionTime(record.executedAt)}`;
    return [
      evidenceId,
      `Case ${record.mentorNumber}`,
      record.runId,
      record.testFileLabel,
      record.sourceBaselineSha,
      record.deploySha,
      environment,
      record.status,
      record.actualResult,
      record.limitation,
      "Card"
    ];
  });
  evidence.getRange(`A${EVIDENCE_START_ROW}:K${EVIDENCE_START_ROW + records.length - 1}`).values = evidenceRows;
  const body = evidence.getRange(`A${EVIDENCE_START_ROW}:K${EVIDENCE_START_ROW + records.length - 1}`);
  body.format = {
    font: { name: "Times New Roman", size: 10, color: "#000000" },
    wrapText: true,
    verticalAlignment: "top",
    borders: { preset: "all", style: "thin", color: "#D9D9D9" }
  };
  body.format.rowHeight = 72;
  for (const [column, width] of [["A", 14], ["B", 10], ["C", 32], ["D", 52], ["E", 45], ["F", 18], ["G", 48], ["H", 18], ["I", 58], ["J", 58], ["K", 16]]) {
    evidence.getRange(`${column}1:${column}${EVIDENCE_START_ROW + records.length - 1}`).format.columnWidth = width;
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(outputPath);
  // artifact-tool intentionally owns workbook structure/style authoring. OfficeCLI's
  // native link attribute is applied after export because artifact-tool has no public
  // hyperlink setter and HYPERLINK formulas are not evaluated by OfficeCLI.
  applyNativeHyperlinks(outputPath, records);
  restoreTemplatePrintSetup(outputPath);
  await fs.rm(`${outputPath}.inspect.ndjson`, { force: true });
  console.log(JSON.stringify({
    output: outputPath,
    taskBase: TASK_BASE,
    sourceBaselineSha: aggregate.sourceBaselineSha,
    catalogSha: aggregate.catalogSha,
    cases: records.length,
    historical: historical.length,
    newResults: fresh.length,
    statuses: Object.fromEntries(records.reduce((map, record) => map.set(record.status, (map.get(record.status) || 0) + 1), new Map()))
  }, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
