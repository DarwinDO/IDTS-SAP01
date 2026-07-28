# IDTS-113 — SAP BTP Cloud Foundry migration and cutover

- Owner: DonHV
- Status: In Progress — BTP runtime, HANA migration and retained integrations verified; final role/rollback/documentation gates remain
- Due date: 2026-08-10
- Jira: https://dutassociation.atlassian.net/browse/IDTS-113

## Scope

Move IDTS Shared QA from Render to the SAP BTP Trial Cloud Foundry `dev`
space. The target uses SAP HANA Cloud/HDI, XSUAA, a standalone AppRouter,
HTML5 Application Repository, Destination service and SAP Job Scheduling
Service. Existing AWS S3 and Brevo providers are retained through one private
user-provided service. OpenAI live remains disabled/mock. Render remains the
rollback source during the cutover window.

## Historical POC baseline implementation

This section describes the first isolated POC only. It is retained for audit
history and is not the current BTP architecture. The authoritative current
state starts at **Migration increment - XSUAA, AppRouter, and HTML5
repository** below.

- Production CAP profile uses `@cap-js/hana`.
- Integration profile continues to use PostgreSQL for Render.
- BTP attachment storage uses the isolated database-backed provider; the
  Render integration profile keeps its existing object-store configuration.
- The MTA contains one CAP service module, one HDI deployer, and one
  `hdi-shared` resource.
- The existing custom authentication implementation is retained for the POC.
  XSUAA/AppRouter migration remains a separate architectural decision.
- The current Fiori webapp is packaged under the path already served by the
  project `server.js`.

## Verification

- HANA Cloud `hana-free`: create succeeded.
- HDI `hdi-shared`: create succeeded and bound to the CAP app/deployer.
- MTA deployment: succeeded.
- CAP app: started, 1/1 instance.
- Health, login page, and AuthService metadata: HTTP 200.
- Anonymous BugService metadata: HTTP 401.
- Temporary-seed authenticated smoke:
  login 200, protected OData read 200, logout 200, revoked token 401.
- Temporary password environment variables were removed after the smoke.
- Local regression: auth 28/28, code-list/authorization 18/18, comments
  persistence PASS, CAP compile PASS, UI5 build PASS, secret scan PASS,
  agent-rule check PASS, QA Depth self-test 15/15, AI DevKit 5/5.
- Profile check: production=`hana`, integration=`postgres`, and the
  Render-effective `production+integration` environment remains `postgres`.

## Known limitations

- The historical POC used custom auth and did not integrate XSUAA/AppRouter.
- No reusable POC user password is published or committed.
- Live OpenAI remains disabled and is not accepted.
- The first POC attachment store was isolated; the current BTP runtime retains
  AWS S3 through a private binding.
- Baseline dependency audit remains open under IDTS-46.
- CAP build still reports the existing attachment
  `NonUpdateableProperties` annotation warning.

## Historical POC rollback

The isolated POC could be removed without changing Render. The current cutover
must instead follow `docs/deployment/idts-113-btp-cutover-rollback.md`; do not
delete HANA, HDI, XSUAA, AppRouter, HTML5, Destination, Job Scheduler, Render
or PostgreSQL as part of the rollback drill.

## Migration increment - XSUAA, AppRouter, and HTML5 repository

The migration branch extends the validated POC without changing the current
Render deployment:

- Production CAP auth is XSUAA; development and the Render
  `production+integration` profile keep custom auth.
- AppRouter owns BTP login/logout and forwards the user token to CAP.
- The browser never receives or stores the XSUAA JWT.
- `AuthService.me` maps JWT identity to an active IDTS user and requires the
  XSUAA business role to match `Users.role_code`.
- The Fiori app is packaged for the HTML5 Application Repository.
- AWS S3, Brevo, and the disabled/mock AI boundary remain unchanged in this
  increment.

Local verification covers profile separation, CAP compile, UI5 build, focused
auth/history/comment regression, and MTA packaging. Authenticated BTP browser
smoke is deferred until the combined HANA/integration deployment is ready, so
this increment does not claim deployed XSUAA acceptance.

## Migration increment — HANA data and retained integrations

- The exporter uses the authenticated Render CLI instead of copying a
  PostgreSQL password into the repository. The frozen Shared QA archive
  contains 32 explicitly listed entities and 679 rows.
- `AuthSessions` is intentionally excluded and `Users.passwordHash` is cleared
  because BTP authentication is owned by XSUAA.
- UUIDs and relationships are preserved. Historical `PENDING`/`FAILED` email
  deliveries are changed to `SKIPPED` in the migration archive so cutover
  cannot resend old notifications.
- Production attachments use the existing AWS S3 bucket through the private
  `idts-sap01-external-services` binding. Brevo settings are read from the same
  binding under `credentials.email`.
