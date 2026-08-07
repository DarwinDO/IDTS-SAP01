# IDTS-110/111 SAP490 Test Workbook Candidates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate two English-only, fidelity-preserving SAP490 candidate workbooks containing exactly 188 Unit Test cases and 90 UAT cases, with truthful statuses and hash-traceable image evidence.

**Architecture:** Import each audited OFFICIAL SUBMISSIONS workbook with `@oai/artifact-tool`, preserve the workbook shell, and replace only approved test-content/evidence ranges. A deterministic adapter combines catalogs, case manifests, and DonHV review records into normalized rows; a focused validator checks row coverage, status policy, evidence hashes, and workbook structure before OfficeCLI and the repo fidelity validator perform independent checks.

**Tech Stack:** Node.js ESM, `@oai/artifact-tool`, OfficeCLI 1.0.143, repo `audit_xlsx_fidelity.py`, LibreOffice, PowerShell, Git.

## Global Constraints

- Execute in worktree `E:/IDTS-SAP01-worktrees/idts-110-111-test-workbooks-donhv` on branch `docs/idts-110-111-test-workbooks-donhv`.
- Clone Unit authority SHA-256 `C1B812DD6AE8A95146F1EB553601D93FBF99CCEA336E8D7FDCA6626D86C90ED7` and UAT authority SHA-256 `E96753C4EADED1AE25D3651C5F8F759BC74A534FE0975AAF2CF479F04F964D9E`; never overwrite them.
- Output only `Unit_Test_IDTS_SAP01_en_candidate_v0.5.xlsx` and `UAT_IDTS_SAP01_en_candidate_v0.3.xlsx` under `docs/sap490/generated/`.
- Preserve English-only submission content, exact sheet order/names, visibility, print settings, headers/footers, and unaffected ranges.
- Unit must contain 188 unique catalog IDs; UAT must contain 90 unique catalog IDs.
- Embed an image only when its file exists and SHA-256 matches a current manifest/review record; never fabricate or reuse unrelated evidence.
- `NOT_RUN`, `PREPARED`, `MEETS`, `DOES_NOT_MEET`, `BLOCKED`, held, mapping-only, and review-blocked dispositions must remain distinct; `MEETS` is not final UAT approval.
- Candidate-only: no Google Drive write, PASS claim, or official synchronization until DonHV records the current-baseline acknowledgment and explicitly approves exact candidate hashes.

---

### Task 1: Repair and lock the source catalogs

**Files:**
- Modify: `scripts/qa/generate-idts110-unit-test-catalog.js`
- Modify: `docs/qa/idts-110-unit-test-catalog.json`
- Modify: `docs/pm/status/donhv.md`

**Interfaces:**
- Consumes: current CDS attachment annotations in `db/schema.cds`.
- Produces: deterministic 188-case Unit catalog whose `sourceTrace` paths resolve; unchanged 90-case UAT catalog.

- [ ] **Step 1: Record the stale attachment-trace issue immediately**

Update the existing session issue row in `docs/pm/status/donhv.md` with classification `test-harness issue`, the retired `MAX_ATTACHMENT_BYTES` symptom, and status `under investigation` before unrelated work.

- [ ] **Step 2: Run the Unit check and observe the failure**

Run: `node scripts/qa/generate-idts110-unit-test-catalog.js --check`

Expected before the repair: FAIL for nine attachment cases whose trace references the retired uploader constant.

- [ ] **Step 3: Point the trace at the current SAP-standard constraints**

Set the attachment UI trace sources to `db/schema.cds` symbols `@Core.AcceptableMediaTypes` and `@Validation.Maximum : '10MB'`; do not recreate custom upload logic.

- [ ] **Step 4: Regenerate and verify both catalogs**

Run:

```powershell
node scripts/qa/generate-idts110-unit-test-catalog.js
node scripts/qa/generate-idts110-unit-test-catalog.js --check
node scripts/qa/generate-idts111-uat-catalog.js --check
```

Expected: Unit reports `188 NOT_RUN`; UAT reports `90 PREPARED`; all source traces resolve.

- [ ] **Step 5: Close the issue log with evidence**

Update the same DonHV issue row to `resolved`, name commit `ea882fe` as the intentional uploader migration context, and quote the fresh check results.

- [ ] **Step 6: Commit the catalog repair**

```powershell
git add scripts/qa/generate-idts110-unit-test-catalog.js docs/qa/idts-110-unit-test-catalog.json docs/pm/status/donhv.md
git commit -m "fix(idts-110): align attachment catalog traces"
```

### Task 2: Build deterministic catalog and evidence adapters

**Files:**
- Create: `scripts/sap490/idts110-111-workbook-data.mjs`
- Create: `scripts/sap490/test-idts110-111-workbook-data.mjs`

