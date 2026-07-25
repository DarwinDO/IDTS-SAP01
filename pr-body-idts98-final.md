## Summary
Resolves IDTS-98: QA: Build deterministic AI quality and safety evaluation dataset.
This PR adds a deterministic QA dataset and evaluation script to test AI features (Classification, Similar Bugs, Handoff, Smart Assign) independent of a live provider. It proves the fallback logic gracefully handles adversarial inputs (prompt injection) and infrastructure failures (timeout, mock error, missing data).

## Positive Evidence
Evaluated positive English, Vietnamese, and mixed-language scenarios successfully in the mock layer. Smart assignment explanations and bug summary fallbacks were verified by checking `OData Action` integration via `tx.send`. `node scripts/qa/test-idts98-ai-evaluation.js` passes 100% of cases.

## Negative Evidence
Malformed payloads and sparse inputs trigger the expected `Abstain: true` paths or graceful safe fallbacks without application errors. Verified that `LOW_CONFIDENCE` properly sets actual abstain behavior.

## Edge/Boundary Evidence
Prompt injection scenarios correctly trigger safety boundaries (`containsHighRiskDiagnostic` and `containsUnsafeDiagnosticText`), degrading gracefully into a non-breaking UI state with `providerStatus: AI_OUTPUT_UNSAFE`.

## Roles/Authorization
Verified the evaluation script executes successfully using an authenticated 'Tester' mock identity, aligning with operational restrictions.

## Persistence/Reload
Not applicable (evaluation script is programmatic and not UI-based). The mock state correctly handles transaction boundaries and DB setup.

## UI/UX Review
Not applicable (QA testing infrastructure only). The fallback patterns verified here guarantee stable UI behavior for users during provider outages.

## Ponytail Simplicity
The script directly leverages `tx.send` to dispatch requests to the backend logic without requiring a full web server or container setup. Only minimal mock configuration is required. Reused existing mock tools.

## Known Gaps
None. The evaluation suite runs reliably offline and covers all AI service scenarios (Handoff Summary, Similar Bugs, Smart Assignment, Classification).

## Jira/Evidence Links
Fixes IDTS-98.
Report generated: `docs/qa/uat-reports/idts98-evaluation-report.md`.

## Ownership Knowledge Gate
Member: NhanT
Date: 2026-07-25
Ownership flow: AI Evaluation and fallback logic
Base questions: PASS
Inactive-day questions: PASS
Additional-flow questions: PASS
Score: 100%
Critical questions: PASS
Debug exercise: PASS
Teach-back: PASS
Evidence: docs/pm/evidence/idts98-eval-evidence.md
Result: PASS
