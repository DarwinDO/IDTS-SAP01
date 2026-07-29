# IDTS-115 selective SAP BTP deployment verification

## Baseline

| Item | Value |
| --- | --- |
| Git merge SHA | `4fa1eaa45a7e56c71ea628127ebf9172ef02c14e` |
| Source PR | GitHub PR `#221` |
| MTAR | `idts-sap01-idts115-create-binding-4fa1eaa.mtar` |
| MTAR size | `33,981,854` bytes |
| MTAR SHA-256 | `2D7D171F5B720A3AFB16A8E1047BC2A190EBF5CCEAF58D321F25D7084E338820` |

## Deployment operations

| Operation | Scope | Result |
| --- | --- | --- |
| `4c043dd4-8b65-11f1-a222-eeee0a800734` | App content only; rejected as incomplete acceptance baseline because CAP serves compiled annotation metadata | `FINISHED` |
| `55ec724e-8b66-11f1-a222-eeee0a800734` | `idts-sap01-srv` plus `idts-sap01-app-content` | `FINISHED` |

The HDI deployer was not run. No broad `cds deploy`, HANA schema migration or
seed reload was performed.

## Runtime checks

| Check | Result |
| --- | --- |
| `idts-sap01-srv` | `started`, `1/1 running` |
| `idts-sap01-approuter` | `started`, `1/1 running` |
| Service `/health` | HTTP `200` |
| Anonymous AppRouter request | HTTP `302` to XSUAA |
| Web errors during controlled `BUG-0022` test window | No matching entries |
| Read-only HANA task | PASS |

## Package annotation check

A bounded, read-only task inspected the deployed
`/home/vcap/app/srv/odata/v4/BugService.xml`.

- The Defect Category value help contains no output mapping to
  `componentCategory_ID`.
- The remaining reference belongs to the Assignee value help input and is
  required for assignable-developer filtering.

No credential, binding value, private environment variable or database
connection string was printed or stored.
