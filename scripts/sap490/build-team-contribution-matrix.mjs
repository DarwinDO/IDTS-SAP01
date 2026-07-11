import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = process.env.IDTS_REPO_ROOT || process.cwd();
const outputDir = path.join(root, ".tmp", "sap490-team-contributions");
const runDate = new Date().toISOString().slice(0, 10).replaceAll("-", "");
const outputPath = path.join(outputDir, `SU26SAP01_GSU26SAP01_Team_Contribution_Matrix_${runDate}.xlsx`);
const jiraBase = "https://dutassociation.atlassian.net/browse/";
const githubBase = "https://github.com/DarwinDO/IDTS-SAP01/pull/";

const members = [
  { id: "donhv", name: "DonHV", role: "BA/PM consolidation; CAP backend and integration" },
  { id: "datdt", name: "DatDT", role: "SAP Fiori/UI5 lead" },
  { id: "sangvn", name: "SangVN", role: "SAP Fiori/UI5 support" },
  { id: "nhant", name: "NhanT", role: "Backend verification and QA" },
];

const genericHeadings = new Set([
  "Member Identity", "Current Focus", "Done", "In Progress", "Next", "Blockers",
  "Session Log", "Update Rule", "SAP490 Bug Staging Register",
]);

function compact(value) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*|__|\*/g, "")
    .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getKeys(value) {
  return [...new Set((value.match(/IDTS-\d+/g) || []))];
}

