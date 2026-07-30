# IDTS-115 SAP BTP deployment verification

Date: 2026-07-29  
Merge SHA: `ae209c8f82227e4dedca09247db96c0b47097d92`

## Artifact

| Field | Value |
| --- | --- |
| MTAR | `idts-sap01-idts115-ae209c8.mtar` |
| SHA-256 | `A167369F0547DDC6F105D4B61C5BBB5304352FB630D5A9D2FD5FDF5CB8E69DE2` |
| MTA operation | `b94589a8-8b2c-11f1-b8e3-eeee0a9f900a` |
| Service droplet | `b964ec03-e8b9-4e4e-a1da-b246b7b29c59` |
| AppRouter droplet | `09a723a6-6584-4aa5-b867-1ede1c3f6952` |

## Selective rollout

Deployed modules:

- `idts-sap01-srv`
- `idts-sap01-app-content`
- `idts-sap01-approuter`

Not deployed:

- `idts-sap01-db-deployer`

No broad `cds deploy`, schema migration or seed reload was executed.

## Runtime checks

| Check | Result |
| --- | --- |
| Service requested state | started |
| Service instances | 1/1 running |
| AppRouter requested state | started |
| AppRouter instances | 1/1 running |
| Health endpoint | HTTP 200 |
| Anonymous AppRouter request | HTTP 302 to XSUAA |
| Active MTA operation after rollout | none |
| New crash/HTTP 5xx in tested UI flows | none observed |

The existing CAP attachment vocabulary warning and outbox deprecation warning were not introduced by IDTS-115.
