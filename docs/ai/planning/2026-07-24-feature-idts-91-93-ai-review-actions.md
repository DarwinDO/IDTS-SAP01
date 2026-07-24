---
phase: planning
title: IDTS-91/92/93 AI Review and Apply Actions
description: Test-first implementation plan for explicit human review and validated classification apply.
---

# IDTS-91/92/93 AI Review and Apply Actions

## Confirmed scope

- IDTS-91 adds authenticated CAP actions to accept, reject, or ignore a `PENDING` `AiSuggestions` row.
- IDTS-92 adds Accept, Reject, and Ignore controls to the existing Similar Bugs and Classification dialogs, then shows persisted reviewer and review time.
- IDTS-93 adds a CAP action that applies only an `ACCEPTED` classification suggestion after current authorization, Bug access, catalog, payload, and consistency validation.
- AI remains advisory. Review does not change `Bugs`, `DuplicateLinks`, assignee, or workflow state.
- Applying classification changes only the approved classification fields and writes grouped Bug history in one request transaction.

## Ordered task queue

- [x] IDTS-91: add focused failing backend tests for review actions.
- [x] IDTS-91: add OData action contracts and CAP handlers using a request transaction.
- [x] IDTS-91: verify positive, invalid state, missing suggestion/Bug, role/access, repeat request, rollback, persistence, and no-Bug-mutation cases.
- [x] IDTS-92: add focused failing UI tests for action rendering, disabled repeat actions, persisted refresh, safe errors, and busy cleanup.
- [x] IDTS-92: add review controls to existing Similar Bugs and Classification dialogs using shared UI helpers and i18n.
- [x] IDTS-92: run UI5 linter/build plus focused browser verification.
- [x] IDTS-93: add focused failing backend tests for accepted classification apply.
- [x] IDTS-93: add OData action contract and CAP handler that reuses existing Bug write/catalog validation.
- [x] IDTS-93: verify allowlist, accepted-only state, stale/malformed/inactive values, authorization, idempotency, grouped history, rollback, and manual-edit regression.
- [x] Update bilingual knowledge mirrors, PM handover, work package, and task board.
- [x] Run final CAP compile, focused/regression QA, UI5 linter/build, secret scan, AI DevKit lint, `git diff --check`, implementation check, and code review.

## Existing components to reuse

- `srv/ai/audit.js` for sanitized `AiSuggestions` persistence rules.
- `srv/ai/classification-suggestion.js` for classification payload shape and catalog grounding.
- Existing `srv/service.js` Bug authorization, classification consistency validation, and grouped history helpers.
- `app/bug-management-ui/webapp/ext/ai/AiReviewUi.js` for review state/copy.
- Existing `DuplicateReview.js` and `ClassificationReview.js` dialogs; no new generic AI section.

## Constraints and risks

- CAP MCP is unavailable in this session; Fiori MCP cannot be used because its mandatory `tools/list` entry is absent. UI5 MCP guidance is available.
- OfficeCLI is unavailable, so Markdown changes use repository-native patching and no Office-format validation is claimed.
- Preserve untracked user files and avoid unrelated worktree changes.
- Do not expose tokens, private email/endpoints, provider internals, raw payloads, or backend error detail.
- Do not add dependencies or speculative abstractions.

## Completion criteria

- All three Jira acceptance scopes have focused automated evidence.
- Review state persists and is visible after refresh; repeat decisions are rejected safely.
- Review actions never mutate Bug business data.
- Apply classification changes only authorized, accepted, currently valid classification values and writes grouped history atomically.
- Normal manual Bug classification and non-AI workflows remain unchanged.

## Completion summary

All three Jira slices are implemented and verified on `feature/idts-91-93-implementation-datdt`. Focused backend suites pass with IDTS-91 at 19/19 and IDTS-93 at 35/35; the IDTS-92 static contract has 47 passing checks and both contextual browser suites pass. Final CAP compile, UI5 build/lint, security scans, regressions, syntax checks, and diff validation also pass, subject to the environment limitations recorded in the DatDT status log.
