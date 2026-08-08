## Summary

Fixes IDTS-115 Classification Apply feedback when CAP correctly rejects an accepted suggestion that no longer matches the current Developer's responsibility. The UI maps only HTTP 400 plus the exact allowlisted CAP sentence to actionable i18n guidance. Backend validation, assignment, status flow, AI configuration, schema and database data remain unchanged.

## Positive Evidence

- Red-first focused regression failed on the missing exact responsibility-mismatch contract.
- `node scripts/qa/test-idts115-ai-fiori-entrypoints.js` passes 250/250 after the patch.
- `npm run qa:idts115:programmatic` passes 250/250.
- CAP compile, UI5 MCP lint, UI5 production build, secret scan, agent rules, QA Depth self-test, syntax and `git diff --check` pass.

## Negative Evidence

- The predicate requires both HTTP 400 and the complete allowlisted backend sentence; unrelated 400/403/409/5xx Apply failures continue to use `classificationApplyFailed`.
- The controller never passes `error.message` or a raw response body to `MessageBox.error`.
- No automatic unassign, Pending Assignment transition, classification rewrite or email-routing change is introduced.

## Edge/Boundary Evidence

- A failure before CAP mutation re-enables Apply after busy state clears.
- A successful CAP mutation followed by refresh failure keeps Apply disabled and uses `classificationRefreshFailed`, preventing replay.
- Near-match/general backend failures are intentionally not mapped to the responsibility guidance.

## Roles/Authorization

No authorization change. Apply remains visible to PM/Tester after an accepted review, while CAP remains the authoritative role and business-validation boundary. Developer permissions are unchanged.

## Persistence/Reload

No schema, migration, SQL, seed or database deployment is included. The rejection path performs no classification/history mutation. Post-merge browser reload evidence remains a deployment acceptance item; local source-contract checks preserve the existing successful-mutation/refresh-failure boundary.

## UI/UX Review

The interrupting error uses the existing Fiori `MessageBox.error` pattern and gives a direct recovery action without exposing diagnostics. Both i18n bundles contain the same English copy. UI5 MCP lint reports zero findings and the production build passes.

## Ponytail Simplicity

Used `ponytail` and `ponytail-review`. The change reuses existing `errorStatus`, `errorMessage`, catch state and i18n handling. It adds one predicate and one key in each bundle; no parser, error framework, dependency, backend code or configuration was added. Review result: `Lean already. Ship.`

## Ownership Knowledge Gate

Member: DonHV
Date: 2026-07-23
Ownership flow: AI review, lifecycle validation and assignment responsibility
Base questions: 3
Inactive-day questions: 0
Additional-flow questions: 2
Score: 90%
Critical questions: PASS
Debug exercise: PASS
Teach-back: PASS
Evidence: docs/learning/progress/donhv.md and docs/pm/evidence/idts-89/knowledge-gate-donhv-2026-07-23.md and docs/pm/evidence/idts-90/knowledge-gate-donhv-2026-07-23.md
Result: PASS

## Known Gaps

- Signed-in BTP browser reproduction of the responsibility mismatch remains post-merge/selective-deploy acceptance.
- DonHV supplied the exact phrase `GO EMAIL ROUTING`; the private BTP binding now has `email.testMode=false`, with provider fields and rollback recipient preserved. No delivery replay or send-smoke was run. Sanitized operational evidence is in `docs/pm/evidence/idts-115/email-routing-go-20260808.md`.
- The IDTS-115 harness is a focused source/i18n contract check; it does not replace post-deploy browser evidence.

## Jira/Evidence Links

- Jira: https://dutassociation.atlassian.net/browse/IDTS-115
- PM work package: `docs/pm/tasks/idts-115-ai-fiori-entrypoints.md`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/actions/ClassificationReview.js.md`
- Email audit and issue log: `docs/pm/status/donhv.md`

## Checklist

- [x] I tested at least one non-happy path.
- [x] I checked role/authorization behavior or explained why it is unchanged.
- [x] I checked persistence/reload behavior or explained the post-deploy limitation.
- [x] I checked UI/UX consistency.
- [x] I applied the required Ponytail skills.
- [x] I reused the existing verified Ownership Knowledge Gate evidence without creating a duplicate gate.
- [x] I recorded the product defect and every observed tooling/environment issue in DonHV's status file.
