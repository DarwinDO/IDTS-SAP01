# DonHV Status - Leader / BA-PM / Cross-Workstream Support

Last updated: 2026-06-04

Vietnamese: Trạng thái của DonHV - Leader / BA-PM / hỗ trợ các workstream khác.

## Member Identity

| Field | Value |
| --- | --- |
| Member | DonHV |
| Team role | Leader |
| Primary responsibility | BA/PM coordination, SAP490 deliverables, project documentation, scope alignment, weekly consolidation |
| Support responsibility | May support Backend CAP, Fiori/UI5, and QA/Verification when needed |

Vietnamese:

| Trường | Giá trị |
| --- | --- |
| Thành viên | DonHV |
| Vai trò nhóm | Leader |
| Trách nhiệm chính | Điều phối BA/PM, deliverable SAP490, tài liệu dự án, thống nhất scope, tổng hợp hàng tuần |
| Trách nhiệm hỗ trợ | Có thể hỗ trợ Backend CAP, Fiori/UI5 và QA/Verification khi cần |

## Current Focus

Prepare and maintain the project baseline before Sprint 1 implementation: BA/PM documents, SAP490 template/sync workflow, team handover rules, and mentor review readiness.

Vietnamese: Chuẩn bị và duy trì baseline dự án trước Sprint 1: tài liệu BA/PM, workflow template/sync SAP490, rule handover trong team và trạng thái sẵn sàng review với mentor.

## Done

- BA documentation pack created under `docs/ba/`.
- PM documentation structure created under `docs/pm/`.
- BRD/SRS/FRS Markdown and DOCX deliverables created and maintained.
- SAP490 Google Workspace sync workflow, `gws` scripts, team setup guide, and template demo upload were prepared.
- MVP role baseline clarified as Tester, Developer, and PM.
- Optional Learning Recap / Mentor Mode was added for post-task teaching and teach-back.

Vietnamese:

- Đã tạo bộ tài liệu BA trong `docs/ba/`.
- Đã tạo cấu trúc tài liệu PM trong `docs/pm/`.
- Đã tạo và duy trì các deliverable BRD/SRS/FRS dạng Markdown và DOCX.
- Đã chuẩn bị workflow sync SAP490 Google Workspace, script `gws`, hướng dẫn setup team và demo upload template.
- Đã chốt baseline role MVP là Tester, Developer và PM.
- Đã thêm Learning Recap / Mentor Mode tùy chọn để dạy lại và kiểm tra hiểu sau task.

## In Progress

- Awaiting mentor/user review of BRD, SRS, FRS, SAP490 workflow, and PM execution plan.

Vietnamese:

- Đang chờ mentor/user review BRD, SRS, FRS, workflow SAP490 và kế hoạch triển khai PM.

## Next

- Consolidate weekly updates from `sangvn.md`, `datdt.md`, and `nhant.md`.
- Update project docs, SAP490 deliverables, Google Sheets, or Excel files after the team work session is complete.
- Support Sprint 1 WP1 Data Model Foundation when implementation starts.
- Keep risks and decisions updated in `docs/pm/risk-decision-log.md`.

Vietnamese:

- Tổng hợp cập nhật hằng tuần từ `sangvn.md`, `datdt.md` và `nhant.md`.
- Cập nhật tài liệu dự án, deliverable SAP490, Google Sheets hoặc file Excel sau khi phiên làm việc của nhóm hoàn tất.
- Hỗ trợ Sprint 1 WP1 Data Model Foundation khi bắt đầu implementation.
- Duy trì risk/decision trong `docs/pm/risk-decision-log.md`.

## Blockers

- None.

Vietnamese: Chưa có blocker.

## Session Log

Each work session should add a row here.

Vietnamese: Mỗi phiên làm việc cần thêm một dòng vào bảng này.

