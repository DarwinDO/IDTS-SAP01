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

Status: `READY_PENDING_DONHV_MANUAL`.

The first post-cutover readiness probe timed out. After CF control-plane connectivity briefly recovered, an initial sanitized V3 readback observed the CAP app requested `STARTED` with one desired web instance but zero running instances. The frozen rollback command was invoked once, but failed during its initial CF API GET and did not mutate the app. A later fresh readback proved CAP running `1/1`, followed by a complete `DEMO READY` result, zero active MTA operations, successful XSUAA/destination/Job Scheduler last operations, and unchanged CAP/AppRouter binding counts `7/3`; therefore no rollback was required.

The checksum-reviewed dedicated UI content MTAR was then deployed exactly once. MultiApps reported initial deployment of MTA `idts-user-admin-ui-r3c`, uploaded the single content module to the existing HTML5 host, skipped service deletion and finished successfully. The regional CF control plane and both AppRouter entry paths became unreachable again immediately afterward, so live content/readiness acceptance remains unproven. No second UI deploy or blind rollback was attempted.

Connectivity later recovered. A fresh readiness check returned CAP/AppRouter `1/1`, health/ready `200`, anonymous protected API `401`, Web `200` and `DEMO READY`; active MTA operations were zero. Read-only Edge verification through the existing PM session proved the new User Administration title, the three approved tabs, automatic Active Users loading, one controlled active TESTER row with a complete identity link, a read-only details dialog, restored Active Users tab/query after reload without duplicate loading, and an unaffected Bug Management list/filter surface. No browser write action or business-data mutation was performed. DonHV-owned Tester-negative and visual evidence remain pending.

- CAP deploy attempts/succeeded according to MultiApps: `1/1`.
- UI deploy attempts/succeeded according to MultiApps: `1/1`.
- Rollback command attempts: `1`; confirmed rollback mutations: `0`.
- Database/schema/data mutations: `0`.

Do not merge the PR until DonHV completes the manual Gate 2 acceptance. No forward deployment retry is required. Use the frozen UI rollback artifact only if a content-specific manual acceptance failure is reproduced while connectivity is healthy.
