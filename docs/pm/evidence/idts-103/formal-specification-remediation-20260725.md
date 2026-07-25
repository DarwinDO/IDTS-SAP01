# IDTS-103 Formal Specification Remediation Evidence

## Baseline and scope

- Branch: `docs/idts-103-formal-specification-tables-donhv`.
- Runtime scope: none; `app/`, `srv/`, and `db/` are unchanged.
- Artifacts:
  - Functional Specification EN/VI v0.7.
  - Technical Specification EN/VI v0.6.
- Google Drive: unchanged pending DonHV local review.

## Implemented corrections

| Area | Previous finding | Correction |
| --- | --- | --- |
| Structured content | Raw prose, long filename/function chains, and multiple concepts were placed in one cell. | Replaced with one-record-per-row formal tables cloned from official template styles. |
| Function coverage | Multiple business domains or AI operations could share one record. | Split each function/action into a stable Function ID row. |
| Screen Layout | Technical traces appeared as paragraphs in a merged area. | Added screen records with route, page/view, controller, OData binding, controls, and role columns. |
| Messages | Functional and Technical Specifications used inconsistent structures. | Introduced one canonical bilingual Message Catalog and reused the same Message IDs in both workbooks. |
| Technical detail | Design and implementation mappings were difficult to review. | Added Component, Entity, Module, Transaction, Integration, Requirement, and Implementation Flow tables. |
| Vietnamese parity | Technical Specification VI retained excessive English prose. | Localized visible labels and explanations while preserving endpoints, file paths, symbols, entities, fields, and SAP/CAP/Fiori terms. |
| Printing | Stale template print areas produced many near-blank pages. | Bounded print areas and preserved fit-to-width template behavior. |

## Structural verification

| Check | Result |
| --- | --- |
| Functional Specification tab coverage | PASS — 9/9 EN and 9/9 VI. |
| Technical Specification tab coverage | PASS — 12/12 EN and 12/12 VI. |
| Source file/symbol validation | PASS — no missing referenced source path or symbol. |
| Functional/Technical Message ID parity | PASS. |
| Raw pipe-separated records | PASS — none accepted by the quality contract. |
| Multi-function/multi-requirement data rows | PASS — rejected by validator. |
| Runtime files changed | PASS — none. |
| OfficeCLI 1.0.141 | PASS — 4/4 workbooks, zero schema errors. |
| Specification validator | PASS — Functional 9/9, Technical 12/12; official template contracts preserved. |
| Quality/source/message/parity contract | PASS. |
| Secret scan | PASS — no credential-like pattern. |
| Agent rules | PASS — 8 required rules. |
| QA Depth self-test | PASS — 15/15. |
| Ownership Gate runner | PASS — 5/5. |
| AI DevKit | PASS — 5 OK, 0 warning/failure. |
| Ponytail simplicity review | `Lean already. Ship.` No new dependency, duplicate generator, or speculative abstraction. |

## Visual verification

| Artifact | Rendered pages | Result |
| --- | ---: | --- |
| Functional Specification EN v0.7 | 12 | PASS |
| Functional Specification VI v0.7 | 12 | PASS |
| Technical Specification EN v0.6 | 13 | PASS |
| Technical Specification VI v0.6 | 13 | PASS |

No abnormal blank page, `###`, vertical text, obvious clipping, or raw prose dump was observed in the reviewed render. Detailed rows wrap inside the printable area without reducing the template font.

## Issues observed during execution

| Classification | Symptom | Resolution/status |
| --- | --- | --- |
| Tooling issue | A combined PowerShell search returned exit code 1 when the first `rg` query had no match. | Reran focused commands; no artifact impact. |
| Tooling issue | Direct generator import initially failed because the script directory was absent from `sys.path`. | Added the script directory only to the invocation environment and reran successfully. |
| Tooling issue | Windows CP1252 could not print one Vietnamese diagnostic line. | Reran diagnostics with UTF-8 mode; workbook content was unaffected. |
| Tooling issue | Combined validators exceeded the 120-second command timeout. | Split validators and used bounded longer timeouts; deterministic results obtained. |
| Documentation tooling issue | Openpyxl-reserialized XLSX packages failed strict OfficeCLI XML ordering checks. | Applied the established LibreOffice round-trip plus repository OpenXML normalizer; final OfficeCLI rerun is the release gate. |
| Tooling limitation | LibreOffice printed `Could not find platform independent libraries <prefix>`. | Conversion completed successfully; all 50 pages were generated and reviewed. |
| Documentation issue | Stale print areas created 28/59-page outputs with large blank regions. | Generator now bounds print areas; final output is 12/13 pages. |
| Tooling issue | Recursive removal of local `tmp/` evidence was blocked by command policy. | No workaround attempted; `tmp/` is explicitly excluded from staging and commit. |
| Tooling issue | Atlassian Rovo returned `Internal error` for both the IDTS-103 comment and accessible-resource lookup. | Jira content was not changed. PR/evidence links remain available in the repository; Jira synchronization is pending connector recovery. |

## Pending gates

- Final `git diff --check` and PR QA Depth check.
- DonHV local workbook review.
- Same-ID Google Drive update and readback after approval.
- Jira evidence comment after Atlassian Rovo connector recovery.
