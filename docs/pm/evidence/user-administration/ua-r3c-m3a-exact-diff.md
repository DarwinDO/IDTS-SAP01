# UA-R3C M3A Exact-Diff Evidence

Status: `CONDITIONAL GO` for later M3B exact approval preparation. `NO-GO` for deployment, HDI execution, XSUAA update, role assignment or broker enablement in M3A.

## Frozen baseline

- Starting feature HEAD: `ba34f12d4dcef29e0de891096c8984e0b3eac620`.
- `origin/dev`: `0b694c4284e6a6b838ba3a2511d755bd01265a73`.
- Merge base equals `origin/dev`: PASS.
- M2 broker MTAR SHA-256: `44a3d3ce6e94ccc77072287cc1b12ea0604735c8dedd019e28d730ff67f6b668`.
- M2 independent post-deploy review: 0 Critical / 0 Major / 0 Minor; broker remains no-route and disabled by the reviewed artifact.

## Source manifest

| File | SHA-256 |
| --- | --- |
| `db/schema.cds` | `afa1515b8490e789e57cbad47099c2c2ab5c9536e0990aa276591522b975426c` |
| `db/data/idts.cap-UserOnboardingStatuses.csv` | `de9ac3be86a9a5115ca18e62a3eda0e7dd6acb2f7222a0b0d6bf3cb981f28469` |
| `srv/user-admin.cds` | `a2418cf5cfa9587a5e84b39c83007231d063c1745b981d81b752456b18c62116` |
| `srv/user-admin.js` | `8dd55534d7d10f20b41f9a0bf70cdb653d5c404b896a4c3e7fb1fa6ebbd55b1d` |
| `srv/auth/identity-map.js` | `dc826dd138914ed6d15b6459cffb7e708e90b7db6be48d9f283f3f82b12a7a53` |
| `srv/auth/platform-role.js` | `cde35848af4e69cf9a468cf735644df5ed7985d6c511cc083e9497a8449640b9` |
| `xs-security.json` | `ba0af175844647833fd11d893ee387a952326c6576c68eba5f8a6dad36bfd7b6` |
| `mta.yaml` | `7e544b85f0e76bc0170392868416b8048a7357c6513b1845bcfe5f7c22f3c869` |
| `mta.user-access-broker-r3b.yaml` | `bfce0e1f56d5861013a842dd545d130d123a9b4c6d0721ad3786a18ff1e6249a` |
| `app/user-administration-ui/webapp/manifest.json` | `1bcb5d692288a0438c903e2c3dd442788a884cd78237046df61a5b0dfc2b6925` |
| `app/user-administration-ui/xs-app.json` | `6f325d3caf4261dc3b727bba54babc61259c87af02dca69cb65e741e2d649805` |
| `app/user-administration-ui/webapp/controller/Main.controller.js` | `0951f6645328331668347c17d92a940ff9f059eab57069791d05289e36e04a03` |
| `app/user-administration-ui/webapp/fragment/ManageAccess.fragment.xml` | `b079607ac39e4e1a9ad6358b01d6ba7294b3fee7717e08546e331e0548d38619` |
| `scripts/qa/test-user-admin-ui.js` | `1d9336f0d41e6f6c5c0f19908fee06358dfe63e2dbb1c66d9de0ccc9acf10aaf` |
| `broker/lib/access-provisioning.js` | `e66a3877c37af165e895ccbf0f94b7d7aa85a86ce1bd77300dcc476a9a90bd99` |
| `broker/lib/sap-user-management-contract.js` | `d7ef0f15a4506a57938796a13d31c167fc4aebed8714b0bd9c81c8d124d97ac7` |
| `broker/runtime.js` | `1f84144e06f7a5a05dd74fd05f276c75d8179fb7985899d6a1a49ccb4c4b6ce0` |

## Local remediation

UI5 MCP found one deprecated property: `sap.m.Dialog.stretchOnPhone`. A focused assertion first failed against the old source. The property was removed without changing the dialog fields/actions. Fresh results:

- UI5 MCP linter: 0 findings.
- UI5 MCP manifest validation: valid, 0 errors.
- UI application `npm test`: PASS, exit 0.
- UI application `npm run build`: PASS, exit 0.
- Limitation: the project uses SAPUI5 `1.148.0`; UI5 MCP reports current LTS patch `1.148.8`. Dependency upgrade is outside M3A.

## CAP and security contract verification

- User onboarding security/programmatic: PASS.
- Onboarding callback page: PASS.
- User Administration UI contract: PASS.
- User access provisioning contract: PASS.
- Provisioning broker programmatic: PASS.
- Broker disabled-runtime contract: PASS.
- Immutable identity mapping: PASS.
- CAP EDMX compile for all services: PASS, exit 0.
- HANA CDS compile: PASS, exit 0.

