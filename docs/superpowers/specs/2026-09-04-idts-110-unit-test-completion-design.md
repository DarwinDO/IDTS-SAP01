# IDTS-110 Unit Test Completion Design

## Objective

Produce one accurate SAP490 Unit Test workbook for the current merged and live IDTS scope. The workbook must distinguish executed PASS, FAIL, held, mapping-only, blocked, and not-run cases instead of treating suite traceability as atomic execution.

## Starting point

- Authoritative source baseline: `origin/dev@9d5aad699662bde65a747de4c0d631678de639e4`.
- PR #387 is merged and the repaired local-primary runner reports 135 mapping-only candidates with zero failed mappings.
- The approved catalog currently contains 188 cases.
- Current reviewer disposition is 38 accepted, 2 held, 135 mapping-only, and 13 blocked.
- The supplied 203-case workbook is review input only. It is not an authorized final workbook.

## Case identification and mentor-facing presentation

The official workbook and every embedded evidence card display only sequential case numbers:

- `1`, `2`, `3`, and so on in the `NO.` column.
- `Case 1`, `Case 2`, and so on in evidence headings.
- No mentor-facing cell, caption, image, or filename displays identifiers such as `UT-AUTH-001`.

Repository automation retains the existing technical case keys internally. This prevents duplicate or misjoined evidence without exposing technical identifiers in the submission. Each workbook release freezes the number-to-key mapping. Existing numbers are never reused or reordered inside that release; approved new cases are appended.

## Catalog expansion

The 15 proposed rows numbered 189–203 are not accepted as-is. Each proposal receives one disposition:

- `KEEP`: implemented, non-duplicate behavior that needs a new case.
- `REWRITE`: valid gap whose precondition, action, expected result, role, or evidence boundary is incomplete.
- `MERGE`: behavior already covered by an approved case.
- `DROP`: unsupported, obsolete, or requirement-free behavior.

The same gap analysis covers merged and live User Administration, Developer workload, Business Catalogs, My Notifications, immediate email delivery, authorization, persistence, reload, and negative paths. The final catalog size is determined by this analysis and is not assumed to be 203.

New catalog entries start as `NOT_RUN`. Catalog approval never changes a case to PASS.

## Atomic execution model

Every accepted catalog case must resolve to one explicit executable assertion. Multiple cases may share one test file or process, but the runner must emit a separate result for each internal case key.

Each case records:

- test file and exact assertion location;
- execution command;
- precondition and actor role;
- action and expected result;
- actual result;
- before, after, and reload state where persistence matters;
- source commit and deployed commit where applicable;
- start and completion time;
- limitation and reviewer decision.

A suite exit code alone is mapping evidence, not atomic PASS evidence.

## Execution boundaries

### Local component cases

Run against isolated deterministic fixtures. Assertions must cover the public result and relevant persistence or rollback state. Test-only fixtures may not alter repository seed data or live HANA data.

### UI runtime cases

Use the actual rendered UI. Capture only the screen state needed to prove the case. Source-contract assertions may support the result but cannot replace runtime evidence where visual behavior is the requirement.

### BTP integration cases

Run only after readiness passes and an exact source/deploy baseline is frozen. Evidence must include response or readback from HANA, XSUAA, S3, Job Scheduler, AppRouter, or email provider as required by the case. Live mutations require a bounded allowlist, rollback or cleanup plan, and explicit DonHV approval.

### Security and negative cases

Evidence must show both the expected rejection and the absence of unintended data mutation or information disclosure.

## Evidence package

Structured evidence is authoritative. A generated card is a reader-facing summary, not proof by itself.

Each case package contains:

- structured result record;
- current result card generated from that record;
- database before/after/reload artifacts when relevant;
- runtime screenshot for UI cases;
- sanitized response or readback for integration cases;
- exact source trace;
- reviewer disposition.

Cards show the sequential case number, title, result, evidence type, test file, source baseline, deployed baseline when relevant, execution window, evidence reference, review status, and limitation. Cards must not contain stale SHAs, `undefined`, secrets, personal data, or a PASS label for mapping-only evidence.

## Workbook generation

The final workbook is generated from the approved catalog and reviewed evidence rather than repaired manually from the supplied 203-case file.

- `Cover`: current module, function name, version, and creation date.
- `Histories`: exact catalog count, source baseline, version, author, reviewer, and release note.
- `UT`: one row per approved case, sequential numbering from 1, complete test definition, executor, test date, and truthful result.
- `Evidence`: exactly one evidence section per case with no orphan drawings or stale images.

Only accepted atomic results receive the template's PASS mark. Held, mapping-only, blocked, failed, and not-run cases remain visibly distinct.

## Ownership

Codex acting for DonHV owns gap analysis, test design and implementation, local and authorized BTP execution, evidence generation, remediation, workbook generation, and verification.

DonHV approves:

1. the expanded catalog and proposal dispositions;
2. any material live mutation needed for acceptance;
3. replacement of the official Google Drive workbook.

## Quality gates

Before catalog approval:

- every proposed case has a source-backed requirement and non-duplicate disposition;
- role, persistence, negative, and environment boundaries are explicit;
- visible numbering and internal mapping reconcile exactly.

Before workbook release:

- catalog count, UT row count, evidence section count, and internal mapping count match;
- every PASS has atomic evidence and an accepted review decision;
- no duplicate number, reused mapping, missing artifact, orphan image, formula error, stale SHA, secret, or PII exists;
- all sheets pass normal-zoom visual inspection without clipping or broken layout;
- one independent review has zero Critical, Major, or Important findings;
- Google Drive replacement remains approval-gated with post-upload readback.

## Stop conditions

Stop and request a new decision if a proposed case requires unimplemented product behavior, a live mutation outside the approved allowlist, a schema or dependency expansion, or a catalog interpretation that changes the mentor-facing scope.

## Completion criteria

The work is complete when the approved catalog has a truthful final disposition for every case, the workbook contains only sequential mentor-facing case numbers, all evidence resolves to the frozen source/runtime baseline, DonHV accepts the final candidate, and the exact reviewed workbook is uploaded and read back from the approved Drive location.
