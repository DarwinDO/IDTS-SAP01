# SAP490 Mentor Readiness Independent Recheck - 2026-07-23

Closure note (2026-07-23): the findings in this report were subsequently remediated at the existing Drive IDs and verified by the fresh full gate in `mentor-readiness-20260725-final-remediation-verification.md`. This report remains the reopening evidence; its NOT READY verdict is superseded by the later CONDITIONALLY READY documentation-remediation verdict. UAT/sign-off, Final Project Report, approvals, three Pending suites, and Knowledge Gate remain open.

## Verdict

**NOT READY** for mentor review until the two reopened P1 findings below are corrected and synchronized to the existing Drive IDs.

The previous `31/31 PASS` statement is technically correct for OfficeCLI schema and automated issue detection, but it is not sufficient evidence that the artifact content and diagram semantics are correct.

## Independently verified evidence

- OfficeCLI preflight: `officecli --version` -> `1.0.140`.
- Fresh local OfficeCLI gate: 28/28 local current artifacts passed `officecli validate` and returned `Found 0 issue(s)`.
- Three native Google Sheets were exported again from their current Drive IDs and checked with OfficeCLI: 3/3 passed validation and returned zero issues.
- Aggregate OfficeCLI result: **31/31 schema PASS; 31/31 automated issue scans = 0**.
- Blueprint EN/VI: 7 pages each; native Word contact sheets show no clipping, overlap, missing glyphs, or legacy FPT/sample content.
- Blueprint EN: 491 words reported by OfficeCLI; Blueprint VI: 550 words. Both are concise review summaries rather than detailed end-to-end blueprint specifications.
- Diagram manifest: normalized-LF SHA-256, source, SVG, and PNG checks passed **21/21**.
- Local Diagram Pack: 46 slides, 46 pictures, OfficeCLI schema PASS, zero issues, and full contact-sheet review.
- Native Google Slides readback at ID `1xCfco28DbuM-mRN7Y3X8tZsByEjFwpItWPzPDRZ7tPI`: 46 slides, 46 images, 46 title text boxes, zero extra/legacy page elements.
- Drive root readback: only the three expected current/templates/archive folders are present; no root loose file was returned.
- Mentor Index live readback still says `CONDITIONALLY READY` and keeps the exact Knowledge Gate text.
- Runtime boundary: `git diff -- app srv db` and `git status --short -- app srv db` returned no changes.
- `git diff --check` exited 0 with non-blocking LF-to-CRLF warnings.
- `npx ai-devkit@latest lint --json`: 5 ok, 0 miss, 0 warn.
- Fresh regression:
  - `npm run qa:auth:programmatic`: 28 PASS / 0 FAIL.
  - `npm run qa:email-outbox:programmatic`: PASS; local provider disabled and deliveries are `SKIPPED`.
  - `npm run qa:pm-monitoring:programmatic`: 20 PASS / 0 FAIL.

## Reopened P1 findings

### P1-01 - Test Report placeholder remains

Both current Test Report v0.3 workbooks contain:

`Test Statistics!C5 = IDTS-SAP01_Test Report_vx.x`

This contradicts the final report's statement that no placeholder remains. OfficeCLI's standard issue scanner does not classify this text as an issue, so a separate content-token scan is required. Drive metadata for the EN/VI files reports the same byte sizes as the local current candidates (40,389 and 40,540 bytes), so the current Drive copies are consistent with these candidates.

Required correction: replace `vx.x` with the actual document version in EN and VI, regenerate without altering execution totals, rerun OfficeCLI plus token scan, and update both existing Drive IDs in place.

### P1-02 - Diagram 07 contains an unsupported lifecycle branch

`docs/diagrams/rendered/source/07-developer-review.mmd` branches from `Retest result` to `Request more information`.

The current runtime state machine permits:

- `RESOLVED -> RETEST_REQUIRED | CLOSED | REOPENED`
- `RETEST_REQUIRED -> CLOSED | REOPENED`

It does not permit `RESOLVED` or `RETEST_REQUIRED` to transition to `NEED_MORE_INFORMATION`. The UI capability is also derived from the runtime allow-list and assigned-developer rule. Therefore the diagram can mislead reviewers about a supported post-retest action.

Required correction: remove or reframe the unsupported branch, regenerate Diagram 07 SVG/PNG, refresh manifest hash, rebuild the local/native Diagram Pack at the same ID, and rerun semantic plus visual checks.

## P2 depth finding

Blueprint EN/VI are clean and current, but remain compact 7-page summaries. They do not provide the depth normally expected from a full business blueprint: detailed per-process narratives, organizational/RACI view, embedded process diagrams, report/interface catalogue, data ownership/migration detail, and expanded traceability/acceptance mapping are mostly referenced or summarized rather than specified.

This is not a template-placeholder failure, but the description "rebuild hoàn toàn" should not be interpreted as a comprehensive detailed blueprint. Expand it before formal submission if the mentor expects a full blueprint rather than a review brief.

## Tooling observations

- The first aggregate OfficeCLI process hung and was terminated without changing artifacts; bounded per-file batches completed successfully.
- Two ad-hoc PowerShell report pipelines initially had an empty-pipe parser error; corrected reruns completed.
- The first manifest probe used the wrong PNG directory; the corrected `rendered/png` probe passed 21/21.
- OfficeCLI XLSX screenshot cropping could not run because no headless browser was available; exact cell text was verified through OfficeCLI text mode instead.
- Google Drive access visibility is reported as `access_not_verified` by connector metadata; this does not affect content readback but means sharing/access policy was not independently certified.

## Required closure gate

Do not restore `CONDITIONALLY READY` until all of the following are fresh and recorded:

1. Test Report EN/VI token scan has no `vx.x` or other invalid placeholder.
2. Diagram 07 matches the current runtime state machine.
3. Updated local artifacts pass OfficeCLI and visual review.
4. Existing Drive IDs are updated in place and read back.
5. Mentor Index verdict is updated last.

Knowledge Gate remains exactly:

`IN PROGRESS — handled in dedicated learning thread`
