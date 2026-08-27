# IDTS My Notifications and Prompt Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a caller-only My Notifications inbox and deliver action-required Bug/access email through the existing post-commit immediate worker path, while reserving Job Scheduler for recovery, SLA/Overdue discovery, digest and retention.

**Architecture:** Add a federated inbox index that references existing Bug notifications and final access audits; expose it through a dedicated CAP service that scopes the resolved caller before every operation. Reuse the domain outboxes, sender, provider, worker, retry and lock conventions. Deliver six sequential gates from fresh merged `origin/dev` baselines, each with TDD, independent review, one Draft PR and a hard stop.

**Tech Stack:** SAP CAP Node.js, CDS/OData V4, SQLite tests, HANA-portable CDS, SAPUI5/Fiori Elements 1.148.x, existing Brevo/SMTP abstraction, SAP Job Scheduling Service, Node.js QA and Playwright/browser acceptance.

**Spec:** `docs/superpowers/specs/2026-08-26-my-notifications-and-delivery-design.md`

## Global Constraints

- Original planning base: `origin/dev` `e355f95d7d0eb61e2bd675a35709270454e62276`; refreshed dependency baseline after Gate 6.5 closure: `origin/dev` `308aa847711e969cc770453f375bb5dbcf25a612`. Every source gate still fetches and freezes its own latest exact upstream SHA.
- N1 precondition is satisfied at `origin/dev` `308aa847711e969cc770453f375bb5dbcf25a612`: Gate 6.5 is merged and the tree contains `UserAccessNotificationDeliveries` plus final APPLIED access-audit hooks. N1 must re-prove this at its own start; never copy a feature/Draft-PR branch into N1.
- Preserve domain source/audit and delivery tables as authorities. Inbox stores recipient/source/read state only.
- Resolve one authenticated active internal user and enforce XSUAA/business-role alignment before scope, filter, order, page, count, hydration or mutation. PM/UserAdmin cannot read another user's inbox.
- Prompt mail uses `writeNotificationAndSchedule()` and `scheduleImmediateEmailOutbox()` after commit. Hourly Job Scheduler remains recovery, not normal status-email latency.
- SLA is four hours for Critical/Blocker and 24 hours otherwise. Digest runs 08:00 Monday-Friday in `Asia/Bangkok`.
- Backfill at most 30 days of Bug notifications with no email. Retain inbox index/read state 90 days without deleting source history/audit.
- Server paging is default 25, maximum 100, `skip<=10000`, ordered `occurredAt desc, notificationID desc`, with at most two source bulk reads per page.
- Add no Event Mesh, Redis/RabbitMQ/BullMQ, WebSocket/SSE, push, Work Zone integration, preference system, second sender/worker/provider/scheduler service or provider SDK.
- Every changed tracked `app/`, `srv/`, or `db/` file receives its exact bilingual knowledge mirror. UI copy is localized and contains no worker/outbox/provider/internal terminology.
- Every change is RED-first, minimal GREEN, focused regression and a small commit. No gate advances with an open Critical/Major/Important finding.
- Schema migration, HANA/HDI, deployment, real email, provider/user/role/data mutation, Ready, merge, rollout and cleanup remain separately approved.

## Gate Map

| Gate | Branch | Output | Predecessor |
| --- | --- | --- | --- |
| N1 | `feature/wp7-notifications-inbox-service-donhv` | persistence, caller service, read state, dry-run backfill | merged Gate 6.5 |
| N2 | `feature/wp7-notifications-inbox-ui-donhv` | bell, responsive inbox, filters, read actions, deep links | merged N1 |
| N3 | `feature/wp7-notifications-event-coverage-donhv` | lifecycle/mention/escalation matrix and prompt email | merged N2 |
| N4 | `feature/wp7-notifications-sla-digest-donhv` | SLA/Overdue discovery and weekday digest | merged N3 |
| N5 | `feature/wp7-notifications-operations-retention-donhv` | digest Operations and 90-day cleanup | merged N4 |
| N6 | `docs/wp7-notifications-rollout-acceptance-donhv` | migration/rollout/acceptance package | merged N5 |

Each N1-N5 gate ends by updating mirrors/evidence/PM state, running its matrix, obtaining one bounded exact-head review, creating one Draft PR and stopping. A later coordinator decision merges it before the next gate creates a fresh worktree.

## File Map

- `db/schema.cds`: inbox index, source idempotency and digest delivery.
- New `srv/notification.cds`, `srv/notification.js`, `srv/notification/inbox.js`: personal service and read state.
- New `srv/notification/scheduled.js`, `srv/notification/digest.js`: SLA/Overdue/digest/retention.
- `srv/bug-service/history.js`, `actions.js`, `constants.js`, `srv/email/outbox.js`: exact event recipients, source keys and email policy.
- `srv/email/worker.js`, `srv/service.cds`, `srv/service.js`: shared delivery and protected scheduler actions.
- New UI modules `ext/notification/NotificationClient.js`, `NotificationShell.js`; existing `Component.js`, `index.html`, `manifest.json`, i18n.
- Comment files `CommentsSection.fragment.xml`, `BugCollaboration.js`: selected internal mentions.
- User Administration Operations backend/UI: safe Digest delivery diagnostics.
- New `scripts/db/backfill-notification-inbox.js`: dry-run by default, `--execute` only after approval.
- New `scripts/qa/test-my-notifications-{model,service,backfill,ui,events,scheduled}.js` plus existing affected suites.

---

## N1 — Persistence and Caller-Only Service

### Task 1: Freeze dependency and write RED model contract

**Files:**
- Create: `scripts/qa/test-my-notifications-model.js`
- Modify: `package.json`
- Read only: merged Gate 6.5 schema/writer/evidence

**Interfaces:** Produces `npm run qa:my-notifications:model` and consumes merged `UserAccessNotificationDeliveries`/`UserIdentityAuditEvents`.

- [ ] **Step 1: Verify dependency before mutation**

```powershell
git fetch origin --prune
git status --short --branch
git rev-parse origin/dev
git grep -n "entity UserAccessNotificationDeliveries" origin/dev -- db/schema.cds
git grep -n "writeUserAccessDelivery" origin/dev -- srv
```

Expected: clean worktree and both anchors. Empty grep means stop N1.

- [ ] **Step 2: Write the failing assertions**

