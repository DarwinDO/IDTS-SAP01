# SAP490 Mentor Pack - Full Office and Diagram Audit

Audit date: 2026-07-22
Owner: DonHV
Scope: every Office or Google-native Office artifact in `00_MENTOR_REVIEW_CURRENT`, plus all 21 canonical diagram sources and their current Drive representations.
Verdict: **NOT READY for mentor review**

## Executive findings

The previous `CONDITIONALLY READY` verdict is withdrawn. The Drive organization and ID preservation are correct, and the regenerated BRD/SRS/FRS core content is substantial, but the current mentor pack still contains blocking document-quality and diagram-consistency defects:

1. **10 of 31 Office artifacts fail OfficeCLI schema validation.**
2. The Blueprint EN/VI files are not IDTS-ready: they retain blank document metadata, FPT/sample-author content, an unevaluated/blank TOC, and the unrelated sample process `SD-MD-01: Customer Master Data Creation/Change`.
3. The current Google Slides Diagram Pack still embeds the six **old** images for diagrams 01, 02, 09, 10, 11, and 13. The six standalone SVG files on Drive are current, but the deck is not.
4. Diagrams 07, 08, 16, 18, and 19 contradict the implemented `Need More Information` recovery flow. Diagram 12 suggests automatic escalation behavior that was not found in the current runtime. Diagram 04 is incomplete/ambiguous around closing after retest.
5. Several spreadsheets are materially unreadable at normal review scale because of narrow columns, fixed row heights, or overflow. The strongest examples are Functional Test EN/VI, Team Contribution Matrix, Mentor Index, Unit Test EN/VI, and Test Report EN/VI.
6. BRD/SRS/FRS are not actually content-short. Their perceived shortness comes from table-heavy presentation, dense diagrams, and in the FRS, repeated near-empty heading pages before the diagram pages. Blueprint, Configuration Note, Change Tracker, Test Scenario, Unit Test, and parts of Test & Fix Bug are genuinely thin or incomplete.

No `app/`, `srv/`, or `db/` file was changed by this audit. No Drive artifact was edited, moved, deleted, copied, or replaced.

## OfficeCLI gate and method

OfficeCLI was invoked before the artifact audit.

- Preflight: `officecli --version`
- Result: `1.0.140`
- Per-artifact structural gate: `officecli validate "<artifact>"`
- Per-artifact issue scan: `officecli view "<artifact>" issues`
- Per-artifact statistics: `officecli view "<artifact>" stats`
- Visual sampling/full-document review: `officecli view "<artifact>" screenshot ...`

Format/tool limitations:

- Very wide XLSX screenshot ranges can exceed OfficeCLI's 4,000-pixel capture ceiling; one large Team Contribution capture did so.
- The local screenshot path reported no usable headless browser for some oversized ranges. Smaller focused ranges were used instead.
- OfficeCLI DOCX word statistics emphasize paragraph text and undercount text stored in tables. A table-inclusive OOXML count was therefore used only as a supplemental content-depth check.
- Google Docs/Sheets/Slides were exported from their current Drive IDs to DOCX/XLSX/PPTX for exact-current inspection. OfficeCLI does not rename or edit Google Drive metadata.

## Audited inventory

| Type | Count |
| --- | ---: |
| DOCX | 8 |
| XLSX, including current Google Sheets exports | 22 |
| PPTX, exported from the current Google Slides Diagram Pack | 1 |
| **Total Office artifacts** | **31** |
| Canonical diagram sources | 21 |

## OfficeCLI schema result

Overall: **21/31 PASS; 10/31 FAIL**.

| Failing artifact | OfficeCLI validation errors | Main schema problem |
| --- | ---: | --- |
| Blueprint VI | 203 | Invalid numeric widths, table-row properties, header/style structures |
| Change Tracker EN | 6 | Invalid style/font child ordering and attributes |
| Configuration Note EN | 33 | Drawing namespace and style structures |
| Configuration Note VI | 33 | Drawing namespace and style structures |
| SAP490 Review Matrices | 1 | Worksheet column width `722.13` exceeds the valid limit |
| Test & Fix Bug EN | 8 | Invalid style/font child ordering |
| Test & Fix Bug VI | 8 | Invalid style/font child ordering |
| Test Scenario EN | 20 | Template-derived schema problems |
| Test Scenario VI | 20 | Template-derived schema problems |
| UAT Prepared VI | 20 | Template-derived schema problems |

