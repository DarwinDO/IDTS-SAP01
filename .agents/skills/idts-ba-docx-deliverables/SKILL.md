---
name: idts-ba-docx-deliverables
description: Create, review, update, or convert formal IDTS BA deliverables, especially SAP490 hybrid BRD, SRS, FRS, Markdown sources, and DOCX files. Use when working on docs/ba/brd, docs/ba/srs, docs/ba/frs, document templates, requirement tables, traceability matrices, approval/version tables, glossary, or DOCX layout for IDTS.
---

# IDTS BA DOCX Deliverables

## English

Use this skill as the primary coordinator for IDTS formal BA deliverables. It does not replace `AGENTS.md`, `docs/project-context.md`, the three canonical IDTS business files, SAP MCP routing, or SAP Fiori Guidelines. External BRD/SRS/FRS/DOCX skills are supporting references only.

### Source Priority

Follow this priority order when guidance conflicts:

1. User instruction in the current task.
2. `AGENTS.md`.
3. `docs/project-context.md`, PM handover files, and canonical IDTS business files.
4. SAP490 hybrid deliverable guidance and mentor decisions.
5. Existing BA/PM documents under `docs/ba/` and `docs/pm/`.
6. This skill.
7. External skills such as `brd-creation`, `srs-documentation`, `frs-creation`, `docx`, and `docx-manipulation`.

### Required Workflow

1. Read `docs/project-context.md` and relevant PM handover files before making deliverable decisions.
2. Use `product-discovery` first when a requirement is unclear, stakeholder-driven, workflow-related, or may change business scope.
3. Select the deliverable type:
   - BRD: business need, objectives, scope, stakeholders, business requirements, risks, KPIs, approval, and traceability.
   - SRS: software-level requirements, interfaces, functional requirements, NFRs, data expectations, constraints, and traceability. Read `references/srs-29148-guidelines.md` before drafting or reviewing an SRS.
   - FRS: detailed functional behavior, user interactions, validations, status/action rules, UI behavior, data rules, and acceptance criteria.
4. Keep formal deliverables split by language:
   - `docs/ba/brd/brd.en.md` and `docs/ba/brd/brd.vi.md`
   - `docs/ba/srs/srs.en.md` and `docs/ba/srs/srs.vi.md`
   - `docs/ba/frs/frs.en.md` and `docs/ba/frs/frs.vi.md`
5. Create matching DOCX files when requested or when the deliverable is prepared for review/submission.
6. Use true Word tables for version history, approvals, RACI, requirements, risks, glossary, and traceability. Do not convert tables into bullet lists or record blocks unless the user explicitly asks for a mobile-readable/plain-text variant.
7. Verify outputs before reporting completion.

### External Skill Routing

Read `references/external-skill-routing.md` when deciding how to use the newly installed external document skills.

Default routing:

- Use `brd-creation` as a checklist for business-first BRD structure, then adapt to IDTS and SAP490 hybrid.
- Use `references/srs-29148-guidelines.md` as the primary SRS quality and traceability guide. Use `srs-documentation` only as a secondary structure/checklist reference; do not blindly follow obsolete IEEE 830 wording when current project guidance or SAP490 needs differ.
- Use `frs-creation` for detailed functional behavior and acceptance criteria.
- Use `docx` only for advanced DOCX/OOXML, tracked changes, comments, or complex Word document manipulation.
- Use `docx-manipulation` for practical `python-docx` document generation and table formatting.
- Prefer the installed `documents` plugin/skill for final DOCX render-and-visual-QA when available.

### DOCX Quality Rules

- Plan the document layout before generating DOCX.
- Use real headings, paragraph styles, and true tables.
- Use readable table cell padding, repeated headers when possible, wrapped text, and controlled column widths.
- Prefer `python-docx` or the local `docs/ba/tools/markdown_to_docx.py` helper when table layout matters.
- Use Pandoc only when the Markdown structure converts cleanly or a suitable `reference.docx` is available.
- Use LibreOffice only as a conversion/checking helper, not as the source of business truth.
- Render DOCX to images/PDF and inspect the result before claiming completion when a DOCX is delivered.
- Keep generated DOCX editable and avoid hidden credentials, private endpoints, or personal data.

### SAP490 Google Workspace Sync

Read `../../../docs/sap490/sync-workflow.md` before syncing BRD/SRS/FRS, SAP490 templates, DOCX, XLSX, Google Docs, or Google Sheets.

Default sync position:

- Repository Markdown is the canonical source.
- Local DOCX/XLSX files are generated submission-ready artifacts.
- Google Docs and Google Sheets are mentor/team review copies.
- `gws` is the preferred repeatable automation layer for a multi-developer team after installation and configuration.
- Google Drive connector is the interactive Codex fallback for quick readback, comments, or one-off updates.
- Never edit `docs/sap490/templates/` originals directly; copy templates before filling content.

Vietnamese:

Đọc `../../../docs/sap490/sync-workflow.md` trước khi sync BRD/SRS/FRS, SAP490 template, DOCX, XLSX, Google Docs hoặc Google Sheets.

Vị trí sync mặc định:

- Markdown trong repository là source canonical.
- DOCX/XLSX local là artifact generated sẵn sàng để nộp.
- Google Docs và Google Sheets là bản review cho mentor/team.
- `gws` là lớp automation lặp lại được ưu tiên cho team nhiều developer sau khi cài và cấu hình.
- Google Drive connector là fallback tương tác trong Codex để readback, comment hoặc update một lần.
- Không chỉnh trực tiếp file gốc trong `docs/sap490/templates/`; luôn copy template trước khi fill nội dung.

### Verification

