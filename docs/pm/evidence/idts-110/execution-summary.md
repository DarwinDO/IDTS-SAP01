# IDTS-110 remediation execution summary for DonHV review

- Executor: NhanT (agent-assisted)
- Execution date: 2026-08-03
- Branch baseline before remediation commit: `e500436`
- Approved catalog: `docs/qa/idts-110-unit-test-catalog.json`
- Catalog size: 188 English cases
- Review state: `READY_FOR_DONHV_REVIEW_WITH_OPEN_FINDING_AND_ENVIRONMENT_BLOCKERS`
- Final workbook/Drive state: unchanged; DonHV remains the integration owner

## Current execution truth

| Candidate status | Cases | Meaning |
| --- | ---: | --- |
| PASS | 172 | 37 exact LOCAL cases plus 135 corrected local-primary candidates have passing runtime/domain-suite evidence. The 135 mappings remain subject to DonHV case-level review. |
| FAIL | 1 | `UT-AUTH-004` returns HTTP 400 with no session mutation, but exposes CAP type-validation internals in the public response. |
| BLOCKED | 15 | Two UI component cases are blocked by the blank SAP browser deployment; 13 true BTP integration cases are blocked because Cloud Foundry CLI/session readiness is unavailable. |
| Total | 188 | Every approved case has a manifest and PNG package. |

The approved catalog remains `NOT_RUN` until DonHV accepts individual results and integrates the official Unit Test EN workbook.

## Open FAIL — UT-AUTH-004

- Expected: malformed non-string password is rejected through a safe HTTP 400 boundary without type internals, and no `AuthSessions` row is inserted.
- Actual: HTTP 400; `AuthSessions` count remains unchanged; response body exposes `ASSERT_DATA_TYPE`, `String(255)`, and the rejected value.
- Classification: product/security-boundary finding.
- Evidence: `local-execution-results.json` and `cases/UT-AUTH-004/`.
- Owner: DonHV/product owner decides whether to sanitize the public CAP validation response or revise the accepted boundary.

## Corrected cases now covered

- `UT-VAL-REPORTER`: PASS. An unresolved authenticated actor is rejected before Bug/history/notification/delivery persistence; omission remains valid when the actor resolves.
- `UT-ATT-009`: PASS. Local CAP HTTP/OData returns 401 for anonymous attachment create and attachment metadata count remains unchanged.
- `UT-AI-027`: PASS. Controlled provider HTTP 429 yields safe `AI_RATE_LIMITED`, exactly one provider call, sanitized output, and unchanged business-state counts.
- `UT-NTF-009`–`UT-NTF-012`, `UT-AI-026`, and the remaining corrected local-primary cases are mapped to passing domain suites in `local-primary-suite-results.json`.

## Environment blockers

### UI component — 2 cases

- `UT-ATT-007` and `UT-ATT-008` have passing static guard checks only.
- The deployed SAP page is blank after controlled reload.
- Browser console reports `Unexpected token '<'` for `auth-guard.js` and `bootstrap-ui5.js`, consistent with HTML being returned for JavaScript asset requests.
- Direct asset inspection was blocked by the browser client, so no HTTP body/status claim is made.
- No UI runtime PASS is claimed.

### BTP integration — 13 cases

- Cases: `UT-AUTH-011`–`UT-AUTH-015`, `UT-ATT-003`–`UT-ATT-006`, `UT-ATT-010`–`UT-ATT-012`, and `UT-NTF-013`.
- `npm.cmd run btp:demo:check` exits 1 because `cf` is unavailable.
- No BTP request, deployment, database/seed change, or integration assertion ran.
- These are environment blockers, not product failures.

## Evidence inventory

- 188 `case-manifest.json` files.
- 278 PNG files.
- 0 SVG files; 278 duplicate/intermediate SVG sources were removed after PNG rendering and manifest cleanup.
- Exact 40-case result payload: `local-execution-results.json` — 37 PASS / 1 FAIL / 2 BLOCKED.
- Corrected 135-case suite payload: `local-primary-suite-results.json` — 135 candidate PASS / 0 failed suite mappings.
- Case packages: `cases/<caseId>/`.

Generated PNG cards summarize the structured/runtime evidence; they are not described as browser or BTP proof.

## Tool and format limitations

- Mandatory OfficeCLI preflight: command not found; no workbook readback/edit or Drive synchronization occurred.
- CAP MCP namespace was unavailable after discovery. The harness follows official `cds.test` guidance and no product artifact under `srv/`, `db/`, or `app/` was modified.
- Codex bundled `sharp` rendered 278 PNGs and emitted non-blocking fontconfig cache warnings.
- System Node 24 was incompatible with the tracked native SQLite binary; tests used checksum-verified portable Node.js 22.23.1 without dependency/lockfile changes.

## DonHV review actions

1. Review the 172 PASS candidates, especially the 135 suite-to-case mappings.
2. Triage `UT-AUTH-004` as a public error-sanitization finding.
3. Restore a healthy SAP browser deployment and rerun the two UI cases.
4. Provide an authorized Cloud Foundry/BTP session and rerun the 13 true integration cases.
5. After acceptance, integrate approved results into the same Unit Test EN v0.5 Drive file.
