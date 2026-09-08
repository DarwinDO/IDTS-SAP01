# IDTS-110 Atomic Mapping and Embedded Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute all 135 approved local mapping-only cases atomically and generate a v0.6 candidate workbook with one complete embedded evidence image for every case.

**Architecture:** Extend the existing IDTS-110 atomic runner and evidence pipeline instead of creating a second framework. Store full provenance in repository JSON, render the approved complete evidence-card format, and embed the resulting PNGs as native XLSX drawings while keeping the mentor sheet simple.

**Tech Stack:** Node.js, CAP test fixtures, existing IDTS-110 atomic runner, Playwright card rendering, `@oai/artifact-tool`, OfficeCLI, LibreOffice, XLSX OOXML validation.

**Spec:** `docs/superpowers/specs/2026-09-06-idts110-atomic-mapping-and-embedded-evidence-design.md`

## Global Constraints

- DonHV already approved executing the 135 mapping-only local cases; do not ask again.
- Use mentor-visible numbering `Case 1` through `Case 278`; internal IDs stay repository-only.
- A case passes only from its own selector and assertions; a suite exit code cannot fan out into multiple PASS claims.
- Preserve failures truthfully and keep 13 BTP-required cases Blocked.
- Embed evidence images in the workbook; relative repository links are forbidden.
- Use the approved complete-test-evidence visual structure.
- No product source, dependency, lockfile, BTP/HANA, email, Jira, or Drive mutation.
- Do not overwrite the v0.5 candidate or supplied NhanT workbook.

---

### Task 1: Freeze the 135-case atomic execution manifest

**Files:**
- Create: `docs/qa/idts-110-mapping-atomic-manifest.json`
- Create: `scripts/qa/test-idts110-mapping-atomic-manifest.js`
- Modify: `docs/pm/evidence/idts-110/catalog-approval.json`

**Interfaces:**
- Consumes: `docs/pm/evidence/idts-110/donhv-case-taxonomy.json` and `docs/qa/idts-110-case-number-map.json`.
- Produces: an ordered 135-entry manifest with `mentorNumber`, internal key, level, selector, test file, source assertions, fixture policy, and evidence requirements.

- [ ] Write a failing contract asserting exactly 135 entries, 121 CAP component and 14 OData contract cases, the frozen domain totals, local-only environments, unique selectors, and zero `MAPPING_ONLY` output statuses.
- [ ] Run `node scripts/qa/test-idts110-mapping-atomic-manifest.js` and capture RED for the missing manifest.
- [ ] Generate the smallest ordered manifest by joining taxonomy, number map, catalog, and existing suite mapping; reject any unresolved or many-to-one selector.
- [ ] Record DonHV's existing approval and exact base without changing historical result truth yet.
- [ ] Run the manifest contract, secret scan, and `git diff --check`; commit `test: freeze IDTS-110 mapping atomic manifest`.

### Task 2: Add case-specific CAP and OData assertions

**Files:**
- Modify: `scripts/qa/test-idts110-local-exact.js`
- Modify: `scripts/qa/test-idts110-local-primary-suites.js`
- Create: `scripts/qa/test-idts110-mapping-atomic-execution.js`
- Create: `scripts/qa/run-idts110-mapping-atomic.js`

**Interfaces:**
- Consumes: the 135-entry atomic manifest.
- Produces: one sanitized atomic result per case using the existing `idts110-atomic-runner.js` result schema.

- [ ] Add RED tests proving a suite-level exit cannot satisfy two cases, every selector executes exactly one case, and mutation/negative evidence requirements are enforced.
- [ ] Implement adapters in four reviewable batches: identity/bug/assignment/supporting domains; lifecycle; notification/monitoring; AI/security.
- [ ] Reuse existing fixtures and helpers. Do not duplicate product logic in assertions.
- [ ] For mutations, assert before/after/reload; for rejection, assert error plus unchanged state.
- [ ] Run each selector independently, then the 135-case orchestrator; require 135 terminal results and zero `MAPPING_ONLY`.
- [ ] Commit each green batch, then commit `test: execute IDTS-110 mapping cases atomically`.

### Task 3: Generate complete per-case evidence packages