```js
assert.ok(definitions['idts.cap.UserNotificationInboxEntries'])
assert.ok(definitions['idts.cap.NotificationDigestDeliveries'])
assert.equal(definitions['idts.cap.Notifications'].elements.sourceKey.type, 'cds.String')
assert.equal(definitions['idts.cap.UserNotificationInboxEntries'].elements.readAt.type, 'cds.Timestamp')
```

Assert unique Bug source, access source, sourceKey and digest recipient/date/type. Assert absence of dismiss/snooze/preference/push/raw-provider fields.

- [ ] **Step 3: Add command, run RED and commit test**

```json
"qa:my-notifications:model": "node scripts/qa/test-my-notifications-model.js"
```

```powershell
npm run qa:my-notifications:model
git add scripts/qa/test-my-notifications-model.js package.json
git commit -m "test: define notification inbox model contract"
```

Expected RED: missing new contract, not an unrelated parse/dependency failure.

### Task 2: Add minimal portable persistence

**Files:**
- Modify: `db/schema.cds`
- Modify test from Task 1
- Update: `docs/knowledge/db/schema.cds.md`

**Interfaces:** Produces `UserNotificationInboxEntries`, nullable unique `Notifications.sourceKey`, and `NotificationDigestDeliveries`.

- [ ] **Step 1: Add exact CDS shape**

```cds
extend Notifications with { sourceKey : String(255); }
annotate Notifications with @assert.unique.notificationSourceKey: [ sourceKey ];

entity UserNotificationInboxEntries : cuid, managed {
  recipient        : Association to Users not null;
  bugNotification  : Association to Notifications;
  accessAuditEvent : Association to UserIdentityAuditEvents;
  occurredAt       : Timestamp not null;
  readAt           : Timestamp;
}

annotate UserNotificationInboxEntries with {
  @assert.unique.inboxBugSource: [ bugNotification ];
  @assert.unique.inboxAccessSource: [ accessAuditEvent ];
};
```

Add `NotificationDigestDeliveries` with recipient, businessDate, digestType, windowStart/end, snapshotAt, itemCount, subject/text/html, status/attempt/retry/sent/error/provider/lock fields and unique `[recipient,businessDate,digestType]`. Enforce exactly-one-source XOR in the handler because portable CDS does not express it reliably.

```cds
entity NotificationDigestDeliveries : cuid, managed {
  recipient         : Association to Users not null;
  businessDate      : Date not null;
  digestType        : String(30) not null;
  windowStart       : Timestamp not null;
  windowEnd         : Timestamp not null;
  snapshotAt        : Timestamp not null;
  itemCount         : Integer not null;
  subject           : String(255) not null;
  textBody          : LargeString not null;
  htmlBody          : LargeString not null;
  status            : Association to NotificationDeliveryStatuses not null;
  attemptCount      : Integer default 0 not null;
  nextAttemptAt     : Timestamp;
  lastAttemptAt     : Timestamp;
  sentAt            : Timestamp;
  lastErrorCode     : String(80);
  lastErrorSummary  : String(500);
  providerMessageId : String(255);
  lockedUntil       : Timestamp;
  lockToken         : String(64);
}
annotate NotificationDigestDeliveries
  with @assert.unique.digestRecipientDateType: [recipient,businessDate,digestType];
```

- [ ] **Step 2: Run GREEN and compilers**

```powershell
npm run qa:my-notifications:model
npx cds compile db/schema.cds --to hana
npx cds compile srv -s all --to edmx
```

Expected: exit 0; only the known attachment vocabulary warning may remain.

- [ ] **Step 3: Mirror and commit**

```powershell
git add db/schema.cds docs/knowledge/db/schema.cds.md
git commit -m "feat: add notification inbox persistence"
```

Mirror explains ownership, XOR, uniqueness, retention and must-check-together files.

### Task 3: Implement caller-scoped search and count

**Files:**
- Create: `srv/notification.cds`, `srv/notification.js`, `srv/notification/inbox.js`
- Create: `scripts/qa/test-my-notifications-service.js`
- Modify: `package.json`
- Create exact knowledge mirrors

**Interfaces:**

```js
resolveNotificationActor(req) // active aligned Users row or safe 403
searchMyNotifications(req) // NotificationSummary[]
getMyUnreadNotificationCount(req) // { count }
```

```cds
function searchMyNotifications(category:String(10),readState:String(10),skip:Integer,top:Integer)
  returns many NotificationSummary;
function getMyUnreadNotificationCount() returns UnreadNotificationCount;
```

- [ ] **Step 1: Write RED service tests**

Use two active users plus inactive/unmapped/misaligned callers, Bug/access sources, equal timestamps and over 100 rows. Assert caller scope before filter/order/page/count, default 25, max 100, max skip 10000, stable ties, no free-text input, no raw fields and at most two hydration reads.

- [ ] **Step 2: Define safe DTO and handlers**

```cds
type NotificationSummary {
  notificationID:UUID; category:String(10); eventType:String(40);
  title:String(160); summary:String(500); priority:String(20);
  actionRequired:Boolean; occurredAt:Timestamp; readAt:Timestamp;
  targetPath:String(500); modifiedAt:Timestamp;
}
```

```js
async function searchMyNotifications (req) {
  const actor = await resolveNotificationActor(req)
  const input = normalizeSearch(req.data)
  const rows = await readInboxPage(cds.tx(req), actor.ID, input)
  return hydrateNotificationPage(cds.tx(req), rows)
}
```

Hydration performs zero/one Bug notification read and zero/one access-audit read. Unsupported source/action yields `targetPath:null`; external URLs are rejected.

- [ ] **Step 3: Run GREEN, mirror and commit**

```powershell
npm run qa:my-notifications:service
npx cds compile srv -s all --to edmx
git add srv/notification.cds srv/notification.js srv/notification scripts/qa package.json docs/knowledge/srv
git commit -m "feat: add caller-only notification service"
```

### Task 4: Add optimistic read state and dry-run backfill

**Files:**
- Modify: `srv/notification/inbox.js`, service QA
- Create: `scripts/db/backfill-notification-inbox.js`
- Create: `scripts/qa/test-my-notifications-backfill.js`
- Modify: `package.json`; update mirrors

**Interfaces:**

```js
markMyNotificationRead(req)
markAllMyNotificationsRead(req)
buildBugInboxBackfillPlan({ tx, now, days: 30 })
```

