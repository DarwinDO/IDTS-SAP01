## Summary

Fixes the remaining IDTS-114 Smart Assign mapping defect. Qwen returned valid
JSON wrapped under the exact schema-name key, so provider audit recorded
`SUCCESS` while feature validation could not see root `candidates`. The adapter
now removes exactly one safe object wrapper and the BTP service module persists
the already-approved 45-second per-model timeout.

No OData action, CDS/HANA schema, model, API key, fallback policy, Bug workflow,
S3 or Brevo behavior changed.

## Positive Evidence

- Red test before implementation: `30 PASS / 1 FAIL`, isolated to the exact
  schema-name wrapper.
- `npm run qa:idts114:programmatic`: `36/36 PASS`.
- `npm run qa:idts69:programmatic`: `8/8 PASS`; matching candidate IDs use the
  provider explanation and the action remains review-only.
- Full required AI regression: `171/171 PASS`.
- CAP compile and secret scan: PASS.

## Negative Evidence

- Malformed prompt-only Qwen output still uses only the existing bounded
  fallback.
- Generic HTTP 400, authorization errors and budget exhaustion do not enter
  the compatibility retry.
- Hallucinated or invalid assignee IDs remain rejected by the feature/backend
  validation covered by IDTS-69 and IDTS-71.

## Edge/Boundary Evidence

- Direct root payload remains unchanged.
- Multi-key, array and unrelated one-key payloads are not unwrapped.
- Only a non-array object with one key equal to the sanitized schema name and
  an object value is normalized.
- No recursive unwrap and no additional retry were introduced.

## Roles/Authorization

No authorization code changed. Existing review and assignment authorization
regression remains green. Tester/Developer interactive BTP role evidence is
intentionally deferred under the approved plan, so IDTS-114 remains In
Progress.

## Persistence/Reload

No database contract changed. Existing AI audit persists safe status, model
alias, latency and review state. Browser reload/no-mutation must be rerun after
the selective service deployment before this follow-up is accepted.

## UI/UX Review

No UI source changed. The purpose of the fix is to let the existing Smart
Assign dialog receive grounded provider explanations instead of showing the
safe unavailable/fallback state. Browser evidence is pending post-deployment.

## Ponytail Simplicity

Native JSON parsing and one 17-line guard are used. No SDK, queue, recursive
normalizer, retry framework, model switch or new dependency was added.
`ponytail-review` result: `Lean already. Ship.`

## Known Gaps

- The post-merge BTP browser rerun is still required to prove that Smart Assign
  renders the grounded Qwen explanation within the client/router deadline.
- Tester/Developer role-matrix acceptance remains deferred by DonHV.
- IDTS-114 and IDTS-115 must remain In Progress.

## Ownership Knowledge Gate

Member: DonHV
Date: 2026-07-23
Ownership flow: Backend AI provider integration and safe operational boundary
Base questions: 3
Inactive-day questions: 0
Additional-flow questions: 2
Score: 90%
Critical questions: PASS
Debug exercise: PASS
Teach-back: PASS
Evidence: docs/learning/progress/donhv.md and docs/pm/evidence/idts-90/knowledge-gate-donhv-2026-07-23.md
Result: PASS

## Jira/Evidence Links

- Jira: https://dutassociation.atlassian.net/browse/IDTS-114
- Evidence:
  `docs/pm/evidence/idts-114/qwen-structured-primary/local-provider-remediation-20260729.md`
- Knowledge mirror:
  `docs/knowledge/srv/ai/vercel-gateway-provider.js.md`
- Deployment mirror:
  `docs/knowledge/deployment/idts-btp-xsuaa-approuter.md`
