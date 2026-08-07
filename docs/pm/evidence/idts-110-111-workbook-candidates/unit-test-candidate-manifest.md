# IDTS-110 Unit Test workbook candidate manifest

Status: **CANDIDATE - NOT OFFICIAL / NOT APPROVED**

## Identity

- Candidate: `docs/sap490/generated/Unit_Test_IDTS_SAP01_en_candidate_v0.5.xlsx`
- Candidate SHA-256: `62E1F35982C8B917944831AC615D4412518D4F0D1DF447E05D1079849747B59D`
- Candidate size: `15,464,935` bytes
- Git baseline: `8d4e78b71d7cde2c54b2671577f1a90629864482`
- Authority Drive ID: `1nE9xRVVCZRDwqhaNfKDFn9P71vslgM27`
- Authority filename: `GFA24SAP04_Unit_Test.xlsx`
- Authority SHA-256: `C1B812DD6AE8A95146F1EB553601D93FBF99CCEA336E8D7FDCA6626D86C90ED7`
- Generator: `node scripts/sap490/generate-idts110-111-workbook-candidates.mjs`

## Content and evidence

- Catalog rows: 188/188 unique IDs, all catalog status `NOT_RUN`.
- Reviewer disposition: 38 `ACCEPTED_CANDIDATE`, 135 `MAPPING_ONLY_NOT_PASS`, 13 `BLOCKED_PENDING_MEMBER_EVIDENCE`, 2 `HELD_FOR_EXACT_HEAD_ACCEPTANCE`.
- Embedded images: 280 existing repository images across 188 cases.
- Each embedded source exists and its SHA-256 is recorded by the candidate adapter; mapping-only, blocked, and held evidence is labeled `REVIEW BLOCKED` and does not support PASS.
- Full reviewer wording remains on `Evidence`; the compact `Result` display uses `NR-ACCEPT`, `NR-MAP`, `NR-BLOCK`, and `NR-HELD` only to fit the official narrow column.

## Changed tabs and ranges

- `Cover!N3`, `Cover!N4`
- `Histories!D4`
- `UT!B8:BR195`
- `Evidence!A1:Z6444` plus 280 drawing anchors

All other sheet names/order/visibility and page contracts are preserved by policy. The generator normalizes only invalid empty comment/person metadata in an ignored import copy because artifact-tool cannot import empty display names; authority bytes remain unchanged.

## Verification

- Catalog check: PASS, 188 `NOT_RUN` cases and resolved source traces.
- Candidate contract: PASS, exact sheet order, 188 unique Unit IDs, 188 internal evidence hyperlinks.
- OpenXML schema: OfficeCLI PASS.
- Fidelity policy: PASS.
- OfficeCLI issues: 81 advisories: 13 inherited broken defined names and 68 overflow advisories. No formula-evaluation error remains.
- Drawing audit: 280 media parts; openpyxl reads 280 images on `Evidence`.
- Visual review: artifact-tool focused ranges, Microsoft Excel 12 read-only PDF export, and LibreOffice 26.2.3.2 PDF export inspected. IDs, wrapped case text, borders, links, captions, hashes, and representative images are visible; artifact-tool alone does not render imported drawing images, so Excel/LibreOffice are the image authority.
- Review images: `rendered/excel-unit-ut.png`, `rendered/excel-unit-evidence.png`, `rendered/libreoffice-unit-ut-page-009.png`, `rendered/libreoffice-unit-evidence-page-106.png`.

## Release gate

Do not mark PASS or update Drive. DonHV's current SAP490 briefing acknowledgment does not name baseline `8d4e78b71d7cde2c54b2671577f1a90629864482`. DonHV must personally record the matching acknowledgment and Jira comment, then explicitly approve this exact candidate SHA-256 before the existing Drive ID may be updated.
