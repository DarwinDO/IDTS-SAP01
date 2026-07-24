# SAP490 Test Pack — Official Template Restoration Evidence

Date: 2026-07-23
Owner: DonHV
Branch: `docs/mentor-readiness-20260725-donhv`
Verdict: `CONDITIONALLY READY — UAT execution and mentor sign-off pending`
Knowledge Gate: `IN PROGRESS — handled in dedicated learning thread`

## Scope and safety

- Restored the 12 current EN/VI test workbooks to the official SAP490 workbook structures.
- Did not change Workshop EN/VI, Blueprint EN/VI, `app/`, `srv/`, or `db/`.
- Did not delete, copy, rename, or move any current Drive workbook. Every upload used `files.update` against the existing ID.
- Did not stage, commit, push, merge, transition Jira learning/behavior work, or claim UAT/sign-off.
- Preserved the complete pre-restoration working tree at:
  `E:\IDTS-SAP01-backups\sap490-normalized-before-template-restore-20260723-152757`.
- Backup verification: 128/128 modified/untracked files copied, 0 missing, 0 SHA-256 mismatch; manifest SHA-256
  `381E4379B458C4558B1711BA68E2DCA390927740E8BC647E997FA80AA8F220F2`.

## Root cause and corrective design

The previous generator copied each official workbook but then removed most worksheets, merges, styles, dimensions, and defined structure before constructing replacement normalized tables. Content checks passed, but the output was not the official SAP490 template.

The corrective implementation:

- uses `docs/qa/test-catalog.json` as the canonical data source;
- fills the official template sheets in place;
- preserves sheet names/order, merges, template images, and template-specific structure;
- uses LibreOffice only for formula recalculation/cross-rendering;
- removes broken `#REF!` defined names and conflicting print-scale attributes with a narrow OpenXML normalizer;
- adds a template-fidelity regression test;
- validates official-template cell regions rather than the discarded normalized layout.

Google Sheets visual review found one additional renderer-specific defect: `44.44% %` and `100.00% %` in Test Report. The official template contained literal `%` cells F16/F17 while E16/E17 already used percentage number formatting. The generator now clears F16/F17, and the validator fails if either cell becomes nonblank.

## Changed source and generated artifacts

Source/gates:

- `scripts/sap490/generate-review-test-pack.py`
- `scripts/sap490/normalize-current-xlsx-openxml.py`
- `scripts/sap490/test_template_fidelity.py`
- `scripts/sap490/validate-test-pack.py`
- `docs/qa/test-catalog.json`

Current outputs:

- Test Scenario EN/VI v0.3
- Unit Test EN/VI v0.3
- Functional Test EN/VI v0.2
- Test Report EN/VI v0.3
- UAT Prepared EN/VI v0.2
- Test And Fix Bug EN/VI v0.5

## Test truth and traceability

| Metric | Result | Formula / scope |
| --- | ---: | --- |
| Planned cases | 27 | canonical catalog cases |
| Executed cases | 12 | Passed + Failed |
| Passed | 12 | fresh result plus executor/date/evidence metadata |
| Failed | 0 | executed failed outcomes |
| Blocked | 0 | blocked outcomes |
| Not Run | 9 | functional/UI/live-provider cases |
| Prepared | 6 | UAT templates, not execution |
| Case execution rate | 44.44% | 12 / 27 |
| Pass rate over executed cases | 100.00% | 12 / 12 |
| Planned requirement traceability | 100.00% | 32 / 32 requirements linked to at least one planned case |
| Executed requirement coverage | 53.12% | 17 / 32 requirements linked to at least one Passed case |
| Suite execution rate | 100.00% | 6 / 6 exact npm suites |
| Automated checks | 160 | 28 + 58 + 20 + 18 + 2 + 34 |
| Real defects | 12 | no synthetic defect added |

Case types:

| Canonical type | Count |
| --- | ---: |
| UNIT | 5 |
| PROGRAMMATIC_REGRESSION | 1 |
| FUNCTIONAL_API | 5 |
| FUNCTIONAL_UI_API | 8 |
| FUNCTIONAL_HTTP_UI | 1 |
| FUNCTIONAL_INTEGRATION | 1 |
| UAT | 6 |

Fresh execution commands represented in the catalog:

