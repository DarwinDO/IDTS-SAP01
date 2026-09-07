#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";
import JSZip from "jszip";

const TASK_BASE = "2fc7c6e70ca2136e42a43ac9024878e41908f5b2";
const CREATED_DATE = "2026-09-06";
const DATA_START_ROW = 8;
const DATA_END_ROW = 285;
const EVIDENCE_FIRST_BLOCK_ROW = 2;
const EVIDENCE_BLOCK_ROWS = 34;
// A4 portrait leaves room for a full-width 630×532 card inside the template
// margins.  34 rows × 11.75 pt is the same height at Excel's 96 dpi mapping,
// so the native two-cell extent keeps the original card aspect ratio.
const EVIDENCE_CARD_WIDTH_PX = 560;
const EVIDENCE_CARD_HEIGHT_PX = 472;
const EVIDENCE_LAST_ROW = EVIDENCE_FIRST_BLOCK_ROW + 278 * EVIDENCE_BLOCK_ROWS - 1;
const DATA_MERGES = ["B:D", "E:X", "Y:AW", "AX:BC", "BD:BI", "BJ:BK", "BL:BR"];
const DISPLAY_EXECUTOR = "NhanT (DonHV support)";
const HISTORY_BASE_ROW_HEIGHT = 19.5;
const HISTORY_CHARS_PER_LINE = 60;
const HISTORY_LINE_HEIGHT = 14.5;
const UT_MIN_ROW_HEIGHT = 14.25;
const UT_MAX_ROW_HEIGHT = 370;
const UT_TEST_CHARS_PER_LINE = 39;
const UT_RESULT_CHARS_PER_LINE = 58;
const UT_LINE_HEIGHT = 14.25;
const UT_ROW_PADDING = 10;

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
    // v0.6 is the approved candidate projection of the finalized cards: no
    // mapping-only display rows remain. The original manifest stays untouched.
    case "MAPPING_ONLY_CANDIDATE": return "Candidate PASS";
    case "MAPPING_ONLY": return "Candidate PASS";
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

