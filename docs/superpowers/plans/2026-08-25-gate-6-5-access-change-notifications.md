# Gate 6.5 Access Change Notification Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send safe, idempotent email after an actual role change, suspension, reactivation, or revocation completes, while retaining one email worker/provider/retry pipeline and one User Administration Delivery screen.

**Architecture:** Add one domain-owned `UserAccessNotificationDeliveries` outbox keyed uniquely by its final `UserIdentityAuditEvents` row. Bug, invitation, and access delivery storage remain separate, while the existing sender, provider configuration, scheduler action, post-commit kick, retry/backoff, sanitizer, and readiness surface are reused. Operations normalizes invitation and access-change rows into one allowlisted DTO without exposing raw recipient/body/provider/lock/audit identifiers.

**Tech Stack:** SAP CAP Node.js, CDS/HANA additive schema, transactional outbox, Brevo/SMTP sender abstraction, SAP Job Scheduling/immediate kick, SAPUI5 Operations UI.

**Spec:** `docs/superpowers/specs/2026-08-25-user-administration-ux-workload-navigation-design.md`

## Global Constraints

- Frozen planning base: clean `origin/dev` `5a12a7d3b1b32a4def1514daa809352bd22c1013`.
- Implementation branch: `feature/wp8-user-access-notification-delivery-donhv`, created from a fresh `origin/dev` readback after this planning package merges.
- Add exactly one persistence entity and compiler-required additive HANA artifacts. Do not remove/change existing generated artifacts; add no `.hdbtabledata`, seed row, dependency, provider binding, scheduler, queue, credential, or endpoint.
- Create a delivery only from a final allowlisted access audit with `result === 'APPLIED'`. `NOOP_ALREADY_DESIRED`, queued, pending, failure, conflict, ambiguous, PROVISION, LINK_EXISTING, and Developer profile/responsibility audit rows create zero access deliveries.
- Store only delivery snapshots required to send and retry. Never expose or log raw recipient email, bodies, provider message ID, source audit ID, lock/lease value, identity tuple/hash, Role Collection inventory, token, credential, endpoint, or provider response.
- UI changes advance only User Administration cache identity `1.0.16 -> 1.0.17` across package, lockfile root/top, and manifest. Bug Management remains unchanged.
- Source gate stops at one Draft PR after one bounded independent exact-head review reports zero Critical/Major/Important findings. HDI simulation, HANA migration, deployment, real email send, provider/user/role/data mutation, Ready, merge, and cleanup require later explicit boundaries.
- Ponytail: reuse the current `retryDelayMs`, `sanitizeTransportError`, sender, worker, scheduler, Operations table, and DTO patterns. Do not add `delivery-policy.js`, a second worker, a new intent entity, a generic outbox framework, or a system-wide Bug/User Administration delivery console.

## File and Ownership Map

| Unit | Files | Owner |
| --- | --- | --- |
| Persistence contract | `db/schema.cds`, focused QA, `package.json` | Coordinator |
| Access writer/template/processor | new `srv/user-admin/access-delivery.js`, `srv/email/outbox.js`, focused tests | Luna implementation; coordinator exact-diff review |
| Completion boundary | `srv/user-admin.js`, `srv/user-admin/access-lifecycle.js`, `srv/provisioning-broker.js` | Coordinator |
| Shared worker | `srv/email/worker.js`, immediate/outbox tests | Coordinator |
| Operations backend | `srv/user-admin.cds`, `srv/user-admin/operations-audit.js`, operations tests | Coordinator |
| Operations UI/cache identity | User Administration controller/view/i18n/package/lock/manifest and UI tests | Luna after DTO freeze; coordinator exact-diff review |
| Mirrors/evidence/release gates | matching `docs/knowledge/**`, PM evidence/status/roadmap, rollout plan | Coordinator |

Luna never changes schema authorization/completion semantics, never deploys or sends email, and never pushes/merges without coordinator review. The coordinator owns task boundaries, final audit-to-delivery mapping, security/privacy review, HANA artifact comparison, exact-head review, PR, and every later mutation decision.

---

