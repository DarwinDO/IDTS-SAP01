# IDTS-113 — SAP BTP Technical Specification delta candidate

> Status: **CANDIDATE FOR IDTS-112 — human approvals still required**
>
> This package is input for the governed Technical Specification EN
> integration task. It does not replace the current workbook and must not be
> copied to Google Drive before the IDTS-112 owner approvals and template
> checks are complete.

## 1. Baseline and acceptance truth

| Item | Verified value |
| --- | --- |
| Repository baseline | `0a02bdabb91beb18dab9524daf01b37be98bf10b` |
| BTP runtime implementation merge | `3504931d2689e4d56c0de3f5977342fc7cf57e4a` |
| Cloud Foundry target | Trial subaccount, `dev` space |
| CAP application | `idts-sap01-srv`, started 1/1 |
| Application entry | Standalone AppRouter plus HTML5 Application Repository |
| Database | SAP HANA Cloud through an HDI container |
| Attachment binary store | Existing AWS S3 provider retained |
| Email provider | Existing Brevo provider retained |
| Email scheduling | SAP Job Scheduling Service |
| AI provider acceptance | `DISABLED / NOT ACCEPTED`; safe deterministic fallback only |
| Accepted BTP browser role | PM |
| Provisioned BTP roles | SangVN and DatDT: `IDTS_DEVELOPER`; NhanT: `IDTS_TESTER` |
| Pending BTP browser evidence | One member-owned interactive sign-in and authorization check for Developer and Tester |

The migrated archive contains 32 explicit entities and 679 rows.
`AuthSessions` was excluded, all migrated password hashes were cleared, and
historical retryable email deliveries were converted to `SKIPPED` so that the
cutover cannot resend old mail.

## 2. Assumptions and scope delta

| Topic | Technical specification candidate content |
| --- | --- |
| Runtime | SAP BTP Cloud Foundry is the active Shared QA runtime. Render is a time-bounded manual rollback platform, not a hot replica. |
| Authentication | BTP uses XSUAA and AppRouter. Local development and the retained Render rollback profile use the existing custom authentication implementation. |
| Persistence | Production uses SAP HANA Cloud/HDI. Local development uses SQLite. The retained Render rollback baseline uses PostgreSQL. |
| Attachments | HANA stores attachment metadata and storage references; AWS S3 stores binary content. S3 remains outside BTP. |
| Email | HANA stores notification and delivery rows. SAP Job Scheduling Service invokes the CAP outbox action; Brevo remains the delivery provider. |
| AI | Four advisory UI capabilities and review/apply audit flows remain available, but the live OpenAI provider is disabled. No AI action may silently mutate workflow state. |
| Rollback | Platform rollback is documented and can restore the previous Render deployment. Lossless data reversal requires manual HANA-delta reconciliation because HANA and PostgreSQL are not continuously replicated. |

## 3. SAP BTP component and resource map

| Component | SAP BTP resource | Purpose | Configuration/source |
| --- | --- | --- | --- |
| CAP service | `idts-sap01-srv` | OData V4 business services, validation, authorization and integrations | `mta.yaml`, `srv/service.cds`, `srv/service.js`, `srv/auth.cds`, `srv/auth.js` |
| Database deployer | `idts-sap01-db-deployer` | Deploy the generated HDI database model | `mta.yaml`, generated `gen/db` |
| Database | `idts-sap01-db` (`hdi-shared`) | Isolated HDI persistence on SAP HANA Cloud | `mta.yaml`, `db/schema.cds` |
| Authentication | `idts-sap01-auth` (`xsuaa`) | Identity, scopes and role templates | `mta.yaml`, `xs-security.json` |
| Application router | `idts-sap01-approuter` | XSUAA login/logout, protected UI and token forwarding | `mta.yaml`, `app/router/xs-app.json` |
| UI content | `idts-sap01-html5-repo-host/runtime` | Store and serve the Fiori/UI5 application | `mta.yaml`, `app/bug-management-ui` |
| Destination | `idts-sap01-destination` | Route AppRouter OData requests to CAP and provide UI5 runtime destination | `mta.yaml` |
| Scheduler | `idts-sap01-jobscheduler` | Invoke protected email-outbox processing every hour | `mta.yaml`, `xs-security.json`, `srv/service.cds` |
| Private external binding | `idts-sap01-external-services` | Supply retained S3 and Brevo configuration without committing secrets | `mta.yaml`, `scripts/btp/upsert-external-services.ps1` |

