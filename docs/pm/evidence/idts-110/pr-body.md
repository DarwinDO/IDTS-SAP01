## Summary

- Apply DonHV's corrected 175 local-primary / 13 BTP-only taxonomy to the IDTS-110 execution package.
- Rerun 40 exact LOCAL cases and 135 corrected local-primary cases; the final exact-head verification used Node.js 24 after rebuilding the local `better-sqlite3` native module for the matching ABI.
- Publish current truth at exact tested SHA `56b4a4f3d92ef2f9558869caab4b393b07d8b5e7`: 38 atomic candidate PASS, 135 mapping-only candidates, 0 FAIL and 15 BLOCKED (13 BTP plus 2 SAP-standard attachment UI runtime cases); keep the approved catalog `NOT_RUN` until DonHV accepts results.
- Remove 278 duplicate SVG evidence sources and retain 188 manifests, 278 PNGs and structured JSON evidence.

## Positive Evidence

- Exact LOCAL runner: 40 cases — 38 PASS / 0 FAIL / 2 BLOCKED.
- Local-primary suite runner: 135 mappings — 135 `MAPPING_ONLY_CANDIDATE` / 0 failed mappings across 19 domain suites. These mappings are not atomic executions or PASS evidence.
- Corrected `UT-VAL-REPORTER`: unresolved actor rejected with no Bug/history/notification/delivery mutation.
- `UT-ATT-009`: anonymous OData attachment create returns 401; attachment metadata remains unchanged.
- `UT-AI-027`: controlled 429 returns safe `AI_RATE_LIMITED`, one provider call and no business mutation.
- Latest dev's SAP-standard attachment facet declares the supported MIME and 10 MB CDS contracts; static contract checks pass without misrepresenting them as generated-control runtime proof.

## Negative Evidence

- `UT-AUTH-004` is fixed: malformed input returns safe HTTP 400 `INVALID_LOGIN_REQUEST`, exposes no type/rejected-value internals, and leaves `AuthSessions` unchanged.
- No FAIL or BLOCKED result is hidden or promoted to final workbook PASS.

## Edge/Boundary Evidence

- Non-string auth input, unresolved reporter, invalid/partial classification, notification retry/concurrency and controlled AI 429 paths have fresh local evidence.
- `UT-ATT-007` and `UT-ATT-008` are BLOCKED because their approved source trace targets the retired custom handler; the replacement generated control needs DonHV rebaseline/runtime evidence.
- The other 13 cases remain BTP environment BLOCKED after `btp:demo:check` failed because `cf` is unavailable.

## Roles/Authorization

- Auth/session, Bug ownership, assignment/lifecycle, comment, attachment and AI review role boundaries have suite-level traceability mappings; no atomic PASS is inferred from a mapping.
- Local HTTP evidence confirms anonymous attachment write is denied before metadata mutation.
- Platform identity/XSUAA cases are not executed using a substitute identity and remain in the 13 BTP blockers.

## Persistence/Reload

- Applicable LOCAL manifests include before/after/reload count evidence.
- `UT-AUTH-004` records unchanged session count and a sanitized public error after the fix.
- The suite mappings identify coverage for transaction rollback, one-to-one history, notification delivery and no-mutation AI fallbacks; only the 38 exact cases are represented as atomic executions.
- No BTP database, seed, workbook or Drive state was changed.

## UI/UX Review

- 278 PNGs were rendered and 278 duplicate SVG sources were removed; manifests contain no SVG references.
- Generated cards are described only as summaries of JSON/runtime evidence, not browser proof.
- The deployed SAP List Report was observed healthy before the latest dev attachment architecture merge. Local full-browser bootstrap remains limited by the unreachable UI5 CDN redirect, so no stale screenshot/component result is used for the generated SAP-standard attachment control.

## Ponytail Simplicity

- Reuse existing domain suites and the exact HTTP harness; remove the obsolete custom-handler component harness after dev adopted the SAP-standard attachment facet.
- The only production behavior change is a service-scoped CAP error sanitizer for malformed AuthService input; no new project dependency or deployment configuration was added.
- No production dependency or lockfile change was made. The final local gate rebuilt only the installed `better-sqlite3` binary in `node_modules` to match the active Node.js 24 ABI.

## Ownership Knowledge Gate

Member: NhanT
Date: 2026-08-03
Ownership flow: QA authentication, authorization, persistence/reload, and notification outbox verification
Base questions: 3
Inactive-day questions: 0
Additional-flow questions: 0
Score: 100%
Critical questions: PASS
Debug exercise: PASS
Teach-back: PASS
Evidence: docs/pm/evidence/idts-105/knowledge-gate-nhant-qa-2026-08-03.md and docs/learning/progress/nhant.md
Result: PASS
Briefing SHA: `3e78b495cb8feb56188cc446b827d47e040e1b98`
Jira acknowledgments: IDTS-110 comment `10908`; IDTS-111 comment `10909`.
Ownership: NhanT executes and packages truthful evidence; DonHV reviews results and owns official workbook/Drive integration.

## Known Gaps

- Thirteen BTP integration cases require an authorized Cloud Foundry/BTP session.
- Two attachment UI cases require catalog rebaseline or runtime proof against the generated SAP-standard control.
- The official English `Unit_Test_EN` workbook and Drive file are unchanged because OfficeCLI/authorized integration is unavailable and DonHV owns final synchronization.

## Jira/Evidence Links

- Jira: https://dutassociation.atlassian.net/browse/IDTS-110
- Execution summary: `docs/pm/evidence/idts-110/execution-summary.md`
- Exact LOCAL payload: `docs/pm/evidence/idts-110/local-execution-results.json`
- Local-primary suite payload: `docs/pm/evidence/idts-110/local-primary-suite-results.json`
- Case evidence: `docs/pm/evidence/idts-110/cases/`

### Current runtime delta (2026-08-04)

- `UT-ATT-007/008` now have fresh generated-control runtime proof on controlled `BUG-0025` and are candidate PASS.
- Unsupported `.exe` and 10 MB + 1 byte fixtures were rejected safely without creating their rows.
- Current package truth: **40 atomic candidate PASS / 135 mapping-only candidates / 0 FAIL / 13 BTP BLOCKED**.
- The 13 BTP cases remain blocked by missing authorized CF/BTP readiness; no workbook/Drive change or final PASS is claimed.
