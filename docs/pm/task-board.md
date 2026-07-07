# IDTS Task Board

Last updated: 2026-07-07

Use this board for high-level movement only. Detailed task notes belong in the matching file under `docs/pm/tasks/`.

Vietnamese: Chi dung board nay de theo doi trang thai cap cao. Chi tiet cong viec phai ghi trong file tuong ung duoi `docs/pm/tasks/`.

## Done

| ID | Task | Output |
| --- | --- | --- |
| PM-001 | Create PM delivery pack | `docs/pm/` structure, status files, work packages, Sprint 1 plan. |
| BA-001 | Create BA documentation pack | `docs/ba/` baseline. |
| BA-002 | Create BRD deliverables | `docs/ba/brd/brd.en.md`, `docs/ba/brd/brd.vi.md`, `docs/ba/brd/brd.en.docx`, `docs/ba/brd/brd.vi.docx`. |
| BA-003 | Create SRS and FRS deliverables | Markdown and DOCX files under `docs/ba/srs/` and `docs/ba/frs/`. |
| BA-004 | Align MVP role baseline | Canonical docs, BRD/SRS/FRS, BA support docs, diagrams, and PM handover updated to Tester/Developer/PM. |
| WP1 | Data Model Foundation | Expanded CAP CDS model, service projections, and seed data under `db/data/`. |
| WP2 | Service and Value Help | OData V4 service actions, value help annotations, and metadata compile completed. |
| WP3 | Handler Rules and Validation | CAP handler rules for create/update, assignment, status transition, nextProcessor, history, and notifications completed. |
| WP4 | Fiori Elements UX | Core UX is complete; `IDTS-29` modular annotation refactor is integrated with equivalent compiled metadata, clean UI5 build, automated regression, and List Report/Object Page browser UAT. |
| WP5 | Comments and History | Grouped `HistoryEvents` read model, comments/attachments audit baseline, and Sprint 3 grouped history payload support completed for backend handoff. |
| WP7 | Notifications and Attachments | Backend persistence, in-app notifications, create-time attachment visibility, and browser happy-flow verification completed. |
| IDTS-13 | Object Page stale state after lifecycle action submit | PR #20 merged into `dev`; bound action side effects now refresh the bound Object Page entity and related history/notification/comment entities. Jira moved to Done. |
| IDTS-19 | Grouped history timeline with selective UI5 extension | PR #18 merged into `dev`; Object Page now has a grouped HistoryTimeline custom section while PM monitoring `views.paths` are preserved. Jira moved to Done. |
| IDTS-24 | Persona-based browser UAT evidence | PR #24 merged into `dev`; Playwright UAT script for Tester, Developer, and PM personas is integrated, evidence output is ignored, and Jira moved to Done. |
| IDTS-30 | PostgreSQL local proof and attachment storage decision | PostgreSQL deploy/read proof completed, draft-media blocker documented, long-term object-storage direction approved, and implementation handed off to `IDTS-31`. |
| IDTS-31 | Object-store-backed attachment implementation | Native AWS S3 acceptance passed with PostgreSQL metadata/reference, external binary storage, upload/activate/download/history/delete cleanup, and full regression evidence. |
| IDTS-33 | Manual browser UAT for Sprint 3 FE shell, monitoring, and Object Page flows | Jira live state is Done as of 2026-06-29. Remaining consolidation belongs to `IDTS-27`, not DatDT's active task queue. |
| IDTS-34 | Custom login/authentication foundation | PR #28 merged into `dev`; backend now has `AuthService`, password hashing, server-side `AuthSessions`, Bearer-token request mapping, protected `BugService`, and focused auth verification. Jira moved to Done. |
| IDTS-36 | SMTP email notification delivery with outbox tracking | PR #29 merged into `dev`; backend now has `NotificationDeliveries`, Nodemailer SMTP sender, outbox worker/retry handling, safe read-only delivery projection, automated regression evidence, private Brevo SMTP smoke evidence, and Jira moved to Done. |
| IDTS-41 | Catalog validation and draft-create authorization | PR #35 merged into `dev`; backend now rejects invalid/inactive Priority, Severity, and Environment codes and blocks Developer draft-create at the CAP layer. Jira moved to Done. |
| IDTS-42 | QA Depth Gate and hardened browser harness | PR #38 merged into `dev`; added mandatory PR evidence template, `qa-depth-gate` workflow, PR-body validator, reusable browser harness, secret scan, and PM/process documentation. |
| IDTS-43 | Fiori UX cleanup from IDTS-32 findings | PR #36 merged into `dev` at `62197e6`; fixed value-list hints, role-aware Create Bug action, single History section, clearer Reopen wording, and role-based browser smoke evidence. |
| IDTS-48 | Brevo Transactional API delivery for shared QA | PR #57 and PR #58 merged into `dev`; Render deploy `dep-d931rb6rnols73851g1g` is live on commit `bcf43b2`, authenticated shared-QA smoke passed, and a new Brevo API delivery reached `SENT` with `attemptCount = 1`. Jira moved to Done. |
| IDTS-49 | Derive reporter before custom-auth draft activation | PR #61 merged into `dev`; Render deploy `dep-d93420m7r5hc73a45dvg` is live, PM draft activation without client reporter passed, and reporter email delivery reached `SENT`. Jira moved to Done. |
| IDTS-44 | Deploy shared QA environment on Render | Shared QA acceptance is complete: Render/PostgreSQL, auth/OData, Brevo API, AWS S3 attachment persistence, final IDTS-49 reporter routing, and sanitized log/evidence checks passed. Jira moved to Done. |
| IDTS-1 | Sprint 02 epic Jira alignment | Old Sprint 02 epic was closed after child work had already been completed or superseded by later sprint work. Jira moved to Done. |
| IDTS-25 | Fix backend defects found during Sprint 3 QA | Sprint 3 backend-defect bucket was closed because remaining actionable issues were fixed or split into dedicated Jira tasks. Jira moved to Done. |
| IDTS-28 | Refactor backend service into focused modules | Refactor had already merged into `dev`; closure evidence and subsequent regression/QA work were accepted. Jira moved to Done. |
| IDTS-38 | Regression test custom login and SMTP/API notification flows | NhanT regression bucket was closed after DonHV confirmed login/email QA evidence was acceptable. Jira moved to Done. |
| IDTS-50 | Email notification readability and deep-link polish | DonHV confirmed email readability, deep-link behavior, and history wording are acceptable after Render/shared-QA verification. Jira moved to Done. |
| IDTS-27 | Sync docs, Jira status, and Sprint 3 evidence | Sprint 3 closure/status sync was completed and summarized for handoff into Sprint 4. Jira moved to Done. |
| IDTS-14 | Sprint 3 epic closure | Sprint 3 epic was closed after active follow-up work was moved under Sprint 4 epic `IDTS-51` or marked Done. |
| IDTS-39 | Auth unexpected error sanitization | PR #68 merged into `dev`; login/auth now returns safe generic messages for unexpected failures while keeping invalid-credential behavior unchanged. |
| IDTS-52 | Fiori-style custom sign-in page | Login page now uses SAPUI5 controls, Horizon theme, safe MessageStrip errors, responsive layout, and knowledge mirrors. |
| IDTS-53 | Fiori profile menu and sign-out UX | Authenticated app now has a SAPUI5 profile popover showing name/email/role/session expiry with visible Sign Out; browser smoke verifies logout guard. |
| IDTS-55 | Comments and attachments Object Page polish | PR #73 merged into `dev`; Render deploy `dep-d94cg4uq1p3s73bc6la0` is live and shared-QA smoke passed for comment reload persistence and attachment upload/download/delete cleanup. Jira moved to Done. |
| IDTS-56 | Smart assign developer dialog/dropdown | PR #79 merged into `dev`; Object Page `Smart Assign` dialog now uses SAPUI5/Fiori controls, searchable developer capability/availability table, backend assignment validation, programmatic QA, browser QA, and evidence under `docs/pm/evidence/idts-56/`. Jira moved to Done. |
| IDTS-61 | Replace Assignee value help with Smart Assign picker | PR #84 merged into `dev`; PR #85 synced PM docs; Render deploy `dep-d95pqqbtqb8s73f4i0kg` is live on commit `a68193e`; route/static artifact smoke passed; Jira moved to Done. |