| Date | Task/WP | What was done | Completed part | Issues/Bugs found | Fix status | Evidence/Commands | Next handoff |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-06-03 | PM setup | Renamed status model from workstream files to member files and kept DonHV as leader/BA-PM owner | Team status ownership reset | None | Fixed | `rg`, `git diff --check` | Team members update their own status files |
| 2026-06-03 | SAP490 docs | Created SAP490 template inventory and usage guide | Template purpose/fill guidance documented | None | Fixed | `openpyxl`, `rg`, `git diff --check` | Use inventory before filling SAP490 templates |
| 2026-06-04 | Agent learning workflow | Added optional Learning Recap / Mentor Mode in AGENTS.md and `.agents/skills/learning-recap` | Mentor-style teach-back workflow integrated | None | Fixed | `rg`, `git diff --check`, `npx ai-devkit@latest lint --json` | Use after nontrivial tasks when requested or useful |
| 2026-06-04 | BA/database readiness | Extracted SRS/FRS diagrams into `docs/diagrams`, installed database modeling support, and wrote current database model review | Diagram pack and database review baseline completed | DBML CLI trial timed out and increased audit noise | Fixed by removing DBML CLI and keeping database skills only | `npx skills add`, `npm uninstall @dbml/cli`, `cds compile srv --to edmx`, `rg`, `git diff --check` | Confirm DB open questions, then start WP1 Data Model Foundation |
| 2026-06-04 | WP1 database baseline | Converted DB-Q01 to DB-Q08 from open questions into explicit WP1 database decisions and synced them to canonical docs | Database decision baseline completed | None | Fixed | `rg`, `cds compile srv --to edmx`, `npx ai-devkit@latest lint --json`, `git diff --check` | Backend can start WP1 after reviewing `docs/ba/09-database-model-review.md` |
| 2026-06-04 | MCP troubleshooting | Investigated why CAP MCP tools were not visible and documented the lazy-load fix using `tool_search` | CAP MCP exposure workflow documented | CAP MCP namespace was deferred in current Codex session | Fixed by `tool_search` discovery; CAP `search_docs` and `search_model` verified | `tool_search`, `mcp__cap.search_docs`, `mcp__cap.search_model`, `npx -y @cap-js/mcp-server --help` | Use `tool_search` first if MCP namespace is missing |
| 2026-06-04 | WP1 Data Model Foundation | Implemented CAP CDS model, service projections, and seed data as DonHV cross-workstream support for Backend CAP | WP1 model foundation completed | Business handlers are not implemented yet | Open for WP3, not a WP1 bug | `cds compile srv --to edmx`, `cds deploy --to sqlite::memory:`, `git diff --check`, `mcp__cap.search_docs`, `mcp__cap.search_model` | SangVN can continue with WP2/WP3; NhanT can prepare QA checks |
| 2026-06-04 | WP4 Fiori Elements UX | Reviewed DatDT `Sap_FE` repo and integrated useful List Report/Object Page ideas into current CAP/Fiori app | Initial annotation-driven UI pass and demo bug seed completed | Fiori MCP tool not exposed; DatDT attachment fragment is static and not service-backed | Partially fixed; annotations/build/browser smoke pass, attachment upload remains WP7 | `tool_search`, `mcp__cap.search_model`, `cds compile srv app/bug-management-ui --to edmx`, `cds deploy --to sqlite::memory:`, `npx ui5 build --config ui5.yaml --clean-dest --dest %TEMP%/idts-ui5-build`, Playwright browser smoke, `git diff --check` | DatDT can continue WP4 after WP2/WP3 value-help/action support |
| 2026-06-04 | WP2/WP3/WP4 continuation | Implemented service value helps, bound bug lifecycle actions, CAP handler validations, nextProcessor automation, history/notification side effects, and Fiori Object Page actions | WP2 and WP3 completed for MVP; WP4 core screens updated | Browser MCP has snapshot/screenshot but no click/type in this session; real attachment upload and deeper QA remain | Fixed for MVP; remaining items handed to WP4/WP7/QA | `tool_search`, `mcp__cap.search_docs`, `mcp__cap.search_model`, `mcp__fiori.search_docs`, `cds compile srv app/bug-management-ui --to edmx`, `cds deploy --to sqlite::memory:`, OData action smoke calls, `npx ui5 build --config ui5.yaml --clean-dest --dest $env:TEMP/idts-ui5-build`, Playwright browser smoke | SangVN can review WP2/WP3 backend; DatDT can continue UI usability QA; NhanT can prepare regression scenarios |
| 2026-06-04 | WP4 UI refinement | Adjusted List Report UX after visual review: GridTable layout, draft-enabled standard Create dialog, and semantic status display without default icons | UI refinement implemented and compile/build/browser verified | Toolbar standard action label remains `Create`; dialog title is `Create Bug`. Full manual create-save QA still needed | Fixed for MVP; manual UI QA remains | `mcp__fiori.search_docs`, `mcp__cap.search_docs`, `cds compile srv app/bug-management-ui --to edmx`, `npx ui5 build --config ui5.yaml --clean-dest --dest $env:TEMP/idts-ui-fix-build`, Playwright browser click/snapshot | DatDT should manually verify Create Bug save flow and table behavior in browser |

Vietnamese:

| Ngày | Task/WP | Đã làm gì | Phần đã xong | Khó khăn/Bug phát hiện | Trạng thái fix | Bằng chứng/Lệnh đã chạy | Handoff tiếp theo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-06-03 | PM setup | Đổi mô hình status từ file theo workstream sang file theo thành viên và giữ DonHV là leader/BA-PM owner | Đã reset ownership status của team | Không có | Đã xử lý | `rg`, `git diff --check` | Thành viên cập nhật file status của mình |
| 2026-06-03 | SAP490 docs | Tạo inventory và hướng dẫn sử dụng template SAP490 | Đã document mục đích và cách fill template | Không có | Đã xử lý | `openpyxl`, `rg`, `git diff --check` | Dùng inventory trước khi điền template SAP490 |
| 2026-06-04 | Agent learning workflow | Thêm Learning Recap / Mentor Mode tùy chọn trong AGENTS.md và `.agents/skills/learning-recap` | Đã tích hợp workflow dạy lại và teach-back | Không có | Đã xử lý | `rg`, `git diff --check`, `npx ai-devkit@latest lint --json` | Dùng sau task không tầm thường khi user yêu cầu hoặc khi hữu ích |