### Task 1: Add the additive outbox contract with RED-first model coverage

**Files:**
- Modify: `db/schema.cds`
- Create: `scripts/qa/test-user-access-notifications.js`
- Modify: `package.json`

**Interfaces:**
- Produces persistence entity `idts.cap.UserAccessNotificationDeliveries`.
- Produces unique business key `sourceAuditEvent`.
- Reuses existing `NotificationDeliveryStatuses`; no new seed values.

- [ ] **Step 1: Write RED model assertions**

Require this exact entity shape and prove the two existing delivery entities remain unchanged:

```cds
entity UserAccessNotificationDeliveries : cuid, managed {
  sourceAuditEvent    : Association to UserIdentityAuditEvents not null;
  targetUser          : Association to Users not null;
  recipientEmail      : String(255) not null;
  eventType           : String(40) not null;
  templateKey         : String(80) not null;
  subject             : String(255) not null;
  textBody            : LargeString not null;
  htmlBody            : LargeString not null;
  status              : Association to NotificationDeliveryStatuses not null;
  attemptCount        : Integer default 0 not null;
  nextAttemptAt       : Timestamp;
  lastAttemptAt       : Timestamp;
  sentAt              : Timestamp;
  lastErrorCode       : String(80);
  lastErrorSummary    : String(500);
  providerMessageId   : String(255);
  lockedUntil         : Timestamp;
  lockToken           : String(64);
}

annotate UserAccessNotificationDeliveries
  with @assert.unique.accessAuditDelivery: [ sourceAuditEvent ];
```

- [ ] **Step 2: Add and run the focused script**

```json
"qa:user-access-notifications:programmatic": "node scripts/qa/test-user-access-notifications.js"
```

```powershell
npm run qa:user-access-notifications:programmatic
```

Expected RED: entity/unique contract missing; pre-existing model assertions remain green.

- [ ] **Step 3: Add only the entity and unique annotation**

Do not add a public projection, CSV, value list, hand-written HANA index, or modification to either existing delivery table.

- [ ] **Step 4: Verify GREEN and CAP compilation**

```powershell
npm run qa:user-access-notifications:programmatic
npx cds compile db/schema.cds --to hana
npx cds compile srv -s all --to edmx
```

Expected: focused PASS; compiles exit 0 with only the known attachment vocabulary warning.

- [ ] **Step 5: Commit**

```powershell
git add db/schema.cds scripts/qa/test-user-access-notifications.js package.json
git commit -m "feat: add access notification delivery outbox"
```

### Task 2: Implement one access writer/template/processor using existing email policy

**Files:**
- Create: `srv/user-admin/access-delivery.js`
- Modify: `srv/email/outbox.js`
- Modify: `srv/user-admin/delivery.js`
- Modify: `scripts/qa/test-user-access-notifications.js`
- Modify: `scripts/qa/test-email-outbox-programmatic.js`
- Modify: `scripts/qa/test-user-onboarding-programmatic.js`

**Interfaces:**
- Produces:

```js
buildAccessDeliveryMessage({
  eventType,
  effectiveRole,
  effectiveAccessState,
  completedAt
}, emailConfig) // => { subject, text, html }

writeUserAccessDelivery({
  tx,
  auditEvent,
  targetUserID,
  eventType,
  effectiveRole,
  effectiveAccessState,
  completedAt,
  emailConfig
}) // => { deliveryID, deliveryStatus, created }

processUserAccessDeliveries({
  tx,
  config,
  sendMail,
  now,
  workerID
}) // => { sent, failed, skipped }
```

- Consumes only:

```js
const ACCESS_EVENT_BY_ACTION = Object.freeze({
  CHANGE_ROLE: 'ACCESS_ROLE_CHANGED',
  SUSPEND: 'ACCESS_SUSPENDED',
  REACTIVATE: 'ACCESS_REACTIVATED',
  REVOKE: 'ACCESS_REVOKED'
})
```

- [ ] **Step 1: Write RED writer/template tests**

