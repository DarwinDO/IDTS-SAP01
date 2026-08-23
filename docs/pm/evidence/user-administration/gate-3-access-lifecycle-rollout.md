# Gate 3 Access Lifecycle — rollout and controlled acceptance

Date: 2026-08-21
Owner: DonHV
Merged source baseline: `9367abda9bdacfe989bd91cec7ae644ae1059a4c`
Rollout branch: `chore/wp8-gate3-access-lifecycle-rollout-donhv`

## Outcome

`PASS — AUTOMATED LIFECYCLE + INDEPENDENT TESTER BROWSER ACCEPTANCE`

The controlled linked TESTER completed the fail-closed suspension and provider-proof reactivation lifecycle. The final backend and PM-console readbacks show `ACTIVE`, exact business role `TESTER`, identity link `Yes`, pending operation `None`, and broker result `ROLE_COLLECTIONS_VERIFIED`. DonHV later completed the independent TESTER browser checks: User Administration returned `Forbidden`, while Bug Management rendered successfully and displayed the `Tester` role after reactivation.

## Independent TESTER browser closure

- The authenticated TESTER opened the User Administration URL and received `Forbidden`; the privileged PM + UserAdmin surface remained inaccessible.
- The same authenticated TESTER opened Bug Management successfully after provider-proof reactivation, and the user menu displayed role `Tester`.
- The PM console continued to show the controlled request `ACTIVE`, exact business role `TESTER`, identity link present, and no pending access operation.
- User-supplied screenshots were reviewed interactively but are not committed because they contain a full email and private application hostname. No password, OTP, cookie, JWT, callback code, or raw immutable identity tuple was captured.
- A separate screenshot taken during the short suspended interval was not retained. Fail-closed suspension remains proven by local `Users.active=false`, zero unrevoked custom sessions, the `SUSPENDED` request and audit, followed by the provider-readback-only reactivation path.

## Deployment and initialization boundary

- The additive `SUSPENDED` catalog row was initialized only after exact legacy-14 and zero-reference prechecks; the final catalog contains the expected 15 rows.
- Selective rollout used the merged `9367abd` source and did not deploy HDI, schema, seed, AppRouter, or unrelated UI content.
- CAP artifact: `idts-gate3-cap-9367abd-c3.zip`, SHA-256 `4CFD3847FE7980541E0B1564B37265ADEB3D6059509C487715C56A9149828EDF`.
- Broker artifact: `idts-gate3-broker-9367abd-c1.zip`, SHA-256 `4973B00B23164FA104E7D2292AE4C9103401C106FE21AED34B74719ABD4345A8`.
- User Administration UI MTAR: `idts-user-admin-ui-r3c_1.0.0.mtar`, SHA-256 `2BD1388EC7D797E3062EFE66B0F7CC1A70BEA31255446A80A5EBEF78A28D8C77`.
- CAP, broker, and UI source-parity/topology inspections passed before mutation. Broker remained no-route with the exact two existing bindings; main AppRouter and unrelated services were not changed.

## Controlled suspension

Controlled identity: one linked active TESTER; raw identity values are intentionally omitted from this committed evidence.

1. The first UI submission returned the generic safe error `The access change could not be queued. Reload the request and try again.`
2. Sanitized backend readback proved zero mutation: the user remained active and no `REQUEST_SUSPEND` audit existed.
3. After one full reload, DonHV approved exactly one bounded retry with reason `Gate 3 controlled acceptance: verify fail-closed suspend and provider-readback reactivation.`
4. UI returned `Access suspension was queued and local access was blocked.`
5. Sanitized backend readback proved linked TESTER count `1`, local `userActive=false`, exactly one `SUSPENDED` request, unrevoked custom-session count `0`, and exactly one `REQUEST_SUSPEND` audit.
6. The PM console persisted `Suspended`, identity link `Yes`, pending operation `None` after reload.

## Controlled reactivation

