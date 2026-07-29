# IDTS-115 — Expose existing AI actions through supported Fiori entry points

Jira: https://dutassociation.atlassian.net/browse/IDTS-115
Owner: DonHV
Support: DatDT (classification UI), SangVN (similar-bug/assignment UI), NhanT (QA acceptance)
Status: In Progress
Due: 2026-08-05
Implementation baseline: `65eec9ed1271bdd97192f030b15dc93a4889f848`
Merged runtime baseline: `ae209c8f82227e4dedca09247db96c0b47097d92`

## Scope

Expose the already-implemented CAP capabilities through the existing SAPUI5/Fiori surfaces:

- `Apply Classification` stays in the Classification review dialog and is gated by accepted review plus PM/Tester visibility.
- `Confirm Duplicate` stays in the Similar Bugs dialog and requires one selected accepted candidate.
- `AI Activity` stays in the PM Dashboard header and reads the existing PM-only metrics function.

No CAP contract, database schema, provider configuration, model, S3, Brevo, or lifecycle behavior changes are in scope.

## 2026-07-30 create-draft and AI review hotfix

- Root create drafts hide the Similar Bugs and Classification AI custom fields; active Bugs and edit drafts with an active source keep them.
- Defensive action guards prevent transient draft UUIDs from being sent as active `sourceBugID` values.
- Classification distinguishes HTTP 200 fallback/no-result, missing context, and retryable load errors.
- Smart Assign submits only named application update groups; for reserved `$auto`/`$direct` groups it waits for automatic PATCH completion, refreshes the Bug context, then reads the backend-derived component category before loading candidates.

## 2026-07-30 create-draft AI guard follow-up

- Root new drafts hide Similar Bugs and Classification review because they do not yet have a persisted source Bug. Edit drafts backed by an active Bug keep the entry points.
- Duplicate and Classification controller guards also reject draft-only invocation defensively.
- Classification distinguishes safe HTTP 200 fallback/no-result, the exact backend missing-context HTTP 400, and genuine authorization/network/server failures.
- Smart Assign waits for backend derivation without submitting the reserved `$auto` group and catches synchronization failures at both UI entry points.
- Focused verification after the independent review: IDTS-56 `14/14 PASS`; IDTS-115 `189 checks PASS`.
- Focused red test failed on the missing draft visibility guard, then passed after the implementation. IDTS-56, IDTS-67, IDTS-93, IDTS-115 focused checks and UI5 production build pass locally.

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

PR #214 merged normally and the selected service, app-content and AppRouter
modules are deployed on SAP BTP at merge SHA
`ae209c8f82227e4dedca09247db96c0b47097d92`. PM browser acceptance passed
Apply Classification, Confirm Duplicate and AI Activity. HANA readback confirms
the duplicate relationship and review audit persistence.

IDTS-115 remains In Progress because Tester/Developer member-owned browser
sessions are still missing. IDTS-114 also remains In Progress because Qwen
structured primary calls did not produce `SUCCESS` for Classification, Handoff
Summary or Smart Assign in this run.

## Create-flow follow-up

The Create Bug investigation isolated two separate concerns:

- The Defect Category value help had a redundant output mapping for
  backend-derived `componentCategory_ID`. The focused fix removes that mapping;
  CAP continues to derive the active component/category pair during draft
  PATCH and validate it during active write.
- Fiori Elements lazy-binds the Reproduction section. Browser automation must
  open `Reproduction and Test Context` and wait for field bindings before
  entering Steps, Actual and Expected. Directly filling off-screen controls is
  a test-harness error; no Object Page controller workaround is retained.

Local PM acceptance created `BUG-0005` on the first attempt and confirmed all
three reproduction fields after reload. Evidence:
`docs/pm/evidence/idts-115/create-draft-binding/`.

The same source fix was selectively deployed to SAP BTP at merge SHA
`4fa1eaa45a7e56c71ea628127ebf9172ef02c14e`. A cache-busted PM browser run
created `BUG-0022` on the first attempt. All reproduction fields remained
visible after reload, HANA readback confirmed their values and the
backend-derived Component Category, and the earlier Defect Category
`invalid segment` warning did not recur. Evidence:
`docs/pm/evidence/idts-115/create-draft-binding/btp/`.

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
| UI5 MCP manifest validation | PASS |
| UI5 MCP linter | Pre-existing manifest-v2 and legacy QUnit migration findings; no IDTS-115 annotation finding |
| CAP service compile | PASS with the pre-existing attachment vocabulary warning |
| Secret scan, agent rules, QA-depth self-test | PASS |
| AI DevKit and `git diff --check` | PASS |
| Ponytail simplicity | `Lean already. Ship.` |

## SAP BTP acceptance

| Gate | Result |
| --- | --- |
| Selective deploy without DB deployer | PASS |
| Service/AppRouter started and health/redirect checks | PASS |
| PM Apply Classification and reload | PASS |
| PM Confirm Duplicate and HANA readback | PASS |
| PM AI Activity | PASS |
| PM review/no-mutation | PASS |
| Tester interactive cases | PENDING member-owned sign-in |
| Developer interactive 403 cases | PENDING member-owned sign-in |
| Qwen embedding primary | PASS observed |
| Qwen structured primary | PASS technical criterion: Classification, Handoff and Smart Assign each have at least one real primary-model `SUCCESS`; intermittent provider failure remains safely handled |
| PM Create Bug browser console and persistence | PASS after cache-busted deployment acceptance |
| Tester/Developer Create Bug role evidence | PENDING member-owned sign-in |

Evidence: `docs/pm/evidence/idts-115/`.
