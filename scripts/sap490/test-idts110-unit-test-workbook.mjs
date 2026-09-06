#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";
import JSZip from "jszip";

function parseArgs(argv) {
  return Object.fromEntries(argv.slice(2).map((arg) => {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    return match ? [match[1], match[2]] : [arg.replace(/^--/, ""), true];
  }));
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function parseOfficeJson(stdout) {
  const first = stdout.indexOf("{");
  const last = stdout.lastIndexOf("}");
  if (first < 0 || last < first) throw new Error(`OfficeCLI did not return JSON: ${stdout.slice(0, 300)}`);
  return JSON.parse(stdout.slice(first, last + 1));
}

function officeJson(args) {
  const result = spawnSync("officecli", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`officecli ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  return parseOfficeJson(result.stdout);
}

function decodeXml(value) {
  return String(value ?? "")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function xmlAttributes(text) {
  const attributes = {};
  for (const match of String(text || "").matchAll(/([A-Za-z_][\w:.-]*)="([^"]*)"/g)) {
    attributes[match[1]] = decodeXml(match[2]);
  }
  return attributes;
}

function xmlTagAttributes(xml, name) {
  const match = String(xml).match(new RegExp(`<(?:(?:[A-Za-z_][\\w.-]*):)?${name}\\b([^>]*)>`, "i"));
  return match ? xmlAttributes(match[1]) : null;
}

function xmlAllTagAttributes(xml, name) {
  const expression = new RegExp(`<(?:(?:[A-Za-z_][\\w.-]*):)?${name}\\b([^>]*)/?>`, "gi");
  return [...String(xml).matchAll(expression)].map((match) => xmlAttributes(match[1]));
}

function xmlInnerText(xml, name) {
  const match = String(xml).match(new RegExp(`<(?:(?:[A-Za-z_][\\w.-]*):)?${name}\\b[^>]*>([\\s\\S]*?)</(?:(?:[A-Za-z_][\\w.-]*):)?${name}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function normalizeContractValue(value) {
  if (value == null) return null;
  const text = String(value);
  if (text === "1" || text.toLowerCase() === "true") return true;
  if (text === "0" || text.toLowerCase() === "false") return false;
  return text;
}

function normalizeContractAttrs(value, keys = null) {
  const source = value || {};
  const selected = keys || Object.keys(source);
  return Object.fromEntries(selected
    .filter((key) => Object.prototype.hasOwnProperty.call(source, key))
    .sort()
    .map((key) => [key, normalizeContractValue(source[key])]));
}

function normalizeDefinedNames(names) {
  return (names || []).map((entry) => ({
    name: entry.name || "",
    body: String(entry.body || "").trim(),
    localSheetId: entry.localSheetId == null ? null : String(entry.localSheetId)
  })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function normalizeValidationContracts(entries) {
  return (entries || []).map((entry) => ({
    sqref: entry.sqref || "",
    type: entry.type || "",
    formula1: String(entry.formula1 || "")
  })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

async function readXlsxContract(filePath) {
  const zip = await JSZip.loadAsync(await fs.readFile(filePath));
  const workbookXml = await zip.file("xl/workbook.xml").async("string");
  const definedNames = [...workbookXml.matchAll(/<(?:(?:[A-Za-z_][\w.-]*):)?definedName\b([^>]*)>([\s\S]*?)<\/(?:(?:[A-Za-z_][\w.-]*):)?definedName>/gi)]
    .map((match) => ({ ...xmlAttributes(match[1]), body: decodeXml(match[2]) }));
  const sheets = [];
  for (let index = 1; index <= 4; index += 1) {
    const worksheetXml = await zip.file(`xl/worksheets/sheet${index}.xml`).async("string");
    const sheetPr = xmlTagAttributes(worksheetXml, "sheetPr") || {};
    const pageSetUpPr = xmlTagAttributes(xmlInnerText(worksheetXml, "sheetPr"), "pageSetUpPr") || xmlTagAttributes(worksheetXml, "pageSetUpPr") || {};
    const sheetView = xmlTagAttributes(worksheetXml, "sheetView") || {};
    const validations = [...worksheetXml.matchAll(/<(?:(?:[A-Za-z_][\w.-]*):)?dataValidation\b([^>]*)>([\s\S]*?)<\/(?:(?:[A-Za-z_][\w.-]*):)?dataValidation>/gi)]
      .map((match) => ({ ...xmlAttributes(match[1]), formula1: xmlInnerText(match[2], "formula1") }));
    sheets.push({
      index,
      dimension: xmlTagAttributes(worksheetXml, "dimension")?.ref || null,
      sheetFormatPr: xmlTagAttributes(worksheetXml, "sheetFormatPr") || {},
      sheetPr,
      pageSetUpPr,
      sheetView,
      columns: xmlAllTagAttributes(worksheetXml, "col"),
      rows: xmlAllTagAttributes(worksheetXml, "row"),
      merges: xmlAllTagAttributes(worksheetXml, "mergeCell").map((entry) => entry.ref).filter(Boolean).sort(),
      printOptions: xmlTagAttributes(worksheetXml, "printOptions") || {},
      pageMargins: xmlTagAttributes(worksheetXml, "pageMargins") || {},
      pageSetup: xmlTagAttributes(worksheetXml, "pageSetup") || {},
      headerFooter: xmlTagAttributes(worksheetXml, "headerFooter") || {},
      headerFooterValues: Object.fromEntries(["oddHeader", "oddFooter", "evenHeader", "evenFooter", "firstHeader", "firstFooter"].map((name) => [name, xmlInnerText(worksheetXml, name)])),
      validations,
      hasAutoFilter: /<(?:(?:[A-Za-z_][\w.-]*):)?autoFilter\b/i.test(worksheetXml),
      hasTableParts: /<(?:(?:[A-Za-z_][\w.-]*):)?tableParts\b/i.test(worksheetXml)
    });
  }
  return { definedNames, sheets };
}

function effectiveColumnWidth(sheet, columnNumberValue) {
  const matching = (sheet.columns || []).filter((entry) => columnNumberValue >= Number(entry.min) && columnNumberValue <= Number(entry.max));
  const width = matching.at(-1)?.width;
  return width == null ? Number(sheet.sheetFormatPr.defaultColWidth) : Number(width);
}

function effectiveRowHeight(sheet, rowNumber) {
  const matching = (sheet.rows || []).find((entry) => Number(entry.r) === rowNumber);
  return matching?.ht == null ? Number(sheet.sheetFormatPr.defaultRowHeight) : Number(matching.ht);
}

function expandRowSpec(spec) {
  const rows = [];
  for (const segment of String(spec).split(",")) {
    const [start, end = start] = segment.split(":").map(Number);
    rows.push({ start, end });
  }
  return rows;
}

function rowsForContract(sheetBaseline, limit = 1000) {
  const rows = new Set();
  for (const entry of sheetBaseline.rowHeights || []) {
    for (const range of expandRowSpec(entry.rows)) {
      rows.add(range.start);
      rows.add(Math.min(range.end, limit));
    }
  }
  return [...rows].filter((row) => row > 0 && row <= limit).sort((a, b) => a - b);
}

function expectedGeneratedMerges(baseline) {
  const header = (baseline.sheets.UT.merges || []).filter((ref) => {
    const match = ref.match(/(\d+)/);
    return match && Number(match[1]) < 8;
  });
  const pattern = baseline.contract.generatedGeometry.UT.mergePattern;
  const generated = [];
  for (let row = 8; row <= 285; row += 1) {
    for (const merge of pattern) {
      const [start, end] = merge.split(":");
      generated.push(`${start}${row}:${end}${row}`);
    }
  }
  return [...header, ...generated].sort();
}

function clean(value) {
  return value == null ? "" : String(value).trim();
}

function resultLabel(status) {
  switch (status) {
    case "PASS": return "Candidate PASS";
    case "FAIL":
    case "FAILED": return "Failed";
    case "BLOCKED": return "Blocked";
    case "HELD": return "Held";
    case "MAPPING_ONLY_CANDIDATE":
    case "MAPPING_ONLY": return "Mapping Only";
    case "NOT_RUN": return "Not Run";
    default: return clean(status) || "Not Run";
  }
}

function flattenTexts(values) {
  return values.flat(10).filter((value) => value != null).map((value) => String(value));
}

function issueSignature(issue) {
  return JSON.stringify({
    type: issue.type,
    subtype: issue.subtype || "",
    severity: issue.severity,
    path: issue.path,
    message: issue.message,
    context: issue.context || ""
  });
}

const HISTORY_BASE_ROW_HEIGHT = 19.5;
const HISTORY_CHARS_PER_LINE = 60;
const HISTORY_LINE_HEIGHT = 14.5;
const UT_MIN_ROW_HEIGHT = 14.25;
const UT_MAX_ROW_HEIGHT = 370;
const UT_TEST_CHARS_PER_LINE = 39;
const UT_RESULT_CHARS_PER_LINE = 58;
const UT_LINE_HEIGHT = 14.25;
const UT_ROW_PADDING = 10;

const DEFAULT_FIDELITY_POLICY = {
  contractVersion: 2,
  preserve_sheet_order: true,
  preserve_sheet_visibility: true,
  sheets: {
    Cover: { show_gridlines: false, preserve_page_setup: true, preserve_merges: true },
    Histories: { show_gridlines: false, preserve_page_setup: true, preserve_merges: true },
    UT: {
      show_gridlines: false,
      preserve_page_setup: true,
      preserve_merges: false,
      generated_merge_pattern: ["B:D", "E:X", "Y:AW", "AX:BC", "BD:BI", "BJ:BK", "BL:BR"]
    },
    Evidence: { show_gridlines: true, preserve_page_setup: true, preserve_merges: true }
  }
};

function normalizedText(value) {
  return clean(value).replace(/\s+/g, " ").trim();
}

function estimateWrappedLines(value, charsPerLine) {
  return Math.max(1, Math.ceil(normalizedText(value).length / charsPerLine));
}

function expectedUtRowHeight(requirement, expectedActual) {
  const lines = Math.max(
    2,
    estimateWrappedLines(requirement, UT_TEST_CHARS_PER_LINE),
    estimateWrappedLines(expectedActual, UT_RESULT_CHARS_PER_LINE)
  );
  return Math.min(UT_MAX_ROW_HEIGHT, Math.max(UT_MIN_ROW_HEIGHT, lines * UT_LINE_HEIGHT + UT_ROW_PADDING));
}

function expectedHistoryRowHeight(description) {
  const lines = Math.max(1, Math.ceil(normalizedText(description).length / HISTORY_CHARS_PER_LINE));
  return Math.max(HISTORY_BASE_ROW_HEIGHT, lines * HISTORY_LINE_HEIGHT);
}

function approximatelyEqual(actual, expected, tolerance = 0.1) {
  return Math.abs(Number(actual) - Number(expected)) <= tolerance;
}

function columnNumber(column) {
  return [...column].reduce((number, letter) => number * 26 + letter.charCodeAt(0) - 64, 0);
}

function columnName(number) {
  let result = "";
  for (let value = number; value > 0; value = Math.floor((value - 1) / 26)) {
    result = String.fromCharCode(65 + ((value - 1) % 26)) + result;
  }
  return result;
}

function expandColumnSpec(spec) {
  const [start, end = start] = spec.split(":");
  const first = columnNumber(start);
  const last = columnNumber(end);
  return Array.from({ length: last - first + 1 }, (_, index) => columnName(first + index));
}

function rowHeightFromBaseline(sheetBaseline, row) {
  for (const entry of sheetBaseline.rowHeights || []) {
    for (const segment of String(entry.rows).split(",")) {
      const [start, end = start] = segment.split(":").map(Number);
      if (row >= start && row <= end) return Number(entry.height);
    }
  }
  return Number(sheetBaseline.defaultRowHeight);
}

async function ensureFidelityPolicy(policyPath) {
  try {
    const current = await fs.readFile(policyPath, "utf8");
    if (current.includes('"contractVersion": 2')) return;
  } catch {
  }
  await fs.mkdir(path.dirname(policyPath), { recursive: true });
  await fs.writeFile(policyPath, `${JSON.stringify(DEFAULT_FIDELITY_POLICY, null, 2)}\n`, "utf8");
}

function runFidelityGate(templatePath, candidatePath, policyPath) {
  const fidelityScript = path.resolve(".agents/skills/idts-sap490-xlsx-fidelity/scripts/audit_xlsx_fidelity.py");
  const result = spawnSync("python", [
    fidelityScript,
    "validate",
    "--reference", path.resolve(templatePath),
    "--candidate", path.resolve(candidatePath),
    "--policy", path.resolve(policyPath)
  ], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.error) throw result.error;
  return {
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim()
  };
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fsSync.readFileSync(filePath)).digest("hex").toUpperCase();
}

function gitValue(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  return String(result.stdout || "").trim();
}

async function writeValidationReceipt(receiptPath, report, { templatePath, candidatePath, baselinePath, catalogPath, numberMapPath, resultsPath }) {
  const receipt = {
    kind: "idts-110-workbook-validation-receipt",
    schemaVersion: 1,
    reviewedHead: gitValue(["rev-parse", "HEAD"]),
    worktreeClean: gitValue(["status", "--porcelain"]) === "",
    validatorSha256: sha256(path.resolve(process.argv[1])),
    candidate: { fileSha256: sha256(candidatePath) },
    template: { fileSha256: sha256(templatePath) },
    inputs: {
      baselineSha256: sha256(baselinePath),
      catalogSha256: sha256(catalogPath),
      numberMapSha256: sha256(numberMapPath),
      resultsSha256: sha256(resultsPath)
    },
    statuses: report.statuses,
    hyperlinks: report.hyperlinks,
    officeCli: { ...report.officeCli, validation: "PASS" },
    fidelity: { status: "PASS", output: report.fidelity.stdout },
    findings: report.findings
  };
  await fs.mkdir(path.dirname(receiptPath), { recursive: true });
  await fs.writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
}

function assertLayoutContract(baseline, templateWorkbook, candidateWorkbook, findings) {
  const sheetNames = ["Cover", "Histories", "UT"];
  const sampleRows = {
    Cover: [1, 2, 8, 11, 14, 18, 19, 20, 25],
    Histories: [1, 2, 3, 4, 5, 6, 7, 10],
    UT: [1, 2, 3, 6, 7, 8, 9, 14, 15, 16, 285, 958]
  };

  for (const sheetName of sheetNames) {
    const sheetBaseline = baseline.sheets[sheetName];
    const templateSheet = templateWorkbook.worksheets.getItem(sheetName);
    const candidateSheet = candidateWorkbook.worksheets.getItem(sheetName);

    for (const widthEntry of sheetBaseline.columnWidths || []) {
      for (const column of expandColumnSpec(widthEntry.columns)) {
        const templateWidth = templateSheet.getRange(`${column}1`).format.columnWidth;
        const candidateWidth = candidateSheet.getRange(`${column}1`).format.columnWidth;
        if (!approximatelyEqual(candidateWidth, templateWidth)) {
          findings.push({
            code: "candidate-column-width-drift",
            message: `${sheetName}!${column} column width drifted from frozen baseline`,
            details: { expected: templateWidth, actual: candidateWidth, recordedBaseline: Number(widthEntry.width) }
          });
        }
      }
    }

    for (const row of sampleRows[sheetName]) {
      const expectedTemplateHeight = rowHeightFromBaseline(sheetBaseline, row);
      const templateHeight = templateSheet.getRange(`A${row}:BV${row}`).format.rowHeight;
      if (!approximatelyEqual(templateHeight, expectedTemplateHeight)) {
        findings.push({
          code: "template-row-height-contract",
          message: `${sheetName} row ${row} template height differs from frozen baseline`,
          details: { expected: expectedTemplateHeight, actual: templateHeight }
        });
      }
      if (sheetName === "Histories" && row >= 3 && row <= 6) {
        const description = candidateSheet.getRange(`D${row}`).values[0][0];
        const expectedCandidateHeight = expectedHistoryRowHeight(description);
        const candidateHeight = candidateSheet.getRange(`A${row}:Z${row}`).format.rowHeight;
        if (!approximatelyEqual(candidateHeight, expectedCandidateHeight)) {
          findings.push({
            code: "history-row-height-drift",
            message: `Histories row ${row} is not the bounded content-derived height`,
            details: { expected: expectedCandidateHeight, actual: candidateHeight }
          });
        }
      } else if (sheetName === "UT" && row >= 8 && row <= 285) {
        const requirement = candidateSheet.getRange(`E${row}`).values[0][0];
        const expectedActual = candidateSheet.getRange(`Y${row}`).values[0][0];
        const expectedCandidateHeight = expectedUtRowHeight(requirement, expectedActual);
        const candidateHeight = candidateSheet.getRange(`A${row}:BV${row}`).format.rowHeight;
        if (!approximatelyEqual(candidateHeight, expectedCandidateHeight)) {
          findings.push({
            code: "ut-row-height-drift",
            message: `UT row ${row} is not the bounded content-derived height`,
            details: { expected: expectedCandidateHeight, actual: candidateHeight }
          });
        }
        if (candidateHeight > UT_MAX_ROW_HEIGHT) {
          findings.push({
            code: "ut-row-height-bound",
            message: `UT row ${row} exceeds the bounded content-height exception`,
            details: { max: UT_MAX_ROW_HEIGHT, actual: candidateHeight }
          });
        }
      } else {
        const candidateHeight = candidateSheet.getRange(`A${row}:BV${row}`).format.rowHeight;
        if (!approximatelyEqual(candidateHeight, expectedTemplateHeight)) {
          findings.push({
            code: "candidate-row-height-drift",
            message: `${sheetName} row ${row} height drifted from frozen baseline`,
            details: { expected: expectedTemplateHeight, actual: candidateHeight }
          });
        }
      }
    }

    if (sheetName === "UT") {
      const driftRows = [];
      for (let row = 8; row <= 285; row += 1) {
        const requirement = candidateSheet.getRange(`E${row}`).values[0][0];
        const expectedActual = candidateSheet.getRange(`Y${row}`).values[0][0];
        const expectedCandidateHeight = expectedUtRowHeight(requirement, expectedActual);
        const candidateHeight = candidateSheet.getRange(`A${row}:BV${row}`).format.rowHeight;
        if (!approximatelyEqual(candidateHeight, expectedCandidateHeight) || candidateHeight > UT_MAX_ROW_HEIGHT) {
          driftRows.push({ row, expected: expectedCandidateHeight, actual: candidateHeight });
        }
      }
      if (driftRows.length) {
        findings.push({
          code: "ut-row-height-all-cases",
          message: "UT rows must use the bounded content-derived layout exception",
          details: { count: driftRows.length, samples: driftRows.slice(0, 5) }
        });
      }
    }
  }
}

function assertEqualContract(findings, code, message, expected, actual) {
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    findings.push({ code, message, details: { expected, actual } });
  }
}

function assertPackageContract(baseline, templatePackage, candidatePackage, candidateWorkbook, findings) {
  const sheetNames = ["Cover", "Histories", "UT", "Evidence"];
  const generated = baseline.contract.generatedGeometry;
  const pageSetupFields = ["paperSize", "scale", "fitToWidth", "fitToHeight", "pageOrder", "orientation", "blackAndWhite", "draft", "cellComments", "horizontalDpi", "verticalDpi", "copies"];
  const marginFields = ["left", "right", "top", "bottom", "header", "footer"];
  const printOptionFields = ["headings", "gridLines", "gridLinesSet", "horizontalCentered", "verticalCentered"];
  const sheetPrFields = ["filterMode"];
  const pageSetUpPrFields = ["fitToPage"];
  const headerFooterFields = ["differentOddEven", "differentFirst", "alignWithMargins", "scaleWithDoc"];

  for (let index = 0; index < sheetNames.length; index += 1) {
    const sheetName = sheetNames[index];
    const sheetBaseline = baseline.sheets[sheetName];
    const templateSheet = templatePackage.sheets[index];
    const candidateSheet = candidatePackage.sheets[index];
    const generatedSheet = generated[sheetName];
    const expectedDimension = generatedSheet?.dimension || sheetBaseline.dimension;
    if (candidateSheet.dimension !== expectedDimension) {
      findings.push({ code: "dimension-contract", message: `${sheetName} dimension drifted from the frozen/generated contract`, details: { expected: expectedDimension, actual: candidateSheet.dimension } });
    }
    const expectedDefaultColumnWidth = Number(sheetBaseline.defaultColumnWidth);
    const expectedDefaultRowHeight = Number(sheetBaseline.defaultRowHeight);
    if (!approximatelyEqual(Number(candidateSheet.sheetFormatPr.defaultColWidth), expectedDefaultColumnWidth)) {
      findings.push({ code: "default-column-width", message: `${sheetName} default column width drifted`, details: { expected: expectedDefaultColumnWidth, actual: candidateSheet.sheetFormatPr.defaultColWidth } });
    }
    if (!approximatelyEqual(Number(candidateSheet.sheetFormatPr.defaultRowHeight), expectedDefaultRowHeight)) {
      findings.push({ code: "default-row-height", message: `${sheetName} default row height drifted`, details: { expected: expectedDefaultRowHeight, actual: candidateSheet.sheetFormatPr.defaultRowHeight } });
    }
    if (normalizeContractValue(candidateSheet.sheetView.showGridLines) !== normalizeContractValue(String(sheetBaseline.showGridLines))) {
      findings.push({ code: "gridlines-contract", message: `${sheetName} gridline state drifted in package metadata`, details: { expected: sheetBaseline.showGridLines, actual: candidateSheet.sheetView.showGridLines } });
    }
    if (candidateSheet.hasAutoFilter || candidateSheet.hasTableParts) {
      findings.push({ code: "filter-table-contract", message: `${sheetName} contains an unauthorized AutoFilter or table part` });
    }

    const widthRanges = generatedSheet?.columnWidths || sheetBaseline.columnWidths || [];
    for (const widthEntry of widthRanges) {
      for (const column of expandColumnSpec(widthEntry.columns)) {
        const columnNumberValue = columnNumber(column);
        const expectedWidth = sheetName === "Evidence" ? Number(widthEntry.width) : effectiveColumnWidth(templateSheet, columnNumberValue);
        const actualWidth = effectiveColumnWidth(candidateSheet, columnNumberValue);
        if (!approximatelyEqual(actualWidth, expectedWidth)) {
          findings.push({ code: "column-width-contract", message: `${sheetName}!${column} width drifted`, details: { expected: expectedWidth, actual: actualWidth } });
        }
      }
    }

    if (Array.isArray(generatedSheet?.rows)) {
      for (const rowEntry of generatedSheet.rows) {
        for (const range of expandRowSpec(rowEntry.rows)) {
          for (let row = range.start; row <= range.end; row += 1) {
            const actualHeight = effectiveRowHeight(candidateSheet, row);
            if (!approximatelyEqual(actualHeight, Number(rowEntry.height))) {
              findings.push({ code: "generated-row-height-contract", message: `${sheetName} row ${row} height drifted`, details: { expected: Number(rowEntry.height), actual: actualHeight } });
            }
          }
        }
      }
    } else {
      for (const row of rowsForContract(sheetBaseline, 1048576)) {
        if (sheetName === "Histories" && row >= 3 && row <= 6) continue;
        if (sheetName === "UT" && row >= 8 && row <= 285) continue;
        const expectedHeight = effectiveRowHeight(templateSheet, row);
        const actualHeight = effectiveRowHeight(candidateSheet, row);
        if (!approximatelyEqual(actualHeight, expectedHeight)) {
          findings.push({ code: "row-height-contract", message: `${sheetName} row ${row} height drifted`, details: { expected: expectedHeight, actual: actualHeight } });
        }
      }
      if (sheetName === "UT") {
        const heightRule = generated.UT.heightRule;
        const missingRows = [];
        for (let row = 8; row <= 285; row += 1) {
          const explicit = candidateSheet.rows.some((entry) => Number(entry.r) === row);
          const actualHeight = effectiveRowHeight(candidateSheet, row);
          if (!explicit || actualHeight < Number(heightRule.min) || actualHeight > Number(heightRule.max)) missingRows.push({ row, explicit, actualHeight });
        }
        if (missingRows.length) findings.push({ code: "generated-ut-row-contract", message: "UT generated rows do not all have bounded explicit geometry", details: { count: missingRows.length, samples: missingRows.slice(0, 5) } });
      }
    }

    const expectedMerges = sheetName === "UT" ? expectedGeneratedMerges(baseline) : [...(sheetBaseline.merges || [])].sort();
    assertEqualContract(findings, "merge-contract", `${sheetName} merge contract drifted`, expectedMerges, candidateSheet.merges);

    for (const field of pageSetupFields) {
      if (normalizeContractValue(candidateSheet.pageSetup[field]) !== normalizeContractValue(templateSheet.pageSetup[field])) {
        findings.push({ code: "page-setup-contract", message: `${sheetName} pageSetup.${field} drifted`, details: { expected: templateSheet.pageSetup[field], actual: candidateSheet.pageSetup[field] } });
      }
    }
    for (const field of marginFields) {
      if (!approximatelyEqual(Number(candidateSheet.pageMargins[field]), Number(templateSheet.pageMargins[field]))) {
        findings.push({ code: "page-margin-contract", message: `${sheetName} page margin ${field} drifted`, details: { expected: templateSheet.pageMargins[field], actual: candidateSheet.pageMargins[field] } });
      }
    }
    for (const field of printOptionFields) {
      if (normalizeContractValue(candidateSheet.printOptions[field]) !== normalizeContractValue(templateSheet.printOptions[field])) {
        findings.push({ code: "print-options-contract", message: `${sheetName} printOptions.${field} drifted`, details: { expected: templateSheet.printOptions[field], actual: candidateSheet.printOptions[field] } });
      }
    }
    for (const field of sheetPrFields) {
      if (normalizeContractValue(candidateSheet.sheetPr[field]) !== normalizeContractValue(templateSheet.sheetPr[field])) {
        findings.push({ code: "sheet-properties-contract", message: `${sheetName} sheetPr.${field} drifted`, details: { expected: templateSheet.sheetPr[field], actual: candidateSheet.sheetPr[field] } });
      }
    }
    for (const field of pageSetUpPrFields) {
      if (normalizeContractValue(candidateSheet.pageSetUpPr[field]) !== normalizeContractValue(templateSheet.pageSetUpPr[field])) {
        findings.push({ code: "page-setup-properties-contract", message: `${sheetName} pageSetUpPr.${field} drifted`, details: { expected: templateSheet.pageSetUpPr[field], actual: candidateSheet.pageSetUpPr[field] } });
      }
    }
    for (const field of headerFooterFields) {
      if (normalizeContractValue(candidateSheet.headerFooter[field]) !== normalizeContractValue(templateSheet.headerFooter[field])) {
        findings.push({ code: "header-footer-contract", message: `${sheetName} headerFooter.${field} drifted`, details: { expected: templateSheet.headerFooter[field], actual: candidateSheet.headerFooter[field] } });
      }
    }
    assertEqualContract(findings, "header-footer-values", `${sheetName} header/footer text drifted`, templateSheet.headerFooterValues, candidateSheet.headerFooterValues);
  }

  assertEqualContract(findings, "defined-names-contract", "Defined-name set or formulas drifted from the frozen authority baseline", normalizeDefinedNames(baseline.definedNames), normalizeDefinedNames(candidatePackage.definedNames));
  const expectedValidations = baseline.contract.validationContracts;
  for (const sheetName of ["UT", "Evidence"]) {
    const sheet = candidatePackage.sheets[sheetNames.indexOf(sheetName)];
    assertEqualContract(findings, "validation-contract", `${sheetName} validation ranges/formulas drifted`, normalizeValidationContracts(expectedValidations[sheetName]), normalizeValidationContracts(sheet.validations));
  }
}

async function assertStyleContract(baseline, templatePath, candidatePath, findings) {
  const styleContract = baseline.contract.styleInvariants;
  for (const [sheetName, config] of Object.entries(styleContract)) {
    const rangeStart = config.anchors[0];
    const rangeEnd = config.anchors.at(-1);
    const templateChildren = officeJson(["get", templatePath, `/${sheetName}/${rangeStart}:${rangeEnd}`, "--depth", "0", "--json"]).data.results[0].children || [];
    const candidateChildren = officeJson(["get", candidatePath, `/${sheetName}/${rangeStart}:${rangeEnd}`, "--depth", "0", "--json"]).data.results[0].children || [];
    const templateByPath = new Map(templateChildren.map((cell) => [cell.path, cell.format || {}]));
    const candidateByPath = new Map(candidateChildren.map((cell) => [cell.path, cell.format || {}]));
    for (const anchor of config.anchors) {
      const key = `/${sheetName}/${anchor}`;
      const expected = templateByPath.get(key) || {};
      const actual = candidateByPath.get(key) || {};
      const normalizeStyleField = (field, value) => {
        if (value == null && field === "protection.locked") return true;
        if (value == null && field === "protection.hidden") return false;
        return normalizeContractValue(value);
      };
      const expectedFields = Object.fromEntries(config.fields.map((field) => [field, normalizeStyleField(field, expected[field])]));
      const actualFields = Object.fromEntries(config.fields.map((field) => [field, normalizeStyleField(field, actual[field])]));
      if (JSON.stringify(expectedFields) !== JSON.stringify(actualFields)) {
        findings.push({ code: "style-invariant-contract", message: `${sheetName}!${anchor} cloned-row style drifted`, details: { expected: expectedFields, actual: actualFields } });
      }
    }
  }
}

function assertNoFindings(findings, report) {
  report.findings = findings;
  console.log(JSON.stringify(report, null, 2));
  if (findings.length) process.exitCode = 1;
}

const args = parseArgs(process.argv);
if (!args.candidate) throw new Error("Usage: --template=... --candidate=... --baseline=...");
try {
  await fs.access(args.candidate);
} catch {
  console.error(`EXPECTED RED: candidate workbook is missing: ${args.candidate}`);
  process.exitCode = 1;
  process.exit();
}

const templatePath = args.template;
const candidatePath = args.candidate;
const baselinePath = args.baseline;
const catalogPath = args.catalog || "docs/qa/idts-110-unit-test-catalog.json";
const numberMapPath = args["number-map"] || "docs/qa/idts-110-case-number-map.json";
const resultsPath = args.results || ".tmp/idts-110/all-results.json";
const evidenceRoot = args["evidence-root"] || "docs/pm/evidence/idts-110";
const fidelityPolicyPath = args["fidelity-policy"] || ".tmp/idts-110/unit-test-policy.json";
const findings = [];
const report = {
  candidate: candidatePath,
  template: templatePath,
  baseline: baselinePath,
  expected: { sheets: ["Cover", "Histories", "UT", "Evidence"], cases: 278 },
  officeCli: { introducedIssues: [], baselineIssues: 0, candidateIssues: 0 },
  statuses: {},
  hyperlinks: { ut: 0, evidence: 0 },
  fidelity: null,
  findings
};
const fail = (code, message, details = undefined) => findings.push({ code, message, ...(details ? { details } : {}) });

try {
  const [baseline, catalog, numberMap, aggregate] = await Promise.all([
    readJson(baselinePath),
    readJson(catalogPath),
    readJson(numberMapPath),
    readJson(resultsPath)
  ]);
  await ensureFidelityPolicy(fidelityPolicyPath);
  const templateWorkbook = await SpreadsheetFile.importXlsx(await FileBlob.load(templatePath));
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(candidatePath));
  const [templatePackage, candidatePackage] = await Promise.all([
    readXlsxContract(templatePath),
    readXlsxContract(candidatePath)
  ]);
  const sheetNames = workbook.worksheets.items.map((sheet) => sheet.name);
  try { assert.deepEqual(sheetNames, ["Cover", "Histories", "UT", "Evidence"]); } catch { fail("sheet-order", "Candidate sheets do not match the official four-sheet order", sheetNames); }
  const cover = workbook.worksheets.getItem("Cover");
  const histories = workbook.worksheets.getItem("Histories");
  const ut = workbook.worksheets.getItem("UT");
  const evidence = workbook.worksheets.getItem("Evidence");
  const expectedGridlines = { Cover: false, Histories: false, UT: false, Evidence: true };
  for (const sheet of workbook.worksheets.items) if (sheet.showGridLines !== expectedGridlines[sheet.name]) fail("gridlines", `${sheet.name} gridline state drifted`, sheet.showGridLines);
  for (const sheet of workbook.worksheets.items) if (sheet.tables?.items?.length || sheet.autoFilter) fail("autofilter", `${sheet.name} has an unauthorized table or AutoFilter`);
  if (ut.dataValidations?.items?.length !== 1) fail("validation", "Official UT data validation was not preserved");
  if (evidence.dataValidations?.items?.length) fail("validation", "Evidence has an unexpected data validation");

  const definitions = new Map(catalog.cases.map((definition) => [definition.caseId, definition]));
  const mapEntries = numberMap.entries;
  if (catalog.cases.length !== 278) fail("catalog-count", "Catalog is not 278 cases", catalog.cases.length);
  if (mapEntries.length !== 278) fail("map-count", "Number map is not 278 entries", mapEntries.length);
  const internalKeys = mapEntries.map((entry) => entry.internalCaseKey);
  const mentorNumbers = mapEntries.map((entry) => entry.mentorNumber);
  if (new Set(internalKeys).size !== 278) fail("map-unique", "Number map contains duplicate internal keys");
  if (mentorNumbers.some((number, index) => number !== index + 1) || new Set(mentorNumbers).size !== 278) fail("map-sequence", "Visible mentor numbers are not a unique 1..278 sequence");
  for (const key of internalKeys) if (!definitions.has(key)) fail("catalog-key", `Number map key absent from catalog: ${key}`);

  const historicalManifests = new Map();
  for (const entry of mapEntries.filter((item) => item.mentorNumber <= 188)) {
    historicalManifests.set(entry.internalCaseKey, await readJson(path.join(evidenceRoot, "cases", entry.internalCaseKey, "case-manifest.json")));
  }
  const resultByKey = new Map((aggregate.results || []).map((result) => [result.caseKey, result]));
  const expectedLabels = new Map();
  for (const entry of mapEntries) {
    if (entry.mentorNumber <= 188) expectedLabels.set(entry.mentorNumber, resultLabel(historicalManifests.get(entry.internalCaseKey)?.candidateExecutionStatus));
    else expectedLabels.set(entry.mentorNumber, resultLabel(resultByKey.get(entry.internalCaseKey)?.status));
  }
  const expectedStatusCounts = Object.fromEntries([...expectedLabels.values()].reduce((counts, label) => counts.set(label, (counts.get(label) || 0) + 1), new Map()));

  const utNumbers = ut.getRange("B8:B285").values.flat().map((value) => Number(value));
  const evidenceNumbers = evidence.getRange("B2:B279").values.flat().map((value) => Number(String(value).replace(/^Case\s+/, "")));
  const expectedNumbers = Array.from({ length: 278 }, (_, index) => index + 1);
  try { assert.deepEqual(utNumbers, expectedNumbers); } catch { fail("ut-numbers", "UT visible case numbers are not exactly 1..278", { first: utNumbers.slice(0, 5), last: utNumbers.slice(-5) }); }
  try { assert.deepEqual(evidenceNumbers, expectedNumbers); } catch { fail("evidence-numbers", "Evidence case numbers are not exactly 1..278"); }
  if (new Set(utNumbers).size !== 278 || new Set(evidenceNumbers).size !== 278) fail("duplicate-numbers", "Visible case numbers are not unique");

  const utStatuses = ut.getRange("BJ8:BJ285").values.flat().map(clean);
  const evidenceStatuses = evidence.getRange("H2:H279").values.flat().map(clean);
  const allowedLabels = new Set(["Candidate PASS", "Passed", "Failed", "Blocked", "Held", "Mapping Only", "Not Run"]);
  for (const label of [...utStatuses, ...evidenceStatuses]) if (!allowedLabels.has(label)) fail("status-label", `Unauthorized result label: ${label}`);
  report.statuses = Object.fromEntries(utStatuses.reduce((counts, label) => counts.set(label, (counts.get(label) || 0) + 1), new Map()));
  if (JSON.stringify(report.statuses) !== JSON.stringify(expectedStatusCounts)) fail("truthful-status", "Workbook status labels do not match result/manifests", { expected: expectedStatusCounts, actual: report.statuses });
  try { assert.deepEqual(utStatuses, evidenceStatuses); } catch { fail("status-parity", "UT and Evidence status labels differ"); }
  for (let index = 0; index < 278; index += 1) {
    const expectedLabel = expectedLabels.get(index + 1);
    if (utStatuses[index] !== expectedLabel) {
      fail("truthful-status-case", `UT Case ${index + 1} has the wrong result label`, { expected: expectedLabel, actual: utStatuses[index] });
    }
    if (evidenceStatuses[index] !== expectedLabel) {
      fail("truthful-status-case", `Evidence Case ${index + 1} has the wrong result label`, { expected: expectedLabel, actual: evidenceStatuses[index] });
    }
  }

  assertLayoutContract(baseline, templateWorkbook, workbook, findings);
  assertPackageContract(baseline, templatePackage, candidatePackage, workbook, findings);
  await assertStyleContract(baseline, templatePath, candidatePath, findings);
  report.fidelity = runFidelityGate(templatePath, candidatePath, fidelityPolicyPath);
  if (report.fidelity.status !== 0 || !report.fidelity.stdout.includes("PASS: XLSX structure and critical-range fidelity policy satisfied")) {
    fail("fidelity-policy", "Template fidelity policy did not pass", report.fidelity);
  }

  const visibleValues = [
    ...flattenTexts(cover.getRange("A1:AQ25").values),
    ...flattenTexts(histories.getRange("A1:G10").values),
    ...flattenTexts(ut.getRange("A1:BR285").values),
    ...flattenTexts(evidence.getRange("A1:K279").values)
  ];
  const visibleText = visibleValues.join("\n");
  const leakedKey = internalKeys.find((key) => visibleText.includes(key));
  if (leakedKey) fail("internal-key-leak", `Technical case key is visible in workbook text: ${leakedKey}`);
  if (visibleText.includes("--idts110-case=")) fail("selector-leak", "Raw internal selector command is visible in workbook text");
  const unauthorizedVietnamese = visibleValues.find((value) => /[À-ỹĐđ]/.test(value));
  if (unauthorizedVietnamese) fail("language", `Unauthorized Vietnamese submission text is visible: ${unauthorizedVietnamese.slice(0, 120)}`);

  const requiredCover = {
    "N11:T11": "IDTS-SAP490-UNIT",
    "Z11:AI11": "IDTS-110 atomic execution",
    "N12:AI12": "v0.5 candidate",
    "N13:AI13": "Atomic execution and workbook",
    "N14:T14": "2026-09-06",
    "Z14:AI14": "2026-09-06",
    "AE19:AI20": "Codex"
  };
  for (const [range, expected] of Object.entries(requiredCover)) if (!clean(cover.getRange(range).values[0][0]).includes(expected)) fail("cover", `${range} does not contain the required value`, cover.getRange(range).values[0][0]);
  const historyText = flattenTexts(histories.getRange("D3:D6").values).join(" ");
  for (const expected of [aggregate.sourceBaselineSha, aggregate.catalogSha, `PR #${aggregate.approvalReference?.pullRequest ?? 388}`, "v0.5 candidate"]) if (!historyText.includes(expected)) fail("history", `Histories is missing ${expected}`);
  if (clean(cover.getRange("U19:Y20").values[0][0]) || clean(cover.getRange("Z19:AD20").values[0][0])) fail("approval-fields", "Approver/reviewer fields must remain blank");

  for (let index = 0; index < 278; index += 1) {
    const row = 8 + index;
    const values = [ut.getRange(`E${row}`).values[0][0], ut.getRange(`Y${row}`).values[0][0], ut.getRange(`AX${row}`).values[0][0], ut.getRange(`BD${row}`).values[0][0], ut.getRange(`BJ${row}`).values[0][0], ut.getRange(`BL${row}`).values[0][0]];
    if (values.slice(0, 5).some((value) => !clean(value))) fail("ut-row", `UT row ${row} is incomplete`);
    if (clean(values[5]) !== `Case ${index + 1}`) fail("ut-row", `UT row ${row} has the wrong evidence label`);
    const evidenceRow = index + 2;
    const evidenceValues = evidence.getRange(`A${evidenceRow}:K${evidenceRow}`).values[0];
    if (evidenceValues.slice(0, 10).some((value) => !clean(value))) fail("evidence-row", `Evidence row ${evidenceRow} is incomplete`);
    if (clean(evidenceValues[0]) !== `EVD-${String(index + 1).padStart(3, "0")}` || clean(evidenceValues[1]) !== `Case ${index + 1}`) fail("evidence-row", `Evidence row ${evidenceRow} has the wrong ID/label`);
  }

  const utLinks = officeJson(["get", candidatePath, "/UT/BL8:BL285", "--depth", "0", "--json"]).data.results[0].children || [];
  const evidenceLinks = officeJson(["get", candidatePath, "/Evidence/K2:K279", "--depth", "0", "--json"]).data.results[0].children || [];
  report.hyperlinks.ut = utLinks.filter((cell) => cell.format?.link).length;
  report.hyperlinks.evidence = evidenceLinks.filter((cell) => cell.format?.link).length;
  if (utLinks.length !== 278 || report.hyperlinks.ut !== 278) fail("ut-links", "Every UT case row must have a native evidence hyperlink");
  if (evidenceLinks.length !== 278 || report.hyperlinks.evidence !== 278) fail("evidence-links", "Every Evidence row must have a native artifact hyperlink");
  for (let index = 0; index < 278; index += 1) {
    const utLink = utLinks[index]?.format?.link;
    const evidenceLink = evidenceLinks[index]?.format?.link;
    if (utLink !== `#Evidence!A${index + 2}`) fail("ut-link-target", `UT Case ${index + 1} link target is wrong`, utLink);
    if (!String(evidenceLink || "").endsWith(`/Case-${String(index + 1).padStart(3, "0")}.png`)) fail("evidence-link-target", `Evidence Case ${index + 1} artifact link target is wrong`, evidenceLink);
  }
  for (const entry of mapEntries) {
    const cardPath = path.join(evidenceRoot, "cards", `Case-${String(entry.mentorNumber).padStart(3, "0")}.png`);
    try { await fs.access(cardPath); } catch { fail("card", `Missing reader-facing card: ${cardPath}`); }
    if (entry.mentorNumber > 188) {
      const result = resultByKey.get(entry.internalCaseKey);
      const artifactName = result?.evidenceKind === "UI_RUNTIME" ? "runtime.png" : "result.png";
      try { await fs.access(path.join(evidenceRoot, "unit", entry.internalCaseKey, artifactName)); } catch { fail("runtime-artifact", `Missing case-bound artifact for ${entry.internalCaseKey}`); }
    }
  }

  const formulaErrors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!", options: { useRegex: true, maxResults: 300 }, summary: "candidate formula errors" });
  if (!formulaErrors.ndjson.includes("matched 0 entries")) fail("formula-error", "Candidate contains a formula error", formulaErrors.ndjson);
  const candidateIssues = officeJson(["view", candidatePath, "issues", "--json"]).data.issues || [];
  const baselineIssues = baseline.authorityIssues || [];
  report.officeCli.baselineIssues = baselineIssues.length;
  report.officeCli.candidateIssues = candidateIssues.length;
  const baselineSet = new Set(baselineIssues.map(issueSignature));
  const candidateSet = new Set(candidateIssues.map(issueSignature));
  const introduced = candidateIssues.filter((issue) => !baselineSet.has(issueSignature(issue)));
  const missingBaseline = baselineIssues.filter((issue) => !candidateSet.has(issueSignature(issue)));
  report.officeCli.introducedIssues = introduced;
  if (introduced.length) fail("officecli-introduced", "Candidate introduced OfficeCLI issues", introduced);
  if (missingBaseline.length) fail("officecli-baseline", "Candidate lost an authority-template issue", missingBaseline);
  if (candidateIssues.length !== baselineIssues.length) fail("officecli-count", "Candidate issue count differs from the frozen baseline", { baseline: baselineIssues.length, candidate: candidateIssues.length });

  const officeValidation = spawnSync("officecli", ["validate", candidatePath], { encoding: "utf8" });
  if (officeValidation.status !== 0) fail("officecli-validate", "OfficeCLI validation did not pass", officeValidation.stderr || officeValidation.stdout);
  else report.officeCli.validation = "PASS";

  if (!findings.length && args.receipt) await writeValidationReceipt(args.receipt, report, { templatePath, candidatePath, baselinePath, catalogPath, numberMapPath, resultsPath });
  assertNoFindings(findings, report);
} catch (error) {
  fail("validator-error", error?.stack || String(error));
  assertNoFindings(findings, report);
}
