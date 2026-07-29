## Summary

Improves the three existing AI review dialogs for IDTS-114 and adds a transient, grounded Comment Summary to the existing Handoff Summary action. Similar Bugs now uses a selectable responsive list, Classification separates confidence from expandable reasons, and Handoff Summary presents comments and trusted audit events as lists. No provider/model/key, database schema, lifecycle rule, assignment rule, or automatic mutation is changed.

## Positive Evidence

- IDTS-68: 45 PASS / 0 FAIL, including grounded comments, trusted event detail and provider-success injection isolation.
- IDTS-74/75/76: 177, 112 and 110 UI checks PASS.
- IDTS-56/66/67/69/71/93/95/114/115 regression PASS.
- CAP compile, UI5 production build, secret scan, agent rules, ownership gate, QA-depth self-test and AI DevKit all PASS.

## Negative Evidence

- A provider-success fixture tries to replace the workflow advice and audit events through malicious comment text; the response keeps deterministic next action and stored history events.
- Provider failure, unsafe output and malformed output continue to return sanitized deterministic fallback data.
- The Handoff action still rejects an unknown Bug with HTTP 404 and never updates the Bug record.

## Edge/Boundary Evidence

- No comments returns an explicit empty Comment Summary.
- Long comment history is limited to five chronological, redacted, concise lines.
- Long reason text uses `sap.m.ExpandableText`; secondary Classification columns use desktop pop-in behavior.
- Comment wording such as a technical business symptom is rendered per sanitized line rather than hiding the whole section.

## Roles/Authorization

No authorization contract changes. Existing authenticated AI review permissions and IDTS-115 apply/confirm/metrics restrictions remain unchanged. This PR adds no client-side privilege check as a replacement for backend authorization.

## Persistence/Reload

`commentSummary` is a transient field in the existing action result, so no HANA migration is required. Existing AI suggestion review persistence remains unchanged. The focused tests prove no status or `modifiedAt` mutation; final SAP BTP reload/no-mutation screenshots remain a post-deploy acceptance item.

## UI/UX Review

The implementation uses standard `sap.m.List`, `sap.m.Table`, `sap.m.ExpandableText`, `sap.m.ObjectStatus` and `sap.m.MessageStrip` controls. It removes the wide Similar Bugs table, repeated per-row guidance and raw prose event blocks. UI5 production build and targeted ESLint pass with zero errors; browser visual acceptance is intentionally not claimed before deployment.

## Ponytail Simplicity

The change reuses the three existing dialogs and the current action. It adds no route, page, framework, dependency, CSS layer, database table or provider abstraction. Comment and event formatting stays in small deterministic helpers beside the existing handoff logic.

## Known Gaps

- SAP BTP browser visual, keyboard/focus, tablet layout and before/after no-mutation evidence must be captured after the final merge SHA is deployed.
- Tester and Developer role-matrix evidence remains deferred by the approved plan; IDTS-114 and IDTS-115 stay In Progress.

## Jira/Evidence Links

- Jira: https://dutassociation.atlassian.net/browse/IDTS-114
- Readability evidence: `docs/pm/evidence/idts-114/review-readability/`
- Comment Summary evidence: `docs/pm/evidence/idts-114/handoff-comment-summary/`
- Knowledge mirrors: `docs/knowledge/app/bug-management-ui/webapp/ext/actions/` and `docs/knowledge/srv/ai/bug-summary.js.md`

## Ownership Knowledge Gate

Member: DonHV
Date: 2026-07-23
Ownership flow: AI review UI and grounded Handoff Summary
Base questions: 3
Inactive-day questions: 0
Additional-flow questions: 2
Score: 90%
Critical questions: PASS
Debug exercise: PASS
Teach-back: PASS
Evidence: docs/learning/progress/donhv.md and docs/pm/evidence/idts-89/knowledge-gate-donhv-2026-07-23.md and docs/pm/evidence/idts-90/knowledge-gate-donhv-2026-07-23.md
Result: PASS
