# UA Developer Responsibilities — Live HDI Simulation Plan

Date: 2026-08-19
Owner: DonHV
Status: `EXACT PLAN ONLY / NEVER EXECUTE WITHOUT NEW APPROVAL`

## Frozen local artifact

- Archive: `mta_archives/idts-ua-developer-hdi-sim-c39bdbe.zip`.
- SHA-256: `b0ae552d9f4a11ee266d1c7d2f38e7bf7cd8936c63a19ffda2a3f5aaa4986dda`.
- Size: `8,243` bytes.
- File entries: exactly `14`.
- Package SHA-256: `1e9dccdf06bc2fb8688153bda3041dcb8633b944d40990e4dd837d4c940dec1e`.
- Lock SHA-256: `dd60fde58879c82a5170d3058549cbcfc97731b070bfe4df4be4c501890aca66`.
- Node engine: exact `22.x`.
- Direct dependency: exact `@sap/hdi-deploy@5.7.0`.
- Lockfile v3: 26 package entries; zero missing integrity, local/git resolution, lifecycle-script flag, or audit vulnerability.
- Archive/staging parity mismatches: `0`.
- Unsafe path, symlink, `node_modules`, CSV, `.hdbtabledata`, or sensitive-content hits: `0`.

The package `start` script exits with code 1 and performs no HDI work. Accidental app start therefore fails closed. Simulation is reachable only through the exact `cf run-task` command below.

## Exact temporary topology

- Temporary app: `idts-ua-developer-hdi-sim-20260819`.
- Temporary task: `idts-ua-developer-hdi-sim-20260819-run`.
- Routes: `0`.
- Instances started: `0`.
- Memory: `256M`.
- Disk: `512M`.
- Buildpack: `nodejs_buildpack`.
- Binding: exactly existing `idts-sap01-db` HDI service.
- No XSUAA, UPS, destination, scheduler, S3, AI, email, AppRouter, CAP or other binding.

## Mandatory preflight

Immediately before every mutation, assert the exact reviewed CF API target, organization and `dev` space in memory. Emit only `TARGET_ASSERTION=PASS|MISMATCH|MISSING`. Stop on mismatch.

Before D01 require:

1. `npm run btp:demo:check` = `DEMO READY`.
2. Temporary app exact/case-insensitive collision count = `0`.
3. Temporary task name collision/active count = `0`.
4. Existing `idts-sap01-db` count = `1`, type = managed HDI container, last operation succeeded.
5. Main CAP/AppRouter revisions, requested/running instances, route counts, and binding-name sets are freshly frozen.
6. Archive SHA-256 and all 14 entry hashes equal the approved artifact.
7. HANA aggregate baseline for affected tables is available without printing business rows or credentials.

## Forward command sequence

The commands below are documentation only. Values inside angle brackets must be resolved in memory and never printed when they are GUIDs.

### D01 — create/upload only, no stage/start/route

```powershell
cf push idts-ua-developer-hdi-sim-20260819 `
  --no-manifest `
  --no-start `
  --no-route `
  -p mta_archives/idts-ua-developer-hdi-sim-c39bdbe.zip `
  -m 256M `
  -k 512M `
  -b nodejs_buildpack
```

Readback: exact app count 1, requested state STOPPED, routes 0, bindings 0, package READY. A nonzero or ambiguous result requires readback; never rerun push blindly.

### D02 — bind only the existing HDI container

```powershell
cf bind-service idts-ua-developer-hdi-sim-20260819 idts-sap01-db
```

Readback: app binding-name set is exactly `{ idts-sap01-db }`; main app bindings unchanged.

### D03 — stage the bound package

```powershell
cf stage-package idts-ua-developer-hdi-sim-20260819
```

Privately resolve the exact app-owned latest build and its STAGED droplet. Require the build package to equal D01's READY package. Keep all GUIDs in process memory.

### D04 — assign only the owned staged droplet

```powershell
cf set-droplet idts-ua-developer-hdi-sim-20260819 <IN_MEMORY_OWN_STAGED_DROPLET_GUID>
```

Readback must prove current droplet matches. The app remains STOPPED and must never be started.

### D05 — run exactly one bounded simulation task

```powershell
cf run-task idts-ua-developer-hdi-sim-20260819 `
  --command "node scripts/btp/ua-developer-hdi-simulate-command.js" `
  -m 256M `
  -k 512M `
  --name idts-ua-developer-hdi-sim-20260819-run `
  --wait
```

Sanitized acceptance:

- task terminal state `SUCCEEDED`, process exit `0`;
- exact nine deploy files scheduled;
- undeploy scheduled/effective count `0`;
- CSV/`.hdbtabledata`/seed count `0`;
- server and deployer warnings `0`;
- dependent redeploy names, if any, are allowlisted views whose dependency is explained by the two changed tables;
- no table or data artifact outside the approved nine-file set appears.

Timeout or ambiguous state requires one sanitized task readback. Do not run a second task.

## Cleanup sequence

Cleanup runs after PASS or FAIL only when no task is still running and ownership is exact. Assert target before every command.

```powershell
cf unbind-service idts-ua-developer-hdi-sim-20260819 idts-sap01-db
cf delete idts-ua-developer-hdi-sim-20260819 -f
```

Final readback:

- temporary app, task, routes, and binding absent;
- existing HDI service remains present and unchanged;
- main CAP/AppRouter revision, route and binding baselines unchanged;
- `npm run btp:demo:check` = `DEMO READY`.

Never delete the HDI service, use `-r`, delete orphaned routes, start the helper app, rerun the task, deploy the DB module, or run broad `cds deploy`.

## Partial-failure handling

| Failure point | Response |
| --- | --- |
| D01 ambiguous | Read exact app/package state; no blind push retry. Delete only a proven exact unbound temporary app. |
| D02 fails | Verify bindings. If zero, delete exact app. If ambiguous/unexpected binding, preserve and stop. |
| D03 fails | Do not stage again. Verify build/package ownership, unbind exact HDI, delete exact app. |
| D04 fails | Verify current droplet once. No second set-droplet without a new decision; unbind/delete exact app. |
| D05 fails or times out | Read task once. Never rerun. Wait for terminal state before unbind/delete; preserve on ambiguity. |
| Cleanup fails | Read exact app/binding/task state. No broad cleanup or force purge. |

## Mutation ceiling

If separately approved, the maximum ordinary platform mutations are:

- one temporary app push;
- one HDI bind;
- one package stage;
- one set-droplet;
- one simulation task;
- one unbind;
- one exact app delete.

The simulation itself may execute HDI pre-make grants. No real make, post-make, DDL, DML, seed, user/role/provider, XSUAA, main-app, Git, Jira or Drive mutation is authorized.
