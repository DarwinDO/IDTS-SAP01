# IDTS-65 Evidence - AI Suggestion Audit Model

## Scope

IDTS-65 adds the backend foundation for storing AI suggestions as safe, reviewable audit rows.

Implemented pieces:

- `db/schema.cds`: `AiSuggestionFeatureTypes`, `AiSuggestionReviewStates`, `AiSuggestions`, and `Bugs.aiSuggestions`.
- `db/data/`: seed rows for approved AI feature types and human review states.
- `srv/service.cds`: read-only `BugService.AiSuggestions` projection plus code-list projections.
- `srv/ai/audit.js`: backend-owned writer for sanitized AI suggestion audit rows.
- `scripts/qa/test-idts65-ai-suggestion-audit.js`: focused verification.

## Verification evidence

Latest focused result:

```text
npm run qa:idts65:programmatic
TOTAL: 19 PASS | 0 FAIL | 19 checks
```

Covered checks:

- AI feature type seed data exists.
- AI review state seed data exists.
- Raw prompt/message/provider-like secret fields are removed from stored payload.
- Backend writer creates a normalized audit row.
- Review state defaults to `PENDING`.
- Confidence is clamped and rounded to four decimals.
- `BugService.AiSuggestions` exposes readable labels through read-only projection.
- Client-style create through `BugService.AiSuggestions` is rejected.
- Inactive feature type is rejected by backend writer.

## Notes

- The first focused run failed because the fresh worktree had no `node_modules`; fixed by `npm ci --include=dev`.
- `npm ci --include=dev` reported 14 existing npm audit findings, consistent with the current dependency baseline and not introduced by IDTS-65.
- A first direct CQN write test did not exercise the service guard correctly; the QA script was corrected to use `tx.create(service.entities.AiSuggestions)`, matching the existing read-only service guard test style.
- No real AI provider, credential, prompt, private endpoint, attachment content, or user private data is included in this evidence.

