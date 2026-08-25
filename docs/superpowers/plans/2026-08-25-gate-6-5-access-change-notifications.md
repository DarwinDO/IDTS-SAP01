# Gate 6.5 Access Change Notification Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Send safe, idempotent email after role change, suspend, reactivate or revoke completes, while keeping one email worker/provider/retry pipeline and one User Administration Delivery screen.

**Architecture:** Add UserAccessNotificationDeliveries keyed uniquely by the source UserIdentityAuditEvent. Bug, invitation and access-change delivery storage remain domain-specific, but the existing worker entrypoint, sender/provider configuration, retry/error policy and readiness are shared. Operations normalizes Invitation and Access Change rows into one safe table.

**Tech Stack:** SAP CAP Node.js, CDS/HANA additive schema, transactional outbox, Brevo/SMTP sender abstraction, SAP Job Scheduling/immediate kick, SAPUI5 Operations UI.

**Spec:** docs/superpowers/specs/2026-08-25-user-administration-ux-workload-navigation-design.md

## Global Constraints

- Start from merged Gate 6.4 origin/dev on branch feature/wp8-user-access-notification-delivery-donhv.
- Schema change is additive only: one table and its unique/index artifacts; no existing table/column/constraint removal, no hdbtabledata and no seed.
- One scheduler, sender, provider config, credential, worker entrypoint and readiness surface. No Redis, Kafka, RabbitMQ, BullMQ or new provider binding.
- Success email is created only with APPLIED final audit state; queued/pending/failure does not create success delivery.
- Responsibility-only updates never create access email.
- No raw provider/identity/token/endpoint/Role Collection data in table, email, UI, logs or evidence.
- Source gate stops at one Draft PR. HDI simulation, HANA migration, deployment and real email acceptance each require separate approval.

---

### Task 1: Define schema and idempotency RED contract

**Files:**
- Modify: db/schema.cds
- Create: scripts/qa/test-user-access-notifications.js
- Modify: package.json

**Interfaces:**
- Produces entity idts.cap.UserAccessNotificationDeliveries.
- Unique source: sourceAuditEvent.

- [ ] Add a RED source/model test requiring:

~~~cds
entity UserAccessNotificationDeliveries : cuid, managed {
  sourceAuditEvent : Association to UserIdentityAuditEvents not null;
  targetUser       : Association to Users not null;
  recipientEmail  : String(255) not null;
  eventType       : String(40) not null;
  templateKey     : String(80) not null;
  subject         : String(255) not null;
  textBody        : LargeString not null;
  htmlBody        : LargeString not null;
  status          : Association to NotificationDeliveryStatuses not null;
  attemptCount    : Integer default 0 not null;
  nextAttemptAt   : Timestamp;
  lastAttemptAt   : Timestamp;
  sentAt          : Timestamp;
  lastErrorCode   : String(80);
  lastErrorSummary: String(500);
  providerMessageId : String(255);
  lockedUntil     : Timestamp;
  lockToken       : String(64);
}
~~~

- [ ] Require @assert.unique.accessAuditDelivery: [ sourceAuditEvent ].
- [ ] Require eventType allowlist ACCESS_ROLE_CHANGED, ACCESS_SUSPENDED, ACCESS_REACTIVATED and ACCESS_REVOKED in the writer, not a client field.
- [ ] Add package script qa:user-access-notifications:programmatic.
- [ ] Run it. Expected: FAIL because the entity/writer does not exist.
- [ ] Add the entity/unique annotation exactly as above; do not change Notifications, NotificationDeliveries or UserOnboardingDeliveries.
- [ ] Compile:

~~~powershell
npx cds compile db/schema.cds --to hana
~~~

Expected: exit 0 with only pre-existing warnings.

- [ ] Commit:

~~~powershell
git add db/schema.cds scripts/qa/test-user-access-notifications.js package.json
git commit -m "feat: add access notification delivery outbox"
~~~

### Task 2: Build the safe access email writer and template

**Files:**
- Create: srv/email/access-template.js
- Create: srv/user-admin/access-delivery.js
- Create: srv/email/delivery-policy.js
- Modify: srv/email/outbox.js
- Modify: srv/user-admin/delivery.js
- Modify: scripts/qa/test-user-access-notifications.js
- Modify: scripts/qa/test-email-outbox-programmatic.js
- Modify: scripts/qa/test-user-onboarding-programmatic.js

**Interfaces:**
- Produces buildAccessEmailMessage(input, config).
- Produces writeUserAccessDelivery(tx, event, config).
- Produces shared retryDelayMs, sanitizeTransportError and formatFrom without changing outputs.

