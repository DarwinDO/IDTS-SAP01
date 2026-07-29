# IDTS-115 — Expose existing AI actions through supported Fiori entry points

Jira: https://dutassociation.atlassian.net/browse/IDTS-115
Owner: DonHV
Support: DatDT (classification UI), SangVN (similar-bug/assignment UI), NhanT (QA acceptance)
Status: In Progress
Due: 2026-08-05
Baseline: `65eec9ed1271bdd97192f030b15dc93a4889f848`

## Scope

Expose the already-implemented CAP capabilities through the existing SAPUI5/Fiori surfaces:

- `Apply Classification` stays in the Classification review dialog and is gated by accepted review plus PM/Tester visibility.
- `Confirm Duplicate` stays in the Similar Bugs dialog and requires one selected accepted candidate.
- `AI Activity` stays in the PM Dashboard header and reads the existing PM-only metrics function.

No CAP contract, database schema, provider configuration, model, S3, Brevo, or lifecycle behavior changes are in scope.

## Implementation trace

| UI entry point | Source | Existing CAP contract | Safety boundary |
| --- | --- | --- | --- |
| Apply Classification | `app/bug-management-ui/webapp/ext/actions/ClassificationReview.js` | `applyClassificationSuggestion` | UI gating plus backend PM/Tester authorization, catalog/stale validation |
| Confirm Duplicate | `app/bug-management-ui/webapp/ext/actions/DuplicateReview.js` | `confirmDuplicateSuggestion` | Single selection plus backend candidate/self-link/reverse-link validation |
| AI Activity | `app/bug-management-ui/webapp/dashboard-page.js` | `readAiOperationalMetrics(windowDays=30)` | PM-only UI visibility plus CAP `@(requires: 'PM')` |

## Evidence expectations

- Focused static test `npm run qa:idts115:programmatic`.
- UI5 syntax/build/lint and existing AI regression suites.
- BTP browser evidence for PM/Tester/Developer role matrix, persistence/reload and no unintended workflow mutation.
- Sanitized network/error evidence only; never commit tokens, cookies, passwords, API keys, DB URLs or raw AI payloads.

## Current implementation note

The FE changes are prepared in branch `fix/idts-115-ai-fiori-entrypoints-donhv`. Focused verification is complete; final repository gates, PR review, SAP BTP deployment, and browser/provider acceptance remain required before IDTS-115 can be closed.

## Local verification

| Gate | Result |
| --- | --- |
| IDTS-91 review actions | 19 PASS / 0 FAIL |
| IDTS-92 review UI | 47 PASS |
| IDTS-93 classification apply | 35 PASS / 0 FAIL |
| IDTS-94 review controls | 32 PASS |
| IDTS-95 duplicate confirmation | 31 PASS / 0 FAIL |
| IDTS-97 operational metrics | 42 PASS / 0 FAIL |
| IDTS-114 provider integration | 15 PASS / 0 FAIL |
| IDTS-115 focused FE checks | 149 PASS |
| UI5 app ESLint and production build | PASS |
| UI5 MCP linter | 0 findings |
| CAP service compile | PASS with the pre-existing attachment vocabulary warning |
| Secret scan, agent rules, QA-depth self-test | PASS |
| AI DevKit and `git diff --check` | PASS |
| Ponytail simplicity | `Lean already. Ship.` |
