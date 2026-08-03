# IDTS-107 — Technical Specification EN database and persistence candidate refresh

> Gate status: **GATE 2 APPROVED BY DONHV at content head
> `4cca4c0bc575469810c881b1757e6eb3f519437c`; IDTS-112 integration and Drive
> synchronization remain pending.**
>
> This is a source-trace and workbook-cell proposal for the English Technical
> Specification. It does not modify the official workbook, update Drive,
> deploy a database, or run seed data. Approval evidence is recorded in
> `gate-2-approval-donhv-20260803.md`.

## Baseline and scope

| Item | Candidate value |
| --- | --- |
| Repository baseline | `origin/dev` `a24f00db67340746fd6b96276f4c5a10f36190b0` (2026-08-03) |
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
| `Technical Design!B13` | The effective production build generates 48 physical HANA tables with 578 column declarations. This total includes active IDTS tables, attachment package tables, nine draft tables, `DRAFT.DraftAdministrativeData`, two BugService helper artifacts, and CAP `cds.outbox.Messages`. The helper artifacts are current-build truth, not a design recommendation: their custom READ handlers calculate results and the missing `@cds.persistence.skip` must be handled as a separate runtime finding. |
| `Technical Design!B107` | The active BTP runtime uses CAP with SAP HANA Cloud/HDI. Attachment metadata/reference is persisted through the CAP attachment model and binary content is stored through the configured external object-store adapter. Render/PostgreSQL is retained only for controlled rollback; it does not receive HANA changes automatically. |

## Candidate data dictionary and physical-table interpretation

The complete candidate column dictionary is
[`database-dictionary.en.csv`](database-dictionary.en.csv). It contains all 48
physical HANA table artifacts and all 578 generated column declarations from a
fresh `cds build --production`. The narrower `cds compile db --to hana` command
produces only the direct database-model subset (35 tables/326 columns) and is
therefore not a valid production inventory. The generated files were written
only to ignored temporary output; this is production-build proof, not a claim
that an HDI deployment or live HANA readback was performed.

| Generated-artifact verification | Result |
| --- | --- |
| CAP service compile | PASS: `npx cds compile srv --to edmx -s all` |
| Effective build command | `npx cds build --production --dest .tmp/idts107-fresh-build-20260803` |
| HANA artifact generation | PASS: 48 `.hdbtable` artifacts |
| Generated columns | 578 |
| Candidate dictionary rows | 578 |
| Missing candidate rows | 0 |
| Extra candidate rows | 0 |
| CDS source blob | `069266f785947c2f921afde75d24fa728faed4ea` |

| Logical area | CDS truth | HANA/persistence interpretation |
| --- | --- | --- |
| Code lists | 15 entities inherit `CodeList`. | Stable `code` keys control business/status/channel/action values; `active` preserves historical values without allowing new selection. |
| Identity and session | `Users` is the business profile; `AuthSessions` has `tokenHash`, issue/expiry/revocation/use timestamps. | XSUAA production does not create custom sessions. A custom-profile login reads an active user and writes only a token hash. |
| Classification and assignment | `DeveloperProfiles`, SAP module/component/category bridges, and `DeveloperResponsibilities`. | `Bugs` stores the selected component/category and validated component category; the handler, not Fiori alone, enforces consistency and assignment suitability. |
| Bug aggregate and drafts | `Bugs` is a `cuid, managed` aggregate with a draft-enabled service projection. | The production build contains nine `BugService.*_drafts` tables plus `DRAFT.DraftAdministrativeData`; these are distinct from active business tables and are included in the 48/578 dictionary. |
| Attachments | `Bugs.attachments` composes `BugAttachments` from `@cap-js/attachments`. | Metadata/reference stays in CAP persistence. The production adapter stores binary objects externally; no credential or object-store endpoint belongs in the workbook. |
| Audit/history | `HistoryEvents` groups one business action; `HistoryLogs` is field-level and append-only by behaviour. | Required history is written with the business action. Exact workflow action codes remain distinct from legacy audit categories. |
| Notification/outbox | `Notifications` composes custom `NotificationDeliveries`; unique `(notification, channel)` prevents duplicate channel rows. | The custom email delivery table is distinct from CAP framework table `cds.outbox.Messages`. The active custom table has 22 columns; its safe draft projection has 20 and intentionally omits provider-sensitive fields. |
| Calculated service helpers | `AssignableDevelopers` and `DeveloperWorkloads` are served by custom READ handlers. | The current production build nevertheless creates physical helper tables because `@cds.persistence.skip` is absent. The dictionary records current truth; whether to suppress those artifacts is a separate runtime decision/PR. |
| Duplicate/AI | `DuplicateLinks` records only human-confirmed relations; `AiSuggestions` stores normalized review/audit data. | AI candidates do not silently change Bug state, assignment, or duplicate links. |

## Transaction, failure, and rollback proposal

