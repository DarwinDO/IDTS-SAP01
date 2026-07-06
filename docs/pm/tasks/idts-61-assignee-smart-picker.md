# IDTS-61 - FE: Replace Assignee value help with Smart Assign picker

Last updated: 2026-07-06

## Summary

Replace the old Assignee value-help experience with the Smart Assign picker directly inside the Assignee field.

The goal is not to create another assignment action. The user should open the Assignee field, press its value-help icon, and see the Smart Assign dialog immediately.

## Scope

- Remove the separate Object Page header `Smart Assign` button.
- Remove generated Assignee DataFields from the old Assignment field group to avoid duplicate picker entry points.
- Add a custom Object Page Assignment section with:
  - Assignee input.
  - Value-help icon that opens Smart Assign.
  - Current Action Owner.
  - Action Owner Role.
- Keep backend assignment validation unchanged.
- Keep Smart Assign candidate filtering through `BugService.AssignableDevelopers`.
- Update knowledge mirrors for changed `app/` files.

## Out of scope

- No new backend assignment rule.
- No AI recommendation/ranking.
- No new role model.
- No change to Component Category or Developer Responsibility logic.

## Acceptance criteria

- [x] Object Page no longer shows a separate `Smart Assign` header action.
- [x] Assignee value-help icon opens the Smart Assign dialog.
- [x] User cannot persist arbitrary free-text assignee input.
- [x] Draft/edit assignment updates `assignee_ID`.
- [x] Active bug assignment still uses `BugService.assignToDeveloper`.
- [x] Tester/PM can use the picker.
- [x] Backend still rejects invalid assignee.
- [x] Browser smoke proves assignment persists after reload.
- [x] UI text contains no internal/developer-facing explanation.

## Evidence expectation

- CAP compile.
- UI5 build.
- Focused ESLint and UI5 linter.
- Browser smoke on the Object Page.
- IDTS-56/61 browser QA script updated for the new picker entry.
- Secret scan before PR.

## Dependencies / links

- Relates to `IDTS-56` Smart Assign dialog/dropdown.
- Relates to `IDTS-57` browser regression.
- Relates to `IDTS-60` Sprint 4 UI baseline UAT.

## Security / no-secret note

This task touches Fiori/UI5 assignment UX only. Do not log bearer tokens, private Render URLs, real emails, passwords, API keys, SMTP credentials, AWS keys, or DB URLs in screenshots, Jira comments, or PR evidence.

## Session notes

- Jira `IDTS-61` was created and moved to In Progress.
- Initial Jira transition-with-comment attempt failed because the connector expected Atlassian document format for comments inside transitions. The task was transitioned separately and then commented successfully.
- A fresh worktree at `E:\IDTS-SAP01-worktrees\idts-61` is used to avoid stale/dirty root worktree issues.
- Implementation replaced the old separate Smart Assign Object Page header action with an Assignee custom section. The Assignee input is read-only for free text persistence and opens Smart Assign through the value-help icon.
- PR #84 was merged into `dev` at merge commit `547474408f8a67db361460db201ef661cd910d57`.
- Verification passed on 2026-07-06:
  - `npm run qa:idts56:browser`
  - `npm run qa:idts56:programmatic`
  - `npx cds compile srv --to edmx -s all`
  - `npx ui5 build --config ui5.yaml --dest ..\..\.ui5-build\bug-management-ui`
  - `npx eslint app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js app/bug-management-ui/webapp/ext/controls/SmartAssignmentSection.js`
  - `npm run qa:secret-scan`
  - `npx ai-devkit@latest lint --json`
  - `git diff --check`
- Known non-blocking warning: CAP compile still reports the existing attachments `NonUpdateableProperties` vocabulary warning from `db/schema.cds`; it is not introduced by IDTS-61.
- Evidence screenshots are stored under `docs/pm/evidence/idts-61/`.
- Post-merge note: final shared-QA Render smoke is the next verification step if the deployment pipeline auto-deploys from `dev`.
