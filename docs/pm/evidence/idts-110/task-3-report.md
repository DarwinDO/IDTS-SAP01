# IDTS-110 Task 3 report — atomic result protocol

## Scope and source boundary

- Task: implement the shared atomic result schema/helper and the new-case orchestrator.
- Parent/source starting head: `fa12ea59503dd29e4c9d55476f1b1d5ec3d28682`.
- Required execution baseline: `6eb6f73840d7150598a993f8656d2b44e5b0cd4b`.
- Approved catalog input: 278 definitions; the orchestrator selects the 90 rows after the existing 188.
- Changed files are limited to the Task 3 schema, helper, orchestrator, contract, and this report.
- No product source, catalog, workbook/template, evidence directory, database/schema/seed, dependency, BTP/HANA, provider, email, Drive, Jira, or external state was changed.

## RED → GREEN evidence

### RED

1. Before the helper existed:

   ```text
   node scripts/qa/test-idts110-atomic-runner.js
   exit 1
   Error: Cannot find module './idts110-atomic-runner'
   ```

2. After the helper/orchestrator were present but before the schema was added, the contract failed at the explicit schema existence assertion:

   ```text
   IDTS-110 atomic runner contract FAIL
   AssertionError: atomic result JSON schema is required
   ```

### GREEN

The contract now passes with marker parsing, exact baseline/options, sanitization, undefined rejection, expected-result mismatch, required persistence/reload state, visual screenshot evidence, BLOCKED mapping, batch uniqueness, schema fields, and orchestrator continuation:

```text
node scripts/qa/test-idts110-atomic-runner.js
IDTS-110 atomic runner contract PASS: marker, schema, sanitization, status, batch, and orchestrator continuation.
```

## Implemented contract

- `docs/qa/idts-110-atomic-result.schema.json` requires the complete result record, exact `IDTS-110` identity, exact source baseline, UTC millisecond timestamps, safe state/evidence fields, and only `PASS`, `FAIL`, `BLOCKED`, `HELD`, or `NOT_RUN`; `MAPPING_ONLY` is not an allowed status.
- `scripts/qa/idts110-atomic-runner.js` exposes `readAtomicOptions`, `runAtomicCase`, `writeAtomicBatch`, `parseAtomicMarker`, `formatAtomicMarker`, and validation/sanitization helpers. It uses Node built-ins only, requires the exact baseline and explicit executor for selected cases, emits one marker, validates assertion ID `<caseKey>-A1`, rejects undefined/cyclic/placeholder/raw-secret data, and requires snapshots or screenshot/hash evidence before PASS.
- `scripts/qa/run-idts110-new-cases.js` loads the 90 post-188 definitions, invokes one child process per selected case with the exact baseline and selector, accepts only one matching complete marker, records child/marker failures safely, continues after failures, and never infers PASS from a zero-exit broad suite. `ALL`, `USER_ADMIN_PROGRAMMATIC`, `MY_NOTIFICATIONS_SERVICE`, `VISUAL`, `ACCESS_EMAIL`, and `BUG_EMAIL` scopes are supported for later adapter tasks.
- The contract uses deterministic in-process child-process stubs; it does not execute existing broad runners, provider calls, browser sessions, or live fixtures. It proves `PASS`, marker-backed `FAIL`, no-marker suite `FAIL`, and unavailable-child `BLOCKED` across four attempted children.

## Verification checks

| Command | Result |
| --- | --- |
| `node scripts/qa/test-idts110-atomic-runner.js` | PASS |
| `node scripts/qa/test-idts110-extension-manifest.js` | PASS — 10 retained, 80 feature, 90 total; adapters 11/33/1 |
| `node scripts/qa/test-idts110-extended-catalog.js` | PASS — 278 `NOT_RUN` definitions |
| `node scripts/qa/test-idts110-catalog-gap.js` | PASS |
| `node scripts/qa/test-idts110-local-primary-fixtures-contract.js` | PASS |
| `node -e ... Ajv compile of idts-110-atomic-result.schema.json` | PASS |
| `node --check` on helper, orchestrator, and contract | PASS |
| `npm run qa:secret-scan` | PASS — no credential-like key patterns |
| `npm run qa:agent-rules` | PASS — 8 required rules |
| `git diff --check` | PASS |
| `officecli --version` | `1.0.147`; read-only preflight, no Office artifact edited |

## Self-review and concerns

- The exact source baseline is enforced in both schema and runtime validation. The parent branch remains at the requested starting head until this Task 3 commit is created; the final commit SHA is reported in the handoff.
- Existing runners do not yet implement the selector/marker protocol. That integration is intentionally deferred to Task 4 and later; running the default 90-case orchestrator now would therefore produce truthful FAIL/BLOCKED records rather than fabricated PASS evidence.
- An unsupported exploratory invocation, `node scripts/qa/test-idts110-local-exact.js --help`, started that existing in-memory CAP harness because the runner has no help flag. It was interrupted before completion; the output showed only local in-memory deployment activity, with no tracked or external mutation. This is a test-harness/tooling behavior, not a Task 3 product defect.
- Ajv in the bundled dependency tree is draft-07 oriented; the schema uses draft-07 and explicit UTC timestamp patterns so its compile check is warning-free. Runtime validation additionally checks timestamp ordering.
- No canonical business-document or SAP source mirror was added: this is repository QA protocol tooling, not a CAP/UI/domain behavior change, and the task scope authorizes only the listed protocol files plus this report.

## Handoff boundary

Task 3 stops at the committed protocol and contract. It does not integrate adapters, execute the 90 cases, generate evidence/cards/workbook artifacts, claim any new PASS, merge, deploy, or update Drive.
