# IDTS Task Board

Last updated: 2026-06-29

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

## Ready

| ID | Task | Primary member | Note |
| --- | --- | --- | --- |
| IDTS-32 | Manual browser UAT for Sprint 3 workflow/history flows | SangVN | Jira task narrowed after split: SangVN owns Developer lifecycle, Need More Information/resubmit, reject follow-up, retest/close/reopen, grouped history timeline, and role/action visibility checks. |
| IDTS-35 | Login UI and authenticated app session flow | DatDT | Fiori/UI5 login entry, login/logout behavior, and authenticated OData session handling using the merged IDTS-34 backend auth contract. |
| IDTS-37 | Notification UI and email delivery status readability | SangVN | FE/QA review of notification section after SMTP/outbox changes, focusing on readable event/channel/status/recipient/message output. Blocked by IDTS-36. |
| IDTS-38 | Regression test custom login and SMTP notification flows | NhanT | QA coverage for login success/failure, role behavior, SMTP success/failure, disabled email config, and no-secret evidence. Blocked by IDTS-36; auth contract is now available from IDTS-34. |

Vietnamese:

| ID | Cong viec | Thanh vien chinh | Ghi chu |
| --- | --- | --- | --- |
| IDTS-32 | Manual browser UAT cho workflow/history Sprint 3 | SangVN | SangVN phu trach Developer lifecycle, Need More Information/resubmit, reject follow-up, retest/close/reopen, grouped history timeline va role/action visibility. |
| IDTS-35 | Login UI va authenticated app session | DatDT | Login/logout tren FE va authenticated OData session dua tren backend auth contract IDTS-34 da merge. |
| IDTS-37 | Notification UI va kha nang doc email delivery status | SangVN | FE/QA review notification section sau khi co SMTP/outbox, tap trung event/channel/status/recipient/message. Bi block boi IDTS-36. |
| IDTS-38 | Regression test custom login va SMTP notification | NhanT | QA login success/failure, role behavior, SMTP success/failure, disabled email config va no-secret evidence. Bi block boi IDTS-36; auth contract IDTS-34 da san sang. |

## In Progress

| ID | Task | Primary member | Note |
| --- | --- | --- | --- |
| SP2 | Sprint 02 Mentor Feedback and Happy Flow Demo | DonHV, NhanT, DatDT, SangVN | Backend, HTTP, and real browser QA are stable enough to prove the happy flow. Remaining work is final SAP490 sync and mentor-demo rerun, not FE/blocking workflow repair. |
| WP6 | PM Monitoring | DonHV, DatDT, SangVN | Ownership wording is locked; backend monitoring fields, FE monitoring views, Object Page refresh side effects, grouped history timeline, and persona UAT automation are merged. Remaining manual follow-up is `IDTS-32`; `IDTS-33` is Done on Jira. |
| IDTS-1 | Sprint 02 epic Jira alignment | DonHV | Jira epic is still To Do while multiple child tasks are already Done. DonHV should resolve this during `IDTS-27` consolidation by commenting or transitioning the epic as appropriate. |
| IDTS-25 | Fix backend defects found during Sprint 3 QA | DonHV | Jira live state is In Progress. Evidence and closure decision are still needed before Sprint 3 PM/SAP490 consolidation. |
| IDTS-27 | Sync docs, Jira status, and Sprint 3 evidence | DonHV | Active PM/Jira/evidence consolidation bucket. Current work order: `IDTS-34` is merged; next implementation slice is `IDTS-36`, then Sprint 3 evidence consolidation. |
| IDTS-28 | Refactor backend service into focused modules | DonHV | Jira live state is In Progress even though the refactor is merged. Needs final retest/evidence closure alignment. |
| IDTS-36 | SMTP email notification delivery with outbox tracking | DonHV | Implementation is active on `feature/idts-36-smtp-outbox-donhv`: CAP outbox model, Nodemailer worker, safe OData projection, focused backend test, and local SMTP integration test are implemented; final regression/docs/Jira evidence is in progress. |

Vietnamese:

| ID | Cong viec | Thanh vien chinh | Ghi chu |
| --- | --- | --- | --- |
| SP2 | Sprint 02 Mentor Feedback va Happy Flow Demo | DonHV, NhanT, DatDT, SangVN | Backend, HTTP va browser QA that da du on de chung minh happy flow. Phan con lai la sync SAP490 va rerun mentor demo. |
| WP6 | PM Monitoring | DonHV, DatDT, SangVN | Backend monitoring, FE monitoring views, Object Page refresh, grouped history timeline va persona UAT automation da merge. Manual follow-up con lai la `IDTS-32`; `IDTS-33` da Done tren Jira. |
| IDTS-1 | Jira alignment cho Sprint 02 epic | DonHV | Jira epic van To Do trong khi nhieu child task da Done. DonHV can xu ly trong `IDTS-27` bang comment hoac transition phu hop. |
| IDTS-25 | Fix backend defects phat hien trong Sprint 3 QA | DonHV | Jira live dang In Progress. Can chot evidence va quyet dinh dong task truoc khi tong hop PM/SAP490 Sprint 3. |
| IDTS-27 | Sync docs, Jira status va Sprint 3 evidence | DonHV | Bucket tong hop PM/Jira/evidence dang active. `IDTS-34` da merge; slice tiep theo la `IDTS-36`, sau do tong hop evidence Sprint 3. |
| IDTS-28 | Tach backend service thanh cac module tap trung | DonHV | Jira live dang In Progress du refactor da merge. Can chot retest/evidence closure. |
| IDTS-36 | SMTP email notification voi outbox tracking | DonHV | Dang implement tren `feature/idts-36-smtp-outbox-donhv`: da co CAP outbox model, Nodemailer worker, safe OData projection, focused backend test va local SMTP integration test; dang hoan tat regression/docs/Jira evidence. |

## Blocked

| ID | Task | Blocker | Required decision |
| --- | --- | --- | --- |
| None | None | None | None |

Vietnamese:

| ID | Cong viec | Blocker | Quyet dinh can co |
| --- | --- | --- | --- |
| None | None | None | None |

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
