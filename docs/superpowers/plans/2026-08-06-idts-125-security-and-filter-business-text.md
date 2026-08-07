# IDTS-125 Security and Filter Business Text Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate SangVN's IDTS-125 role/assignee security package, complete attachment deletion ownership and audit history, then replace UUID tokens in the Fiori List Report Filter Bar with business-readable text without changing database keys.

**Architecture:** Keep authorization authoritative in CAP and keep UUIDs as OData/HANA keys. Resolve PR #293 against current `dev`, enforce attachment delete ownership before any S3/HANA mutation, append audit history through existing history entities, and deliver the Filter Bar text correction in a separate Fiori-focused PR using `@Common.Text` metadata.

**Tech Stack:** SAP CAP Node.js, CDS/OData V4, SAP Fiori Elements/SAPUI5, SAP HANA Cloud/HDI, S3 attachment storage, XSUAA, Cloud Foundry, GitHub Actions.

## Global Constraints

- Current PR #293 head: `d6dd1f88ecc5cedc61a675f6a3b3086fa3517418`.
- PR #293 currently conflicts with `origin/dev` in `package.json` and `docs/knowledge/srv/bug-service/drafts.js.md`.
- DatDT has handed attachment authorization and delete audit/history ownership to SangVN under IDTS-125.
- Do not deploy HDI, run `cds deploy`, load seed data, migrate schema, or mutate mentor baseline Bugs.
- Do not replace UUID keys with names in persistence, OData requests, URLs, or dashboard navigation.
- CLOSED Bugs remain read-only; attachment mutation on CLOSED returns HTTP 409.
- No Jira transition, merge, deployment, or completion claim is delegated to a subagent.
- Any change to attachment ownership rules must update canonical business documents and the relevant knowledge mirrors.

### Provisional production finding to verify first

- Observed symptom: after an attachment is deleted, the attachment disappears but no corresponding delete entry is visible in the Bug History UI.
- Current status: `UNDER INVESTIGATION`; do not claim that logging is absent until both `HistoryEvents` and `HistoryLogs` are checked by read-only OData/HANA evidence.
- Required distinction: determine whether the backend never writes the audit event, writes it with the wrong action/type or Bug reference, or writes it correctly but the History UI fails to refresh/render it.
- Merge blocker: PR #293 must not be accepted until a successful controlled delete produces one visible and persistent sanitized audit event, or the existing event is proven and only the UI refresh/render defect is fixed.

### Required decision tree for attachment delete history

1. If `HistoryEvents` and `HistoryLogs` already contain the correct delete event but the Object Page does not show it, keep the backend contract unchanged and fix only the supported OData/UI5 refresh or presentation path.
2. If neither persistence table contains a delete event, implement a real backend audit append using the existing history helper and existing schema. The append must occur only after authorization succeeds and the intended attachment deletion succeeds.
3. If an event exists but has the wrong Bug, actor, action type, attachment reference, or summary, fix the event construction/mapping and add a regression for the incorrect field.
4. If duplicate events are written, make the handler append exactly once per successful deletion and add an idempotency/double-invocation regression.
5. Do not create a new history table, new CDS column, database migration, seed change, or UI-only fake history row for any branch of this decision tree.

---

## Delegation and review model

### Workstream A — IDTS-125 security integration

- Primary writer/integrator: DonHV.
- Subagent A1 — Terra/high, read-only: reconcile PR #293 with current CAP authorization contracts and identify unsafe merge choices.
- Subagent A2 — Luna/max, read-only: falsify attachment ownership, CLOSED behavior, S3/HANA side effects, and history assertions.
- Subagent A3 — Terra/high, read-only: inspect test coverage for PM, Tester, assigned Developer, non-assigned Developer, uploader, and non-uploader.
- Subagent A4 — Luna/max, read-only: exact-head final review after conflicts and findings are resolved.

### Workstream B — Filter Bar business text

- Primary writer/integrator: DonHV on a separate fresh branch after PR #293 merges.
- Subagent B1 — Terra/high, read-only: inspect OData metadata and identify the exact scalar properties missing text annotations.
- Subagent B2 — Luna/max, read-only: review the SAP Fiori navigation/filter design and reject any solution that replaces UUID keys or uses DOM/framework internals.
- Subagent B3 — Luna/max, read-only: exact-head metadata, UI, refresh, variant, and dashboard drill-down falsification.