Vietnamese:

| ID | Cong viec | Ket qua |
| --- | --- | --- |
| PM-001 | Tao bo tai lieu PM | Da tao cau truc `docs/pm/`, status files, work packages va Sprint 1 plan. |
| BA-001 | Tao bo tai lieu BA | Da tao baseline trong `docs/ba/`. |
| BA-002 | Tao BRD deliverables | Da tao BRD Markdown va DOCX tieng Anh/tieng Viet. |
| BA-003 | Tao SRS va FRS deliverables | Da tao cac file Markdown va DOCX trong `docs/ba/srs/` va `docs/ba/frs/`. |
| BA-004 | Chot baseline role MVP | Canonical docs, BRD/SRS/FRS, BA docs, diagrams va PM handover da cap nhat theo Tester/Developer/PM. |
| WP1 | Nen tang Data Model | CAP CDS model, service projections va seed data trong `db/data/` da hoan thanh. |
| WP2 | Service va Value Help | OData V4 service actions, value help annotations va metadata compile da hoan thanh. |
| WP3 | Handler Rules va Validation | CAP handler rules cho create/update, assignment, status transition, nextProcessor, history va notifications da hoan thanh. |
| WP4 | Fiori Elements UX | Core UX da hoan thanh; `IDTS-29` modular annotation refactor da tich hop va verify. |
| WP5 | Comments va History | Grouped `HistoryEvents`, comments/attachments audit baseline va grouped history payload da hoan thanh. |
| WP7 | Notifications va Attachments | Backend persistence, in-app notifications, create-time attachment visibility va browser happy-flow verification da hoan thanh. |
| IDTS-13 | Object Page stale state sau lifecycle action | PR #20 da merge vao `dev`; side effect cua bound action refresh lai Object Page va cac entity lien quan. Jira da chuyen Done. |
| IDTS-19 | Grouped history timeline bang UI5 extension | PR #18 da merge vao `dev`; Object Page co custom section HistoryTimeline va van giu PM monitoring views. Jira da chuyen Done. |
| IDTS-24 | Browser UAT evidence theo persona | PR #24 da merge vao `dev`; script Playwright UAT cho Tester, Developer, PM da tich hop. Jira da chuyen Done. |
| IDTS-30 | Thu PostgreSQL va chot huong attachment storage | Da chung minh PostgreSQL deploy/read, ghi nhan blocker draft-media, chot huong object storage dai han va ban giao sang `IDTS-31`. |
| IDTS-31 | Attachment dung object storage | AWS S3 acceptance da pass: PostgreSQL luu metadata/reference, S3 luu binary content, va full regression da verify. |
| IDTS-33 | Manual browser UAT cho FE shell, monitoring va Object Page flows | Jira live dang Done ngay 2026-06-29. Phan tong hop con lai thuoc `IDTS-27`, khong con nam trong hang doi task active cua DatDT. |
| IDTS-34 | Nen tang custom login/authentication | PR #28 da merge vao `dev`; backend da co `AuthService`, hash password, `AuthSessions`, Bearer-token mapping, `BugService` duoc bao ve, va auth verification rieng. Jira da chuyen Done. |
| IDTS-35 | Login UI va authenticated app session | PR #30 da merge vao `dev`; unauthenticated app entry redirect sang login, login gan Bearer token cho OData metadata, Fiori render va logout da browser-smoke pass. |
| IDTS-36 | SMTP email notification voi outbox tracking | PR #29 da merge vao `dev`; backend da co `NotificationDeliveries`, Nodemailer SMTP sender, outbox worker/retry, delivery projection read-only an toan, automated regression evidence, private Brevo SMTP smoke evidence, va Jira da chuyen Done. |
| IDTS-41 | Validate catalog va chan draft-create sai quyen | PR #35 da merge vao `dev`; backend chan Priority, Severity, Environment sai/khong active va chan Developer tao draft o CAP layer. Jira da chuyen Done. |
| IDTS-42 | QA Depth Gate va browser harness duoc harden | PR #38 da merge vao `dev`; da them PR evidence template bat buoc, workflow `qa-depth-gate`, validator PR body, browser harness dung lai, secret scan va tai lieu PM/process. |
| IDTS-43 | Don dep Fiori UX tu finding IDTS-32 | PR #36 da merge vao `dev` tai `62197e6`; da fix value-list hint, Create Bug theo role, chi con mot History section, wording Reopen ro hon, va co browser smoke theo role. |
| IDTS-48 | Brevo Transactional API cho shared QA | PR #57 va PR #58 da merge vao `dev`; Render deploy `dep-d931rb6rnols73851g1g` dang live tren commit `bcf43b2`, authenticated shared-QA smoke pass, va mot Brevo API delivery moi da `SENT` voi `attemptCount = 1`. Jira da chuyen Done. |
| IDTS-49 | Derive reporter truoc custom-auth draft activation | PR #61 da merge vao `dev`; Render deploy `dep-d93420m7r5hc73a45dvg` dang live, PM draft activation khong can client reporter da pass, va reporter email delivery dat `SENT`. Jira da chuyen Done. |
| IDTS-44 | Deploy shared QA environment tren Render | Acceptance shared QA da hoan tat: Render/PostgreSQL, auth/OData, Brevo API, AWS S3 attachment persistence, final IDTS-49 reporter routing, va log/evidence sanitized checks da pass. Jira da chuyen Done. |
| IDTS-1 | Dong epic Sprint 02 cu | Epic Sprint 02 cu da dong vi child work da xong hoac da duoc thay the boi cac sprint sau. Jira da chuyen Done. |
| IDTS-25 | Dong bucket backend defect Sprint 3 | Bucket loi backend Sprint 3 da dong vi cac issue con lai da fix hoac tach thanh task rieng. Jira da chuyen Done. |
| IDTS-28 | Dong backend refactor | Refactor da merge vao `dev`; closure evidence va regression/QA sau do da duoc chap nhan. Jira da chuyen Done. |
| IDTS-38 | Dong regression login/email | Bucket QA cua NhanT da dong sau khi DonHV xac nhan evidence login/email dat yeu cau. Jira da chuyen Done. |
| IDTS-50 | Dong email readability/deep-link polish | DonHV xac nhan email readability, deep link va history wording da OK sau shared-QA verification. Jira da chuyen Done. |
| IDTS-27 | Sync docs, Jira status va Sprint 3 evidence | Da hoan tat tong hop closure/status Sprint 3 va handoff sang Sprint 4. Jira da chuyen Done. |
| IDTS-14 | Dong epic Sprint 3 | Epic Sprint 3 da dong sau khi follow-up active duoc chuyen sang epic Sprint 4 `IDTS-51` hoac da Done. |
| IDTS-39 | Sanitize loi login bat thuong | PR #68 da merge vao `dev`; login/auth tra message generic an toan cho loi bat thuong va giu nguyen hanh vi invalid credential. |
| IDTS-52 | Login page custom theo Fiori style | Login page dung SAPUI5 controls, Horizon theme, MessageStrip loi an toan, responsive layout va knowledge mirrors. |
| IDTS-53 | Profile menu va Sign Out UX | App sau login co SAPUI5 profile popover hien ten/email/role/session expiry va Sign Out ro rang; browser smoke da verify logout guard. |
| IDTS-55 | Polish Comments va Attachments tren Object Page | PR #73 da merge vao `dev`; Render deploy `dep-d94cg4uq1p3s73bc6la0` dang live va shared-QA smoke pass cho comment reload persistence cung attachment upload/download/delete cleanup. Jira da chuyen Done. |
| IDTS-56 | Dialog/dropdown Smart Assign developer | PR #79 da merge vao `dev`; Object Page co action `Smart Assign` bang SAPUI5/Fiori controls, search developer/capability/availability, giu backend validation, co programmatic QA, browser QA va evidence trong `docs/pm/evidence/idts-56/`. Jira da chuyen Done. |
| IDTS-61 | Thay Assignee value help bang Smart Assign picker | PR #84 da merge vao `dev`; PR #85 da sync PM docs; Render deploy `dep-d95pqqbtqb8s73f4i0kg` dang live tren commit `a68193e`; route/static artifact smoke pass; Jira da chuyen Done. |

