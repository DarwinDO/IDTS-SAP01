# DonHV Status - Leader / BA-PM / Cross-Workstream Support

Last updated: 2026-06-10

Vietnamese: Trạng thái của DonHV - Leader / BA-PM / hỗ trợ các workstream khác.

## Member Identity

| Field | Value |
| --- | --- |
| Member | DonHV |
| Team role | Leader |
| Primary responsibility | Leader, Backend CAP lead for Sprint 02, backend bug fixing, project documentation, scope alignment, weekly consolidation |
| Support responsibility | May support BA/PM consolidation, Fiori/UI5, and QA/Verification when needed |

Vietnamese:

| Trường | Giá trị |
| --- | --- |
| Thành viên | DonHV |
| Vai trò nhóm | Leader |
| Trách nhiệm chính | Leader, Backend CAP lead cho Sprint 02, backend bug fixing, tài liệu dự án, thống nhất scope, tổng hợp hàng tuần |
| Trách nhiệm hỗ trợ | Có thể hỗ trợ BA/PM consolidation, Fiori/UI5 và QA/Verification khi cần |

## Current Focus

Prepare Sprint 02 delivery after mentor feedback: lead Backend CAP work, own backend bug fixing, coordinate Jira/PM handover, and keep project documentation aligned when business meaning changes.

Vietnamese: Chuẩn bị delivery Sprint 02 sau feedback mentor: lead Backend CAP, chịu trách nhiệm backend bug fixing, điều phối Jira/PM handover và giữ tài liệu dự án đồng bộ khi nghiệp vụ thay đổi.

## Done

- BA documentation pack created under `docs/ba/`.
- PM documentation structure created under `docs/pm/`.
- BRD/SRS/FRS Markdown and DOCX deliverables created and maintained.
- SAP490 Google Workspace sync workflow, `gws` scripts, team setup guide, and template demo upload were prepared.
- MVP role baseline clarified as Tester, Developer, and PM.
- Optional Learning Recap / Mentor Mode was added for post-task teaching and teach-back.
- Sprint 02 backend tasks `IDTS-2` and `IDTS-4` completed and moved to Done in Jira.
- `srv/service.js` now enforces developer processing permission when request user is known, keeps team-visible discussion open, and records nextProcessor history/notification side effects.

Vietnamese:

- Đã tạo bộ tài liệu BA trong `docs/ba/`.
- Đã tạo cấu trúc tài liệu PM trong `docs/pm/`.
- Đã tạo và duy trì các deliverable BRD/SRS/FRS dạng Markdown và DOCX.
- Đã chuẩn bị workflow sync SAP490 Google Workspace, script `gws`, hướng dẫn setup team và demo upload template.
- Đã chốt baseline role MVP là Tester, Developer và PM.
- Đã thêm Learning Recap / Mentor Mode tùy chọn để dạy lại và kiểm tra hiểu sau task.

## In Progress

- Sprint 02 mentor feedback and happy-flow plan prepared, Jira backlog created, and Jira assignees aligned with the balanced team allocation.
- Jira `IDTS-5` remains In Progress as the backend QA bug-fix bucket for additional Sprint 02 issues reported by NhanT or the team.

Vietnamese:

- Đã chuẩn bị feedback mentor Sprint 02, tạo Jira backlog và assign Jira theo phân công team đã cân bằng.

## Next

- Start Sprint 02 implementation from the assigned Jira backlog.
- Lead backend rule and handler changes for developer visibility, mandatory note/reason validation, history, nextProcessor, and backend bug fixing.
- Consolidate weekly updates from `sangvn.md`, `datdt.md`, and `nhant.md`.
- Keep risks and decisions updated in `docs/pm/risk-decision-log.md`.

Vietnamese:

- Bắt đầu implementation Sprint 02 từ Jira backlog đã được assign.
- Lead backend rule và handler cho developer visibility, mandatory note/reason validation, history, nextProcessor và backend bug fixing.
- Tổng hợp cập nhật hằng tuần từ `sangvn.md`, `datdt.md` và `nhant.md`.
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
| 2026-06-05 | Sprint 02 planning | Synced mentor feedback into canonical docs, created Sprint 02 plan, updated PM handover, created Jira backlog, and added Jira bug-tracking rule to AGENTS.md | Sprint 02 planning baseline, Jira backlog, and agent bug-tracking rule completed | `IDTS-SUMMARY.md` append initially failed because console showed mojibake while file content was UTF-8 clean | Fixed by verifying the real line text with `Select-String` and patching using clean UTF-8 text | `Get-Content`, `Select-String`, `apply_patch`, Atlassian Rovo MCP `_createjiraissue`, `_searchjiraissuesusingjql`; Jira issues `IDTS-1` to `IDTS-12`; verified later with `git diff --check` | Start backend handler updates for Sprint 02 |
| 2026-06-06 | Sprint 02 Jira assignment | Assigned Jira issues `IDTS-1` to `IDTS-12` to DonHV, NhanT, DatDT, and SangVN using the balanced Sprint 02 mapping; fixed mismatched Jira owner descriptions for `IDTS-3`, `IDTS-10`, and `IDTS-12`; updated `docs/pm/07-sprint-2-plan.md` to match Jira | Jira assignment and sprint plan alignment completed | Initial Jira descriptions for `IDTS-3`, `IDTS-10`, and `IDTS-12` still showed old owners after assignee changes | Fixed by updating those Jira descriptions through Atlassian Rovo MCP | `tool_search`, Atlassian Rovo MCP `_editjiraissue`, `_searchjiraissuesusingjql`, `apply_patch`, `rg`, `git diff --check` passed with LF-to-CRLF warnings | Each member starts assigned Jira tasks and updates their own status file after work sessions |
| 2026-06-10 | Sprint 02 backend - IDTS-2/IDTS-4/IDTS-5 | Added branch naming rule to AGENTS.md, implemented developer visibility vs processing permission, added comment author handling, added nextProcessor history logging, added resolved/retest/reopened notifications, and updated Jira | `IDTS-2` and `IDTS-4` completed and moved to Done; `IDTS-5` moved to In Progress as QA bug-fix bucket | Backend gaps found: request-user processing permission was missing; bound actions did not log nextProcessor changes; resolved/retest/reopened did not create notification records; `cds serve all` logs a non-blocking `cds-plugin-ui5` welcome-page injection warning | Fixed the backend gaps in `srv/service.js`; UI5 welcome-page warning remains open/non-blocking and not a backend blocker | `node --check srv/service.js`; `cds compile srv app/bug-management-ui --to edmx`; `cds deploy --to sqlite::memory:`; OData permission smoke; OData side-effect smoke; Atlassian Rovo Jira comments/transitions | NhanT can continue IDTS-3 validation and QA checks; DatDT/SangVN can continue FE tasks; DonHV monitors IDTS-5 for new backend bugs |
| 2026-06-10 | Business rule cleanup | Removed redundant BR-48 and moved its mentor-confirmed content into the original affected rules and canonical docs | BR-02, BR-18, BR-25, BR-27, Summary, Scope, and Project Context now state the final rule directly | Documentation clarity issue: keeping BR-48 as a late refinement could make readers debate the older BR wording before reaching the correction | Fixed by rewriting affected original rules and deleting BR-48 | `rg`, `apply_patch`, `git diff --check` | Use the original BR numbers as the single source of truth for developer visibility, developer note, status note/reason, and comment rules |
| 2026-06-10 | SAP490 artifact review | Checked DOCX/XLSX files under `docs/sap490` after Sprint 02 backend and business-rule updates | Confirmed templates remain source templates only; the only generated SAP490 workbook is a demo artifact from 2026-06-03 and is not a current submission file | No tool/runtime bug found; artifact gap found: no generated SAP490 DOCX and no updated generated Sprint 02 test/report workbook exist yet | Open as follow-up, not a code bug | `Get-ChildItem docs/sap490 -Recurse`; `openpyxl` read-only workbook inspection | If mentor needs SAP490-format files, generate new copies from templates for Test/Fix Bug, Test Report, and optionally Functional/Technical Specification instead of editing template originals |
| 2026-06-10 | SAP490 Blueprint draft | Created initial Blueprint v0.1 content as Markdown source and Pandoc-generated DOCX | Initial files were `docs/sap490/generated/Blueprint_IDTS_SAP01_v0.1.md` and `.docx`, but they were later removed after review | User found the Pandoc-generated DOCX did not preserve the SAP490 template form/layout well enough | Fixed by deleting the Markdown/Pandoc artifacts and recreating the Blueprint as a direct template-filled DOCX copy | `python -m pip install python-docx`; `pandoc ... --reference-doc ...`; user visual review; `Remove-Item` for the two generated artifacts | Use only the template-filled DOCX for Blueprint review |
| 2026-06-10 | SAP490 Blueprint template-fill correction | Recreated Blueprint by copying `Blueprint_Template.docx` and filling the copied DOCX directly with IDTS content | `docs/sap490/generated/Blueprint_IDTS_SAP01_TemplateFilled_v0.1.docx` created; `docs/pm/current-status.md` updated | First template-fill script attempt failed because newly inserted tables changed `doc.tables` indices before the original template tables were referenced | Fixed by capturing original table references immediately after opening the copied template, then rerunning generation from a fresh template copy | `python-docx` inspection showed 66 paragraphs, 14 tables, 3 sections; sample `SD-MD-01 Customer Master Data` absent; IDTS title/process/nextProcessor present; `soffice --headless --convert-to pdf` created PDF length 638042; `git diff --check`; `npx ai-devkit@latest lint --json` | Review the template-filled DOCX visually in Word/LibreOffice before mentor submission |
| 2026-06-10 | SAP490 documentation rules | Updated `AGENTS.md` with stricter SAP490 language split, template-copy-fill, formatting preservation, and verification rules | Agent rules now require separate English/Vietnamese SAP490 files and require non-Markdown SAP490 files to be copied from templates before filling | Process issue found: prior SAP490 wording could still be interpreted as allowing final DOCX/XLSX/PPTX generation from Markdown/Pandoc | Fixed in `AGENTS.md`; existing SAP490 artifacts should follow the new EN/VI split and template-fill rule when recreated | `apply_patch`; `rg`; `git diff --check`; `npx ai-devkit@latest lint --json` | Future SAP490 Blueprint/Test Report/Specification files should be recreated as separate EN and VI template-filled copies |
| 2026-06-10 | SAP490 Blueprint EN/VI correction | Recreated the SAP490 Blueprint as separate English and Vietnamese DOCX files by copying and filling `Blueprint_Template.docx`; added a repeatable generator script and aligned SAP490 markdown docs with the EN/VI split rule | `docs/sap490/generated/Blueprint_IDTS_SAP01_en_v0.1.docx` and `docs/sap490/generated/Blueprint_IDTS_SAP01_vi_v0.1.docx` created; old mixed-language single Blueprint file removed; SAP490 workflow/setup/inventory markdown split into `.en.md` and `.vi.md` files | Prior Blueprint artifact still violated the new EN/VI split rule; SAP490 workflow docs still implied Markdown/Pandoc-style generation for final files; template inventory split initially failed because it used interleaved bilingual sections instead of a single marker | Fixed by generating two template-filled DOCX files with the same table dimensions as the template, splitting SAP490 markdown docs by language, repairing Vietnamese headings, and updating PM/status references | `python scripts/sap490/generate-blueprint-docx.py`; `python-docx` structure/content check; LibreOffice PDF conversion; `rg` old-reference/mojibake checks; `git diff --check`; `npx ai-devkit@latest lint --json` | Open both DOCX files in Word/LibreOffice for final visual review before mentor submission |

