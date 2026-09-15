# IDTS-127 Final UAT Cases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete UAT-ATT-007 with an exact HTTP 403 live result and complete UAT-EMAIL-002 with an isolated one-shot provider failure, bounded retry, and evidence-backed live readback.

**Architecture:** Keep attachment execution separate from source changes. For email, wrap the existing provider sender at the worker boundary with an opt-in, exact-token, process-local fail-once seam; the normal outbox remains responsible for FAILED state, attempt count, retry timing, and later delivery. The seam is disabled by default and never changes provider credentials.

**Tech Stack:** SAP CAP Node.js, SAP HANA Cloud, SAP BTP Cloud Foundry, Node `assert`, SAPUI5/Fiori, existing evidence-card renderer.

**Spec:** Bounded design approved in chat on 2026-09-15; catalog definitions are `UAT-ATT-007` and `UAT-EMAIL-002` in `docs/qa/idts-111-uat-catalog.json`.

## Global Constraints

- All subagents use `gpt-5.6-luna` with reasoning effort `max` and may not dispatch their own subagents.
- Preserve the supported attachment flow: Fiori `Edit` -> draft attachment mutation -> `Save`; direct active attachment writes remain HTTP 405.
- UAT-ATT-007 is PASS only when the actual draft DELETE returns HTTP 403 and authorized readback proves metadata and binary unchanged.
- The UAT-ATT-007 Developer must own the edit draft but must not be the attachment uploader.
- Email fault injection is disabled by default, requires an explicit enable flag plus an exact token of at least 16 characters, fails only the first matching message per application process, and does not expose an OData control action.
- The injected error code is `EMAIL_UAT_FORCED_FAILURE`; stored and displayed summaries remain sanitized.
- Do not change provider credentials, database schema, migrations, seed data, dependencies, or UI source.
- Source work occurs only on `fix/idts-127-email002-fault-injection-donhv`; evidence remains on `docs/wp7-n2-rollout-evidence-donhv`.
- Never stage or edit `docs/pm/status/nhant.md` or unrelated untracked evidence.
- Browser agents must identify browser family, profile, tab, account, and role before mutation and release browser control when finished.

---

### Task 1: One-shot email provider failure seam

**Files:**
- Create: `srv/email/uat-fault.js`
- Modify: `srv/email/config.js`
- Modify: `srv/email/worker.js`
- Modify: `srv/email/outbox.js`
- Test: `scripts/qa/test-email-uat-fault.js`
- Modify: `package.json` only if a focused test script is necessary

**Interfaces:**
- Consumes: normalized email config and the existing `message => batchSender.sendMail(message)` provider boundary.
- Produces: `wrapEmailSenderForUat(config, sendMail)` returning an async send function with transparent pass-through except the first exact-token match.

- [ ] **Step 1: Write the failing test**

Add a Node `assert` test that proves: disabled mode passes through; nonmatching text passes through without consuming; first exact-token match rejects with code `EMAIL_UAT_FORCED_FAILURE` without calling the provider; the second exact-token match calls the real delegate; short tokens are ignored; normalized config does not enable the seam by default.

- [ ] **Step 2: Run the focused test and verify RED**

Run `node scripts/qa/test-email-uat-fault.js`. It must fail because `wrapEmailSenderForUat` or the normalized fields do not exist, not because of syntax or fixture errors.

- [ ] **Step 3: Implement the minimum seam**

Normalize `uatFailureEnabled` and `uatFailureToken` in `srv/email/config.js`. In the new module, require enablement and a trimmed token length of at least 16, match the exact token only in `message.text`, and remember consumption in process memory. Throw an error with code `EMAIL_UAT_FORCED_FAILURE` before the provider call on the first match. Wrap only the notification `sendMail` passed to `processEmailDeliveries`; do not alter onboarding/access email paths.

- [ ] **Step 4: Sanitize the controlled error**

Map `EMAIL_UAT_FORCED_FAILURE` to the generic summary `Email delivery failed in the controlled UAT check.` in the existing outbox sanitizer. Do not persist the token or raw error text.

- [ ] **Step 5: Verify GREEN and regressions**

Run `node scripts/qa/test-email-uat-fault.js`, `node scripts/qa/test-email-outbox-programmatic.js`, `node scripts/qa/test-email-immediate-kick.js`, `node scripts/qa/test-email-brevo-api-integration.js`, `npm run qa:secret-scan`, and `git diff --check`.

- [ ] **Step 6: Commit**

Stage only the Task 1 files and commit `test(idts-127): add isolated email failure seam`.

### Task 2: Review, integrate, and deploy the email seam

**Files:**
- Review the exact Task 1 diff; no new scope.

**Interfaces:**
- Consumes: Task 1 commit and focused test evidence.
- Produces: reviewed source commit merged to `dev` and CAP-only deployment; no database deployment.

- [ ] **Step 1: Independent review**

Verify default-off behavior, exact-token isolation, one-shot semantics, notification-only scope, retry compatibility, sanitized diagnostics, and absence of schema/provider-credential changes.

- [ ] **Step 2: Run source gate**

Re-run the focused and regression commands from Task 1 at the reviewed head.

