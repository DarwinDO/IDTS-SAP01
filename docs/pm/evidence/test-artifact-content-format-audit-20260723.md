# SAP490 Test Artifact Content and Format Audit — 2026-07-23

## Executive verdict

**NOT READY — test-documentation subset.**

The twelve current EN/VI test workbooks are valid OpenXML packages, but the package is not yet suitable for mentor review as a complete test specification and evidence set. OfficeCLI reports no structural issue, while direct cell inspection and Google Sheets screenshots confirm material semantic and presentation defects.

This audit is reporting-only. No workbook, Google Drive artifact, application runtime file, test result, or Jira issue was changed.

## Scope

Current EN/VI versions reviewed:

- Test Scenario v0.3
- Unit Test v0.3
- Functional Test v0.2
- Test Report v0.3
- UAT Prepared v0.2
- Test And Fix Bug v0.5

The five supplied Google Sheets screenshots were compared with the local source workbooks under `docs/sap490/generated/`.

## Verification method

- `officecli --version` → `1.0.140`
- `officecli validate <workbook>` → 12/12 passed
- `officecli view <workbook> issues` → 12/12 returned zero issues
- Direct OpenXML/cell, merge, row-height, formula, and cached-value inspection
- Read-only inspection of the workbook generators and formatting-repair script
- Visual comparison with the five supplied Google Sheets screenshots

### OfficeCLI limitation

OfficeCLI's successful schema and issue checks mean that the `.xlsx` packages are structurally valid. They do **not** prove that:

- required test fields contain meaningful values;
- an expected result is stored in the correct column;
- a broad npm suite is a complete test case;
- requirement-to-test traceability exists;
- a workbook remains readable after Google Sheets import;
- coverage terminology is semantically correct.

## Confirmed findings

| Priority | Artifact | Confirmed finding | Evidence and impact |
| --- | --- | --- | --- |
| P1 | Test Scenario EN/VI v0.3 | All six `Predicted Test Results` cells are blank. | `Test Cases!AP8:AP13` is empty in both languages. The generator concatenates setup text and the expected outcome into `Test Data!Y8:Y13`, leaving the dedicated result column unused. The supplied screenshot shows the same defect. |
| P1 | Test Scenario EN/VI v0.3 | The six rows are feature/suite themes, not reproducible test cases. | There are no numbered actions, input variants, explicit preconditions, requirement IDs, role-specific execution instructions, or postconditions. A reviewer cannot reproduce a result from the workbook alone. |
| P1 | Unit Test EN/VI v0.3 | The workbook is a regression-suite register, not a complete unit-test specification. | It collapses three npm suites into three rows and marks three other suites Pending. It has no unit under test, isolated dependency/mock setup, inputs, assertion list, actual output, or individual unit-case IDs. The `Evidence` sheet contains only one compile note; the note itself correctly says compile is not a test suite. |
| P1 | Functional Test EN/VI v0.2 | Functional cases are not executable end-to-end cases. | The same six broad RV rows are reused. They have an outcome statement, but no preconditions, numbered user/API steps, exact input data, actual result, defect link, or observable checkpoint. The result sheet is primarily an npm-command execution register. |
| P1 | Cross-document coverage | The reported `50%` is suite execution ratio, not requirements, scenario, branch, or code coverage. | Test Report formulas correctly calculate 3 Passed, 0 Failed, 3 Pending, 6 total, and 50%. However, RV-01 represents 28 auth assertions and RV-03 represents 20 PM assertions, while each is counted as one case. The label `Test coverage` therefore overstates what has been measured unless renamed and supplemented by traceability. |
| P1 | Traceability | No test workbook maps RV/UAT cases to BRD, SRS, FRS, business-rule, user-story, acceptance-criterion, or Jira identifiers. | Searching the twelve current workbooks found no usable requirement/trace mapping. It is impossible to demonstrate which requirements are covered, missing, or affected by a defect. |
| P2 | UAT Prepared EN/VI v0.2 | Six planned scenarios and predicted outcomes exist, but the plan is too high-level to execute consistently. | UAT-01–UAT-06 are present and their predicted outcomes are populated. Missing items include persona/role per case, detailed preconditions, numbered steps, concrete data, acceptance thresholds, and pass/fail decision rules. Actual result, defect, acceptance decision, and sign-off are correctly still pending; that pending status is not itself a defect. |
| P2 | UAT Prepared format | Cover and case content wrap vertically or occupy very large rows in Google Sheets. | The supplied screenshot shows `IDTS`, module name, function ID, and Vietnamese labels split character-by-character. The source has explicit Cover row heights of approximately 280, 115, and 210 points and legacy grouped column widths. This is a cross-renderer layout defect. |
| P2 | Functional Test format | Evidence rows are visually detached from the table header and separated by excessive blank space. | The screenshot shows a large blank block followed by sparse evidence lines. Extensive merged ranges, high row heights, and far-apart column groups make the sheet difficult to review or print. |
| P2 | Unit Test format | The `Evidence` sheet looks empty and unstructured. | Only one long paragraph exists in `B3`; there is no evidence table or per-case linkage. The screenshot accurately reflects the workbook rather than a loading problem. |
| P2 | UAT Test Result format | The result sheet appears as a large empty merged block with a note below it. | This is consistent with a prepared/not-executed UAT, but the layout does not provide clearly visible rows for each planned UAT case, actual result, defect ID, decision, tester, date, and sign-off. It is confusing even when intentionally pending. |
| P2 | Test Report EN/VI v0.3 | Procedures are generic and not self-contained. | Every detailed row says `Run the exact npm command in Note.` The report does not expose case-level actual results/assertions, failed checks, logs, or evidence links. It records suite status accurately but is insufficient as a standalone test report. |
| P2 | Test Report VI v0.3 | The Vietnamese workbook is only partially localized. | Most headers, notes, preconditions, procedure text, status vocabulary, and environment descriptions remain in English. This creates review ambiguity in the VI deliverable. |
| P2 | Test And Fix Bug EN/VI v0.5 | The defect register is not sufficient for reproduction and retest. | Twelve confirmed defects are listed with summary, detail, expected result, fix, and a generic evidence reference. Missing fields include steps to reproduce, actual result, environment/build, severity, priority, discovery date, owner, status, affected requirement/test case, retest date/result, and direct evidence/Jira link. |
| P2 | Test And Fix Bug EN/VI v0.5 | Template remnants reduce clarity. | Row 7 contains a stray duplicated sequence value `5` before the real fifth defect on row 8. `Issue 2` and `Issue 4` are retained as one-cell “unused/N/A” sheets rather than being removed or clearly archived. |
| P2 | All template-derived workbooks | Empty formatted regions extend to roughly row 1,000 and many sheets extend across dozens of columns. | This causes excessive scrolling, large blank areas, and poor print/review ergonomics. It also makes sparse sheets look unfinished despite structural validation passing. |

