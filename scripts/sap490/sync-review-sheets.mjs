import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const configPath = resolve("docs/sap490/drive-ids.local.json");
const logPath = resolve("docs/sap490/sync.local.log.jsonl");
const gwsRun = resolve("node_modules/@googleworkspace/cli/run.js");
const googleSheetMimeType = "application/vnd.google-apps.spreadsheet";

const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const tagArg = process.argv.find((value) => value.startsWith("--tag="));
const tag = tagArg?.split("=", 2)[1] || timestampTag();

function timestampTag() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join("") + "-" + [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join("");
}

function loadConfig() {
  if (!existsSync(configPath)) {
    throw new Error(`Missing local config: ${configPath}. Create it from docs/sap490/drive-ids.example.json.`);
  }
  return JSON.parse(readFileSync(configPath, "utf8"));
}

function readText(path) {
  return readFileSync(resolve(path), "utf8");
}

function cleanMarkdown(value) {
  return String(value || "")
    .replace(/\\-/g, "-")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHeading(line) {
  return cleanMarkdown(line.replace(/^#{1,6}\s+/, ""));
}

function isTableSeparator(line) {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function splitTableRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return [];
  return trimmed.slice(1, -1).split("|").map((cell) => cleanMarkdown(cell));
}

function parseMarkdownTables(path) {
  const lines = readText(path).split(/\r?\n/);
  const tables = [];
  let section = "";

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^#{1,6}\s+/.test(line)) section = stripHeading(line);

    if (line.trim().startsWith("|") && lines[i + 1] && isTableSeparator(lines[i + 1])) {
      const headers = splitTableRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = splitTableRow(lines[i]);
        if (cells.length) rows.push(cells);
        i += 1;
      }
      i -= 1;
      tables.push({ path, section, headers, rows });
    }
  }

  return tables;
}

function normalizeRows(headers, rows, prefixHeaders = [], prefixValues = []) {
  return rows.map((row) => {
    const normalized = [...prefixValues];
    for (let index = 0; index < headers.length; index += 1) {
      normalized.push(row[index] || "");
    }
    return normalized;
  });
}

function extractRequirementBacklog() {
  const path = "docs/ba/04-requirement-backlog.md";
  const text = readText(path);
  const lines = text.split(/\r?\n/);
  const rows = [];

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^###\s+(REQ-[A-Z0-9-]+)\s+-\s+(.+)$/);
    if (!match) continue;

    const [, id, title] = match;
    const block = [];
    i += 1;
    while (i < lines.length && !/^###\s+REQ-/.test(lines[i]) && !/^##\s+P[12]\s+Requirements/.test(lines[i])) {
      block.push(lines[i]);
      i += 1;
    }
    i -= 1;

    const blockText = block.join("\n");
    const priority = blockText.match(/Priority:\s*(.+)/)?.[1]?.trim() || "";
    const role = blockText.match(/Primary role:\s*(.+)/)?.[1]?.trim() || "";
    const story = block.find((line) => /^As\s/.test(line.trim()))?.trim() || "";
    const criteria = [];
    let inCriteria = false;
    for (const line of block) {
      if (/^Acceptance criteria:/i.test(line.trim())) {
        inCriteria = true;
        continue;
      }
      if (inCriteria && line.trim().startsWith("- ")) {
        criteria.push(cleanMarkdown(line.trim().slice(2)));
      }
    }

    rows.push([
      id,
      cleanMarkdown(title),
      priority,
      role,
      cleanMarkdown(story),
      criteria.join("\n"),
      path
    ]);
  }

  for (const table of parseMarkdownTables(path)) {
    if (!/P[12] Requirements/.test(table.section)) continue;
    const priority = table.section.startsWith("P1") ? "P1" : "P2";
    for (const row of table.rows) {
      rows.push([
        row[0] || "",
        row[1] || "",
        priority,
        "",
        row[2] || "",
        "",
        path
      ]);
    }
  }

  return [
    ["ID", "Title", "Priority", "Primary Role", "User Story / Summary", "Acceptance Criteria", "Source"],
    ...rows
  ];
}

