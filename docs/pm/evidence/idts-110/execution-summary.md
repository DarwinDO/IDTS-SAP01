# IDTS-110 remediation execution summary for DonHV review

- Executor: NhanT (agent-assisted)
- Execution date: 2026-08-03
- Branch baseline before remediation commit: `e500436`
- Approved catalog: `docs/qa/idts-110-unit-test-catalog.json`
- Catalog size: 188 English cases
- Review state: `READY_FOR_DONHV_REVIEW_WITH_BTP_AND_UI_REBASELINE_BLOCKERS`
- Final workbook/Drive state: unchanged; DonHV remains the integration owner

## Current execution truth

| Candidate status | Cases | Meaning |
| --- | ---: | --- |
| PASS | 173 | 38 exact LOCAL cases plus 135 corrected local-primary candidates have passing runtime/contract/domain-suite evidence. The 135 mappings remain subject to DonHV case-level review. |
| FAIL | 0 | No open LOCAL candidate failure remains after the scoped login error-sanitization fix and regression. |
| BLOCKED | 15 | Thirteen true BTP integrations remain unavailable; two UI cases require generated SAP-standard attachment runtime proof/rebaseline after latest dev retired their approved custom handler. |
| Total | 188 | Every approved case has a manifest and PNG package. |

The approved catalog remains `NOT_RUN` until DonHV accepts individual results and integrates the official Unit Test EN workbook.

## Resolved finding — UT-AUTH-004

- Expected: malformed non-string password is rejected through a safe HTTP 400 boundary without type internals, and no `AuthSessions` row is inserted.
- Actual after fix: HTTP 400 with stable `INVALID_LOGIN_REQUEST`; `AuthSessions` count remains unchanged and the response contains no CAP type name, rejected value, stack, or source path.
- Classification: resolved product/security-boundary finding.
- Evidence: `local-execution-results.json` and `cases/UT-AUTH-004/`.
- Verification: focused HTTP contract exit 0, auth regression 28/28, and `UT-AUTH-004` exact assertion PASS.

## Corrected cases now covered

- `UT-VAL-REPORTER`: PASS. An unresolved authenticated actor is rejected before Bug/history/notification/delivery persistence; omission remains valid when the actor resolves.
- `UT-ATT-009`: PASS. Local CAP HTTP/OData returns 401 for anonymous attachment create and attachment metadata count remains unchanged.
- `UT-ATT-007` and `UT-ATT-008`: BLOCKED after merging latest dev. The retired custom handler was replaced by the SAP-standard generated attachment facet with `@Core.AcceptableMediaTypes` and `@Validation.Maximum: '10MB'`; static contracts pass, but the approved cases require generated-control rejection/message runtime proof.
- `UT-AI-027`: PASS. Controlled provider HTTP 429 yields safe `AI_RATE_LIMITED`, exactly one provider call, sanitized output, and unchanged business-state counts.
- `UT-NTF-009`–`UT-NTF-012`, `UT-AI-026`, and the remaining corrected local-primary cases are mapped to passing domain suites in `local-primary-suite-results.json`.

## Environment blockers

### SAP-standard attachment UI — 2 rebaseline/runtime blockers

- Latest dev removed the custom attachment fragment and `onAttachmentSelected` handler and uses the generated SAP-standard attachment facet.
- The replacement MIME and 10 MB CDS contracts exist, but the deployed environment observed earlier does not represent this merged head and local full-browser Fiori cannot reach its UI5 CDN. No stale component result is substituted for generated-control runtime proof.

### BTP integration — 13 cases

- Cases: `UT-AUTH-011`–`UT-AUTH-015`, `UT-ATT-003`–`UT-ATT-006`, `UT-ATT-010`–`UT-ATT-012`, and `UT-NTF-013`.
- `npm.cmd run btp:demo:check` exits 1 because `cf` is unavailable.
- No BTP request, deployment, database/seed change, or integration assertion ran.
- These are environment blockers, not product failures.

## Evidence inventory

- 188 `case-manifest.json` files.
- 278 PNG files.
- 0 SVG files; 278 duplicate/intermediate SVG sources were removed after PNG rendering and manifest cleanup.
- Exact 40-case result payload: `local-execution-results.json` — 38 PASS / 0 FAIL / 2 BLOCKED.
- Corrected 135-case suite payload: `local-primary-suite-results.json` — 135 candidate PASS / 0 failed suite mappings.
- Case packages: `cases/<caseId>/`.

Generated PNG cards summarize the structured/runtime evidence; they are not described as browser or BTP proof.

## Tool and format limitations

- Mandatory OfficeCLI preflight: command not found; no workbook readback/edit or Drive synchronization occurred.
- CAP MCP namespace was unavailable after discovery. The scoped `srv/auth.js` error hook follows the official CAP service error-event contract; no business model or UI behavior was changed.
- Codex bundled `sharp` rendered 278 PNGs and emitted non-blocking fontconfig cache warnings.
- The installed native SQLite binary was rebuilt in `node_modules` for the active Node.js 24 ABI; no dependency manifest or lockfile changed.

## DonHV review actions

1. Review the 173 PASS candidates, especially the 135 suite-to-case mappings.
2. Review the scoped `UT-AUTH-004` sanitization fix and its HTTP/auth regressions.
3. Rebaseline or runtime-rerun `UT-ATT-007/008` against the generated SAP-standard attachment control.
4. Provide an authorized Cloud Foundry/BTP session and rerun the 13 true integration cases.
5. After acceptance, integrate approved results into the same Unit Test EN v0.5 Drive file.
