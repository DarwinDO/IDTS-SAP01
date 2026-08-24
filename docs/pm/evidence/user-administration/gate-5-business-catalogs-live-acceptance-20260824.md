# Gate 5 Business Catalogs live acceptance — 2026-08-24

## Scope and authority

This record covers the approved additive catalog-view recovery, selective CAP-only rollout, controlled PM catalog lifecycle, controlled TESTER authorization-negative browser check, cleanup and final readiness. It does not authorize seed data, hard delete, arbitrary catalog mutation, XSUAA/IAS/IPS/provider/user/role/email changes, or Gate 6.

## Additive HANA view recovery

- Exact R5 view-only archive: `mta_archives/idts-gate5-business-catalog-view-hdi-r5.zip`.
- SHA-256: `58CAC288802E762AD9F5C3B50FBF1FEEE9B1A38C52B833074105B9FCA293E13E`.
- Payload: exactly four User Administration catalog `.hdbview` artifacts; no table, index, CSV, `.hdbtabledata`, seed or unrelated HDI artifact.
- Simulation: deploy `4`, undeploy `0`, dependent artifacts `0`, warnings `0`.
- Real make: deploy `4`, undeploy `0`, dependent artifacts `0`, warnings `0`.
- Encrypted pre/post logical backups matched for all four catalog datasets. Counts remained `4 / 8 / 8 / 31`, total `51`; duplicate groups remained `0`.
- Temporary no-route HDI app was unbound and removed; existing HDI service remained unchanged.

## Selective CAP artifacts

All artifacts preserved Node `22.x`, the accepted package and lock, 100 ZIP entries, zero HDI artifacts and zero `node_modules` entries. They changed only the named generated/runtime files relative to the immediately preceding accepted artifact.

| Artifact | SHA-256 | Purpose |
| --- | --- | --- |
| `idts-gate5-cap-5e3d13e-f5-association-write.zip` | `CE7FB9E1CCE216E8D1755941E77CD1221716A7DDDB7BBE988D672AF2C3F310C6` | Expose writable component and defect-category associations so OData foreign keys persist. |
| `idts-gate5-cap-5e3d13e-f6-update-key.zip` | `640C8536430D932DAADC28543378BCDFDBDD8DAE5D4B67D9F306CEA1EE196080` | Accept a framework-normalized key equal to the route key while rejecting any mismatched target key. |
| `idts-gate5-cap-5e3d13e-f7-reason-input.zip` | `4B8852F461576D73D24D3B671B177B0EE8A41874717302A969C690FA0D0CE19F` | Mark the transient administration reason writable so UI5 sends deactivation justification. |

Each artifact was uploaded as a new package, staged once, assigned only to `idts-sap01-srv`, and followed by one restart. Final CAP readback is `1/1`, route count `1`, binding count `7`. AppRouter was not redeployed or reconfigured.

## Runtime defects found and corrected

1. Component Category CREATE initially failed with HANA `COMPONENT_ID` null. The service projection used association-path aliases; CAP did not translate those aliases into writable association foreign keys. The projection now exposes the associations, while OData continues to expose `component_ID` and `defectCategory_ID`.
2. Component Category UPDATE was blocked by an immutable-ID guard because CAP normalized the unchanged target key into the CQN. Equality is now accepted; route/payload mismatch remains fail-closed with `CATALOG_ID_IMMUTABLE`.
3. Deactivation reason was not sent because the transient virtual property was implicitly `Core.Computed`. The four catalog projections now explicitly mark this command field `Core.Computed=false`; it remains non-persistent.
4. A read-only aggregate HANA diagnostic returned blocked transaction count `0`, ruling out a database-lock recovery action.

## Controlled PM acceptance

Controlled rows used unique Gate 5 codes/names. No baseline row was edited.

- SAP Module CREATE: PASS.
- Application Component CREATE: PASS.
- Defect Category CREATE: PASS.
- Component Category CREATE: PASS after F5.
- Component Category UPDATE: PASS after F6.
- Impact readback before deactivation: referenced Bugs `0`, active Developer responsibilities `0`, active dependent catalog items `0`.
- Component Category deactivate → reactivate → final deactivate: PASS after F7.
- Application Component final deactivate: PASS.
- Defect Category final deactivate: PASS.
- SAP Module final deactivate: PASS.
- Hard delete attempts: `0`.
- Final controlled-row state: all four rows retained as inactive for history/audit.

## Controlled TESTER authorization boundary

- A fresh controlled TESTER session opened Bug Management successfully and rendered the Bug list; the profile showed the `Tester` business role.
- In the same authenticated session, direct navigation to User Administration returned `Forbidden`.
- The two screenshots were reviewed as human acceptance evidence but are not committed because they contain the controlled account identifier.
- No role, user, provider, catalog or business-data mutation was performed by this browser check.

## Fresh verification

- Catalog model/runtime contracts: PASS.
- User Administration UI contract: PASS.
- User onboarding contracts: PASS.
- Developer pilot contract: PASS.
- Secret scan: PASS.
- Agent rules: PASS (`8/8`).
- QA Depth self-test: PASS (`15/15`).
- CAP EDMX and HANA compile: PASS; only the pre-existing attachment vocabulary warning remains.
- User Administration UI lint/build: PASS.
- Final `npm run btp:demo:check`: `DEMO READY` — CAP/AppRouter `1/1`, liveness/readiness `200`, anonymous protected API `401`, Web `200`.

## Mutation ledger

| Mutation | Confirmed |
| --- | ---: |
| View-only HDI simulation | 1 |
| View-only real HDI make | 1 |
| Selective CAP package/stage/set/restart revisions | 3 |
| Controlled catalog creates | 4 |
| Controlled Component Category updates | 1 |
| Controlled deactivate/reactivate/final-deactivate lifecycle | 1 |
| Controlled parent final deactivations | 3 |
| Hard delete / seed / unrelated data mutation | 0 |
| UI/AppRouter/XSUAA/IAS/IPS/provider/user/role/email/Jira/Drive mutation | 0 |

## Verdict

Gate 5 Business Catalogs additive schema/view rollout, controlled PM lifecycle acceptance and controlled TESTER authorization-negative browser check are **PASS** for the reviewed dev POC boundary. Gate 6 is not opened by this result.