`Technical Specification EN` initially appeared corrupted because a temporary HTTP download was incomplete. It was downloaded again from the same Drive ID and then passed OfficeCLI validation; that temporary transfer problem is not an artifact defect.

## Layout and visual findings

### Blocking or high-impact

| Artifact | Finding |
| --- | --- |
| Blueprint EN/VI | Blank document-information fields; FPT Software header; sample authors such as `Van Bao Chau`/`AAAA`; blank/manual TOC; unrelated SD customer-master process; large unused whitespace. This is sample/template content, not a valid current IDTS Blueprint. |
| Diagram Pack | 48 OfficeCLI overflow findings. Multiple diagrams are too small/dense to read in the deck. The six remediated diagrams in the deck are stale images. |
| Functional Test EN/VI | 8 overflow findings each. The visual cover shows critical values wrapping one character per line, including module/function identifiers and the system name. |
| Team Contribution Matrix | 1,450 overflow findings. Numerous contribution rows are fixed at 12 pt although the content requires roughly 26-172 pt. The summary screenshot is effectively only a title line. |
| Mentor Index | 32 overflow findings, concentrated in `Mentor Index!F6:F37`; row heights of 40 pt need roughly 53-79 pt. It also labels the Diagram Pack as current even though the embedded images are stale. |
| Unit Test EN/VI | 11/10 overflow findings. The VI evidence cell requires about 304 pt while only about 9 pt is usable. |
| Test Report EN/VI | 4/10 overflow findings in result/evidence cells. Statistics are now internally consistent, but evidence presentation remains clipped/dense. |

### Content-depth result

The core BA documents are substantial when table content is counted:

| Document | EN words | VI words | Pages |
| --- | ---: | ---: | ---: |
| BRD | 4,363 | 4,927 | 15 / 15 |
| SRS | 4,267 | 4,500 | 16 / 16 |
| FRS | 5,284 | 5,425 | 25 / 25 |

The issue is presentation, not missing core volume:

- BRD and SRS use dense requirement tables and figures.
- FRS repeatedly places a diagram heading on a near-empty page and the diagram on the following page. This makes the document look padded and fragmented even though its functional content is substantial.
- All six core documents still expose Pending/TBD approval and sign-off dates. These are legitimate pending approvals but must remain clearly disclosed.

Supporting artifacts that are genuinely thin or incomplete:

| Artifact | Evidence |
| --- | --- |
| Blueprint EN/VI | About 911/1,024 table-inclusive words, much of it template/sample material rather than IDTS content |
| Change Tracker EN | 44 populated cells and about 107 words; only three change rows |
| Configuration Note EN/VI | 88 populated cells and about 228/236 words; four checklist rows; extra near-empty sheets/large formatted ranges |
| Test Scenario EN/VI | 162 populated cells and about 429/453 words |
| Unit Test EN/VI | 109 populated cells and about 474/508 words |
| Test & Fix Bug EN/VI | `Issue 2` and `Issue 4` sheets are empty; content is concentrated in one defect list |

Configuration Note also describes `SQLite local development with portable deployment direction`, which is no longer sufficient as the current project summary because the implemented/shared-QA baseline includes Render/PostgreSQL and S3-backed attachments.

## Diagram audit

### Source and Drive integrity

- Normalized-LF manifest verification: **21/21 PASS**.
- Exact Drive-versus-repository SHA-256 comparison for standalone SVG diagrams 01, 02, 09, 10, 11, and 13: **6/6 exact matches**.
- The current Diagram Pack's embedded images for those same six diagrams have zero pixel difference from the old Git `HEAD` PNGs and material pixel difference from the new PNGs. Therefore the deck was not regenerated after the standalone diagrams were updated.

### Incorrect or stale diagram semantics

