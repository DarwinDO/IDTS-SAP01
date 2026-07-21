# IDTS-51 - Sprint 4 Stabilization Plan

Last updated: 2026-07-21

## Purpose

Track the Sprint 4 follow-up work after Sprint 3 shared-QA closure. Sprint 4 focuses on stabilization, security, deployment continuity, and UX polish rather than adding broad new product scope.

Vietnamese: File này dùng để theo dõi các việc follow-up của Sprint 4 sau khi Sprint 3 đã đóng phần shared QA. Sprint 4 tập trung vào ổn định hệ thống, bảo mật, duy trì môi trường deploy, và polish UX; không mở rộng scope sản phẩm quá rộng.

## Sprint window

- Planned start: 2026-07-04
- Planned end: 2026-07-18

Jira status: the real board sprint `IDTS Sprint 4` has been created on board `34` with sprint id `70`. The sprint window is 2026-07-04 to 2026-07-18, matching the planned Sprint 4 dates. `IDTS-39`, `IDTS-40`, `IDTS-45`, `IDTS-46`, and `IDTS-47` are grouped under Epic `IDTS-51`. `IDTS-63`, under the separate AI Epic `IDTS-62`, was added as a bounded Sprint 4 discovery task; runtime AI implementation is deferred to Sprint 5.

Vietnamese: Jira board sprint thật `IDTS Sprint 4` đã được tạo trên board `34` với sprint id `70`. Sprint chạy từ 2026-07-04 đến 2026-07-18. `IDTS-39`, `IDTS-40`, `IDTS-45`, `IDTS-46`, và `IDTS-47` thuộc Epic `IDTS-51`. `IDTS-63` thuộc Epic AI riêng `IDTS-62` được thêm vào như một task discovery có giới hạn; phần runtime AI chuyển sang Sprint 5.

## Active Sprint 4 candidates

| Jira | Owner | Due date | Sprint 4 reason |
| --- | --- | --- | --- |
| IDTS-39 | DonHV | 2026-07-07 | Harden login error handling so unexpected backend/database errors do not leak raw SQL or internal details. |
| IDTS-59 | SangVN | 2026-07-11 | Scan completed Sprint 4 Fiori screens for usability gaps and edge-case confusion; local evidence report is in PR #104 and authenticated shared-QA scan still depends on private Render QA credentials/session or DonHV acceptance of local evidence. |
| IDTS-45 | DonHV | 2026-07-24 | Back up and decide migration/upgrade before the Render PostgreSQL free instance expires. The due date intentionally extends beyond the sprint because the real deadline is 2026-07-31. |
| IDTS-46 | DonHV | 2026-07-12 | Review dependency vulnerabilities found during Render/shared-QA work with targeted remediation. |
| IDTS-47 | SangVN | 2026-07-14 | Fix the long History Timeline UX issue found during IDTS-32 UAT. |
| IDTS-40 | DonHV | 2026-07-18 | Keep AWS ECS/ECR as a longer-term deployment direction or alternative; it does not block accepted Render QA. |
| IDTS-63 | DonHV | 2026-07-09 | Define suggestion-only AI scope, data boundary, fallback, human review, and audit rules before any AI runtime work. |

Vietnamese:

| Jira | Owner | Due date | Lý do đưa vào Sprint 4 |
| --- | --- | --- | --- |
| IDTS-39 | DonHV | 2026-07-07 | Hardening login error để lỗi backend/database bất ngờ không leak raw SQL hoặc thông tin nội bộ. |
| IDTS-59 | SangVN | 2026-07-11 | Scan các màn hình Fiori Sprint 4 đã hoàn thành để tìm usability gap và edge-case confusion; local evidence report nằm trong PR #104, còn authenticated shared-QA scan phụ thuộc credential/session Render QA private hoặc DonHV chấp nhận local evidence. |
| IDTS-45 | DonHV | 2026-07-24 | Backup và chốt migrate/upgrade trước khi Render PostgreSQL free hết hạn. Due date cố ý nằm ngoài sprint vì deadline thật là 2026-07-31. |
| IDTS-46 | DonHV | 2026-07-12 | Review dependency vulnerabilities phát hiện trong quá trình Render/shared-QA, xử lý theo hướng targeted. |
| IDTS-47 | SangVN | 2026-07-14 | Fix vấn đề UX History Timeline quá dài được phát hiện trong UAT IDTS-32. |
| IDTS-40 | DonHV | 2026-07-18 | Giữ AWS ECS/ECR như hướng deploy dài hạn hoặc phương án thay thế; không block Render QA đã accepted. |
| IDTS-63 | DonHV | 2026-07-09 | Chốt AI suggestion-only, data boundary, fallback, human review và audit trước khi làm AI runtime. |

## Issue links

## Completed Sprint 4 UI/auth items

