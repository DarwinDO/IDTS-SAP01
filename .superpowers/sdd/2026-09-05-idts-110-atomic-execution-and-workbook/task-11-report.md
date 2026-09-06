# Task 11 report — IDTS-110 candidate execution report

## Status

Task 11 report generation is complete at the candidate handoff boundary. The
candidate remains `PENDING_DONHV_REVIEW`; this is not official PASS, merge,
deployment, Drive replacement, Jira completion, or release.

- Branch: `test/idts-110-unit-test-execution-donhv`
- Frozen source base / PR: `6eb6f73840d7150598a993f8656d2b44e5b0cd4b` / PR #388
- Independent review head: `f8cc71009f4a69db9bc45e446ebdf54e09948e29`
- External mutations: `[]`
- Independent review: 0 Critical / 0 Major / 0 Important; 2 deferred Minor findings

## TDD evidence

The required RED contract was run before implementation and failed because
`scripts/qa/generate-idts110-final-report.js` did not exist. After the minimal
generator was added, the same contract ran GREEN and asserted:

- catalog total `278`;
- new result count `90`;
- adapter counts `11 / 33 / 1`;
- Notification count `45` and visual count `8`;
- `externalMutations.length === 0`.

The generator then produced
`docs/pm/evidence/idts-110/final-execution-report.md` from the frozen inputs.

## Frozen input truth

- Catalog: `278` cases; canonical SHA-256
  `7F9D68D2185E95B166BEFB928069D6DFBCAFFAE563667692A1C319755C88E253`.
- Number map: `278` entries, exact `1..278` catalog-order bijection; file SHA-256
  `51B83E3520143A01A9C1AAD51C5EA3F030AD4BCA3AEBB8B66FB95C0D14017A1D`.
- New aggregate: `90` candidate PASS assertions, all pending DonHV review;
  file SHA-256
  `659AD9613A63BB7A5C9FAC2A56D3BCAF7F42133F8095215851D892ECA130730D`.
- Candidate workbook SHA-256:
  `C0C49CE78A6AF43FD59CC634CB5DBE56919EF10937300217F5BDEF763D2D2A5D`.
- Workbook totals: `130 Candidate PASS / 135 Mapping Only / 13 Blocked / 278`.
- Historical truth: `40 PASS / 135 mapping-only / 13 blocked`.
- User Administration: `45` new rows and adapter accounting `11 / 33 / 1`.
- Notifications: `45` new rows and `8` rendered visual rows; the full package
  has `9` visual rows including the User Administration UI row.
- Evidence package: `90` manifests, `90` result records, and `313` PNGs
  (`9 runtime`, `81 result`, `71 before`, `71 after`, `81 reload`).
- Frozen template warnings: exactly `15` inherited warnings — `13` broken
  defined-name `#REF!` advisories plus `Histories/C2` and `Histories/F2`
  overflow warnings — with no introduced warning.

## Verification

Passed gates:

```text
node --check scripts/qa/generate-idts110-final-report.js
node scripts/qa/test-idts110-extension-manifest.js
node scripts/qa/test-idts110-extended-catalog.js
node scripts/qa/test-idts110-atomic-runner.js       # with existing old-harness NODE_PATH
node scripts/sap490/test-idts110-unit-test-workbook.mjs ...
node scripts/qa/secret-scan.js
node scripts/qa/check-agent-rules.js
ai-devkit lint --json                                # existing local command; no install
```

Workbook validation returned `introducedIssues=[]`, `baselineIssues=15`,
`candidateIssues=15`, status totals `130/135/13`, `278/278` hyperlinks,
fidelity PASS, and no findings. OfficeCLI preflight was
`officecli --version` → `1.0.147`.

The evidence-contract command was attempted read-only first and stopped before
writing because its Playwright executable was unavailable. It was not rerun
with a browser download because that would install external dependencies, and
the contract script rewrites the existing 90 packages and 278 cards. Existing
Task 9 package/card evidence and the independent review remain the evidence for
that surface. The required `npx ai-devkit@latest lint --json` form was not
invoked because `@latest` may install dependencies; the existing local
`ai-devkit lint --json` command passed instead.

`git diff --check` and the final scoped staged diff check are required before
commit. The progress ledger was not modified.

## Concerns and boundary

The 13 historical BTP-required cases remain blocked without an authorized
target, fixture, rollback plan, and sanitized readback. No BTP/HANA,
provider/email, deployment, Drive, Jira, push, merge, or release action was
performed. Mentor-visible outputs contain no secret/PII values, internal case
keys, raw selectors, private endpoints, credential assignments, `undefined`, or
unresolved placeholders.

## Final-review fix wave — receipt-bound report gate

Fix commit `72dff9f7ea30284adfef47a65c9f5f6ed239f6a5` replaces the final
report's self-asserted workbook/review conclusions with machine-readable,
SHA-bound inputs:

- `scripts/sap490/test-idts110-unit-test-workbook.mjs --receipt=...` now emits
  the existing validator's parsed status totals, native-link totals, OfficeCLI
  issue/validation result, fidelity result, candidate/template/input hashes,
  validator hash, reviewed Git head, and clean-worktree state.
- `scripts/qa/generate-idts110-final-report.js` verifies the candidate and
  template bytes, validator and independent-review artifact hashes, two pinned
  receipt hashes, matching reviewed heads, clean receipts, zero validator
  findings, OfficeCLI/fidelity pass state, exact `130/135/13/278` status
  totals, `278/278` native links, and zero Critical/Major/Important review
  counts before it emits a report. It rejects report/review receipt drift after
  the reviewed head, except for the committed receipt/report artifacts
  themselves.
