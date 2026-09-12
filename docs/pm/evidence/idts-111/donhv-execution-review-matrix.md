# IDTS-111 DonHV UAT execution review matrix

## Review baseline

- Candidate PR: `#270`.
- Historical reviewer baseline: `44721f53fe2f7588d38f6d6c79ffb0c33026d5d3`; latest curation source baseline: `4ab336388fb744b82abdfe6ef8f7c334b4075428`.
- Execution baseline: `fbea12cd996d8c1e13bd834fd6e054c8a37c32e6`.
- Deployed runtime: `67b1bf86169e9696c9365ef4846b99ffae30d4e2`.
- Final-approved `UAT-COM-003` readback remains bound to PR #405 source head `e3c8977cbdd981c90133e8e4c27fc8d7b6f44d34` and approved source/deployed merge `54ad1b824d74f57e5d1a6e9dbd6208cd80768d8b`; `UAT-UX-003` is final-approved from DonHV's 2026-09-12 physical-keyboard attestation. `UAT-ATT-001..003` are final-approved from the exact 118-byte controlled upload/download/delete chain completed on 2026-09-13 against the same deployed merge.
- Reviewer: DonHV, with independent read-only agent reviews used only as advisory input.
- Evidence integrity after the attachment closure: 44 manifests, 82 evidence references and 72 unique hashes, with zero missing files or hash mismatches in the fresh curation check. The forward planning catalog contains 77 cases. The final exact-head gate is still required after commit.

`ACCEPTED_EVIDENCE` means that the submitted evidence truthfully supports the observed result. It does not mean that a blocked case passed, that a product defect is fixed, or that the final UAT workbook is approved.

## Case-by-case disposition

