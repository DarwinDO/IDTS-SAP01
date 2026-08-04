# IDTS-109 — Technical Specification standards, messages and monitoring/AI package

- Owner: DatDT
- Support: DonHV
- Due: 2026-07-30
- Status: Blocked by IDTS-105 and IDTS-106
- Jira: https://dutassociation.atlassian.net/browse/IDTS-109

## Gate sequence

1. Agent prepares candidate requirements, standards, exhaustive messages and traces.
2. DatDT reviews and records Jira + repo approval.
3. Approved package is handed to IDTS-112 integration.

## Scope

Business-level Functional Requirements, SAP/CAP naming standards, message source scan,
login/profile, dashboard/monitoring, notification UI and AI traces.

## 2026-07-31 read-only candidate review

- Baseline briefing read by the agent at commit
  `4b4c93c1d8b45024677653e1f890d52e742b2aaf`; DatDT's personal acknowledgment
  remains `PENDING`.
- Jira IDTS-109 is `To Do`, assigned to DatDT, overdue from 2026-07-30, blocked by
  IDTS-105 and IDTS-106, and governed by the shared-artifact single-writer workflow.
- The same-ID Drive artifact is
  `SU26SAP01_GSU26SAP01_Technical_Specification_EN_v0_7_20260726.xlsx`,
  modified 2026-07-30. It preserves the 12 official template tabs.
- Current candidate gaps:
  - `Functional Requirements` has eight technical rows with service/source/evidence
    columns instead of business-level requirement text.
  - `Development Standards` contains only a small set of generic statements rather
    than a SAP-to-CAP/Fiori naming and compliance matrix.
  - `Message Definition` contains seven representative messages, while a read-only
    source scan found 92 CAP reject/error call sites, 33 JavaScript throw call sites,
    74 UI feedback-control references, and 375 i18n keys before deduplication and
    user-facing classification.
  - `Technical Implementation` contains 37 flow rows but only five trace columns;
    the mentor briefing requires per-function UI, HTTP/OData, service, handler,
    validation/authorization, transaction, persistence/provider, response,
    failure/rollback and evidence detail.
- Recommended correction is a reviewable English structured-source package under
  `docs/pm/evidence/idts-109/technical-spec/`, followed by DatDT approval and DonHV
  integration into Technical Specification EN v0.8. Do not edit or upload the final
  Drive workbook from this task.

## 2026-07-31 candidate package authored

- DatDT personally completed the briefing acknowledgment in the repository and Jira
  IDTS-109 comment `10762`; Jira is now `In Progress`.
- Created the English-only candidate package under
  `docs/pm/evidence/idts-109/technical-spec/`:
  - business-level Functional Requirements;
  - a 20-row SAP-to-CAP/Fiori Development Standards matrix;
  - a source-derived message scan manifest and catalog covering authentication,
    Bug/action validation, collaboration, dashboard, notification/email, AI and
    internal-only exception families;
  - separate 14-part traces for login, profile, logout, dashboard, monitoring,
    in-app notifications, email outbox and all ten AI actions/functions;
  - review, missing-evidence and final-integration checklists.
- The package explicitly records live OpenAI as
  `BLOCKED / NOT ACCEPTED — provider disabled`.
- No Jira approval was added on DatDT's behalf, no official Drive file was changed
  and no final-artifact PASS was claimed.
- Next handoff: DatDT reviews the package and records approval/corrections on
  IDTS-109. DonHV performs final workbook integration under the current workflow.

## 2026-07-31 candidate approval

- DatDT approved the candidate package in Jira IDTS-109 comment `10763`.
- The approval covers the business requirements, standards, source-derived message
  definition, identity/dashboard/notification traces, all ten AI traces and the
  known-gap register.
- Accepted limitations remain OfficeCLI unavailability, missing application UI
  traces for `applyClassificationSuggestion`, `confirmDuplicateSuggestion` and
  `readAiOperationalMetrics`, and disabled/not-accepted live OpenAI.
- Approval permits commit, merge and DonHV final-workbook integration. It does not
  authorize overwriting the official Drive artifact from this branch.
- Approved package commit: `9fec741`.
- Jira commit/verification evidence: IDTS-109 comment `10764`.
- Next handoff: provide the branch to DonHV for merge and final workbook
  integration.

## 2026-07-31 latest-dev reconciliation before PR

- Fetched and merged `origin/dev`
  `69f6d06310df90a31afd63f05b7c0f2b102fe860`; the branch had been 109 commits
  behind and merged without conflict.
- The newer IDTS-114/115 source invalidated three approved known-gap statements:
  application UI now invokes `applyClassificationSuggestion`,
  `confirmDuplicateSuggestion` and `readAiOperationalMetrics`.
- Refreshed TI-AI-08/09/10 with current frontend triggers, confirmation/success/
  failure/refresh behavior and IDTS-115 evidence.
- Refreshed message scan counts to 96 CAP message call sites, 19 explicit throw
  sites, 62 UI feedback sites and 485 i18n entries; added Apply, Confirm Duplicate,
  AI Activity and Vercel Gateway rows for a current 82-row candidate catalog.
- Updated provider wording: direct OpenAI live is not accepted by this candidate;
  Vercel Gateway evidence is staged but IDTS-115 remains `PARTIAL PASS` because the
  interactive role matrix and provider-primary structured-output acceptance are
  incomplete.