- Render continues to poll its email outbox. BTP disables the process-local
  timer and exposes `processEmailOutbox()` to SAP Job Scheduling Service under
  the technical `OutboxProcessor` XSUAA scope.
- The source export is read-only and Git-ignored. Import remains dry-run by
  default and requires explicit `--execute`; it runs inside one HANA
  transaction and verifies migrated IDs.

## Current verification

- HANA migration policy, physical-column mapping and byte-preservation checks:
  8/8 PASS.
- Job Scheduler/S3 binding checks: 6/6 PASS.
- XSUAA/AppRouter checks: 11/11 PASS.
- Existing email outbox regression: PASS.
- CAP compile: PASS.
- MTA build with CAP service, HDI deployer, UI, AppRouter and HTML5 content:
  PASS.
- Private BTP service binding: created without printing secrets; temporary
  credentials file removed.
- Shared QA export: 32 entities, 679 rows; manifest checksum recorded in
  ignored migration evidence.
- Linked-model audit: zero unknown source columns; all 14 user password hashes
  are cleared, and the 32-entity/679-row import package passes dry-run
  validation.
- Runtime fix PR #201 merged normally at
  `3504931d2689e4d56c0de3f5977342fc7cf57e4a` and was deployed without rerunning
  the HDI deployer.
- Cloud Foundry CAP service and AppRouter are healthy at 1/1 instances.
- DonHV/PM authenticated browser smoke passed through AppRouter/XSUAA.
- SangVN, DatDT and NhanT exist in the BTP subaccount's Default identity
  provider. SangVN and DatDT are assigned to `IDTS_DEVELOPER`; NhanT is
  assigned to `IDTS_TESTER`.
- HANA task sequence 25 verified by SHA-256 comparison that all three stored
  e-mails exactly match the approved identities, while their existing
  `DEVELOPER`, `DEVELOPER` and `TESTER` roles remain active. No HANA update was
  needed or executed.
- A fresh read-only verification distinguished the final
  `idts-sap01-db` container from the earlier POC container. Application-context
  readback returned 14 users: three approved FPT member identities, ten
  intentional `@example.local` demo developers and one other approved PM
  identity. DatDT/SangVN remain active Developers and NhanT remains an active
  Tester. No HANA write or runtime deployment occurred. Evidence:
  `docs/pm/evidence/idts-113/hana-final-container-user-classification-20260728.md`.
- `npm run qa:idts113:btp-auth` passed 12/12 role-alignment, mismatch-denial,
  profile-separation and AppRouter/XSUAA checks.
- BUG-0018 assignment, HANA history and Notifications UI readback passed.
- Job Scheduler job `IDTSEmailOutboxHourly` is active with one hourly schedule.
- A fresh email delivery moved from PENDING to SENT through a Scheduler run,
  with HANA and Brevo provider readback.
- The production-bound AWS S3 adapter passed temporary upload, HANA metadata,
  download, SHA-256, existence and full cleanup checks.
- All four AI entry points passed browser smoke in disabled-provider/fallback
  mode, and BUG-0018 status, assignee and current action owner did not mutate.
- The same CAP droplet was restarted and returned healthy at 1/1. A temporary
  S3 attachment retained identical HANA metadata, byte length and SHA-256 after
  restart, then passed final metadata/object cleanup.
- After restart, BUG-0018 remained Assigned to DatDT, History reloaded four
  events and Notifications reloaded two Assigned/In App/Sent rows.
- Job `IDTSEmailOutboxHourly` and its single recurring schedule remained Active
  after the runtime restart.
- Recent CAP web-process log scan found zero serious error/5xx/timeout findings.

## Remaining acceptance

- Provisioning and static/backend role alignment for Tester and Developer are
  complete. Capture one interactive login and live authorization matrix for
  each member; only the current PM browser session has authenticated evidence,
  because the agent must not impersonate the member identities.
- Re-run the attachment flow through the actual Fiori file picker after Chrome
  Uploads permission is allowed. Two authenticated attempts reached the enabled
  native chooser but were rejected by the browser bridge with `Not allowed`;
  the settled UI remained empty and no CAP/HANA/S3 mutation occurred. The
  storage adapter itself is accepted. See
  `docs/pm/evidence/idts-113/btp-native-attachment-picker-attempt-20260728.md`.
- The Render/PostgreSQL platform-readiness drill and seven-day window are now
  documented. Lossless data reversal remains conditional on manual HANA-delta
  reconciliation because Render is not a hot replica.
- PM handover and the deployment knowledge mirror are synchronized. The final
  Technical Specification EN update remains governed by IDTS-112 and its human
  approval dependencies. The source-aligned BTP delta candidate is available
  at
  `docs/pm/evidence/idts-113/technical-spec-btp-delta-candidate.md`; it is
  explicitly not an approved workbook update.
