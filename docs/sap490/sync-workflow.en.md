# SAP490 Google Workspace Sync Workflow

## English

### 1. Purpose

This document defines how the IDTS team should sync SAP490 deliverables between the repository, local DOCX/XLSX artifacts, Google Drive, Google Docs, and Google Sheets.

The goal is to support a multi-developer team without losing the repository as the source of truth.

### 2. Source Of Truth

| Layer | Role | Rule |
| --- | --- | --- |
| Repository Markdown | Canonical editable source | Update this first for BRD, SRS, FRS, BA/PM docs, decisions, risks, and requirements. |
| Local DOCX/XLSX/PPTX | Submission-ready template-filled artifact | Copy the matching SAP490 template first, then fill the copy from approved repository sources. Verify layout before sharing. |
| Google Docs/Sheets | Collaboration and mentor review copy | Use for comments, feedback, review, and shared visibility. Do not treat as canonical source. |
| Google Drive folder | Distribution and review location | Store review copies and generated artifacts. Do not store credentials. |

### 3. Preferred Tooling

| Need | Preferred tool | Fallback |
| --- | --- | --- |
| Repeatable team sync to Google Drive/Docs/Sheets | `gws` CLI | Google Drive connector |
| Interactive readback or quick check in Codex | Google Drive connector | `gws` CLI |
| Local DOCX creation or editing | Documents plugin, `python-docx`, project script that fills a copied template | Pandoc only for labeled drafts/prototypes, not final SAP490 submission files |
| Local XLSX creation or editing | Spreadsheets plugin, `openpyxl`, project script | Manual edit only when approved |
| Final DOCX layout verification | Documents render/export workflow, LibreOffice PDF export | Manual visual inspection |
| Final XLSX verification | Spreadsheets inspection, LibreOffice open/convert check | Manual visual inspection |

`gws` is preferred for repeated team automation because the same command or npm script can be run by different developers in different chat threads or local terminals. The Google Drive connector remains useful for quick interactive operations inside Codex.

### 4. Standard Sync Flow

1. Update repository source first.
2. Copy the matching SAP490 template and fill separate English and Vietnamese local DOCX/XLSX/PPTX files from approved repository source.
3. Verify generated DOCX/XLSX/PPTX layout locally.
4. Use `gws` to upload or update the matching Google Drive files.
5. Convert DOCX review copies to Google Docs when mentor comments are needed.
6. Sync structured tables to Google Sheets when a shared spreadsheet is useful.
7. Record the sync result in a project sync log or PM task note.
8. When mentor feedback arrives, update repository Markdown first.
9. Recreate the template-filled DOCX/XLSX/PPTX copies.
10. Sync the updated review copies again.

### 5. Google Sheets Targets

Use Google Sheets for structured collaboration when a table is easier to review than a document section.

Recommended sheets:

| Sheet | Source |
| --- | --- |
| Requirement Backlog | `docs/ba/04-requirement-backlog.md` and BRD/SRS/FRS requirement tables |
| Traceability Matrix | BRD/SRS/FRS traceability sections |
| Business Rule Matrix | `IDTS-Business-Rule.md` and FRS validation/status rules |
| Risk and Decision Log | `docs/pm/risk-decision-log.md` |
| Open Questions | BRD/SRS/FRS open issue sections and PM task files |
| Test Case / Test Report | `docs/sap490/templates/2_SAP490_Test Report Template (1).xlsx` and future QA test artifacts |

### 6. Template Preservation Rules

Treat `docs/sap490/templates/` as read-only source templates.

Do:

- Copy a template before filling it.
- Keep English and Vietnamese SAP490 deliverables in separate files.
- Fill only approved placeholders, named ranges, mapped sections, or mapped table rows.
- Preserve page setup, styles, headers, footers, cover pages, table layout, formulas, merged cells, and sheet structure.
- Render/export generated DOCX files before reporting completion when layout matters.
- Inspect generated XLSX files before reporting completion when formulas or format matter.