## Ready

| ID | Task | Primary member | Note |
| --- | --- | --- | --- |
| IDTS-37 | Notification UI and email delivery status readability | SangVN | FE/QA review of notification section after SMTP/outbox changes, focusing on readable event/channel/status/recipient/message output. Unblocked by merged IDTS-36. |
| IDTS-45 | Back up and decide migration or upgrade for expiring Render PostgreSQL | DonHV | Due 2026-07-24 before the free database expires on 2026-07-31. |
| IDTS-46 | Review and remediate npm dependency vulnerabilities | DonHV | Clean Render build reports 13 moderate and 7 high findings; use targeted upgrades, not broad force-fix. |
| IDTS-59 | Scan Sprint 4 Fiori screens for usability gaps and edge-case confusion | SangVN | Due 2026-07-11. Manual UI/UX scan that intentionally checks awkward flows, edge states, confusing wording, and SAP Fiori consistency. |
| IDTS-60 | Browser and manual UAT for completed Sprint 4 UI baseline | NhanT | Due 2026-07-12. Earlier QA checkpoint for merged Sprint 4 UI baseline before final `IDTS-57` regression. |
| IDTS-40 | AWS ECS/ECR shared QA deployment direction | DonHV | Due 2026-07-18 if kept active. Treat as AWS-native follow-up/alternative, not a blocker for accepted Render QA. |

