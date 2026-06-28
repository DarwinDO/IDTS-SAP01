# IDTS Task Board

Last updated: 2026-06-28

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
| WP4 | Fiori Elements UX | Core UX is complete; `IDTS-29` modular annotation refactor is integrated with equivalent compiled metadata, clean UI5 build, automated regression, and List Report/Object Page browser UAT |
| WP5 | Comments and History | Grouped `HistoryEvents` read model, comments/attachments audit baseline, and Sprint 3 grouped history payload support completed for backend handoff |
| WP7 | Notifications and Attachments | Backend persistence, in-app notifications, create-time attachment visibility, and browser happy-flow verification completed |
| IDTS-30 | PostgreSQL local proof and attachment storage decision | PostgreSQL deploy/read proof completed, draft-media blocker documented, long-term object-storage direction approved, and implementation handed off to `IDTS-31` |
| IDTS-31 | Object-store-backed attachment implementation | Native AWS S3 acceptance passed with PostgreSQL metadata/reference, external binary storage, upload/activate/download/history/delete cleanup, and full regression evidence |
| IDTS-13 | Object Page stale state after lifecycle action submit | PR #20 merged into `dev`; bound action side effects now refresh the bound Object Page entity and related history/notification/comment entities. Jira moved to Done. |
| IDTS-19 | Grouped history timeline with selective UI5 extension | PR #18 merged into `dev`; Object Page now has a grouped HistoryTimeline custom section while PM monitoring `views.paths` are preserved. Jira moved to Done. |
| IDTS-24 | Persona-based browser UAT evidence | PR #24 merged into `dev`; Playwright UAT script for Tester, Developer, and PM personas is integrated, evidence output is ignored, and Jira moved to Done. |

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
| WP4 | Fiori Elements UX | Core UX đã hoàn thành; refactor annotation theo module của `IDTS-29` đã được tích hợp với metadata tương đương, UI5 build sạch, regression tự động và browser UAT cho List Report/Object Page |
| WP7 | Notifications và Attachments | Đã xác nhận lưu trữ backend, bản ghi thông báo trong ứng dụng, và kiểm thử E2E comment/upload trên browser thành công. |

| IDTS-31 | Attachment using object storage | AWS S3 acceptance passed: PostgreSQL stores metadata/reference, S3 stores binary content, and upload/activate/download/history/delete cleanup plus full regression were verified. |
| IDTS-13 | Object Page stale state sau lifecycle action | PR #20 da merge vao `dev`; side effect cua bound action refresh lai bound Object Page entity va cac entity history/notification/comment lien quan. Jira da chuyen Done. |
| IDTS-19 | Grouped history timeline bang selective UI5 extension | PR #18 da merge vao `dev`; Object Page co custom section HistoryTimeline dang grouped event, dong thoi giu nguyen PM monitoring `views.paths`. Jira da chuyen Done. |
| IDTS-24 | Browser UAT evidence theo persona | PR #24 da merge vao `dev`; script Playwright UAT cho Tester, Developer, PM da tich hop, evidence output duoc ignore, va Jira da chuyen Done. |

## Ready

| ID | Task | Primary member | Note |
| --- | --- | --- | --- |
| IDTS-32 | Manual browser UAT for Sprint 3 workflow/history flows | SangVN | Jira task narrowed after split: SangVN owns Developer lifecycle, Need More Information/resubmit, reject follow-up, retest/close/reopen, grouped history timeline, and role/action visibility checks. |
| IDTS-34 | Custom login/authentication foundation | DonHV | Backend CAP custom email/password login, password hashing, request-user mapping, and security-safe auth foundation without SAP BTP/XSUAA dependency. Blocks IDTS-35 and IDTS-38. |
| IDTS-35 | Login UI and authenticated app session flow | DatDT | Fiori/UI5 login entry, login/logout behavior, and authenticated OData session handling after backend auth contract is available. Blocked by IDTS-34. |
| IDTS-36 | SMTP email notification delivery with outbox tracking | DonHV | Real SMTP delivery for all in-app notifications using safe private config and delivery statuses. Email failure must not roll back bug workflow. Blocks IDTS-37 and IDTS-38. |
| IDTS-37 | Notification UI and email delivery status readability | SangVN | FE/QA review of notification section after SMTP/outbox changes, focusing on readable event/channel/status/recipient/message output. Blocked by IDTS-36. |
| IDTS-38 | Regression test custom login and SMTP notification flows | NhanT | QA coverage for login success/failure, role behavior, SMTP success/failure, disabled email config, and no-secret evidence. Blocked by IDTS-34 and IDTS-36. |

Vietnamese:

Hiện chưa có work package nào ở trạng thái Ready.

## In Progress

| ID | Task | Primary member | Note |
| --- | --- | --- | --- |
| SP2 | Sprint 02 Mentor Feedback and Happy Flow Demo | DonHV, NhanT, DatDT, SangVN | Backend, HTTP, and real browser QA are now stable enough to prove the happy flow. Remaining work is final SAP490 sync and mentor-demo rerun, not FE/blocking workflow repair. |
| WP6 | PM Monitoring | DonHV, DatDT, SangVN | Ownership wording is locked; backend monitoring fields, FE monitoring views, Object Page refresh side effects, grouped history timeline, and persona UAT automation are now merged. Remaining manual split tasks are IDTS-32 and IDTS-33 evidence follow-up. |
| IDTS-33 | Manual browser UAT for Sprint 3 FE shell, monitoring, and Object Page flows | DatDT | Jira is In Progress. DatDT owns the FE-shell-heavy manual UAT companion scope after IDTS-13 was merged. |

Vietnamese:

| ID | Công việc | Thành viên chính | Ghi chú |
| --- | --- | --- | --- |
| SP2 | Sprint 02 Mentor Feedback và Happy Flow Demo | DonHV, NhanT, DatDT, SangVN | Backend, HTTP và browser QA thật hiện đã đủ để chứng minh happy flow chính. Phần còn lại là sync SAP490 cuối và rerun demo mentor, không còn là sửa FE hay workflow blocking. |
| WP6 | PM Monitoring | DonHV, DatDT, SangVN | Ownership wording đã chốt; backend monitoring fields, FE monitoring views, Object Page refresh side effects, grouped history timeline, và persona UAT automation đã merge. Phần còn lại là evidence follow-up của IDTS-32 và IDTS-33. |
| IDTS-33 | Manual browser UAT cho FE shell, monitoring và Object Page flows | DatDT | Jira đang In Progress. DatDT phụ trách manual UAT phần FE-shell-heavy sau khi IDTS-13 đã merge. |

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
