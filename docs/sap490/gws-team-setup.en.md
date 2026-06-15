# SAP490 `gws` Team Setup Guide

## English

### 1. Purpose

This guide helps each IDTS developer install, authenticate, and use the local `gws` workflow for SAP490 Google Drive, Google Docs, and Google Sheets collaboration.

Use this guide together with:

- `docs/sap490/sync-workflow.en.md`
- `docs/sap490/drive-ids.example.json`
- `AGENTS.md`

### 2. What This Setup Does

The setup gives every developer the same local command surface:

| Command | Purpose |
| --- | --- |
| `npm run sap490:gws:version` | Verify the local `gws` CLI version. |
| `npm run sap490:gws:auth-status` | Check whether the current developer is authenticated. |
| `npm run sap490:gws:check` | Check CLI, auth, and local Drive config. |
| `npm run sap490:gws:find-review-folder` | Find the `SAP490 Review` folder in the developer's Google Drive access scope. |
| `npm run sap490:gws:dry-run` | Show planned BRD/SRS/FRS Drive sync targets without changing remote files. |
| `npm run sap490:gws:upload-review-docx` | Preview timestamped BRD/SRS/FRS DOCX review uploads. |
| `npm run sap490:gws:upload-review-docx:execute` | Upload timestamped BRD/SRS/FRS DOCX review copies without overwriting existing files. |
| `npm run sap490:gws:sync-review-sheets` | Preview a timestamped Google Sheets review workbook. |
| `npm run sap490:gws:sync-review-sheets:execute` | Create a timestamped Google Sheets review workbook without overwriting existing spreadsheets. |

Current scripts are intentionally read/check/dry-run oriented. They do not upload, overwrite, or delete files.

### 3. Prerequisites

Each developer needs:

- Node.js available locally.
- Repository dependencies installed with `npm install`.
- Google account access to the `SAP490 Review` Drive folder.
- A local Google Workspace OAuth setup for `gws`.

The project uses `@googleworkspace/cli` as a dev dependency. Do not install the unrelated `gws` npm package because that package is a different tool.

### 4. Install Project Dependencies

From the repository root:

```powershell
npm install
```

Verify the local CLI:

```powershell
npm run sap490:gws:version
```

Expected result:

```text
gws 0.22.5
This is not an officially supported Google product.
```

### 5. Authenticate `gws`

Check current auth status:

```powershell
npm run sap490:gws:auth-status
```

If not authenticated, use one of these approaches.

Approach A: team-provided OAuth client

1. Get the OAuth client ID and client secret from the team owner or Google Cloud project owner.
2. Store them in your local user environment, not in the repo.
3. Run:

```powershell
npx gws auth login
```

Approach B: local setup through Google Cloud CLI

Use this only if you have Google Cloud access and permission to create or configure OAuth clients:

```powershell
npx gws auth setup
npx gws auth login
```

Never commit OAuth credentials, token files, generated config, or Drive IDs.

### 6. Create Local Drive Config

Copy the example config:

```powershell
Copy-Item docs/sap490/drive-ids.example.json docs/sap490/drive-ids.local.json
```

Then edit `docs/sap490/drive-ids.local.json` locally.

Required fields:

| Field | Meaning |
| --- | --- |
| `googleWorkspace.reviewFolderId` | Google Drive folder ID for `SAP490 Review`. |
| `googleWorkspace.deliverableTemplateFolderId` | Google Drive folder ID for `Deliverable_template`. |

This local file is ignored by git.

### 7. Find The Review Folder

After authentication, run:

```powershell
npm run sap490:gws:find-review-folder
```

Use the returned folder ID for `googleWorkspace.reviewFolderId` in `docs/sap490/drive-ids.local.json`.

If the folder is not found:

- Confirm that the Google account has access to the `SAP490 Review` folder.
- Confirm that the folder name is exactly `SAP490 Review`.
- Ask the Drive owner to share the folder with the developer account.

### 8. Run Local Check

Run:

```powershell
npm run sap490:gws:check
```

The check should confirm:

- `gws` is installed.
- Authentication works.
- `docs/sap490/drive-ids.local.json` exists.
- `reviewFolderId` is present.

### 9. Run Dry-Run

Run:

```powershell
npm run sap490:gws:dry-run
```

This prints the BRD/SRS/FRS DOCX files that would be uploaded or updated later. It does not change Google Drive.

### 10. Team Usage Rule

For SAP490 deliverables:

1. Update Markdown in the repo first.
2. Regenerate local DOCX/XLSX.
3. Verify local layout.
4. Run `npm run sap490:gws:dry-run`.
5. Run `npm run sap490:gws:upload-review-docx` to preview upload names.
6. Run `npm run sap490:gws:upload-review-docx:execute` only when the team wants to create new review copies on Drive.
7. Run `npm run sap490:gws:sync-review-sheets` to preview the review workbook.
8. Run `npm run sap490:gws:sync-review-sheets:execute` only when the team wants to create a new Google Sheets workbook for structured review.

Google Docs and Google Sheets are review copies. The repository remains the source of truth.

To import DOCX files as native Google Docs for mentor comments, use:

```powershell
node scripts/sap490/upload-review-docx.mjs --execute --as-google-docs
```

This also creates new timestamped files. It does not overwrite existing Google Docs.

### 11. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `gws` is not recognized | Dependencies are not installed or command is run outside npm script context | Run `npm install`, then use `npm run sap490:gws:version`. |
| Auth status fails | OAuth login not completed | Run `npx gws auth login` after OAuth setup. |
| Folder search returns no result | Account cannot access folder or folder name differs | Ask Drive owner to share `SAP490 Review`; retry. |
| Local config missing | `drive-ids.local.json` not created | Copy from `drive-ids.example.json` and fill local IDs. |
| Dry-run shows missing DOCX | Document has not been generated yet | Regenerate BRD/SRS/FRS DOCX before sync planning. |