- [ ] Move only retryDelayMs, sanitizeTransportError and safe formatFrom to delivery-policy.js; import them from Bug, invitation and access processors. Preserve current error codes/backoff exactly.
- [ ] Implement buildAccessEmailMessage from allowlisted values: recipientEmail, eventType, effectiveRole, effectiveAccessState, completedAt and normalized Bug Management root link. Escape all dynamic HTML.
- [ ] Implement writeUserAccessDelivery:
  - reject missing/non-APPLIED audit event or eventType outside the four-value allowlist;
  - read target Users.ID/email but do not require active=true so revoke/suspend mail can be sent;
  - create subject/text/html snapshot;
  - insert PENDING or SKIPPED using existing email config readiness;
  - return existing row as NOOP if the source audit unique row already exists;
  - never call provider.
- [ ] Test HTML escaping, safe link, disabled/config-missing/invalid-email SKIPPED, duplicate audit idempotency, inactive target, and no raw reason/provider fields.
- [ ] Run:

~~~powershell
npm run qa:user-access-notifications:programmatic
npm run qa:email-outbox:programmatic
npm run qa:user-onboarding:programmatic
~~~

Expected: all exit 0 with unchanged Bug/invitation behavior.

- [ ] Commit:

~~~powershell
git add srv/email srv/user-admin/access-delivery.js scripts/qa package.json
git commit -m "feat: write safe access notification deliveries"
~~~

### Task 3: Attach delivery creation to final access audit events

**Files:**
- Modify: srv/user-admin.js
- Modify: srv/user-admin/access-lifecycle.js
- Modify: srv/provisioning-broker.js
- Modify: srv/user-admin/access-delivery.js
- Modify: scripts/qa/test-user-access-notifications.js
- Modify: scripts/qa/test-user-access-provisioning-contract.js
- Modify: scripts/qa/test-user-admin-access-lifecycle.js

**Interfaces:**
- Consumes final APPLIED UserIdentityAuditEvents.
- Produces at most one access delivery and one post-commit worker kick per request.

- [ ] Make the audit insert helpers return the inserted audit event ID without changing existing audit fields.
- [ ] For local suspend, append a final action SUSPEND/result APPLIED after Users.active=false, session revocation and SUSPENDED request update; write ACCESS_SUSPENDED delivery in the same transaction.
- [ ] For broker final APPLIED completion:
  - CHANGE_ROLE => ACCESS_ROLE_CHANGED;
  - REACTIVATE => ACCESS_REACTIVATED;
  - REVOKE => ACCESS_REVOKED;
  - PROVISION and LINK_EXISTING => no access-change delivery.
- [ ] Call writeUserAccessDelivery in the same transaction as final audit. Register scheduleImmediateEmailOutbox only when delivery status is PENDING; scheduling remains post-commit.
- [ ] Prove retry/reconcile/expired lease and duplicate broker callback reuse the same final audit or hit the unique constraint and do not create a second delivery.
- [ ] Prove queued, retryable failure, permanent failure, ambiguous result and responsibility-only update create zero rows.
- [ ] Run:

~~~powershell
npm run qa:user-access-notifications:programmatic
npm run qa:user-access:programmatic
npm run qa:user-access-broker:programmatic
npm run qa:user-admin-access-lifecycle:programmatic
~~~

Expected: all exit 0.

- [ ] Commit:

~~~powershell
git add srv/user-admin.js srv/user-admin/access-lifecycle.js srv/provisioning-broker.js srv/user-admin/access-delivery.js scripts/qa
git commit -m "feat: queue email after verified access completion"
~~~

### Task 4: Process access deliveries through the existing worker

**Files:**
- Modify: srv/user-admin/access-delivery.js
- Modify: srv/email/worker.js
- Modify: scripts/qa/test-user-access-notifications.js
- Modify: scripts/qa/test-email-immediate-kick.js

**Interfaces:**
- Produces processUserAccessDeliveries({ tx, config, sendMail, now, workerID }).
- Extends processEmailOutboxBatch aggregate result without new worker/scheduler.

- [ ] Implement claim/send/update using the same batch size, attempt budget, due time, lock expiry, retry policy and sanitized errors as existing deliveries.
- [ ] Add processAccess dependency to processEmailOutboxBatch and call it with the same sendMail function before sender.close().
- [ ] Aggregate sent/failed/skipped across notification, invitation and access results.
- [ ] Do not instantiate another sender, timer, scheduler action or credential reader.
- [ ] Test one worker call invokes all three processors once, closes sender once, handles access success/failure/retry, and never logs recipient/body/provider response.
- [ ] Run:

~~~powershell
npm run qa:user-access-notifications:programmatic
npm run qa:email-immediate:programmatic
npm run qa:email-outbox:programmatic
npm run qa:user-onboarding:programmatic
~~~

Expected: all exit 0.

- [ ] Commit:

~~~powershell
git add srv/email/worker.js srv/user-admin/access-delivery.js scripts/qa
git commit -m "feat: process access email in shared worker"
~~~

### Task 5: Unify Invitation and Access delivery in Operations

**Files:**
- Modify: srv/user-admin.cds
- Modify: srv/user-admin/operations-audit.js
- Modify: srv/user-admin.js
- Modify: app/user-administration-ui/webapp/controller/Main.controller.js
- Modify: app/user-administration-ui/webapp/view/Main.view.xml
- Modify: app/user-administration-ui/webapp/i18n/i18n.properties
- Modify: app/user-administration-ui/webapp/i18n/i18n_en.properties
- Modify: app/user-administration-ui/webapp/i18n/i18n_vi.properties
- Modify: scripts/qa/test-user-admin-operations-audit.js
- Modify: scripts/qa/test-user-admin-ui.js

**Interfaces:**
- Produces AdministrationDeliverySummary with deliveryType and eventType.
- Produces searchAdministrationDeliveries(deliveryType, status, query, skip, top).
- Retains searchOnboardingDeliveries for compatibility until no consumer remains.

- [ ] Extend the safe DTO with deliveryType INVITATION/ACCESS_CHANGE and nullable eventType.
- [ ] Implement the combined search:
  - authorize PM + UserAdmin;
  - clamp top to 100 and skip to the documented bound;
  - for a specified type query only that table;
  - for All read at most skip+top newest rows from each table, normalize/mask, merge by createdAt desc then ID desc, then slice skip/top;
  - never return raw recipient, body, provider ID, lock or audit ID.
- [ ] Add retryUserAccessDelivery with FAILED, allowlisted transient code, attempt budget, no active lock and expected modifiedAt guards. Keep invitation expiry/status guard unchanged.
- [ ] Make readiness consider recent SENT/FAILED from both User Administration delivery tables with SENT precedence.
- [ ] Update Operations Delivery UI to one table with Type filter All/Invitation/Access change and one safe details dialog. Dispatch Retry by deliveryType to the correct action.
- [ ] Test mixed ordering across both tables, 100/100/5 paging, stable no-duplicate boundaries, masking, search, type filters, readiness precedence and wrong-type retry rejection.
- [ ] Run:

~~~powershell
npm run qa:user-admin-operations:programmatic
npm run qa:user-admin-ui:programmatic
npm run qa:user-access-notifications:programmatic
~~~

Expected: all exit 0.

- [ ] Commit:

~~~powershell
git add srv/user-admin.cds srv/user-admin.js srv/user-admin/operations-audit.js app/user-administration-ui/webapp scripts/qa
git commit -m "feat: unify user administration delivery operations"
~~~

### Task 6: Mirrors, additive HANA evidence and Draft PR

**Files:**
- Create/Modify: matching docs/knowledge/db, docs/knowledge/srv and docs/knowledge/app mirrors.
- Create: docs/pm/evidence/user-administration/gate-6-5-access-notification-source.md
- Create: docs/deployment/user-administration-gate-6-5-access-delivery-rollout.md
- Modify: docs/pm/tasks/wp8-user-administration-roadmap.md
- Modify: docs/pm/status/donhv.md

**Interfaces:** Produces source evidence and a later mutation plan; no live mutation.

- [ ] Run officecli --version and update bilingual mirrors for schema, writer/template, shared worker, final-audit hook and Operations DTO/UI.
- [ ] Generate baseline and candidate HANA outputs in task-temp outside the repo. Compare normalized relative paths and SHA-256.
- [ ] Require exactly the new access-delivery table and unique/index artifacts plus any compiler-required association artifacts; zero removal/change of existing generated artifacts and zero hdbtabledata.
- [ ] Run:

~~~powershell
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
~~~

Expected: all exit 0; record exact additive artifact manifest.

- [ ] Write later rollout gates:
  1. exact source/PR review;
  2. HANA simulation and backup/restore proof;
  3. additive schema migration only;
  4. selective CAP/UI deployment;
  5. controlled suspend/reactivate/role-change/revoke email acceptance;
  6. Operations unified list/readiness/retry proof;
  7. rollback/readiness verification.
- [ ] Commit docs/evidence, push exact branch, create one Draft PR and stop. Do not run HDI, deploy, send email or mutate a real user under the source gate.
