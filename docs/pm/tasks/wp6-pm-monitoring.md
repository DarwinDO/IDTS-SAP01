# WP6 - PM Monitoring

Status: In Progress
Owner workstream: Backend CAP / Fiori UI5
Last updated: 2026-06-20

## Goal

Give PM users enough visibility to monitor workload, overdue bugs, pending assignment, and next-action queues.

## Inputs

- WP1 fields for due date, assignee, nextProcessor, priority, severity, status.
- WP2 service projections.
- WP3 status and nextProcessor rules.
- `docs/ba/07-fiori-ux-requirements.md`

## Tasks

| ID | Task | Status |
| --- | --- | --- |
| WP6-T01 | Define PM filter variants or projections. | In Progress |
| WP6-T02 | Add overdue and pending assignment monitoring support. | Done |
| WP6-T03 | Add workload by Developer support. | Done |
| WP6-T04 | Add nextProcessor queue support. | Done |
| WP6-T05 | Verify PM scenario with sample data. | In Progress |

## Definition of Done

- PM can identify overloaded, overdue, pending, and next-action items.
- Monitoring is useful but does not become a full project management system.

## 2026-06-20 Kickoff Update

- Ownership wording baseline is now locked: `Assignee` remains the technical owner, and `Current Action Owner` is the person or queue that must act now.
- `Cancel` is not added in Sprint 3 by default; keep it as discovery-only unless a later explicit decision changes the lifecycle.
- Backend kickoff started with a read-only `currentActionOwnerDisplayName` contract on `BugService.Bugs`, derived from existing status, assignee, and nextProcessor data.
- Remaining Sprint 3 work for this package is FE monitoring views, filter variants, overdue/rejected/retest scenarios, and browser UAT.

## 2026-06-20 Backend Contract Update

- Added filterable read-only monitoring fields on `BugService.Bugs`: `isOverdue`, `isPendingAssignment`, `isRejectedFollowUp`, and `isRetestRequired`.
- Added filter-bar/backend support for current action owner lookup through `nextProcessorUser_ID` and `nextProcessorRole_code`, including value help on `nextProcessorUser`.
- Hardened the READ dependency logic so `currentActionOwnerDisplayName` still resolves correctly when clients request sparse selections.
- Programmatic backend verification now covers:
  - computed monitoring flags on seeded PM scenarios,
  - overdue exclusion for a closed bug,
  - filter behavior for overdue, pending assignment, rejected follow-up, and retest-required,
  - read-model enrichment for `currentActionOwnerDisplayName`.
- Remaining Sprint 3 work for this package is FE monitoring variants/views, ownership summary consumption in FE, and browser UAT.

## 2026-06-20 Developer Workload Contract Update

- Added read-only aggregate entity `BugService.DeveloperWorkloads` for PM monitoring instead of overloading `BugService.Bugs` with grouped workload logic.
- The aggregate is explicitly ownership-based: counts roll up by `assignee` as the technical owner, while `currentActionItemCount` separately shows how many bugs currently point back to that developer as the next actor.
- Each workload row now exposes:
  - open owned bug count,
  - overdue owned bug count,
  - current action item count,
  - per-status breakdown for assigned / in-review / in-progress / reopened / need-more-information / resolved / retest-required / rejected,
  - total estimated effort hours,
  - workload limit and derived `isOverloaded`,
  - developer identity / availability metadata.
- Inclusion rule is intentional for PM visibility:
  - active developers remain visible even with zero current load,
  - inactive developers remain visible only if they still own open bugs that must be reassigned or cleaned up.
- Programmatic verification now covers service-level filtering, search, pagination, `$count`, projection, overload detection, inactive-backlog retention, and zero-load active developers through `scripts/qa/test-developer-workload-programmatic.js` (`36 PASS / 0 FAIL`).
- Remaining Sprint 3 work for this package is FE consumption of `DeveloperWorkloads`, browser/UAT confirmation, and final PM filter-variant polish.