All subagents use `fork_context:false`, receive a self-contained prompt, and are closed after primary review. Fast mode, if automatically enabled by tooling, is recorded as a limitation but does not replace primary verification.

---

### Task 1: Freeze source truth and record the ownership handoff

**Files:**
- Modify when implementation starts: `docs/pm/status/donhv.md`
- Modify when implementation starts: the IDTS-125 work-package file under `docs/pm/tasks/`
- Read: PR #293, Jira IDTS-125, current `origin/dev`

**Interfaces:**
- Consumes: DatDT-to-SangVN ownership handoff confirmed by DonHV.
- Produces: one authoritative scope statement for PR review and Jira evidence.

- [ ] Fetch `origin` and freeze `origin/dev`, PR #293 head, mergeability, and check results.
- [ ] Add a Jira comment to IDTS-125 stating that SangVN owns role/assignee authorization plus attachment deletion ownership and delete audit/history; DatDT no longer owns a competing runtime implementation.
- [ ] Record that the handoff does not authorize fake SangVN approval and does not permit changing execution evidence.
- [ ] Confirm the attachment policy before code changes:
  - uploader may delete their own attachment on an open Bug;
  - PM may delete any attachment on an open Bug for governance/recovery;
  - Tester and assigned Developer may upload, but may not delete another user's attachment;
  - non-assigned Developer may not mutate attachments;
  - CLOSED Bug attachment mutations return 409;
  - successful deletion appends auditable history, failed/denied deletion does not.
- [ ] If DonHV changes this policy, update the plan and Jira before implementation rather than inferring a different rule in code.

### Task 2: Synchronize PR #293 with current dev

**Files:**
- Resolve: `package.json`
- Resolve/regenerate: `docs/knowledge/srv/bug-service/drafts.js.md`
- Review: `srv/bug-service/drafts.js`
- Review: `srv/bug-service/permissions.js`
- Review: `srv/bug-service/content.js`
- Review: `srv/bug-service/read-models.js`
- Review: `srv/service.cds`
- Review: `srv/service.js`
- Review: `app/bug-management-ui/annotations/capabilities.cds`
- Review: `app/bug-management-ui/annotations/labels.cds`

**Interfaces:**
- Consumes: current `origin/dev` and PR #293 package.
- Produces: a conflict-free PR branch containing both current dashboard/runtime work and IDTS-125 security changes.

- [ ] Create a dedicated worktree for `fix/idts-125-bug-mutation-authorization-sangvn`; do not use the dirty/stale root worktree.
- [ ] Merge current `origin/dev` with a merge commit; do not rebase or force-push SangVN's branch.
- [ ] Resolve `package.json` by preserving every current `dev` QA script and adding only the non-duplicate IDTS-125 command.
- [ ] Regenerate or merge the drafts knowledge mirror from the resolved runtime source; do not choose the entire old or new mirror blindly.
- [ ] Run `git diff --check` and confirm no unrelated PM/evidence file was overwritten by conflict resolution.
- [ ] Commit the integration separately so SangVN's original commits remain attributable.

### Task 3: Write failing authorization and audit tests

**Files:**
- Modify: `scripts/qa/test-idts125-bug-mutation-authorization.js`
- Create or modify: focused attachment-delete test under `scripts/qa/`
- Modify: `package.json`

**Interfaces:**
- Consumes: attachment policy from Task 1.
- Produces: executable regression proving role, ownership, CLOSED, persistence, and audit behavior.

- [ ] Add failing tests proving an uploader Tester can delete their own attachment on an open Bug.
- [ ] Add failing tests proving an assigned Developer can delete their own attachment on an open Bug.
- [ ] Add failing tests proving Tester A cannot delete Tester B's attachment.
- [ ] Add failing tests proving assigned Developer cannot delete another user's attachment.
- [ ] Add failing tests proving a non-assigned Developer cannot upload/update/delete attachments.
- [ ] Add failing tests proving PM can delete an attachment on an open Bug.
- [ ] Add failing tests proving every role receives 409 for attachment mutation on a CLOSED Bug.
- [ ] Add failing tests proving successful deletion removes the intended metadata/object and appends one sanitized attachment-delete history event.
- [ ] Add failing tests proving 403/409/S3 failure leaves attachment metadata and history unchanged.
- [ ] Add a three-layer diagnostic assertion for the reported missing log: handler call, persisted `HistoryEvents`/`HistoryLogs` row, and History UI readback after refresh/reload.
- [ ] Run the focused tests and save the expected failures before implementation.