- This material delta occurred after DatDT approval comment `10763`; the PR must be
  treated as needing DatDT delta confirmation and DonHV review before final
  integration.
- Branch push succeeded:
  `origin/docs/idts-109-drive-doc-review-datdt` at reconciliation commit
  `b54319d`.
- GitHub CLI authentication remains invalid, but DatDT signed in through the Codex
  in-app browser, which removed the PR-creation blocker without exposing credentials.

## 2026-07-31 Draft PR and DonHV review handoff

- Created Draft PR
  [#240](https://github.com/DarwinDO/IDTS-SAP01/pull/240) from
  `docs/idts-109-drive-doc-review-datdt` into `dev`.
- Requested review from GitHub user `DarwinDO` (DonHV); GitHub shows
  `Awaiting requested review from DarwinDO`.
- The PR remains Draft and retains the post-`dev`-sync delta-review, OfficeCLI and
  IDTS-115 partial-acceptance limitations.
- No official Google Drive artifact was modified. DonHV remains the final workbook
  integrator and Drive synchronizer after review.
- Next handoff: DatDT confirms the post-`dev`-sync delta; DonHV reviews PR #240 and
  decides final workbook integration and Drive synchronization.

## 2026-07-31 DonHV comment 10769 latest-dev reconciliation

- Fetched `origin/dev` and confirmed the branch was behind by six commits.
- Merged `origin/dev` at `a77b379` without rebase, force-push or conflict; merge
  commit: `2c4bc05`.
- Reviewed the IDTS-115 Smart Assign delta. The runtime change scopes draft
  pending checks to the application update group, preventing unrelated UI5
  `donotsubmit` contexts from blocking candidate loading.
- Updated TI-AI-04 with the wait/refresh/read sequence, failure behavior and source
  symbols. Added the source-derived safe load error and internal timeout family,
  bringing the candidate message catalog from 82 to 84 rows.
- No business requirement, backend contract, authorization boundary or official
  Google Drive workbook changed.
- Fresh local verification passed: 17/17 traces with all 14 fields, 84 message
  rows, source manifest `96/19/62/485`, Smart Assign `14/0`, assignment
  explanation `13/0`, IDTS-115 `241`, secret scan, AI DevKit lint
  `5 ok / 0 miss / 0 warn` and `git diff --check`.
- Candidate head `5e493eb` passed GitHub `qa-depth-gate` run `30600409435`
  in 40 seconds. The remaining Node.js 20 deprecation annotation is a
  non-blocking CI-maintenance warning already recorded in DatDT status.
- DatDT's Jira delta-confirmation comment remains a required human handoff after
  fresh checks and final commit SHA are available.

## 2026-08-02 DonHV comment 10834 current-dev refresh

- Completed the refreshed DatDT Ownership Knowledge Gate before implementation:
  7/7 final answers after guided corrections, critical security/data boundary PASS,
  controlled provider-timeout debug PASS and teach-back PASS.
- Fetched `origin/dev` at `fbea12c` and merged normally without rebase,
  force-push or conflict; merge commit `c633770`.
- Regenerated the English candidate from current source with 19 separate 14-part
  traces and 93 source-derived message rows. New coverage includes SAP BTP
  AppRouter/XSUAA role alignment, HANA-backed readiness, feature-specific Gateway
  routes/request budgets, bounded safe output and complete Smart Assign candidate
  coverage using temporary references rather than developer UUIDs.
- Retained the correct provider distinction: standalone `provider=openai` is not
  accepted, while PM live evidence exists for an OpenAI classification model and
  the other approved feature models behind Vercel Gateway. Tester/Developer
  interactive role coverage remains open.
- Fresh local verification: source manifest `96/18/62/485`; 19/19 traces contain
  fields 1-14; BTP auth 12/12; relogin/readiness PASS; provider 77/0; Smart Assign
  14/0; assignment explanation 13/0; AI UI 241; CAP compile exit 0; secret scan,
  agent-rule check, QA depth self-test, AI DevKit `5/0/0`, English-only scan and
  `git diff --check` PASS.
- OfficeCLI remains unavailable, so workbook/template validation is not claimed.
  No official Drive file was changed. DonHV remains the final workbook integrator.
- Next handoff: commit and push the candidate, obtain a fresh GitHub
  `qa-depth-gate`, post automated technical evidence to Jira, then ask DatDT to
  personally approve the exact candidate commit.

## 2026-08-04 DatDT briefing acknowledgment refresh

- DatDT personally acknowledged briefing commit
  `3e78b495cb8feb56188cc446b827d47e040e1b98` in Jira IDTS-109 comment `10944`.
- Corrected the repository acknowledgment to the same exact SHA, date and current
  Technical Specification/Developer-UAT ownership wording.
- Normally merged remote PR #240 head `4495411`; the only conflict was the shared
  acknowledgment table and was resolved by preserving current remote member rows
  plus DatDT's confirmed READ row. No rebase or force-push was used.
- Fresh local workflow-equivalent checks passed: QA Depth self-test `15/0`, CAP
  compile, auth `28/0`, IDTS-41 `18/0`, IDTS-43 `12/0`, email outbox, Fiori build,
  secret scan, AI DevKit `5/0/0` and `git diff --check`.
- Remaining handoff: push the exact head, require a fresh GitHub `qa-depth-gate`,
  then DatDT personally reviews and approves or rejects that exact head. DonHV
  remains the final workbook integrator and Drive synchronizer.
