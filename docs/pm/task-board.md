# IDTS Task Board

Last updated: 2026-06-17

Use this board for high-level movement only. Detailed task notes belong in the matching file under `docs/pm/tasks/`.

Vietnamese: Chỉ dùng board này để theo dõi trạng thái cấp cao. Chi tiết công việc phải ghi trong file tương ứng dưới `docs/pm/tasks/`.

## Done

| ID | Task | Output |
| --- | --- | --- |
| PM-001 | Create PM delivery pack | `docs/pm/` structure, status files, work packages, Sprint 1 plan |
| BA-001 | Create BA documentation pack | `docs/ba/` baseline |
| BA-002 | Create BRD deliverables | `docs/ba/brd/brd.en.md`, `docs/ba/brd/brd.vi.md`, `docs/ba/brd/brd.en.docx`, `docs/ba/brd/brd.vi.docx` |
| BA-003 | Create SRS and FRS deliverables | Markdown and DOCX files under `docs/ba/srs/` and `docs/ba/frs/` |
| BA-004 | Align MVP role baseline | Canonical docs, BRD/SRS/FRS, BA support docs, diagrams, and PM handover updated to Tester/Developer/PM |
| WP1 | Data Model Foundation | Expanded CAP CDS model, service projections, and seed data under `db/data/` |
| WP2 | Service and Value Help | OData V4 service actions, value help annotations, and metadata compile completed |
| WP3 | Handler Rules and Validation | CAP handler rules for create/update, assignment, status transition, nextProcessor, history, and notifications completed |
| WP7 | Notifications and Attachments | Backend persistence, in-app notifications, create-time attachment visibility, and browser happy-flow verification completed |

Vietnamese:

| ID | Công việc | Kết quả |
| --- | --- | --- |
| PM-001 | Tạo bộ tài liệu PM | Cấu trúc `docs/pm/`, status files, work packages, kế hoạch Sprint 1 |
| BA-001 | Tạo bộ tài liệu BA | Baseline trong `docs/ba/` |
| BA-002 | Tạo BRD deliverables | `docs/ba/brd/brd.en.md`, `docs/ba/brd/brd.vi.md`, `docs/ba/brd/brd.en.docx`, `docs/ba/brd/brd.vi.docx` |
| BA-003 | Tạo SRS và FRS deliverables | Các file Markdown và DOCX trong `docs/ba/srs/` và `docs/ba/frs/` |
| BA-004 | Chốt baseline role MVP | Canonical docs, BRD/SRS/FRS, BA docs, diagrams, và PM handover đã cập nhật theo Tester/Developer/PM |
| WP1 | Nền tảng Data Model | CAP CDS model, service projections, và seed data trong `db/data/` |
| WP2 | Service và Value Help | Đã hoàn thành OData V4 service actions, value help annotations và metadata compile |
| WP3 | Handler Rules và Validation | Đã hoàn thành CAP handler rules cho create/update, assignment, status transition, nextProcessor, history và notifications |
| WP7 | Notifications và Attachments | Đã xác nhận lưu trữ backend, bản ghi thông báo trong ứng dụng, và kiểm thử E2E comment/upload trên browser thành công. |

## Ready

| ID | Task | Primary member | Support / review | Detail file |
| --- | --- | --- | --- | --- |
| WP5 | Comments and History | SangVN, DatDT | DonHV, NhanT | `tasks/wp5-comments-history.md` |
| WP6 | PM Monitoring | DatDT, SangVN | DonHV, NhanT | `tasks/wp6-pm-monitoring.md` |

Vietnamese:

| ID | Công việc | Thành viên chính | Hỗ trợ / review | File chi tiết |
| --- | --- | --- | --- | --- |
| WP5 | Comments và History | SangVN, DatDT | DonHV, NhanT | `tasks/wp5-comments-history.md` |
| WP6 | PM Monitoring | DatDT, SangVN | DonHV, NhanT | `tasks/wp6-pm-monitoring.md` |

## In Progress

| ID | Task | Primary member | Note |
| --- | --- | --- | --- |
| SP2 | Sprint 02 Mentor Feedback and Happy Flow Demo | DonHV, NhanT, DatDT, SangVN | Jira: 5 Done (`IDTS-2`, `IDTS-3`, `IDTS-4`, `IDTS-6`, `IDTS-7`), 5 In Progress (`IDTS-5`, `IDTS-8`, `IDTS-9`, `IDTS-10`, `IDTS-11`), 2 To Do (`IDTS-1`, `IDTS-12`). `IDTS-9` was reopened because the Assign Developer action input still needs final browser confirmation after the latest annotation-only text fix. |
| WP4 | Fiori Elements UX | DatDT | Core layout, dynamic creation hiding, assignee value help, dynamic visibility, dev-only mock login, and refreshed happy-flow verification are completed. Remaining refinement is limited to Assign Developer dialog polish; `app/bug-management-ui/annotations.cds` now annotates `AssignableDevelopers.developerProfileID` with business text, and DatDT/SangVN need to verify in browser whether the selected input stops showing UUID. |

Vietnamese:

| ID | Công việc | Thành viên chính | Ghi chú |
| --- | --- | --- | --- |
| SP2 | Sprint 02 Mentor Feedback và Happy Flow Demo | DonHV, NhanT, DatDT, SangVN | Jira: 6 Done (`IDTS-2`, `IDTS-3`, `IDTS-4`, `IDTS-6`, `IDTS-7`, `IDTS-9`), 4 In Progress (`IDTS-5`, `IDTS-8`, `IDTS-10`, `IDTS-11`), 2 To Do (`IDTS-1`, `IDTS-12`). Tất cả các branch phát triển đã được tích hợp vào `dev`. |
| WP4 | Fiori Elements UX | DatDT | Đã hoàn thành cấu trúc giao diện chính, ẩn động trang tạo mới, Value Help Assignee, ẩn/hiện action động, mock login chỉ cho development và QA E2E upload đính kèm/comment. Các tinh chỉnh UI khác đang tiếp tục. |

## Blocked

| ID | Task | Blocker | Required decision |
| --- | --- | --- | --- |
| None | None | None | None |

Vietnamese:

| ID | Công việc | Blocker | Quyết định cần có |
| --- | --- | --- | --- |
| None | None | None | None |

## Update Rules

- Move a work package here only after updating its `tasks/*.md` file.
- Keep this board short; avoid detailed implementation logs.
- If multiple developers work at the same time, each should update the matching work package and their own member status file under `status/`.
- DonHV consolidates member updates into shared PM/SAP490 docs after the group work session or weekly review.

Vietnamese:

- Chỉ chuyển trạng thái work package lên board sau khi đã cập nhật file `tasks/*.md` tương ứng.
- Giữ board ngắn gọn, không ghi log implementation chi tiết ở đây.
- Nếu nhiều developer làm cùng lúc, mỗi người cập nhật work package liên quan và file status của chính mình trong `status/`.
- DonHV tổng hợp cập nhật của từng thành viên vào tài liệu PM/SAP490 sau phiên làm việc nhóm hoặc buổi review hàng tuần.
