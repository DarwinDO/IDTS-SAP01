# IDTS-111 NhanT UAT candidate execution summary

Date: 2026-08-04
Executor: NhanT
Role: Tester
Execution baseline: `fbea12cd996d8c1e13bd834fd6e054c8a37c32e6`
Deployed runtime: `67b1bf86169e9696c9365ef4846b99ffae30d4e2`

## Current DonHV review partition (Jira comment 10962)

- Assigned to NhanT: 57 cases.
- Candidate packages prepared: 57/57; no assigned case remains unattempted or unpackaged.
- Candidate partition: 24 MEETS / 10 DOES_NOT_MEET / 23 BLOCKED. Exactly `UAT-COM-003` and `UAT-UX-003` are final UAT PASS approved under the parent-authorized decision; the other 55 cases remain candidate evidence, corrections, or blockers and are not final-approved.
- Only three stale prerequisites remain: `UAT-AI-007`, `UAT-ATT-002`, `UAT-ATT-003`.
- Historical defect candidates were rechecked: `UAT-AUTH-005` and `UAT-COM-003` are current candidate positives, with `UAT-COM-003` final-approved; `UAT-BUG-008` remains a current candidate negative, and `UAT-UX-002` is a current PARTIAL recheck with local responsive PASS, one-candidate Smart Assignment coverage, and unavailable Handoff matching transport telemetry.
- 5 catalog/semantic corrections are preserved separately from product defects.
- 1 physical-keyboard closure is now DonHV-human-attested; the historical Browser automation limitation remains preserved.
- 2 AI diagnostic reruns require immutable suggestion ID plus sanitized Network/audit and no-mutation proof.
- `UAT-COM-001` is a current candidate positive. NhanT's ATT-001 negative remains historically intact, while DonHV blocks acceptance because its 44/54/47-byte fixture provenance is inconsistent.
- Retained evidence: 78 image references plus three structured JSON receipts (81 evidence references, 68 unique SHA-256 values); every manifest reference and hash must pass the fresh integrity gate.
- Reviewer-approved final PASS: exactly `UAT-COM-003` and `UAT-UX-003`. No other case is final-approved, and the approved catalog remains unchanged at 90 `PREPARED`.
- Final `UAT_EN_PREPARED` workbook and Google Drive: unchanged; DonHV remains final integrator.

## Historical candidate DOES NOT MEET cases (2026-08-03 runtime)

These observations are preserved for audit. The latest DonHV partition above controls current wording and rerun readiness.

| Case | Candidate finding |
| --- | --- |
| `UAT-AI-008` | Handoff Summary named DonHV as verified current owner while the Object Page showed Project Manager. |
| `UAT-COM-001` | A fresh valid controlled comment rerun again returned the safe posting error, retained the input, and stored no comment. |
| `UAT-UX-002` | Tablet Object Page/dialog text clipped instead of wrapping. |
| `UAT-UX-003` | Enter/Escape/focus return worked, but Tab did not advance across nine attempts; manual keyboard confirmation remains required. |
| `UAT-BUG-008` | One title Save produced two identical Edit audit events. |
| `UAT-LIFE-014` | Close Bug accepted an empty Developer Note and changed Retest Required to Closed. |
| `UAT-AI-010` | Rejected review state returned to Pending after reload, with decisions enabled again. |
| `UAT-AI-014` | Reject did not persist once; business state remained unchanged. |
| `UAT-AI-015` | Ignore did not persist once; business state remained unchanged. |
| `UAT-AI-005` | Accepted classification could not be applied; safe error shown and no partial mutation occurred. |
| `UAT-ATT-001` | A fresh supported 47-byte text upload rerun failed safely and created no orphan metadata. |
| `UAT-AI-009` | Smart Assign exposed `Communication error: 401 error` while the protected session remained valid. |
| `UAT-AUTH-005` | Logout ended the session, but reopening the protected route rendered a blank page instead of SAP sign-in. |

## Historical blocked precondition groups

- Identity/session controls: `UAT-AUTH-002`, `UAT-AUTH-003`, `UAT-AUTH-004`.
- Classification/direct-request fixtures: `UAT-BUG-005`, `UAT-CLS-003`.
- Authorized lifecycle actor/state chain: `UAT-LIFE-001`, `002`, `003`, `004`, `005`, `008`, `009`, `015`.
- Broken comment prerequisite: `UAT-COM-004` (the former `UAT-COM-003` prerequisite is closed by the final-approved current rerun).
- Attachment prerequisites or Browser/environment ambiguity: `UAT-ATT-002`, `003`, `004`, `005`.
- AI prerequisite/control gaps: `UAT-AI-002`, `007`, `011`, `012`, `016`.
- History-volume fixture: `UAT-AUD-003`.

Each blocked manifest records the exact missing precondition, why the NhanT session cannot truthfully execute it, and the rerun condition. No blocked case is promoted to PASS or FAIL.

