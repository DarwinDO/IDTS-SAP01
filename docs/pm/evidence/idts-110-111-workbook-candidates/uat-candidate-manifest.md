# IDTS-111 UAT workbook candidate manifest

Status: **CANDIDATE - NOT OFFICIAL / NOT APPROVED**

## Identity

- Candidate: `docs/sap490/generated/UAT_IDTS_SAP01_en_candidate_v0.3.xlsx`
- Candidate SHA-256: `B88F7CDA09BB7F2D4DDB01F51F72C3452A669DCACCF1CC30B939A04FABAD68E3`
- Candidate size: `5,044,999` bytes
- Git baseline: `8d4e78b71d7cde2c54b2671577f1a90629864482`
- Authority Drive ID: `1UYThySnyIu0KUu48K7PSpIFWjIbpixBY`
- Authority filename: `GFA24SAP04_UAT.xlsx`
- Authority SHA-256: `E96753C4EADED1AE25D3651C5F8F759BC74A534FE0975AAF2CF479F04F964D9E`
- Generator: `node scripts/sap490/generate-idts110-111-workbook-candidates.mjs`

## Content and evidence

- Catalog rows: 90/90 cases with visible serial numbers `1` through `90`; all catalog status `PREPARED`.
- Technical catalog IDs remain only in the source/evidence mapping for audit traceability; they are not used as the workbook's visible test numbering.
- Source reviewer disposition remains 22 `MEETS_EXPECTED_RESULT`, 12 `DOES_NOT_MEET_EXPECTED_RESULT`, 20 `BLOCKED`, 3 `RERUN_REQUIRED_CURRENT_RUNTIME`, 33 still `PREPARED`.
- Candidate presentation conservatively demotes serial 1 to `REVIEW` because its source screenshot does not prove the profile assertion and contains unrelated runtime rows. The image remains immutable in the repository but is omitted from the submission workbook.
- Embedded images: 76 manifest-hashed repository images across 35 cases; 55 cases use `Details` and state that valid case-specific image evidence is absent or omitted.
- Evidence with non-positive or inconsistent provenance is retained for audit with `REVIEW BLOCKED`; `MEETS` is not final UAT sign-off.
- Full, untruncated reviewer rationale remains on `Test Result`; compact main-table display uses `MEETS`, `NOT MET`, `BLOCK`, `RERUN`, `PREPARED`, or the serial-1 `REVIEW` exception to fit the official narrow Result column.

## Changed tabs and ranges

- `Cover!N3`, `Cover!N4`
- `Histories!D4`
- `Test Scenario!A4:E15` (12 clean IDTS domains with visible serials `1` through `12`)
- `Test Cases!B8:CI97`
- `Test Result!A1:Y1429` plus 76 drawing anchors; visible evidence bands/images are constrained to `A:F` for Excel/PDF readability

All other sheet names/order/visibility and page contracts are preserved by policy. The ignored import copy removes only the authority's empty threaded-person part so artifact-tool can import it; authority bytes remain unchanged.

## Verification

- Catalog check: PASS, 90 `PREPARED` cases, EN-only and evidence policy valid.
- Candidate contract: PASS, exact sheet order, visible serial numbers `1` through `90`, and 90 internal evidence hyperlinks.
- OpenXML schema: OfficeCLI PASS.
- Fidelity policy: PASS.
- OfficeCLI issues: 0 candidate-content issues; no formula-evaluation or schema error.
- Drawing audit: 76 media parts; openpyxl reads 76 images on `Test Result`.
- Visual review: artifact-tool focused ranges, Microsoft Excel 12 read-only export, and LibreOffice 26.2.3.2 PDF export inspected. Ordinary serial numbers, case text, status separation, links, missing-evidence labels, captions, hashes, and representative UAT images are visible. LibreOffice preserves the authority's multi-page horizontal print pagination; Excel review exports fit the selected review area to one page without saving that temporary print override into the candidate.
- Review images: `rendered/excel-uat-test-cases-serial.png`, `rendered/excel-uat-test-cases-5-8.png`, `rendered/excel-uat-evidence-serial.png`, `rendered/uat-test-cases-content.png`, `rendered/uat-test-cases-5-8-content.png`, `rendered/uat-test-cases-5-8-results.png`, `rendered/uat-evidence-first-block.png`, `rendered/libreoffice-uat-test-cases-page-017.png`, `rendered/libreoffice-uat-test-cases-page-018.png`, `rendered/libreoffice-uat-test-results-page-033.png`, `rendered/libreoffice-uat-evidence-page-053.png`.
- Independent candidate-quality review: visual fidelity, XLSX structure, and content/evidence reviewers report no Critical or Major findings and `APPROVE CANDIDATE` for this exact SHA-256. This is not DonHV's release approval or a final UAT PASS.

## Release gate

Do not mark PASS or update Drive. DonHV's current SAP490 briefing acknowledgment does not name baseline `8d4e78b71d7cde2c54b2671577f1a90629864482`. DonHV must personally record the matching acknowledgment and Jira comment, then explicitly approve this exact candidate SHA-256 before the existing Drive ID may be updated.