Vietnamese:

| ID | Cong viec | Thanh vien chinh | Ghi chu |
| --- | --- | --- | --- |
| IDTS-37 | Notification UI va kha nang doc email delivery status | SangVN | FE/QA review notification section sau khi co SMTP/outbox, tap trung event/channel/status/recipient/message. Da duoc unblock boi IDTS-36 da merge. |
| IDTS-45 | Backup va chot migrate/nang cap Render PostgreSQL sap het han | DonHV | Han 24/07/2026 truoc khi DB free het han ngay 31/07/2026. |
| IDTS-46 | Review va xu ly npm dependency vulnerabilities | DonHV | Clean build Render bao 13 moderate va 7 high; chi upgrade co muc tieu, khong force-fix rong. |
| IDTS-59 | Scan UI/UX Sprint 4 Fiori de tim usability gap va edge-case confusion | SangVN | Han 2026-07-11. Manual scan co chu y pha happy path, kiem tra wording kho hieu, edge state va tinh nhat quan SAP Fiori. |
| IDTS-60 | Browser/manual UAT cho baseline UI Sprint 4 da merge | NhanT | Han 2026-07-12. Checkpoint QA som cho baseline UI da merge truoc khi regression tong cuoi `IDTS-57`. |
| IDTS-40 | Huong deploy shared QA bang AWS ECS/ECR | DonHV | Due 2026-07-18 neu giu active. Xem la AWS-native follow-up/alternative, khong block Render QA da accepted. |

