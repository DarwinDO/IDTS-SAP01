# User Administration Logical Backup Design

Status: APPROVED by DonHV through `GO LOGICAL BACKUP GATE`. This design authorizes only encrypted logical backup and restore rehearsal. It does not authorize real HDI migration until every acceptance check passes.

## Goal

Create a recoverable, encrypted logical copy of the live legacy `idts_cap_Users` rows because the SAP HANA Cloud `hana-free` plan has no backup, recovery, or snapshot feature.

## Options considered

1. **Permanent backup table in the same HDI container — rejected.** It remains in the same failure domain and introduces an unmanaged artifact.
2. **Encrypted logical export plus temporary-table restore rehearsal — selected.** It leaves no permanent HANA object, keeps plaintext inside process memory, and produces an off-platform encrypted artifact.
3. **Upgrade to paid HANA — unavailable for this trial subaccount.** SAP documents that a trial free-tier instance cannot be upgraded to productive tier.

## Data boundary

Backup exactly the 11 legacy columns that exist before migration:

`ID`, `createdAt`, `createdBy`, `modifiedAt`, `modifiedBy`, `displayName`, `email`, `role_code`, `passwordHash`, `passwordChangedAt`, `active`.

The four new external identity columns are intentionally absent and will remain null after an emergency restore. No Bug, attachment, comment, outbox, onboarding, audit, or broker table is read.

## Security boundary

- Use the existing HDI binding only on one exact no-route temporary app.
- Do not use `cf env`, service keys, raw binding output, SQL console output, or browser credentials.
- Generate an ephemeral RSA-3072 key pair locally.
- Package only the public key with the task.
- Encrypt canonical JSON with a random AES-256-GCM key and encrypt that key with RSA-OAEP-SHA256.
- Protect the private key locally with Windows DPAPI CurrentUser and an exact ACL-restricted private-backup directory.
- Never print or commit plaintext rows, email, password hash, private key, AES key, binding credentials, raw endpoint, or full digest.
- Logs may contain only fixed event codes, row/column counts, digest prefix, ciphertext envelope, and PASS/FAIL.

## Rehearsal

In the same authenticated HANA session, create one local temporary column table with the 11 legacy fields, insert all in-memory rows, select them back, canonicalize them, and require equal row count and SHA-256. Disconnecting removes the temporary table. Any unsupported DDL, partial insert, mismatch, or cleanup ambiguity fails the gate.

Local verification decrypts the captured envelope using the DPAPI-protected private key and independently recomputes the same count and digest. The encrypted envelope and DPAPI blob remain outside Git in the private backup directory.

## Acceptance

- Live source row count is nonzero and stable across read/rehearsal.
- Exactly 11 allowlisted columns are present in every row.
- HANA temporary-table rehearsal count/hash equals source count/hash.
- Local decrypt count/hash equals source count/hash.
- Ciphertext and private-key blobs are nonempty and parseable; no plaintext/credential appears in repo, logs, command arguments, or evidence.
- Temporary app, task, route, and binding are absent after cleanup.
- Main runtime returns `DEMO READY`.

Only after all conditions pass may the separately reviewed schema-only real HDI migration proceed.
