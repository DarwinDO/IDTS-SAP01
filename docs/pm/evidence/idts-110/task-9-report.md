# IDTS-110 Task 9 report — atomic evidence packages and mentor cards

## Scope and authority

- Execution source baseline: `6eb6f73840d7150598a993f8656d2b44e5b0cd4b` (PR #388 merge).
- Approved catalog: 278 English-only rows; canonical catalog SHA-256 (JSON): `7f9d68d2185e95b166befb928069d6dfbcaffae563667692a1c319755c88e253`.
- Approval: DonHV, `2026-09-05`, `APPROVED_FOR_EXECUTION`, catalog approval PR 388 / merge `6eb6f73840d7150598a993f8656d2b44e5b0cd4b`; result review remains `PENDING_DONHV_REVIEW`.
- Existing 188 case packages under `docs/pm/evidence/idts-110/cases/` were read only. Their truth remains 40 candidate PASS, 135 mapping-only, and 13 blocked; no historical manifest was rewritten.
- No product source, catalog, workbook/template, dependency, database, BTP/HANA, provider, email, Drive, Jira, or other external state was changed.

## Deterministic source selection

The aggregator uses the committed
`docs/pm/evidence/idts-110/source-result-ledger.json`, with matching enforcement
in `scripts/qa/generate-idts110-evidence.js`. It does not discover result files
by directory order, and rejects a source outside that ledger so an old candidate
cannot be promoted accidentally. Each selected source is hash-checked before
parsing, so replacing a `.tmp` file while retaining its run ID is rejected.

| Source | Run ID | Selected | Excluded | Raw SHA-256 |
| --- | --- | ---: | ---: | --- |
| Task 4 `review-round3-fresh.json` | `idts110-1788602696225-662da0865fbc466327dc2088771beb25` | 44 | F224 precheck | `284e75f12f6508bd9a6ced9e7b70b5422bda2ef9fef95c8c81d785237a5ccee1` |
| Task 5 `task5-fix-round1-review.json` | `idts110-1788605749451-2365f5b068e7f3cc11aa9ab1457f38e2` | 7 | — | `23e0b6743cb41b8f55ee0523697cb3caaed48e07d437a02b339414e944732209` |
| Task 6 `ui-results.json` | `idts110-ui-1788609025467-971346abf2c775b094e8645f` | 8 | superseded F224 | `07691febc86f85f95950bd4dcf3020824899a4a6f8e913c1289b7715e49eb62a` |
| Task 6 `f224-fix-round1.json` | `idts110-f224-fix-r1-20260905e` | 1 | — | `59f8af488c9e127c8cbdcca2d9590d7095e99cebad1bf9d26e5bfb0bf6ed5c5f` |
| Task 7 `review-task7-fix3-results.json` | `idts110-1788615735629-d086b0bacdf397d2fbc5218ab91b1a3c` | 10 | — | `bd49b34bf3d98248911e393c0cde259604f03c06d160ec2834932a1214817474` |
| Task 8 `review-task8-fix2-results.json` | `idts110-1788623942723-a9f74045042c5a6fe9764e4d1cda6a42` | 20 | — | `8c2db79570eabb7405a7d1171ee0600ccc53803e5c340d39bc5ded648457b84d` |

The selected aggregate has exactly 90 unique new keys in approved catalog
order and aggregate SHA-256 `659ad9613a63bb7a5c9fac2a56d3bcaf7f42133f8095215851d892eca130730d`
(the aggregate stays under ignored `.tmp/idts-110/`). Status distribution is
`90 PASS` at the candidate assertion layer, with all 90 rows still pending
DonHV review. The nine UI rows are F224, F237, F238, F238E, F238L, F239,
F239P, F239H, and F239D; F224 comes only from the fix-round replacement.

## Generated evidence

- `scripts/qa/generate-idts110-evidence.js` now validates the catalog/approval
  binding, baseline, exact 90-key set, per-source run IDs/counts, atomic result
  contract, and source selection before writing evidence.
- `docs/pm/evidence/idts-110/unit/<internal-key>/` contains 90 `result.json`
  records and 90 `case-manifest.json` records. Each manifest binds the result,
  baseline, approval, assertion, review status, evidence files, and SHA-256
  hashes. The nine real UI PNGs were copied from the Task 6 run artifacts and
  remain referenced by their matching runtime evidence metadata.
- The package contains 313 PNG artifacts: 9 copied runtime screenshots, 81
  generated structured-result images, and 223 generated sanitized state images.
  Generated images are projections of structured records and are not presented
  as additional runtime proof.
- `scripts/qa/generate-idts110-mentor-cards.js` creates exactly
  `Case-001.png` through `Case-278.png`. Visible card text is number-only and
  contains title, truthful status/evidence kind, test file, source/deploy
  baseline, execution window, evidence references, review status, and
  limitation. Internal keys, raw selector commands, PII, secrets, and
  `undefined` are excluded. Mapping-only cards explicitly say they are not
  atomic execution and do not label that evidence as PASS.

## TDD and verification

RED was observed before implementation: the fixed contract failed on the
missing packaged validator and the stale P191 absence assertion. GREEN was
observed after the minimal aggregator, committed source ledger, strict package
validator, package writer, renderer, card generator, and adversarial checks were
added:

```text
node scripts/qa/test-idts110-evidence-contract.js                         PASS
node scripts/qa/generate-idts110-evidence.js --atomic-results=.tmp/idts-110/all-results.json  PASS
node scripts/qa/generate-idts110-mentor-cards.js --results=.tmp/idts-110/all-results.json --output=docs/pm/evidence/idts-110/cards  PASS
node scripts/qa/test-idts110-extension-manifest.js                          PASS
node scripts/qa/test-idts110-extended-catalog.js                          PASS
node scripts/qa/test-idts110-atomic-runner.js                             PASS
node --check scripts/qa/generate-idts110-evidence.js                      PASS
node --check scripts/qa/generate-idts110-mentor-cards.js                  PASS
node --check scripts/qa/test-idts110-evidence-contract.js                 PASS
node scripts/qa/secret-scan.js                                             PASS
node scripts/qa/check-agent-rules.js                                       PASS
npx --yes ai-devkit@latest lint --json                                     PASS (5 ok, 0 required failures)
git diff --check                                                            PASS
```

OfficeCLI preflight was run with `officecli --version` (`1.0.147`) and
`officecli help`; OfficeCLI does not author repository Markdown, so no Office
artifact operation was attempted.

## Concerns and handoff

- Candidate `PASS` is not DonHV approval, official workbook PASS, deployment,
  provider/live-email acceptance, BTP/HANA evidence, Drive release, or Jira
  completion. Task 10 may consume the ignored aggregate and the committed unit
  package/cards after the coordinator reviews this concern.