Cover four event mappings, APPLIED plus exact-action requirement, `NOOP_ALREADY_DESIRED` no-row, Developer administration no-row, duplicate audit NOOP, inactive suspend/revoke target, invalid/missing email/config `SKIPPED`, HTML escaping, and absence of raw reason/provider/identity/Role Collection fields.

- [ ] **Step 2: Reuse existing policy without a new module**

Export existing private `formatFrom` from `srv/email/outbox.js`. Import it with `retryDelayMs` and `sanitizeTransportError` in invitation/access processors; delete only the duplicated invitation `formatFrom`. Preserve current outputs/backoff/error summaries.

- [ ] **Step 3: Implement the allowlisted snapshot**

Read `Users.ID,email` without requiring `active=true`. Build the absolute safe application link only from validated private `emailConfig.baseUrl` plus `/idtsbugmanagementui/index.html`. Escape every dynamic HTML value. Insert `PENDING` only when config and recipient are ready; otherwise `SKIPPED`. Never call the provider from the writer.

- [ ] **Step 4: Implement claim/send/update**

Reuse batch size, max attempts, due predicate, conditional lock, lock expiry, retry delay, sanitizer, and `SENT/FAILED` updates. Use `X-IDTS-Access-Delivery-ID`; never log recipient, body, provider response, or source audit ID.

- [ ] **Step 5: Run regression**

```powershell
npm run qa:user-access-notifications:programmatic
npm run qa:email-outbox:programmatic
npm run qa:user-onboarding:programmatic
```

- [ ] **Step 6: Commit**

```powershell
git add srv/user-admin/access-delivery.js srv/email/outbox.js srv/user-admin/delivery.js scripts/qa
git commit -m "feat: write and process safe access deliveries"
```

### Task 3: Create delivery only at the final access-completion boundary

**Files:**
- Modify: `srv/user-admin.js`
- Modify: `srv/user-admin/access-lifecycle.js`
- Modify: `srv/provisioning-broker.js`
- Modify: relevant access notification/provisioning/broker/lifecycle tests

**Interfaces:**
- Consumes Task 2 writer.
- Final audit helper returns:

```js
{ ID, operationID, requestID, actorID, targetUserID, action, result,
  fromState, toState, correlationId, completedAt }
```

- [ ] **Step 1: Write RED completion tests**

Require one row for local `SUSPEND/APPLIED` and provider `CHANGE_ROLE/APPLIED`, `REACTIVATE/APPLIED`, `REVOKE/APPLIED`. Require zero for queue audits, PROVISION, LINK_EXISTING, NOOP, failure/conflict/ambiguous/expired lease/duplicate callback and profile/responsibility audit actions.

- [ ] **Step 2: Return IDs from final audit helpers**

Allocate UUID before insert and return the exact inserted allowlisted audit object. Queue helper `insertIdentityAudit` keeps its `QUEUED` default.

- [ ] **Step 3: Add a separate final suspend audit**

After deactivation, session revocation, and optimistic request update succeed, append `SUSPEND/APPLIED` in the same transaction. Retain `REQUEST_SUSPEND/QUEUED` history. Write against only the final audit ID.

- [ ] **Step 4: Attach provider-backed delivery**

`appendAudit` returns its event. `completeSuccess` writes only for CHANGE_ROLE/REACTIVATE/REVOKE when `resultCode === 'APPLIED'`; NOOP creates none. Derive effective role/state from final persisted values.

- [ ] **Step 5: Register post-commit kick once**

If status is PENDING, use existing `scheduleImmediateEmailOutbox(req)`. Provider never runs in the business transaction; unique source audit remains duplicate defense.

- [ ] **Step 6: Run regressions**

```powershell
npm run qa:user-access-notifications:programmatic
npm run qa:user-access:programmatic
npm run qa:user-access-broker:programmatic
npm run qa:user-admin-access-lifecycle:programmatic
```

- [ ] **Step 7: Commit**

```powershell
git add srv/user-admin.js srv/user-admin/access-lifecycle.js srv/provisioning-broker.js scripts/qa
git commit -m "feat: queue email after applied access change"
```

### Task 4: Add access processing to the existing worker only

