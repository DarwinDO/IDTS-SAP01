import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const configPath = resolve("docs/sap490/drive-ids.local.json");
const logPath = resolve("docs/sap490/sync.local.log.jsonl");
const gwsRun = resolve("node_modules/@googleworkspace/cli/run.js");
const docxMimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const googleDocsMimeType = "application/vnd.google-apps.document";

const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const convertToGoogleDocs = args.has("--as-google-docs");
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

function outputName(baseName) {
  const ext = extname(baseName);
  const stem = ext ? baseName.slice(0, -ext.length) : baseName;
  return convertToGoogleDocs ? `${stem}_${tag}` : `${stem}_${tag}${ext || ".docx"}`;
}

function runGws(args) {
  return spawnSync(process.execPath, [gwsRun, ...args], {
    encoding: "utf8"
  });
}

function uploadArtifact({ localDocx, driveReviewName }, reviewFolderId) {
  const localPath = resolve(localDocx);
  const name = outputName(driveReviewName || basename(localDocx));
  const metadata = {
    name,
    parents: [reviewFolderId],
    mimeType: convertToGoogleDocs ? googleDocsMimeType : docxMimeType
  };

  if (!existsSync(localPath)) {
    return {
      ok: false,
      skipped: true,
      name,
      localDocx,
      reason: "local DOCX missing"
    };
  }

  if (!execute) {
    return {
      ok: true,
      dryRun: true,
      name,
      localDocx,
      targetFolderId: reviewFolderId,
      convertToGoogleDocs
    };
  }

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
    JSON.stringify(metadata),
    "--upload",
    localPath,
    "--upload-content-type",
    docxMimeType,
    "--format",
    "json"
  ]);

  if (result.status !== 0) {
    return {
      ok: false,
      name,
      localDocx,
      stderr: (result.stderr || result.error?.message || "").trim(),
      stdout: (result.stdout || "").trim()
    };
  }

  const response = JSON.parse(result.stdout || "{}");
  appendFileSync(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    action: convertToGoogleDocs ? "upload-review-google-doc" : "upload-review-docx",
    source: localDocx,
    driveName: response.name,
    driveFileId: response.id,
    webViewLink: response.webViewLink,
    mimeType: response.mimeType,
    parentFolderId: reviewFolderId
  }) + "\n", "utf8");

  return {
    ok: true,
    name: response.name,
    id: response.id,
    webViewLink: response.webViewLink,
    mimeType: response.mimeType
  };
}

function main() {
  const config = loadConfig();
  const reviewFolderId = config?.googleWorkspace?.reviewFolderId;
  const artifacts = Object.values(config?.reviewArtifacts || {});

  if (!reviewFolderId) {
    throw new Error("Missing googleWorkspace.reviewFolderId in docs/sap490/drive-ids.local.json.");
  }
  if (!artifacts.length) {
    throw new Error("No reviewArtifacts configured in docs/sap490/drive-ids.local.json.");
  }

  console.log("SAP490 review DOCX upload");
  console.log("-------------------------");
  console.log(`Mode: ${execute ? "EXECUTE" : "DRY-RUN"}`);
  console.log(`Target: ${reviewFolderId}`);
  console.log(`Tag: ${tag}`);
  console.log(`Output type: ${convertToGoogleDocs ? "Google Docs import" : "DOCX binary"}`);
  console.log("");

  let failures = 0;
  for (const artifact of artifacts) {
    const result = uploadArtifact(artifact, reviewFolderId);
    if (!result.ok) failures += 1;

    if (result.dryRun) {
      console.log(`[dry-run] ${artifact.localDocx} -> ${result.name}`);
    } else if (result.ok) {
      console.log(`[uploaded] ${artifact.localDocx} -> ${result.name}`);
      console.log(`           ${result.webViewLink}`);
    } else {
      console.error(`[failed] ${artifact.localDocx} -> ${result.name}`);
      console.error(`         ${result.reason || result.stderr || result.stdout || "unknown error"}`);
    }
  }

  console.log("");
  if (!execute) {
    console.log("No remote file was changed. Re-run with `--execute` to upload new review copies.");
  } else {
    console.log(`Local sync log: ${logPath}`);
  }

  process.exit(failures ? 1 : 0);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
