# SAP490 Google Workspace Sync Workflow

## English

### 1. Purpose

This document defines how the IDTS team should sync SAP490 deliverables between the repository, local DOCX/XLSX artifacts, Google Drive, Google Docs, and Google Sheets.

The goal is to support a multi-developer team without losing the repository as the source of truth.

### 2. Source Of Truth

| Layer | Role | Rule |
| --- | --- | --- |
| Repository Markdown | Canonical editable source | Update this first for BRD, SRS, FRS, BA/PM docs, decisions, risks, and requirements. |
| Local DOCX/XLSX | Submission-ready generated artifact | Generate from repository sources and SAP490 templates. Verify layout before sharing. |
| Google Docs/Sheets | Collaboration and mentor review copy | Use for comments, feedback, review, and shared visibility. Do not treat as canonical source. |
| Google Drive folder | Distribution and review location | Store review copies and generated artifacts. Do not store credentials. |

### 3. Preferred Tooling

| Need | Preferred tool | Fallback |
| --- | --- | --- |
| Repeatable team sync to Google Drive/Docs/Sheets | `gws` CLI | Google Drive connector |
| Interactive readback or quick check in Codex | Google Drive connector | `gws` CLI |
| Local DOCX creation or editing | Documents plugin, `python-docx`, project script | Pandoc with a verified `reference.docx` |
| Local XLSX creation or editing | Spreadsheets plugin, `openpyxl`, project script | Manual edit only when approved |
| Final DOCX layout verification | Documents render/export workflow, LibreOffice PDF export | Manual visual inspection |
| Final XLSX verification | Spreadsheets inspection, LibreOffice open/convert check | Manual visual inspection |

`gws` is preferred for repeated team automation because the same command or npm script can be run by different developers in different chat threads or local terminals. The Google Drive connector remains useful for quick interactive operations inside Codex.

### 4. Standard Sync Flow

1. Update repository Markdown first.
2. Regenerate local DOCX/XLSX from repository source and SAP490 templates.
3. Verify generated DOCX/XLSX layout locally.
4. Use `gws` to upload or update the matching Google Drive files.
5. Convert DOCX review copies to Google Docs when mentor comments are needed.
6. Sync structured tables to Google Sheets when a shared spreadsheet is useful.
7. Record the sync result in a project sync log or PM task note.
8. When mentor feedback arrives, update repository Markdown first.
9. Regenerate DOCX/XLSX.
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
- Fill only approved placeholders, named ranges, mapped sections, or mapped table rows.
- Preserve page setup, styles, headers, footers, cover pages, table layout, formulas, merged cells, and sheet structure.
- Render/export generated DOCX files before reporting completion when layout matters.
- Inspect generated XLSX files before reporting completion when formulas or format matter.

Do not:

- Edit SAP490 template originals directly.
- Rebuild a DOCX or XLSX from scratch when the task is to fill a school template.
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

When two developers sync the same file, the developer who last changed repository source should regenerate and sync. If both changed source, merge the repository changes first.

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
- Generated DOCX/XLSX files were checked.
- SAP490 templates were not edited directly.
- Google Drive/Docs/Sheets target was identified.
- Sync result was read back or otherwise verified.
- Credentials and private config were not committed.
- Relevant PM task/status or risk/decision entry was updated when the sync affects delivery coordination.

## Vietnamese

### 1. Mục Đích

Tài liệu này định nghĩa cách team IDTS sync deliverable SAP490 giữa repository, artifact DOCX/XLSX local, Google Drive, Google Docs và Google Sheets.

Mục tiêu là hỗ trợ team nhiều developer cùng làm mà vẫn giữ repository là source of truth.

### 2. Source Of Truth