## Controlled data/state produced

- `BUG-0025`: created Pending Assignment without Assignee; later received the controlled title-only edit used by persistence/audit cases.
- `BUG-0026`: created Assigned to SangVN with exact reproduction fields; later received one controlled Description-only edit. Classification and workflow remained stable after failed AI Apply.
- `BUG-0011`: closed with an empty reason during `UAT-LIFE-014`, exposing the required-reason defect, then reopened with a valid controlled reason for `UAT-LIFE-010`.
- In the historical pre-fix candidate run, no attachment or valid comment was stored because both deployed paths failed safely; the later final-approved `UAT-COM-003` rerun stored the exact 1000-character marker and rejected 1001 without persistence.
- The SAP session was intentionally signed out only after all other Browser cases were complete.

## Verification

- 57 manifests parsed successfully.
- 81 evidence references exist; the fresh integrity gate verifies existence and recorded SHA-256, including both final-approval receipts and the new sanitized UAT-UX-002 receipt.
- `npm.cmd run qa:secret-scan` -> PASS.
- `git diff --check` -> PASS.
- Catalog integrity -> 90/90 `PREPARED`; catalog file has no diff.
- OfficeCLI preflight `1.0.143` PASS. No workbook validation or Drive synchronization was needed because this PR changes evidence/metadata only.

## DonHV review actions

1. Review the remaining 10 DOES_NOT_MEET candidates and disposition them in Jira/catalog; exactly `UAT-COM-003` and `UAT-UX-003` are final-approved PASS.
2. Decide whether `UAT-ATT-006` is sufficient with inferred storage failure or requires a controlled S3 outage rerun.
3. Provision the identities, roles, state fixtures, service fixes, and direct-request controls listed in the 25 blocked manifests, then assign reruns where required.
4. Only after reviewer decisions, update the approved catalog and generate/synchronize the final English `UAT_EN_PREPARED` workbook.

## Targeted rerun closure (2026-08-03)

This section is historical. IDTS-116 changed the current runtime after these observations, so comment and attachment failures below require a new controlled rerun before any current-behavior claim.

- `UAT-COM-001`: rerun completed; the same safe posting failure reproduced and no comment persisted. The Browser surface exposed no sanitized response status/body, so IDTS-116 still owns root-cause diagnosis.
- `UAT-ATT-001`: rerun completed with a fresh synthetic supported file; the same safe upload failure reproduced and no orphan row appeared. The Browser surface could not distinguish metadata, binary, S3, session, or CSRF stage, so IDTS-113 remains open.
- `UAT-AI-005` and `UAT-AI-009`: no new outcome was promoted because the approved Browser surface does not expose the required immutable suggestion ID or sanitized Network response evidence. Existing candidate evidence remains truthful; IDTS-114/115 retain the diagnostic follow-up.
- `UAT-UX-003`: remains a physical-keyboard-only confirmation; automation must not be represented as a human Tab-key result.

## 2026-08-04 remediation status

- All 57 manifests now contain `donhvLatestReview` metadata keyed to Jira comment `10962`; exactly `UAT-COM-003` and `UAT-UX-003` have `FINAL_PASS_APPROVED`, while the other candidate outcomes remain pending or blocked.
- Machine-readable partition: `latest-review-summary.json` (24 MEETS / 10 DOES_NOT_MEET / 23 BLOCKED; current-runtime negative count 0).
- Current-runtime reruns already captured by NhanT remain preserved; this DonHV curation does not execute or rewrite them.
- Final workbook and Drive remain unchanged.

## Current-runtime rerun closure (2026-08-04)

- `UAT-COM-001`: candidate PASS; one NhanT/Tester comment persisted after reload.
- `UAT-COM-003`: historical pre-fix candidate FAIL; a 1006-character comment was accepted and remained listed after reload instead of being rejected. The current UI-only rerun is final-approved separately below, and this historical failure remains preserved.
- `UAT-COM-004`: candidate PASS for sanitization/no execution; markup was stripped and no XSS console marker appeared.
- `UAT-ATT-001`: NhanT candidate FAIL preserved; DonHV acceptance BLOCKED because the same manifest/evidence chain identifies 44-byte, 54-byte and 47-byte fixtures.
- `UAT-AUTH-005`: current candidate PASS; the protected route redirected to SAP Sign In after logout.
- `UAT-BUG-008`: current candidate FAIL; one title Save again produced two identical audit events.
- `UAT-UX-002`: partial; action label fits at 834 x 1112, but no Similar Bugs candidates existed to test reason wrapping.
- `UAT-AI-005`: failure reproduced with no partial mutation; immutable suggestion ID and sanitized Network response remain unavailable. `UAT-UX-003` is final-approved from DonHV's physical-keyboard attestation; its historical Browser automation limitation remains preserved.

## 2026-09-12 final-approved current readback