function extractBusinessRules() {
  const path = "IDTS-Business-Rule.md";
  const lines = readText(path).split(/\r?\n/);
  const rows = [];
  let group = "";

  for (let i = 0; i < lines.length; i += 1) {
    if (/^#\s+\*\*[A-Z]\./.test(lines[i])) group = stripHeading(lines[i]);
    const match = lines[i].match(/^##\s+\*\*(BR-\d+)\s*\\?-\s*(.+?)\*\*\s*$/);
    if (!match) continue;

    const [, id, title] = match;
    const body = [];
    i += 1;
    while (i < lines.length && !/^##\s+\*\*BR-\d+/.test(lines[i]) && !/^#\s+\*\*[A-Z]\./.test(lines[i])) {
      const line = lines[i].trim();
      if (line && !/^---+$/.test(line) && !line.startsWith("|")) body.push(line.replace(/^\*\s+/, ""));
      i += 1;
    }
    i -= 1;

    rows.push([
      id,
      cleanMarkdown(title),
      group,
      cleanMarkdown(body.join(" ")).slice(0, 1000),
      path
    ]);
  }

  return [
    ["Rule ID", "Rule Title", "Rule Group", "Summary", "Source"],
    ...rows
  ];
}

function extractTraceability() {
  const sources = [
    "docs/ba/brd/brd.en.md",
    "docs/ba/srs/srs.en.md",
    "docs/ba/frs/frs.en.md"
  ];
  const rows = [];
  let maxColumns = 0;

  for (const source of sources) {
    for (const table of parseMarkdownTables(source)) {
      if (!/Traceability/i.test(table.section)) continue;
      maxColumns = Math.max(maxColumns, table.headers.length);
      rows.push(...normalizeRows(table.headers, table.rows, ["Source", "Section"], [source, table.section]));
    }
  }

  const dynamicHeaders = Array.from({ length: maxColumns }, (_, index) => `Column ${index + 1}`);
  return [
    ["Source", "Section", ...dynamicHeaders],
    ...rows.map((row) => {
      while (row.length < 2 + maxColumns) row.push("");
      return row;
    })
  ];
}

function extractRiskDecisionLog() {
  const path = "docs/pm/risk-decision-log.md";
  const rows = [["Type", "ID", "Date / Likelihood", "Description / Risk", "Reason / Impact", "Impact / Mitigation", "Source"]];

  for (const table of parseMarkdownTables(path)) {
    if (table.section === "Decisions") {
      for (const row of table.rows) {
        rows.push(["Decision", row[0] || "", row[1] || "", row[2] || "", row[3] || "", row[4] || "", path]);
      }
    }
    if (table.section === "Risks") {
      for (const row of table.rows) {
        rows.push(["Risk", row[0] || "", row[2] || "", row[1] || "", row[3] || "", row[4] || "", path]);
      }
    }
  }

  return rows;
}

function extractOpenQuestions() {
  const sources = [
    "docs/ba/brd/brd.en.md",
    "docs/ba/srs/srs.en.md",
    "docs/ba/frs/frs.en.md",
    "docs/pm/tasks/ba3-srs-frs-deliverables.md"
  ];
  const rows = [];
  let maxColumns = 0;

  for (const source of sources) {
    if (!existsSync(resolve(source))) continue;
    for (const table of parseMarkdownTables(source)) {
      if (!/Open (Questions|Issues)|Remaining Open Issues/i.test(table.section)) continue;
      maxColumns = Math.max(maxColumns, table.headers.length);
      rows.push(...normalizeRows(table.headers, table.rows, ["Source", "Section"], [source, table.section]));
    }
  }

  const dynamicHeaders = Array.from({ length: maxColumns }, (_, index) => `Column ${index + 1}`);
  return [
    ["Source", "Section", ...dynamicHeaders],
    ...rows.map((row) => {
      while (row.length < 2 + maxColumns) row.push("");
      return row;
    })
  ];
}

function buildWorkbookData() {
  const generatedAt = new Date().toISOString();
  const sheets = {
    Summary: [
      ["Field", "Value"],
      ["Generated At", generatedAt],
      ["Mode", execute ? "EXECUTE" : "DRY-RUN"],
      ["Source Of Truth", "Repository Markdown"],
      ["Purpose", "SAP490 mentor/team review workbook"],
      ["Overwrite Behavior", "Creates a new timestamped Google Sheet; does not overwrite existing sheets."]
    ],
    "Requirement Backlog": extractRequirementBacklog(),
    "Traceability Matrix": extractTraceability(),
    "Business Rule Matrix": extractBusinessRules(),
    "Risk Decision Log": extractRiskDecisionLog(),
    "Open Questions": extractOpenQuestions()
  };

  for (const [name, rows] of Object.entries(sheets)) {
    if (rows.length === 1) rows.push(["", ""]);
    console.log(`${name}: ${Math.max(rows.length - 1, 0)} data rows`);
  }

  return sheets;
}

function runGws(args) {
  const result = spawnSync(process.execPath, [gwsRun, ...args], {
    encoding: "utf8"
  });
  if (result.stderr) process.stderr.write(result.stderr);
  return result;
}

function createSpreadsheet(title, parentFolderId) {
  const result = runGws([
    "drive",
    "files",
    "create",
    "--params",
    JSON.stringify({
      fields: "id,name,mimeType,webViewLink,parents",
      supportsAllDrives: true
    }),
    "--json",
    JSON.stringify({
      name: title,
      parents: [parentFolderId],
      mimeType: googleSheetMimeType
    }),
    "--format",
    "json"
  ]);

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || result.error?.message || "Failed to create spreadsheet").trim());
  }
  return JSON.parse(result.stdout || "{}");
}