- [ ] **Step 1: Write RED race/backfill tests**

Cover two-tab same-version behavior, already-read idempotency, stale 409, cross-user non-disclosure, mark-all snapshot race, XOR guard, 30-day cutoff, rerun no-op, zero access backfill and zero delivery inserts.

- [ ] **Step 2: Implement conditional update**

```js
const changed = await tx.run(
  UPDATE(INBOX).set({ readAt: now })
    .where({ ID: notificationID, recipient_ID: actor.ID,
      modifiedAt: expectedModifiedAt, readAt: null })
)
```

When zero, re-read only caller-owned ID: return current DTO if already read, safe 409 if stale, otherwise safe not-found. Mark-all includes `occurredAt <= throughOccurredAt`.

- [ ] **Step 3: Implement dry-run-first helper**

No `--execute`: print cutoff and counts only plus `No database was changed`. Separately approved `--execute`: insert missing Bug index rows in one transaction; never create email/event or print recipient data.

- [ ] **Step 4: Verify N1 and stop at Draft PR**

```powershell
npm run qa:my-notifications:model
npm run qa:my-notifications:service
npm run qa:my-notifications:backfill
npm run qa:email-outbox:programmatic
npm run qa:email-immediate:programmatic
npm run qa:user-access-notifications:programmatic
npm run qa:secret-scan
npm run qa:agent-rules
npm run qa:depth:self-test
npx cds compile srv -s all --to edmx
npx cds compile db/schema.cds --to hana
git diff --check origin/dev...HEAD
```

Commit `feat: persist personal notification read state`; review exact head; create one Draft PR; do not execute migration/backfill.

---

## N2 — Native Inbox UI

### Task 5: Add notification OData client

**Files:**
- Create: `app/bug-management-ui/webapp/ext/notification/NotificationClient.js`
- Modify: `manifest.json`, `Component.js`, `package.json`
- Create: `scripts/qa/test-my-notifications-ui.js`; create/update mirrors

**Interfaces:**

```js
search(model,{category,readState,skip,top})
unreadCount(model)
markRead(model,row)
markAllRead(model,throughOccurredAt)
```

- [ ] **Step 1: Write RED client/manifest tests**

Require named OData V4 model `/odata/v4/notification/`, exact parameter bounds, awaited function/action operations and target-path allowlist. Raw fetch/CSRF/auth duplication fails the contract.

- [ ] **Step 2: Add data source and four calls**

Use `bindContext`, set exact parameters, await execution and read returned values. Set server operation mode and no early preload.

- [ ] **Step 3: Verify and commit**

```powershell
npm run qa:my-notifications:ui
npm run lint --prefix app/bug-management-ui
npm run build --prefix app/bug-management-ui
git add app/bug-management-ui scripts/qa package.json docs/knowledge
git commit -m "feat: connect notification service to bug ui"
```

### Task 6: Build responsive bell and personal inbox

**Files:**
- Create: `ext/notification/NotificationShell.js`, browser QA
- Modify: `index.html`, `Component.js`, base/en/vi i18n, UI QA
- Modify Bug UI cache identity `0.0.6 -> 0.0.7` across package/lock/manifest; update mirrors

**Interfaces:** Produces `NotificationShell.init(component)` and `refreshUnread()`; consumes Task 5 client.

- [ ] **Step 1: Extend RED UX/a11y tests**

Require transparent bell, `99+`, native `ResponsivePopover`, first 25 plus Load More, All/Unread/Read and All/Bug/Access, mark-all snapshot, labels/focus, loading/empty/retry, no custom CSS, visible-only 30-second count polling and timer cleanup.

- [ ] **Step 2: Add stable host and native controls**

```html
<div id="idtsNotificationShellHost"></div>
<div id="idtsProfileShellHost"></div>
```

Use Button, ResponsivePopover, Toolbar, Select/SegmentedButton, List, CustomListItem, ObjectStatus and MessageStrip. Unread is not color-only. Item press attempts mark-read, then navigates only to an allowlisted same-origin target. Restore focus to bell on close.

- [ ] **Step 3: Verify N2 and stop**

```powershell
npm run qa:my-notifications:ui
npm run lint --prefix app/bug-management-ui
npm run build --prefix app/bug-management-ui
npm run qa:secret-scan
npm run qa:agent-rules
npm run qa:depth:self-test
git diff --check origin/dev...HEAD
```

Run UI5/Fiori MCP lint/manifest, browser 375/768/1366/1920, zoom 200%, keyboard and NVDA smoke. Commit `feat: add responsive my notifications inbox`; review; Draft PR; stop.

---

## N3 — Event Coverage, Mentions and Escalation

### Task 7: Make lifecycle events exact, idempotent and prompt

**Files:**
- Modify: `db/data/idts.cap-NotificationEventTypes.csv`
- Modify: `srv/bug-service/constants.js`
- Modify: `srv/bug-service/history.js`
- Modify: `srv/bug-service/actions.js`
- Modify: `srv/email/outbox.js`
- Create: `scripts/qa/test-my-notifications-events.js`; modify history/email/immediate QA and mirrors

**Interfaces:**

```js
writeNotificationAndSchedule(req,{bugID,recipientID,eventType,message,sourceKey,emailRequired})
```

- [ ] **Step 1: Write RED event matrix**

Assert exact recipient/channel/sourceKey for Assigned, Reassigned, removed assignment, Need More Information, Resubmitted, Rejected, Resolved, Retest Required, Reopened, Closed and owner-changing versus owner-stable In Review/In Progress. Repeated source history creates no duplicate.

- [ ] **Step 2: Add stable event codes and email policy**

Add approved codes without rewriting legacy rows. `writeNotificationRecord` always creates source/inbox; it creates EMAIL only for `emailRequired=true`, otherwise returns `IN_APP_ONLY` and registers no kick.

- [ ] **Step 3: Prove immediate semantics**

Tests require `req.on('succeeded')`, no provider before commit, scheduler mode retaining immediate kick, and one PENDING row surviving kick failure for hourly recovery.

- [ ] **Step 4: Verify and commit**

```powershell
npm run qa:my-notifications:events
npm run qa:history-events:programmatic
npm run qa:email-outbox:programmatic
npm run qa:email-immediate:programmatic
git add db/data srv scripts/qa docs/knowledge
git commit -m "feat: complete notification event matrix"
```

