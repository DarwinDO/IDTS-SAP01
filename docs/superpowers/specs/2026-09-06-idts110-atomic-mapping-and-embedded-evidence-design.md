# IDTS-110 Atomic Mapping and Embedded Evidence Design

## Goal

Complete the 135 approved local mapping-only cases as independently asserted
atomic executions and replace the workbook's broken external card links with
one complete, embedded evidence image per mentor-visible case.

## Authority

- DonHV has already approved executing all 135 mapping-only cases. Do not ask
  for that approval again.
- Mentor-visible case labels are `Case 1` through `Case 278`. Internal IDs such
  as `UT-AUTH-001` remain repository-only trace keys.
- The visual reference is
  `C:/Users/LapHub/.codex/visualizations/2026/08/09/019fe726-8bd1-7500-9fa6-3169c22f7b72/complete-test-evidence.png`.
- The supplied NhanT workbook is a visual reference for embedded drawings, not
  a source of execution truth.

## Current defect

The v0.5 candidate contains zero embedded media files and 278 external links
to repository-relative PNG paths. Google Sheets converts those paths into
invalid web URLs. The historical set also retains 135 local cases as
`MAPPING_ONLY_CANDIDATE`, although DonHV authorized case-level execution.

## Execution scope

Execute the 135 local cases exactly once as case-specific assertions:

| Domain | Cases |
| --- | ---: |
| Authentication | 4 |
| Bug and validation | 15 |
| Assignment | 11 |
| Lifecycle | 45 |
| Comment | 5 |
| Attachment | 2 |
| History | 7 |
| Notification | 9 |
| Monitoring | 7 |
| AI | 22 |
| Security | 8 |
| Total | 135 |

The set contains 121 CAP component cases and 14 OData contract cases. These
cases require no BTP mutation. Reuse existing deterministic fixtures and test
helpers. A suite exit code is not case evidence: every result must bind a case
number, one selector, expected assertions, observed assertions, source
baseline, test file/line, execution command, and fresh execution window.

Mutation cases additionally require before, after, and reload/readback state.
Negative cases must prove both rejection and absence of partial mutation. A
real failure remains `Failed`; the pipeline must never force a green result.

## Evidence image contract

Each of the 278 mentor-visible cases has exactly one complete evidence image.
The image follows the approved light card layout and contains:

- `Case N`, result, evidence kind, executor, and review state;
- precondition, action, expected result, and observed assertions;
- before/after/reload state when applicable;
- exact test file and line range, execution command, source assertions,
  source baseline, execution window, structured-result reference, and a clear
  limitation.

UI cases include the real runtime screenshot inside the complete evidence
card. BTP-blocked cases receive an honest blocked card with the missing
precondition; no acceptance evidence is fabricated. Cards contain no secret,
PII, private endpoint, raw credential, or mentor-visible internal case ID.

## Workbook contract

Generate `Unit_Test_IDTS_SAP01_en_v0.6_candidate.xlsx` from the official
template. Preserve `Cover`, `Histories`, `UT`, and `Evidence` in that order.

- `UT` retains the 278 numbered rows and truthful result labels.
- `Evidence` presents a simple case-number column and one embedded PNG drawing
  per case, matching the supplied NhanT layout direction.
- Remove external repository-relative evidence hyperlinks. Internal UT to
  Evidence navigation may remain because it is workbook-local.
- Do not expose the previous A:K audit table to the mentor. Machine-readable
  provenance remains in JSON manifests, receipts, and repository evidence.
- Image relationship, anchor, hash, and case-number validators must reject
  missing, duplicate, orphaned, swapped, or external-only evidence.
- The workbook must survive XLSX reopen, LibreOffice PDF rendering, and a
  Google Sheets candidate import without losing images.

## Expected truthful totals

After execution, `Mapping Only` must be zero. If all 135 executions pass, the
candidate totals become 265 Candidate PASS and 13 Blocked. Any observed test
failure replaces the corresponding Candidate PASS; totals derive from results
and are never hard-coded.

## Boundaries

- No product source, dependency, lockfile, BTP/HANA data, provider, email,
  Jira, or Google Drive mutation is part of local implementation.
- Do not overwrite the v0.5 candidate or the supplied NhanT workbook.
- Google Drive import is a later approval-gated acceptance step.
- The 13 BTP cases remain blocked until a target, fixtures, rollback, and
  sanitized readback are separately authorized.

## Acceptance

Local acceptance requires 135 non-mapping atomic results, 278 complete cards,
278 embedded workbook images, zero relative card hyperlinks, exact case/image
bijection, no introduced OfficeCLI/fidelity issue, representative visual
review, clean independent review, and a receipt-bound candidate report.
