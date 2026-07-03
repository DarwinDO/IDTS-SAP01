# IDTS-51 - Sprint 4 Stabilization Plan

Last updated: 2026-07-03

## Purpose

Track the Sprint 4 follow-up work after Sprint 3 shared-QA closure. Sprint 4 focuses on stabilization, security, deployment continuity, and UX polish rather than adding broad new product scope.

Vietnamese: File này dùng để theo dõi các việc follow-up của Sprint 4 sau khi Sprint 3 đã đóng phần shared QA. Sprint 4 tập trung vào ổn định hệ thống, bảo mật, duy trì môi trường deploy, và polish UX; không mở rộng scope sản phẩm quá rộng.

## Sprint window

- Planned start: 2026-07-04
- Planned end: 2026-07-18

Jira status: the real board sprint `IDTS Sprint 4` has been created on board `34` with sprint id `70`. The sprint window is 2026-07-04 to 2026-07-18, matching the planned Sprint 4 dates. `IDTS-39`, `IDTS-40`, `IDTS-45`, `IDTS-46`, and `IDTS-47` are assigned to this sprint and also grouped under Epic `IDTS-51`.

Vietnamese: Jira board sprint thật `IDTS Sprint 4` đã được tạo trên board `34` với sprint id `70`. Sprint chạy từ 2026-07-04 đến 2026-07-18, khớp với ngày Sprint 4 đã chốt. `IDTS-39`, `IDTS-40`, `IDTS-45`, `IDTS-46`, và `IDTS-47` đã được đưa vào sprint này và đồng thời được gom dưới Epic `IDTS-51`.

## Active Sprint 4 candidates

| Jira | Owner | Due date | Sprint 4 reason |
| --- | --- | --- | --- |
| IDTS-39 | DonHV | 2026-07-07 | Harden login error handling so unexpected backend/database errors do not leak raw SQL or internal details. |
| IDTS-45 | DonHV | 2026-07-24 | Back up and decide migration/upgrade before the Render PostgreSQL free instance expires. The due date intentionally extends beyond the sprint because the real deadline is 2026-07-31. |
| IDTS-46 | DonHV | 2026-07-12 | Review dependency vulnerabilities found during Render/shared-QA work with targeted remediation. |
| IDTS-47 | SangVN | 2026-07-14 | Fix the long History Timeline UX issue found during IDTS-32 UAT. |
| IDTS-40 | DonHV | 2026-07-18 | Keep AWS ECS/ECR as a longer-term deployment direction or alternative; it does not block accepted Render QA. |

Vietnamese:

| Jira | Owner | Due date | Lý do đưa vào Sprint 4 |
| --- | --- | --- | --- |
| IDTS-39 | DonHV | 2026-07-07 | Hardening login error để lỗi backend/database bất ngờ không leak raw SQL hoặc thông tin nội bộ. |
| IDTS-45 | DonHV | 2026-07-24 | Backup và chốt migrate/upgrade trước khi Render PostgreSQL free hết hạn. Due date cố ý nằm ngoài sprint vì deadline thật là 2026-07-31. |
| IDTS-46 | DonHV | 2026-07-12 | Review dependency vulnerabilities phát hiện trong quá trình Render/shared-QA, xử lý theo hướng targeted. |
| IDTS-47 | SangVN | 2026-07-14 | Fix vấn đề UX History Timeline quá dài được phát hiện trong UAT IDTS-32. |
| IDTS-40 | DonHV | 2026-07-18 | Giữ AWS ECS/ECR như hướng deploy dài hạn hoặc phương án thay thế; không block Render QA đã accepted. |

## Issue links

## Completed Sprint 4 UI/auth items

| Jira | Owner / support | Result |
| --- | --- | --- |
| IDTS-39 | DonHV | Safe unexpected login/auth error handling merged through PR #68. |
| IDTS-52 | DatDT owner, DonHV support | First implementation pass completed: custom login page uses SAPUI5 controls, SAP Horizon styling, safe `MessageStrip` messages, and responsive layout. |
| IDTS-53 | SangVN owner, DonHV support | First implementation pass completed: authenticated app shows a SAPUI5 profile popover with name, email, role, session expiry, and Sign Out. |

Vietnamese:

| Jira | Owner / support | Ket qua |
| --- | --- | --- |
| IDTS-39 | DonHV | Safe unexpected login/auth error handling da merge qua PR #68. |
| IDTS-52 | DatDT owner, DonHV support | Pass implement dau da xong: login page custom dung SAPUI5 controls, SAP Horizon styling, message loi an toan bang `MessageStrip`, va responsive layout. |
| IDTS-53 | SangVN owner, DonHV support | Pass implement dau da xong: app sau login co SAPUI5 profile popover hien ten, email, role, session expiry, va Sign Out. |

- `IDTS-39` relates to `IDTS-38`.
- `IDTS-45` relates to `IDTS-44`.
- `IDTS-46` relates to `IDTS-44`.
- `IDTS-47` relates to `IDTS-32`.
- `IDTS-40` relates to `IDTS-44` as an AWS-native follow-up/alternative.

Vietnamese:

- `IDTS-39` liên quan `IDTS-38`.
- `IDTS-45` liên quan `IDTS-44`.
- `IDTS-46` liên quan `IDTS-44`.
- `IDTS-47` liên quan `IDTS-32`.
- `IDTS-40` liên quan `IDTS-44` như follow-up/alternative theo hướng AWS-native.

## Sprint 4 task hygiene

Every Sprint 4 task must have a clear domain prefix, owner/support, due date, scope, acceptance criteria, evidence expectation, dependency/link section, and no-secret note when it touches deployment, auth, DB, S3, email, API keys, or user data.

Vietnamese: Mỗi task Sprint 4 phải có prefix domain rõ ràng, owner/support, due date, scope, acceptance criteria, evidence expectation, dependency/link section, và no-secret note nếu liên quan deploy, auth, DB, S3, email, API key, hoặc user data.