### Task 8: Add selected internal comment mentions

**Files:**
- Modify: `srv/service.cds`
- Modify: `srv/bug-service/actions.js`
- Modify: `srv/bug-service/history.js`
- Modify: `app/bug-management-ui/webapp/ext/fragment/CommentsSection.fragment.xml`
- Modify: `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js`
- Modify: `app/bug-management-ui/webapp/i18n/i18n.properties`
- Modify: `app/bug-management-ui/webapp/i18n/i18n_en.properties`
- Modify: `app/bug-management-ui/webapp/i18n/i18n_vi.properties`
- Modify matching QA/mirrors

**Interfaces:**

```cds
action addComment(content:LargeString, mentionedUserIDs:array of UUID) returns Bugs;
```

```js
validateMentionRecipients({tx,actor,bug,mentionedUserIDs}) // unique active authorized Users[]
```

- [ ] **Step 1: Write RED backend/UI tests**

Cover author exclusion, ID dedupe, inactive/unmapped/unauthorized rejection, maximum 20, no name/email text parsing, 200-character excerpt, one `MENTION:<commentID>:<recipientID>` event and transactional rollback.

- [ ] **Step 2: Add native multi-select and transactional writes**

Populate from a server-authorized active-user projection and send selected IDs separately from text. Validate before comment INSERT; persist comment/history/mention events in the request transaction. Typed `@name` alone creates no mention.

- [ ] **Step 3: Verify and commit**

```powershell
npm run qa:my-notifications:events
npm run qa:idts116:programmatic
npm run qa:comments-attachments:programmatic
npm run lint --prefix app/bug-management-ui
npm run build --prefix app/bug-management-ui
git add srv app/bug-management-ui scripts/qa docs/knowledge
git commit -m "feat: notify selected comment mentions"
```

### Task 9: Add upward escalation and access inbox indexing

**Files:**
- Modify: `srv/bug-service/history.js`
- Modify: `srv/bug-service/constants.js`
- Modify: `srv/user-admin/access-delivery.js`
- Modify final completion hooks: `srv/user-admin.js`, `srv/user-admin/access-lifecycle.js`, `srv/provisioning-broker.js`
- Modify event/access QA and exact mirrors

**Interfaces:** Adds inbox only for `CHANGE_ROLE/APPLIED` and `REACTIVATE/APPLIED`; suspend/revoke remain email-only.

- [ ] **Step 1: Write RED escalation/access tests**

Cover upward/same/downward priority/severity, assignee/current-owner dedupe, PM addition for Critical/Blocker, lower escalation inbox-only, Critical/Blocker prompt email, role/reactivate inbox+email, suspend/revoke email-only, invitation email-only and responsibility audit-only.

- [ ] **Step 2: Implement code-rank comparison and final-audit index**

Compare stable codes, never localized labels. Insert access inbox entry from the exact APPLIED audit ID in the same transaction as its domain delivery.

- [ ] **Step 3: Verify N3 and stop**

```powershell
npm run qa:my-notifications:events
npm run qa:user-access-notifications:programmatic
npm run qa:email-immediate:programmatic
npm run qa:email-outbox:programmatic
npm run qa:secret-scan
npm run qa:agent-rules
npm run qa:depth:self-test
npx cds compile srv -s all --to edmx
npx cds compile db/schema.cds --to hana
```

Commit `feat: notify material escalation and access events`; review; Draft PR; stop.

---

## N4 — SLA, Overdue and Digest

### Task 10: Add idempotent scheduled discovery

**Files:**
- Create: `srv/notification/scheduled.js`, scheduled QA/mirror
- Modify: notification service and Bug service protected actions, `package.json`

**Interfaces:**

```cds
@(requires:'OutboxProcessor')
action processNotificationSchedules(now:Timestamp) returns NotificationMaintenanceResult;
```

```js
discoverScheduledNotifications({tx,now})
```

- [ ] **Step 1: Write RED fixed-clock tests**

Assert 3:59/4:00 and 23:59/24:00 thresholds, due-date cycle, closed exclusion, active PM resolution, repeat no-op and non-OutboxProcessor denial.

- [ ] **Step 2: Implement bounded discovery**

Query open Pending Assignment/Overdue candidates only. Insert source-keyed event/inbox/delivery in one transaction. Critical/Blocker SLA/assignment uses prompt email; standard reminders use inbox/digest policy. Keep `processEmailOutbox` separate.

- [ ] **Step 3: Verify and commit**

```powershell
npm run qa:my-notifications:scheduled
npm run qa:pm-monitoring:programmatic
npm run qa:idts113:outbox-scheduler
git add srv scripts/qa package.json docs/knowledge
git commit -m "feat: discover notification sla and overdue events"
```

### Task 11: Generate and send one digest per recipient/date/type

**Files:**
- Create: `srv/notification/digest.js`, mirror
- Modify: `scheduled.js`, `email/worker.js`, scheduled/email QA

**Interfaces:**

```js
buildDigestSnapshot({tx,recipient,businessDate,snapshotAt,limit:20})
processNotificationDigestDeliveries({tx,config,sendMail,now,workerID})
```

- [ ] **Step 1: Write RED digest tests**

Assert weekday 08:00 Bangkok, no weekend/empty email, persona isolation, max 20 plus remainder, priority order, before/after snapshot behavior, unique rerun, stored-snapshot retry, safe HTML and one shared sender lifetime.

- [ ] **Step 2: Implement snapshot and shared processor**

Derive Bangkok date with `Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok'})`. Insert one PENDING unique row; treat only its exact unique violation as idempotent reuse. Add injected `processDigests` to the existing worker and reuse sanitizer/backoff/claim/lock/sender.

- [ ] **Step 3: Verify N4 and stop**

```powershell
npm run qa:my-notifications:scheduled
npm run qa:email-immediate:programmatic
npm run qa:email-outbox:programmatic
npm run qa:user-access-notifications:programmatic
npm run qa:idts113:outbox-scheduler
npm run qa:secret-scan
npx cds compile srv -s all --to edmx
npx cds compile db/schema.cds --to hana
```

Commit `feat: add weekday notification digest`; review; Draft PR; stop without live schedule change.

---

## N5 — Operations and Retention

### Task 12: Show safe Digest delivery diagnostics