| Case | Candidate result | DonHV disposition | Classification / next action |
|---|---|---|---|
| UAT-AI-001 | MEETS | ACCEPTED_EVIDENCE | Positive Similar Bugs review-only evidence. |
| UAT-AI-002 | BLOCKED | ACCEPTED_BLOCKER | Prepare an accepted suggestion and controlled candidate before rerun. |
| UAT-AI-004 | MEETS | ACCEPTED_EVIDENCE | Positive Classification review-only evidence. |
| UAT-AI-005 | DOES_NOT_MEET | NEEDS_TARGETED_RERUN | Insufficient response/audit evidence to distinguish stale suggestion, validation denial, or integration defect; capture suggestion ID and sanitized HTTP status under IDTS-115. |
| UAT-AI-007 | BLOCKED | ACCEPTED_BLOCKER | Requires a controlled persisted comment after IDTS-116 is resolved. |
| UAT-AI-008 | DOES_NOT_MEET | CATALOG_MISMATCH | Handoff shows stored user while Object Page shows business role/queue label; revise expectation to compare like-for-like semantics. |
| UAT-AI-009 | DOES_NOT_MEET | ENVIRONMENT_SESSION_BLOCKER | Protected AssignableDevelopers read returned 401 while the page remained open; rerun with Network evidence under IDTS-114/115. |
| UAT-AI-010 | DOES_NOT_MEET | CATALOG_MISMATCH | Consolidated Reject and Ignore variants both returned to Pending after reload. Prove persistence against each original immutable suggestion ID rather than expecting a newly generated dialog to retain the old decision. |
| UAT-ATT-001 | MEETS | FINAL_PASS_APPROVED | Exact 118-byte controlled fixture survived Edit/Upload/Save and hard reload; one Added attachment History event was recorded and Bug fields were unchanged. Historical 44/54/47-byte evidence remains preserved. |
| UAT-ATT-002 | MEETS | FINAL_PASS_APPROVED | Authenticated download completed at 118 bytes and its SHA-256 exactly matched the upload fixture; Chrome's `(9)` suffix was local collision handling only. |
| UAT-ATT-003 | MEETS | FINAL_PASS_APPROVED | Supported Edit/Delete/Save removed the exact fixture; reload showed zero attachments, History added one Delete event, and authenticated stale-content GET returned HTTP 404. |
| UAT-ATT-006 | MEETS | ACCEPTED_EVIDENCE | Safe failure and no orphan metadata were demonstrated. |
| UAT-AUTH-001 | MEETS | ACCEPTED_EVIDENCE | Mapped Tester XSUAA session and protected app access demonstrated. |
| UAT-AUTH-005 | MEETS | ACCEPTED_EVIDENCE | Current rerun shows logout ended the session and reopening the protected route redirected to SAP Sign In. The earlier blank-route result remains historical evidence under IDTS-117. |
| UAT-BUG-001 | MEETS | ACCEPTED_EVIDENCE | Create without assignee and Pending Assignment persistence demonstrated. |
| UAT-BUG-002 | MEETS | ACCEPTED_EVIDENCE | Create with assignee and reload persistence demonstrated. |
| UAT-BUG-003 | MEETS | ACCEPTED_EVIDENCE | Required Title validation demonstrated. |
| UAT-BUG-004 | MEETS | ACCEPTED_EVIDENCE | Required Description validation demonstrated. |
| UAT-BUG-006 | MEETS | ACCEPTED_EVIDENCE | Reproduction fields persisted after Create/reload. |
| UAT-BUG-007 | MEETS | ACCEPTED_EVIDENCE | Discarded draft did not create an active Bug. |
| UAT-BUG-008 | DOES_NOT_MEET | CONFIRMED_PRODUCT_DEFECT | One draft save can hit draft-save and generic active UPDATE audit paths, matching the duplicate Edit evidence; tracked by IDTS-119. |
| UAT-BUG-009 | MEETS | ACCEPTED_EVIDENCE | Back/forward navigation preserved isolated draft state. |
| UAT-CLS-001 | MEETS | ACCEPTED_EVIDENCE | Compatible active value-help entries demonstrated. |
| UAT-CLS-002 | MEETS | ACCEPTED_EVIDENCE | Smart Assign selection and reload persistence demonstrated. |
| UAT-CLS-004 | MEETS | ACCEPTED_EVIDENCE | Description-only edit did not mutate classification/ownership. |
| UAT-COM-001 | MEETS | ACCEPTED_EVIDENCE | Current rerun shows one controlled Tester comment persisted after reload. The earlier safe posting failure is retained as historical IDTS-116 evidence. |
| UAT-COM-002 | MEETS | ACCEPTED_EVIDENCE | Empty-comment validation demonstrated. |
| UAT-COM-003 | MEETS | FINAL_PASS_APPROVED | Current UI-only runtime accepted the exact 1000-character marker once and rejected the exact 1001-character marker with CAP HTTP 400; read-only reload confirms two comments, marker counts 1/0, and no truncated or partial persistence. The pre-fix 1006-character failure remains preserved in the manifest. |
| UAT-COM-004 | MEETS | ACCEPTED_EVIDENCE | Current rerun stripped markup, persisted safe content, and showed no XSS console marker. |
| UAT-LIFE-001 | BLOCKED | MEMBER_IDENTITY_BLOCKER | Requires the authorized current processor. |
| UAT-LIFE-002 | BLOCKED | MEMBER_IDENTITY_BLOCKER | Requires Developer identity. |
| UAT-LIFE-003 | BLOCKED | FIXTURE_IDENTITY_BLOCKER | Requires an In Review record owned by the authenticated actor. |
| UAT-LIFE-004 | BLOCKED | FIXTURE_IDENTITY_BLOCKER | Requires a Need More Information record and authorized actor. |
| UAT-LIFE-005 | BLOCKED | FIXTURE_IDENTITY_BLOCKER | Requires an In Review record and authorized actor. |
| UAT-LIFE-008 | BLOCKED | FIXTURE_IDENTITY_BLOCKER | Requires a Resolved record and authorized actor. |
| UAT-LIFE-009 | BLOCKED | FIXTURE_BLOCKER | Requires a separate Retest Required record for a valid-note run. |
| UAT-LIFE-010 | MEETS | ACCEPTED_EVIDENCE | Reopen and reload persistence demonstrated. |
| UAT-LIFE-014 | DOES_NOT_MEET | CATALOG_MISMATCH | Current `closeBug` contract does not require a reason; revise catalog or make a separate approved business-rule change. Do not label current behavior a product defect. |
| UAT-LIFE-015 | BLOCKED | FIXTURE_IDENTITY_BLOCKER | Requires a NhanT-owned Rejected record with correction flow. |
| UAT-UX-001 | MEETS | ACCEPTED_EVIDENCE | Desktop readability/reachability demonstrated. |
| UAT-UX-002 | DOES_NOT_MEET | PARTIAL_RECHECK | Local deterministic 834 x 1112 regression is PASS; live Similar Bugs (5 candidates), Classification (5 rows / HTTP 200) and Handoff UI are positive. Smart Assignment returned one candidate with no retry, and Handoff matching transport telemetry was unavailable, so the case remains PARTIAL and not final-approved. |
| UAT-UX-003 | MEETS | FINAL_PASS_APPROVED | DonHV physically confirmed visible focus; Tab reaches Find Similar Bugs/core controls and dialog actions; Enter opens Similar Bugs; arrow keys navigate the composite list; Escape closes; focus returns to the trigger. The prior Browser automation limitation and E01 screenshot remain historical. |
| UAT-UX-004 | MEETS | ACCEPTED_EVIDENCE | Safe error copy/no raw diagnostic demonstrated. |
| UAT-UX-005 | MEETS | ACCEPTED_EVIDENCE | Reload/idempotent committed state demonstrated. |

