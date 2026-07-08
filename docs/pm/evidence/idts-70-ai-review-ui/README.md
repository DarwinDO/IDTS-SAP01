# IDTS-70 Evidence - SAP Fiori AI Suggestion Review UI Pattern

Date: 2026-07-09

## Scope

IDTS-70 adds a reusable UI helper for AI suggestion review states and applies it to Smart Assign candidate explanations.

The implementation is display-only:

- It does not add a new backend AI endpoint.
- It does not call a real AI provider.
- It does not mutate `Bugs`.
- It does not auto-select a developer.
- It keeps Smart Assign as a manual decision flow protected by backend validation.

## Changed areas

- Reusable UI helper: `app/bug-management-ui/webapp/ext/ai/AiReviewUi.js`
- Smart Assign UI integration: `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`
- User-facing text: `app/bug-management-ui/webapp/i18n/i18n.properties`
- User-facing text fallback: `app/bug-management-ui/webapp/i18n/i18n_en.properties`
- Focused QA: `scripts/qa/test-idts70-ai-review-ui.js`
- Smart Assign regression: `scripts/qa/test-idts56-smart-assign.js`
- Runtime script registry: `package.json`
- Knowledge mirrors under `docs/knowledge/app/`

## Verification evidence

Latest verification in this worktree:

```text
npm run qa:idts70:programmatic
7 PASS / 0 FAIL
```

Covered:

- loading state has review-required semantics,
- successful suggestion maps to ready-for-review state,
- low confidence maps to warning state,
- disabled suggestion support uses non-technical copy,
- unsafe/internal-looking text is replaced by a safe fallback,
- Smart Assign uses the reusable helper without raw HTML/CSS,
- required i18n keys exist and avoid internal/dev-facing wording.

```text
npm run qa:idts56:programmatic
13 PASS / 0 FAIL
```

Covered:

- Smart Assign route and section placement still work,
- assignee value help still opens Smart Assign,
- role visibility remains correct,
- candidate filtering and assignment remain protected by backend validation,
- the dialog now decorates candidates with reviewable explanations.

```text
npx ui5 build --config ui5.yaml
Build succeeded in 385 ms
```

Run from `app/bug-management-ui`.

```text
mcp__ui5.run_ui5_linter
results: []
```

Files checked:

- `webapp/ext/ai/AiReviewUi.js`
- `webapp/ext/actions/SmartAssignDeveloper.js`

```text
npx cds compile srv --to edmx -s all
exit 0
```

Known existing warning remains:

```text
NonUpdateableProperties is not a known property for @Capabilities.UpdateRestrictions
on BugService.Bugs_attachments
```

This warning existed before IDTS-70 and is unrelated to AI review UI.

```text
npm run qa:secret-scan
PASS - no credential-like key patterns found.

npx ai-devkit@latest lint --json
"pass": true

git diff --check
exit 0
```

`git diff --check` printed only line-ending warnings for existing Windows checkout behavior; no whitespace errors were reported.

## Issues found and fixed in-session

| Classification | Symptom | Root cause | Fix | Verification |
| --- | --- | --- | --- | --- |
| Product/UI helper defect | Disabled AI state showed `confidence 0%` even when confidence was missing. | JavaScript `Number(null)` returns `0`, so the helper treated a missing confidence as a real zero. | `numberOrNull(...)` now returns `null` for `null`, `undefined`, and empty string before numeric conversion. | `npm run qa:idts70:programmatic` passed `7/0`. |
| Test-harness issue | First IDTS-70 helper test failed when comparing an array created inside a VM context. | `assert.deepStrictEqual` treats cross-context arrays as different prototypes. | Changed the test to assert dependency array length instead of prototype identity. | `npm run qa:idts70:programmatic` passed `7/0`. |

## Manual review notes

The visible wording is intentionally user-facing:

- no `provider`,
- no `prompt`,
- no `token`,
- no `model`,
- no `debug`,
- no `SQL`,
- no credential or endpoint wording.

The Smart Assign UI still requires the user to choose the developer manually. The AI explanation is advisory context only.

## Known gap / non-goal

IDTS-70 introduces the reusable review pattern and applies it to the current AI-consuming UI surface, Smart Assign. It does not add separate Accept/Reject/Ignore buttons because Smart Assign already has a manual selection decision. Future AI screens can add explicit decision buttons if the UI has a separate suggestion-review workflow.

## No-secret statement

Evidence does not include API keys, bearer tokens, SMTP credentials, AWS keys, database URLs, password hashes, private emails, or private attachment content.
