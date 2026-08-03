# IDTS-111 DonHV UAT execution review matrix

## Review baseline

- Candidate PR: `#270`.
- Candidate head: `44721f53fe2f7588d38f6d6c79ffb0c33026d5d3`.
- Execution baseline: `fbea12cd996d8c1e13bd834fd6e054c8a37c32e6`.
- Deployed runtime: `67b1bf86169e9696c9365ef4846b99ffae30d4e2`.
- Reviewer: DonHV, with independent read-only agent reviews used only as advisory input.
- Evidence integrity: 57 manifests, 63 referenced images after targeted reruns, pending fresh exact-head verification.

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
| UAT-AI-010 | DOES_NOT_MEET | CATALOG_MISMATCH | Reopening generates a new suggestion ID; prove persistence against the original immutable ID rather than expecting a new dialog to stay Rejected. |
| UAT-AI-011 | BLOCKED | ACCEPTED_BLOCKER | Requires a controlled rate-limit/cooldown fixture; do not create load by repeated calls. |
| UAT-AI-012 | BLOCKED | ACCEPTED_BLOCKER | Requires a dedicated sanitized prompt-injection Bug. |
| UAT-AI-014 | DOES_NOT_MEET | CATALOG_MISMATCH | Same new-suggestion-ID issue as UAT-AI-010; rerun with audit readback. |
| UAT-AI-015 | DOES_NOT_MEET | CATALOG_MISMATCH | Same new-suggestion-ID issue as UAT-AI-010; rerun with audit readback. |
| UAT-AI-016 | BLOCKED | ACCEPTED_BLOCKER | Requires a stable accepted suggestion and controlled stale-source mutation. |
| UAT-ATT-001 | DOES_NOT_MEET | NEEDS_TARGETED_RERUN | Upload failure is real, but current evidence does not identify metadata, binary, S3, session, or CSRF stage; investigate attachment chain and IDTS-113 environment. |
| UAT-ATT-002 | BLOCKED | ACCEPTED_BLOCKER | Depends on successful controlled upload. |
| UAT-ATT-003 | BLOCKED | ACCEPTED_BLOCKER | Depends on a DonHV-approved controlled attachment; do not delete unrelated evidence. |
| UAT-ATT-004 | BLOCKED | TEST_HARNESS_LIMITATION | Browser chooser blocked the file before application validation; rerun using native/manual chooser. |
| UAT-ATT-005 | BLOCKED | INSUFFICIENT_EVIDENCE | Current run cannot distinguish client size filtering from the broken upload path. |
| UAT-ATT-006 | MEETS | ACCEPTED_EVIDENCE | Safe failure and no orphan metadata were demonstrated. |
| UAT-AUD-003 | BLOCKED | ACCEPTED_BLOCKER | Requires a controlled high-history fixture. |
| UAT-AUTH-001 | MEETS | ACCEPTED_EVIDENCE | Mapped Tester XSUAA session and protected app access demonstrated. |
| UAT-AUTH-002 | BLOCKED | MEMBER_IDENTITY_BLOCKER | Requires a member-owned unmapped SAP identity. |
| UAT-AUTH-003 | BLOCKED | MEMBER_IDENTITY_BLOCKER | Requires a controlled mismatched-role identity. |
| UAT-AUTH-004 | BLOCKED | ENVIRONMENT_BLOCKER | Requires controlled XSUAA/session expiry; Smart Assign 401 is not expiry proof. |
| UAT-AUTH-005 | DOES_NOT_MEET | CONFIRMED_PRODUCT_DEFECT | Blank protected route after logout; tracked by IDTS-117. |
| UAT-BUG-001 | MEETS | ACCEPTED_EVIDENCE | Create without assignee and Pending Assignment persistence demonstrated. |
| UAT-BUG-002 | MEETS | ACCEPTED_EVIDENCE | Create with assignee and reload persistence demonstrated. |
| UAT-BUG-003 | MEETS | ACCEPTED_EVIDENCE | Required Title validation demonstrated. |
| UAT-BUG-004 | MEETS | ACCEPTED_EVIDENCE | Required Description validation demonstrated. |
| UAT-BUG-005 | BLOCKED | ACCEPTED_BLOCKER | Requires an approved direct-request fixture for incompatible classification. |
| UAT-BUG-006 | MEETS | ACCEPTED_EVIDENCE | Reproduction fields persisted after Create/reload. |
| UAT-BUG-007 | MEETS | ACCEPTED_EVIDENCE | Discarded draft did not create an active Bug. |
| UAT-BUG-008 | DOES_NOT_MEET | CONFIRMED_PRODUCT_DEFECT | One draft save can hit draft-save and generic active UPDATE audit paths, matching the duplicate Edit evidence; tracked by IDTS-119. |
| UAT-BUG-009 | MEETS | ACCEPTED_EVIDENCE | Back/forward navigation preserved isolated draft state. |
| UAT-CLS-001 | MEETS | ACCEPTED_EVIDENCE | Compatible active value-help entries demonstrated. |
| UAT-CLS-002 | MEETS | ACCEPTED_EVIDENCE | Smart Assign selection and reload persistence demonstrated. |
| UAT-CLS-003 | BLOCKED | ACCEPTED_BLOCKER | Requires an inactive-code/direct-request fixture. |
| UAT-CLS-004 | MEETS | ACCEPTED_EVIDENCE | Description-only edit did not mutate classification/ownership. |
| UAT-COM-001 | DOES_NOT_MEET | NEEDS_TARGETED_RERUN | Valid comment failed safely; tracked by IDTS-116, but sanitized HTTP/Network evidence is still required before root-cause confirmation. |
| UAT-COM-002 | MEETS | ACCEPTED_EVIDENCE | Empty-comment validation demonstrated. |
| UAT-COM-003 | BLOCKED | ACCEPTED_BLOCKER | Depends on restoring valid comment posting. |
| UAT-COM-004 | BLOCKED | ACCEPTED_BLOCKER | Depends on restoring valid comment posting. |
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
| UAT-UX-002 | DOES_NOT_MEET | CONFIRMED_PRODUCT_DEFECT | Tablet screenshot confirms clipped Classification action label and Similar Bugs reason overflow; tracked by IDTS-120. |
| UAT-UX-003 | DOES_NOT_MEET | TEST_HARNESS_LIMITATION | Enter/Escape/focus return passed; automated Tab translation is insufficient. Confirm with a physical keyboard before filing an accessibility defect. |
| UAT-UX-004 | MEETS | ACCEPTED_EVIDENCE | Safe error copy/no raw diagnostic demonstrated. |
| UAT-UX-005 | MEETS | ACCEPTED_EVIDENCE | Reload/idempotent committed state demonstrated. |