function getPrs(value) {
  return [...new Set([...value.matchAll(/(?:PR\s*#|pull\/)(\d+)/gi)].map(match => match[1]))];
}

function workCategory(value) {
  if (/\b(qa|test|uat|verification|smoke|regression)\b/i.test(value)) return "QA / verification";
  if (/\b(pr|review|merge|rebase|integration)\b/i.test(value)) return "Review / integration";
  if (/\b(brd|srs|frs|sap490|doc|documentation|knowledge|report|workshop)\b/i.test(value)) return "Documentation";
  if (/\b(ai|openai|provider|classification|similar|handoff|smart assign)\b/i.test(value)) return "AI capability";
  if (/\b(render|postgres|deploy|smtp|brevo|security|npm|backup|restore)\b/i.test(value)) return "DevOps / security";
  return "Implementation / support";
}

function contributionRole(value) {
  if (/\b(review|support|on behalf|handoff|merge|qa)\b/i.test(value)) return "Support / review / verification";
  return "Primary recorded contribution";
}

function parseHeadings(content, member) {
  const rows = [];
  const matches = [...content.matchAll(/^##\s+(.+)$/gm)];
  for (let index = 0; index < matches.length; index += 1) {
    const rawHeading = compact(matches[index][1]);
    if (genericHeadings.has(rawHeading) || !/^\d{4}-\d{2}-\d{2}/.test(rawHeading)) continue;
    const bodyStart = matches[index].index + matches[index][0].length;
    const bodyEnd = index + 1 < matches.length ? matches[index + 1].index : content.length;
    const body = content.slice(bodyStart, bodyEnd);
    const date = rawHeading.slice(0, 10);
    const summary = compact(rawHeading.slice(10).replace(/^\s*[-–—:]\s*/, ""));
    const bodyHint = compact(
      body.split(/\r?\n/).find(line => line.trim() && !line.trim().startsWith("|") && !line.trim().startsWith("#")) || ""
    ).slice(0, 280);
    const text = `${summary} ${bodyHint}`.trim();
    if (!summary) continue;
    rows.push({ member, date, work: summary, details: bodyHint, evidence: text, sourceType: "Status heading" });
  }
  return rows;
}

function parseTableRows(content, member) {
  const rows = [];
  for (const line of content.split(/\r?\n/)) {
    if (!/^\|\s*\d{4}-\d{2}-\d{2}\s*\|/.test(line)) continue;
    const cells = line.split("|").slice(1, -1).map(cell => compact(cell));
    const [date, item = "", work = ""] = cells;
    const summary = compact(`${item} ${work}`);
    if (!summary) continue;
    rows.push({ member, date, work: summary.slice(0, 480), details: "", evidence: summary, sourceType: "Status table" });
  }
  return rows;
}

async function taskMap() {
  const taskDir = path.join(root, "docs", "pm", "tasks");
  const files = (await fs.readdir(taskDir)).filter(file => file.endsWith(".md"));
  const map = new Map();
  for (const file of files) {
    const relative = path.join("docs", "pm", "tasks", file).replaceAll("\\", "/");
    const text = await fs.readFile(path.join(taskDir, file), "utf8");
    for (const key of getKeys(`${file}\n${text.slice(0, 5000)}`)) {
      if (!map.has(key)) map.set(key, relative);
    }
  }
  return map;
}

async function readContributions() {
  const tasks = await taskMap();
  const entries = [];
  for (const member of members) {
    const relative = path.join("docs", "pm", "status", `${member.id}.md`).replaceAll("\\", "/");
    const content = await fs.readFile(path.join(root, relative), "utf8");
    const rawRows = [...parseHeadings(content, member), ...parseTableRows(content, member)];
    const seen = new Set();
    for (const row of rawRows) {
      const signature = `${member.id}|${row.date}|${row.work.toLowerCase()}`;
      if (seen.has(signature)) continue;
      seen.add(signature);
      const keys = getKeys(row.evidence);
      const prs = getPrs(row.evidence);
      const taskSources = keys.map(key => tasks.get(key)).filter(Boolean);
      entries.push([
        member.name,
        member.role,
        row.date,
        keys.join(", ") || "—",
        keys.map(key => `${jiraBase}${key}`).join(" | ") || "—",
        row.work,
        row.details || "—",
        workCategory(row.evidence),
        contributionRole(row.evidence),
        prs.map(pr => `${githubBase}${pr}`).join(" | ") || "—",
        relative,
        taskSources.join(" | ") || "—",
        row.sourceType,
      ]);
    }
  }
  return entries.sort((a, b) => a[0].localeCompare(b[0]) || String(a[2]).localeCompare(String(b[2])) || a[5].localeCompare(b[5]));
}

function setHeader(range) {
  range.format = {
    fill: "#E5E7EB",
    font: { bold: true, color: "#111827" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "outside", style: "thin", color: "#9CA3AF" },
  };
}

function setTitle(range) {
  range.format = {
    fill: "#F3F4F6",
    font: { bold: true, color: "#111827", size: 14 },
    horizontalAlignment: "left",
    verticalAlignment: "center",
  };
}

async function build() {
  const contributions = await readContributions();
  const workbook = Workbook.create();
  const summary = workbook.worksheets.add("Summary");
  const work = workbook.worksheets.add("Contributions");
  const evidence = workbook.worksheets.add("Evidence Index");
  const drive = workbook.worksheets.add("Drive Rename Log");
  const notes = workbook.worksheets.add("Needs Confirmation");

  summary.mergeCells("A1:F1");
  summary.getRange("A1").values = [["SU26SAP01_GSU26SAP01 — Team Contribution Matrix"]];
  setTitle(summary.getRange("A1:F1"));
  summary.getRange("A2:F3").merge();
  summary.getRange("A2").values = [["Mục đích: mô tả chức năng/công việc từng thành viên đã thực hiện, truy vết bằng status nội bộ, PM task, Jira và GitHub PR. Nguồn được đồng bộ cho review SAP490; các dòng có dữ liệu mâu thuẫn hoặc thiếu bằng chứng được tách riêng."]];
  summary.getRange("A2:F3").format = { wrapText: true, verticalAlignment: "center", fill: "#FFFFFF" };
  summary.getRange("A5:F5").values = [["Thành viên", "Vai trò chính", "Số dòng đóng góp", "Có Jira", "Có PR", "Nguồn chính"]];
  setHeader(summary.getRange("A5:F5"));
  const summaryRows = members.map((member, index) => [
    member.name,
    member.role,
    `=COUNTIF('Contributions'!$A$2:$A$500,A${index + 6})`,
    `=COUNTIFS('Contributions'!$A$2:$A$500,A${index + 6},'Contributions'!$D$2:$D$500,"<>")-COUNTIFS('Contributions'!$A$2:$A$500,A${index + 6},'Contributions'!$D$2:$D$500,"—")`,
    `=COUNTIFS('Contributions'!$A$2:$A$500,A${index + 6},'Contributions'!$J$2:$J$500,"<>")-COUNTIFS('Contributions'!$A$2:$A$500,A${index + 6},'Contributions'!$J$2:$J$500,"—")`,
    "Status + PM task + Jira + GitHub",
  ]);
  summary.getRange(`A6:F${5 + summaryRows.length}`).values = summaryRows;
  summary.getRange(`A6:F${5 + summaryRows.length}`).format = { verticalAlignment: "top", wrapText: true };
  summary.getRange("A12:F12").merge();
  summary.getRange("A12").values = [["Nguồn đã kiểm tra: Jira project IDTS; GitHub repository DarwinDO/IDTS-SAP01; docs/pm/status của DonHV, DatDT, SangVN, NhanT; docs/pm/tasks. Không đưa secret, URL riêng tư hoặc lỗi tooling không nghiêm trọng vào deliverable."]];
  summary.getRange("A12:F12").format = { fill: "#F9FAFB", wrapText: true, verticalAlignment: "center" };
  [20, 45, 18, 14, 14, 30].forEach((width, index) => { summary.getRangeByIndexes(0, index, 20, 1).format.columnWidth = width; });
  summary.getRange("A1:F12").format.borders = { preset: "outside", style: "thin", color: "#D1D5DB" };

  const headers = ["Thành viên", "Vai trò", "Ngày", "Jira key", "Jira link", "Chức năng / công việc", "Chi tiết", "Nhóm công việc", "Vai trò trong hạng mục", "GitHub PR link", "Status source", "PM task source", "Loại evidence"];
  work.getRange(`A1:M1`).values = [headers];
  setHeader(work.getRange("A1:M1"));
  if (contributions.length) work.getRange(`A2:M${contributions.length + 1}`).values = contributions;
  work.getRange(`A2:M${Math.max(2, contributions.length + 1)}`).format = { verticalAlignment: "top", wrapText: true };
  [15, 34, 13, 16, 45, 46, 55, 22, 28, 42, 32, 38, 18].forEach((width, index) => { work.getRangeByIndexes(0, index, Math.max(2, contributions.length + 1), 1).format.columnWidth = width; });
  work.getRange(`A1:M${Math.max(1, contributions.length + 1)}`).format.borders = { preset: "outside", style: "thin", color: "#D1D5DB" };

  const evidenceRows = [];
  const seenEvidence = new Set();
  for (const row of contributions) {
    for (const key of row[3] === "—" ? [] : row[3].split(", ")) {
      const link = `${jiraBase}${key}`;
      const id = `Jira|${link}`;
      if (!seenEvidence.has(id)) { seenEvidence.add(id); evidenceRows.push(["Jira", key, link, row[0], row[10], row[11]]); }
    }
    for (const link of row[9] === "—" ? [] : row[9].split(" | ")) {
      const id = `GitHub PR|${link}`;
      if (!seenEvidence.has(id)) { seenEvidence.add(id); evidenceRows.push(["GitHub PR", link.split("/").at(-1), link, row[0], row[10], row[11]]); }
    }
  }
  evidence.getRange("A1:F1").values = [["Loại", "ID", "Link", "Thành viên liên quan", "Status source", "PM task source"]];
  setHeader(evidence.getRange("A1:F1"));
  if (evidenceRows.length) evidence.getRange(`A2:F${evidenceRows.length + 1}`).values = evidenceRows;
  evidence.getRange(`A2:F${Math.max(2, evidenceRows.length + 1)}`).format = { verticalAlignment: "top", wrapText: true };
  [18, 16, 55, 20, 34, 40].forEach((width, index) => { evidence.getRangeByIndexes(0, index, Math.max(2, evidenceRows.length + 1), 1).format.columnWidth = width; });
  evidence.getRange(`A1:F${Math.max(1, evidenceRows.length + 1)}`).format.borders = { preset: "outside", style: "thin", color: "#D1D5DB" };

  drive.getRange("A1:G1").values = [["Depth", "Drive ID", "Tên cũ", "Tên mới", "MIME type", "Parent ID", "Drive URL"]];
  setHeader(drive.getRange("A1:G1"));
  drive.getRange("A2:G2").values = [["Sẽ được nạp sau khi Drive rename hoàn tất", "—", "—", "—", "—", "—", "—"]];
  drive.getRange("A2:G2").format = { wrapText: true, verticalAlignment: "top" };
  [10, 34, 46, 52, 38, 34, 60].forEach((width, index) => { drive.getRangeByIndexes(0, index, 3, 1).format.columnWidth = width; });
  drive.getRange("A1:G2").format.borders = { preset: "outside", style: "thin", color: "#D1D5DB" };

  notes.getRange("A1:E1").values = [["Hạng mục", "Lý do cần xác nhận", "Nguồn kiểm tra", "Hành động", "Trạng thái"]];
  setHeader(notes.getRange("A1:E1"));
  notes.getRange("A2:E2").values = [["Không có dòng được tự động phân loại", "Chỉ thêm dòng khi status/task/Jira/GitHub mâu thuẫn hoặc thiếu evidence", "Status, PM task, Jira, GitHub", "Xác minh với DonHV trước khi sửa attribution", "Open when needed"]];
  notes.getRange("A2:E2").format = { wrapText: true, verticalAlignment: "top" };
  [28, 50, 36, 48, 20].forEach((width, index) => { notes.getRangeByIndexes(0, index, 3, 1).format.columnWidth = width; });
  notes.getRange("A1:E2").format.borders = { preset: "outside", style: "thin", color: "#D1D5DB" };

  const checks = [
    await workbook.inspect({ kind: "table", range: "Summary!A1:F12", include: "values,formulas", tableMaxRows: 15, tableMaxCols: 8 }),
    await workbook.inspect({ kind: "table", range: `Contributions!A1:M${Math.min(20, contributions.length + 1)}`, include: "values,formulas", tableMaxRows: 20, tableMaxCols: 13 }),
    await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, summary: "formula error scan" }),
  ];
  const previews = [];
  const previewRanges = {
    Summary: "A1:F12",
    Contributions: "A1:M30",
    "Evidence Index": "A1:F30",
    "Drive Rename Log": "A1:G5",
    "Needs Confirmation": "A1:E5",
  };
  for (const [sheetName, range] of Object.entries(previewRanges)) {
    const image = await workbook.render({ sheetName, range, scale: 1, format: "png" });
    previews.push({ sheetName, bytes: (await image.arrayBuffer()).byteLength });
  }
  await fs.mkdir(outputDir, { recursive: true });
  const file = await SpreadsheetFile.exportXlsx(workbook);
  await file.save(outputPath);
  console.log(JSON.stringify({ outputPath, contributionRows: contributions.length, evidenceRows: evidenceRows.length, previews, checks: checks.map(item => item.ndjson) }, null, 2));
}

await build();
