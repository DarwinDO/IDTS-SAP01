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
- Next handoff: commit the approved package, then provide it to DonHV for merge and
  final workbook integration.