## Review totals

- Current candidate partition is **27 MEETS / 7 DOES_NOT_MEET / 10 BLOCKED** across 44 retained manifests. Exactly `UAT-COM-003`, `UAT-UX-003`, and `UAT-ATT-001..003` are final UAT PASS approved; the other 39 cases remain candidate evidence, corrections, or blockers and are not final-approved.
- ATT-001's historical inconsistent fixture records remain visible, while the final result is bound to one exact 118-byte fixture and SHA-256 across upload, download and delete.
- Only `UAT-AI-007` retains the stale-prerequisite curation category after the attachment reruns.
- AI-005/009 still need immutable suggestion ID plus sanitized Network/audit evidence; UX-002 remains PARTIAL because Smart Assignment returned one candidate without retry and Handoff matching transport telemetry was unavailable. UX-003's physical sequence is human-attested; its historical Browser automation limitation remains preserved.

## Gate decision

The retained IDTS-111 evidence package is internally consistent. Exactly `UAT-COM-003`, `UAT-UX-003`, and `UAT-ATT-001..003` are final PASS approved; the remaining 39 cases must not be interpreted as final UAT approval. Merge remains gated by a fresh exact-head QA gate and by the PR body preserving the candidate/blocker truth above. The UAT workbook and Google Drive artifact remain unchanged.

## Current rerun state

NhanT recorded the required acknowledgment in the repository and Jira comments `10908`/`10909`. The attachment chain now has current-runtime final PASS evidence using one exact controlled 118-byte fixture; its older inconsistent/failing records remain historical. AI-005/009 still need immutable suggestion ID and sanitized Network/audit evidence; UX-002 remains PARTIAL with one-candidate Smart Assignment coverage and unavailable Handoff matching transport telemetry. The workbook and Drive artifact remain unchanged.

### 2026-09-13 UAT attachment lifecycle closure

- `UAT-ATT-001`: Edit/Upload/Save plus hard reload retained one exact 118-byte `text/plain` fixture and added one History event.
- `UAT-ATT-002`: the Chrome download was 118 bytes and SHA-256 `5EF00CD5CE956BF488F16BEEC5E54E97B9CF2F8CB6C60C318D5F74D98E1BA51D`, exactly matching the source fixture.
- `UAT-ATT-003`: Edit/Delete/Save plus hard reload removed the UI entry; History increased by one Delete event and same-session authenticated GET of the old content reference returned HTTP 404.
- Three full-height mentor cards and three structured receipts are hash-tracked. The cards display only Case 39/40/41, name the catalog file, use executor `NhanT (DonHV support)`, and contain no review-status label.

### 2026-08-04 current-runtime addendum

This historical 2026-08-04 addendum records deployed reruns that superseded the old-runtime behavior for `UAT-COM-001`, `UAT-AUTH-005`, and `UAT-COM-003`, which were current candidate PASS at that point; `UAT-UX-003` was then a physical-keyboard handoff. The current 2026-09-12 UX003 closure is recorded below, while the historical Browser automation limitation remains preserved. Its structured COM003 read-only receipt records the post-reload Comments count and marker counts, while the pre-fix 1006-character failure remains historical. `UAT-ATT-001` and `UAT-BUG-008` remain candidate failures with fresh evidence. `UAT-COM-004` passes sanitization/no-execution, `UAT-UX-002` is only partially rechecked, and `UAT-AI-005` still lacks the immutable suggestion ID and sanitized Network response required for diagnostic closure. DonHV still owns final disposition and workbook/Drive synchronization.

### Latest DoNHV comment 10962 remediation (2026-08-04)