### Task 4: Implement attachment ownership before side effects

**Files:**
- Modify: `srv/bug-service/content.js`
- Modify only if needed: `srv/bug-service/permissions.js`
- Modify only if needed: `srv/bug-service/history.js` or the existing history helper used by attachment flows
- Modify: corresponding files under `docs/knowledge/srv/`
- Modify: `IDTS-Business-Rule.md`
- Modify: `IDTS-PROJECT-SCOPE-SAP01.md`
- Modify: `IDTS-SUMMARY.md`
- Modify: `docs/project-context.md`

**Interfaces:**
- Consumes: actor from `resolveRequestUser`, Bug status/assignee, attachment uploader identity, existing history helper.
- Produces: one backend authorization decision executed before S3/HANA deletion and one sanitized audit record after successful deletion.

- [ ] Load the Bug and attachment metadata before mutation and reject missing/inactive actors safely.
- [ ] Evaluate CLOSED status before role or ownership so CLOSED consistently returns 409.
- [ ] Permit PM override, otherwise require `attachment.uploadedBy_ID === actor.ID` and require assigned-Developer scope where the actor is a Developer.
- [ ] Reject unauthorized deletion before calling S3 or HANA mutation.
- [ ] If S3 deletion fails, keep HANA metadata/history unchanged and return a safe business error.
- [ ] After successful object deletion, delete only the selected metadata row and append an existing-schema HistoryEvent/HistoryLog describing filename, actor, and action without storing binary content or secret storage keys.
- [ ] Do not add a CDS entity, column, migration, seed, queue, or new dependency.
- [ ] Update the knowledge mirrors and canonical business wording to match the implemented rule.
- [ ] Run focused tests until all positive, negative, role, CLOSED, and failure-path cases pass.

### Task 5: Verify and merge PR #293

**Files:**
- Review: all files changed by PR #293 after synchronization.

**Interfaces:**
- Consumes: conflict-free security package and passing focused tests.
- Produces: merged, source-accurate IDTS-125 runtime baseline.

- [ ] Run CAP compile, UI5 lint/build, IDTS-125 focused suites, auth/session regressions, attachment/comment regressions, secret scan, agent rules, AI DevKit, and QA Depth self-test.
- [ ] Confirm PR branch is not behind `origin/dev`, is mergeable, and has fresh checks on the exact head.
- [ ] Have A4 independently falsify the exact head; primary accepts or rejects every finding explicitly.
- [ ] Update the PR/Jira with exact head, test totals, known limitations, and the DatDT-to-SangVN handoff.
- [ ] Merge normally without admin bypass only when no Critical/Major finding remains.
- [ ] Fetch `origin/dev` and prove the merge SHA is reachable.

### Task 6: Diagnose Filter Bar metadata on the merged baseline

**Files:**
- Read/modify: `app/bug-management-ui/annotations/list-report.cds`
- Read/modify: `app/bug-management-ui/annotations/value-helps.cds`
- Read: `app/bug-management-ui/webapp/ext/ListReportController.controller.js`
- Read: `srv/service.cds`
- Create/modify: focused Fiori metadata test under `scripts/qa/`

**Interfaces:**
- Consumes: dashboard navigation that supplies UUID filter keys.
- Produces: verified text-path map for every UUID-backed SelectionField.

- [ ] Search Jira for an existing Filter Bar UUID/text defect; update it or create a properly scoped FE issue if none exists.
- [ ] Query Fiori/UI5 MCP before editing annotations and record the supported text-annotation/navigation guidance.
- [ ] Add a failing metadata test for these mappings:
  - `applicationComponent_ID` to `applicationComponent.name`;
  - `reporter_ID` to `reporterDisplayName` or `reporter.displayName` according to actual metadata;
  - `assignee_ID` to `assigneeDisplayName`;
  - `nextProcessorUser_ID` to `currentActionOwnerDisplayName` or `nextProcessorUser.displayName` according to actual metadata.