## Questions a mentor cannot answer from the current package

1. Which BRD/SRS/FRS requirement is verified by each RV and UAT case?
2. What exact steps and data must another tester use to reproduce each result?
3. What individual assertions passed inside the 28-test auth suite and the 20-test PM suite?
4. Which negative, boundary, authorization, persistence/reload, and UI/UX cases are covered or still missing?
5. Does `50%` mean executed suites, executed cases, requirements covered, branches covered, or code covered?
6. What actual output was observed, beyond an npm exit code and aggregate PASS count?
7. Which defect was discovered by which case, and which case proved the fix?
8. What are the objective acceptance criteria and sign-off rules for each UAT case?

## Required remediation before mentor review

1. Rebuild Test Scenario EN/VI so every case has separate preconditions/test data, numbered actions, predicted result, requirement reference, role, and postcondition.
2. Reframe Unit Test as actual unit-level cases or rename it transparently as a programmatic regression-suite register and provide separate case-level evidence.
3. Rebuild Functional Test into reproducible business-flow cases with expected and actual checkpoints.
4. Add a requirement-to-test-to-defect traceability matrix.
5. Rename the current `50%` metric to `suite execution ratio` unless genuine coverage calculation is added.
6. Expand UAT Prepared into an executable script while preserving Pending for actual result and sign-off.
7. Add reproduction, ownership, status, retest, and traceability fields to Test And Fix Bug.
8. Repair merged ranges, widths, row heights, print areas, and unused formatted regions; verify both native Office rendering and Google Sheets rendering.
9. Fully localize the VI workbooks or explicitly label intentionally retained English technical terms.

## Generator-level root causes

- `scripts/sap490/generate-review-test-pack.py` writes Test Scenario setup and expected outcome together into column `Y` and never writes the dedicated `AP` predicted-result cells.
- The same generator intentionally uses one broad RV row per npm suite/theme and generic `Run the exact npm command in Note.` procedures.
- `scripts/sap490/repair-current-review-xlsx.py` enables wrapping broadly and derives large row heights; it also hard-codes extreme UAT Cover heights to compensate for legacy grouped widths. This makes the OpenXML package valid but does not produce a stable Google Sheets layout.

## Conclusion

The arithmetic truth of the current execution summary is preserved: **3 Passed, 0 Failed, 3 Pending, 6 suite rows, 50% suite execution/success ratio**. The problem is not fabricated pass status; it is that the underlying test specifications, traceability, evidence granularity, terminology, localization, and cross-renderer formatting are not yet mentor-ready.
