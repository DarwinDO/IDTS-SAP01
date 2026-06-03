import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const folderName = process.argv.slice(2).join(" ").trim() || "SAP490 Review";
const escapedName = folderName.replaceAll("'", "\\'");
const gwsRun = resolve("node_modules/@googleworkspace/cli/run.js");

const params = {
  q: `name contains '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
  spaces: "drive",
  pageSize: 10,
  fields: "files(id,name,mimeType,webViewLink,modifiedTime)"
};

const result = spawnSync(
  process.execPath,
  [gwsRun, "drive", "files", "list", "--params", JSON.stringify(params), "--format", "json"],
  {
    encoding: "utf8"
  }
);

if (result.stdout) console.log(result.stdout.trim());
if (result.stderr || result.error) console.error((result.stderr || result.error.message).trim());

if (result.status !== 0) {
  console.error("\nCould not search Drive. Run `npx gws auth status` and `npx gws auth login` if needed.");
}

process.exit(result.status ?? 1);