- [ ] **Step 3: Create and merge the source PR**

Push the feature branch, create a Draft PR, wait for required checks, obtain review, mark ready, and merge only with no Critical/Important findings.

- [ ] **Step 4: CAP-only rollout**

Deploy the merged CAP source without database/schema/migration/seed deployment. Set a unique non-secret `IDTS_EMAIL_UAT_FAILURE_TOKEN` and enable flag only for the controlled run; restore both settings immediately after evidence capture.

- [ ] **Step 5: Readiness check**

Run `npm run btp:demo:check` and require `DEMO READY` before UAT execution.

### Task 3: Execute and package UAT-ATT-007

**Files:**
- Create/update only `docs/pm/evidence/idts-111/live-uat-20260915/<actor>/UAT-ATT-007-current/**` on the existing evidence branch.

**Interfaces:**
- Consumes: an active assigned Bug; attachment uploaded and saved by NhanT; DatDT as assigned Developer.
- Produces: exact HTTP 403 receipt, before/after/reload readback, runtime screenshot, correct vertical summary card, hashes, and manifest.

- [ ] **Step 1: Prove preconditions before mutation**

Record browser family/profile/tab, NhanT Tester identity, DatDT Developer identity, Bug ID/number/status, DatDT assignment, and absence of an open foreign draft.

- [ ] **Step 2: Create the ownership-mismatch fixture**

As NhanT, use Fiori `Edit`, upload one uniquely named small text file, and `Save`. Record attachment ID, uploader, metadata, binary SHA-256, and active readback.

- [ ] **Step 3: Attempt exactly one unauthorized draft deletion**

As DatDT, open the same Bug with `Edit`. Confirm the draft belongs to DatDT and contains the NhanT-uploaded attachment. Delete it once through the UI and capture the actual DELETE request and HTTP 403 response. Do not retry with a different path.

- [ ] **Step 4: Preserve and verify state**

Discard the DatDT draft. Reload as NhanT or PM and prove the attachment metadata, byte length, content hash, Bug status, and business History remain unchanged by the rejected delete.

- [ ] **Step 5: Package evidence**

Generate the approved white vertical `Complete atomic evidence` card with Result, Executor `NhanT (DonHV support)`, Test definition, Observed assertions, Persistence readback, Transport proof, Provenance, and Runtime screenshot. Validate JSON, image dimensions/nonblank content, hashes, secret scan, and `git diff --check`; commit only the case folder to the existing evidence branch.

### Task 4: Execute and package UAT-EMAIL-002

**Files:**
- Create/update only `docs/pm/evidence/idts-111/live-uat-20260915/<actor>/UAT-EMAIL-002-current/**` on the existing evidence branch.

**Interfaces:**
- Consumes: deployed Task 2 seam, one unique token, a controlled Bug workflow that generates one notification delivery.
- Produces: workflow/History baseline, FAILED attempt readback, retry readback, final reload, safe transport proof, runtime screenshot, correct card, hashes, and manifest.

- [ ] **Step 1: Prove preconditions**

Record the actor/session, controlled Bug state, baseline History/Notification/Delivery counts, unique token, and configured one-shot seam without recording credentials or environment secrets.

- [ ] **Step 2: Trigger one workflow action**

Perform exactly one valid Bug lifecycle action whose notification text contains the unique token. Prove the Bug transaction and one business History event committed.

- [ ] **Step 3: Observe controlled failure**

Read the associated delivery and prove `FAILED`, `attemptCount = 1`, sanitized `EMAIL_UAT_FORCED_FAILURE`, and a bounded `nextAttemptAt`; prove unrelated delivery rows were not affected.

- [ ] **Step 4: Observe retry and reload**

After eligibility, invoke or wait for the supported outbox processor once. Prove the same delivery advances without creating a second business History event, then reload the Bug and delivery read models.

- [ ] **Step 5: Disable the seam and package evidence**

Unset the enable flag and token, restage/restart only if required, rerun readiness, and generate the approved white vertical card plus sanitized receipts/readbacks/runtime screenshot. Validate JSON, hashes, image, secret scan, and `git diff --check`; commit only the case folder to the existing evidence branch.

### Task 5: Synchronize final UAT truth

**Files:**
- Modify the canonical UAT catalog/Test Result source only after Tasks 3 and 4 have verified PASS evidence.
- Regenerate only approved summary artifacts; do not alter the workbook unless explicitly requested.

**Interfaces:**
- Consumes: reviewed ATT-007 and EMAIL-002 evidence manifests.
- Produces: current statuses/evidence IDs that no longer report either case as PREPARED/BLOCKED/DOES_NOT_MEET.

- [ ] **Step 1: Update execution truth**

Set each case to PASS only from its verified manifest and exact evidence paths. Preserve the case definitions and expected results.

- [ ] **Step 2: Verify consistency**

Check catalog counts, unique case IDs, existing evidence paths, manifest hashes, no `Review` field, executor spelling, and no stale superseded result used as current truth.

- [ ] **Step 3: Commit and push evidence**

Stage only approved catalog/summary and evidence files on `docs/wp7-n2-rollout-evidence-donhv`, commit, push, and verify local/remote equality.
