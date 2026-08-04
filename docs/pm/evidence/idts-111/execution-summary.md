# IDTS-111 NhanT UAT candidate execution summary

Date: 2026-08-04
Executor: NhanT
Role: Tester
Execution baseline: `fbea12cd996d8c1e13bd834fd6e054c8a37c32e6`
Deployed runtime: `67b1bf86169e9696c9365ef4846b99ffae30d4e2`

## Current DonHV review partition (Jira comment 10942)

- Assigned to NhanT: 57 cases.
- Candidate packages prepared: 57/57; no assigned case remains unattempted or unpackaged.
- 19 truthful candidate positives retained; none is final UAT PASS.
- 20 valid precondition blockers retained.
- 5 previously blocked prerequisites are stale after IDTS-116 and require current-runtime rerun.
- 3 confirmed defects require current-runtime recheck: `UAT-AUTH-005`, `UAT-BUG-008`, `UAT-UX-002`.
- 5 catalog/semantic corrections are preserved separately from product defects.
- 1 physical-keyboard limitation still requires NhanT's manual confirmation.
- 2 AI diagnostic reruns require immutable suggestion ID plus sanitized Network/audit and no-mutation proof.
- 2 negative results (`UAT-COM-001`, `UAT-ATT-001`) are historical old-runtime evidence after IDTS-116 and must not be presented as current behavior.
- Retained visual evidence: 63 PNG files after the targeted comment/upload reruns; every manifest reference and SHA-256 verified.
- Reviewer-approved PASS/FAIL: none. The approved catalog remains unchanged at 90 `PREPARED`.
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
- Broken comment prerequisite: `UAT-COM-003`, `UAT-COM-004`.
- Attachment prerequisites or Browser/environment ambiguity: `UAT-ATT-002`, `003`, `004`, `005`.
- AI prerequisite/control gaps: `UAT-AI-002`, `007`, `011`, `012`, `016`.
- History-volume fixture: `UAT-AUD-003`.

Each blocked manifest records the exact missing precondition, why the NhanT session cannot truthfully execute it, and the rerun condition. No blocked case is promoted to PASS or FAIL.

## Controlled data/state produced

- `BUG-0025`: created Pending Assignment without Assignee; later received the controlled title-only edit used by persistence/audit cases.
- `BUG-0026`: created Assigned to SangVN with exact reproduction fields; later received one controlled Description-only edit. Classification and workflow remained stable after failed AI Apply.
- `BUG-0011`: closed with an empty reason during `UAT-LIFE-014`, exposing the required-reason defect, then reopened with a valid controlled reason for `UAT-LIFE-010`.
- No attachment or valid comment was stored because both deployed paths failed safely.
- The SAP session was intentionally signed out only after all other Browser cases were complete.

## Verification

- 57 manifests parsed successfully.
- 63 evidence references exist and match their recorded SHA-256.
- `npm.cmd run qa:secret-scan` -> PASS.
- `git diff --check` -> PASS.
- Catalog integrity -> 90/90 `PREPARED`; catalog file has no diff.
- OfficeCLI preflight limitation -> OfficeCLI is not installed/on PATH, so no OfficeCLI workbook validation or Drive synchronization was performed.

## DonHV review actions

1. Review the 32 executed candidates and disposition the 13 candidate failures in Jira/catalog.
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

- All 57 manifests now contain `donhvLatestReview` metadata keyed to Jira comment `10942`; the original candidate status, outcome, timestamps and evidence hashes remain unchanged.
- Machine-readable partition: `latest-review-summary.json` (19/20/5/3/5/1/2/2 as listed above).
- A fresh SAP runtime rerun was not performed because this Codex session does not expose the Browser control tool required by the installed Browser skill. No historical result was promoted or fabricated.
- Final workbook and Drive remain unchanged.

## Current-runtime rerun closure (2026-08-04)

- `UAT-COM-001`: candidate PASS; one NhanT/Tester comment persisted after reload.
- `UAT-COM-003`: candidate FAIL; a 1006-character comment was accepted and persisted instead of being rejected.
- `UAT-COM-004`: candidate PASS for sanitization/no execution; markup was stripped and no XSS console marker appeared.
- `UAT-ATT-001`: current candidate FAIL; a supported file appeared in draft/active state but disappeared after reload.
- `UAT-AUTH-005`: current candidate PASS; the protected route redirected to SAP Sign In after logout.
- `UAT-BUG-008`: current candidate FAIL; one title Save again produced two identical audit events.
- `UAT-UX-002`: partial; action label fits at 834 x 1112, but no Similar Bugs candidates existed to test reason wrapping.
- `UAT-AI-005`: failure reproduced with no partial mutation; immutable suggestion ID and sanitized Network response remain unavailable. `UAT-UX-003` remains physical-keyboard-only.
