# IDTS-97 — Privacy-safe AI operational metrics

## Summary

Adds privacy-safe operational fields and a PM-only aggregate read function for audited AI suggestions. The implementation does not expose prompts, responses, raw errors, user emails, attachment content, private endpoints or credentials.

## Ponytail Simplicity

- Reuses the existing `AiSuggestions` audit table instead of adding a new telemetry store.
- Adds only two nullable columns and one pure aggregation module.
- Uses one narrow, idempotent PostgreSQL helper instead of broad CAP deployment or a migration framework.
- Adds no UI framework, queue, scheduler or monitoring dependency.

## Positive Evidence

- `npm run qa:idts97:programmatic`: 39 PASS / 0 FAIL.
- PM can read aggregate counts, review outcomes, and latency samples.
- Nullable latency is excluded from average/max calculations instead of being treated as zero.

## Negative Evidence

- Tester/Developer access to `readAiOperationalMetrics` is rejected with HTTP 403.
- Provider timeout, unavailable configuration, and provider error remain separate safe outcomes.
- Metrics logger failure does not change the AI result or Bug workflow.

## Edge/Boundary Evidence

- `windowDays` defaults to 30 days and is capped at 90 days.
- Invalid/negative latency becomes `null`; integer latency is bounded to the database integer range.
- Migration dry-run executed twice without opening a database connection.

## Roles/Authorization

- The CAP function is annotated `@(requires: 'PM')`.
- Focused integration verifies PM success and non-PM denial.

## Persistence/Reload

- `operationStatus` and `latencyMs` are persisted on `AiSuggestions` and read through the safe projection.
- The additive PostgreSQL helper uses two `ADD COLUMN IF NOT EXISTS` statements inside one transaction.
- Shared QA migration/reload evidence is pending because this Draft PR must not deploy before IDTS-95 and the Knowledge Gate are complete.

## UI/UX Review

- No UI is introduced by IDTS-97; the interface is a PM-only read function for later monitoring work.
- Existing UI5 build succeeds.

## Known Gaps

- **BLOCKED:** IDTS-95 must merge first, then this branch must merge the resulting `dev` and rerun the focused regression.
- **BLOCKED:** SangVN has not completed the dedicated metrics/privacy Ownership Knowledge Gate. This PR must remain Draft and must not merge until real PASS evidence exists.
- Shared QA migration/deploy and live smoke are intentionally deferred until both blockers are cleared.

## Jira/Evidence Links

- Jira: IDTS-97.
- Repository evidence: `docs/pm/evidence/idts-97/README.md`.
- Migration knowledge mirror: `docs/knowledge/scripts/db/migrate-idts97-ai-metrics.js.md`.
- Baseline commit: `2db94c5abc100ff77b278e55a037882622e3a7e1`.

## Ownership Knowledge Gate

`PENDING — dedicated SangVN metrics/privacy gate has not been completed.`
