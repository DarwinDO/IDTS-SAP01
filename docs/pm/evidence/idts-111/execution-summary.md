# IDTS-111 NhanT UAT candidate execution summary

Date: 2026-08-03
Executor: NhanT
Role: Tester
Execution baseline: `fbea12cd996d8c1e13bd834fd6e054c8a37c32e6`
Deployed runtime: `67b1bf86169e9696c9365ef4846b99ffae30d4e2`

## Consolidated result

- Assigned to NhanT: 57 cases.
- Candidate packages prepared: 57/57; no assigned case remains unattempted or unpackaged.
- `EXECUTED_PENDING_DONHV_REVIEW`: 32 cases.
  - `MEETS_EXPECTED_RESULT`: 19.
  - `DOES_NOT_MEET_EXPECTED_RESULT`: 13.
- `EXECUTION_BLOCKED_PENDING_PRECONDITION`: 25 cases.
- Retained visual evidence: 63 PNG files after the targeted comment/upload reruns; every manifest reference and SHA-256 verified.
- Reviewer-approved PASS/FAIL: none. The approved catalog remains unchanged at 90 `PREPARED`.
- Final `UAT_EN_PREPARED` workbook and Google Drive: unchanged; DonHV remains final integrator.

## Candidate DOES NOT MEET cases

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

## Blocked precondition groups

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

- `UAT-COM-001`: rerun completed; the same safe posting failure reproduced and no comment persisted. The Browser surface exposed no sanitized response status/body, so IDTS-116 still owns root-cause diagnosis.
- `UAT-ATT-001`: rerun completed with a fresh synthetic supported file; the same safe upload failure reproduced and no orphan row appeared. The Browser surface could not distinguish metadata, binary, S3, session, or CSRF stage, so IDTS-113 remains open.
- `UAT-AI-005` and `UAT-AI-009`: no new outcome was promoted because the approved Browser surface does not expose the required immutable suggestion ID or sanitized Network response evidence. Existing candidate evidence remains truthful; IDTS-114/115 retain the diagnostic follow-up.
- `UAT-UX-003`: remains a physical-keyboard-only confirmation; automation must not be represented as a human Tab-key result.