**Files:**
- Modify: `srv/user-admin.cds`
- Modify: `srv/user-admin/operations-audit.js`
- Modify: `app/user-administration-ui/webapp/controller/Main.controller.js`
- Modify: `app/user-administration-ui/webapp/view/Main.view.xml`
- Modify base/English/Vietnamese User Administration i18n bundles
- Modify User Administration package/lock/manifest patch version consistently
- Modify operations/UI QA and mirrors

**Interfaces:** Extends normalized delivery DTO with `deliveryType='DIGEST'`; adds `retryNotificationDigestDelivery(deliveryID,expectedModifiedAt)`.

- [ ] **Step 1: Write RED auth/privacy/retry tests**

Assert PM+UserAdmin auth before read, masked recipient, no body/provider/lock/source, stable mixed order, Digest filter, exact FAILED/retryable/budget/unlocked guards, optimistic conflict, audit append and post-commit kick.

- [ ] **Step 2: Reuse Operations table and retry flow**

Map safe fields only. Add localized Digest type and details; never show digest body/email. Preserve invitation/access behavior.

- [ ] **Step 3: Verify and commit**

```powershell
npm run qa:user-admin-operations:programmatic
npm run qa:user-admin-ui:programmatic
npm run lint --prefix app/user-administration-ui
npm run build --prefix app/user-administration-ui
git add srv app/user-administration-ui scripts/qa docs/knowledge
git commit -m "feat: show digest delivery diagnostics"
```

### Task 13: Delete only expired inbox index rows

**Files:**
- Modify: `scheduled.js`, scheduled QA/mirror

**Interfaces:** `deleteExpiredInboxEntries({tx,now,retentionDays:90}) => deletedCount`.

- [ ] **Step 1: Write RED boundary tests**

Assert 89-day retained, exact 90-day retained until strictly older, 91-day deleted, read/unread equal, source counts unchanged, 500-row batches and repeated no-op.

- [ ] **Step 2: Implement bounded index-only delete**

Select at most 500 expired inbox IDs ordered oldest-first and delete exactly those IDs. Never cascade to source.

- [ ] **Step 3: Run final N5 source matrix**

```powershell
npm run qa:my-notifications:model
npm run qa:my-notifications:service
npm run qa:my-notifications:backfill
npm run qa:my-notifications:ui
npm run qa:my-notifications:events
npm run qa:my-notifications:scheduled
npm run qa:email-outbox:programmatic
npm run qa:email-immediate:programmatic
npm run qa:user-access-notifications:programmatic
npm run qa:user-admin-operations:programmatic
npm run qa:user-admin-ui:programmatic
npm run qa:history-events:programmatic
npm run qa:idts116:programmatic
npm run qa:comments-attachments:programmatic
npm run qa:pm-monitoring:programmatic
npm run qa:idts113:outbox-scheduler
npm run qa:secret-scan
npm run qa:agent-rules
npm run qa:depth:self-test
npx cds compile srv -s all --to edmx
npx cds compile db/schema.cds --to hana
npm run lint --prefix app/bug-management-ui
npm run build --prefix app/bug-management-ui
npm run lint --prefix app/user-administration-ui
npm run build --prefix app/user-administration-ui
git diff --check origin/dev...HEAD
```

- [ ] **Step 4: Commit, review and stop**

Commit `feat: retain notification inbox index for ninety days`; run UI5/Fiori MCP, security diff scan, Ponytail review and one bounded exact-head review. Create one Draft PR only after zero Critical/Major/Important; stop.

---

## N6 — Controlled Migration, Rollout and Acceptance

### Task 14: Prepare execution package without mutation

**Files:**
- Create: `docs/pm/evidence/my-notifications/n6-migration-and-rollout-plan.md`
- Create: `docs/pm/evidence/my-notifications/n6-acceptance-checklist.md`
- Update PM roadmap/status

**Interfaces:** Consumes merged N5 SHA; produces exact commands/counts/rollback/GO boundaries.

- [ ] **Step 1: Freeze and dry-run**

```powershell
git fetch origin --prune
git rev-parse origin/dev
npm run btp:demo:check
npx cds deploy --dry --to hana --production
```

Record new table/column/index inventory and prove no destructive DDL, seed reload or unrelated artifact.

- [ ] **Step 2: Separate operations**

Document individually approved steps: additive HDI migration; backfill dry-run; backfill `--execute`; CAP rollout; Bug UI rollout; User Administration UI rollout; schedule configuration; browser/email/digest acceptance. Never combine database and application mutation in one command.

- [ ] **Step 3: Keep scheduler duties distinct**

Retain hourly `processEmailOutbox` recovery. Add scheduled discovery and weekday 08:00 Bangkok digest action. Do not use recovery cadence as prompt-email evidence.

- [ ] **Step 4: Commit planning and stop for GO**

```powershell
git add docs/pm/evidence/my-notifications docs/pm/tasks/wp7-my-notifications-roadmap.md docs/pm/status/donhv.md
git commit -m "docs: prepare notification rollout acceptance"
```

### Task 15: Execute only after separate migration and rollout approvals

**Files:** Evidence/PM documentation only; no product-source edits.

**Interfaces:** Consumes the checksum-bound commands and expected counts approved in Task 14; produces runtime acceptance truth.

- [ ] **Step 1: Apply the exact reviewed additive HDI command from the approved N6 package**

Before and after execution, run the package's read-only catalog/count queries. Store sanitized output proving only the reviewed tables/columns/indexes were added and source/audit/delivery row counts did not change.

- [ ] **Step 2: Execute the backfill once**

```powershell
node scripts/db/backfill-notification-inbox.js
node scripts/db/backfill-notification-inbox.js --execute
```

Expected: executed inserts equal dry-run missing count; duplicate-skipped count is explicit; `NotificationDeliveries` and access-audit counts are unchanged.

- [ ] **Step 3: Deploy only checksum-reviewed artifacts and verify readiness**

Use the exact `cf deploy`/content commands recorded and approved in Task 14, then run:

```powershell
npm run btp:demo:check
```

Expected: CAP/AppRouter `1/1`, health/ready/Web 200 and anonymous protected API 401. A not-ready result permits `npm run btp:demo:prepare` only after checking it is recovery, not deployment.

- [ ] **Step 4: Prove prompt timing**

