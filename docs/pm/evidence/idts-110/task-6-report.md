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

### Fix round 1/5 RED — F224 production-path binding

Review found that the original F224 browser fixture could pass while production
workload code changed: it preloaded a literal `requestFilter` and used an inline
`openBugInManagement` URL algorithm. The red browser-contract guard was added
before the fix and failed at the expected missing production-module assertion:

```text
node scripts/qa/test-idts110-ui-runtime.js
AssertionError [ERR_ASSERTION]: F224 fixture must load the production User Administration controller module
    at scripts/qa/test-idts110-ui-runtime.js:69:8
```

This is a harness false-positive guard, not a product defect. No browser
artifact was regenerated during RED.

The first GREEN F224-only browser invocation then truthfully blocked before
screenshot capture because the production workload readiness marker did not
arrive within 45 seconds:

```text
node scripts/qa/run-idts110-ui-runtime.js --scope=CASE --case=IDTS110-F224 ...
actualResult: The rendered fixture could not reach a truthful state: page.waitForFunction: Timeout 45000ms exceeded.
status: BLOCKED
runtimeEvidence: null
```

The direct Chromium trace identified the cause as HTTP `404` for
`/idtsuseradministrationui/controller/Main.js`; UI5 therefore never invoked
the workload boot callback. The fixture require was corrected to the real
`.controller` module ID and the local server was restarted.

The eight existing notification case artifacts were not rerun or changed.

After correcting the UI5 module ID, the next F224-only attempt reached the
real production loader but blocked at the runner-only locator boundary:

```text
actualResult: The rendered fixture could not reach a truthful state: locator.waitFor: Timeout 45000ms exceeded.
Call log: waiting for getByRole('button', { name: 'Open Bug', exact: true }).first() to be visible
status: BLOCKED
runtimeEvidence: null
```

The fragment’s rendered UI5 button text was present; this was a locator
accessibility-shape mismatch, not a production-path result. No notification
artifact was rerun or changed.

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

The original round-0 nine-case browser run (before the F224 production-path
correction) was:

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
| `F224` | workload drill-down | SUPERSEDED by fix round 1/5 | current fresh `IDTS110-F224/runtime.png` + `case-manifest.json` are recorded in the fix-round section below |
| `F237` | populated Bug title row | PASS | fresh `IDTS110-F237/runtime.png` + `case-manifest.json` (`7e1ce8abbf159263db737205290e1a073c0598b9f254b2d600be450164b68090`) |
| `F238` | empty notifications | PASS | fresh `IDTS110-F238/runtime.png` + `case-manifest.json` (`46eb5253b741de2db233a7980913b00330e0ff4b2a1cd8805917205b7abc48c5`) |
| `F238E` | error and retry | PASS | fresh `IDTS110-F238E/runtime.png` + `case-manifest.json` (`01472fb2b591059f27694cd1502e8f625ff731fbfacedd85cca542b5f38fb3df`) |
| `F238L` | loading notifications | PASS | fresh `IDTS110-F238L/runtime.png` + `case-manifest.json` (`f5b4413c8b4c78b2a768fb2342b4530a1c8f40cf36da958afdc8aceec4905294`) |
| `F239` | visible change signal | PASS | fresh `IDTS110-F239/runtime.png` + `case-manifest.json` (`feb2455a2ed594c280d8737a9598b06efa5535c28b962d460c16a19a724fdb66`) |
| `F239P` | visible polling | PASS | fresh `IDTS110-F239P/runtime.png` + `case-manifest.json` (`66d86d5091f946a6f496d41e3f1a94873bd1d16cf8ebe6c1f54087a500476c48`) |
| `F239H` | hidden page stops polling | PASS | fresh `IDTS110-F239H/runtime.png` + `case-manifest.json` (`6e8a99f1645b5ead9deab3db581abaa7b5cd83d4de076fec15d704242526db64`) |
| `F239D` | destroyed shell teardown | PASS | fresh `IDTS110-F239D/runtime.png` + `case-manifest.json` (`442e17be4f12cfc99ca51a6ef9982b846a5ce763b2aebaea478d84d50e1960c6`) |

The round-0 F224 artifact is intentionally superseded by the production-path
correction below. The eight notification artifacts remain the round-0
artifacts and were not rerun or rewritten.

