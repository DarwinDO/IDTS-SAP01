# IDTS-113 — Final HANA container and user-classification readback

Date: 2026-07-28

Executor: DonHV / Codex support
Scope: read-only HANA/HDI identification and sanitized `Users` readback

## Purpose

Confirm that the migrated IDTS data is stored in the final application HDI
container, not in the earlier proof-of-concept container, and explain why
`@example.local` identities are still visible.

## Container distinction

| Container | Purpose | Expected identity data |
| --- | --- | --- |
| `idts-113-btp-cloud-foundry-poc-donhv-db` | Earlier isolated proof of concept | Seed/demo identities may remain |
| `idts-sap01-db` | Final HDI container bound to `idts-sap01-srv` | Migrated Render business data |

The final container initially had no Database Explorer service key. A
container-scoped key was created without printing credentials. HANA Database
Explorer then listed and added `idts-sap01-db`.

Database Explorer displayed a transient service-key retrieval message while
its own key was being created. Both relevant keys subsequently reported
`create succeeded`. After reload, Explorer recognized the final container.
Expanding its object tree then raised a HANA tooling security-audit error.
This is an Explorer/environment limitation, not evidence of missing or
corrupted data.

## Sanitized application-context readback

A one-off Cloud Foundry task ran inside the already bound
`idts-sap01-srv` application context. The task selected only `displayName`,
identity-domain classification, business role and active state. It did not
print full e-mail addresses, passwords, tokens, service-key values or HANA
connection details.

Task result: `SUCCEEDED`.

| Classification | Count |
| --- | ---: |
| Total users | 14 |
| Approved FPT member identities | 3 |
| Synthetic demo identities (`@example.local`) | 10 |
| Other approved identity | 1 |

| Member | Identity classification | Business role | Active | Result |
| --- | --- | --- | ---: | --- |
| DatDT | FPT | `DEVELOPER` | 1 | PASS |
| NhanT | FPT | `TESTER` | 1 | PASS |
| SangVN | FPT | `DEVELOPER` | 1 | PASS |
| DonHV | Other approved identity | `PM` | 1 | PASS |

The ten `@example.local` rows belong to the synthetic developer workload pool
created for assignment and monitoring demonstrations. They are expected test
data and were intentionally preserved during migration. They are not the
SangVN, DatDT or NhanT member identities.

## Safety and conclusion

- No HANA `INSERT`, `UPDATE`, `DELETE` or deployment was executed.
- No Render/PostgreSQL data was changed.
- No credential or full private e-mail address was written to this evidence.
- The final migrated database is `idts-sap01-db`.
- The three requested team identities are present in the final HANA data with
  their approved FPT identity classification and expected active roles.
- Seeing `@example.local` is normal only for the ten synthetic demo developers.
