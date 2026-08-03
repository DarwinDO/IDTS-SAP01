# IDTS-111 DonHV UAT execution review matrix

## Review baseline

- Candidate PR: `#270`.
- Candidate head: `44721f53fe2f7588d38f6d6c79ffb0c33026d5d3`.
- Execution baseline: `fbea12cd996d8c1e13bd834fd6e054c8a37c32e6`.
- Deployed runtime: `67b1bf86169e9696c9365ef4846b99ffae30d4e2`.
- Reviewer: DonHV.
- Evidence integrity: 57 manifests, 61 referenced images, 0 missing file, 0 SHA-256 mismatch.

`ACCEPTED_EVIDENCE` means that the evidence truthfully supports the observed result. It does not mean that a blocked case passed, a product defect is fixed, or the final UAT workbook is approved.

## Case-by-case disposition

| Case | Candidate result | DonHV disposition | Classification / next action |
|---|---|---|---|
| UAT-AI-001 | MEETS | ACCEPTED_EVIDENCE | Positive Similar Bugs review-only evidence. |
| UAT-AI-002 | BLOCKED | ACCEPTED_BLOCKER | Prepare an accepted suggestion and controlled candidate before rerun. |
| UAT-AI-004 | MEETS | ACCEPTED_EVIDENCE | Positive Classification review-only evidence. |
| UAT-AI-005 | DOES_NOT_MEET | NEEDS_TARGETED_RERUN | Capture suggestion ID and sanitized HTTP status under IDTS-115. |
| UAT-AI-007 | BLOCKED | ACCEPTED_BLOCKER | Requires a controlled persisted comment after IDTS-116. |
| UAT-AI-008 | DOES_NOT_MEET | CATALOG_MISMATCH | Compare stored user with like-for-like semantics, not role/queue label. |
| UAT-AI-009 | DOES_NOT_MEET | ENVIRONMENT_SESSION_BLOCKER | Rerun AssignableDevelopers 401 with Network evidence. |
| UAT-AI-010 | DOES_NOT_MEET | CATALOG_MISMATCH | Prove persistence against the original immutable suggestion ID. |
| UAT-AI-011 | BLOCKED | ACCEPTED_BLOCKER | Requires controlled rate-limit/cooldown; do not create load. |
| UAT-AI-012 | BLOCKED | ACCEPTED_BLOCKER | Requires a sanitized prompt-injection fixture. |
| UAT-AI-014 | DOES_NOT_MEET | CATALOG_MISMATCH | Rerun using original suggestion ID and audit readback. |
| UAT-AI-015 | DOES_NOT_MEET | CATALOG_MISMATCH | Rerun using original suggestion ID and audit readback. |
| UAT-AI-016 | BLOCKED | ACCEPTED_BLOCKER | Requires stable accepted suggestion and stale-source mutation. |
| UAT-ATT-001 | DOES_NOT_MEET | NEEDS_TARGETED_RERUN | Identify metadata, binary, S3, session, or CSRF stage. |
| UAT-ATT-002 | BLOCKED | ACCEPTED_BLOCKER | Depends on successful controlled upload. |
| UAT-ATT-003 | BLOCKED | ACCEPTED_BLOCKER | Depends on a DonHV-approved controlled attachment. |
| UAT-ATT-004 | BLOCKED | TEST_HARNESS_LIMITATION | Rerun with native/manual chooser. |
| UAT-ATT-005 | BLOCKED | INSUFFICIENT_EVIDENCE | Distinguish size filtering from broken upload path. |
| UAT-ATT-006 | MEETS | ACCEPTED_EVIDENCE | Safe failure and no orphan metadata demonstrated. |
| UAT-AUD-003 | BLOCKED | ACCEPTED_BLOCKER | Requires a controlled high-history fixture. |
| UAT-AUTH-001 | MEETS | ACCEPTED_EVIDENCE | Mapped Tester XSUAA session demonstrated. |
| UAT-AUTH-002 | BLOCKED | MEMBER_IDENTITY_BLOCKER | Requires member-owned unmapped identity. |
| UAT-AUTH-003 | BLOCKED | MEMBER_IDENTITY_BLOCKER | Requires controlled mismatched-role identity. |
| UAT-AUTH-004 | BLOCKED | ENVIRONMENT_BLOCKER | Requires controlled XSUAA/session expiry. |
| UAT-AUTH-005 | DOES_NOT_MEET | CONFIRMED_PRODUCT_DEFECT | Blank protected route after logout; IDTS-117. |
| UAT-BUG-001 | MEETS | ACCEPTED_EVIDENCE | Pending Assignment persistence demonstrated. |
| UAT-BUG-002 | MEETS | ACCEPTED_EVIDENCE | Assigned create/reload demonstrated. |
| UAT-BUG-003 | MEETS | ACCEPTED_EVIDENCE | Required Title validation demonstrated. |
| UAT-BUG-004 | MEETS | ACCEPTED_EVIDENCE | Required Description validation demonstrated. |
| UAT-BUG-005 | BLOCKED | ACCEPTED_BLOCKER | Requires direct incompatible-classification fixture. |
| UAT-BUG-006 | MEETS | ACCEPTED_EVIDENCE | Reproduction fields persisted. |
| UAT-BUG-007 | MEETS | ACCEPTED_EVIDENCE | Discarded draft did not activate. |
| UAT-BUG-008 | DOES_NOT_MEET | CONFIRMED_PRODUCT_DEFECT | Duplicate Edit audit event; IDTS-119. |
| UAT-BUG-009 | MEETS | ACCEPTED_EVIDENCE | Back/forward preserved draft state. |
| UAT-CLS-001 | MEETS | ACCEPTED_EVIDENCE | Active compatible value help demonstrated. |
| UAT-CLS-002 | MEETS | ACCEPTED_EVIDENCE | Smart Assign selection persisted. |
| UAT-CLS-003 | BLOCKED | ACCEPTED_BLOCKER | Requires inactive-code/direct-request fixture. |
| UAT-CLS-004 | MEETS | ACCEPTED_EVIDENCE | Unrelated edit preserved classification. |
| UAT-COM-001 | DOES_NOT_MEET | NEEDS_TARGETED_RERUN | Capture sanitized HTTP/Network evidence under IDTS-116. |
| UAT-COM-002 | MEETS | ACCEPTED_EVIDENCE | Empty-comment validation demonstrated. |
| UAT-COM-003 | BLOCKED | ACCEPTED_BLOCKER | Depends on valid comment posting. |
| UAT-COM-004 | BLOCKED | ACCEPTED_BLOCKER | Depends on valid comment posting. |
| UAT-LIFE-001 | BLOCKED | MEMBER_IDENTITY_BLOCKER | Requires authorized processor. |
| UAT-LIFE-002 | BLOCKED | MEMBER_IDENTITY_BLOCKER | Requires Developer identity. |
| UAT-LIFE-003 | BLOCKED | FIXTURE_IDENTITY_BLOCKER | Requires owned In Review record. |
| UAT-LIFE-004 | BLOCKED | FIXTURE_IDENTITY_BLOCKER | Requires Need More Information state. |
| UAT-LIFE-005 | BLOCKED | FIXTURE_IDENTITY_BLOCKER | Requires owned In Review record. |
| UAT-LIFE-008 | BLOCKED | FIXTURE_IDENTITY_BLOCKER | Requires authorized Resolved record. |
| UAT-LIFE-009 | BLOCKED | FIXTURE_BLOCKER | Requires separate Retest Required record. |
| UAT-LIFE-010 | MEETS | ACCEPTED_EVIDENCE | Reopen/reload persisted. |
| UAT-LIFE-014 | DOES_NOT_MEET | CATALOG_MISMATCH | Current close contract does not require reason. |
| UAT-LIFE-015 | BLOCKED | FIXTURE_IDENTITY_BLOCKER | Requires NhanT-owned Rejected correction flow. |
| UAT-UX-001 | MEETS | ACCEPTED_EVIDENCE | Desktop readability demonstrated. |
| UAT-UX-002 | DOES_NOT_MEET | CONFIRMED_PRODUCT_DEFECT | Tablet clipping/overflow; IDTS-120. |
| UAT-UX-003 | DOES_NOT_MEET | TEST_HARNESS_LIMITATION | Confirm Tab behavior with physical keyboard. |
| UAT-UX-004 | MEETS | ACCEPTED_EVIDENCE | Safe error copy demonstrated. |
| UAT-UX-005 | MEETS | ACCEPTED_EVIDENCE | Reload/idempotent state demonstrated. |

## Review totals

- 19 positive executions: evidence accepted.
- 25 blocked executions: blocker evidence accepted, but no PASS claimed.
- 13 negatives: 3 confirmed defects, 5 catalog mismatches, 1 environment/session blocker, 3 targeted reruns, and 1 test-harness limitation.

## Current rerun state

The PR #270 evidence package remains truthful candidate evidence, not final UAT approval. NhanT acknowledged briefing SHA `3e78b495cb8feb56188cc446b827d47e040e1b98` in Jira comments `10908`/`10909`. Targeted reruns are currently blocked because the deployed SAP page is blank and returns JavaScript parse errors for `auth-guard.js` and `bootstrap-ui5.js`. `UAT-UX-003` still requires physical-keyboard confirmation. The workbook and Drive artifact remain unchanged.