## 4. XSUAA and AppRouter request flow

1. The browser opens the AppRouter route defined by
   `app/router/xs-app.json`.
2. AppRouter authenticates the user with XSUAA and serves the UI from the
   HTML5 Application Repository.
3. OData requests matching `/odata/*` are forwarded to destination
   `srv-api` with `forwardAuthToken: true` from `mta.yaml`.
4. CAP validates the XSUAA token. `AuthService.me` in `srv/auth.js` selects
   `btpUserProfile(req)` when `isXsuaaRuntime()` is true.
5. `btpUserProfile(req)` maps the platform identity candidates to an active
   `idts.cap.Users` row.
6. `enforcePlatformRoleAlignment(req, user)` in
   `srv/auth/platform-role.js` requires exactly one of `TESTER`,
   `DEVELOPER`, or `PM`, and requires that role to match
   `Users.role_code`.
7. A missing IDTS user, multiple/no business roles, or a role mismatch is
   rejected with a sanitized HTTP 403 response.

The BTP browser does not receive or store the XSUAA JWT. AppRouter owns the
platform session. The custom token flow in `srv/auth.js` remains available
only outside the XSUAA production profile.

## 5. HANA/HDI persistence boundary

| Boundary | Candidate explanation |
| --- | --- |
| Logical model | `db/schema.cds` defines the IDTS entities and relationships. |
| Service model | `srv/service.cds` and `srv/auth.cds` expose service projections/actions; they do not expose every physical table. |
| Physical deployment | The MTA HDI deployer converts the generated CDS model into HDI-managed HANA artifacts. |
| Migration | IDTS-113 exported an explicit Render entity allow-list, preserved UUID relationships, excluded sessions/secrets and imported all rows inside one HANA transaction. |
| Runtime transaction | CAP handlers use request/database transactions so Bug state and required history/notification side effects commit or roll back consistently. |
| Verification | Migration dry-run, ID preservation, HANA row readback, restart persistence and browser readback are recorded in the IDTS-113 evidence set. |

Evidence:

- `docs/pm/evidence/idts-113/btp-hana-migration-integrations-local-verification-20260728.md`
- `docs/pm/evidence/idts-113/btp-auth-jobscheduler-smoke-20260728.md`
- `docs/pm/evidence/idts-113/btp-persistence-notifications-after-restart-20260728.png`

## 6. Attachment storage boundary

1. `db/schema.cds` composes `BugAttachments` from
   `@cap-js/attachments`.
2. `srv/service.js` registers `prepareAttachmentWrite` for active and draft
   attachment targets.
3. `prepareAttachmentWrite` in `srv/bug-service/content.js` resolves the
   authenticated actor, enforces an allowed business role and records safe
   metadata such as content length.
4. The `@cap-js/attachments` production profile uses the S3 adapter configured
   in `package.json`.
5. HANA stores metadata and the storage reference. S3 stores the binary
   object. Secrets are supplied by `idts-sap01-external-services`.
6. The Fiori extension `BugCollaboration.js` holds selected files in browser
   memory before the Bug is activated, then uploads through the CAP attachment
   endpoint after Save.

Accepted evidence proves adapter upload, HANA metadata, download, SHA-256,
runtime restart persistence and cleanup. A second smoke through the native
Fiori file picker remains pending because the connected Chrome Uploads
permission did not allow the file chooser.

## 7. Notification, outbox, Job Scheduler and Brevo flow

