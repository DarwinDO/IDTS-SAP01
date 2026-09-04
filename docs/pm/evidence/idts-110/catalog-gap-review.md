# IDTS-110 Catalog Gap Review

> Candidate approval package only. This document is not an execution report and does not change the official Unit Test catalog.

## Frozen baseline and constraints

- Authoritative source baseline: `origin/dev@9d5aad699662bde65a747de4c0d631678de639e4`.
- The approved catalog remains 188 cases and is unchanged during this analysis.
- The supplied workbook is review input only; it is not the official final workbook.
- Task 2 classifies source rows 189–203. A proposal is not PASS: allowed decisions are KEEP, REWRITE, MERGE, and DROP.
- MERGE rows reuse the named existing atomic boundary and do not add a catalog row.
- Task 3 identifies implemented-but-missing atomic cases. Every one of its 80 candidates starts as NOT_RUN.
- Technical case keys remain internal to repository artifacts. Mentor-facing labels use sequential `Case N` wording only.
- No canonical catalog, workbook, Drive, Jira, BTP, product source, live data, dependency, lockfile, email, or deployment mutation is part of this package.

## Task 2 proposal dispositions

The table preserves all 15 supplied source rows so that dropped and merged input is auditable. Internal keys are shown here for repository traceability; they are omitted from the mentor-facing preview below.

| Source number | Decision | Internal proposal key | Mentor label | Exact overlap | Rationale |
| --- | --- | --- | --- | --- | --- |
| 189 | KEEP | IDTS110-P189 | Case 189 | — | Implemented PM/UserAdmin profile read returns active Developer availability, and no approved case covers this profile-detail contract; retain as a new atomic read case. |
| 190 | KEEP | IDTS110-P190 | Case 190 | — | Active Developer targeting filters user.active=true and returns a safe not-found boundary; assignment denial does not prove profile-read secrecy, so retain a new negative case. |
| 191 | REWRITE | IDTS110-P191 | Case 191 | — | The allowlist is implemented inside request validation, but no standalone role-check API returns a boolean; rewrite this row into one request-boundary matrix covering all allowed roles. |
| 192 | DROP | IDTS110-P192 | Case 192 | — | This is the same unbound role-allowlist branch as proposal 191, not a distinct Developer behavior; drop the duplicate row after the rewritten matrix covers the role set. |
| 193 | DROP | IDTS110-P193 | Case 193 | — | This is the same unbound role-allowlist branch as proposal 191, not a distinct PM behavior; drop the duplicate row after the rewritten matrix covers the role set. |
| 194 | KEEP | IDTS110-P194 | Case 194 | — | Catalog CREATE is implemented for ApplicationComponents behind the active PM/UserAdmin gate, while the approved catalog has no atomic component-create case; keep. |
| 195 | KEEP | IDTS110-P195 | Case 195 | — | Catalog CREATE is implemented for DefectCategories behind the active PM/UserAdmin gate, while the approved catalog has no atomic category-create case; keep. |
| 196 | KEEP | IDTS110-P196 | Case 196 | — | The catalog handler rejects non-PM callers before writes and the QA test exercises a TESTER rejection, but no approved case records this catalog authorization boundary; keep. |
| 197 | REWRITE | IDTS110-P197 | Case 197 | UT-VAL-PAIR-VALID, UT-VAL-PAIR-NOMAP | Source has two related boundaries: catalog parent activity and Bug classification bridge validation. The broad across-entities wording lacks a single assertion, so rewrite into explicit catalog versus classification cases. |
| 198 | MERGE | IDTS110-P198 | Case 198 | UT-VAL-CODE-INACTIVE | The existing atomic case specifically deactivates idts.cap.PriorityValues.code='LOW', submits Bugs.priority_code='LOW', and asserts HTTP 400 with no Bug row; merge is exact. |
| 199 | MERGE | IDTS110-P199 | Case 199 | UT-MON-003 | DeveloperWorkloads already counts non-Closed assigned Bugs per developer, conceptually overlapping the open-count row; current UT-MON-003 evidence is mapping-only, so reuse that mapping without claiming case-level execution. |
| 200 | REWRITE | IDTS110-P200 | Case 200 | UT-MON-001 | Monitoring computes overdue only from stored dueDate and today's UTC date; no configurable SLA threshold calculation is implemented, so rewrite the claim to a due-date boundary. |
| 201 | MERGE | IDTS110-P201 | Case 201 | UT-MON-001, UT-MON-003 | The workload reducer skips CLOSED rows and the approved monitoring rows overlap the behavior, but both manifests are mapping-only; reuse their mapping without claiming case-level execution. |
| 202 | KEEP | IDTS110-P202 | Case 202 | — | DeveloperWorkloads scopes the actor before filters and the QA test proves own-row, profile-filter, search, and paging isolation; this authorization/read-model gap is not in the approved catalog, so keep. |
| 203 | KEEP | IDTS110-P203 | Case 203 | — | The PM-only readBugStatusMetrics function is exposed with a PM requirement, but no approved case checks this function's Developer denial and sanitized no-payload boundary; keep. |

## Disposition and catalog reconciliation