- TDD RED was observed for the missing `verifyReceipts` export and for a
  validator invocation that did not write a requested receipt. GREEN commands:
  `node scripts/qa/test-idts110-final-report-receipts.js` and
  `node scripts/sap490/test-idts110-workbook-validation-receipt.mjs`.
- A fresh clean-head workbook receipt was generated at
  `72dff9f7ea30284adfef47a65c9f5f6ed239f6a5` with candidate SHA
  `C0C49CE78A6AF43FD59CC634CB5DBE56919EF10937300217F5BDEF763D2D2A5D`,
  statuses `130/135/13`, links `278/278`, OfficeCLI `15` frozen warnings and
  zero introduced warnings, and fidelity `PASS`.

The negative receipt contract supplies the official template in place of the
candidate and proves rejection. It also proves rejection of a tampered receipt
hash and of a hash-valid receipt for another reviewed head.

### Remaining independent-review gate

The candidate report was deliberately not regenerated in this fix commit. The
only whole-branch review currently available is
`final-whole-branch-review-terra.md` at `21031923548511e383d8d2bd604b528448fcec7b`,
which records one Important finding—the finding fixed here. It cannot
truthfully be converted into a clean receipt for the later fix head. A new
independent review must produce a SHA-bound receipt with its exact reviewed
head and zero Critical/Major/Important counts; only then can the generator
emit the receipt-verified candidate report. Candidate review remains
`PENDING_DONHV_REVIEW` and external mutations remain `[]`.

### Final focused checks for this fix wave

- `node scripts/qa/test-idts110-final-report-receipts.js` — PASS.
- `node scripts/sap490/test-idts110-workbook-validation-receipt.mjs` — PASS.
- `node scripts/qa/test-idts110-extension-manifest.js` and
  `node scripts/qa/test-idts110-extended-catalog.js` — PASS.
- `NODE_PATH=E:\IDTS-SAP01-worktrees\idts-110-local-primary-harness-donhv\node_modules`
  with `node scripts/qa/test-idts110-atomic-runner.js` — PASS; no dependency
  was installed or changed.
- `officecli validate docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.5_candidate.xlsx`
  — PASS; `ai-devkit lint --json` — PASS; `node scripts/qa/secret-scan.js` and
  `node scripts/qa/check-agent-rules.js` — PASS; `git diff --check` — PASS.
- `node scripts/qa/generate-idts110-final-report.js` — expected exit `1`
  because no pinned independent-review receipt manifest exists. This is the
  intentional fail-closed proof; it did not alter the previous candidate report.

## Exceptional final fix wave — operable receipt lifecycle

The scoped re-review found that the first receipt implementation was not
operable because it referenced no manifest and excluded the review artifact
from its allowed post-review boundary. The second fix wave makes the future
lifecycle explicit without creating a false clean review receipt:

- `scripts/qa/create-idts110-final-report-receipt-manifest.js` creates the
  manifest only from existing clean workbook and independent-review receipts.
  It rejects dirty receipts, mismatched reviewed heads, artifact-hash drift,
  and any non-zero Critical/Major/Important count before writing.
- The final-report generator requires exact root-relative paths for the review
  artifact and both receipts, validates the artifact hash both in the review
  receipt and the manifest, and requires the manifest reviewed head to equal
  the receipts' reviewed head.
- After that reviewed head, the boundary permits only the exact SHA-bound
  review artifact, workbook receipt, review receipt, manifest, and report
  output. During generation, only the report output may be dirty. Any other
  committed or working-tree source path fails the stale/dirty gate.
- TDD RED: the end-to-end default-path test initially failed because the
  generator did not export its default configuration. GREEN:
  `node scripts/qa/test-idts110-final-report-default-lifecycle.js` creates a
  disposable local Git clone using the real default path layout and copies,
  then proves valid lifecycle generation and rejects official-template
  substitution, a missing manifest, tampered review artifact, review receipt,
  manifest, and unrelated committed source drift.

No actual `independent-review-receipt.json` or
`final-report-receipt-manifest.json` was created in this checkout: the current
scoped re-review is still 0 Critical / 0 Major / 1 Important and therefore is
not eligible to become a clean receipt. The next step is a new independent
review of this second fix head. Only if it has zero Critical/Major/Important
findings may its artifact and receipt be created, then the manifest helper run,
then the default final-report generator run.

## Exceptional final fix follow-up — executable default generator proof

The receipt lifecycle test originally called `buildReport(config)`, which only
validates inputs and does not execute `main()` or write the default Markdown
output. The test now removes the default output first, proves it does not
exist, then invokes `node scripts/qa/generate-idts110-final-report.js` through
`spawnSync(process.execPath, args)` in the disposable clone. It asserts exit
zero, a newly created default output, the emitted default output path, the
receipt-derived review head, exact `130/135/13/278` workbook counts and
`278/278` links, and candidate-only/PENDING_DONHV_REVIEW Markdown content.

TDD RED exposed a real boundary defect: `gitText(...).trim()` stripped the
leading porcelain status column for the first dirty report-output line, causing
the allowed default report path to be parsed as `ocs/...` and wrongly rejected.
The boundary now preserves raw `git status --porcelain` output while retaining
trimmed Git output for ref/diff commands. GREEN:
`node scripts/qa/test-idts110-final-report-default-lifecycle.js`.

The same end-to-end test retains the official-template substitution, missing
manifest, review artifact/receipt/manifest tampering, and unrelated source
drift negatives. No receipt, manifest, candidate report, ledger, or external
state was fabricated or changed in this follow-up.
