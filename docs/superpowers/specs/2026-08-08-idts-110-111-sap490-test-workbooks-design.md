# IDTS-110/111 SAP490 Test Workbook Candidate Design

## Goal

Create English-only SAP490 Unit Test and UAT candidate workbooks that contain the complete approved catalogs, preserve truthful execution status, and provide case-specific image evidence without changing the official Google Drive files before approval.

## Authority and baselines

- Executing member: DonHV.
- Git baseline: `8d4e78b71d7cde2c54b2671577f1a90629864482`.
- Unit Test authority: Drive ID `1nE9xRVVCZRDwqhaNfKDFn9P71vslgM27`, `GFA24SAP04_Unit_Test.xlsx`, local audited SHA-256 `C1B812DD6AE8A95146F1EB553601D93FBF99CCEA336E8D7FDCA6626D86C90ED7`.
- UAT authority: Drive ID `1UYThySnyIu0KUu48K7PSpIFWjIbpixBY`, `GFA24SAP04_UAT.xlsx`, local audited SHA-256 `E96753C4EADED1AE25D3651C5F8F759BC74A534FE0975AAF2CF479F04F964D9E`.
- Unit Test catalog: `docs/qa/idts-110-unit-test-catalog.json`, 188 cases.
- UAT catalog: `docs/qa/idts-111-uat-catalog.json`, 90 cases.
- Execution/reviewer truth comes only from the IDTS-110/111 evidence manifests, execution summaries, and DonHV review matrices at the baseline used by the candidate.

The repo-local `idts-sap490-xlsx-fidelity` skill governs template preservation, candidate isolation, validation, visual review, approval, and release.

## Outputs

- `docs/sap490/generated/Unit_Test_IDTS_SAP01_en_candidate_v0.5.xlsx`
- `docs/sap490/generated/UAT_IDTS_SAP01_en_candidate_v0.3.xlsx`
- One candidate manifest per workbook under `docs/pm/evidence/idts-110-111-workbook-candidates/`.
- Rendered review evidence under the same evidence directory.

No existing generated workbook, local template, or Drive file is overwritten during candidate authoring.

## Workbook content

### Unit Test

- Preserve the official `Cover`, `Histories`, `UT`, and `Evidence` sheet contract.
- Populate all 188 catalog cases in deterministic catalog order.
- Keep catalog execution status `NOT_RUN` unless a separately reviewed execution record supports a more specific candidate disposition.
- Store execution/reviewer disposition separately from catalog status so accepted evidence, held evidence, mapping-only rows, and blocked rows cannot be mistaken for final PASS.
- Link each evidence-backed case to its labeled block on `Evidence`.

### UAT

- Preserve the official `Cover`, `Histories`, `Test Scenario`, `Test Cases`, and `Test Result` sheet contract.
- Populate all 90 catalog cases in deterministic catalog order.
- Preserve `PREPARED` for cases without reviewed execution evidence.
- Preserve candidate `MEETS`, `DOES_NOT_MEET`, `BLOCKED`, partial recheck, catalog mismatch, and test-harness limitation wording from the current review sources. Candidate `MEETS` is not final UAT sign-off.
- Link each evidence-backed case to its labeled block on `Test Result`.

## Evidence policy

- Embed only existing repository images whose path and SHA-256 can be traced through a case manifest or current review record.
- Evidence with inconsistent fixture provenance remains visible for audit but is labeled `REVIEW BLOCKED` and cannot support PASS.
- A case without valid image evidence states `No valid case-specific image evidence`; no screenshot is fabricated or reused across unrelated cases.
- Sanitize labels and captions; never expose credentials, tokens, private endpoints, private email addresses, raw provider diagnostics, or hidden reasoning.
- Preserve source image aspect ratio and use the official evidence-region geometry. Do not enlarge evidence outside the official frame.

## Fidelity and editing strategy

1. Copy each audited OFFICIAL SUBMISSIONS reference to a new candidate.
2. Capture a pre-edit structural/style contract for every sheet.
3. Clear or replace only the approved project-content and evidence regions while preserving the workbook shell, sheet order, visibility, dimensions, styles, merges, formulas, page settings, and headers/footers.
4. Reuse the nearest semantically equivalent reference styles and row blocks.
5. Extend repeated case/evidence blocks only with the template's existing row/style pattern; do not globally autofit, restyle, merge, unmerge, or change print scaling.
6. Record every changed tab/range and known baseline warning in the candidate manifest.

The official Unit Test reference currently has 13 broken defined-name warnings, 78 overflow advisories, and one duplicate drawing-ID validation error. The official UAT reference has 16 overflow advisories and one duplicate drawing-ID validation error. These are range-specific baseline issues, not blanket waivers. Candidate validation must prove no new warning outside approved regions and must disclose any preserved baseline issue.

## Implementation boundary

- Add the smallest project script or extend an existing focused helper only when it can consume the two JSON catalogs, evidence manifests, and review matrices deterministically.
- Do not change CAP, CDS runtime behavior, Fiori/UI5 behavior, database content, deployment configuration, or business rules.
- Correct the stale IDTS-110 attachment source trace to the current SAP-standard CDS annotations; do not restore the retired custom uploader.
- Do not create Vietnamese submission artifacts.

## Verification

For each candidate:

1. Verify catalog row count and unique case IDs: Unit Test 188, UAT 90.
2. Verify every populated row maps to a current catalog case and every embedded image maps to an existing hashed evidence source.
3. Run OfficeCLI `view issues`, formula/error queries, and `validate`.
4. Run `audit_xlsx_fidelity.py` with a candidate-specific policy.
5. Scan formulas, defined names, headers/footers, filenames, captions, and hidden content for Excel errors, placeholders, Vietnamese submission text, mojibake, secrets, and private endpoints.
6. Render every relevant sheet in an Excel-compatible preview and export through LibreOffice to PDF.
7. Inspect the changed ranges plus adjacent unchanged ranges for clipping, borders, grid leakage, image anchors, blank pages, and renderer differences.
8. Run deterministic catalog checks, the focused workbook validator, `git diff --check`, and the repository verification gate.

## Approval and release

- Present DonHV with each candidate filename, SHA-256, changed tabs/ranges, evidence summary, validation results, and visual previews.
- Approval is candidate-hash and range specific.
- The current SAP490 briefing acknowledgment does not name the task baseline SHA. Until DonHV personally records a current acknowledgment and matching Jira comment, candidates cannot be marked PASS or synchronized to OFFICIAL SUBMISSIONS.
- After the acknowledgment and explicit candidate approval, update the existing Drive file IDs only; preserve parent, MIME type, permissions, and IDs, then read back metadata and bytes/hash.

## Success criteria

- Both candidate files exist and contain exactly 188 Unit Test and 90 UAT cases.
- Statuses and evidence labels match current reviewer truth with no fabricated PASS or sign-off.
- Every embedded image is traceable and hash-valid, or the case explicitly states that valid image evidence is absent.
- Candidate structure and visible layout match the official references within the approved content/evidence regions.
- All new validation gates pass; preserved official-reference issues are disclosed by exact sheet/range.
- No official/local-current artifact or Drive file changes before DonHV's exact-hash approval and acknowledgment gate.