Capture four UTC timestamps for one authorized test transition: business commit, outbox created, immediate worker attempt and provider acceptance. PASS requires immediate worker attempt before the next hourly recovery. A controlled no-provider test must leave exactly one PENDING row for scheduler recovery.

- [ ] **Step 5: Prove inbox security and read-state races**

Run Tester/Developer/PM browser/API acceptance for caller-only rows, cross-user denial, reload persistence, two-tab stale read, mark-all snapshot and allowlisted deep links. Do not mutate users/roles to manufacture personas.

- [ ] **Step 6: Prove digest and Operations**

Trigger the approved schedule action twice for the same controlled business date. PASS requires zero empty digest, one recipient/date/type row, top 20 plus exact remainder, no duplicate send, stored-snapshot retry and no raw recipient/body/provider/lock fields in Operations.

- [ ] **Step 7: Final readback and human closure request**

```powershell
npm run btp:demo:check
npm run qa:secret-scan
git rev-parse origin/dev
```

Compare deployed SHA/artifact checksums to the approved package, attach safe evidence, and request human closure. Do not self-approve Ready, release or cleanup.

## Execution Ownership

- Coordinator owns frozen SHAs, model, authorization, integration, exact diff, security, commits/PRs, migration/rollout authority and final reporting.
- Luna may receive one bounded disjoint task only after its interfaces freeze: mechanical CDS/QA contract, notification UI module after DTO freeze, localized UI/tests, or knowledge/evidence mirrors. Luna never owns authorization, migration, live email/provider/scheduler work, final review or release.
- Every Luna packet names exact baseline, files, writes, tests and stop boundary. Coordinator reviews every line and reruns evidence before accepting it.

---

## Tiếng Việt

### Mục tiêu, kiến trúc và constraint chung

Plan này xây My Notifications chỉ cho caller và gửi nhanh email Bug/access cần hành động qua immediate worker sau commit hiện có. Inbox là index liên nguồn tham chiếu Bug notification và access audit cuối; domain source/outbox vẫn là authority. Job Scheduler chỉ recovery, quét SLA/Overdue, digest và retention.

N1–N6 phải chạy tuần tự trên sáu branch đã ghi trong Gate Map tiếng Anh. Mỗi gate fetch/freeze `origin/dev` mới, tạo worktree riêng, chạy TDD, mirror/evidence, review exact head, một Draft PR và dừng. N1 bị block cho tới khi Gate 6.5 merge và `origin/dev` có `UserAccessNotificationDeliveries` cùng hook access audit `APPLIED`; không được copy code từ Draft branch.

Các constraint kỹ thuật áp dụng nguyên vẹn: caller scope trước mọi query/mutation; PM/UserAdmin không đọc inbox user khác; prompt email không chờ lịch một giờ; SLA 4 giờ cho Critical/Blocker và 24 giờ cho mức khác; digest 08:00 thứ Hai–thứ Sáu theo `Asia/Bangkok`; backfill Bug 30 ngày không email; retention index 90 ngày; page mặc định 25/tối đa 100/skip tối đa 10000; tối đa hai bulk source read; không thêm broker, worker, provider, scheduler service, push/WebSocket/Work Zone/preference system; mọi source có mirror song ngữ; không tự duyệt migration/deploy/email thật/Ready/merge/release/cleanup.

## N1 — Persistence và Notification Service chỉ cho caller

### Task 1: Freeze dependency và viết RED model contract

**File:** tạo `scripts/qa/test-my-notifications-model.js`, sửa `package.json`, chỉ đọc schema/writer/evidence Gate 6.5 đã merge.

**Interface:** tạo command `qa:my-notifications:model`; dùng `UserAccessNotificationDeliveries` và `UserIdentityAuditEvents` đã merge.

- [ ] **Bước 1: Xác nhận dependency trước mutation**

```powershell
git fetch origin --prune
git status --short --branch
git rev-parse origin/dev
git grep -n "entity UserAccessNotificationDeliveries" origin/dev -- db/schema.cds
git grep -n "writeUserAccessDelivery" origin/dev -- srv
```

Worktree phải sạch và hai anchor phải tồn tại; grep rỗng thì dừng N1.

- [ ] **Bước 2: Viết assertion fail cho hai entity mới, `Notifications.sourceKey`, `readAt`, bốn unique contract và cấm dismiss/snooze/preference/push/raw-provider field**
- [ ] **Bước 3: Thêm script package, chạy RED và commit test**

```powershell
npm run qa:my-notifications:model
git add scripts/qa/test-my-notifications-model.js package.json
git commit -m "test: define notification inbox model contract"
```

RED phải do contract thiếu, không phải parse/dependency.

### Task 2: Thêm persistence tối thiểu, portable

**File:** sửa `db/schema.cds`, test Task 1 và `docs/knowledge/db/schema.cds.md`.

**Interface:** tạo `UserNotificationInboxEntries`, `Notifications.sourceKey` nullable unique và `NotificationDigestDeliveries` đúng field/annotation trong block CDS tiếng Anh. Handler enforce XOR đúng một nguồn vì CDS portable không biểu diễn constraint này ổn định.

- [ ] **Bước 1: Áp dụng nguyên exact CDS shape ở Task 2 tiếng Anh**
- [ ] **Bước 2: Chạy GREEN và hai compiler**

```powershell
npm run qa:my-notifications:model
npx cds compile db/schema.cds --to hana
npx cds compile srv -s all --to edmx
```

- [ ] **Bước 3: Cập nhật mirror về ownership/XOR/unique/retention rồi commit**

```powershell
git add db/schema.cds docs/knowledge/db/schema.cds.md
git commit -m "feat: add notification inbox persistence"
```

### Task 3: Làm search/count đã scope caller

**File:** tạo `srv/notification.cds`, `srv/notification.js`, `srv/notification/inbox.js`, `scripts/qa/test-my-notifications-service.js`, mirror; sửa `package.json`.

**Interface:** `resolveNotificationActor(req)`, `searchMyNotifications(req)`, `getMyUnreadNotificationCount(req)` và DTO/OData signature đúng block tiếng Anh.