function caseText(caseDefinition) {
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

function evidenceBlockRow(mentorNumber) {
  return EVIDENCE_FIRST_BLOCK_ROW + (mentorNumber - 1) * EVIDENCE_BLOCK_ROWS;
}

function evidenceBlockEndRow(mentorNumber) {
  return evidenceBlockRow(mentorNumber) + EVIDENCE_BLOCK_ROWS - 1;
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
      executor: DISPLAY_EXECUTOR,
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
      executor: DISPLAY_EXECUTOR,
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
    const evidenceRow = evidenceBlockRow(record.mentorNumber);
    commands.push({
      command: "set",
      path: `/UT/BL${utRow}`,
      props: { link: `#Evidence!B${evidenceRow}`, display: `Case ${record.mentorNumber}` }
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

function xmlEscape(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

async function embedEvidenceCards(outputPath, cardsDir, records) {
  const zip = await JSZip.loadAsync(await fs.readFile(outputPath));
  const sheetPath = "xl/worksheets/sheet4.xml";
  const sheetRelsPath = "xl/worksheets/_rels/sheet4.xml.rels";
  const drawingPath = "xl/drawings/drawing1.xml";
  const drawingRelsPath = "xl/drawings/_rels/drawing1.xml.rels";
  const contentTypesPath = "[Content_Types].xml";
  const sheetXml = await zip.file(sheetPath).async("string");
  if (/<(?:[A-Za-z_][\w.-]*:)?drawing\b/i.test(sheetXml)) throw new Error("Evidence sheet already contains a drawing; refusing to mix drawing ownership");
  if (zip.file(drawingPath) || zip.file(drawingRelsPath)) throw new Error("drawing1.xml already exists; refusing to overwrite an unrelated drawing");

  const cardBuffers = await Promise.all(records.map(async (record) => {
    const imagePath = path.join(cardsDir, cardFile(record.mentorNumber));
    return { record, buffer: await fs.readFile(imagePath) };
  }));
  if (cardBuffers.length !== 278) throw new Error(`Expected 278 cards, got ${cardBuffers.length}`);

  const drawingRelationshipId = "rId1";
  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="${drawingRelationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>`;
  zip.file(sheetRelsPath, relsXml);

  const anchors = [];
  const imageRelationships = [];
  for (const [index, { record, buffer }] of cardBuffers.entries()) {
    const imageNumber = index + 1;
    const imageName = `image${imageNumber}.png`;
    const relationshipId = `rId${imageNumber}`;
    const zeroBasedEvidenceRow = evidenceBlockRow(record.mentorNumber) - 1;
    zip.file(`xl/media/${imageName}`, buffer);
    imageRelationships.push(`<Relationship Id="${relationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${imageName}"/>`);
    const toRow = zeroBasedEvidenceRow + EVIDENCE_BLOCK_ROWS;
    anchors.push(`<xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>1</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${zeroBasedEvidenceRow}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>2</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${toRow}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${imageNumber}" name="${xmlEscape(`Case ${record.mentorNumber} card`)}" descr="${xmlEscape(`Case ${record.mentorNumber}`)}"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${EVIDENCE_CARD_WIDTH_PX * 9525}" cy="${EVIDENCE_CARD_HEIGHT_PX * 9525}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:twoCellAnchor>`);
  }
  const drawingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${anchors.join("")}</xdr:wsDr>`;
  const drawingRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${imageRelationships.join("")}</Relationships>`;
  zip.file(drawingPath, drawingXml);
  zip.file(drawingRelsPath, drawingRelsXml);

  let contentTypes = await zip.file(contentTypesPath).async("string");
  if (!/Extension="png"/i.test(contentTypes)) contentTypes = contentTypes.replace("</Types>", '<Default Extension="png" ContentType="image/png"/></Types>');
  if (!contentTypes.includes('/xl/drawings/drawing1.xml')) contentTypes = contentTypes.replace("</Types>", '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>');
  zip.file(contentTypesPath, contentTypes);

  const drawingElement = `<x:drawing xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="${drawingRelationshipId}"/>`;
  const updatedSheetXml = sheetXml.includes("<legacyDrawing")
    ? sheetXml.replace("<legacyDrawing", `${drawingElement}<legacyDrawing`)
    : sheetXml.replace(/<\/(?:[A-Za-z_][\w.-]*:)?worksheet>/i, (tag) => `${drawingElement}${tag}`);
  if (updatedSheetXml === sheetXml) throw new Error("Could not anchor Evidence drawing in the worksheet XML");
  zip.file(sheetPath, updatedSheetXml);
  await fs.writeFile(outputPath, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

async function convertEvidenceImagesToCellAnchors(outputPath) {
  const zip = await JSZip.loadAsync(await fs.readFile(outputPath));
  const drawingPath = "xl/drawings/drawing1.xml";
  const drawingRelsPath = "xl/drawings/_rels/drawing1.xml.rels";
  let drawingXml = await zip.file(drawingPath).async("string");
  const anchors = [...drawingXml.matchAll(/<xdr:oneCellAnchor\b[^>]*>([\s\S]*?)<\/xdr:oneCellAnchor>/g)];
  if (anchors.length !== 278) throw new Error(`Expected 278 API-authored Evidence one-cell anchors, got ${anchors.length}`);
  for (const [index, match] of anchors.entries()) {
    const caseNumber = index + 1;
    const imageStart = evidenceBlockRow(caseNumber) - 1;
    const imageEnd = imageStart + EVIDENCE_BLOCK_ROWS;
    let body = match[1]
      .replace(/<xdr:ext\b[^>]*\/>/i, "")
      .replace(/<xdr:cNvPr\b[^>]*\bname="[^"]*"/i, `<xdr:cNvPr id="${caseNumber}" name="Case ${caseNumber} card" descr="Case ${caseNumber}"`);
    const from = `<xdr:from><xdr:col>1</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${imageStart}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>`;
    // Keep the entire native two-cell anchor inside the single printable card
    // column. Crossing into C caused LibreOffice to emit an empty horizontal
    // spill page after every manual row-break block.
    const to = `<xdr:to><xdr:col>1</xdr:col><xdr:colOff>${EVIDENCE_CARD_WIDTH_PX * 9525}</xdr:colOff><xdr:row>${imageEnd}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>`;
    body = body.replace(/<xdr:from>[\s\S]*?<\/xdr:from>/i, `${from}${to}`);
    if (!/<a:xfrm\b/i.test(body)) {
      body = body.replace("<xdr:spPr>", `<xdr:spPr><a:xfrm xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:off x="0" y="0"/><a:ext cx="${EVIDENCE_CARD_WIDTH_PX * 9525}" cy="${EVIDENCE_CARD_HEIGHT_PX * 9525}"/></a:xfrm>`);
    }
    body = body.replace(/<a:prstGeom\b([^>]*)\/>/i, '<a:prstGeom$1><a:avLst/></a:prstGeom>');
    body = body.replace(/<xdr:clientData\s*\/>/i, '<xdr:clientData fLocksWithSheet="0" fPrintsWithSheet="1"/>');
    drawingXml = drawingXml.replace(match[0], `<xdr:twoCellAnchor editAs="twoCell">${body}</xdr:twoCellAnchor>`);
  }
  drawingXml = drawingXml.replace(
    '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing">',
    '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
  );
  zip.file(drawingPath, drawingXml);
  // Normalize artifact-tool's package-root media targets to standard drawing-relative
  // targets. LibreOffice resolves the latter reliably for printed drawings.
  const drawingRels = await zip.file(drawingRelsPath).async("string");
  zip.file(drawingRelsPath, drawingRels.replaceAll('Target="/xl/media/', 'Target="../media/'));
  const sheetRelsPath = "xl/worksheets/_rels/sheet4.xml.rels";
  const sheetRels = await zip.file(sheetRelsPath).async("string");
  zip.file(sheetRelsPath, sheetRels.replaceAll('Target="/xl/drawings/', 'Target="../drawings/'));
  await fs.writeFile(outputPath, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

function rawSet(outputPath, sheetName, xpath, action, xml) {
  const result = spawnSync("officecli", ["raw-set", outputPath, `/${sheetName}`, "--xpath", xpath, "--action", action, "--xml", xml], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024
  });
  if (result.error) throw result.error;
  return result;
}

function closeOfficeCliDocument(outputPath) {
  const result = spawnSync("officecli", ["close", outputPath], {
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`OfficeCLI document close failed: ${result.stderr || result.stdout}`);
}

function restoreTemplatePrintSetup(outputPath) {
  const setups = {
    Cover: {
      sheetPr: '<sheetPr filterMode="false" />',
      fitToPage: "true",
      margins: '<pageMargins left="0.39375" right="0.39375" top="0.7875" bottom="0.7875" header="0.511811023622047" footer="0" />',
      pageSetup: '<pageSetup paperSize="9" scale="100" fitToWidth="1" fitToHeight="1" pageOrder="downThenOver" orientation="landscape" blackAndWhite="false" draft="false" cellComments="none" horizontalDpi="300" verticalDpi="300" copies="1" />',
      printOptions: '<printOptions headings="false" gridLines="false" gridLinesSet="true" horizontalCentered="false" verticalCentered="false" />',
      headerFooter: '<headerFooter differentFirst="false" differentOddEven="false"><oddHeader></oddHeader><oddFooter>&amp;L&amp;F&amp;R&amp;P / </oddFooter></headerFooter>'
    },
    Histories: {
      sheetPr: '<sheetPr filterMode="false" />',
      fitToPage: "true",
      margins: '<pageMargins left="0.39375" right="0.39375" top="0.7875" bottom="0.7875" header="0.511811023622047" footer="0" />',
      pageSetup: '<pageSetup paperSize="9" scale="100" fitToWidth="1" fitToHeight="1" pageOrder="downThenOver" orientation="landscape" blackAndWhite="false" draft="false" cellComments="none" horizontalDpi="300" verticalDpi="300" copies="1" />',
      printOptions: '<printOptions headings="false" gridLines="false" gridLinesSet="true" horizontalCentered="false" verticalCentered="false" />',
      headerFooter: '<headerFooter differentFirst="false" differentOddEven="false"><oddHeader></oddHeader><oddFooter>&amp;L&amp;F&amp;R&amp;P / </oddFooter></headerFooter>'
    },
    UT: {
      sheetPr: '<sheetPr filterMode="false" />',
      fitToPage: "true",
      margins: '<pageMargins left="0.590277777777778" right="0.39375" top="0.590277777777778" bottom="0.590277777777778" header="0" footer="0" />',
      pageSetup: '<pageSetup paperSize="9" scale="100" fitToWidth="1" fitToHeight="0" pageOrder="downThenOver" orientation="landscape" blackAndWhite="false" draft="false" cellComments="none" horizontalDpi="300" verticalDpi="300" copies="1" />',
      printOptions: '<printOptions headings="false" gridLines="false" gridLinesSet="true" horizontalCentered="false" verticalCentered="false" />',
      headerFooter: '<headerFooter differentFirst="false" differentOddEven="false"><oddHeader>&amp;L文書ID：F400&amp;R単体テスト仕様書 - &amp;A</oddHeader><oddFooter>&amp;C&amp;P / </oddFooter></headerFooter>'
    },
    Evidence: {
      sheetPr: '<sheetPr filterMode="false" />',
      fitToPage: "true",
      margins: '<pageMargins left="0.747916666666667" right="0.747916666666667" top="0.984027777777778" bottom="0.984027777777778" header="0.511811023622047" footer="0.511811023622047" />',
      pageSetup: '<pageSetup paperSize="9" scale="100" fitToWidth="1" fitToHeight="0" pageOrder="downThenOver" orientation="portrait" blackAndWhite="false" draft="false" cellComments="none" horizontalDpi="300" verticalDpi="300" copies="1" />',
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
    const pageSetUpPr = rawSet(outputPath, sheetName, "//x:sheetPr", "append", `<pageSetUpPr fitToPage="${setup.fitToPage}" />`);
    if (pageSetUpPr.status !== 0) throw new Error(`OfficeCLI page-set-up property restoration failed for ${sheetName}: ${pageSetUpPr.stderr || pageSetUpPr.stdout}`);
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

async function restoreWorksheetDimensions(outputPath) {
  const dimensions = {
    Cover: "A1:AQ1000",
    Histories: "A1:Z1000",
    UT: "A1:BV1048576",
    Evidence: `B1:B${EVIDENCE_LAST_ROW}`
  };
  const sheetProperties = {
    Cover: '<x:sheetPr filterMode="false"><x:pageSetUpPr fitToPage="true" /></x:sheetPr>',
    Histories: '<x:sheetPr filterMode="false"><x:pageSetUpPr fitToPage="true" /></x:sheetPr>',
    UT: '<x:sheetPr filterMode="false"><x:pageSetUpPr fitToPage="true" /></x:sheetPr>',
    Evidence: '<x:sheetPr filterMode="false"><x:pageSetUpPr fitToPage="true" /></x:sheetPr>'
  };
  const printOptions = '<x:printOptions headings="false" gridLines="false" gridLinesSet="true" horizontalCentered="false" verticalCentered="false" />';
  const pageMargins = {
    Cover: '<x:pageMargins left="0.39375" right="0.39375" top="0.7875" bottom="0.7875" header="0.511811023622047" footer="0" />',
    Histories: '<x:pageMargins left="0.39375" right="0.39375" top="0.7875" bottom="0.7875" header="0.511811023622047" footer="0" />',
    UT: '<x:pageMargins left="0.590277777777778" right="0.39375" top="0.590277777777778" bottom="0.590277777777778" header="0" footer="0" />',
    Evidence: '<x:pageMargins left="0.747916666666667" right="0.747916666666667" top="0.984027777777778" bottom="0.984027777777778" header="0.511811023622047" footer="0.511811023622047" />'
  };
  const pageSetups = {
    Cover: '<x:pageSetup paperSize="9" scale="100" fitToWidth="1" fitToHeight="1" pageOrder="downThenOver" orientation="landscape" blackAndWhite="false" draft="false" cellComments="none" horizontalDpi="300" verticalDpi="300" copies="1" />',
    Histories: '<x:pageSetup paperSize="9" scale="100" fitToWidth="1" fitToHeight="1" pageOrder="downThenOver" orientation="landscape" blackAndWhite="false" draft="false" cellComments="none" horizontalDpi="300" verticalDpi="300" copies="1" />',
    UT: '<x:pageSetup paperSize="9" scale="100" fitToWidth="1" fitToHeight="0" pageOrder="downThenOver" orientation="landscape" blackAndWhite="false" draft="false" cellComments="none" horizontalDpi="300" verticalDpi="300" copies="1" />',
    Evidence: '<x:pageSetup paperSize="9" scale="100" fitToWidth="1" fitToHeight="0" pageOrder="downThenOver" orientation="portrait" blackAndWhite="false" draft="false" cellComments="none" horizontalDpi="300" verticalDpi="300" copies="1" />'
  };
  const headerFooters = {
    Cover: '<x:headerFooter differentFirst="false" differentOddEven="false"><x:oddHeader></x:oddHeader><x:oddFooter>&amp;L&amp;F&amp;R&amp;P / </x:oddFooter></x:headerFooter>',
    Histories: '<x:headerFooter differentFirst="false" differentOddEven="false"><x:oddHeader></x:oddHeader><x:oddFooter>&amp;L&amp;F&amp;R&amp;P / </x:oddFooter></x:headerFooter>',
    UT: '<x:headerFooter differentFirst="false" differentOddEven="false"><x:oddHeader>&amp;L文書ID：F400&amp;R単体テスト仕様書 - &amp;A</x:oddHeader><x:oddFooter>&amp;C&amp;P / </x:oddFooter></x:headerFooter>',
    Evidence: '<x:headerFooter differentFirst="false" differentOddEven="false"><x:oddHeader></x:oddHeader><x:oddFooter></x:oddFooter></x:headerFooter>'
  };
  const zip = await JSZip.loadAsync(await fs.readFile(outputPath));
  for (const [index, sheetName] of ["Cover", "Histories", "UT", "Evidence"].entries()) {
    const part = `xl/worksheets/sheet${index + 1}.xml`;
    let xml = await zip.file(part).async("string");
    const dimension = `<x:dimension ref="${dimensions[sheetName]}" />`;
    const replaceOrInsert = (tag, replacement, beforeTag) => {
      const paired = new RegExp(`<x:${tag}\\b[\\s\\S]*?<\\/x:${tag}>`, "i");
      const selfClosing = new RegExp(`<x:${tag}\\b[^>]*\\/>`, "i");
      if (paired.test(xml)) xml = xml.replace(paired, replacement);
      else if (selfClosing.test(xml)) xml = xml.replace(selfClosing, replacement);
      else {
        const anchor = new RegExp(`<x:${beforeTag}\\b`, "i");
        if (anchor.test(xml)) xml = xml.replace(anchor, `${replacement}<x:${beforeTag}`);
        else xml = xml.replace(/<\/x:worksheet>/i, `${replacement}</x:worksheet>`);
      }
    };
    replaceOrInsert("sheetPr", sheetProperties[sheetName], "dimension");
    replaceOrInsert("dimension", dimension, "sheetViews");
    replaceOrInsert("printOptions", printOptions, "pageMargins");
    replaceOrInsert("pageMargins", pageMargins[sheetName], "pageSetup");
    replaceOrInsert("pageSetup", pageSetups[sheetName], "headerFooter");
    const headerFooter = headerFooters[sheetName];
    replaceOrInsert("headerFooter", headerFooter, "legacyDrawing");
    // artifact-tool may serialize sheetPr after the drawing collection. Excel
    // requires it as the first worksheet child, ahead of dimension/sheetViews.
    const sheetPrMatch = xml.match(/<x:sheetPr\b[\s\S]*?<\/x:sheetPr>|<x:sheetPr\b[^>]*\/>/i);
    if (sheetPrMatch) {
      xml = xml.replace(sheetPrMatch[0], "");
      xml = xml.replace(/(<x:worksheet\b[^>]*>)/i, `$1${sheetPrMatch[0]}`);
    }
    const pageSetupMatch = xml.match(/<x:pageSetup\b[^>]*\/>/i);
    if (pageSetupMatch) {
      xml = xml.replace(pageSetupMatch[0], "");
      if (/<x:headerFooter\b/i.test(xml)) xml = xml.replace(/<x:headerFooter\b/i, `${pageSetupMatch[0]}<x:headerFooter`);
      else xml = xml.replace(/<x:drawing\b/i, `${pageSetupMatch[0]}<x:drawing`);
    }
    const drawingMatch = xml.match(/<x:drawing\b[^>]*\/>/i);
    if (drawingMatch) {
      xml = xml.replace(drawingMatch[0], "");
      if (/<\/x:headerFooter>/i.test(xml)) xml = xml.replace(/<\/x:headerFooter>/i, `</x:headerFooter>${drawingMatch[0]}`);
      else xml = xml.replace(/<\/x:worksheet>/i, `${drawingMatch[0]}</x:worksheet>`);
    }
    if (sheetName === "Evidence") {
      const breaks = Array.from({ length: 277 }, (_, index) => {
        const caseNumber = index + 1;
        return `<x:brk id="${evidenceBlockEndRow(caseNumber)}" min="1" max="1" man="1" />`;
      }).join("");
      const rowBreaks = `<x:rowBreaks count="277" manualBreakCount="277">${breaks}</x:rowBreaks>`;
      xml = xml.replace(/<x:rowBreaks\b[\s\S]*?<\/x:rowBreaks>/i, "");
      if (/<x:drawing\b/i.test(xml)) xml = xml.replace(/<x:drawing\b/i, `${rowBreaks}<x:drawing`);
      else xml = xml.replace(/<\/x:worksheet>/i, `${rowBreaks}</x:worksheet>`);
    }
    zip.file(part, xml);
  }
  let workbookXml = await zip.file("xl/workbook.xml").async("string");
  const evidencePrintArea = `<x:definedName name="_xlnm.Print_Area" localSheetId="3">'Evidence'!$B$1:$B$${EVIDENCE_LAST_ROW}</x:definedName>`;
  const existingPrintArea = /<x:definedName\b[^>]*\bname="_xlnm\.Print_Area"[^>]*\blocalSheetId="3"[^>]*>[\s\S]*?<\/x:definedName>/i;
  if (existingPrintArea.test(workbookXml)) workbookXml = workbookXml.replace(existingPrintArea, evidencePrintArea);
  else if (/<x:definedNames\b[^>]*>/i.test(workbookXml)) workbookXml = workbookXml.replace(/<\/x:definedNames>/i, `${evidencePrintArea}</x:definedNames>`);
  else workbookXml = workbookXml.replace(/<x:sheets\b/i, `<x:definedNames>${evidencePrintArea}</x:definedNames><x:sheets`);
  zip.file("xl/workbook.xml", workbookXml);
  await fs.writeFile(outputPath, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

async function main() {
  const args = parseArgs(process.argv);
  const templatePath = required(args, "template");
  const catalogPath = required(args, "catalog");
  const numberMapPath = required(args, "number-map");
  const resultsPath = required(args, "results");
  const evidenceRoot = required(args, "evidence-root");
  const cardsDir = args["cards-dir"] || path.join(evidenceRoot, "cards");
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
  setMergedValue(cover, "N12:AI12", "v0.6 candidate");
  setMergedValue(cover, "N13:AI13", "Atomic execution and workbook");
  setMergedValue(cover, "N14:T14", CREATED_DATE);
  setMergedValue(cover, "Z14:AI14", CREATED_DATE);
  setMergedValue(cover, "AE19:AI20", "Codex");

  // Keep the official history table and formulas; add a compact three-row candidate record.
  histories.getRange("B3:B3").values = [[1]];
  histories.getRange("C3:C6").values = [[0.5], [0.5], [0.5], [0.5]];
  histories.getRange("D3:D6").values = [
    ["IDTS-110 atomic execution; v0.6 candidate"],
    [`Source baseline: ${aggregate.sourceBaselineSha}`],
    [`Catalog SHA: ${aggregate.catalogSha}`],
    [`Approval PR #${aggregate.approvalReference?.pullRequest ?? 388}; merge ${aggregate.approvalReference?.mergeSha ?? aggregate.sourceBaselineSha}`]
  ];
  histories.getRange("E3:E6").values = [["UT"], ["UT"], ["UT"], ["UT"]];
  const createdDate = new Date(`${CREATED_DATE}T00:00:00Z`);
  histories.getRange("F3:F6").values = [[createdDate], [createdDate], [createdDate], [createdDate]];
  histories.getRange("F3:F6").format.numberFormat = "yyyy/mm/dd";
  histories.getRange("G3:G6").values = [["Codex"], [null], [null], [null]];
  for (let row = 3; row <= 6; row += 1) {
    const description = histories.getRange(`D${row}`).values[0][0];
    histories.getRange(`A${row}:Z${row}`).format.rowHeight = expectedHistoryRowHeight(description);
  }

  // Clone the official row-8 body style for every candidate row, then fill only the approved fields.
  const sourceBody = ut.getRange("A8:BV8");
  for (const record of records) {
    const row = DATA_START_ROW + record.mentorNumber - 1;
    if (row !== DATA_START_ROW) sourceBody.copyTo(ut.getRange(`A${row}:BV${row}`), "all");
    for (const merge of DATA_MERGES) {
      const [start, end] = merge.split(":");
      ut.mergeCells(`${start}${row}:${end}${row}`);
    }
    const expectedActualText = resultText(record.definition.expectedResult, record.actualResult, record.limitation);
    // Merged E:X/Y:AW cells cannot auto-fit in Excel. Use the smallest bounded height
    // derived from the two reader-facing text blocks, retaining the authority columns/styles.
    ut.getRange(`A${row}:BV${row}`).format.rowHeight = expectedUtRowHeight(
      caseText(record.definition),
      expectedActualText
    );
    setMergedValue(ut, `B${row}:D${row}`, String(record.mentorNumber));
    setMergedValue(ut, `E${row}`, caseText(record.definition));
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

  // Evidence is deliberately card-only. Each native card owns an A4 page block;
  // provenance stays in JSON and the card itself already carries its Case number.
  evidence.showGridLines = false;
  evidence.getRange(`A1:K${EVIDENCE_LAST_ROW}`).clear({ applyTo: "contents" });
  evidence.getRange(`B${EVIDENCE_FIRST_BLOCK_ROW}:B${EVIDENCE_LAST_ROW}`).format.rowHeight = 10.42;
  evidence.getRange(`B1:B${EVIDENCE_LAST_ROW}`).format.columnWidth = 80;
  for (const record of records) {
    const card = await fs.readFile(path.join(cardsDir, cardFile(record.mentorNumber)));
    evidence.images.add({
      dataUrl: `data:image/png;base64,${card.toString("base64")}`,
      anchor: {
        from: { row: evidenceBlockRow(record.mentorNumber) - 1, col: 1 },
        extent: { widthPx: EVIDENCE_CARD_WIDTH_PX, heightPx: EVIDENCE_CARD_HEIGHT_PX }
      }
    });
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(outputPath);
  // artifact-tool intentionally owns workbook structure/style authoring. OfficeCLI's
  // native link attribute is applied after export because artifact-tool has no public
  // hyperlink setter and HYPERLINK formulas are not evaluated by OfficeCLI.
  applyNativeHyperlinks(outputPath, records);
  // Evidence drawings are authored with artifact-tool. Its drawing part must remain
  // in worksheet schema order, so page/dimension restoration is performed directly
  // below without a second OfficeCLI worksheet mutation.
  await restoreWorksheetDimensions(outputPath);
  await convertEvidenceImagesToCellAnchors(outputPath);
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