- Current reviewer partition is **23 MEETS / 11 DOES_NOT_MEET / 23 BLOCKED** across 57 manifests. `UAT-COM-003` is final PASS approved; no other case is final-approved.
- Fresh current-runtime PNGs now document `UAT-AUTH-005` signed-out confirmation plus protected-route SAP Sign In redirect, and `UAT-BUG-008` duplicate History rows.
- `UAT-ATT-001` remains NhanT's candidate negative, but DonHV disposition is **BLOCKED — fixture provenance inconsistent**. The raw 44/54/47-byte records are intentionally unchanged pending member reconciliation.
- Remaining human/diagnostic gaps are explicit: AI immutable suggestion ID/Network response, a matching UX-002 wrapping fixture, and NhanT physical-keyboard confirmation for UX-003.
- Machine-readable curation uses Jira comment `10962`, source baseline `4ab336388fb744b82abdfe6ef8f7c334b4075428`, 57 manifests, 81 evidence references and 68 unique hashes. The final-approved receipts are `uat/UAT-COM-003/05-live-readback-receipt.json` and `uat/UAT-UX-003/02-manual-physical-keyboard-attestation.json`; the new UAT-UX-002 receipt is PARTIAL and not an approval artifact. Final commit SHA is recorded in the PR/Jira handoff after commit to avoid self-referential metadata.

### 2026-09-12 UAT-UX-003 physical-keyboard closure

- DonHV manually executed the seven attested outcomes on the deployed runtime truth already recorded in the baseline (`67b1bf86169e9696c9365ef4846b99ffae30d4e2`): visible focus; Tab reaches Find Similar Bugs/core controls; Enter opens Similar Bugs; arrows navigate the composite list; Tab reaches dialog actions; Escape closes; focus returns to trigger.
- The new receipt `uat/UAT-UX-003/02-manual-physical-keyboard-attestation.json` is bound to current source baseline `4ab336388fb744b82abdfe6ef8f7c334b4075428`, receipt SHA-256 `F1B9CA7548E46EFA1A8AB9C1310134090F53AA599A8742D7D60D13DE0B25C858`, and the existing E01 PNG/hash. No browser simulation, device/timestamp invention, or raw keylog is claimed; the former Browser failure remains under `historicalAutomationLimitation`.
- Current truth is **24 MEETS / 10 DOES_NOT_MEET / 23 BLOCKED**; exactly `UAT-COM-003` and `UAT-UX-003` are final-approved. Workbook, Drive, Jira, runtime, database, provider and live data remain unchanged.

### 2026-09-12 UAT-UX-002 partial evidence integration

- The current UAT-UX-002 execution is by `NhanT (DonHV support)` in the DonHV PM session at viewport `834 x 1112` against controlled Bug `BUG-0016` (`fe16378d-88fe-4f70-8301-5cbcea4f3d6a`). The local deterministic regression `scripts/qa/test-idts127-ux002-responsive-browser.js` is PASS at commit `88a553d9c3e514a1d5fd2e35c5a3587b3d69c6c6`; this is local SQLite/controlled-response evidence, not live BTP/provider proof.
- The live ledger has exactly four provider calls: prior Similar Bugs with five candidates and no repeat, Classification with five rows and HTTP 200, Smart Assignment with one candidate and no retry, and Handoff Summary with settled UI. Handoff matching transport telemetry was unavailable, so no transport status is inferred. No Apply, Assign, Confirm Duplicate, Accept, Save, Edit, workflow, business-data or provider mutation was invoked; Bug state invariants remained unchanged and AiSuggestions count delta was unavailable.
- One approved Classification JPEG (`02-live-classification-review.jpg`) plus sanitized `ux002-receipt.json` are current evidence. The three historical PNGs remain hash-tracked and labelled historical; Smart Assignment, before-state, Handoff Top 2 and final captures remain outside the repository.
- Candidate disposition remains `DOES_NOT_MEET_EXPECTED_RESULT` with curation category `CURRENT_RUNTIME_PARTIAL_RECHECK`; `finalPassApproved` remains false. The aggregate partition remains **24 MEETS / 10 DOES_NOT_MEET / 23 BLOCKED**, and only `UAT-COM-003` and `UAT-UX-003` remain final-approved. Current integrity totals are 81 evidence references and 68 unique SHA-256 values. Workbook, Drive, Jira, BTP, database, provider and live data remain unchanged.