| Layer | Vai trò | Rule |
| --- | --- | --- |
| Repository Markdown | Nguồn canonical có thể chỉnh sửa | Cập nhật phần này trước cho BRD, SRS, FRS, tài liệu BA/PM, decision, risk và requirement. |
| DOCX/XLSX local | Artifact generated sẵn sàng để nộp | Generate từ source trong repo và SAP490 template. Verify layout trước khi share. |
| Google Docs/Sheets | Bản collaboration và mentor review | Dùng cho comment, feedback, review và shared visibility. Không xem là source canonical. |
| Google Drive folder | Nơi phân phối và review | Lưu bản review và artifact generated. Không lưu credential. |

### 3. Tooling Ưu Tiên

| Nhu cầu | Tool ưu tiên | Fallback |
| --- | --- | --- |
| Sync lặp lại cho team lên Google Drive/Docs/Sheets | `gws` CLI | Google Drive connector |
| Readback hoặc kiểm tra nhanh trong Codex | Google Drive connector | `gws` CLI |
| Tạo hoặc chỉnh DOCX local | Documents plugin, `python-docx`, project script | Pandoc với `reference.docx` đã verify |
| Tạo hoặc chỉnh XLSX local | Spreadsheets plugin, `openpyxl`, project script | Chỉnh thủ công khi được duyệt |
| Verify layout DOCX cuối | Documents render/export workflow, LibreOffice PDF export | Kiểm tra trực quan thủ công |
| Verify XLSX cuối | Spreadsheets inspection, LibreOffice open/convert check | Kiểm tra trực quan thủ công |

`gws` được ưu tiên cho automation lặp lại vì cùng một command hoặc npm script có thể được chạy bởi nhiều developer ở nhiều chat thread hoặc terminal khác nhau. Google Drive connector vẫn hữu ích cho thao tác tương tác nhanh bên trong Codex.

### 4. Flow Sync Chuẩn

1. Cập nhật Markdown trong repo trước.
2. Regenerate DOCX/XLSX local từ source trong repo và SAP490 template.
3. Verify layout DOCX/XLSX generated ở local.
4. Dùng `gws` để upload hoặc update file tương ứng trên Google Drive.
5. Convert bản DOCX review sang Google Docs khi cần mentor comment.
6. Sync bảng có cấu trúc sang Google Sheets khi cần shared spreadsheet.
7. Ghi kết quả sync vào sync log hoặc PM task note.
8. Khi có feedback từ mentor, cập nhật Markdown trong repo trước.
9. Regenerate DOCX/XLSX.
10. Sync lại bản review đã cập nhật.

### 5. Google Sheets Mục Tiêu

Dùng Google Sheets cho collaboration dạng bảng khi table dễ review hơn một section trong tài liệu.

Các sheet khuyến nghị:

| Sheet | Source |
| --- | --- |
| Requirement Backlog | `docs/ba/04-requirement-backlog.md` và bảng requirement trong BRD/SRS/FRS |
| Traceability Matrix | Section traceability trong BRD/SRS/FRS |
| Business Rule Matrix | `IDTS-Business-Rule.md` và validation/status rule trong FRS |
| Risk and Decision Log | `docs/pm/risk-decision-log.md` |
| Open Questions | Section open issue trong BRD/SRS/FRS và PM task files |
| Test Case / Test Report | `docs/sap490/templates/2_SAP490_Test Report Template (1).xlsx` và QA artifact sau này |

### 6. Rule Bảo Toàn Template

Xem `docs/sap490/templates/` là source template dạng read-only.

Nên làm:

- Copy template trước khi fill.
- Chỉ fill placeholder, named range, section đã map, hoặc dòng bảng đã map.
- Giữ nguyên page setup, style, header, footer, cover page, table layout, formula, merged cell và cấu trúc sheet.
- Render/export DOCX generated trước khi báo hoàn tất nếu layout quan trọng.
- Kiểm tra XLSX generated trước khi báo hoàn tất nếu formula hoặc format quan trọng.

Không được làm:

- Chỉnh trực tiếp template SAP490 gốc.
- Build lại DOCX hoặc XLSX từ đầu khi task là fill school template.
- Replace toàn bộ document hoặc sheet khi chỉ cần update một section đã map.
- Xóa file Google Drive nếu chưa được user duyệt rõ.
- Commit credential, token, Drive file ID, OAuth data, hoặc private sync config.

### 7. Local Config Và Security

Giữ local sync config ngoài git.

Được phép commit:

- Tài liệu workflow chung.
- Tài liệu mapping template không chứa secret.
- Generated deliverable khi team quyết định version chúng.

Không được commit:

- Google OAuth credential.
- Token/config local của `gws`.
- Private Drive folder ID hoặc file ID.
- Local sync config có thông tin tài khoản cá nhân hoặc Drive detail.

Tên config local khuyến nghị:

- `docs/sap490/sync.local.json`
- `docs/sap490/drive-ids.local.json`
- `.gws/`
- `gws-credentials.json`

### 8. Xử Lý Conflict

Nếu Google Docs/Sheets có comment của mentor hoặc manual edit, không overwrite ngay.

Dùng rule này:

1. Đọc feedback trên Google.
2. Quyết định feedback đó có làm đổi ý nghĩa project không.
3. Cập nhật Markdown trong repo và PM/canonical docs khi cần.
4. Regenerate artifact local.
5. Sync bản review mới hoặc update file Drive hiện tại sau khi readback.

Khi hai developer cùng sync một file, developer vừa đổi source trong repo gần nhất nên regenerate và sync. Nếu cả hai cùng đổi source, merge thay đổi trong repo trước.

### 9. Script Local Đã Có

Các script này đã có để setup an toàn và dry-run. Chúng không upload, update, overwrite hoặc delete file Google Drive.

| Script | Mục đích |
| --- | --- |
| `npm run sap490:gws:version` | Kiểm tra version `gws` local. |
| `npm run sap490:gws:auth-status` | Kiểm tra developer hiện tại đã authenticate `gws` chưa. |
| `npm run sap490:gws:check` | Kiểm tra `gws`, auth status và local Drive config. |
| `npm run sap490:gws:find-review-folder` | Tìm folder `SAP490 Review` trên Google Drive sau khi login. |
| `npm run sap490:gws:dry-run` | In ra target sync BRD/SRS/FRS lên Drive mà không đổi file remote. |
| `npm run sap490:gws:upload-review-docx` | Dry-run kế hoạch upload bản review DOCX BRD/SRS/FRS có timestamp. |
| `npm run sap490:gws:upload-review-docx:execute` | Upload bản review DOCX BRD/SRS/FRS có timestamp mà không overwrite file hiện có. |
| `npm run sap490:gws:sync-review-sheets` | Dry-run việc tạo Google Sheets review workbook có timestamp. |
| `npm run sap490:gws:sync-review-sheets:execute` | Tạo Google Sheets review workbook có timestamp gồm backlog, traceability, business rules, risks/decisions và open questions. |

Script upload luôn tạo bản review mới có timestamp. Script không overwrite file Drive hiện có. Chỉ dùng `node scripts/sap490/upload-review-docx.mjs --execute --as-google-docs` khi team muốn import thành Google Docs để mentor comment.

Script sync Google Sheets luôn tạo workbook mới có timestamp. Script không overwrite spreadsheet hiện có. Việc update spreadsheet hiện có chỉ nên thêm sau khi team verify folder ID, permission và overwrite rule.

### 10. Checklist Hoàn Tất

Trước khi báo một task sync SAP490 là hoàn tất:

- Source trong repo đã được cập nhật trước.
- File DOCX/XLSX generated đã được kiểm tra.
- Template SAP490 không bị chỉnh trực tiếp.
- Target Google Drive/Docs/Sheets đã được xác định.
- Kết quả sync đã được readback hoặc verify bằng cách phù hợp.
- Credential và private config không bị commit.
- PM task/status hoặc risk/decision liên quan đã được cập nhật khi sync ảnh hưởng delivery coordination.
