# UA-R3C M3B Logical Backup and Restore Rehearsal

Date: 2026-08-15
Owner: DonHV
Scope: encrypted logical recovery for the pre-migration `Users` rows only

## Outcome

`PASS` for the bounded logical-recovery prerequisite.

- Source row count: `14`.
- Canonical digest prefix: `e7ccf9cd16a2`.
- HANA session-local restore count/digest: exact match.
- Local DPAPI/RSA decrypt count/digest: exact match.
- Encrypted envelope and DPAPI-protected private key: two ACL-restricted files outside the repository.
- Repository/evidence contains no backup ciphertext, private key, password hash, email, token, credential or raw HANA/CF response.

This evidence proves recovery of the reviewed eleven legacy `Users` fields. It is not a SAP HANA native backup and does not claim production suitability for `hana-free`.

## Security boundary

- RSA-3072 ephemeral key pair.
- AES-256-GCM row-envelope encryption.
- RSA-OAEP-SHA256 key wrapping.
- Private key stored only as Windows DPAPI CurrentUser ciphertext.
- Private directory inheritance disabled; only the current Windows principal and SYSTEM have access.
- Temporary CF app had no route and exactly one HDI binding.
- Runtime HDI `user`/`password` selected instead of deployment-owner credentials.
- Exact eleven-column allowlist; no bug, comment, attachment, outbox or onboarding rows selected.
- HANA rehearsal used a `LOCAL TEMPORARY COLUMN TABLE` without a primary key, as required by the SAP HANA SQL contract. The table disappeared when the task connection ended.

## Execution and corrections

1. Local crypto, HANA-adapter and DPAPI custody tests passed.
2. The first task request produced no task because `cf push --no-start` had no current droplet. The package was explicitly staged and its exact owned droplet was assigned.
3. Fixed-stage diagnostics then identified, without raw error output:
   - catalog discovery unavailable;
   - unquoted HANA physical identifiers require uppercase;
   - logical export must use the runtime HDI principal;
   - local temporary column tables do not support primary keys.
4. Each correction was source-tested before a new package/droplet was selected.
5. Task `g7` completed successfully and emitted exactly one safe metadata marker and one encrypted envelope marker.
6. Local verifier independently decrypted the envelope and reproduced the same nonzero count/digest prefix.
7. The first exact app deletion returned nonzero. Readback proved zero running tasks and the HDI binding already absent; one second exact-name delete succeeded.

## Final readback

- Temporary app count: `0`.
- Temporary HDI binding present: `false`.
- CAP: `1/1`.
- AppRouter: `1/1`.
- `/health`: `200`.
- `/ready`: `200`.
- Anonymous protected API: `401` expected.
- Web: `200`.
- Result: `DEMO READY`.

## Gate consequence

The prior `hana-free` recoverability blocker is closed only for this exact additive `Users` migration through the encrypted logical recovery package. A real HDI make must still use the already simulated schema-only allowlist, exclude all CSV/`.hdbtabledata`, preserve the fourteen source rows, and stop on any destructive or unrelated delta.