| Flow | Commit boundary | Failure rule |
| --- | --- | --- |
| Custom authentication | `cds.tx(req)` reads `Users` and inserts `AuthSessions`. | Invalid credentials return a safe denial; the raw token is returned once and is not persisted. |
| Draft activation / active create-update | CAP request transaction validates before activating/persisting the Bug. | Validation, authorization, or required persistence failure prevents partial business state. |
| Workflow action | `transitionBug` updates the Bug with required history/comment/notification side effects in the request transaction. | Required database side-effect failure rolls back the workflow action. |
| Attachment on a new Bug | Browser validates the file and keeps the `File` object in memory under the new draft ID. After the Bug is saved, UI creates/opens an edit draft, POSTs attachment metadata, PUTs binary content, and activates the draft. | Selection alone creates no durable row. HANA contains attachment metadata and a generated `content BLOB` column; the configured production adapter stores binary content in S3. Upload/activation failure is reported safely and must not be presented as success. |
| Attachment on a saved Bug | UI opens an edit draft, POSTs metadata, PUTs binary content, then activates the draft. | CAP authorization and attachment hooks govern the request. Delete removes the governed attachment, not the parent Bug. |
| Notification creation | `writeNotificationRecord(tx, ...)` writes `Notifications` and one EMAIL `NotificationDeliveries` row in the business transaction. | A required durable outbox-row failure rolls back the related business action. |
| Email delivery | Scheduler invokes `processEmailOutbox`; eligible custom `NotificationDeliveries` rows are claimed optimistically with `lockToken`/`lockedUntil`, attempted, then marked `SENT` or sanitized `FAILED` with exponential retry time. | Provider failure changes the committed delivery row only; it does not roll back an already committed Bug workflow. External delivery is at-least-once: a provider send could be duplicated if send succeeds but the subsequent status update fails. |
| BTP rollback | Render rollback can restore the last verified PostgreSQL platform baseline. | HANA-only business changes require explicit manual reconciliation; no automatic reverse replication is claimed. |

## Proposed Technical Implementation text

| Official EN workbook target | Candidate text for IDTS-112 integration |
| --- | --- |
| `Technical Implementation!P8` | In BTP/XSUAA production, authenticate through AppRouter/XSUAA and map the platform identity to an active `Users` profile. In custom-auth profiles only, verify the password hash, insert an `AuthSessions` token hash, and return the raw token once. |
| `Technical Implementation!P27` | Before Bug activation, validate selected attachment files in browser memory. Do not create a durable HANA/S3 record at selection time. |
| `Technical Implementation!P28` | After the Bug exists, create/open its edit draft, POST attachment metadata, PUT binary content, and activate the draft. HANA contains the generated attachment metadata/stream columns, while the configured production adapter governs S3 storage. Do not disclose storage credentials or endpoints. |
| `Technical Implementation!P29–P30` | Authorize attachment read/delete through CAP. Read returns safe content metadata; delete removes the governed attachment resource without deleting the parent Bug. |
| `Technical Implementation!P32` | During the workflow transaction, write the in-app notification and one EMAIL outbox row. The scheduler processes eligible deliveries after commit using lock/retry state; provider failure updates delivery status and never reverses the Bug workflow. |

## Source trace

| Claim | Source |
| --- | --- |
| Entity relationships, code lists, attachment composition and delivery uniqueness | `db/schema.cds` |
| Draft-enabled Bugs projection, safe delivery projection and `OutboxProcessor` action | `srv/service.cds` |
| New-Bug in-memory attachment queue and saved-Bug POST/PUT/activation chain | `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js` |
| Attachment authorization and CAP write hooks | `srv/bug-service/content.js`, `@cap-js/attachments` |
| Workflow transaction, history and notification side effects | `srv/bug-service/actions.js`, `srv/bug-service/history.js` |
| Request hooks and scheduler action delegation | `srv/service.js` |
| Custom versus XSUAA authentication behaviour | `srv/auth.js`, `srv/auth/custom-auth.js`, `package.json` |
| Notification insertion, locking, retry and sanitized failure persistence | `srv/email/outbox.js`, `srv/email/worker.js` |
| HANA/HDI, XSUAA, scheduler and private external-service bindings | `mta.yaml`, `package.json` |
| Earlier governed BTP candidate/evidence basis | `docs/pm/evidence/idts-113/technical-spec-btp-delta-candidate.md` |

## Evidence gaps and blockers

| Status | Gap / required action |
| --- | --- |
| RESOLVED | DonHV personally recorded the IDTS-105 acknowledgment at merge SHA `3e78b495cb8feb56188cc446b827d47e040e1b98`; Jira comment `10866` and the repo acknowledgment register contain the matching statement. |
| RESOLVED | The fresh worktree initially had no installed dependency tree. After `npm ci`, CAP service compilation passed with `-s all`; CAP MCP model inspection also became available. No source or lockfile was changed. |
| VERIFIED FOR GATE 1 | Fresh production-style generated HANA artifacts match the 48-table/578-column candidate exactly: zero missing and zero extra rows. The earlier 35/326 candidate was rejected as a narrow-model inventory. |
| RUNTIME FINDING — [IDTS-118](https://dutassociation.atlassian.net/browse/IDTS-118) | `AssignableDevelopers` and `DeveloperWorkloads` are calculated by custom READ handlers but currently generate physical tables. IDTS-118 owns the separate CAP-supported persistence decision and safe migration analysis; this documentation PR must not mutate CDS/runtime. |
| RESOLVED FOR GATE 2 REVIEW | Cloud Foundry task `idts107-hana-metadata-20260803` read sanitized live HANA metadata and matched the generated dictionary at 48 tables/578 columns. See `hana-production-readback-20260803.md`. A Database Explorer screenshot may be added as visual supporting evidence but is no longer the sole proof. |
| REQUIRED BEFORE FINAL ACCEPTANCE | Capture the native Fiori attachment-picker upload/download/reload/delete evidence with approved browser permissions. |
| APPROVED FOR IDTS-112 | DonHV approved Gate 2 at content head `4cca4c0bc575469810c881b1757e6eb3f519437c`. Jira and repository approval evidence hand the package to IDTS-112; official workbook/template/Drive acceptance remains downstream. |

No official workbook or Drive file was modified. The English-only format is
intentional because this is a candidate for the English Technical Specification;
it is not a Vietnamese SAP490 submission artifact.