- [ ] **Bước 1: RED với hai active user, inactive/unmapped/misaligned, hơn 100 row, timestamp trùng; bắt buộc scope trước filter/order/page/count, page 25/100, skip 10000, tie ổn định, không free-text/raw field, tối đa hai hydrate read**
- [ ] **Bước 2: Tạo service/DTO; `searchMyNotifications` resolve actor → normalize → read page → hydrate; zero/one bulk Bug và zero/one bulk access audit; route ngoài trả null**
- [ ] **Bước 3: GREEN, compile, mirror và commit**

```powershell
npm run qa:my-notifications:service
npx cds compile srv -s all --to edmx
git add srv/notification.cds srv/notification.js srv/notification scripts/qa package.json docs/knowledge/srv
git commit -m "feat: add caller-only notification service"
```

### Task 4: Read state optimistic và backfill dry-run

**File:** sửa `inbox.js`/service QA; tạo `scripts/db/backfill-notification-inbox.js`, backfill QA, mirror; sửa package.

**Interface:** `markMyNotificationRead`, `markAllMyNotificationsRead`, `buildBugInboxBackfillPlan({tx,now,days:30})`.

- [ ] **Bước 1: RED cho hai tab, idempotent already-read, stale 409, cross-user, mark-all race, XOR, cutoff 30 ngày, rerun no-op, zero access backfill/delivery**
- [ ] **Bước 2: Conditional UPDATE theo caller/ID/modifiedAt/readAt null; zero update thì re-read row của caller để quyết định success/409/not-found; mark-all có `occurredAt <= snapshot`**
- [ ] **Bước 3: Helper mặc định chỉ in cutoff/count/`No database was changed`; `--execute` cần duyệt riêng, insert missing Bug index trong một transaction, không email hoặc recipient log**
- [ ] **Bước 4: Chạy matrix N1 đúng block tiếng Anh, commit `feat: persist personal notification read state`, review, một Draft PR rồi dừng; không migrate/backfill**

## N2 — UI inbox SAPUI5 native

### Task 5: Thêm OData notification client

**File:** tạo `NotificationClient.js` và UI QA; sửa manifest/Component/package/mirror.

**Interface:** `search`, `unreadCount`, `markRead`, `markAllRead` đúng signature tiếng Anh.

- [ ] **Bước 1: RED bắt buộc model OData V4 `/odata/v4/notification/`, bound function/action await, parameter đúng và allowlist target; cấm raw fetch/CSRF/auth duplicate**
- [ ] **Bước 2: Thêm named model server-mode không preload sớm và bốn call bằng `bindContext`**
- [ ] **Bước 3: Verify/build và commit**

```powershell
npm run qa:my-notifications:ui
npm run lint --prefix app/bug-management-ui
npm run build --prefix app/bug-management-ui
git add app/bug-management-ui scripts/qa package.json docs/knowledge
git commit -m "feat: connect notification service to bug ui"
```

### Task 6: Tạo chuông và inbox responsive

**File:** tạo `NotificationShell.js`/browser QA; sửa index/Component/i18n/UI QA và tăng đồng bộ version `0.0.6 -> 0.0.7`; update mirror.

**Interface:** `NotificationShell.init(component)` và `refreshUnread()`.

- [ ] **Bước 1: RED cho bell, `99+`, ResponsivePopover, page 25/Load More, hai filter, mark-all snapshot, label/focus, loading/empty/retry, không custom CSS, poll 30 giây chỉ khi visible và cleanup timer**
- [ ] **Bước 2: Thêm `idtsNotificationShellHost` trước profile host; dùng control native; unread không chỉ dùng màu; item mark-read rồi chỉ navigate same-origin allowlist; đóng popover trả focus về bell**
- [ ] **Bước 3: Chạy matrix N2, UI5/Fiori MCP, browser 375/768/1366/1920, zoom 200%, keyboard/NVDA; commit `feat: add responsive my notifications inbox`, review, Draft PR và dừng**

## N3 — Event coverage, mention và escalation

### Task 7: Lifecycle event chính xác, idempotent và gửi nhanh

**File:** sửa CSV event type, constants/history/actions/outbox, event QA cùng history/email/immediate QA và mirror.

**Interface:** `writeNotificationAndSchedule(req,{bugID,recipientID,eventType,message,sourceKey,emailRequired})`.

- [ ] **Bước 1: RED toàn matrix Assigned/Reassigned/remove/Need More Information/Resubmitted/Rejected/Resolved/Retest/Reopened/Closed/In Review/In Progress và duplicate source**
- [ ] **Bước 2: Thêm stable code đã duyệt, không rewrite legacy; luôn ghi source/inbox, chỉ tạo EMAIL nếu `emailRequired`, còn lại `IN_APP_ONLY` và không kick**
- [ ] **Bước 3: Chứng minh chỉ kick trên `succeeded`, không provider trước commit, scheduler mode vẫn kick và kick fail giữ một PENDING row**
- [ ] **Bước 4: Chạy event/history/outbox/immediate suites và commit `feat: complete notification event matrix`**

### Task 8: Mention user nội bộ được chọn

**File:** sửa exact service/actions/history/Comments fragment/BugCollaboration/i18n/QA/mirror đã liệt kê tiếng Anh.

**Interface:** `addComment(content,mentionedUserIDs)` và `validateMentionRecipients`.

- [ ] **Bước 1: RED cho bỏ author, dedupe ID, reject inactive/unmapped/unauthorized, max 20, không parse name/email, excerpt 200, source key theo comment/recipient và rollback transaction**
- [ ] **Bước 2: Multi-select native đọc projection authorized; gửi ID tách khỏi text; validate trước INSERT; comment/history/mention trong cùng transaction; gõ `@name` đơn thuần không tạo mention**
- [ ] **Bước 3: Chạy event/collaboration/lint/build và commit `feat: notify selected comment mentions`**

### Task 9: Escalation tăng mức và access inbox

**File:** sửa history/constants/access-delivery cùng ba completion hook, QA/mirror đúng danh sách tiếng Anh.

**Interface:** chỉ `CHANGE_ROLE/APPLIED`, `REACTIVATE/APPLIED` vào inbox; suspend/revoke vẫn email-only.

- [ ] **Bước 1: RED upward/same/downward, dedupe assignee/current owner, PM Critical/Blocker, lower inbox-only, Critical/Blocker email, policy access/invitation/responsibility**
- [ ] **Bước 2: So sánh code-rank, không label; ghi access inbox từ đúng APPLIED audit trong transaction delivery**
- [ ] **Bước 3: Chạy matrix N3 tiếng Anh, commit `feat: notify material escalation and access events`, review, Draft PR, dừng**