| Jira | Owner / support | Result |
| --- | --- | --- |
| IDTS-39 | DonHV | Safe unexpected login/auth error handling merged through PR #68. |
| IDTS-52 | DatDT owner, DonHV support | First implementation pass completed: custom login page uses SAPUI5 controls, SAP Horizon styling, safe `MessageStrip` messages, and responsive layout. |
| IDTS-53 | SangVN owner, DonHV support | First implementation pass completed: authenticated app shows a SAPUI5 profile popover with name, email, role, session expiry, and Sign Out. |
| IDTS-54 | DonHV, DatDT support | Local implementation ready for PR: role dashboard MVP added as protected SAPUI5 `dashboard.html`, reading existing `Bugs` and `DeveloperWorkloads` OData without new write API. Browser smoke passed for PM dashboard tiles, workload visibility, safe copy, and no unexpected HTTP/page errors. |
| IDTS-55 | DonHV, SangVN support | Done: PR #73 merged into `dev` at `e24f0a9`; Render deploy `dep-d94cg4uq1p3s73bc6la0` is live; shared-QA browser smoke passed for comment post/reload persistence, attachment upload/list/download/delete cleanup, no formatter fatal, no unexpected HTTP errors, and no post-deploy Render error/5xx logs. |
| IDTS-58 | DatDT owner | Local fix branch `fix/idts-58-sprint-4-ui-defects-datdt` is ready: standalone auth pages now load UI5 through the app-relative resource path, dashboard profile no longer overlaps `Refresh`, comments no longer duplicate the author name, and attachment delete is disabled during draft edit. Local browser smoke passed for login, dashboard, comment post, evidence upload, and draft-state action disable. |
| IDTS-84 | DatDT owner, DonHV/SangVN support | Learning material remediation merged through PR #159. DatDT completed the dashboard-history Knowledge Gate at 3/3 (100%), passed the critical/debug/teach-back checks, and recorded sanitized evidence in `docs/learning/progress/datdt.md`. |

Vietnamese:

| Jira | Owner / support | Ket qua |
| --- | --- | --- |
| IDTS-39 | DonHV | Safe unexpected login/auth error handling da merge qua PR #68. |
| IDTS-52 | DatDT owner, DonHV support | Pass implement dau da xong: login page custom dung SAPUI5 controls, SAP Horizon styling, message loi an toan bang `MessageStrip`, va responsive layout. |
| IDTS-53 | SangVN owner, DonHV support | Pass implement dau da xong: app sau login co SAPUI5 profile popover hien ten, email, role, session expiry, va Sign Out. |
| IDTS-54 | DonHV, DatDT support | Local implementation san sang tao PR: dashboard MVP theo role duoc them bang SAPUI5 `dashboard.html` duoc bao ve, doc OData hien co `Bugs` va `DeveloperWorkloads`, khong them write API. Browser smoke pass cho PM dashboard tiles, workload visibility, safe copy, va khong co HTTP/page error bat thuong. |
| IDTS-55 | DonHV, SangVN support | Done: PR #73 da merge vao `dev` tai `e24f0a9`; Render deploy `dep-d94cg4uq1p3s73bc6la0` dang live; shared-QA browser smoke pass cho post comment, reload van thay comment, upload/list/download/delete attachment, cleanup, khong co formatter fatal, khong co HTTP error bat thuong, va khong co Render error/5xx log sau deploy. |
| IDTS-58 | DatDT owner | Branch fix local `fix/idts-58-sprint-4-ui-defects-datdt` da san sang: cac trang auth standalone da load UI5 qua duong dan resource cua app, profile dashboard khong con de len `Refresh`, comment khong con lap ten tac gia, va nut xoa attachment bi khoa khi dang o draft edit. Browser smoke local da pass cho login, dashboard, post comment, upload evidence, va trang thai disable cua action trong draft. |
| IDTS-84 | DatDT owner, DonHV/SangVN support | Remediation learning material da merge qua PR #159. DatDT hoan thanh Knowledge Gate dashboard-history voi 3/3 (100%), PASS critical/debug/teach-back, va ghi evidence da sanitize vao `docs/learning/progress/datdt.md`. |

- `IDTS-39` relates to `IDTS-38`.
- `IDTS-45` relates to `IDTS-44`.
- `IDTS-46` relates to `IDTS-44`.
- `IDTS-47` relates to `IDTS-32`.
- `IDTS-40` relates to `IDTS-44` as an AWS-native follow-up/alternative.
- `IDTS-58` relates to `IDTS-52`, `IDTS-53`, `IDTS-54`, `IDTS-55`, and is the FE handoff input for `IDTS-59` and `IDTS-60`.
- `IDTS-59` follows `IDTS-58` as the SangVN UI/UX evidence scan and relates to `IDTS-57`/`IDTS-60` regression coverage.

Vietnamese:

- `IDTS-39` liên quan `IDTS-38`.
- `IDTS-45` liên quan `IDTS-44`.
- `IDTS-46` liên quan `IDTS-44`.
- `IDTS-47` liên quan `IDTS-32`.
- `IDTS-40` liên quan `IDTS-44` như follow-up/alternative theo hướng AWS-native.
- `IDTS-58` lien quan `IDTS-52`, `IDTS-53`, `IDTS-54`, `IDTS-55` va la dau vao FE handoff cho `IDTS-59` va `IDTS-60`.
- `IDTS-59` follow `IDTS-58` như scan evidence UI/UX của SangVN và liên quan coverage regression `IDTS-57`/`IDTS-60`.

## Sprint 4 task hygiene

Every Sprint 4 task must have a clear domain prefix, owner/support, due date, scope, acceptance criteria, evidence expectation, dependency/link section, and no-secret note when it touches deployment, auth, DB, S3, email, API keys, or user data.

Vietnamese: Mỗi task Sprint 4 phải có prefix domain rõ ràng, owner/support, due date, scope, acceptance criteria, evidence expectation, dependency/link section, và no-secret note nếu liên quan deploy, auth, DB, S3, email, API key, hoặc user data.
