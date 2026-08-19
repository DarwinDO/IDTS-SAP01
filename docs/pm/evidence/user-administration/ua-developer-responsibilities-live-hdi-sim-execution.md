# UA Developer Responsibilities — Live HDI Simulation Execution

Date: 2026-08-19
Owner: DonHV
Artifact SHA-256: `b0ae552d9f4a11ee266d1c7d2f38e7bf7cd8936c63a19ffda2a3f5aaa4986dda`

## Attempt 1 — stopped before simulation

Temporary app: `idts-ua-developer-hdi-sim-20260819`.

Preflight passed: authenticated exact target, `DEMO READY`, artifact/plan hashes, collision zero, one succeeded managed HDI service, application-instance headroom 13, and frozen main app baselines.

Mutation/readback ledger:

| Step | Result |
| --- | --- |
| D01 no-start/no-route push | PASS; app STOPPED, routes 0, bindings 0, one READY package |
| D02 exact HDI bind | PASS; exactly one intended binding |
| D03 stage-package | CLI session exceeded Codex's 30-second execution window; no second stage was run |
| HDI simulation task | NOT CREATED |
| HDI make/DDL/DML/seed | 0 |
| Cleanup unbind | command exit 0; bounded readback reached binding count 0 |
| Cleanup app delete | PASS; app count 0 |

Final readback preserved:

- HDI service count 1, last operation succeeded;
- main CAP revision 7 fingerprint `e37d6313c61f`, routes 1, bindings 7, instances 1/1;
- main AppRouter revision 11 fingerprint `5d91742def41`, routes 1, bindings 3, instances 1/1;
- `npm run btp:demo:check` = `DEMO READY`.

Root cause: Codex invoked the long-running CLI inside a 30-second tool window and emitted only stdout, losing the returned session identifier needed to poll the same process. The immediate build readback also used an unproven `app_guids` filter. This is a tooling/orchestration failure, not an HDI simulation failure.

## Corrective attempt 2 delta

Attempt 2 uses the unique app `idts-ua-developer-hdi-sim-20260819-r2`; every original preflight, mutation ceiling, allowlist, task, cleanup and stop condition remains unchanged.

Corrections only:

1. Invoke `cf stage-package` with a tool call that preserves the process session ID.
2. Poll that same session; never launch a second staging command.
3. After terminal CLI completion, resolve the build through the exact READY package GUID and require exactly one build whose package relationship matches.
4. Require build state and owned droplet state `STAGED` before the one set-droplet mutation.
5. Any nonzero, timeout beyond the documented staging bound, multiple/absent owned builds, or package/droplet mismatch triggers exact cleanup with no task.

This delta does not authorize new services, routes, app start, DB deployer, real make, data mutation, or a second simulation task.
