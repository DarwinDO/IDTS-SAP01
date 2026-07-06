# IDTS-47 - History Timeline Limit on Object Page

Last updated: 2026-07-07

## Summary

Jira `IDTS-47` covers a Sprint 4 UX polish item raised from SangVN's `IDTS-32` UAT observation: the Object Page `History` custom timeline rendered every history event by default, making bugs with many workflow/comment/audit entries hard to scan.

## Scope

- Keep the single readable custom `History` section on the Bug Object Page.
- Do not restore the old duplicate raw History table as the main user-facing view.
- Preserve expandable audit details through `HistoryLogs`.
- Prefer a UI5/Fiori-supported frontend solution unless backend paging becomes necessary.

## Implementation Decision

Use `sap.m.List` growing on `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`.

- Initial visible event count: `5`.
- Older history access: standard UI5 growing trigger at the bottom of the list.
- `growingScrollToLoad`: `false`, because the Object Page has multiple sections and scrollable content; an explicit trigger is clearer and avoids scroll-container assumptions.
- Backend history/audit data remains unchanged.

## Verification Plan

- Deterministic regression:
  - UI5 lint for `webapp/ext/fragment/HistoryTimeline.fragment.xml`.
  - `npx cds compile srv app/bug-management-ui --to edmx -s all`.
  - `npx ui5 build --config ui5.yaml --clean-dest` from `app/bug-management-ui`.
- Falsification-first browser QA:
  - Use a bug with more than 5 history events.
  - Verify initial History render does not make the Object Page excessively long.
  - Verify older events remain accessible through the growing trigger.
  - Expand an event detail panel and verify `HistoryLogs` still render readable field/value rows.
  - Verify browser console has no new binding/type errors.

## Verification Evidence

- UI5 MCP linter on `webapp/ext/fragment/HistoryTimeline.fragment.xml`: no findings.
- `npx ui5 build --config ui5.yaml --clean-dest` from `app/bug-management-ui`: pass.
- `npx cds compile srv app/bug-management-ui --to edmx -s all`: pass with the pre-existing attachment capability warning only.
- Browser QA on `localhost:4004`: pass with a temporary bug containing 8 history events.
  - Initial visible history count: `5`.
  - Count after growing trigger: `8`.
  - Expandable detail proof: `Show Details` opens the field/old/new value table.
  - Evidence screenshots: `docs/pm/evidence/idts-47/01_history_initial_limited.png`, `02_history_after_growing_more.png`, and `03_history_detail_expanded.png`.

## Status

Implementation verified locally. Ready for PR/Jira review.