**Files:**
- Modify: `srv/email/worker.js`
- Modify: `scripts/qa/test-email-immediate-kick.js`
- Modify: `scripts/qa/test-user-access-notifications.js`

**Interfaces:** Preserves `processEmailOutboxBatch({ tx, dependencies }) => { sent, failed, skipped }`.

- [ ] **Step 1: Write RED orchestration tests**

One batch creates one sender, calls Bug/invitation/access once, aggregates all results, and closes once on success/failure. Missing invitation config skips invitations but not Bug/access.

- [ ] **Step 2: Add one injected processor**

```js
const processAccess = dependencies.processAccess || processUserAccessDeliveries
```

Call with the same `tx`, `config`, and `sendMail` before one close. Add no timer, scheduler action, sender, provider reader, or credential path.

- [ ] **Step 3: Run regression**

```powershell
npm run qa:user-access-notifications:programmatic
npm run qa:email-immediate:programmatic
npm run qa:email-outbox:programmatic
npm run qa:user-onboarding:programmatic
```

- [ ] **Step 4: Commit**

```powershell
git add srv/email/worker.js scripts/qa/test-email-immediate-kick.js scripts/qa/test-user-access-notifications.js
git commit -m "feat: process access delivery in shared worker"
```

### Task 5: Normalize invitation and access deliveries in Operations

**Files:**
- Modify: `srv/user-admin.cds`
- Modify: `srv/user-admin/operations-audit.js`
- Modify: `srv/user-admin.js`
- Modify: operations/access-notification tests

**Interfaces:**

```cds
type AdministrationDeliverySummary {
  deliveryID       : UUID;
  deliveryType     : String(30);
  eventType        : String(40);
  recipientDisplay : String(255);
  status           : String(40);
  attemptCount     : Integer;
  nextAttemptAt    : Timestamp;
  lastAttemptAt    : Timestamp;
  sentAt           : Timestamp;
  errorCode        : String(80);
  errorSummary     : String(500);
  canRetry         : Boolean;
  modifiedAt       : Timestamp;
}
```

Produces `searchAdministrationDeliveries(deliveryType,status,query,skip,top)` and `retryUserAccessDelivery(deliveryID,expectedModifiedAt)`; retains legacy invitation actions.

- [ ] **Step 1: Write RED backend tests**

Cover authorization-before-read, filters, masking, forbidden fields, stable mixed ordering, paging boundaries, retry guards/audit, wrong-type rejection, and SENT precedence across both tables.

- [ ] **Step 2: Implement bounded combined search**

Concrete type queries only its table. ALL clamps top to 100 and skip to 10,000, reads at most `skip + top` newest rows from each table, normalizes, merge-sorts by `createdAt desc, ID desc`, then slices. Never use unbounded reads or client predicates directly.

- [ ] **Step 3: Implement access retry**

Require FAILED, transient allowlist, attempt budget, no active lock and exact modifiedAt. Reset safe retry fields, append `RETRY_ACCESS_DELIVERY/QUEUED`, and use the existing post-commit kick. Completion audit/message snapshot stay immutable.

- [ ] **Step 4: Extend readiness**

Read 25 newest rows from each User Administration delivery table and preserve seven-day semantics: SENT => AVAILABLE; otherwise FAILED => UNAVAILABLE; other/no conclusive => UNKNOWN.

- [ ] **Step 5: Run tests and commit**

```powershell
npm run qa:user-admin-operations:programmatic
npm run qa:user-access-notifications:programmatic
git add srv/user-admin.cds srv/user-admin/operations-audit.js srv/user-admin.js scripts/qa
git commit -m "feat: unify administration delivery operations"
```

### Task 6: Add one UI filter/details flow and advance cache identity

**Files:**
- Modify: User Administration controller, main view, base/en/vi i18n, package, lockfile, manifest
- Modify: UI and Operations QA contracts

**Interfaces:** Consumes Task 5 DTO/actions; UI types are ALL, INVITATION, ACCESS_CHANGE; preserves one table/dialog.

- [ ] **Step 1: Write RED UI contract**

