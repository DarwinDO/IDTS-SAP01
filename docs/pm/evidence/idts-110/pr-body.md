## Summary

- Add a deterministic English-only IDTS-110 Unit Test catalog candidate with 188 atomic test cases.
- Separate pure unit, UI component, CAP component, OData contract, and BTP integration levels so evidence is not overstated.
- Record DonHV/NhanT ownership and keep every execution result `NOT_RUN` until case-specific evidence exists.

## Positive Evidence

- `node scripts/qa/generate-idts110-unit-test-catalog.js --check`: PASS, 188 cases and every source file/symbol resolved.
- Catalog audit: PASS, 188 unique English cases, all `NOT_RUN`, case-specific image evidence required.
- `npm run qa:agent-rules`: PASS, 8 required rules.
- `npm run qa:depth:self-test`: PASS, 15/15.
- `npm run qa:secret-scan`: PASS.
- `npx ai-devkit@latest lint --json`: PASS, 5/5.

## Negative Evidence

- The source-trace validator rejected two inferred symbol names before generation; both were replaced with the real symbols and the rerun passed.
- A first read-only audit incorrectly expected a per-row boolean instead of the concrete per-row image requirement; the corrected audit passed and the tooling issue is recorded.
- Historical PASS values from the five old UNIT rows were deliberately not inherited.

## Edge/Boundary Evidence

- Eleven lifecycle actions have separate success, unauthorized actor, illegal source status, and mandatory-input cases where applicable.
- AI terminal review states and forward/reverse duplicate-link boundaries are separate cases.
- MIME and 10 MB attachment checks are classified as UI behavior, not falsely claimed as backend validation.

## Roles/Authorization

- Role expectations are recorded per case for Tester, Developer, PM, unauthenticated users, and platform identity where applicable.
- No role test has been executed in this planning PR; every result remains `NOT_RUN`.

## Persistence/Reload

- Cases that require persistence explicitly request before/after and reload/readback evidence.
- No database, workbook, Jira, or Drive state is changed by this PR.

## UI/UX Review

- UI-only attachment boundaries use the explicit `UI_COMPONENT` level.
- No application UI is changed by this PR.

## Ponytail Simplicity

- One dependency-free Node generator is used because 188 structured rows must remain deterministic and reviewable.
- No spreadsheet generator, execution harness, dependency, or runtime abstraction was added during catalog preparation or approval.
- Ponytail review: Lean already.

## Ownership Knowledge Gate

Member: DonHV
Date: 2026-07-23
Ownership flow: Bug create/lifecycle and exact workflow action audit
Base questions: 3
Inactive-day questions: 0
Additional-flow questions: 0
Score: 90%
Critical questions: PASS
Debug exercise: PASS
Teach-back: PASS
Evidence: docs/learning/progress/donhv.md and docs/pm/evidence/idts-89/knowledge-gate-donhv-2026-07-23.md and docs/pm/evidence/idts-90/knowledge-gate-donhv-2026-07-23.md
Result: PASS

## Known Gaps

- DonHV approved the 188-case catalog on 2026-08-02. NhanT execution and case-level evidence capture have not started.
- The Unit Test EN v0.5 workbook and Drive artifact are intentionally unchanged.
- Existing QA scripts remain mixed regression suites; they are not treated as one-case-per-row evidence automatically.

## Jira/Evidence Links

- Jira: https://dutassociation.atlassian.net/browse/IDTS-110
- Catalog review: `docs/pm/evidence/idts-110/unit-test-catalog-review.md`
- Catalog: `docs/qa/idts-110-unit-test-catalog.json`

## Checklist

- [x] I tested at least one non-happy path in the catalog validator.
- [x] I recorded role/authorization expectations without claiming execution.
- [x] I recorded persistence/reload evidence requirements without claiming execution.
- [x] I checked UI versus backend rule ownership for attachment limits.
- [x] I applied the required Ponytail skill.
- [x] I reused DonHV's existing valid Ownership Knowledge Gate PASS evidence.
- [x] I recorded all observed documentation/tooling issues in DonHV status.
