# IDTS-111 — UAT EN catalog history, execution and integration

- Catalog owner/approver and final integrator: DonHV
- Execution support: NhanT, SangVN and DatDT
- Due: 2026-08-04
- Status: IDTS-127 deadline-scope reduction in progress; the forward catalog now contains 77 `PREPARED` cases and the retained NhanT evidence package contains 44 manifests at 24 MEETS / 8 DOES_NOT_MEET / 12 BLOCKED. No new category is final UAT PASS until deployed evidence is reviewed.
- Jira: https://dutassociation.atlassian.net/browse/IDTS-111

## 2026-09-12 forward remediation catalog

- The original UAT EN v0.3 catalog and its execution evidence are historical records. Their baseline `447da1dab80418847d806040e6b2060b0916cb63`, screenshots, manifests, candidate outcomes, and workbook bytes remain unchanged.
- The tracked `docs/qa/idts-111-uat-catalog.json` is now the forward UAT EN v0.4 planning candidate generated from pre-change baseline `e019f7799fd30a419fafb048b41653d72a837083` for IDTS-127 retest.
- v0.4 corrects `UAT-BUG-010` to the canonical Tester-only Bug-create rule and clarifies `UAT-UX-003` with SAPUI5 composite-list keyboard semantics. These are forward expectation corrections, not retroactive edits to v0.3 evidence.
- The v0.4 catalog remains planning truth: 77 `PREPARED`, 0 executed, 0 passed, 0 failed, and 0 blocked inside the catalog file. Runtime disposition is maintained separately under IDTS-127.
- DonHV approved removal of 13 standalone cases for the deadline scope. Reject and Ignore persistence coverage is consolidated under `UAT-AI-010`; display numbers are regenerated continuously from 1 through 77.
- No official SAP490 workbook or Google Drive file has been generated, replaced, or synchronized from v0.4.

## Workflow

1. DonHV produces and approves the detailed English-only user-action catalog.
2. NhanT executes Tester cases and captures case-specific sanitized evidence.
3. SangVN and DatDT execute the assigned Developer-role cases with their own SAP identities.
4. DonHV executes PM, database and integration cases, then reviews every result.
5. DonHV alone generates UAT EN v0.3 and updates the same Drive ID after reviewed execution evidence is complete.

## Historical v0.3 candidate

- Historical catalog provenance: UAT EN v0.3 execution/review artifacts under `docs/pm/evidence/idts-111/`. The tracked generator/output now represent the forward v0.4 planning candidate described above.
- Frozen baseline: `447da1dab80418847d806040e6b2060b0916cb63`.
- Cases: 77 retained atomic English-only cases.
- Approval: DonHV approved for execution on 2026-08-02.
- Approved forward catalog truth: 77 `PREPARED`, 0 executed results stored inside the planning catalog.
- NhanT package: 44/44 retained manifests with candidate partition 24 MEETS / 8 DOES_NOT_MEET / 12 BLOCKED. Exactly `UAT-COM-003` and `UAT-UX-003` are final-approved; no other category is final UAT PASS.
- DonHV review is kept separate from NhanT's candidate partition. The current curation categories are 19 retained positives, 3 current-runtime positives, 20 accepted precondition blockers, 5 catalog corrections, 3 stale prerequisites, 2 AI diagnostic reruns, 1 fixture-provenance block, 1 current-runtime negative, 1 confirmed defect recheck, 1 partial recheck, and 1 physical-keyboard limitation. These categories do not create final UAT PASS. See `docs/pm/evidence/idts-111/donhv-execution-review-matrix.md`.
- Current evidence gaps: ATT-001 needs exact fixture identity/size reconciliation; AI-005/009 need immutable suggestion ID plus sanitized Network/audit; UX-002 needs a matching fixture; UX-003 needs NhanT's physical Tab confirmation. Only AI-007, ATT-002 and ATT-003 retain stale prerequisites.
- Knowledge gate: NhanT acknowledged briefing SHA `3e78b495cb8feb56188cc446b827d47e040e1b98`; Jira comments `10908` (IDTS-110) and `10909` (IDTS-111).
- Final targeted-rerun handoff: commit `adb66e8`, PR #270 body refreshed, Jira IDTS-111 comment `10925`.
- Candidate execution summary: `docs/pm/evidence/idts-111/execution-summary.md`.
- Catalog merge SHA: `6f01affc2c2945e51d18199137c8a89a20c77600`.
- BTP runtime SHA: `67b1bf86169e9696c9365ef4846b99ffae30d4e2`.
- Readiness: `DEMO READY` at `2026-08-02T23:06:59+07:00`.
- Execution baseline: `docs/pm/evidence/idts-111/execution-baseline.md`.
- Assignment: `docs/pm/evidence/idts-111/execution-assignment.md`.
- Workbook and Drive: unchanged in this phase.

Assigned members may now execute after running the readiness check for their session. No UAT VI, fabricated sign-off, shared member session, or historical Render evidence is allowed. AI provider-primary success and safe fallback must be reported separately.

## 2026-08-04 current-runtime update

- Reruns completed for `UAT-COM-001/003/004`, `UAT-ATT-001`, `UAT-AUTH-005`, `UAT-BUG-008`, `UAT-UX-002`, and `UAT-AI-005`.
- Comment persistence and logout redirect now meet expected behavior. Oversized comment, attachment persistence, and duplicate audit still do not meet expected behavior.
- Remaining gaps: immutable AI suggestion ID plus sanitized Network response, a Similar Bugs candidate fixture for tablet wrapping, NhanT physical-keyboard confirmation, and existing role/service fixtures.
- DonHV still owns final disposition and `UAT_EN_PREPARED` synchronization.

NhanT's retained candidate package uses the authenticated SAP BTP UI and member-owned Tester identity. It contains 76 evidence references (66 unique hashes) across 44 manifests. DonHV's partition is 24 MEETS, 8 DOES_NOT_MEET and 12 BLOCKED; ATT-001 remains reviewer-blocked because its preserved fixture sizes are inconsistent. DonHV still owns review, catalog decisions, Jira disposition, final workbook generation and same-ID Drive synchronization.
