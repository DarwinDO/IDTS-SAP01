# WP6 - PM Monitoring

## 2026-08-08 Effective developer capacity

- `DeveloperWorkloads` and `AssignableDevelopers` now derive the same effective availability: 0-1 Available, 2 Busy, 3+ Unavailable.
- Manual Unavailable remains authoritative; the fixed MVP limit is 3 and PM has no override. Rejected counts, Closed does not.
- Smart Assign, AI explanation grounding, and Dashboard consume the same backend-derived status/count contract.
- PR #312 merged and the exact release SHA `ccb2fd102b2daacaa3685bcfe671e0772ef1bbc4` is live in the CAP service. Developer workload verification passes 39/39 together with Smart Assign, assignment explanation and PM monitoring regressions; WP6 remains In Progress for its existing manual follow-ups.

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

## 2026-06-24 FE Filter Variant Integration Update

- PR #17 fixed the local SQLite stale service-view blocker for PM monitoring filters by adding `dev:sqlite:refresh-views` and the canonical `qa:pm-monitoring:http` OData regression.
- PR #16 was repaired on DatDT's branch after the merge conflict with PR #17:
  - the four business tabs use the backend monitoring flags again: `isOverdue`, `isPendingAssignment`, `isRejectedFollowUp`, and `isRetestRequired`;
  - the misleading `My Action Items` tab is now `PM Action Queue`, filtering records routed to `nextProcessorRole_code = 'PM'`;
  - the knowledge mirror for `pm-monitoring.cds` explains the cross-folder contract and local SQLite refresh requirement.
- Browser UAT on a persistent local SQLite database must run `npm run dev:sqlite:refresh-views` before opening the app, otherwise old local service views can still produce `no such column` errors even when source code is correct.

## 2026-08-06 IDTS-126 Filter Token Text Remediation

- Dashboard drill-down continues to set canonical scalar IDs/codes and execute the List Report filter automatically.
- IDTS-126 adds SAP-supported `Common.Text` plus `TextOnly` metadata so key-backed filter tokens display business names instead of UUIDs/codes.
- The metadata-only change does not alter dashboard navigation, OData filter semantics, HANA schema, seed data or master data.
- Focused EDMX validation covers 11 key-backed SelectionFields; PM/Tester dashboard regression remains part of the release gate.
- Current state: implementation and local gates complete; BTP deployment and signed-in browser acceptance are pending the normal PR/merge process.