| Measure | Count | Meaning |
| --- | --- | --- |
| KEEP | 7 | New source-backed behavior candidate. |
| REWRITE | 3 | Valid gap, but the supplied wording must be narrowed before execution. |
| MERGE | 3 | Already covered by an existing atomic case; no new row. |
| DROP | 2 | Duplicate, unsupported, or not a separately testable requirement. |
| Retained Task 2 candidates | 10 | KEEP + REWRITE only. |
| Task 3 candidate cases | 80 | All are NOT_RUN and require a later approved execution plan. |
| Current canonical catalog count | 188 | Unchanged in this package. |
| Candidate final catalog count | 278 | 188 + 10 retained Task 2 candidates + 80 Task 3 candidates. |

The candidate final count is 278. It is a proposal for approval, not a catalog update.

## Current-feature coverage

Each family below is backed by the source traces and current test files recorded in `new-feature-coverage-gaps.json`. Existing case keys and retained Task 2 links are reused where they already cover the behavior; only implemented gaps become candidates.

| Feature family | Implemented behaviors | Existing 188-case keys | Retained Task 2 links | New candidates | Candidate sequence |
| --- | --- | --- | --- | --- | --- |
| USER_ACCESS | 15 | 7 | 1 | 15 | Case 204 – Case 218 |
| USER_PROFILE | 4 | 0 | 2 | 7 | Case 219 – Case 225 |
| DEVELOPER_WORKLOAD | 7 | 5 | 3 | 4 | Case 226 – Case 229 |
| BUSINESS_CATALOGS | 4 | 11 | 4 | 9 | Case 230 – Case 238 |
| MY_NOTIFICATIONS | 5 | 4 | 0 | 15 | Case 239 – Case 253 |
| ACCESS_EMAIL | 6 | 10 | 0 | 10 | Case 254 – Case 263 |
| BUG_EMAIL | 3 | 14 | 0 | 20 | Case 264 – Case 283 |

| Total feature families | 7 | — | — | 80 | Case 204 – Case 283 |

### Candidate ownership by family

| Feature family | Candidate labels | Candidate state | Execution boundary |
| --- | --- | --- | --- |
| USER_ACCESS | Case 204 – Case 218 | NOT_RUN | Local isolated fixtures and the exact test file recorded in the structured inventory; no live mutation. |
| USER_PROFILE | Case 219 – Case 225 | NOT_RUN | Local isolated fixtures and the exact test file recorded in the structured inventory; no live mutation. |
| DEVELOPER_WORKLOAD | Case 226 – Case 229 | NOT_RUN | Local isolated fixtures and the exact test file recorded in the structured inventory; no live mutation. |
| BUSINESS_CATALOGS | Case 230 – Case 238 | NOT_RUN | Local isolated fixtures and the exact test file recorded in the structured inventory; no live mutation. |
| MY_NOTIFICATIONS | Case 239 – Case 253 | NOT_RUN | Local isolated fixtures and the exact test file recorded in the structured inventory; no live mutation. |
| ACCESS_EMAIL | Case 254 – Case 263 | NOT_RUN | Local isolated fixtures and the exact test file recorded in the structured inventory; no live mutation. |
| BUG_EMAIL | Case 264 – Case 283 | NOT_RUN | Local isolated fixtures and the exact test file recorded in the structured inventory; no live mutation. |

## Mentor-facing preview

This is the only numbering style intended for the mentor-facing workbook and evidence cards. Technical keys and source-only proposal identifiers are intentionally omitted from this section.

| Candidate area | Sequential labels | Status |
| --- | --- | --- |
| Approved existing catalog | Case 1 … Case 188 | Approved baseline; unchanged. |
| Retained Task 2 candidates | Case 189, Case 190, Case 191, Case 194, Case 195, Case 196, Case 197, Case 200, Case 202, Case 203 | Candidate; NOT_RUN; pending catalog approval. |
| Task 3 feature candidates | Case 204 … Case 283 | Candidate; NOT_RUN; pending catalog approval. |
| Candidate merged catalog | 278 cases | Candidate total only; not yet official. |

Dropped and merged source rows do not create new candidate labels. Any final compacting or append-only number-to-key mapping happens only after DonHV approves the catalog.

## Execution and evidence boundary

- No retained or proposed row is marked PASS by this report.
- Atomic execution, persistence/reload checks, UI runtime captures, BTP evidence, and reviewer acceptance remain future work.
- A later execution package must emit one result per approved internal case key, keep the sequential mentor label, and preserve the distinction between PASS, FAIL, HELD, MAPPING ONLY, BLOCKED, and NOT_RUN.
- A suite exit code or generated card alone cannot promote a row to PASS.

## DonHV approval checkpoint

Please approve or revise these decisions before a catalog-extension or execution plan is written:

1. The 15-row disposition set: 7 KEEP, 3 REWRITE, 3 MERGE, and 2 DROP.
2. The seven feature families and their 80 implemented-but-missing atomic candidates.
3. The candidate final count of 278, with MERGE rows reusing existing boundaries and no canonical catalog mutation yet.
4. The sequential-only mentor presentation and the rule that technical keys remain repository-internal.

Until that approval is recorded, keep the official catalog, workbook, Drive artifact, and all runtime data unchanged.