**Interfaces:**
- Produces: `loadUnitCases(repoRoot): Promise<TestCase[]>`, `loadUatCases(repoRoot): Promise<TestCase[]>`, and `verifyEvidence(repoRoot, manifestEntry): Promise<EvidenceFile>`.
- `TestCase` contains `id`, `area`, `title`, `preconditions`, `steps`, `expected`, `catalogStatus`, `reviewDisposition`, `reviewNote`, and `evidence[]`.
- `EvidenceFile` contains normalized repo-relative `path`, uppercase `sha256`, `caption`, and `reviewBlocked`.

- [ ] **Step 1: Write failing adapter tests**

Assert exact counts/unique IDs, Unit default `NOT_RUN`, UAT default `PREPARED`, preservation of reviewed dispositions, rejection of missing/hash-mismatched images, and deterministic ordering.

- [ ] **Step 2: Run the test and verify RED**

Run: `node scripts/sap490/test-idts110-111-workbook-data.mjs`

Expected: FAIL because the adapter module does not yet exist.

- [ ] **Step 3: Implement the minimal adapters**

Read catalogs and current evidence JSON/Markdown without mutating them. Normalize only recognized reviewer states; attach evidence only after `fs.stat` and `crypto.createHash('sha256')` match; add the exact note `No valid case-specific image evidence` when none survives.

- [ ] **Step 4: Run adapter tests and verify GREEN**

Run: `node scripts/sap490/test-idts110-111-workbook-data.mjs`

Expected: PASS with `188 Unit`, `90 UAT`, zero duplicate IDs, and zero accepted hash mismatches.

- [ ] **Step 5: Commit the adapters**

```powershell
git add scripts/sap490/idts110-111-workbook-data.mjs scripts/sap490/test-idts110-111-workbook-data.mjs
git commit -m "feat(idts-110-111): normalize workbook test evidence"
```

### Task 3: Generate fidelity-preserving candidate workbooks

**Files:**
- Create: `scripts/sap490/generate-idts110-111-workbook-candidates.mjs`
- Create: `scripts/sap490/test-idts110-111-workbook-candidates.mjs`
- Create: `docs/sap490/generated/Unit_Test_IDTS_SAP01_en_candidate_v0.5.xlsx`
- Create: `docs/sap490/generated/UAT_IDTS_SAP01_en_candidate_v0.3.xlsx`

**Interfaces:**
- Consumes: Task 2 adapters and audited authority files under `.tmp/official-submission-audit/`.
- Produces: `generateUnitCandidate(options)` and `generateUatCandidate(options)` plus the two candidate XLSX files.

- [ ] **Step 1: Connect the bundled spreadsheet runtime**

Create a task-local support directory and a Windows junction named `node_modules` pointing to `C:/Users/LapHub/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`; set `NODE_PATH` only for task commands.

- [ ] **Step 2: Write failing workbook contract tests**

Test authority hashes, output non-overwrite behavior, exact sheet names/order, exact case ID counts, and absence of final-signoff wording.

- [ ] **Step 3: Run contract tests and verify RED**

Run with the bundled Node executable: `node scripts/sap490/test-idts110-111-workbook-candidates.mjs`

Expected: FAIL because generator functions/candidates do not exist.

- [ ] **Step 4: Implement Unit candidate generation**

Import the authority with `FileBlob.load` and `SpreadsheetFile.importXlsx`; preserve `Cover`, `Histories`, `UT`, `Evidence`; clone official row/style blocks with `copyFrom(..., 'all')`; write all 188 cases; keep catalog status separate from review disposition; delete only sample evidence drawings; add labels, case hyperlinks, and verified images at official evidence geometry.

- [ ] **Step 5: Implement UAT candidate generation**

Preserve `Cover`, `Histories`, `Test Scenario`, `Test Cases`, `Test Result`; write all 90 catalog cases; preserve reviewer truth and non-signoff language; delete only sample result drawings; add verified evidence and explicit missing-evidence labels.

- [ ] **Step 6: Export both candidates and run contract tests**

Run:

```powershell
node scripts/sap490/generate-idts110-111-workbook-candidates.mjs
node scripts/sap490/test-idts110-111-workbook-candidates.mjs
```

Expected: PASS; authority hashes unchanged; candidates contain 188/90 unique IDs and only hash-valid embedded sources.

- [ ] **Step 7: Commit generator and candidates**

```powershell
git add scripts/sap490/generate-idts110-111-workbook-candidates.mjs scripts/sap490/test-idts110-111-workbook-candidates.mjs docs/sap490/generated/Unit_Test_IDTS_SAP01_en_candidate_v0.5.xlsx docs/sap490/generated/UAT_IDTS_SAP01_en_candidate_v0.3.xlsx
git commit -m "feat(idts-110-111): generate SAP490 test workbook candidates"
```