## In Progress

| ID | Task | Primary member | Note |
| --- | --- | --- | --- |
| IDTS-57 | Browser regression and SAP Fiori UX review for redesigned screens | NhanT | PR #77 merged the first Playwright browser UX regression harness into `dev`, but the task remains open because the merged coverage is PM-focused. Final role-matrix and broader manual/browser regression should continue through IDTS-60 and the remaining IDTS-57 pass. |
| SP2 | Sprint 02 Mentor Feedback and Happy Flow Demo | DonHV, NhanT, DatDT, SangVN | Backend, HTTP, and real browser QA are stable enough to prove the happy flow. Remaining work is final SAP490 sync and mentor-demo rerun, not FE/blocking workflow repair. |
| WP6 | PM Monitoring | DonHV, DatDT, SangVN | Ownership wording is locked; backend monitoring fields, FE monitoring views, Object Page refresh side effects, grouped history timeline, and persona UAT automation are merged. Remaining manual follow-up is `IDTS-32`; `IDTS-33` is Done on Jira. |
| IDTS-32 | Manual browser UAT for Sprint 3 workflow/history flows | SangVN | Evidence branch merged through PR #34. Retest remains open until IDTS-41/42/43 fixes and no P0/P1 remain. |
| IDTS-47 | UX: Limit or paginate History Timeline on Object Page | SangVN | Implementation verified locally on branch `feature/idts-47-history-timeline-limit-sangvn`: UI5 `sap.m.List` growing shows 5 initial history events, older events remain accessible, and expandable details still render. PR #87 is open for DonHV review. |
| IDTS-58 | Fix Sprint 4 UI defects found after Fiori redesign review | DatDT | Branch `fix/idts-58-sprint-4-ui-defects-datdt` now contains the FE fixes and local browser-smoke evidence. Waiting for Jira evidence comment, push/PR review, and merge before board-level Done. |

Vietnamese:

