# IDTS-110 execution summary for DonHV review

- Executor: NhanT (agent-assisted)
- Execution date: 2026-08-03
- Repository baseline: `fbea12cd996d8c1e13bd834fd6e054c8a37c32e6`
- Approved catalog: `docs/qa/idts-110-unit-test-catalog.json`
- Catalog size: 188 English cases
- Review state: `READY_FOR_DONHV_REVIEW_WITH_BLOCKERS`
- Jira handoff comment: `10861`
- Final workbook/Drive state: not changed; DonHV remains the integration owner

## Execution truth

| Candidate status | Cases | Meaning |
| --- | ---: | --- |
| PASS | 34 | Exact LOCAL assertion and required sanitized state evidence passed. |
| FAIL | 2 | Observed behavior did not match the approved expected result. |
| BLOCKED | 152 | 150 cases require unavailable BTP/HANA/live-service acceptance; 2 LOCAL UI cases lack approved browser-runtime evidence. |
| Total | 188 | Every approved case has an individual manifest and image package. |

## FAIL cases requiring DonHV triage

### UT-AUTH-004

- Expected: a non-string password returns the same safe HTTP 401 login boundary.
- Actual: CAP request validation returned `ASSERT_DATA_TYPE` before the login handler.
- Classification: product/security-boundary candidate or catalog-boundary clarification.
- Evidence: `cases/UT-AUTH-004/`.

### UT-VAL-REPORTER

- Expected: missing `reporter_ID` is rejected.
- Actual: authenticated Bug creation derived the server-owned reporter and committed the Bug/history row.
- Classification: catalog/process inconsistency; the behavior aligns with the separate server-owned reporter cases.
- Evidence: `cases/UT-VAL-REPORTER/`.

## BTP blocker

- Catalog environments: 133 `HYBRID_BTP`, 17 `BTP_REQUIRED`.
- Cloud Foundry CLI was not available.
- No authorized BTP/QA target or session configuration was present.
- No LOCAL result was promoted to BTP acceptance.
- Each affected case has a sanitized `BLOCKED` manifest and case-specific blocker image.
- Required resolution: DonHV/environment owner supplies an authorized BTP target/session, then NhanT reruns the affected cases.

## LOCAL browser blocker

- `UT-ATT-007` and `UT-ATT-008` passed static source-guard checks only.
- The approved in-app Browser runtime could not start because Windows denied access during startup.
- Standalone Playwright was not used as a bypass.
- Both cases remain `BLOCKED` until their MIME and 10 MB rejection behavior is executed in an approved browser surface.

## Evidence inventory

- 188 `case-manifest.json` files.
- 269 PNG images and 269 SVG source images.
- All PNG images verified at 1280 x 720.
- Persistence cases include before/after database count images and reload/readback images.
- LOCAL raw summary: `local-execution-results.json`.
- Case packages: `cases/<caseId>/`.

## Tool and format limitations

- Mandatory OfficeCLI preflight result: `OFFICECLI_NOT_FOUND`; no OfficeCLI workbook readback or edit was possible.
- CAP MCP was not exposed in this session. No CAP product artifact under `srv/`, `db/`, or `app/` was modified.
- Bundled `sharp` rendered all PNGs but emitted non-blocking fontconfig cache warnings.
- Browser runtime was unavailable because of the previously recorded Windows `EPERM` startup issue; UI LOCAL cases use exact static UI assertions, not fabricated browser screenshots.

## DonHV review actions

1. Review all 188 manifests and selected images.
2. Decide whether `UT-AUTH-004` is a product fix or an approved expected-boundary change.
3. Reconcile `UT-VAL-REPORTER` with server-owned reporter behavior.
4. Provide/coordinate an authorized BTP target for the 150 blocked cases.
5. After accepted reruns, integrate approved results into Unit Test EN v0.5 and update the same Drive file ID.
