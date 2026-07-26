---
phase: implementation
title: IDTS-91/92/93 AI Review and Apply Implementation
description: Implementation alignment for persisted human review and guarded classification apply.
---

# IDTS-91/92/93 Implementation Check

## Outcome

Implementation matches the confirmed Jira scope and the existing suggestion-only AI guardrails.

| Task | Implemented behavior | Main files |
| --- | --- | --- |
| IDTS-91 | Accept/Reject/Ignore update only a current `PENDING` suggestion with authenticated reviewer/time and conditional conflict protection. | `srv/ai/review.js`, `srv/service.cds`, `srv/service.js` |
| IDTS-92 | Existing Similar Bugs and Classification dialogs use one shared review helper, show persisted state/reviewer/time, disable repeat decisions, clear busy state, and keep generic errors. | `AiSuggestionReview.js`, `DuplicateReview.js`, `ClassificationReview.js` |
| IDTS-93 | Tester/PM may apply only an accepted current classification suggestion after payload allow-list, active-catalog, component/category, authorization, assignee, stale-snapshot, and idempotency checks. History is grouped in the same transaction. | `srv/ai/classification-apply.js`, `classification-suggestion.js`, `bug-write.js` |

## Contract and safety alignment

- Review actions do not change `Bugs`, `DuplicateLinks`, assignment, or workflow state.
- Apply changes only SAP Module, Application Component, Defect Category, derived Component Category, Priority, and Severity.
- Reviewer identity comes from the authenticated CAP request, never the client payload.
- Generated classification audits store a safe five-field source snapshot for stale-write protection.
- Error responses and UI messages do not expose raw provider/backend details.
- No schema migration, dependency, environment variable, endpoint, or autonomous AI workflow was added.

## Review result

- No blocking design deviation found.
- The initial duplicated UI review logic was consolidated into `AiSuggestionReview.js` during the simplicity review.
- Canonical business documents remain unchanged because the implementation realizes already-approved AI guardrails and introduces no new role, status, or scope decision.