## N4 — SLA, Overdue và digest

### Task 10: Scheduled discovery idempotent

**File:** tạo `scheduled.js`/QA/mirror; sửa notification/Bug protected service action và package.

**Interface:** protected `processNotificationSchedules(now)` và `discoverScheduledNotifications({tx,now})`.

- [ ] **Bước 1: RED clock cố định tại 3:59/4:00, 23:59/24:00, due-date cycle, closed exclusion, active PM, rerun no-op, deny caller sai**
- [ ] **Bước 2: Query bounded open candidates; insert source-keyed event/inbox/delivery một transaction; Critical/Blocker email nhanh, mức khác inbox/digest; giữ `processEmailOutbox` riêng**
- [ ] **Bước 3: Chạy scheduled/PM monitoring/outbox scheduler và commit `feat: discover notification sla and overdue events`**

### Task 11: Một digest cho recipient/date/type

**File:** tạo `digest.js`/mirror; sửa scheduled/worker/QA.

**Interface:** `buildDigestSnapshot(...)`, `processNotificationDigestDeliveries(...)` đúng signature tiếng Anh.

- [ ] **Bước 1: RED weekday 08:00 Bangkok, không weekend/empty, tách persona, top 20 + remainder, order, snapshot boundary, rerun unique, retry snapshot, HTML an toàn, một sender**
- [ ] **Bước 2: Dùng `Intl.DateTimeFormat` Bangkok; insert unique PENDING; chỉ exact unique violation là reuse; worker dùng chung sanitizer/backoff/claim/lock/sender và không thêm timer/provider**
- [ ] **Bước 3: Chạy matrix N4, commit `feat: add weekday notification digest`, review, Draft PR, dừng trước live schedule**

## N5 — Operations và retention

### Task 12: Digest diagnostic an toàn trong Operations

**File:** sửa exact User Administration CDS/handler/controller/view/i18n/version, QA/mirror đã liệt kê tiếng Anh.

**Interface:** DTO có `deliveryType='DIGEST'`; action `retryNotificationDigestDelivery(deliveryID,expectedModifiedAt)`.

- [ ] **Bước 1: RED auth trước read, mask recipient, cấm body/provider/lock/source, mixed order/filter, retry guards, conflict, audit và kick sau commit**
- [ ] **Bước 2: Reuse Operations table/detail/retry; chỉ map field an toàn; thêm label Digest; giữ invitation/access không đổi**
- [ ] **Bước 3: Chạy operations/UI/lint/build và commit `feat: show digest delivery diagnostics`**

### Task 13: Chỉ xóa inbox index hết hạn

**File:** sửa scheduled/QA/mirror.

**Interface:** `deleteExpiredInboxEntries({tx,now,retentionDays:90})`.

- [ ] **Bước 1: RED 89 ngày giữ, đúng boundary 90 chưa xóa tới khi cũ hơn, 91 xóa, read/unread như nhau, source count không đổi, batch 500, rerun no-op**
- [ ] **Bước 2: Select tối đa 500 ID cũ nhất rồi delete đúng các ID đó; không cascade source**
- [ ] **Bước 3: Chạy full N5 matrix tiếng Anh, commit `feat: retain notification inbox index for ninety days`, UI5/Fiori MCP, security scan, Ponytail review, exact-head review, Draft PR và dừng**

## N6 — Migration, rollout và acceptance có kiểm soát

### Task 14: Chuẩn bị package, chưa mutation

**File:** tạo hai evidence file N6, update roadmap/status.

**Interface:** nhận SHA N5 đã merge; xuất command/checksum/count/rollback/GO boundary chính xác.

- [ ] **Bước 1: Freeze, `btp:demo:check`, HANA dry deploy; chứng minh không destructive DDL/seed/unrelated artifact**
- [ ] **Bước 2: Tách approval cho HDI, backfill dry-run/execute, CAP UI deploy, schedule, browser/email/digest acceptance; không gộp DB và app mutation**
- [ ] **Bước 3: Giữ hourly recovery riêng; thêm discovery và digest 08:00; recovery cadence không làm evidence prompt email**
- [ ] **Bước 4: Commit `docs: prepare notification rollout acceptance` rồi dừng xin GO**

### Task 15: Chỉ execute sau approval migration và rollout riêng

**File:** chỉ evidence/PM; không sửa product source.

- [ ] **Bước 1: Chạy exact HDI command checksum-bound đã duyệt; readback schema/count trước-sau**
- [ ] **Bước 2: Chạy backfill dry-run rồi `--execute`; inserted phải khớp missing count, zero email/access-audit backfill**

```powershell
node scripts/db/backfill-notification-inbox.js
node scripts/db/backfill-notification-inbox.js --execute
```

- [ ] **Bước 3: Deploy exact artifact theo package đã duyệt, sau đó `npm run btp:demo:check`; PASS CAP/AppRouter 1/1, health/ready/Web 200, anonymous protected 401**
- [ ] **Bước 4: Lưu bốn UTC timestamp commit/outbox/immediate-attempt/provider-accept; attempt phải trước hourly recovery; controlled failure giữ đúng một PENDING row**
- [ ] **Bước 5: Acceptance caller-only/cross-user/reload/two-tab/mark-all/deep link cho Tester/Developer/PM, không mutate role để tạo persona**
- [ ] **Bước 6: Gọi schedule hai lần cùng business date; không empty/duplicate, top20+remainder đúng, retry snapshot và Operations không lộ raw field**
- [ ] **Bước 7: Chạy readiness/secret/deployed SHA, attach evidence và xin human closure; không tự duyệt Ready/release/cleanup**

```powershell
npm run btp:demo:check
npm run qa:secret-scan
git rev-parse origin/dev
```

### Ownership thực thi

Coordinator giữ SHA/model/auth/integration/security/commit/PR/migration/rollout/final report. Luna chỉ nhận một task cơ học tách biệt sau khi interface freeze: CDS/QA contract, UI module sau DTO freeze, i18n/test hoặc mirror/evidence. Luna không giữ authorization, live provider/scheduler/data, final review hoặc release. Mọi packet Luna phải có baseline/file/write/test/stop rõ và coordinator phải review, rerun trước khi nhận.
