# IDTS-110 Unit Test workbook candidate manifest

Status: **CANDIDATE - NOT OFFICIAL / NOT APPROVED**

## Identity

- Candidate: `docs/sap490/generated/Unit_Test_IDTS_SAP01_en_candidate_v0.5.xlsx`
- Candidate SHA-256: `C8A494837D5588C1501DD5D87351A137656A7A89CACCD57BE8F4C82E5904EAAC`
- Candidate size: `15,461,591` bytes
- Git baseline: `8d4e78b71d7cde2c54b2671577f1a90629864482`
- Authority Drive ID: `1nE9xRVVCZRDwqhaNfKDFn9P71vslgM27`
- Authority filename: `GFA24SAP04_Unit_Test.xlsx`
- Authority SHA-256: `C1B812DD6AE8A95146F1EB553601D93FBF99CCEA336E8D7FDCA6626D86C90ED7`
- Generator: `node scripts/sap490/generate-idts110-111-workbook-candidates.mjs`

## Content and evidence

- Catalog rows: 188/188 cases with visible serial numbers `1` through `188`; all catalog status `NOT_RUN`.
- Technical catalog IDs remain only in the source/evidence mapping for audit traceability; they are not used as the workbook's visible test numbering.
- Reviewer disposition: 38 `ACCEPTED_CANDIDATE`, 135 `MAPPING_ONLY_NOT_PASS`, 13 `BLOCKED_PENDING_MEMBER_EVIDENCE`, 2 `HELD_FOR_EXACT_HEAD_ACCEPTANCE`.
- Embedded images: 280 existing repository images across 188 cases.
- Each embedded source exists and its SHA-256 is recorded by the candidate adapter; mapping-only, blocked, and held evidence is labeled `REVIEW BLOCKED` and does not support PASS.
- Full reviewer wording remains on `Evidence`; the compact `Result` display uses `NR-ACCEPT`, `NR-MAP`, `NR-BLOCK`, and `NR-HELD` only to fit the official narrow column.

## Changed tabs and ranges

- `Cover!N3`, `Cover!N4`
- `Histories!D4`
- `UT!B8:BR195`
- `Evidence!A1:Z3354` plus 280 drawing anchors; visible evidence bands/images are constrained to `A:F` for Excel/PDF readability

All other sheet names/order/visibility and page contracts are preserved by policy. The generator normalizes only invalid empty comment/person metadata in an ignored import copy because artifact-tool cannot import empty display names; authority bytes remain unchanged.

## Verification

- Catalog check: PASS, 188 `NOT_RUN` cases and resolved source traces.
- Candidate contract: PASS, exact sheet order, visible serial numbers `1` through `188`, and 188 internal evidence hyperlinks.
- OpenXML schema: OfficeCLI PASS.
- Fidelity policy: PASS.
- OfficeCLI issues: 13 inherited broken defined names and no candidate-content issue. The same broken names exist in the frozen authority and were not broadened or repaired outside the approved content ranges.
- Drawing audit: 280 media parts; openpyxl reads 280 images on `Evidence`.
- Visual review: artifact-tool focused ranges, Microsoft Excel 12 read-only export, and LibreOffice 26.2.3.2 PDF export inspected. Ordinary serial numbers, wrapped case text, borders, links, captions, hashes, and representative images are visible. Artifact-tool alone does not render imported drawing images, so Excel/LibreOffice are the image authority. LibreOffice preserves the authority's multi-page horizontal print pagination; Excel review exports fit the selected review area to one page without saving that temporary print override into the candidate.
- Review images: `rendered/excel-unit-ut-serial.png`, `rendered/excel-unit-evidence-serial.png`, `rendered/unit-ut-case-content.png`, `rendered/unit-evidence-first-block.png`, `rendered/libreoffice-unit-ut-page-009.png`, `rendered/libreoffice-unit-ut-results-page-057.png`, `rendered/libreoffice-unit-evidence-page-107.png`.
- Independent candidate-quality review: visual fidelity, XLSX structure, and content/evidence reviewers report no Critical or Major findings and `APPROVE CANDIDATE` for this exact SHA-256. This is not DonHV's release approval or an execution PASS.

## Release gate

Do not mark PASS or update Drive. DonHV's current SAP490 briefing acknowledgment does not name baseline `8d4e78b71d7cde2c54b2671577f1a90629864482`. DonHV must personally record the matching acknowledgment and Jira comment, then explicitly approve this exact candidate SHA-256 before the existing Drive ID may be updated.
