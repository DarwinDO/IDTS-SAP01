# Gate 2 Active Users selective rollout

Date: 2026-08-20 (Asia/Bangkok)

## Frozen inputs

- Source head: `f0818cdf179e0594d7719336973105442b278983`.
- Source base: `96746fef148d6d6b9627ed1e8b9be5b28eb94e81`.
- Main MTAR SHA-256: `D9DD3B8DD46261870C2B206ECECC20337DDFA987A5E7F57DE9EB1F204EA40729`.
- Dedicated UI MTAR SHA-256: `180E7FCC5F1F574E625FA01FD620962C617C5E689FBD6B3EE25B792EB27E5F0C`.
- UI rollback MTAR SHA-256: `A7FB892F2079C592C665704905A271A7B966B72E233A5AF32F7B716D0C3661C2`.

Artifact inspection proved that the dedicated UI content contains both Bug Management and User Administration UI ZIPs and references only the existing HTML5 repository host. The selected forward CAP module is `idts-sap01-srv`; the database deployer and AppRouter were not selected. The packaged CAP JavaScript hashes for the Active Users handler and User Administration service implementation match the reviewed source.

## Pre-state

- Runtime readiness: `DEMO READY`.
- CAP and AppRouter: started `1/1`, one route each.
- CAP bindings: seven reviewed existing service names; AppRouter bindings: three.
- Shared XSUAA: one healthy instance, two bindings.
- HTML5 host: one healthy instance, two bindings.
- Main MTA: one; dedicated Gate 2 UI MTA: zero.
- Active MTA operations: zero.

## Forward CAP operation

Exactly one `cf deploy` selected module `idts-sap01-srv` with blue-green strategy, version rule `ALL`, zero retries and abort-on-error. The idle app passed `/health=200`, `/ready=200` and anonymous protected API `401` before the operation was resumed. MultiApps then completed the blue-green cutover and reported `Process finished`.

Although only the CAP module was selected, MultiApps processed its required managed resources and issued same-descriptor updates for destination, XSUAA and Job Scheduler. No database deployer, HDI make, seed, DML, IAS/IPS, user, role, provider, Jira or Drive operation was selected.

## Current state

Status: `BLOCKED_NETWORK_READBACK`.

The first post-cutover readiness probe timed out. Subsequent sanitized CF API readback and direct application-route readback also timed out from the same client. Because both control-plane and data-plane connectivity are unavailable, the result is ambiguous and must not be classified as an application defect without a fresh readback.

- CAP deploy attempts/succeeded according to MultiApps: `1/1`.
- UI deploy attempts: `0`.
- Rollback attempts: `0`.
- Database/schema/data mutations: `0`.

Do not deploy the UI, merge the PR or begin manual acceptance until a fresh read-only check proves CAP/AppRouter `1/1`, health/ready `200`, anonymous protected API `401`, Web `200`, service operations succeeded and no active MTA operation remains. Do not retry the CAP deployment blindly.
