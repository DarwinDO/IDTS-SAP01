# UA-R3C M3B — Additive HANA schema and onboarding-status initialization

Date: 2026-08-15
Owner: DonHV
Classification: controlled HANA mutation evidence

## Outcome

- Additive HDI schema make: **PASS**.
- Legacy `Users` preservation: **PASS** — 14 rows before/after, all four new external-identity fields remain null for all 14 legacy rows.
- New operational tables after schema make: **PASS** — all five existed and were empty.
- `UserOnboardingStatuses` exact initialization: **PASS** — exactly 14 allowlisted rows, digest prefix `9fad25a9795b`.
- Temporary CF apps/routes/bindings after cleanup: **ABSENT**.
- Main runtime after cleanup: **DEMO READY**.

## Exact mutation boundary

The HDI make deployed only the reviewed additive schema artifacts. It excluded every CSV and `.hdbtabledata` artifact, DB seed, broad `cds deploy`, destructive conversion, drop, truncate, and delete operation.

The separate catalog initializer:

- targeted only `IDTS_CAP_USERONBOARDINGSTATUSES`;
- accepted only the 14 checked-in status values;
- rejected unknown, duplicate, or conflicting rows;
- used parameterized inserts inside one transaction;
- performed read-after-write exact comparison before commit;
- rolled back on any mismatch;
- was independently re-read by an inspect-only task after commit.

## Sanitized evidence matrix

| Check | Result |
| --- | --- |
| Schema make task | `SUCCEEDED` |
| Aggregate schema postcheck | `PASS` |
| Legacy Users | 14 |
| Legacy rows with all four identity fields null | 14 |
| UserAccessOperations after schema make | 0 |
| UserIdentityAuditEvents after schema make | 0 |
| UserOnboardingDeliveries after schema make | 0 |
| UserOnboardingRequests after schema make | 0 |
| UserOnboardingStatuses before exact init | 0 |
| Status initializer task | `SUCCEEDED` |
| Status rows after exact init | 14 |
| Post-init exact catalog comparison | `PASS` |
| Temporary migration/initializer apps after cleanup | 0 |
| CAP/AppRouter | 1/1 and 1/1 |
| `/health` / `/ready` / Web | 200 / 200 / 200 |
| Anonymous protected API | 401 expected |

## Recovery evidence

Before the schema mutation, the 14-row legacy `Users` projection was exported into an AES-256-GCM envelope whose data key was wrapped with RSA-OAEP-SHA256. The private key is protected with Windows DPAPI CurrentUser and restrictive ACL outside the repository. A session-local HANA restore rehearsal reproduced the same row count and digest prefix. No plaintext row, email, password hash, private key, token, or service credential was written to repository evidence.

## Tooling findings

The session logged and corrected these test/environment issues in `docs/pm/status/donhv.md`:

- uppercase CDS-generated physical identifiers;
- runtime HDI principal boundary;
- local temporary column-table primary-key incompatibility;
- CF stage/current-droplet distinction;
- missing generated dependency closure;
- CF task command/process selection;
- first-delete partial cleanup behavior;
- sanitized CLI wrapper parsing mistakes.

None of these findings changed main applications, shared XSUAA, business rows, IAS/IPS, trust, Role Collections, Git history, Jira, or Drive.