1. A committed business action calls `writeNotificationRecord` from
   `srv/email/outbox.js`.
2. The same transaction writes an in-app `Notifications` row and an email
   `NotificationDeliveries` row with `PENDING` or a safe `SKIPPED` reason.
3. On BTP, `IDTS_EMAIL_WORKER_MODE=scheduler` makes
   `shouldStartEmailWorker()` in `srv/email/worker.js` return false; no
   process-local polling timer is started.
4. SAP Job Scheduling Service invokes
   `POST processEmailOutbox()` using the technical `OutboxProcessor` authority
   granted in `xs-security.json`.
5. `srv/service.cds` protects the action with
   `@(requires: 'OutboxProcessor')`.
6. `srv/service.js` delegates the action to
   `processEmailOutboxBatch({ tx: cds.db })`.
7. `processEmailDeliveries` in `srv/email/outbox.js` selects eligible
   `PENDING`/`FAILED` rows, claims each row with a lock token, increments the
   attempt count, calls the configured Brevo sender and records `SENT` or a
   sanitized `FAILED` result.

The deployed job `IDTSEmailOutboxHourly` and its single recurring schedule are
active. A fresh BTP delivery was observed moving from `PENDING` to `SENT`.

Evidence:

- `docs/pm/evidence/idts-113/btp-auth-jobscheduler-smoke-20260728.md`

## 8. AI boundary

| Item | Candidate explanation |
| --- | --- |
| Configuration | `srv/ai/config.js` defaults to `enabled: false` and provider `mock`. |
| Provider seam | `srv/ai/provider.js` returns `AI_DISABLED` when disabled and keeps provider failures sanitized. |
| UI capabilities | Similar Bugs, Classification Suggestion, Handoff Summary and Smart Assignment Explanation remain review-oriented. |
| Persistence | Sanitized suggestion/audit metadata may be recorded in HANA; raw secrets/provider responses are not stored or shown. |
| Mutation rule | Review actions do not silently change Bug status or assignee. Classification apply and duplicate confirmation use separate authorized actions and backend validation. |
| Acceptance truth | BTP browser fallback/no-mutation smoke passed. Live OpenAI is `DISABLED / NOT ACCEPTED`. |

Evidence:

- `docs/pm/evidence/idts-113/btp-ai-similar-bugs-dialog-20260728.png`
- `docs/pm/evidence/idts-113/btp-ai-classification-dialog-20260728.png`
- `docs/pm/evidence/idts-113/btp-ai-handoff-dialog-20260728.png`

## 9. Rollback and operational boundary

The authoritative procedure is:

- `docs/deployment/idts-113-btp-cutover-rollback.md`

The platform rollback proof is:

- `docs/pm/evidence/idts-113/btp-render-rollback-drill-20260728.md`

The rollback keeps the BTP/HANA environment intact for investigation, restores
the last verified Render deployment and checks the retained PostgreSQL
baseline. Any HANA-only business changes made after cutover must be explicitly
identified and manually reconciled before the rollback platform is opened for
normal use. The runbook therefore does not claim zero data loss or automatic
reverse replication.

## 10. Remaining approval and evidence actions

| Remaining item | Owner action | Completion evidence |
| --- | --- | --- |
| Tester role matrix | NhanT signs in once with the provisioned SAP identity; DonHV records the authorized/denied Tester checks | Authenticated browser role/authorization matrix |
| Developer role matrix | SangVN or DatDT signs in once with a provisioned SAP identity; DonHV records the authorized/denied Developer checks | Authenticated browser role/authorization matrix |
| Native file-picker smoke | Allow Chrome Uploads permission for the IDTS BTP application | Browser upload/download/reload/delete screenshots or report |
| Technical Specification integration | IDTS-105–109 owners review their candidate sections; IDTS-112 integrates the approved EN workbook | Member approvals, template checks, merged PR and same-ID Drive readback |

No password, API key, private database URL, raw token, private endpoint or full
recipient list belongs in the Technical Specification or its evidence.
