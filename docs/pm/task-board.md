# IDTS Task Board

Last updated: 2026-06-20

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
| WP4 | Fiori Elements UX | Core layout, dynamic creation hiding, assignee value help, mock-login QA, local Comments CTA, and Assign Developer selected-text verification completed on the current live stack |
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
| WP4 | Fiori Elements UX | Đã hoàn thành layout chính, ẩn động khi create, value help assignee, QA mock-login, nút Add Comment trong section Comments, và xác minh dialog Assign Developer hiển thị tên đúng trên runtime hiện tại |
| WP7 | Notifications và Attachments | Đã xác nhận lưu trữ backend, bản ghi thông báo trong ứng dụng, và kiểm thử E2E comment/upload trên browser thành công. |

## Ready

| ID | Task | Primary member | Support / review | Detail file |
| --- | --- | --- | --- | --- |
| WP5 | Comments and History | SangVN, DatDT | DonHV, NhanT | `tasks/wp5-comments-history.md` |

Vietnamese:

| ID | Công việc | Thành viên chính | Hỗ trợ / review | File chi tiết |
| --- | --- | --- | --- | --- |
| WP5 | Comments và History | SangVN, DatDT | DonHV, NhanT | `tasks/wp5-comments-history.md` |

## In Progress

| ID | Task | Primary member | Note |
| --- | --- | --- | --- |
| SP2 | Sprint 02 Mentor Feedback and Happy Flow Demo | DonHV, NhanT, DatDT, SangVN | Backend, HTTP, and real browser QA are now stable enough to prove the happy flow. Remaining work is final SAP490 sync and mentor-demo rerun, not FE/blocking workflow repair. |
| WP6 | PM Monitoring | DonHV, DatDT, SangVN | Ownership wording is locked; backend `Current Action Owner`, derived monitoring flags, and the read-only `DeveloperWorkloads` aggregate are now implemented and verified. FE monitoring views/filter variants/browser UAT remain pending. |

Vietnamese:

| ID | Công việc | Thành viên chính | Ghi chú |
| --- | --- | --- | --- |
| SP2 | Sprint 02 Mentor Feedback và Happy Flow Demo | DonHV, NhanT, DatDT, SangVN | Backend, HTTP và browser QA thật hiện đã đủ để chứng minh happy flow chính. Phần còn lại là sync SAP490 cuối và rerun demo mentor, không còn là sửa FE hay workflow blocking. |
| WP6 | PM Monitoring | DonHV, DatDT, SangVN | Sprint 3 ownership wording đã chốt; backend `Current Action Owner` và các monitoring flag dẫn xuất đã implement + verify; phần còn lại là FE monitoring views/filter variants và browser UAT. |

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