Use the smallest relevant checks:

- Markdown/source changed: `git diff --check` and inspect the affected headings/tables.
- BA/PM project artifacts changed: `npx ai-devkit@latest lint --json`.
- DOCX generated: confirm file existence, open/render visually through the Documents workflow when available, and inspect tables/pages for clipping or list-like table degradation.
- Pipeline changed: generate at least one representative DOCX and inspect that Markdown tables became Word tables.

## Vietnamese

Dùng skill này làm bộ điều phối chính cho các deliverable BA chính thức của IDTS. Skill này không thay thế `AGENTS.md`, `docs/project-context.md`, ba file nghiệp vụ canonical của IDTS, SAP MCP routing, hoặc SAP Fiori Guidelines. Các skill BRD/SRS/FRS/DOCX bên ngoài chỉ là nguồn hỗ trợ.

### Thứ Tự Ưu Tiên Nguồn

Khi hướng dẫn bị xung đột, dùng thứ tự ưu tiên sau:

1. Yêu cầu của user trong task hiện tại.
2. `AGENTS.md`.
3. `docs/project-context.md`, PM handover files, và các file nghiệp vụ canonical của IDTS.
4. Hướng dẫn SAP490 hybrid và quyết định từ mentor.
5. Các tài liệu BA/PM hiện có trong `docs/ba/` và `docs/pm/`.
6. Skill này.
7. Các skill bên ngoài như `brd-creation`, `srs-documentation`, `frs-creation`, `docx`, và `docx-manipulation`.

### Workflow Bắt Buộc

1. Đọc `docs/project-context.md` và PM handover file liên quan trước khi quyết định về deliverable.
2. Dùng `product-discovery` trước nếu requirement chưa rõ, đến từ stakeholder, liên quan workflow, hoặc có thể làm đổi scope nghiệp vụ.
3. Chọn loại deliverable:
   - BRD: business need, objective, scope, stakeholder, business requirement, risk, KPI, approval, và traceability.
   - SRS: software-level requirement, interface, functional requirement, NFR, data expectation, constraint, và traceability. Đọc `references/srs-29148-guidelines.md` trước khi draft hoặc review SRS.
   - FRS: functional behavior chi tiết, tương tác người dùng, validation, status/action rule, UI behavior, data rule, và acceptance criteria.
4. Giữ formal deliverable tách theo ngôn ngữ:
   - `docs/ba/brd/brd.en.md` và `docs/ba/brd/brd.vi.md`
   - `docs/ba/srs/srs.en.md` và `docs/ba/srs/srs.vi.md`
   - `docs/ba/frs/frs.en.md` và `docs/ba/frs/frs.vi.md`
5. Tạo DOCX tương ứng khi user yêu cầu hoặc khi deliverable chuẩn bị để review/nộp.
6. Dùng bảng Word thật cho version history, approval, RACI, requirement, risk, glossary, và traceability. Không chuyển bảng thành bullet list hoặc record block trừ khi user yêu cầu rõ một bản plain-text/mobile-readable.
7. Verify output trước khi báo hoàn tất.

### Routing Skill Bên Ngoài

Đọc `references/external-skill-routing.md` khi cần quyết định cách dùng các skill tài liệu bên ngoài vừa cài.

Routing mặc định:

- Dùng `brd-creation` như checklist cho cấu trúc BRD business-first, rồi điều chỉnh theo IDTS và SAP490 hybrid.
- Dùng `references/srs-29148-guidelines.md` làm guide chính cho chất lượng requirement và traceability của SRS. Chỉ dùng `srs-documentation` như nguồn checklist/cấu trúc phụ; không copy máy móc IEEE 830 nếu project guidance hiện tại hoặc SAP490 khác đi.
- Dùng `frs-creation` cho functional behavior chi tiết và acceptance criteria.
- Dùng `docx` chỉ khi cần DOCX/OOXML nâng cao, tracked changes, comments, hoặc thao tác Word phức tạp.
- Dùng `docx-manipulation` cho tạo tài liệu và format bảng thực dụng bằng `python-docx`.
- Ưu tiên `documents` plugin/skill để render và kiểm tra trực quan DOCX cuối cùng khi có sẵn.

### Rule Chất Lượng DOCX

- Lên layout tài liệu trước khi generate DOCX.
- Dùng heading thật, paragraph style, và bảng thật.
- Dùng padding ô bảng dễ đọc, header lặp lại khi có thể, text wrapping, và column width có kiểm soát.
- Ưu tiên `python-docx` hoặc helper local `docs/ba/tools/markdown_to_docx.py` khi layout bảng quan trọng.
- Chỉ dùng Pandoc khi cấu trúc Markdown convert sạch hoặc có `reference.docx` phù hợp.
- Dùng LibreOffice như công cụ convert/check, không dùng làm nguồn nghiệp vụ.
- Render DOCX ra image/PDF và kiểm tra trước khi báo hoàn tất nếu deliver DOCX.
- Giữ DOCX có thể chỉnh sửa và không chứa credentials, private endpoint, hoặc dữ liệu cá nhân.

### Verification

Dùng các check nhỏ nhất phù hợp:

- Markdown/source thay đổi: `git diff --check` và kiểm tra heading/bảng liên quan.
- Artifact BA/PM thay đổi: `npx ai-devkit@latest lint --json`.
- DOCX được tạo: xác nhận file tồn tại, render/kiểm tra trực quan bằng Documents workflow khi có, và kiểm tra bảng/trang không bị cắt hoặc bị biến thành dạng list.
- Pipeline thay đổi: generate ít nhất một DOCX đại diện và kiểm tra Markdown table đã thành Word table thật.
