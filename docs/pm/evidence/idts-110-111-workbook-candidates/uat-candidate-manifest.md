# IDTS-111 UAT workbook candidate manifest

Status: **CANDIDATE - NOT OFFICIAL / NOT APPROVED**

## Identity

- Candidate: `docs/sap490/generated/UAT_IDTS_SAP01_en_candidate_v0.3.xlsx`
- Candidate SHA-256: `F58D1343E7D982AB9E89D3033B0AC02BA58335BFC6950258B351FDA4851E9B17`
- Candidate size: `5,157,561` bytes
- Git baseline: `8d4e78b71d7cde2c54b2671577f1a90629864482`
- Authority Drive ID: `1UYThySnyIu0KUu48K7PSpIFWjIbpixBY`
- Authority filename: `GFA24SAP04_UAT.xlsx`
- Authority SHA-256: `E96753C4EADED1AE25D3651C5F8F759BC74A534FE0975AAF2CF479F04F964D9E`
- Generator: `node scripts/sap490/generate-idts110-111-workbook-candidates.mjs`

## Content and evidence

- Catalog rows: 90/90 unique IDs, all catalog status `PREPARED`.
- Reviewer disposition: 22 `MEETS_EXPECTED_RESULT`, 12 `DOES_NOT_MEET_EXPECTED_RESULT`, 20 `BLOCKED`, 3 `RERUN_REQUIRED_CURRENT_RUNTIME`, 33 still `PREPARED`.
- Embedded images: 77 manifest-hashed repository images across 36 cases; 54 cases state `No valid case-specific image evidence`.
- Evidence with non-positive or inconsistent provenance is retained for audit with `REVIEW BLOCKED`; `MEETS` is not final UAT sign-off.
- Full disposition remains on `Test Result`; compact display uses `MEETS`, `DOES NOT MEET`, `BLOCKED`, `RERUN REQUIRED`, or `PREPARED` to fit the template.

## Changed tabs and ranges

- `Cover!N3`, `Cover!N4`
- `Histories!D4`
- `Test Scenario!B8:CI19` (12 catalog domains)
- `Test Cases!B8:CI97`
- `Test Result!A6:P2300` plus 77 drawing anchors

All other sheet names/order/visibility and page contracts are preserved by policy. The ignored import copy removes only the authority's empty threaded-person part so artifact-tool can import it; authority bytes remain unchanged.

## Verification

- Catalog check: PASS, 90 `PREPARED` cases, EN-only and evidence policy valid.
- Candidate contract: PASS, exact sheet order, 90 unique UAT IDs, 90 internal evidence hyperlinks.
- OpenXML schema: OfficeCLI PASS.
- Fidelity policy: PASS.
- OfficeCLI issues: 10 overflow advisories; no formula-evaluation or schema error.
- Drawing audit: 77 media parts; openpyxl reads 77 images on `Test Result`.
- Visual review: artifact-tool focused ranges, Microsoft Excel 12 read-only PDF export, and LibreOffice 26.2.3.2 PDF export inspected. IDs, case text, status separation, links, missing-evidence labels, captions, hashes, and representative UAT images are visible.
- Review images: `rendered/excel-uat-test-cases.png`, `rendered/excel-uat-evidence.png`, `rendered/libreoffice-uat-test-cases-page-013.png`, `rendered/libreoffice-uat-evidence-page-045.png`.

## Release gate

Do not mark PASS or update Drive. DonHV's current SAP490 briefing acknowledgment does not name baseline `8d4e78b71d7cde2c54b2671577f1a90629864482`. DonHV must personally record the matching acknowledgment and Jira comment, then explicitly approve this exact candidate SHA-256 before the existing Drive ID may be updated.