Vietnamese note: Ngày 2026-06-10, DonHV đã hoàn thành `IDTS-2` và `IDTS-4`, chuyển hai Jira issue này sang Done, đồng thời mở `IDTS-5` ở trạng thái In Progress để tiếp tục nhận bug backend từ QA. Các gap backend đã fix gồm: thiếu kiểm soát quyền xử lý theo request user, bound action chưa ghi history cho thay đổi `nextProcessor`, và các trạng thái resolved/retest/reopened chưa tạo notification record. Warning `cds-plugin-ui5` về welcome page vẫn còn nhưng không chặn compile, deploy hoặc OData smoke test.

Vietnamese note: Ngày 2026-06-10, DonHV đã cleanup business rules theo hướng single source of truth: bỏ BR-48 vì nội dung refine bị dư thừa, đưa rule cuối cùng về BR-02, BR-18, BR-25 và BR-27, đồng thời sync wording liên quan trong `IDTS-SUMMARY.md`, `IDTS-PROJECT-SCOPE-SAP01.md` và `docs/project-context.md`.

Vietnamese note: Ngày 2026-06-10, DonHV đã cập nhật `AGENTS.md` để rule SAP490 rõ hơn: mọi artifact SAP490 do project viết phải tách file tiếng Anh và tiếng Việt riêng; file DOCX/XLSX/PPTX chính thức phải copy từ template rồi fill, không generate từ Markdown; khi fill phải giữ font, cỡ chữ, màu, bảng, formula, header/footer, cover page và kiểm tra lỗi tiếng Việt trước khi báo hoàn tất.

