# IDTS-110 remediation execution summary for DonHV review

- Executor: NhanT (agent-assisted)
- Execution date: 2026-08-04
- Baseline/runtime provenance: see `baseline-trace.md`. The manifests use evidence-curation SHA `56b4a4f3d92ef2f9558869caab4b393b07d8b5e7`, the exact local payload uses execution SHA `7c02c56daa7f46661b4d2f778a7a0b2a77d88b8a`, and the generated-control supplements use deployed SHA `67b1bf86169e9696c9365ef4846b99ffae30d4e2`.
- Approved catalog: `docs/qa/idts-110-unit-test-catalog.json`
- Catalog size: 188 English cases
- Review state: `READY_FOR_DONHV_REVIEW_WITH_BTP_AND_UI_REBASELINE_BLOCKERS`
- Final workbook/Drive state: unchanged; DonHV remains the integration owner

## Current execution truth

| Candidate status | Cases | Meaning |
| --- | ---: | --- |
| PASS | 40 | Thirty-eight atomic exact LOCAL executions plus two separate generated-control runtime executions (`UT-ATT-007/008`). |
| MAPPING_ONLY_CANDIDATE | 135 | Broad suite-to-case traceability mappings. These are not atomic executions, browser/BTP proof, or candidate PASS results. |
| FAIL | 0 | No open LOCAL candidate failure remains after the scoped login error-sanitization fix and regression. |
| BLOCKED | 13 | The true BTP integrations remain unavailable; fresh readiness rerun stopped before case execution because `cf` is not installed/on PATH. |
| Total | 188 | Every approved case has a manifest and PNG package. |

The approved catalog remains `NOT_RUN` until DonHV accepts individual results and integrates the official Unit Test EN workbook.

The differing immutable SHAs are intentional provenance boundaries, not a single-baseline execution claim. `baseline-trace.md` reconciles the frozen catalog, evidence-curation, exact local execution, deployed runtime, and final-head verification roles.

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
- `UT-NTF-009`–`UT-NTF-012`, `UT-AI-026`, and the remaining local-primary cases have suite traceability in `local-primary-suite-results.json`; this mapping is explicitly not atomic execution evidence.

## Environment blockers

### SAP-standard attachment UI — 2 runtime candidate PASS results

- Latest dev removed the custom attachment fragment and `onAttachmentSelected` handler and uses the generated SAP-standard attachment facet.
- The replacement MIME and 10 MB CDS contracts exist, but the deployed environment observed earlier does not represent this merged head and local full-browser Fiori cannot reach its UI5 CDN. No stale component result is substituted for generated-control runtime proof.

### BTP integration — 13 cases

- Cases: `UT-AUTH-011`–`UT-AUTH-015`, `UT-ATT-003`–`UT-ATT-006`, `UT-ATT-010`–`UT-ATT-012`, and `UT-NTF-013`.
- `npm.cmd run btp:demo:check` exits 1 because `cf` is unavailable.
- No BTP request, deployment, database/seed change, or integration assertion ran.
- These are environment blockers, not product failures.

## Evidence inventory

- 188 `case-manifest.json` files.
- 280 PNG files.
- 0 SVG files; 278 duplicate/intermediate SVG sources were removed after PNG rendering and manifest cleanup.
- Exact 40-case result payload: `local-execution-results.json` — 38 PASS / 0 FAIL / 2 BLOCKED.
- Corrected 135-case suite payload: `local-primary-suite-results.json` — 135 `MAPPING_ONLY_CANDIDATE` / 0 failed mappings.
- Case packages: `cases/<caseId>/`.

Generated PNG cards summarize the structured/runtime evidence; they are not described as browser or BTP proof.

## Tool and format limitations

- Mandatory OfficeCLI preflight: command not found; no workbook readback/edit or Drive synchronization occurred.
- CAP MCP namespace was unavailable after discovery. The scoped `srv/auth.js` error hook follows the official CAP service error-event contract; no business model or UI behavior was changed.
- Codex bundled `sharp` rendered 278 PNGs and emitted non-blocking fontconfig cache warnings.
- The installed native SQLite binary was rebuilt in `node_modules` for the active Node.js 24 ABI; no dependency manifest or lockfile changed.

## DonHV review actions

1. Review the 40 atomic PASS candidates and the separate 135 mapping-only traceability records.
2. Review the scoped `UT-AUTH-004` sanitization fix and its HTTP/auth regressions.
3. Review the separate deployed-runtime proof for `UT-ATT-007/008` and its current CDS source trace.
4. Provide an authorized Cloud Foundry/BTP session and rerun the 13 true integration cases.
5. After acceptance, integrate approved results into the same Unit Test EN v0.5 Drive file.

## Generated attachment runtime closure (2026-08-04)

- `UT-ATT-007`: candidate PASS on the deployed generated control; a controlled `.exe` produced a safe unsupported-format message and no row.
- `UT-ATT-008`: candidate PASS; a controlled 10 MB + 1 byte file produced `AttachmentSizeExceeded` and no row.
- Current review inventory is **40 atomic candidate PASS / 135 mapping-only candidates / 0 FAIL / 13 BTP BLOCKED**. DonHV still owns approval and workbook synchronization.
