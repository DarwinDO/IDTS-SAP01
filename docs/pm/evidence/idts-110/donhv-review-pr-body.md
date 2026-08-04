## Summary

Curate PR #269 without rewriting NhanT's execution history. The candidate package records `40 PASS / 135 MAPPING_ONLY_CANDIDATE / 13 BLOCKED`; DonHV's separate review accepts 38 candidates, holds `UT-ATT-007/008` for exact-head acceptance, preserves 135 mapping-only records as non-PASS traceability, and leaves 13 integrations blocked.

## Positive Evidence

- 188 unique case manifests and 280 referenced images are present.
- The 38 exact local candidate executions retained by DonHV have case-specific evidence.
- The malformed-login sanitizer is no longer hidden in this evidence PR; it merged separately through IDTS-39, PR #283, at `e55a863d0cc4ada6c421ce940c1986162756c176`.
- Both attachment supplemental files now have real PNG signatures and matching manifest hashes.

## Negative Evidence

- `UT-ATT-007/008` are historical deployed-control candidate PASS records, but are held until rerun on the intended deployed head.
- Thirteen BTP integration cases still require member-owned HANA/XSUAA/S3/Job Scheduler evidence.
- The 135 mapping-only records are not atomic executions and are not PASS.

## Edge/Boundary Evidence

- Malformed login types are covered by the separately merged IDTS-39 safe HTTP 400 contract.
- Attachment MIME and maximum-size boundary evidence remains preserved with immutable executor, timestamp, actual result, deploy SHA, and visual content.
- Candidate truth and reviewer truth are reported as two separate layers.

## Roles/Authorization

- NhanT remains the executor/evidence owner; DonHV is the catalog owner, reviewer, and workbook integrator.
- The 13 BTP cases must use NhanT's own SAP identity. No credential or session is shared.

## Persistence/Reload

- Existing before/after/reload evidence is preserved.
- No manifest actual result, executor, timestamp, or execution baseline was rewritten by DonHV.
- No workbook, Drive, database, seed, or schema was changed.

## UI/UX Review

- Generated cards are trace summaries, not browser/runtime evidence.
- The two attachment supplemental artifacts are historical deployed-control evidence, not exact-current-head acceptance.

## Ponytail Simplicity

- No runtime code or new test framework remains in this PR.
- One deterministic reviewer generator produces the 188-case disposition.
- Evidence-card cleanup is deferred because the current package size is not a merge blocker.

## Known Gaps

- `UT-ATT-007/008`: `HELD_FOR_EXACT_HEAD_ACCEPTANCE`.
- Thirteen integrations: `BLOCKED_PENDING_MEMBER_EVIDENCE`.
- Official Unit Test EN v0.5 and Google Drive remain unchanged.

## Jira/Evidence Links

- Jira: https://dutassociation.atlassian.net/browse/IDTS-110
- PR: https://github.com/DarwinDO/IDTS-SAP01/pull/269
- Matrix: `docs/pm/evidence/idts-110/donhv-execution-review-matrix.md`
- Taxonomy: `docs/pm/evidence/idts-110/donhv-case-taxonomy.json`
- Runtime sanitizer: PR #283 / IDTS-39

## Ownership Knowledge Gate

NhanT's existing QA Knowledge Gate and briefing acknowledgment are preserved. DonHV does not sign or acknowledge for NhanT. Merging this evidence package does not update the canonical `NOT_RUN` catalog or make a final Unit Test acceptance claim.