function getSpreadsheet(spreadsheetId) {
  const result = runGws([
    "sheets",
    "spreadsheets",
    "get",
    "--params",
    JSON.stringify({
      spreadsheetId,
      fields: "sheets(properties(sheetId,title))"
    }),
    "--format",
    "json"
  ]);

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || result.error?.message || "Failed to read spreadsheet metadata").trim());
  }
  return JSON.parse(result.stdout || "{}");
}

function setupSheets(spreadsheetId, sheetNames) {
  const metadata = getSpreadsheet(spreadsheetId);
  const firstSheetId = metadata.sheets?.[0]?.properties?.sheetId;
  const requests = [];

  if (firstSheetId !== undefined) {
    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId: firstSheetId,
          title: sheetNames[0],
          gridProperties: { frozenRowCount: 1 }
        },
        fields: "title,gridProperties.frozenRowCount"
      }
    });
  }

  for (const title of sheetNames.slice(1)) {
    requests.push({
      addSheet: {
        properties: {
          title,
          gridProperties: { frozenRowCount: 1 }
        }
      }
    });
  }

  const result = runGws([
    "sheets",
    "spreadsheets",
    "batchUpdate",
    "--params",
    JSON.stringify({ spreadsheetId }),
    "--json",
    JSON.stringify({ requests }),
    "--format",
    "json"
  ]);

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || result.error?.message || "Failed to set up sheets").trim());
  }
}

function updateValues(spreadsheetId, sheetName, rows) {
  const range = `'${sheetName.replaceAll("'", "''")}'!A1`;
  const result = runGws([
    "sheets",
    "spreadsheets",
    "values",
    "update",
    "--params",
    JSON.stringify({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      includeValuesInResponse: false
    }),
    "--json",
    JSON.stringify({
      range,
      majorDimension: "ROWS",
      values: rows
    }),
    "--format",
    "json"
  ]);

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || result.error?.message || `Failed to update ${sheetName}`).trim());
  }
}

function formatSheets(spreadsheetId) {
  const metadata = getSpreadsheet(spreadsheetId);
  const requests = [];

  for (const sheet of metadata.sheets || []) {
    const sheetId = sheet.properties.sheetId;
    requests.push({
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.9, green: 0.94, blue: 1 },
            textFormat: { bold: true }
          }
        },
        fields: "userEnteredFormat(backgroundColor,textFormat)"
      }
    });
    requests.push({
      autoResizeDimensions: {
        dimensions: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 12 }
      }
    });
  }

  const result = runGws([
    "sheets",
    "spreadsheets",
    "batchUpdate",
    "--params",
    JSON.stringify({ spreadsheetId }),
    "--json",
    JSON.stringify({ requests }),
    "--format",
    "json"
  ]);

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || result.error?.message || "Failed to format spreadsheet").trim());
  }
}

function main() {
  const config = loadConfig();
  const reviewFolderId = config?.googleWorkspace?.reviewFolderId;
  if (!reviewFolderId) throw new Error("Missing googleWorkspace.reviewFolderId in docs/sap490/drive-ids.local.json.");

  const workbookTitle = `IDTS_SAP490_Review_Matrices_${tag}`;
  const workbook = buildWorkbookData();
  const sheetNames = Object.keys(workbook);

  console.log("");
  console.log("SAP490 review Google Sheets sync");
  console.log("--------------------------------");
  console.log(`Mode: ${execute ? "EXECUTE" : "DRY-RUN"}`);
  console.log(`Workbook: ${workbookTitle}`);
  console.log(`Target folder: ${reviewFolderId}`);

  if (!execute) {
    console.log("No remote file was changed. Re-run with `--execute` to create the review workbook.");
    return;
  }

  const created = createSpreadsheet(workbookTitle, reviewFolderId);
  setupSheets(created.id, sheetNames);
  for (const [sheetName, rows] of Object.entries(workbook)) {
    updateValues(created.id, sheetName, rows);
  }
  formatSheets(created.id);

  appendFileSync(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    action: "sync-review-sheets",
    driveName: created.name,
    spreadsheetId: created.id,
    webViewLink: created.webViewLink,
    parentFolderId: reviewFolderId,
    sheets: sheetNames
  }) + "\n", "utf8");

  console.log(`[created] ${created.name}`);
  console.log(`          ${created.webViewLink}`);
  console.log(`Local sync log: ${logPath}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
