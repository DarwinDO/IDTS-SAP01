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
- [x] Expired XSUAA sessions are detected for both UI5 XHR and Dashboard `fetch()` OData calls only after the initial `AuthService.me` succeeds.
- [x] Session recovery performs one top-level reload and never replays a failed comment/upload write.
- [x] Compiled CDS metadata contains exactly one plugin-owned attachment facet with ID `attachments_attachments`.
- [x] HTML5 application/package version is aligned at `0.0.3` to invalidate the
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
## Post-deployment browser diagnosis — 2026-08-03

- Controlled file: `idts-116-browser-evidence.txt`; SHA-256 `046C17DABAA0BDA53A4CC3CE8217B3E8645FE90E12CEC3309A3B40BD1D68B821`.
- Baseline/deploy SHA: `511e1a09fc28195c46dd665ec499591d1645ac5a`.
- The first comment/upload attempt was invalidated by an expired AppRouter/XSUAA session (`$batch` outer HTTP 401); the request did not reach CAP.
- Fresh-session retry reached the generated `@cap-js/attachments` facet, displayed the draft file row, completed Save/activation and persisted the active attachment.
- HANA readback found the active attachment row for `BUG-0019`; active navigation and S3-backed content GET returned HTTP 200 with the controlled 193-byte file. The earlier empty browser snapshot was not an attachment-persistence defect.
- A fresh-session `addComment` action returned inner HTTP 200 and persisted, but the relative `comments` list did not refresh because it lacked UI5 `$$ownRequest`.
- SAP-standard correction: declare `$$ownRequest: true` for the relative comments binding and use a one-shot top-level XSUAA recovery on OData 401. Never replay a failed write automatically.
- Remaining browser proof: immediate comment-feed update, reload persistence, attachment download SHA-256, delete and reload absence.

## Active attachment reload correction — 2026-08-04

- BTP readback disproved persistence loss: active navigation, Fiori-shaped navigation and parent `$expand` each returned HTTP 200 with both attachment rows.
- CF access logs showed that the active Object Page hard reload did not initiate an attachment navigation request; draft attachment navigation still requested and rendered correctly.
- `@cap-js/attachments` plugin source confirms that an application-declared facet targeting `attachments/@UI.LineItem` prevents generation of the standard `attachments_attachments` facet.
- The application-owned facet and attachment table override were removed. The plugin now owns the generated facet and table lifecycle.
- RED test failed while the competing facet remained; GREEN test confirms exactly one compiled plugin-owned facet.
- Local verification PASS: IDTS-116, IDTS-73, comment/attachment programmatic QA, CAP compile, UI5 production build and manifest schema validation.
- BTP browser acceptance remains mandatory after normal PR merge and selective UI/app-content rollout. No HDI, database deploy or seed operation is permitted.

## Local remediation verification — 2026-08-03

- Red tests reproduced both missing contracts before implementation: `$$ownRequest` was absent and no mid-session XSUAA OData 401 recovery existed.
- `qa:idts116:programmatic`: PASS.
- `qa:idts117:btp-relogin`: PASS.
- IDTS-117 behavioral VM coverage: XHR and `fetch()` OData 401 each trigger exactly one reload; a successful bootstrap clears the stale recovery guard.
- `qa:comments-attachments:programmatic`: PASS.
- CAP compile: PASS.
- UI5 production build: PASS.
- Secret scan, agent rules, QA Depth self-test, AI DevKit and `git diff --check`: PASS.
- Focused full-file ESLint is not an accepted gate for this legacy pre-bootstrap auth bridge because it reports pre-existing global/session-storage policy findings and repository CRLF conversion. The supported UI5 production build and focused behavior checks pass; no lint rule was disabled in source.