The round-0 eight notification screenshots remain regular PNG files under
`.tmp/idts-110`, each with its matching manifest binding `caseKey`, `runId`,
`nonce`, baseline, creation time, path metadata, and exact visual evidence ID.
The round-0 browser batch was written atomically to
`.tmp/idts-110/ui-results.json`; its F224 row is superseded by the fix-round
artifact below. No console or network errors were recorded by the original
case runs, and a serialized secret scan over that batch returned no credential,
token, private URL, or PII pattern.

### Fix round 1/5 GREEN — F224 production execution

The F224-only correction now loads the production module
`idts/useradministrationui/controller/Main.controller` from
`app/user-administration-ui/webapp/controller/Main.controller.js`, instantiates
the real controller prototype, and invokes its actual
`_loadDeveloperWorkloadBugs`, `_bugObjectPageUrl`, and
`openBugInManagement` methods. The fixture supplies only returned Bug
contexts; it captures the production `bindList` arguments rather than
preloading a copied filter. The real
`idts.useradministrationui.fragment.DeveloperWorkloadDetails` fragment renders
the table and owner distinction. Navigation is observed on an auxiliary
Chromium page through the production `window.location.assign` call, preserving
the rendered dialog page for the screenshot.

The corrected F224-only run was:

```text
node scripts/qa/run-idts110-ui-runtime.js --scope=CASE --case=IDTS110-F224 --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=Codex-agent-assisted --url=http://127.0.0.1:56247/idtsbugmanagementui/index.html --output=.tmp/idts-110/f224-fix-round1.json --idts110-run-id=idts110-f224-fix-r1-20260905e --idts110-nonce=fixr1-20260905e
status: PASS
total: 1
PASS: 1
FAIL: 0
BLOCKED: 0
HELD: 0
NOT_RUN: 0
```

Fresh F224 evidence is
`.tmp/idts-110/IDTS110-F224/runtime.png` plus
`.tmp/idts-110/IDTS110-F224/case-manifest.json`, SHA-256
`095f8afd0c64cb2da45e1e009a54dba50696d7959293d201be57b4934829a041`, bound to
runId `idts110-f224-fix-r1-20260905e`, nonce `fixr1-20260905e`, and the exact
baseline above. The manifest SHA matches the PNG. The rendered runtime facts
are: one Bug row, one omitted Closed source row, technical assignee
`Technical Developer`, current action owner `Current Action Owner`, observed
entity `/Bugs`, exact filter
`assignee_ID eq 20000000-0000-0000-0000-000000000001 and status_code ne 'CLOSED'`,
orderby `dueDate asc,bugNumber asc`, `$direct` group, skip `0`, length `100`,
and matching generated/observed route
`/idtsbugmanagementui/index.html#/Bugs(ID=30000000-0000-0000-0000-000000000001,IsActiveEntity=true)`.
The screenshot-page console and network error arrays are both empty.

The eight notification screenshots were not rerun or rewritten. Their
read-back SHA-256 values remain the original values in the table above:
`F237 7e1ce8abbf159263db737205290e1a073c0598b9f254b2d600be450164b68090`,
`F238 46eb5253b741de2db233a7980913b00330e0ff4b2a1cd8805917205b7abc48c5`,
`F238E 01472fb2b591059f27694cd1502e8f625ff731fbfacedd85cca542b5f38fb3df`,
`F238L f5b4413c8b4c78b2a768fb2342b4530a1c8f40cf36da958afdc8aceec4905294`,
`F239 feb2455a2ed594c280d8737a9598b06efa5535c28b962d460c16a19a724fdb66`,
`F239P 66d86d5091f946a6f496d41e3f1a94873bd1d16cf8ebe6c1f54087a500476c48`,
`F239H 6e8a99f1645b5ead9deab3db581abaa7b5cd83d4de076fec15d704242526db64`,
`F239D 442e17be4f12cfc99ca51a6ef9982b846a5ce763b2aebaea478d84d50e1960c6`.

The post-fix focused checks were:

```text
node scripts/qa/test-idts110-ui-runtime.js
IDTS-110 UI runtime contract PASS: visual case set, scenario map, options, and boundaries
node scripts/qa/test-my-notifications-shell.js
IDTS My Notifications shell contract: PASS
node scripts/qa/test-user-admin-workload.js
IDTS User Administration Developer Workload contract: PASS
node scripts/qa/test-idts110-atomic-runner.js
IDTS-110 atomic runner contract PASS: marker, schema, sanitization, status, batch, and orchestrator continuation.
git diff --check
exit: 0
```

No product source, dependency/lockfile, provider, BTP/HANA, or external state
was changed. The F224 artifact and source changes remain pending the required
Task 6 review boundary.

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