- `npm run qa:auth:programmatic` — 28 passed, 0 failed, 0 skipped.
- `npm run qa:email-outbox:programmatic` — 58 passed, 0 failed, 0 skipped.
- `npm run qa:pm-monitoring:programmatic` — 20 passed, 0 failed, 0 skipped.
- `npm run qa:idts41:programmatic` — 18 passed, 0 failed, 0 skipped.
- `npm run qa:comments-attachments:programmatic` — 2 passed, 0 failed, 0 skipped.
- `npm run qa:idts64:programmatic` — 34 passed, 0 failed, 0 skipped.

## Verification results

| Gate | Result |
| --- | --- |
| OfficeCLI preflight | `officecli 1.0.140` |
| Template fidelity | PASS, 12/12; official sheets/merges/images retained; no conflicting print scale |
| Content validator | PASS, 12 workbooks, 0 warnings, 0 errors |
| EN/VI parity | PASS |
| Formula/statistics reconciliation | PASS |
| OfficeCLI schema | PASS, 12/12 |
| OfficeCLI issue scan | PASS, 0 issues in every workbook |
| LibreOffice visual review | PASS across all populated sheets/pages |
| Google Sheets critical-view review | PASS, 12/12 |
| Test Report percent display | PASS EN/VI: `44.44%` and `100.00%`, no duplicate symbol |
| UAT truth | PASS: six Prepared cases; actual/defect/decision/tester/date/sign-off blank |
| Drive metadata readback | PASS, 12/12 IDs/names/MIME/parents preserved and sizes match local |

LibreOffice 26.2.3.2 returned exit 0 and produced all required files, but printed the known environment warning `Could not find platform independent libraries <prefix>`. It was not treated as quality evidence; all independent gates above were still required.

## Drive same-ID readback

| Deliverable | Language | Drive ID | Final bytes |
| --- | --- | --- | ---: |
| Test Scenario | EN | `1z_P8xYfiEf4-B5wv2h8Vipj_tdcVKBSx` | 43,461 |
| Test Scenario | VI | `1vxufjbEuFbrn2AJ0E0uwLXDytmGGZ8io` | 43,788 |
| Unit Test | EN | `1wyno-7uTUudV_T_cB2VWSSP6a8yWsA0T` | 32,784 |
| Unit Test | VI | `1hqAdhMYZHo2Ah4J_OYNfmVV7ZhG2_KF6` | 33,053 |
| Functional Test | EN | `10euD4971cy857onC-wd5wDE-paAVPPne` | 62,475 |
| Functional Test | VI | `1dnVVOtHv8mVwxYNM3_AKPeEdDy3xwwJF` | 62,701 |
| Test Report | EN | `12ysnM_7KekEbwM5mCmgeacwCUEqIrOb_` | 50,001 |
| Test Report | VI | `14QABwYHkir1cHuYpYqJyeKRquAzVH7aS` | 50,372 |
| UAT Prepared | EN | `1p4l2i3DAn6ingrRdSJ2pmw4Kan6X2hWR` | 42,651 |
| UAT Prepared | VI | `1Yy21d944EDhvc0m8UfDRYVJUzDWaptZQ` | 42,921 |
| Test And Fix Bug | EN | `1fIs5OVOgXw1VoWDSzbcTMJiASr3cYZy5` | 14,149 |
| Test And Fix Bug | VI | `1r1-Zeif2Vq9RMQ8fDQ8BtOMz_QPBiG6G` | 14,346 |

Mentor Index readback already contained the correct verdict, Knowledge Gate state, links, metrics, verification, and limitations. It was intentionally not rewritten merely to create a new revision.

## Remaining limitations

- Nine functional/UI/live-provider cases are Not Run.
- Six UAT cases are Prepared only; no execution or sign-off exists.
- Live email/OpenAI providers, attachment HTTP, and complete Fiori UI acceptance are not fully executed in this pack.
- Final Project Report remains a template.
- The documentation verdict does not authorize runtime merge, Jira learning/behavior transition, or Knowledge Gate PASS/FAIL.

## Skills and tools

- `karpathy-guidelines`: scoped, evidence-based, surgical remediation.
- `ponytail`: smallest maintainable generator/validator change; no new framework/dependency.
- `spreadsheets`: template-preserving XLSX workflow and visual/formula checks.
- `officecli`: preflight, schema validation, issue inspection, and close lifecycle.
- `systematic-debugging` and `test-driven-development`: reproduced the template/percent defects and added failing regression gates before the fix.
- `verify`: completion claims are tied to fresh command, renderer, Drive, and browser evidence.
- Google Drive connector: same-ID raw XLSX updates and metadata readback.
- Google Sheets/browser controls: authenticated live renderer inspection.
- No SAP MCP was used because runtime CAP/Fiori/UI5 code was read-only and unchanged.
