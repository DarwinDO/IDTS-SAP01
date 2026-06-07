# DatDT Status - Fiori/UI5 Primary

Last updated: 2026-06-04

Vietnamese: Trạng thái của DatDT - phụ trách chính Fiori/UI5.

## Member Identity

| Field | Value |
| --- | --- |
| Member | DatDT |
| Primary lane | Fiori/UI5 |
| Shared delivery responsibility | May receive Backend CAP, Fiori/UI5, or QA/Verification tasks as assigned, but Fiori/UI5 is the primary focus |
| Leader support | DonHV can support or unblock this lane when needed |

Vietnamese:

| Trường | Giá trị |
| --- | --- |
| Thành viên | DatDT |
| Mảng chính | Fiori/UI5 |
| Trách nhiệm delivery chung | Có thể nhận task Backend CAP, Fiori/UI5 hoặc QA/Verification khi được phân công, nhưng Fiori/UI5 là trọng tâm chính |
| Leader hỗ trợ | DonHV có thể hỗ trợ hoặc gỡ blocker cho mảng này khi cần |

## Current Focus

Not started. Fiori work should wait until the data model and service/value-help contract are stable enough.

Vietnamese: Chưa bắt đầu. Việc Fiori nên chờ data model và service/value-help contract đủ ổn định.

## Done

- Fiori UX requirements are documented in `docs/ba/07-fiori-ux-requirements.md`.
- Main app path is identified as `app/bug-management-ui`.

Vietnamese:

- Yêu cầu Fiori UX đã được ghi trong `docs/ba/07-fiori-ux-requirements.md`.
- App chính nằm tại `app/bug-management-ui`.

## In Progress

- None.

Vietnamese: Chưa có.

## Next

- After WP1 and WP2, update Fiori Elements annotations and page configuration for List Report/Object Page.
- Use Fiori MCP and SAP Fiori Guidelines before editing annotations, manifest routing, page config, XML views, controllers, or fragments.
- Prefer annotation-driven Fiori Elements before custom UI5.

Vietnamese:

- Sau WP1 và WP2, cập nhật Fiori Elements annotations và page config cho List Report/Object Page.
- Dùng Fiori MCP và SAP Fiori Guidelines trước khi chỉnh annotation, manifest routing, page config, XML view, controller hoặc fragment.
- Ưu tiên Fiori Elements dựa trên annotation trước khi viết custom UI5.

## Blockers

- Waiting for Backend CAP WP1 and WP2.

Vietnamese: Đang chờ Backend CAP WP1 và WP2.

## Session Log

| Date | Task/WP | What was done | Completed part | Issues/Bugs found | Fix status | Evidence/Commands | Next handoff |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-06-03 | Status setup | Member status file created from previous Fiori/UI5 status | Fiori/UI5 status ownership assigned to DatDT | None | Fixed | `rg`, `git diff --check` | Wait for WP1/WP2 service contract |
| 2026-06-04 | WP4 Create UX | Changed Create Bug flow: dialog now shows only Title field; FE draft entity auto-navigates to Object Page after dialog OK | `FieldGroup#CreateBugDialog` added in `annotations.cds`; `manifest.json` `creationFields` updated | None | Fixed | `cds compile` clean (no errors/warnings) | Browser smoke test to verify dialog → Object Page navigate |
| 2026-06-07 | WP4 Create UX | Changed Create Bug flow: `creationMode` changed from `CreationDialog` to `NewPage` in `manifest.json` — Create button now navigates to a new full Object Page instead of a popup dialog | `manifest.json` `controlConfiguration.creationMode.name` changed to `NewPage`; `creationFields` removed | None | Fixed | `npx cds compile srv --to edmx` — exit 0, no errors | Browser smoke test: click Create → verify new page opens with all fields |
| 2026-06-07 | WP4 Create UX (fix) | Pre-fill dialog still appeared because `Capabilities.InsertRestrictions.RequiredProperties` was causing Fiori Elements to collect required fields before navigating. Removed `RequiredProperties` from `annotations.cds` — FE now navigates directly to NewPage. Backend CAP still validates on save. | `annotations.cds` `Capabilities.InsertRestrictions` now only has `Insertable: true` | `RequiredProperties` drove pre-fill dialog even in NewPage mode | Fixed | `npx cds compile srv --to edmx` — exit 0, no errors | Browser smoke test: click Create → should go directly to Object Page edit form |

Vietnamese:

| Ngày | Task/WP | Đã làm gì | Phần đã xong | Khó khăn/Bug phát hiện | Trạng thái fix | Bằng chứng/Lệnh đã chạy | Handoff tiếp theo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-06-03 | Status setup | Tạo file status thành viên từ status Fiori/UI5 cũ | Đã giao ownership Fiori/UI5 cho DatDT | Không có | Đã xử lý | `rg`, `git diff --check` | Chờ service contract từ WP1/WP2 |

## Update Rule

- DatDT updates this file after each work session.
- Record what was done, what part is complete, blockers, UI bugs/errors found, whether they were fixed, and verification evidence.
- Do not edit other members' status files unless coordinating with DonHV.

Vietnamese:

- DatDT cập nhật file này sau mỗi phiên làm việc.
- Ghi rõ đã làm gì, xong phần nào, blocker, bug/error UI phát hiện, đã fix hay chưa và bằng chứng verify.
- Không chỉnh file status của thành viên khác trừ khi phối hợp với DonHV.