Require one Type filter, normalized rows, friendly type/event labels, masked recipient, one details action, retry dispatch by type, no new Delivery tab, and no raw provider/audit/body/lock field.

- [ ] **Step 2: Switch only the Delivery loader**

Call `searchAdministrationDeliveries`; preserve busy/error/refresh/load-more/list state. Dispatch access retry separately while retaining invitation retry.

- [ ] **Step 3: Add equal localized keys**

Add All types, Invitation, Access change, Role changed, Suspended, Reactivated, Revoked, and safe empty-detail copy to base/en/vi. Use native UI5; no CSS/new dialog.

- [ ] **Step 4: Advance version only**

Set package, lockfile top/root, and manifest `1.0.17`. Assert semantic JSON parity for dependency/non-version fields. Bug UI remains `0.0.6`.

- [ ] **Step 5: Run tests/build and commit**

```powershell
npm run qa:user-admin-ui:programmatic
npm run qa:user-admin-operations:programmatic
npm run lint --prefix app/user-administration-ui
npm run build --prefix app/user-administration-ui
git add app/user-administration-ui scripts/qa
git commit -m "feat: show access changes in delivery operations"
```

### Task 7: Complete mirrors, additive proof, review, and one Draft PR

**Files:**
- Create/modify exact bilingual `docs/knowledge/**` mirrors for every changed source
- Create Gate 6.5 source evidence and later rollout plan
- Modify roadmap and DonHV status

- [ ] **Step 1: Run `officecli --version` and mirror every changed source**

Record the Markdown limitation; mirror schema, access delivery, outbox export, completion hooks, worker, Operations DTO/UI/i18n/version metadata.

- [ ] **Step 2: Prove additive HANA output**

Compile baseline/candidate into unique temp directories outside repo; compare normalized paths and SHA-256. Require zero removed/changed existing artifacts and zero hdbtabledata/CSV/seed/procedure/unrelated table/view. Record compiler-produced new artifacts; do not execute HDI.

- [ ] **Step 3: Run final matrix**

```powershell
npm run qa:user-access-notifications:programmatic
npm run qa:user-admin-operations:programmatic
npm run qa:user-admin-ui:programmatic
npm run qa:user-access:programmatic
npm run qa:user-access-broker:programmatic
npm run qa:user-admin-access-lifecycle:programmatic
npm run qa:email-immediate:programmatic
npm run qa:email-outbox:programmatic
npm run qa:user-onboarding:programmatic
npm run qa:secret-scan
npm run qa:agent-rules
npm run qa:depth:self-test
npx cds compile srv -s all --to edmx
npx cds compile db/schema.cds --to hana
npm run lint --prefix app/user-administration-ui
npm run build --prefix app/user-administration-ui
git diff --check origin/dev...HEAD
```

- [ ] **Step 4: Run one bounded independent exact-head review**

Review schema additivity, completion timing, APPLIED/action allowlist, idempotency, retry/lock, masking, authorization, worker reuse, version parity and prohibited scope. Any Critical/Major/Important blocks push/PR until TDD remediation and fresh exact-head re-review.

- [ ] **Step 5: Write later rollout gates**

Separate: source review/merge; encrypted backup plus HANA simulation/restore proof; one additive migration; selective CAP/UI deploy; controlled APPLIED acceptance for eligible types; combined Operations acceptance; final readiness/rollback. Never backfill/email historical audit events.

- [ ] **Step 6: Commit, push, create one Draft PR, stop**

```powershell
git add docs
git commit -m "docs: record Gate 6.5 source evidence"
git push -u origin feature/wp8-user-access-notification-delivery-donhv
```

Create exactly one Draft PR with QA-depth and exact CI readback. Do not Ready/merge/simulate/migrate/deploy/send/mutate real user/role/data/provider or clean the implementation worktree.

## Baseline Evidence Before Implementation

At `5a12a7d3b1b32a4def1514daa809352bd22c1013`, Operations, access provisioning, broker, lifecycle, immediate email kick, Bug outbox, onboarding, secret scan, agent rules 8/8 and QA-depth 15/15 all pass. This is regression evidence, not a claim that Gate 6.5 exists.