Vietnamese note: Ngày 2026-06-10, DonHV đã sửa lại SAP490 Blueprint theo rule mới: tạo hai file riêng `Blueprint_IDTS_SAP01_en_v0.1.docx` và `Blueprint_IDTS_SAP01_vi_v0.1.docx` bằng cách copy/fill `Blueprint_Template.docx`, xóa bản single-file trộn ngôn ngữ cũ, thêm script generate lại, đồng thời tách các markdown SAP490 đang được cập nhật thành file `.en.md` và `.vi.md` để không còn hiểu nhầm dùng Markdown/Pandoc cho file SAP490 chính thức.

Vietnamese:

| Ngày | Task/WP | Đã làm gì | Phần đã xong | Khó khăn/Bug phát hiện | Trạng thái fix | Bằng chứng/Lệnh đã chạy | Handoff tiếp theo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-06-03 | PM setup | Đổi mô hình status từ file theo workstream sang file theo thành viên và giữ DonHV là leader/BA-PM owner | Đã reset ownership status của team | Không có | Đã xử lý | `rg`, `git diff --check` | Thành viên cập nhật file status của mình |
| 2026-06-03 | SAP490 docs | Tạo inventory và hướng dẫn sử dụng template SAP490 | Đã document mục đích và cách fill template | Không có | Đã xử lý | `openpyxl`, `rg`, `git diff --check` | Dùng inventory trước khi điền template SAP490 |
| 2026-06-04 | Agent learning workflow | Thêm Learning Recap / Mentor Mode tùy chọn trong AGENTS.md và `.agents/skills/learning-recap` | Đã tích hợp workflow dạy lại và teach-back | Không có | Đã xử lý | `rg`, `git diff --check`, `npx ai-devkit@latest lint --json` | Dùng sau task không tầm thường khi user yêu cầu hoặc khi hữu ích |
| 2026-06-05 | Sprint 02 planning | Sync feedback mentor vào canonical docs, tạo Sprint 02 plan, cập nhật PM handover, tạo Jira backlog và thêm rule track bug bằng Jira vào AGENTS.md | Đã hoàn thành baseline planning Sprint 02, Jira backlog và rule agent về bug tracking | Lần append `IDTS-SUMMARY.md` đầu tiên fail vì console hiển thị mojibake dù file là UTF-8 sạch | Đã fix bằng cách kiểm tra text thật bằng `Select-String` và patch lại bằng UTF-8 đúng | `Get-Content`, `Select-String`, `apply_patch`, Atlassian Rovo MCP `_createjiraissue`, `_searchjiraissuesusingjql`; Jira issues `IDTS-1` đến `IDTS-12`; đã verify sau bằng `git diff --check` | Bắt đầu backend handler updates cho Sprint 02 |
| 2026-06-06 | Sprint 02 Jira assignment | Assign Jira issues `IDTS-1` đến `IDTS-12` cho DonHV, NhanT, DatDT và SangVN theo mapping Sprint 02 đã cân bằng; sửa description bị lệch owner cho `IDTS-3`, `IDTS-10`, `IDTS-12`; cập nhật `docs/pm/07-sprint-2-plan.md` cho khớp Jira | Đã hoàn tất assign Jira và đồng bộ sprint plan | Description ban đầu của `IDTS-3`, `IDTS-10`, `IDTS-12` vẫn ghi owner cũ sau khi đổi assignee | Đã fix bằng cách cập nhật description qua Atlassian Rovo MCP | `tool_search`, Atlassian Rovo MCP `_editjiraissue`, `_searchjiraissuesusingjql`, `apply_patch`, `rg`, `git diff --check` pass với warning LF-to-CRLF | Mỗi thành viên bắt đầu task Jira được assign và cập nhật status file của mình sau phiên làm việc |

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