| 2026-06-04 | BA/database readiness | Tách diagram trong SRS/FRS vào `docs/diagrams`, cài hỗ trợ database modeling và viết review database model hiện tại | Đã hoàn tất diagram pack và baseline review database | DBML CLI thử nghiệm bị timeout và làm tăng audit noise | Đã xử lý bằng cách gỡ DBML CLI và chỉ giữ database skills | `npx skills add`, `npm uninstall @dbml/cli`, `cds compile srv --to edmx`, `rg`, `git diff --check` | Chốt các câu hỏi DB còn mở, rồi bắt đầu WP1 Data Model Foundation |
| 2026-06-04 | WP1 database baseline | Chuyển DB-Q01 đến DB-Q08 từ câu hỏi mở thành quyết định database rõ ràng cho WP1 và sync vào canonical docs | Đã hoàn tất baseline quyết định database | Không có | Đã xử lý | `rg`, `cds compile srv --to edmx`, `npx ai-devkit@latest lint --json`, `git diff --check` | Backend có thể bắt đầu WP1 sau khi đọc `docs/ba/09-database-model-review.md` |
| 2026-06-04 | MCP troubleshooting | Kiểm tra vì sao CAP MCP tools chưa hiện và document cách lazy-load bằng `tool_search` | Đã document workflow expose CAP MCP | Namespace CAP MCP bị deferred trong Codex session hiện tại | Đã xử lý bằng `tool_search`; đã verify CAP `search_docs` và `search_model` | `tool_search`, `mcp__cap.search_docs`, `mcp__cap.search_model`, `npx -y @cap-js/mcp-server --help` | Nếu namespace MCP thiếu, dùng `tool_search` trước |

Vietnamese note: DonHV đã hỗ trợ WP1 Data Model Foundation cho Backend CAP. Kết quả: `db/schema.cds`, `srv/service.cds` và seed data trong `db/data/` đã compile/deploy SQLite in-memory pass. Handler nghiệp vụ vẫn để mở cho WP3.

Vietnamese note: DonHV đã hỗ trợ WP4 Fiori Elements UX bằng cách review repo `Sap_FE` của DatDT, tích hợp các ý tưởng List Report/Object Page phù hợp vào app CAP/Fiori hiện tại, và thêm bốn bug demo để List Report có dữ liệu khi review local. CAP compile, SQLite deploy, UI5 build, và Playwright browser smoke đã pass; dependent value help/action hiện đã được cập nhật ở mức MVP trong lượt WP2/WP3/WP4 tiếp theo, upload attachment thật vẫn chờ WP7.

Vietnamese note: DonHV đã hỗ trợ tiếp WP2/WP3/WP4 bằng cách thêm value help, bound actions, `srv/service.js` handlers, nextProcessor automation, history/notification side effects và Object Page actions. WP2/WP3 đã hoàn thành ở mức MVP; WP4 core screens đã cập nhật nhưng vẫn cần QA sâu, usability tuning và upload attachment thật ở WP7.

Vietnamese note: DonHV đã tinh chỉnh tiếp WP4 UI sau khi review giao diện: đổi List Report sang `GridTable`, bật draft trên `BugService.Bugs` để standard Create button xuất hiện, đổi Create thành `CreationDialog` với `UI.FieldGroup#CreateBug`, và bỏ icon mặc định khỏi Status/Priority/Severity bằng `CriticalityRepresentation : #WithoutIcon`. CAP compile, UI5 build và browser click mở dialog đã pass; DatDT/NhanT vẫn nên kiểm tra thủ công save flow của Create Bug trên browser.

## Update Rule

- DonHV updates this file for leader decisions, BA/PM work, SAP490 deliverables, weekly consolidation, and cross-workstream support.
- When DonHV supports another member's task, record the support here and mention the affected member/task file.
- Other members should not overwrite this file except when explicitly asked by DonHV.

Vietnamese:

- DonHV cập nhật file này cho quyết định của leader, việc BA/PM, deliverable SAP490, tổng hợp hằng tuần và hỗ trợ cross-workstream.
- Khi DonHV hỗ trợ task của thành viên khác, ghi phần hỗ trợ ở đây và nêu rõ file member/task bị ảnh hưởng.
- Thành viên khác không ghi đè file này trừ khi được DonHV yêu cầu rõ.
