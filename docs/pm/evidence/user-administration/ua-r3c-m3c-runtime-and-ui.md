# UA-R3C M3C Runtime and UI Evidence

Date: 2026-08-15  
Owner: DonHV  
Classification: controlled SAP BTP trial rollout evidence

## Outcome

- Main CAP selective deployment: PASS after bounded blue-green recovery.
- User Administration HTML5 content deployment: PASS.
- PM + UserAdmin browser access through `sap.default`: PASS.
- Main runtime readiness after all mutations: `DEMO READY`.
- Broker enablement and live provider provisioning: NOT PART OF M3C and remains disabled.

## Frozen artifacts

| Artifact | SHA-256 | Scope |
| --- | --- | --- |
| `idts-sap01-user-admin-m3c-deb779e.mtar` | `b087f301e8ce6567f9ba85cacf0bfabd2cc4fbf2611bcf89c7fdd43de2255583` | selective `idts-sap01-srv` module only |
| `idts-user-admin-ui-r3c-deb779e.mtar` | `7eab5a2ca06f90ace8af2f332896903bb722c54706e381118f41ba4a1b9ff77c` | dedicated User Administration HTML5 content only |

## Mutation ledger

1. One selective main CAP blue-green deploy was submitted for module `idts-sap01-srv`; database deployer, AppRouter, UI content, and managed resources were not selected.
2. The completed operation left `-live` and `-idle` apps instead of restoring the canonical app name. UI deployment stopped while the state was investigated.
3. Both variants proved `health=200`, `ready=200`, anonymous protected API `401`, and six bindings. The new idle variant was promoted using exact route/app names only:
   - productive route mapped to the new variant;
   - productive route removed from the old variant;
   - isolated old variant deleted after sanitized readback;
   - new variant renamed to canonical `idts-sap01-srv`;
   - exact temporary idle route unmapped and deleted.
4. One dedicated HTML5 content deploy was submitted for module `idts-user-admin-ui-r3c-content`.
5. No DB deployer, HDI make, seed, schema migration, SQL/DML, AppRouter deploy, XSUAA update, broker enablement, IAS/IPS/trust, user/role assignment, Jira, or Drive mutation occurred in M3C.

## Final sanitized runtime matrix

| Check | Result |
| --- | --- |
| Canonical CAP app | STARTED, 1 route, 6 bindings |
| Suffixed CAP apps | absent |
| Main AppRouter | STARTED, 1 route, 3 bindings; revision baseline unchanged |
| `/health` | HTTP 200 |
| `/ready` | HTTP 200 |
| Anonymous protected API | HTTP 401, expected |
| Web/AppRouter | HTTP 200 |
| MTA active operations | 0 after UI deploy |
| Provisioning broker topology | STARTED, no route, 2 approved bindings; still disabled by the reviewed deployment contract |

## Fresh final verification

- `npm run qa:user-access:programmatic`: PASS.
- `npm run qa:user-access-broker:programmatic`: PASS.
- `npm run qa:user-admin-ui:programmatic`: PASS.
- `npm run qa:user-onboarding:programmatic`: PASS.
- `npm run qa:user-onboarding-page:programmatic`: PASS.
- User Administration UI lint/test/build: PASS.
- CAP compile and HANA compile: PASS.
- Secret scan: PASS.
- Agent rules: 8/8 PASS.
- QA-depth self-test: 15/15 PASS.
- `git diff --check`: PASS.
- Final `npm run btp:demo:check`: `DEMO READY`.

## Browser acceptance

- DonHV's existing SAP ID session selected `Default Identity Provider` (`sap.default`).
- Page title: `User Administration`.
- Allowlisted visible controls: `Invite User`, `Role`, and `Status`.
- The browser tab is left open for DonHV.
- No email, user row, cookie, token, JWT, OAuth code, immutable identifier, or secret was copied into this evidence.

## Limitations and remaining gate

- A direct `$metadata` tab was blocked by the Edge client before navigation; this is not recorded as a CAP response. UI loading and visible controls are the accepted browser proof for M3C.
- PM-without-UserAdmin, Tester, Developer, and direct-API negative browser cases still require separately controlled identities.
- The provisioning broker remains no-route and disabled. A controlled non-member SAP ID plus a separate M3D enablement/provider-operation gate is required before claiming end-to-end role assignment or revoke against SAP BTP.

## Tooling notes

- OfficeCLI preflight: `1.0.144`; it cannot semantically validate Markdown or SAP BTP state.
- Browser control was used only for sanitized UI acceptance. Full login DOM snapshots were discontinued after they exposed authorization-link query parameters in transient tool output; those values were not persisted.
- SAP CAP/Fiori/UI5 MCP servers were not invoked during this deployment-only gate; source artifacts were already frozen and locally verified before M3C.
