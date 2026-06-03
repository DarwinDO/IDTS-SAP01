import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const configPath = resolve("docs/sap490/drive-ids.local.json");

const artifacts = [
  {
    type: "BRD DOCX",
    localPath: "docs/ba/brd/brd.en.docx",
    reviewName: "IDTS_BRD_EN.docx"
  },
  {
    type: "BRD DOCX",
    localPath: "docs/ba/brd/brd.vi.docx",
    reviewName: "IDTS_BRD_VI.docx"
  },
  {
    type: "SRS DOCX",
    localPath: "docs/ba/srs/srs.en.docx",
    reviewName: "IDTS_SRS_EN.docx"
  },
  {
    type: "SRS DOCX",
    localPath: "docs/ba/srs/srs.vi.docx",
    reviewName: "IDTS_SRS_VI.docx"
  },
  {
    type: "FRS DOCX",
    localPath: "docs/ba/frs/frs.en.docx",
    reviewName: "IDTS_FRS_EN.docx"
  },
  {
    type: "FRS DOCX",
    localPath: "docs/ba/frs/frs.vi.docx",
    reviewName: "IDTS_FRS_VI.docx"
  }
];

let config = {};
if (existsSync(configPath)) {
  config = JSON.parse(readFileSync(configPath, "utf8"));
}

const reviewFolderId = config?.googleWorkspace?.reviewFolderId || "<missing local reviewFolderId>";

console.log("SAP490 Google Workspace dry run");
console.log("--------------------------------");
console.log(`Config: ${existsSync(configPath) ? configPath : "missing"}`);
console.log(`Target review folder: ${reviewFolderId}`);
console.log("");

for (const artifact of artifacts) {
  const exists = existsSync(resolve(artifact.localPath));
  console.log(`- ${artifact.type}`);
  console.log(`  local: ${artifact.localPath}`);
  console.log(`  exists: ${exists ? "yes" : "no"}`);
  console.log(`  would upload/update as: ${artifact.reviewName}`);
  console.log("");
}

console.log("No remote file was changed.");
console.log("Next write script should require a valid local config and explicit overwrite mode.");