| ID | Cong viec | Thanh vien chinh | Ghi chu |
| --- | --- | --- | --- |
| IDTS-57 | Browser regression va SAP Fiori UX review cho cac man hinh da redesign | NhanT | PR #77 da merge browser QA harness dau tien vao `dev`, nhung task van chua dong vi coverage hien tap trung PM. Can tiep tuc role matrix Tester/Developer/PM va manual/browser regression qua IDTS-60 va phan IDTS-57 con lai. |
| IDTS-50 | Cai thien email notification va sua deep link | DonHV | Sua email Gmail dang tho va link Fiori bi hong tu shared-QA email. Jira dang In Progress; branch implementation la `fix/idts-50-email-link-template-donhv`. |
| SP2 | Sprint 02 Mentor Feedback va Happy Flow Demo | DonHV, NhanT, DatDT, SangVN | Backend, HTTP va browser QA that da du on de chung minh happy flow. Phan con lai la sync SAP490 va rerun mentor demo. |
| WP6 | PM Monitoring | DonHV, DatDT, SangVN | Backend monitoring, FE monitoring views, Object Page refresh, grouped history timeline va persona UAT automation da merge. Manual follow-up con lai la `IDTS-32`; `IDTS-33` da Done tren Jira. |
| IDTS-1 | Jira alignment cho Sprint 02 epic | DonHV | Jira epic van To Do trong khi nhieu child task da Done. DonHV can xu ly trong `IDTS-27` bang comment hoac transition phu hop. |
| IDTS-25 | Fix backend defects phat hien trong Sprint 3 QA | DonHV | Jira live dang In Progress. Can chot evidence va quyet dinh dong task truoc khi tong hop PM/SAP490 Sprint 3. |
| IDTS-27 | Sync docs, Jira status va Sprint 3 evidence | DonHV | Bucket tong hop PM/Jira/evidence dang active. `IDTS-34` va `IDTS-36` da merge; tiep theo la handoff `IDTS-37`/`IDTS-38`, sau do tong hop evidence Sprint 3. |
| IDTS-28 | Tach backend service thanh cac module tap trung | DonHV | Jira live dang In Progress du refactor da merge. Can chot retest/evidence closure. |
| IDTS-32 | Manual browser UAT cho workflow/history Sprint 3 | SangVN | Evidence branch da merge qua PR #34. Van can retest sau IDTS-41/42/43 va chi dong khi khong con P0/P1. |
| IDTS-47 | Gioi han hoac phan trang History Timeline tren Object Page | SangVN | Da verify local tren branch `feature/idts-47-history-timeline-limit-sangvn`: UI5 `sap.m.List` growing hien 5 history event ban dau, event cu van xem duoc, va Show Details van mo bang detail. PR #87 dang mo cho DonHV review. |
| IDTS-58 | Fix cac loi UI Sprint 4 sau Fiori redesign review | DatDT | Branch `fix/idts-58-sprint-4-ui-defects-datdt` da co FE fixes va browser-smoke evidence local. Cho DatDT cap nhat Jira evidence, push/PR review, va merge truoc khi board-level Done. |

## Blocked

| ID | Task | Blocker | Required decision |
| --- | --- | --- | --- |
| None | None | No current blocker after IDTS-44 closure. | Continue scheduled follow-ups IDTS-45 and IDTS-46. |

Vietnamese:

| ID | Cong viec | Blocker | Quyet dinh can co |
| --- | --- | --- | --- |
| None | None | Khong con blocker hien tai sau khi dong IDTS-44. | Tiep tuc follow-up IDTS-45 va IDTS-46. |

## Update Rules

- Move a work package here only after updating its `tasks/*.md` file.
- Keep this board short; avoid detailed implementation logs.
- If multiple developers work at the same time, each should update the matching work package and their own member status file under `status/`.
- DonHV consolidates member updates into shared PM/SAP490 docs after the group work session or weekly review.

Vietnamese:

- Chi chuyen trang thai work package len board sau khi da cap nhat file `tasks/*.md` tuong ung.
- Giu board ngan gon, khong ghi log implementation chi tiet o day.
- Neu nhieu developer lam cung luc, moi nguoi cap nhat work package lien quan va file status cua chinh minh trong `status/`.
- DonHV tong hop cap nhat cua tung thanh vien vao tai lieu PM/SAP490 sau phien lam viec nhom hoac buoi review hang tuan.
