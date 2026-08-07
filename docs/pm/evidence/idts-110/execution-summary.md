# IDTS-110 execution and DonHV curation summary

- Executor: NhanT (agent-assisted)
- Reviewer/integrator: DonHV
- Candidate package head: `8fd55bc00199ded91ce294eedc3b4113292fd6ee`
- Integrated `origin/dev`: `e55a863d0cc4ada6c421ce940c1986162756c176`
- Approved catalog: 188 English cases, still `NOT_RUN`
- Workbook/Drive: unchanged

## Two separate truth layers

| Layer | Accepted/PASS | Held | Mapping-only | Blocked |
| --- | ---: | ---: | ---: | ---: |
| NhanT candidate package | 40 | 0 | 135 | 13 |
| DonHV reviewer disposition | 38 | 2 | 135 | 13 |

The candidate layer preserves NhanT's executor, timestamps, actual results, environments and provenance. The reviewer layer does not rewrite those fields:

- `UT-ATT-007/008` are `HELD_FOR_EXACT_HEAD_ACCEPTANCE` because their deployed proof SHA differs from the intended exact-head acceptance baseline.
- The 135 mapping-only records prove suite-to-case traceability only; they are not atomic executions, browser/BTP proof, or PASS.
- The 13 integration cases remain `BLOCKED_PENDING_MEMBER_EVIDENCE`.

## Runtime sanitizer separation

Malformed-login contract sanitization was removed from the evidence scope and merged separately through IDTS-39 / PR #283:

- Runtime head: `720a16384468f708843ff58a62fabfea7f201515`
- Merge SHA: `e55a863d0cc4ada6c421ce940c1986162756c176`
- Focused malformed-email/password HTTP checks: PASS
- Auth regression: 28 PASS / 0 FAIL
- No session mutation and no CAP validator-detail leakage

PR #269 contains no branch-only `app/`, `srv/`, or `db/` behavior change after syncing current `origin/dev`.

## Evidence integrity

- 188 manifests and 188 unique Case IDs.
- 280 referenced images; all references exist.
- 280 images have PNG byte signatures.
- The two historical JPEG/JFIF payloads carrying `.png` names were re-encoded to PNG without changing their visual content; only their manifest SHA-256 metadata changed.
- Generated cards are trace summaries, not browser/runtime proof.
- The approved catalog remains `NOT_RUN`.

## Remaining member-owned work

NhanT owns new evidence for the 13 BTP integration cases. NhanT may also rerun `UT-ATT-007/008` on the intended deployed head if exact-head acceptance is required. NhanT must use NhanT's own SAP identity; no credential or token sharing is permitted.

## Tooling

- OfficeCLI preflight: `1.0.143` PASS; no Office artifact was edited.
- No database deploy, seed, schema, workbook, or Drive mutation occurred.