The verified contract preserves exactly one PM/Tester/Developer business role. `UserAdmin` is a PM-only capability. Retry is limited to retryable failures; only an ambiguous provider outcome can enter reconciliation. CAP remains the state/audit authority; the broker owns the API credential and only allowlisted external reconciliation.

## Offline HANA generated delta

This is an offline `cds build --production` comparison, not an HDI simulation and not a deployment.

- Baseline generated HANA artifacts: 212 files.
- Candidate generated HANA artifacts: 226 files.
- Added: 14.
- Removed: 0.
- Changed: 1 (`idts.cap.Users.hdbtable`).
- Existing `Users` columns: 11; candidate: 15.
- Exact added nullable columns: `externalIdentityOrigin`, `externalIdentityIssuer`, `externalIdentitySubject`, `externalIdentityKeyHash`.
- Removed legacy columns: 0.

Added artifacts:

- `idts.cap.UserAccessOperations.hdbtable` and its idempotency index.
- `idts.cap.UserIdentityAuditEvents.hdbtable`.
- `idts.cap.UserOnboardingDeliveries.hdbtable` and its uniqueness index.
- `idts.cap.UserOnboardingRequests.hdbtable` and three uniqueness indexes.
- `idts.cap.UserOnboardingStatuses.hdbtable`.
- `idts.cap.Users.userExternalIdentity.hdbindex`.
- `UserAdministrationService.OnboardingRequests.hdbview`.
- `data/idts.cap-UserOnboardingStatuses.csv` and `.hdbtabledata`.

### M3B seed blocker

The generated `.hdbtabledata` would insert exactly 14 allowlisted User Administration lifecycle codes. Because seed mutation was not authorized in M3A, it is a hard stop for automatic deployment. M3B must explicitly approve or reject this exact 14-row code-list initialization; no other seed/table-data artifact may be deployed.

Both baseline and candidate builds emitted the same pre-existing `NonUpdateableProperties` warning for `BugService.Bugs_attachments`. It is not introduced by User Administration, but it remains a separate model warning.

## XSUAA semantic diff

- Baseline full descriptor SHA-256: `14ecdbda16093a9e207890016c581868553f51e1a31c5204623ea13b1460417b`.
- Candidate full descriptor SHA-256: `ba0af175844647833fd11d893ee387a952326c6576c68eba5f8a6dad36bfd7b6`.
- Scope additions: `$XSAPPNAME.UserAdmin`, `$XSAPPNAME.ProvisioningBroker`.
- Scope removals: 0.
- Role-template addition: `UserAdmin`.
- Role-template removals: 0.
- Role Collection addition: `IDTS_USER_ADMIN`.
- Role Collection removals: 0.
- Broker authority targets: exactly one, `$XSAPPNAME(application,idts-user-access-broker)`.

M3B must use the complete source and candidate descriptors plus these hashes. A partial JSON patch is not considered rollback-safe.

## Main MTA delta

- Baseline SHA-256: `f793ac925c59e450b5e0f675b03bf494bf4f28250d0af6d8dd71c513b403ae7d`.
- Candidate SHA-256: `7e544b85f0e76bc0170392868416b8048a7357c6513b1845bcfe5f7c22f3c869`.
- Candidate adds the User Administration HTML5 module and app-content ZIP input and points the managed XSUAA resource at the reviewed descriptor.
- M3A did not build/deploy the full main MTA and did not run its DB deployer.

## Final local gate

- Secret scan: PASS.
- Agent rules: PASS, 8 required rules.
- QA Depth self-test: PASS, 15/15.
- `git diff --check`: PASS; only line-ending warnings were emitted.
- Read-only BTP readiness: CAP/AppRouter 1/1, health 200, ready 200, anonymous protected API 401 expected, Web 200, `DEMO READY`.

## Mutation ledger

| Category | Count |
| --- | ---: |
| HDI simulate/make/deploy, seed, SQL/DML | 0 |
| XSUAA/Role Collection/role assignment | 0 |
| CAP/AppRouter/UI/broker deployment or restart | 0 |
| Broker enablement/provider operation | 0 |
| User/invitation/revoke operation | 0 |
| IAS/IPS/trust | 0 |
| Jira/Drive | 0 |

Local-only writes were limited to the approved design/plan/evidence, the UI5 compatibility fix/regression test, the matching knowledge mirror and mandatory DonHV issue log.

## Recommendation

`CONDITIONAL GO` to request an exact M3B review package covering:

1. HDI simulation and additive migration with the exact 14-row `UserOnboardingStatuses` initialization explicitly approved or removed.
2. Full XSUAA forward/rollback descriptor update.
3. Creation/readback of `IDTS_USER_ADMIN` and assignment to exactly the verified DonHV PM only.

Broker enablement, CAP/UI deployment and live provisioning remain later gates.