Exactly `UAT-COM-003` and `UAT-UX-003` are final UAT PASS approved under the parent-authorized decision. The approved PR #405 source head is `e3c8977cbdd981c90133e8e4c27fc8d7b6f44d34`; the exact source, execution, and deployed runtime SHA is `54ad1b824d74f57e5d1a6e9dbd6208cd80768d8b`. The deployed Bug Management UI is version `0.0.16` with artifact SHA-256 `F7949863FAD1677878B5E649155586FA8526683DCEDD7720213E0CC88FBB7AF4`. On controlled `BUG-0021` (`029435e3-abb7-4079-826a-394709f9eb50`), the read-only Edge reload receipt [`05-live-readback-receipt.json`](uat/UAT-COM-003/05-live-readback-receipt.json) records two Comments entries, one `UAT-COM-003-1000|` marker, and zero `UAT-COM-003-1001|` markers. No live data was mutated during this readback.

The prior authorized 1001-character attempt remains a separate recorded event: CAP returned HTTP `400` with `Comment cannot exceed 1000 characters.`, the TextArea retained the input, the Comments count stayed at two after reload, and no truncated or partial comment was stored. Its historical pre-fix 1006-character failure remains preserved in the manifest and is not rewritten as a current result. The current partition is 24 MEETS / 10 DOES_NOT_MEET / 23 BLOCKED, with current-runtime negative count 0; the other 55 cases are not final-approved. The workbook, IDTS-110 artifacts, Google Drive, Jira, and unrelated live data remain unchanged.

## 2026-09-12 final-approved UAT-UX-003 physical-keyboard attestation

DonHV physically executed the exact seven-outcome checklist against the deployed runtime truth already present in the baseline: visible focus; Tab reaches Find Similar Bugs/core controls; Enter opens Similar Bugs; arrow keys navigate the composite list; Tab reaches dialog actions; Escape closes; focus returns to the trigger. The structured receipt [`02-manual-physical-keyboard-attestation.json`](uat/UAT-UX-003/02-manual-physical-keyboard-attestation.json) is bound to source baseline `4ab336388fb744b82abdfe6ef8f7c334b4075428`, deployed runtime `67b1bf86169e9696c9365ef4846b99ffae30d4e2`, receipt SHA-256 `F1B9CA7548E46EFA1A8AB9C1310134090F53AA599A8742D7D60D13DE0B25C858`, and the existing E01 PNG/hash. The physical sequence is human-attested; no browser simulation, invented device/timestamp, or raw keylog is claimed. The historical Browser failure remains under `historicalAutomationLimitation`.

The current partition is 24 MEETS / 10 DOES_NOT_MEET / 23 BLOCKED across 57 manifests. Exactly `UAT-COM-003` and `UAT-UX-003` are final-approved; all other cases remain candidate evidence, corrections, or blockers. The workbook, IDTS-110 artifacts, Google Drive, Jira, runtime, database, provider and live data remain unchanged.

## 2026-09-12 UAT-UX-002 partial recheck and evidence integration

- Current execution: `NhanT (DonHV support)` in the DonHV PM session at viewport `834 x 1112`, controlled Bug `BUG-0016` (`fe16378d-88fe-4f70-8301-5cbcea4f3d6a`). The local deterministic regression `scripts/qa/test-idts127-ux002-responsive-browser.js` is PASS at commit `88a553d9c3e514a1d5fd2e35c5a3587b3d69c6c6`; its controlled SQLite/responses are not live BTP/provider acceptance.
- Live result is PARTIAL with exactly four provider calls: prior Similar Bugs (5 candidates, not repeated), Classification (5 rows, HTTP 200), Smart Assignment (1 candidate, no retry), and Handoff Summary (UI settled). Matching Handoff transport telemetry was unavailable; no transport status is inferred. No Apply, Assign, Confirm Duplicate, Accept, Save, Edit, workflow, business-data or provider mutation was invoked. Status, assignee, current owner, comments and attachments stayed unchanged; AiSuggestions count delta was unavailable.
- Current evidence adds one approved Classification JPEG plus sanitized `uat/UAT-UX-002/ux002-receipt.json` and retains the three historical PNGs with hashes and historical labels. The Smart Assignment, before-state, Handoff Top 2, and final captures remain excluded from the repository because they are unnecessary or privacy-sensitive.
- Candidate outcome remains `DOES_NOT_MEET_EXPECTED_RESULT`; curation category remains `CURRENT_RUNTIME_PARTIAL_RECHECK`; `finalPassApproved` remains false. The aggregate partition remains **24 MEETS / 10 DOES_NOT_MEET / 23 BLOCKED** across 57 manifests, with only `UAT-COM-003` and `UAT-UX-003` final-approved. Current integrity totals are 81 evidence references and 68 unique SHA-256 values. Workbook, Drive, Jira, BTP, database, provider and live data remain unchanged.