Do not:

- Edit SAP490 template originals directly.
- Rebuild a DOCX or XLSX from scratch when the task is to fill a school template.
- Use Markdown/Pandoc output as a final SAP490 submission file unless the user explicitly approves a labeled prototype.
- Mix English and Vietnamese in the same SAP490 deliverable unless the school template requires a bilingual field.
- Replace a whole document or sheet when only a mapped section should be updated.
- Delete Google Drive files without explicit user approval.
- Commit credentials, tokens, Drive file IDs, OAuth data, or private sync config.

### 7. Local Config And Security

Keep local sync configuration outside git.

Allowed in git:

- Generic workflow documentation.
- Non-secret template mapping documentation.
- Generated deliverables when the team decides to version them.

Not allowed in git:

- Google OAuth credentials.
- `gws` local token/config files.
- Private Drive folder IDs or file IDs.
- Local sync config containing personal account or Drive details.

Recommended local-only config names:

- `docs/sap490/sync.local.json`
- `docs/sap490/drive-ids.local.json`
- `.gws/`
- `gws-credentials.json`

### 8. Conflict Handling

If Google Docs/Sheets contains mentor comments or manual edits, do not overwrite immediately.

Use this rule:

1. Read Google feedback.
2. Decide whether it changes project meaning.
3. Update repository Markdown and PM/canonical docs when needed.
4. Regenerate local artifacts.
5. Sync a new review version or update the existing Drive file only after readback.

When two developers sync the same file, the developer who last changed repository source should recreate the template-filled copy and sync. If both changed source, merge the repository changes first.

### 9. Available Local Scripts

These scripts are available for safe setup and dry-run checks. They do not upload, update, overwrite, or delete Google Drive files.

| Script | Purpose |
| --- | --- |
| `npm run sap490:gws:version` | Check the local `gws` CLI version. |
| `npm run sap490:gws:auth-status` | Check whether the current developer has authenticated `gws`. |
| `npm run sap490:gws:check` | Check `gws`, auth status, and local Drive config presence. |
| `npm run sap490:gws:find-review-folder` | Search Google Drive for the `SAP490 Review` folder after login. |
| `npm run sap490:gws:dry-run` | Print planned BRD/SRS/FRS Drive sync targets without changing remote files. |
| `npm run sap490:gws:upload-review-docx` | Dry-run upload planning for timestamped BRD/SRS/FRS review DOCX copies. |
| `npm run sap490:gws:upload-review-docx:execute` | Upload timestamped BRD/SRS/FRS review DOCX copies without overwriting existing files. |
| `npm run sap490:gws:sync-review-sheets` | Dry-run creation of a timestamped Google Sheets review workbook. |
| `npm run sap490:gws:sync-review-sheets:execute` | Create a timestamped Google Sheets review workbook with backlog, traceability, business rules, risks/decisions, and open questions. |

The upload script always creates new timestamped review copies. It does not overwrite existing Drive files. Use `node scripts/sap490/upload-review-docx.mjs --execute --as-google-docs` only when the team wants Google Docs imports for mentor comments.

The Google Sheets sync script always creates a new timestamped workbook. It does not overwrite existing spreadsheets. Updating an existing spreadsheet should be added only after the team verifies folder IDs, permissions, and overwrite rules.

### 10. Completion Checklist

Before reporting a SAP490 sync task as complete:

- Repository source was updated first.
- English and Vietnamese SAP490 files are separated when the artifact is project-authored.
- Generated DOCX/XLSX/PPTX files were copied from templates and checked.
- SAP490 templates were not edited directly.
- Template layout, fonts, tables, formulas, headers/footers, and cover pages were preserved.
- Vietnamese text was checked for encoding, accent, and mojibake issues.
- Google Drive/Docs/Sheets target was identified.
- Sync result was read back or otherwise verified.
- Credentials and private config were not committed.
- Relevant PM task/status or risk/decision entry was updated when the sync affects delivery coordination.

