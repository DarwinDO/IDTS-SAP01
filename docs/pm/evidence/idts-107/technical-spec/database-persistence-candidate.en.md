# IDTS-107 — Technical Specification EN database and persistence candidate refresh

> Gate status: **GATE 1 CANDIDATE ONLY — human acknowledgment, owner approval,
> IDTS-112 integration, and Drive synchronization remain pending.**
>
> This is a source-trace and workbook-cell proposal for the English Technical
> Specification. It does not modify the official workbook, approve Gate 2,
> update Drive, deploy a database, or run seed data.

## Baseline and scope

| Item | Candidate value |
| --- | --- |
| Repository baseline | `origin/dev` `32111c0c7689f8040fce49205445432cc7d1892e` (2026-08-03) |
| Earlier IDTS-107 schema baseline | `362ace2a39a82d19c4acc723fe96a15bf7373f5e` |
| Schema comparison | `db/schema.cds` has the same Git blob `069266f785947c2f921afde75d24fa728faed4ea` at both baselines. |
| Logical persistence source | `db/schema.cds`; service exposure is `srv/service.cds` and request behaviour is in `srv/`. |
| Production Shared QA persistence | SAP HANA Cloud through the `idts-sap01-db` HDI container. |
| Development / integration / rollback | SQLite in development; CAP `integration` profile uses PostgreSQL; retained Render/PostgreSQL is a rollback platform, not a hot HANA replica. |
| Attachment binary | `@cap-js/attachments` uses the configured shared object-store/S3 adapter in production; HANA persists metadata and storage reference. |
| Email | `Notifications` and `NotificationDeliveries` are durable HANA rows; Job Scheduler calls the protected outbox action and the configured sender processes delivery. |

The stale branch `origin/docs/idts-107-technical-design-db-donhv` has three
unmerged commits (`b5a9058`, `aadcff0`, `667f15b`). Its candidate was useful
for the unchanged schema but is behind current BTP runtime/configuration
evidence. The source difference from its baseline to current `origin/dev`
changes `mta.yaml`, `package.json`, and AI-facing service fields, but not
`db/schema.cds`.

## Proposed Technical Design text

| Official EN workbook target | Candidate text for IDTS-112 integration |
| --- | --- |
| `Technical Design!B6` | IDTS is a CAP/Fiori application. In the production BTP profile, AppRouter and XSUAA authenticate the browser and CAP maps the platform identity to an active IDTS `Users` row. `AuthSessions` is used only by the retained custom-auth profiles; it stores a SHA-256 token hash, never a raw bearer token. |
| `Technical Design!B13` | The CDS model contains 32 explicit IDTS entities: 15 shared code lists; `Users`, `AuthSessions`, developer/classification master data, `Bugs`, comments, history, notifications/deliveries, duplicate links, and AI suggestion audit rows. `Bugs.attachments` is supplied by `@cap-js/attachments`; generated attachment/scan artifacts are included in the HANA physical dictionary. |
| `Technical Design!B107` | The active BTP runtime uses CAP with SAP HANA Cloud/HDI. Attachment metadata/reference is persisted through the CAP attachment model and binary content is stored through the configured external object-store adapter. Render/PostgreSQL is retained only for controlled rollback; it does not receive HANA changes automatically. |

## Candidate data dictionary and physical-table interpretation

The complete candidate column dictionary is
[`database-dictionary.en.csv`](database-dictionary.en.csv). It contains 35
physical HANA table artifacts and 326 columns. Fresh generation from the
current baseline with `cds compile db --to hana` produced the same 35 tables
and 326 columns: 326 candidate rows matched, with zero missing and zero extra
rows. The generated files were written only to `.tmp/`; this is generated-model
proof, not a claim that an HDI deployment or live HANA readback was performed.

| Generated-artifact verification | Result |
| --- | --- |
| CAP service compile | PASS: `npx cds compile srv --to edmx -s all` |
| HANA artifact generation | PASS: 35 `.hdbtable` artifacts |
| Generated columns | 326 |
| Candidate dictionary rows | 326 |
| Missing candidate rows | 0 |
| Extra candidate rows | 0 |
| CDS source blob | `069266f785947c2f921afde75d24fa728faed4ea` |

| Logical area | CDS truth | HANA/persistence interpretation |
| --- | --- | --- |
| Code lists | 15 entities inherit `CodeList`. | Stable `code` keys control business/status/channel/action values; `active` preserves historical values without allowing new selection. |
| Identity and session | `Users` is the business profile; `AuthSessions` has `tokenHash`, issue/expiry/revocation/use timestamps. | XSUAA production does not create custom sessions. A custom-profile login reads an active user and writes only a token hash. |
| Classification and assignment | `DeveloperProfiles`, SAP module/component/category bridges, and `DeveloperResponsibilities`. | `Bugs` stores the selected component/category and validated component category; the handler, not Fiori alone, enforces consistency and assignment suitability. |
| Bug aggregate | `Bugs` is a `cuid, managed` aggregate with draft-enabled service projection. | CAP creates draft persistence artifacts separately from the active business table; the physical dictionary must be regenerated from the deployable model before a final HANA table count is approved. |
| Attachments | `Bugs.attachments` composes `BugAttachments` from `@cap-js/attachments`. | Metadata/reference stays in CAP persistence. The production adapter stores binary objects externally; no credential or object-store endpoint belongs in the workbook. |
| Audit/history | `HistoryEvents` groups one business action; `HistoryLogs` is field-level and append-only by behaviour. | Required history is written with the business action. Exact workflow action codes remain distinct from legacy audit categories. |
| Notification/outbox | `Notifications` composes `NotificationDeliveries`; unique `(notification, channel)` prevents duplicate channel rows. | The in-app event and EMAIL delivery snapshot are committed with the business action; body/configuration fields are not exposed by the safe OData delivery projection. |
| Duplicate/AI | `DuplicateLinks` records only human-confirmed relations; `AiSuggestions` stores normalized review/audit data. | AI candidates do not silently change Bug state, assignment, or duplicate links. |

