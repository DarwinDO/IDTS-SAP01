# IDTS-110 DonHV execution review — PR #269

## Review baseline

- Candidate package head: `8fd55bc00199ded91ce294eedc3b4113292fd6ee`
- Integrated `origin/dev`: `e55a863d0cc4ada6c421ce940c1986162756c176`
- Approved catalog: 188 English-only cases, still `NOT_RUN`
- Reviewer: DonHV
- Workbook/Drive: unchanged

## Candidate truth versus reviewer truth

| Layer | Accepted/PASS | Held | Mapping-only | Blocked | Meaning |
| --- | ---: | ---: | ---: | ---: | --- |
| NhanT candidate package | 40 | 0 | 135 | 13 | Immutable execution/evidence handoff |
| DonHV review | 38 | 2 | 135 | 13 | Reviewer disposition; not workbook PASS |

The two held cases are `UT-ATT-007` and `UT-ATT-008`. Their historical deployed-control proof remains intact, but the deployed SHA differs from the intended exact-head acceptance baseline. They must not be reported as final PASS.

## Reviewer disposition

| Decision | Count | Cases/meaning |
| --- | ---: | --- |
| `ACCEPTED_CANDIDATE` | 38 | Exact local candidate assertions accepted for later documentation integration |
| `HELD_FOR_EXACT_HEAD_ACCEPTANCE` | 2 | `UT-ATT-007/008`; historical proof retained, exact-head rerun optional but required for acceptance |
| `MAPPING_ONLY_NOT_PASS` | 135 | Suite-to-case traceability only |
| `BLOCKED_PENDING_MEMBER_EVIDENCE` | 13 | HANA/XSUAA/S3/Job Scheduler/deployed-runtime evidence owned by NhanT |

## Evidence integrity

- 188 manifests; 188 unique Case IDs.
- 280 referenced images; all references exist.
- 280 images now have PNG byte signatures and matching declared hashes where a runtime hash is recorded.
- Generated cards are trace summaries, not browser proof.
- Executor, timestamp, actual result, environment, baseline SHA, and deploy SHA were not rewritten.

## Runtime separation

The malformed-login sanitizer was extracted and merged separately under IDTS-39 through PR #283. PR #269 contains no branch-only `app/`, `srv/`, or `db/` behavior change after syncing current `origin/dev`.

## Remaining actions

1. NhanT supplies the 13 member-owned BTP integration results when available.
2. NhanT may rerun `UT-ATT-007/008` on the intended deployed head for exact-head acceptance.
3. DonHV keeps IDTS-110 In Progress and does not update Unit Test EN v0.5 or Drive in this curation step.
