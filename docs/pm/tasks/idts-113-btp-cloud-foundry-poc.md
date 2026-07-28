# IDTS-113 — SAP BTP Cloud Foundry migration and cutover

- Owner: DonHV
- Status: In Progress — XSUAA/AppRouter baseline merged; HANA migration and retained integrations under verification
- Due date: 2026-08-10
- Jira: https://dutassociation.atlassian.net/browse/IDTS-113

## Scope

Move IDTS Shared QA from Render to the SAP BTP Trial Cloud Foundry `dev`
space. The target uses SAP HANA Cloud/HDI, XSUAA, a standalone AppRouter,
HTML5 Application Repository, Destination service and SAP Job Scheduling
Service. Existing AWS S3 and Brevo providers are retained through one private
user-provided service. OpenAI live remains disabled/mock. Render remains the
rollback source during the cutover window.

## POC baseline implementation

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

- The POC uses custom auth and does not yet integrate XSUAA/AppRouter.
- No reusable POC user password is published or committed.
- Email and live OpenAI remain disabled; no external provider secrets were
  copied.
- Attachments remain isolated in HANA for this POC; AWS S3 is not copied.
- Baseline dependency audit remains open under IDTS-46.
- CAP build still reports the existing attachment
  `NonUpdateableProperties` annotation warning.

## Rollback

Undeploy the MTA, delete its HDI service if requested, then delete the isolated
HANA Cloud instance. Render Shared QA requires no rollback because it was not
modified.

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

## Remaining acceptance

- Merge the HANA/integration increment into `dev`.
- Deploy the final MTA and import the frozen archive into HDI/HANA.
- Assign XSUAA role collections and run Tester/Developer/PM browser matrix.
- Configure and manually invoke the hourly email outbox job.
- Verify PostgreSQL-to-HANA counts/IDs, S3 upload/download/hash, one new Brevo
  delivery and AI disabled/fallback behavior.
- Cut over the mentor/demo URL and keep Render available as read-only rollback
  for seven days.
