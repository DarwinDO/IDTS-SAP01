import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const localConfigPath = resolve("docs/sap490/drive-ids.local.json");
const gwsRun = resolve("node_modules/@googleworkspace/cli/run.js");

function run(args) {
  const result = spawnSync(process.execPath, [gwsRun, ...args], {
    encoding: "utf8"
  });

  return {
    status: result.status ?? 1,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || result.error?.message || "").trim()
  };
}

function printResult(label, result) {
  console.log(`\n[${label}] exit=${result.status}`);
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
}

let failed = false;

const version = run(["--version"]);
printResult("gws version", version);
if (version.status !== 0) failed = true;

const authStatus = run(["auth", "status"]);
printResult("gws auth status", authStatus);
let authMethod = "unknown";
try {
  authMethod = JSON.parse(authStatus.stdout || "{}").auth_method || "none";
} catch {
  authMethod = "unreadable";
}

if (authStatus.status !== 0 || authMethod === "none" || authMethod === "unreadable") {
  failed = true;
  console.error("\nAction needed: run `npx gws auth login` or configure OAuth credentials locally.");
}

if (existsSync(localConfigPath)) {
  try {
    const config = JSON.parse(readFileSync(localConfigPath, "utf8"));
    const reviewFolderId = config?.googleWorkspace?.reviewFolderId;
    const templateFolderId = config?.googleWorkspace?.deliverableTemplateFolderId;

    console.log(`\n[local config] ${localConfigPath}`);
    console.log(`reviewFolderId: ${reviewFolderId ? "present" : "missing"}`);
    console.log(`deliverableTemplateFolderId: ${templateFolderId ? "present" : "missing"}`);

    if (!reviewFolderId) failed = true;

    if (authMethod !== "none" && authMethod !== "unreadable") {
      for (const [label, fileId] of [
        ["review folder", reviewFolderId],
        ["deliverable template folder", templateFolderId]
      ]) {
        if (!fileId) continue;
        const metadata = run([
          "drive",
          "files",
          "get",
          "--params",
          JSON.stringify({
            fileId,
            fields: "id,name,mimeType,webViewLink"
          }),
          "--format",
          "json"
        ]);
        printResult(`Drive metadata: ${label}`, metadata);
        if (metadata.status !== 0) failed = true;
      }
    }
  } catch (error) {
    failed = true;
    console.error(`\n[local config] invalid JSON: ${error.message}`);
  }
} else {
  failed = true;
  console.error(`\n[local config] missing ${localConfigPath}`);
  console.error("Create it from docs/sap490/drive-ids.example.json.");
}

process.exit(failed ? 1 : 0);