**Files:**
- Modify: `scripts/qa/generate-idts110-evidence.js`
- Modify: `scripts/qa/generate-idts110-mentor-cards.js`
- Create: `scripts/qa/test-idts110-complete-card-contract.js`
- Modify: `docs/pm/evidence/idts-110/cases/**`
- Modify: `docs/pm/evidence/idts-110/cards/Case-001.png` through `Case-278.png`

**Interfaces:**
- Consumes: 40 accepted historical results, 135 fresh atomic results, 90 existing new-feature results, and 13 blocked manifests.
- Produces: 278 complete case manifests/cards plus case-bound raw evidence.

- [ ] Write RED checks for every visual field in the approved card: Case N, result, evidence kind, executor/review, definition, observed assertions, state readback, test file/line, command, source assertions, baseline, execution window, structured result, and limitation.
- [ ] Render cards in the approved light layout; include runtime screenshot content for UI cases and honest missing-precondition content for blocked cases.
- [ ] Ensure mentor-visible card text contains no internal ID, secret, PII, private endpoint, `undefined`, or `Mapping Only`.
- [ ] Validate PNG freshness, dimensions, hashes, case binding, and 278-card bijection.
- [ ] Commit `docs: generate complete IDTS-110 evidence cards`.

### Task 4: Build the embedded-image v0.6 workbook

**Files:**
- Modify: `scripts/sap490/generate-idts110-unit-test-workbook.mjs`
- Modify: `scripts/sap490/test-idts110-unit-test-workbook.mjs`
- Create: `docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.6_candidate.xlsx`
- Create: `docs/pm/evidence/idts-110/workbook-v06-validation-receipt.json`

**Interfaces:**
- Consumes: official template, 278 catalog rows, truthful results, and 278 complete cards.
- Produces: one candidate XLSX with 278 native embedded drawings and no external card links.

- [ ] Write RED validation against v0.5: zero embedded media and external `../../pm/evidence/...` links must fail.
- [ ] Change Evidence to mentor-facing Case plus embedded image layout; retain machine provenance in JSON rather than visible A:K audit columns.
- [ ] Embed exactly one PNG per case using native image drawings and deterministic anchors; keep UT-to-Evidence internal navigation.
- [ ] Validate OOXML drawing/media relationships, image hashes, anchors, case order, no duplicate/orphan/swapped image, zero external evidence link, truthful status totals, and template fidelity.
- [ ] Run OfficeCLI validation and LibreOffice PDF rendering; inspect Cases 1, 7, 40, 114, 188, 189, 250, and 278.
- [ ] Commit `docs: embed IDTS-110 evidence in v0.6 workbook`.

### Task 5: Regenerate receipt-bound final report

**Files:**
- Modify: `scripts/qa/generate-idts110-final-report.js`
- Modify: `docs/pm/evidence/idts-110/final-execution-report.md`
- Modify: `docs/pm/evidence/idts-110/final-report-receipt-manifest.json`
- Create: `docs/pm/evidence/idts-110/mapping-execution-receipt.json`

**Interfaces:**
- Consumes: 135-result aggregate, complete-card hashes, v0.6 workbook receipt, and independent review receipt.
- Produces: a fail-closed candidate report whose totals derive from validated artifacts.

- [ ] Add RED tests proving any remaining Mapping Only, missing image, substituted workbook, stale receipt, or incorrect totals prevents report generation.
- [ ] Derive totals from receipts; expect zero Mapping Only and 265 Candidate PASS only when all 135 fresh cases pass.
- [ ] Run independent exact-head review and require zero Critical/Major/Important before receipt generation.
- [ ] Run final repository gates, regenerate the candidate report, and commit `docs: publish embedded-evidence IDTS-110 candidate`.

### Task 6: Prepare Google Sheets acceptance without uploading

**Files:**
- Create: `docs/pm/evidence/idts-110/google-sheets-v06-acceptance.md`

**Interfaces:**
- Consumes: validated v0.6 workbook and local render evidence.
- Produces: an approval-gated checklist for a later candidate upload/readback.

- [ ] Record exact workbook hash, size, media/drawing counts, sheet order, status totals, and representative rows.
- [ ] Define Google Sheets acceptance checks for image visibility, row sizing, internal navigation, export-back fidelity, and absence of invalid redirect links.
- [ ] State the stop boundary: no upload, Drive replacement, or Jira update without explicit DonHV approval.
- [ ] Run secret scan, agent rules, AI DevKit lint, and `git diff --check`; commit `docs: prepare IDTS-110 Google Sheets acceptance`.