- [ ] Assert `@Common.TextArrangement: #TextOnly` on the exact scalar property consumed by `UI.SelectionFields`.
- [ ] Assert dashboard navigation continues to filter by UUID, not by display name.

### Task 7: Implement Filter Bar business text in a separate PR

**Files:**
- Modify: `app/bug-management-ui/annotations/value-helps.cds`
- Modify only if needed: `app/bug-management-ui/annotations/list-report.cds`
- Modify: corresponding annotation knowledge mirrors
- Modify: focused metadata regression

**Interfaces:**
- Consumes: verified text paths from Task 6.
- Produces: human-readable filter tokens while preserving stable UUID filtering.

- [ ] Create a fresh branch named `fix/<jira-key>-filter-business-text-donhv` from the post-IDTS-125 `origin/dev`.
- [ ] Add `@Common.Text` and `@Common.TextArrangement: #TextOnly` to the exact UUID scalar fields used by the Filter Bar.
- [ ] Do not introduce formatter code, manual token replacement, DOM access, localStorage rewriting, or database changes.
- [ ] Keep the dashboard's UUID query parameters and `extensionAPI.setFilterValues(..., 'EQ', uuid)` behavior unchanged.
- [ ] Run metadata tests, CAP compile, UI5 lint/build, and existing dashboard auto-execute regression.

### Task 8: BTP rollout and browser acceptance

**Files:**
- Create: sanitized evidence under the relevant Jira evidence folders.
- Modify: `docs/pm/status/donhv.md`
- Modify: relevant work-package files.

**Interfaces:**
- Consumes: two merged PR SHAs.
- Produces: deployed and browser-verified security and presentation behavior.

- [ ] Run `npm run btp:demo:check`; use `npm run btp:demo:prepare` only if not READY.
- [ ] Deploy only affected service/UI/app-content modules; never deploy HDI or seed data.
- [ ] Verify HANA/HDI readiness, CAP/AppRouter 1/1, `/health` 200, `/ready` 200, anonymous protected API 401, and Web/XSUAA behavior.
- [ ] Test PM, Tester, assigned Developer, and non-assigned Developer attachment scenarios against controlled QA attachments.
- [ ] Verify denied deletion produces no S3/HANA/history mutation and successful deletion produces exactly one audit event.
- [ ] Verify the same delete event is visible in the History section immediately after supported refresh and remains visible after a hard reload; distinguish persistence failure from UI refresh/render failure.
- [ ] From PM Dashboard and Tester Dashboard, open every relevant tile and verify automatic execution still occurs.
- [ ] Verify Filter Bar tokens show business names instead of UUIDs for Application Component, Reporter, Assignee, and Current Action Owner.
- [ ] Verify URL/OData filters still carry UUID keys and refresh/back/saved variant preserve the correct filter.
- [ ] Capture sanitized screenshots/network statuses and read-only HANA history evidence; do not capture cookies, tokens, storage keys, private endpoints, or full personal emails.
- [ ] Run final Luna/max falsification, update Jira/PM handover, and close all subagents.

## Acceptance criteria

- PR #293 is conflict-free, current with `dev`, freshly verified, and normally merged.
- DatDT and SangVN no longer have competing ownership for attachment delete authorization/history.
- Unauthorized attachment deletion is blocked before S3/HANA mutation.
- Successful deletion follows the approved ownership policy and produces sanitized audit history.
- Attachment delete history is proven at handler, HANA/OData persistence, and History UI reload layers; an event that exists only in backend storage or only in transient UI state is not accepted.
- CLOSED attachment mutation always returns 409.
- Filter Bar shows names/labels, not UUID tokens, while backend filtering remains UUID-based.
- PM and Tester dashboard tile drill-down remains automatically executed and correctly filtered.
- No HDI deploy, schema migration, seed load, broad `cds deploy`, or mentor Bug reset occurs.
- No fake human approval, secret leakage, or unsupported SAPUI5 workaround is introduced.