## Review totals

- 19 positive executions: evidence accepted.
- 25 blocked executions: blocker evidence accepted, but no PASS claimed.
- 13 candidate negative executions were dispositioned as:
  - 3 confirmed product defects: `UAT-AUTH-005`, `UAT-BUG-008`, `UAT-UX-002`.
  - 5 catalog/semantic mismatches: `UAT-AI-008`, `UAT-AI-010`, `UAT-AI-014`, `UAT-AI-015`, `UAT-LIFE-014`.
  - 1 environment/session blocker: `UAT-AI-009`.
  - 3 targeted reruns with insufficient root-cause evidence: `UAT-AI-005`, `UAT-ATT-001`, `UAT-COM-001`.
  - 1 test-harness limitation: `UAT-UX-003`.

## Gate decision

The PR #270 evidence package is internally consistent and may be retained as truthful candidate evidence. It must not be interpreted as final UAT approval. Merge remains gated by NhanT personally reading and acknowledging briefing SHA `3e78b495cb8feb56188cc446b827d47e040e1b98`, by a fresh exact-head QA gate, and by the PR body preserving the candidate/blocker truth above. The UAT workbook and Google Drive artifact remain unchanged.

## Current rerun state

NhanT recorded the required acknowledgment in the repository and Jira comments `10908`/`10909`. The deployed SAP application is now usable. Fresh `UAT-COM-001` and `UAT-ATT-001` reruns reproduced their existing safe failures and added sanitized screenshots without promoting either result. The approved Browser surface still does not expose the sanitized response status/body, immutable suggestion ID, or Network trace required to close the root-cause questions for `UAT-COM-001`, `UAT-ATT-001`, `UAT-AI-005`, and `UAT-AI-009`; IDTS-113/114/115/116 remain the diagnostic owners. `UAT-UX-003` still requires physical-keyboard confirmation. The workbook and Drive artifact remain unchanged.