### Task 4: Validate structure, formulas, fidelity, and visible layout

**Files:**
- Create: `docs/pm/evidence/idts-110-111-workbook-candidates/unit-fidelity-policy.json`
- Create: `docs/pm/evidence/idts-110-111-workbook-candidates/uat-fidelity-policy.json`
- Create: `docs/pm/evidence/idts-110-111-workbook-candidates/rendered/*`

**Interfaces:**
- Consumes: candidate workbooks from Task 3 and official authorities.
- Produces: machine-readable validation output, sheet PNGs/PDFs, and an exact list of preserved baseline warnings/new issues.

- [ ] **Step 1: Write candidate-specific fidelity policies**

Allow content/evidence differences only in `UT`/`Evidence` and `Test Scenario`/`Test Cases`/`Test Result`; preserve all other sheet-level and workbook-level contracts. List the official duplicate drawing-ID and broken-name/overflow warnings by exact source scope; do not use blanket ignore rules.

- [ ] **Step 2: Run OfficeCLI inspection and validation**

Run `officecli excel view ... --issues`, targeted formula/error queries, and `officecli excel validate` for both candidates. Capture stdout and exit codes because OfficeCLI 1.0.143 may print validation errors while returning exit code 0.

- [ ] **Step 3: Run the repo fidelity validator**

Run `audit_xlsx_fidelity.py validate` once per reference/candidate/policy trio. Expected: no unexpected structural/style drift outside approved regions.

- [ ] **Step 4: Render all relevant sheets**

Render artifact-tool PNG previews and LibreOffice PDFs for every sheet; retain changed ranges and adjacent unchanged context in `rendered/`.

- [ ] **Step 5: Inspect rendered images**

Use visual inspection to check clipping, wrapped text, border continuity, blank pages, evidence aspect ratio, image anchors, and renderer differences. If any defect appears, record it immediately in `docs/pm/status/donhv.md`, repair only the affected range, and repeat Steps 2-5.

- [ ] **Step 6: Commit validation policies and review renders**

```powershell
git add docs/pm/evidence/idts-110-111-workbook-candidates
git commit -m "test(idts-110-111): add workbook fidelity evidence"
```

### Task 5: Publish candidate manifests and PM handoff

**Files:**
- Create: `docs/pm/evidence/idts-110-111-workbook-candidates/unit-test-candidate-manifest.md`
- Create: `docs/pm/evidence/idts-110-111-workbook-candidates/uat-candidate-manifest.md`
- Modify: `docs/pm/tasks/idts-110-unit-test-en.md`
- Modify: `docs/pm/tasks/idts-111-uat-en.md`
- Modify: `docs/pm/status/donhv.md`

**Interfaces:**
- Consumes: final candidate bytes and validation evidence.
- Produces: hash-specific review package and truthful handoff without changing task state to Done.

- [ ] **Step 1: Calculate final hashes and evidence totals**

Use `Get-FileHash -Algorithm SHA256` for both candidates. Count cases with verified images, images embedded, missing evidence, review-blocked evidence, and each disposition.

- [ ] **Step 2: Write the two manifests**

Record authority Drive ID/name/hash, candidate filename/hash, Git baseline, generator command, changed tabs/ranges, counts, known baseline warnings, OfficeCLI/fidelity results, visual review paths, and explicit `CANDIDATE — NOT OFFICIAL / NOT APPROVED` status.

- [ ] **Step 3: Update PM handoff files**

Record what was generated, bugs/tool limitations found and resolved/open, verification commands, candidate hashes, and the remaining acknowledgment/Jira/approval gate. Do not move IDTS-110/111 to Done or claim PASS.

- [ ] **Step 4: Run the final verification gate**

```powershell
node scripts/qa/generate-idts110-unit-test-catalog.js --check
node scripts/qa/generate-idts111-uat-catalog.js --check
node scripts/sap490/test-idts110-111-workbook-data.mjs
node scripts/sap490/test-idts110-111-workbook-candidates.mjs
git diff --check
git status --short
```

Expected: all checks PASS; only intentional candidate/package changes remain; no Drive state changed.

- [ ] **Step 5: Commit the candidate handoff**

```powershell
git add docs/pm/evidence/idts-110-111-workbook-candidates docs/pm/tasks/idts-110-unit-test-en.md docs/pm/tasks/idts-111-uat-en.md docs/pm/status/donhv.md
git commit -m "docs(idts-110-111): hand off workbook candidates"
```

- [ ] **Step 6: Present exact-hash review to DonHV**

Show clickable candidate files, manifest files, selected rendered images, counts, hashes, validation results, and the unresolved baseline acknowledgment gate. Do not upload or update the two official Drive IDs in this task.