| Diagram | Severity | Finding |
| --- | --- | --- |
| 08 Status Lifecycle | P1 | Shows `Need More Information -> In Review`. Runtime only allows recovery to `Assigned` through `resubmitToDeveloper`, or to `Pending Assignment` through the separate pending path. It also uses `reporter` instead of the active MVP role `Tester` and omits multiple allowed transitions while presenting itself as the lifecycle. |
| 16 FRS Status Lifecycle | P1 | Repeats the invalid `Need More Information -> In Review` transition and omits valid recovery/processing transitions. |
| 07 Developer Review | P1 | Tester adds information directly back to review, bypassing `resubmitToDeveloper` and the required `Assigned` state. |
| 18 FRS Developer Review | P1 | Same direct return-to-review error as diagram 07. |
| 19 FRS Request More Information | P1 | Says the bug returns to `Assigned or In Review`; current `resubmitToDeveloper` returns it only to `Assigned` when an assignee exists. Moving to Pending is a separate path. |
| 12 PM Monitoring | P1/P2 | Says `System or PM triggers escalation notification`. The audit found monitoring/overdue views and an `OVERDUE` event type, but no current automatic escalation-generation runtime. The diagram must either show a PM manual action or label automation as future/not implemented. |
| 04 End-to-End Defect Flow | P2 | Retest success/no-retest acceptance ends at history logging without explicitly showing the `Closed` transition. The issue-exists path also jumps directly to reassignment, so the lifecycle is incomplete/ambiguous. |

### Readability risks

| Diagram | Observation |
| --- | --- |
| 03 Use Case | Extremely tall (`540 x 2456`); unreadable when embedded on a landscape slide/page |
| 04 End-to-End Flow | Very large and dense (`2842 x 3516`, about 86 rendered nodes) |
| 06 Assignment Decision | Extremely tall (`732 x 2286`) |
| 09 Conceptual Data Model | Very dense (`3173 x 3028`, hundreds of rendered text/foreign-object nodes) |
| 08, 10, 11, 14, 17, 20 | Semantically usable only after zooming; should be split or selectively simplified for the presentation deck |

Diagrams 01, 02, 05, 09, 10, 11, 13, 14, 17, 20, and 21 are broadly aligned at source level, subject to the deck staleness and readability findings above. Diagram 09 correctly includes current concepts such as `AuthSessions`, `NotificationDeliveries`, `AiSuggestions`, and attachments, but is too dense for a single review slide.

## Required remediation before mentor review

### P1 - mandatory

1. Remove Blueprint EN/VI from `MENTOR_REVIEW_CURRENT` until they are rebuilt as real IDTS documents, or regenerate them completely from valid IDTS content and verify both language copies.
2. Correct diagram semantics in 07, 08, 12, 16, 18, and 19; clarify diagram 04.
3. Regenerate the Google Slides Diagram Pack from all final diagram assets. Verify that diagrams 01, 02, 09, 10, 11, and 13 no longer match the old embedded PNGs.
4. Repair and revalidate all 10 schema-failing Office artifacts.
5. Repair the visibly broken Functional Test cover/layout and the severe Team Contribution/Mentor Index/Unit Test/Test Report overflow findings.
6. Update Mentor Index claims and verification cells to reflect the real audit result. Do not claim `CONDITIONALLY READY` or a current Diagram Pack until the blockers above are closed.

### P2 - required quality follow-up

1. Repaginate FRS so diagram headings and figures stay together where possible.
2. Expand Configuration Note to the current Render/PostgreSQL, S3 attachment, AuthService, email-outbox, and AI-disabled-by-default baseline.
3. Complete or explicitly classify the empty/near-empty sheets in Configuration Note and Test & Fix Bug.
4. Improve Test Scenario and Unit Test depth, including positive, negative, boundary, authorization, persistence/reload, and UI/UX evidence where applicable.
5. Split the tallest/densest diagrams for deck readability without changing their canonical meaning.

### Known limitations that remain separate

- Three test suites remain Pending.
- UAT is Prepared only; no UAT execution or mentor sign-off exists.
- Final Project Report remains a template.
- Knowledge Gate remains `IN PROGRESS - handled in dedicated learning thread`; this audit does not evaluate or transition it.

## Tool and source traceability

- Skills: `karpathy-guidelines`, `ponytail`, `idts-ba-docx-deliverables`, `BRD Creation`, `srs-documentation`, `FRS Creation`, `documents`, `verify`, `sap-cap`, `sap-fiori`, and `sap-fiori-guidelines`.
- Office tool: OfficeCLI 1.0.140 for structural, issue, statistics, and visual checks.
- CAP MCP: used read-only to confirm the current service/model baseline, including `AuthService`, `AuthSessions`, `NotificationDeliveries`, `AiSuggestions`, and attachment relationships.
- Fiori MCP: used read-only to confirm the current Fiori app discovery baseline. It returned duplicated app entries, treated as a tooling limitation rather than a product/document defect.
- Runtime truth: `srv/bug-service/constants.js`, the current CAP service/model, and the current Fiori app metadata were used to judge diagram lifecycle/architecture accuracy.
