# UA-R3C M3B XSUAA Execution Evidence

Date: 2026-08-15  
Source HEAD: `1702f650d94f119a3f6893cfddd743b6b0ca7e68`  
Scope: XSUAA `UserAdmin`/`ProvisioningBroker` overlay and one selected existing PM assignment only.

## Outcome

- XSUAA overlay update: `PASS` after one rejected no-apply attempt and one corrective successful attempt.
- `IDTS_USER_ADMIN`: exists exactly once, read-only/provider-owned, and references exactly one `UserAdmin` role.
- Selected existing PM: active; retained `IDTS_PM`; role count changed from 8 to 9 by adding only `IDTS_USER_ADMIN`.
- Other sap.default users receiving the overlay: 0.
- User count before/after: 4/4. No shadow user was created because assignment used `--create-user-if-missing false`.
- Runtime after mutation: `DEMO READY` with CAP/AppRouter 1/1, `/health` 200, `/ready` 200, anonymous protected API 401 as expected, and Web 200.
- Broker remains no-route and no broker enablement or provisioning operation was performed.

## Exact Descriptor Authority

The first candidate was the standalone `xs-security.json` Git blob. SAP rejected it before applying any security artifact because `xsappname` is supplied by MTA resource configuration rather than the standalone file. That incomplete descriptor is `REJECTED / NEVER EXECUTE`:

- Incomplete candidate SHA-256: `61db536c3c66b053189a4537dbf6864be87be3607803f840144ad18fe38b73e0`.

The corrective full descriptor preserved the supported live readback of `xsappname`, tenant mode, and the complete OAuth configuration, then overlaid only the reviewed source scopes/templates/Role Collection. Values containing runtime/private routing information were never printed or committed.

- Corrective full candidate SHA-256: `2270b65fb9b05670488fbd3fa5c0bf7995151958f7aa48ee11fbc28044b2b74a`.
- Full rollback descriptor SHA-256: `b4543d1ad40eb0aa030ecb7973995211ab7a8a5c66d412b225b4e1d67406b8e0`.
- Original PM role-set fingerprint: `e0c770a7ea43` (8 roles).
- Post-assignment role-set fingerprint: `a8c3e68a3372` (9 roles).

## Mutation Ledger

| Mutation | Attempts | Confirmed success | Result |
| --- | ---: | ---: | --- |
| Main XSUAA update with incomplete standalone descriptor | 1 | 0 | Broker validation rejected; no apply |
| Main XSUAA corrective full-descriptor update | 1 | 1 | Update/readback PASS |
| `IDTS_USER_ADMIN` assignment to selected existing PM | 1 | 1 | Assignment/readback PASS |
| Shadow-user creation | 0 | 0 | Prohibited |
| CAP/UI/HANA/HDI deploy or mutation | 0 | 0 | Prohibited |
| Broker enablement/provider operation | 0 | 0 | Prohibited |
| IAS/IPS/trust/user mutation | 0 | 0 | Prohibited |

The approved transport exception used one ACL-restricted, unpredictable temporary full-descriptor file. Its content/path was not printed or committed. Cleanup overwrote and removed it; final exact-prefix inventory count was 0. One reporting wrapper failed after the first cleanup because it attempted to store an undefined orchestration value; the subsequent absence check proved the file had already been removed.

## Deferred Acceptance

This gate proves configuration and assignment readback only. A fresh browser session is still required to prove the new JWT contains `UserAdmin`; old sessions do not automatically gain the new scope. CAP/UI deployment, HANA migration, broker enablement and live user provisioning remain separate gates.
