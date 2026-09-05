# IDTS-110 Task 6 report — rendered UI-runtime evidence

## Scope and source boundary

- Task: add one real Playwright/SAPUI5 fixture harness for the nine approved
  visual cases and preserve programmatic/native-control runners as prechecks.
- Source/execution baseline: `6eb6f73840d7150598a993f8656d2b44e5b0cd4b`.
- Parent starting head: `678382248f8d0f246cc02fa2545c72748345bc4e`.
- No product source, CDS model, database/schema/seed, dependency or lockfile,
  BTP/HANA, provider, email, Drive, Jira, or external state is in scope.

## RED → GREEN evidence

### RED

The browser contract was added before the implementation. It failed at the
expected missing-runner boundary:

```text
node scripts/qa/test-idts110-ui-runtime.js
Error: Cannot find module './run-idts110-ui-runtime'
```

During the required Playwright prerequisite probe, one PowerShell quoting form
also failed before Node evaluation (`SyntaxError: Invalid or unexpected token`).
This was a tooling issue only; the probe was corrected with a PowerShell
here-string and no repository, browser, or external state changed.

The first selector-adapter check also found a harness refactor error: the
existing shell test function still had the name `main` while the new selector
export referenced `runRegressionChecks`. It failed before executing the
precheck. This was corrected in the test harness before browser work.

The first visual batch also exposed an environment blocker: Playwright 1.61.1
resolved a managed Chromium path, but neither the headless shell nor the full
`chrome.exe` existed there, so all nine cases correctly returned `BLOCKED`
without screenshots. The browser install/readiness issue is outside product
source and is being resolved only through the installed Playwright toolchain.

The resumed contract then caught an unsafe runtime-input boundary: the runner
accepted an arbitrary external `https://` URL. The contract failed at the
expected loopback-only assertion before the guard was added. This is a
test-harness safety issue, not a product defect.

The output contract then caught that per-case CLI formatting was not exposed
as an explicit adapter interface. It failed at the expected missing
`formatCaseOutput` assertion before the one-line wrapper was added. This keeps
`--case=<key>` marker output separately testable from nine-case batch output.

## Handoff

## GREEN evidence

The deterministic fixture now serves the existing NotificationShell and the
existing DeveloperWorkloadDetails fragment to Chromium. It supplies case
specific data through the fixture route only; no product source, live service,
provider, or external target is used. The notification fixture exposes only
sanitized rows and metrics for signal/poll/visibility teardown checks. The
workload fixture supplies one selected profile, one open Bug row, one omitted
Closed source row, the technical assignee/current action owner distinction,
and an allowlisted active-Bug deep-link path.

The focused browser contract and adapter prechecks pass:

```text
node scripts/qa/test-idts110-ui-runtime.js
IDTS-110 UI runtime contract PASS: visual case set, scenario map, options, and boundaries
node scripts/qa/test-my-notifications-shell.js
IDTS My Notifications shell contract: PASS
node scripts/qa/test-user-admin-workload.js
IDTS User Administration Developer Workload contract: PASS
```

The selected prechecks remain explicitly non-visual and exit `1` with one
`BLOCKED` marker each: `F237` from `test-my-notifications-shell.js` and
`F224` from `test-user-admin-workload.js`. Their limitations state that the
Task 6 browser lane owns the authoritative screenshot/result.

The per-case runner also emits exactly one parseable atomic marker. A focused
`F237` invocation was parsed by `parseAtomicMarker` as `PASS` with both
`IDTS110-F237-RESULT` and `IDTS110-F237-VISUAL` evidence IDs. Chromium was
installed through the existing Playwright toolchain with
`npx playwright install chromium`; no repository dependency or lockfile was
changed.

The authoritative nine-case browser run was:

```text
node scripts/qa/run-idts110-ui-runtime.js --scope=VISUAL --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=Codex-agent-assisted --url=http://127.0.0.1:59292/idtsbugmanagementui/index.html --output=.tmp/idts-110/ui-results.json
runId: idts110-ui-1788609025467-971346abf2c775b094e8645f
total: 9
PASS: 9
FAIL: 0
BLOCKED: 0
HELD: 0
NOT_RUN: 0
```

Cases and rendered scenarios:

| Case | Scenario | Result | Runtime evidence |
| --- | --- | --- | --- |
| `F224` | workload drill-down | PASS | fresh `IDTS110-F224/runtime.png` + `case-manifest.json` (`7e7a6b53e080042ab2922e726f15f3600b1ffb7a1abb727bc201f743177fb912`) |
| `F237` | populated Bug title row | PASS | fresh `IDTS110-F237/runtime.png` + `case-manifest.json` (`7e1ce8abbf159263db737205290e1a073c0598b9f254b2d600be450164b68090`) |
| `F238` | empty notifications | PASS | fresh `IDTS110-F238/runtime.png` + `case-manifest.json` (`46eb5253b741de2db233a7980913b00330e0ff4b2a1cd8805917205b7abc48c5`) |
| `F238E` | error and retry | PASS | fresh `IDTS110-F238E/runtime.png` + `case-manifest.json` (`01472fb2b591059f27694cd1502e8f625ff731fbfacedd85cca542b5f38fb3df`) |
| `F238L` | loading notifications | PASS | fresh `IDTS110-F238L/runtime.png` + `case-manifest.json` (`f5b4413c8b4c78b2a768fb2342b4530a1c8f40cf36da958afdc8aceec4905294`) |
| `F239` | visible change signal | PASS | fresh `IDTS110-F239/runtime.png` + `case-manifest.json` (`feb2455a2ed594c280d8737a9598b06efa5535c28b962d460c16a19a724fdb66`) |
| `F239P` | visible polling | PASS | fresh `IDTS110-F239P/runtime.png` + `case-manifest.json` (`66d86d5091f946a6f496d41e3f1a94873bd1d16cf8ebe6c1f54087a500476c48`) |
| `F239H` | hidden page stops polling | PASS | fresh `IDTS110-F239H/runtime.png` + `case-manifest.json` (`6e8a99f1645b5ead9deab3db581abaa7b5cd83d4de076fec15d704242526db64`) |
| `F239D` | destroyed shell teardown | PASS | fresh `IDTS110-F239D/runtime.png` + `case-manifest.json` (`442e17be4f12cfc99ca51a6ef9982b846a5ce763b2aebaea478d84d50e1960c6`) |

All nine screenshots are regular fresh PNG files under `.tmp/idts-110`, each
has a distinct SHA-256, and each matching manifest binds `caseKey`, `runId`,
`nonce`, baseline, creation time, path metadata, and the exact visual evidence
ID. The browser batch was written atomically to `.tmp/idts-110/ui-results.json`.
No console or network errors were recorded by the case runs, and a serialized
secret scan over the batch returned no credential, token, private URL, or PII
pattern.

## Known limitations and handoff boundary

- The browser origin is a loopback fixture URL; the reader-facing evidence
  keeps the route path and metadata while the protocol redacts full URLs.
- The runner rejects non-loopback runtime URLs and URL credentials before
  Chromium starts; the fixture remains the only permitted runtime target.
- The nine results are candidate atomic PASS records pending `PENDING_DONHV_REVIEW`.
  They are not human approval, official workbook PASS, deployment, release,
  BTP/HANA/provider evidence, or Drive/Jira completion.
- The `.tmp/idts-110` PNG/manifest/result artifacts are run outputs and remain
  uncommitted. The source commit contains only the Task 6 harness, contract,
  fixture-server change, and this report.
