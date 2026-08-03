# IDTS-116 — Restore BTP comment and attachment writes with SAP-standard controls

## Status

In Progress — post-deployment root causes are confirmed and the SAP-standard
follow-up passes local regression; PR review, selective HTML5/AppRouter rollout
and browser acceptance remain.

## Context

On SAP BTP, posting a comment and uploading an attachment from the Bug Object
Page failed before the request reached CAP. The retired custom implementation
used raw browser requests behind an AppRouter route with CSRF protection
enabled, so write requests without a valid CSRF token were rejected with HTTP
403. A transient HANA connection timeout was observed separately and is not the
root cause of these two write failures.

## Scope

- Submit comments through the existing bound OData V4 action
  `BugService.addComment` using the UI5 OData V4 model.
- Replace the custom attachment uploader and browser-memory queue with the
  standard Fiori Elements attachment facet generated from
  `@cap-js/attachments`.
- Preserve the existing CAP authorization, validation, draft lifecycle, HANA
  metadata persistence and S3 binary storage.
- Update focused regression tests, knowledge mirrors and SAP490 structured
  source wording.

## Out of scope

- Disabling AppRouter CSRF protection.
- Adding a second CSRF-token implementation in custom JavaScript.
- Changing OData contracts, CDS/HANA schema, S3 provider or business workflow.
- Deploying the database module, loading seed data or resetting HANA.
- Regenerating or synchronizing SAP490 workbooks in this runtime-fix PR.

## Acceptance criteria

- [x] Comment submission uses `ODataContextBinding.invoke()` on
  `BugService.addComment` and contains no raw write request.
- [x] The custom attachment fragment, pending browser queue and manual
  draft-activation orchestration are removed.
- [x] The standard generated attachment facet is visible on the Object Page.
- [x] Existing comment authorization and validation remain backend-enforced.
- [x] Focused IDTS-116 and attachment regressions pass locally.
- [x] CAP compile and UI5 production build pass.
- [x] Comment invocation uses the model's normal update group so UI5 manages
  batching and CSRF instead of issuing a direct operation request.
- [x] The comments list uses Promise-returning `requestRefresh()`; a committed
  action cannot be misreported as failed because a non-Promise refresh was awaited.
- [x] Comment action success is separated from the comments-list refresh result.
- [x] A synchronous `requestRefresh()` throw is normalized into the refresh-warning path and cannot be misreported as an action failure.
- [x] Compiled CDS metadata contains exactly one attachment facet.
- [x] HTML5 application/package version is aligned at `0.0.2` to invalidate the
  stale cached manifest that still registered `IdtsAttachmentsCustom`.
- [x] AppRouter applies no-store/revalidation policy to HTML5 entry assets so
  future app-content changes are not hidden behind a stale browser manifest.
- [ ] PR passes the fresh QA Depth Gate and merges normally into `dev`.
- [ ] The exact merge SHA is selectively deployed without HDI/database deploy.
- [ ] Comment post → reload → persisted comment/history passes on BTP.
- [ ] Attachment upload → save → reload → download/hash → delete passes on BTP.
- [ ] Browser Network/Console evidence contains no token, cookie, credential or
  raw private endpoint.

## Verification completed locally

- `npm run qa:idts116:programmatic`: PASS.
- `npm run qa:idts73:programmatic`: PASS.
- `npm run qa:idts56:programmatic`: PASS (14/14).
- `npm run qa:comments-attachments:programmatic`: PASS.
- CAP compile: PASS with the pre-existing plugin annotation warning.
- UI5 targeted lint and production build: PASS.
- Secret scan, agent rules and depth self-test: PASS; depth self-test 15/15.
- AI DevKit lint: PASS 5/5.
- `git diff --check`: PASS with line-ending warnings only.
- Post-deployment diagnostic: the old `invoke("$direct")` request returned HTTP
  403 before CAP because it did not carry a CSRF token; HANA readback confirmed
  no comment persistence.
- Post-deployment diagnostic: BTP metadata and local compiled CDS each expose
  one attachment facet, while the browser loaded the old manifest from disk
  cache. The duplicate tab was therefore stale app content, not duplicate CDS.

## Known limitations and evidence status

- A local browser run cannot be treated as BTP acceptance because the isolated
  worktree has no initialized local authentication/database fixture and this
  task explicitly forbids database deploy or seed loading.
- BTP browser evidence is therefore pending until after normal PR merge and
  selective runtime/UI rollout.
- The compile warning for `NonUpdateableProperties` comes from the existing
  attachment plugin annotation and is tracked as a pre-existing warning, not a
  failure introduced by this change.

## Dependencies and security

- Jira: IDTS-116, related to attachment baseline IDTS-73 and UAT findings under
  IDTS-111.
- No API key, password, token, cookie, database URL or private endpoint may be
  committed, printed in evidence or copied to Jira.
- Canonical business documents require no change because roles, workflow and
  business behavior are unchanged; only the supported UI/OData implementation
  path is corrected.
