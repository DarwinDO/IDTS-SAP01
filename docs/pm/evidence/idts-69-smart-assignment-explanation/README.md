# IDTS-69 Evidence - Smart Assignment AI Explanation

Date: 2026-07-09

## Scope

IDTS-69 adds reviewable AI explanations to Smart Assign developer candidates.

The implementation is suggestion-only:

- It does not auto-select a developer.
- It does not mutate `Bugs`.
- It keeps existing backend assignment validation as the final authority.
- It falls back safely when AI is disabled or unavailable.

## Changed areas

- Backend OData contract: `srv/service.cds`
- Backend runtime wiring: `srv/service.js`
- AI feature module: `srv/ai/assignment-explanation.js`
- AI export boundary: `srv/ai/index.js`
- Shared candidate source: `srv/bug-service/read-models.js`
- Smart Assign UI: `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`
- UI text keys: `i18n.properties`, `i18n_en.properties`
- Focused QA: `scripts/qa/test-idts69-assignment-explanation.js`
- Regression QA: `scripts/qa/test-idts56-smart-assign.js`

## Verification evidence

Latest verification in this worktree:

```text
npm run qa:idts69:programmatic
6 PASS / 0 FAIL
```

Covered:

- provider success returns candidate explanation,
- suggestion audit row is written for a source bug,
- AI disabled falls back safely,
- missing classification returns safe `400`,
- invalid assignment remains blocked by backend validation,
- explanation action does not mutate bug workflow or assignee.

```text
npm run qa:idts56:programmatic
13 PASS / 0 FAIL
```

Covered:

- Smart Assign dialog still loads,
- candidate filtering still works,
- explanation action is called,
- explanation rows are merged into candidate view model,
- existing selection/assignment behavior remains intact.

```text
npx cds compile srv --to edmx -s all
exit 0
```

Known existing warning remains:

```text
“NonUpdateableProperties” is not a known property for “@Capabilities.UpdateRestrictions”
on BugService.Bugs_attachments
```

This warning existed before IDTS-69 and is unrelated to Smart Assign explanation.

```text
npm run qa:idts64:programmatic
26 PASS / 0 FAIL

npm run qa:idts65:programmatic
19 PASS / 0 FAIL

npm run qa:idts66:programmatic
30 PASS / 0 FAIL

npm run qa:idts67:programmatic
22 PASS / 0 FAIL

npm run qa:idts68:programmatic
28 PASS / 0 FAIL
```

AI feature regression from the provider foundation through duplicate detection, classification, and handoff summary stayed green.

```text
npx ui5 build --config ui5.yaml
Build succeeded in 8.45 s
```

Run from `app/bug-management-ui`.

```text
npm run qa:secret-scan
PASS - no credential-like key patterns found.

npx ai-devkit@latest lint --json
"pass": true

git diff --check
exit 0
```

## Known non-product issues observed

- Fresh worktree initially had no `node_modules`; first verification commands failed with missing `@sap/cds` / `@cap-js/attachments`. Fixed by running `npm ci --include=dev`.
- `npm ci --include=dev` reported the existing dependency audit baseline: 14 findings, 9 moderate and 5 high. IDTS-69 added no new runtime package.
- The older mirror `docs/knowledge/srv/service.cds.md` contains invalid UTF-8 bytes, so the safe patch tool could not update it directly. IDTS-69 supplemental notes were added instead.

## Manual review notes

The UI copy intentionally says explanation helps review fit, workload, and availability. It does not say AI chooses the assignee.

The Explanation column is advisory. Tester/PM must still choose a developer manually.

## No-secret statement

Evidence does not include API keys, bearer tokens, SMTP credentials, AWS keys, database URLs, password hashes, or private attachment content.