## Transaction, failure, and rollback proposal

| Flow | Commit boundary | Failure rule |
| --- | --- | --- |
| Custom authentication | `cds.tx(req)` reads `Users` and inserts `AuthSessions`. | Invalid credentials return a safe denial; the raw token is returned once and is not persisted. |
| Draft activation / active create-update | CAP request transaction validates before activating/persisting the Bug. | Validation, authorization, or required persistence failure prevents partial business state. |
| Workflow action | `transitionBug` updates the Bug with required history/comment/notification side effects in the request transaction. | Required database side-effect failure rolls back the workflow action. |
| Attachment | CAP validates/authorizes the attachment model; external adapter manages binary transfer. | Provider/storage failures are sanitized; a browser-selected file is not a durable attachment until the Bug is activated/uploaded. |
| Notification creation | `writeNotificationRecord(tx, ...)` writes `Notifications` and one EMAIL `NotificationDeliveries` row in the business transaction. | A required durable outbox-row failure rolls back the related business action. |
| Email delivery | Scheduler invokes `processEmailOutbox`; eligible rows are lock-claimed, attempted, then marked `SENT` or sanitized `FAILED` with retry time. | Provider failure changes the committed delivery row only; it does not roll back an already committed Bug workflow. |
| BTP rollback | Render rollback can restore the last verified PostgreSQL platform baseline. | HANA-only business changes require explicit manual reconciliation; no automatic reverse replication is claimed. |

## Proposed Technical Implementation text

| Official EN workbook target | Candidate text for IDTS-112 integration |
| --- | --- |
| `Technical Implementation!P8` | In BTP/XSUAA production, authenticate through AppRouter/XSUAA and map the platform identity to an active `Users` profile. In custom-auth profiles only, verify the password hash, insert an `AuthSessions` token hash, and return the raw token once. |
| `Technical Implementation!P27` | Before Bug activation, validate selected attachment files in browser memory. Do not create a durable HANA/S3 record at selection time. |
| `Technical Implementation!P28` | After authorization and activation, persist CAP attachment metadata/reference and upload the binary through the configured external object-store adapter. Do not disclose storage credentials or endpoints. |
| `Technical Implementation!P29–P30` | Authorize attachment read/delete through CAP. Read returns safe content metadata; delete removes the governed attachment resource without deleting the parent Bug. |
| `Technical Implementation!P32` | During the workflow transaction, write the in-app notification and one EMAIL outbox row. The scheduler processes eligible deliveries after commit using lock/retry state; provider failure updates delivery status and never reverses the Bug workflow. |

## Source trace

| Claim | Source |
| --- | --- |
| Entity relationships, code lists, attachment composition and delivery uniqueness | `db/schema.cds` |
| Draft-enabled Bugs projection, safe delivery projection and `OutboxProcessor` action | `srv/service.cds` |
| Request hooks and scheduler action delegation | `srv/service.js` |
| Custom versus XSUAA authentication behaviour | `srv/auth.js`, `srv/auth/custom-auth.js`, `package.json` |
| Notification insertion, locking, retry and sanitized failure persistence | `srv/email/outbox.js`, `srv/email/worker.js` |
| HANA/HDI, XSUAA, scheduler and private external-service bindings | `mta.yaml`, `package.json` |
| Earlier governed BTP candidate/evidence basis | `docs/pm/evidence/idts-113/technical-spec-btp-delta-candidate.md` |

## Evidence gaps and blockers

| Status | Gap / required action |
| --- | --- |
| BLOCKED | DonHV has not personally recorded the required IDTS-105 briefing acknowledgment or Jira comment. The agent cannot do this on the member's behalf. |
| RESOLVED | The fresh worktree initially had no installed dependency tree. After `npm ci`, CAP service compilation passed with `-s all`; CAP MCP model inspection also became available. No source or lockfile was changed. |
| VERIFIED FOR GATE 1 | Fresh generated HANA artifacts match the 35-table/326-column candidate exactly: zero missing and zero extra rows. A sanitized live Database Explorer readback remains optional supporting evidence for final acceptance, not a prerequisite for logical dictionary accuracy. |
| REQUIRED BEFORE FINAL ACCEPTANCE | Capture the native Fiori attachment-picker upload/download/reload/delete evidence with approved browser permissions. |
| REQUIRED BEFORE IDTS-112 | DonHV reviews the text/dictionary, records approval in Jira and repo evidence, then hands the approved package to IDTS-112. |

No official workbook or Drive file was modified. The English-only format is
intentional because this is a candidate for the English Technical Specification;
it is not a Vietnamese SAP490 submission artifact.
