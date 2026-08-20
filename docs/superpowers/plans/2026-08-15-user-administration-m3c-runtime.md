# User Administration M3C selective runtime rollout

## Frozen inputs

- Source branch: `feature/wp7-user-onboarding-donhv`.
- Runtime-source checkpoint: `99fa070ad6df11ca46fedb3e9ee27eb81946b2fe` (the deployable CAP/UI files are unchanged from the artifact build working tree; the final commit added only the dedicated MTA descriptor, topology test, and status evidence).
- CAP/full MTAR SHA-256: `b087f301e8ce6567f9ba85cacf0bfabd2cc4fbf2611bcf89c7fdd43de2255583`.
- Dedicated UI-content MTAR SHA-256: `7eab5a2ca06f90ace8af2f332896903bb722c54706e381118f41ba4a1b9ff77c`.
- CAP rollback revision: exact current `idts-sap01-srv` revision 28.
- Main AppRouter rollback boundary: no mutation; exact current revision 10.

## Pre-state

| Object | Frozen value |
| --- | --- |
| CAP | STARTED 1/1, routes 1, bindings 6, current/max revision 28/28 |
| AppRouter | STARTED 1/1, routes 1, bindings 3, current/max revision 10/10 |
| HTML5 repo host | exactly 1 existing service |
| Main MTA | present |
| Dedicated UI MTA collision | 0 |
| Active MTA operations | 0 |
| Runtime readiness | DEMO READY |

## Forward actions

1. Reassert target, artifact hashes, runtime readiness, MTA-operation count, app revisions/routes/bindings, HTML5 host count and UI-MTA collision.
2. Deploy only the existing main CAP module:

   `cf deploy <CHECKSUM_VERIFIED_MAIN_MTAR> -m idts-sap01-srv --strategy blue-green --version-rule ALL --retries 0 --abort-on-error`

3. Read back CAP 1/1, route 1, bindings 6, health/ready 200 and anonymous protected API 401. AppRouter revision/routes/bindings must remain unchanged.
4. Deploy only the dedicated content module:

   `cf deploy <CHECKSUM_VERIFIED_UI_MTAR> -m idts-user-admin-ui-r3c-content --version-rule ALL --retries 0 --abort-on-error`

5. Read back one dedicated UI MTA, zero active operations, and no main AppRouter mutation.
6. Verify authenticated PM+UserAdmin metadata/UI and server-side negative cases. Never print token, cookie, JWT, email or immutable identifier.

The official SAP MultiApps contract states that when `-m` is used, only the specified modules are deployed. Therefore the main MTAR's DB deployer, AppRouter, main app-content module and all resources are outside this execution.

## Abort and rollback

- On timeout/nonzero/ambiguous deployment, read MTA operation and exact app/content state before any action; never blind retry.
- If CAP rollout fails or acceptance fails, run exactly `cf rollback idts-sap01-srv --version 28 -f`, then require revision/readiness/bindings/routes parity.
- If dedicated UI deployment is partial or acceptance fails, run exactly `cf undeploy idts-user-admin-ui-r3c -f --retries 0 --abort-on-error` without `--delete-services`, then require the dedicated MTA absent and the existing HTML5 host still present.
- If UI fails after CAP succeeds, undeploy the dedicated UI MTA first, then rollback CAP to revision 28.
- Never deploy/execute `idts-sap01-db-deployer`; never run seed, `.hdbtabledata`, broad `cds deploy`, HANA DML, XSUAA update, broker enablement, user/role mutation, IAS/IPS/trust, Jira or Drive actions in M3C.

## Dependency limitation

The exact `gen/srv` production audit reports one inherited high and six moderate findings in the existing attachment/Google-storage transitive dependency chain. Root production dependency declarations are unchanged versus `origin/dev`; User Administration adds no production dependency. This remains a tracked baseline risk and is not silently remediated with `npm audit fix` during rollout.