1. The PM opened `Reactivate Access` and used reason `Gate 3 controlled acceptance: restore access after verified provider-role readback.`
2. The UI warning correctly stated that access remained blocked until broker verification.
3. DonHV action-time confirmation queued the operation. The user-supplied screenshot is not committed because it contains a full email and private hostname; sanitized metadata is:
   - byte size: `57,447`;
   - SHA-256: `1E9AC6A09B99B3253C2DF50AA95A4BB9DD94DBB8F445C1CB56EB6260F492E5B9`;
   - visible allowlisted claims: access `Suspended`, role `TESTER`, identity link `Yes`, pending operation `None`, and toast `Reactivation was queued. Access remains blocked until provider readback succeeds.`
4. Sanitized operation-journal readback then proved one `REACTIVATE` operation, state `SUCCEEDED`, safe result `ROLE_COLLECTIONS_VERIFIED`, local `userActive=true`, role `TESTER`, onboarding request `ACTIVE`, and a completion timestamp.
5. A hard reload of the PM console showed `Active`, identity link `Yes`, pending operation `None`, and a new last-reconciled timestamp.

## Readiness recovery and final verification

The initial post-suspension readiness check showed CAP/AppRouter `1/1`, liveness `200`, protected anonymous API `401`, Web `200`, and HANA readiness `503`. The approved check-then-prepare workflow ran exactly once: it requested the supported HANA start, waited until readiness became `200`, restarted CAP exactly once to clear stale pooled connections, and did not run CDS/HDI deployment, migration, import, or seed.

Independent final `npm run btp:demo:check` result:

```text
CAP app:       PASS (1/1)
AppRouter:     PASS (1/1)
Liveness:      HTTP 200
DB readiness:  HTTP 200
Protected API: HTTP 401 (expected 401 without a session)
Web entry:     HTTP 200
DEMO READY
```

## Issues and limitations

- **Product/UI behavior under investigation:** the first Suspend submission showed a generic queue error but created no mutation; one reload and one bounded retry succeeded. No blind third attempt occurred.
- **Tooling issue, closed:** initial HANA readback code assumed lower-case result properties; HANA returned upper-case properties. The sanitized readback was corrected without changing business data.
- **Environment blocker, closed:** the CF token expired before readback. The reviewed clipboard-to-stdin SSO helper restored the default CF session without logging or persisting the temporary passcode.
- **Environment recovery, closed:** HANA readiness was `503`; the approved prepare workflow restored `200` and final `DEMO READY` without schema/data deployment.
- **Computer Use tooling issue, bounded:** Edge twice returned `coordinate input geometry is unavailable` at the final Reactivate confirmation. No operation was queued by those attempts; backend precheck proved zero `REACTIVATE` operations. DonHV clicked the already prepared confirmation manually, after which the operation succeeded.
- **Manual-evidence limitation, bounded:** post-reactivation Bug Management access and continued User Administration denial were freshly proven. No screenshot from the short suspended interval was retained; backend/session-revocation readback is the authoritative evidence for that interval.

## Mutation ledger

- One additive `SUSPENDED` status insert after exact prechecks.
- One selective CAP rollout, one selective broker rollout, and one User Administration UI content rollout using the frozen artifacts above.
- One successful controlled local suspension.
- One successful controlled reactivation queue followed by provider readback and local activation.
- One supported HANA start request and one CAP restart during readiness recovery.
- Zero HDI/schema/migration/import/seed, arbitrary Role Collection, SAP user creation/deletion, XSUAA/trust/IAS/IPS, Jira, Drive, or unrelated main-app mutation.

## Remaining acceptance

No Gate 3 lifecycle acceptance action remains. Gate 3 is closed with source, rollout, backend lifecycle, provider readback, persistence/reload, PM-console, independent TESTER Bug Management, and User Administration denial evidence. The missing suspended-interval screenshot remains a documented evidence limitation and does not authorize replaying the lifecycle or mutating user access again.
