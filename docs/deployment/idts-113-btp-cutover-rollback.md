# IDTS-113 SAP BTP cutover and Render rollback runbook

## Purpose

This runbook controls the Shared QA move from Render/PostgreSQL to SAP BTP
Cloud Foundry/SAP HANA Cloud. It preserves Render as a temporary rollback
environment without presenting it as a synchronized replica.

The current cutover window starts on 2026-07-28. Keep the Render web service,
PostgreSQL database and private backup material available through at least
2026-08-04. Do not delete either environment as part of IDTS-113.

## Approved target architecture

| Layer | Active BTP target | Temporary rollback |
| --- | --- | --- |
| Browser entry | Standalone AppRouter | Render-hosted Fiori entry |
| Authentication | XSUAA role collections plus IDTS `Users` mapping | Custom bearer authentication |
| CAP runtime | Cloud Foundry `idts-sap01-srv` | Render `idts-sap01-qa` |
| Database | SAP HANA Cloud HDI container | Render PostgreSQL |
| UI content | HTML5 Application Repository | CAP/UI5 mounted application |
| Scheduled email processing | SAP Job Scheduling Service | Process-local outbox worker |
| Attachment binary | Existing AWS S3 provider | Same retained AWS S3 provider |
| Transactional email | Existing Brevo provider | Existing Brevo provider |
| AI | Disabled/mock fallback | Disabled/mock fallback |

AWS S3, Brevo and the AI boundary are deliberately unchanged by the cutover.
No SAP DMS, SAP mail service or SAP AI service is introduced.

## Pre-cutover freeze

1. Record the approved Git commit and deployed Cloud Foundry application state.
2. Confirm both BTP applications are started at one healthy instance.
3. Confirm HANA migration counts, relationships and cleared custom-auth data.
4. Confirm the AppRouter/XSUAA PM smoke, S3 persistence, Brevo `SENT` delivery,
   Job Scheduler activity and AI disabled/no-mutation behavior.
5. Record the current Render deploy and PostgreSQL backup reference outside
   Git/Jira.
6. Announce the BTP Shared QA entry point to the team and stop using Render for
   new test writes.

## BTP operating checks

Run these checks without printing credentials, tokens or private provider
configuration:

1. `cf target`
2. `cf apps`
3. `cf services`
4. CAP health returns HTTP `200`.
5. Anonymous protected OData returns HTTP `401`.
6. AppRouter redirects an anonymous browser to XSUAA and returns to IDTS after
   authentication.
7. The signed-in user's single XSUAA business role matches the active IDTS
   `Users.role_code`.
8. Job Scheduling Service shows the outbox job and exactly one active hourly
   schedule.

## Rollback decision triggers

Initiate rollback only when DonHV records one of these conditions:

- BTP CAP/AppRouter is unavailable and cannot be restored within the agreed
  Shared QA recovery time.
- HANA data integrity or relationship checks fail.
- XSUAA prevents the required role from using the application and no safe
  configuration correction is available.
- S3 or Brevo integration fails specifically in BTP and blocks the review.
- A P0/P1 defect is confirmed on BTP and the previous Render baseline is the
  safer demonstration environment.

Do not rollback for an isolated browser-cache problem, a single expired login
session, a transient free-tier cold start or a test-harness permission issue.

## Rollback procedure

1. Freeze BTP writes and record the rollback timestamp.
2. Record the affected BTP bug numbers and any business records created or
   changed after cutover.
3. Export or reconcile the HANA delta before directing users back to Render.
   There is no automatic HANA-to-PostgreSQL replication in IDTS-113.
4. Verify the retained Render deployment is `live`.
5. Verify the Render login page and app return HTTP `200`.
6. Verify anonymous protected OData returns HTTP `401`.
7. Authenticate with an approved rollback identity and run a read-only Bug,
   history, notification and attachment smoke.
8. Reconcile the recorded HANA delta into PostgreSQL through a reviewed,
   transaction-wrapped procedure. Do not run broad `cds deploy` or reload seed
   data.
9. Re-enable team access to the Render entry point and communicate that BTP is
   temporarily unavailable.
10. Keep BTP resources intact for diagnosis; do not delete the HDI container,
    XSUAA instance, AppRouter, HTML5 content, Destination or Job Scheduler.

## Data-recovery limitation

Render is a previous operational baseline, not a hot standby. Its current
deploy and PostgreSQL data are older than the accepted BTP runtime/HANA state.
Immediate traffic rollback is possible, but preserving post-cutover writes
requires a separate HANA-delta reconciliation step. A rollback that skips that
step must be explicitly accepted as a data-loss decision.

## Recovery verification

After either BTP recovery or Render rollback:

- Health and login/app entry checks pass.
- Anonymous protected OData is denied.
- The approved identity sees the expected role and data scope.
- A known Bug reloads with the expected status, assignee and next processor.
- History and notifications remain readable.
- A retained attachment downloads with the expected byte length/hash.
- Email scheduling has only one active worker path for the selected runtime.
- Logs contain no unresolved HTTP `5xx`, raw SQL, stack trace or secret.

## Closeout

At the end of the seven-day window, DonHV decides whether to:

- keep Render longer as a manual fallback;
- archive PostgreSQL and stop the Render service; or
- return BTP to a POC-only role.

The decision and evidence belong in Jira IDTS-113 and
`docs/pm/risk-decision-log.md`. Resource deletion is outside this runbook.

## Giải thích ngắn bằng tiếng Việt

- BTP/HANA là môi trường Shared QA chính sau cutover.
- Render/PostgreSQL được giữ tối thiểu đến hết ngày 04/08/2026 để quay lại khi
  BTP có sự cố nghiêm trọng.
- Render không đồng bộ tự động với HANA. Nếu BTP đã có dữ liệu mới thì phải
  dừng ghi và đối soát phần chênh lệch trước khi quay lại Render.
- Không chạy `cds deploy` rộng hoặc nạp lại seed khi rollback vì có thể thay
  đổi dữ liệu hiện có.
- S3 và Brevo không chuyển nhà; cả BTP và Render tiếp tục dùng các provider
  hiện có thông qua cấu hình private.
