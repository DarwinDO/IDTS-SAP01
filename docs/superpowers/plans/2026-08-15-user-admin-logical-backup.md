# User Administration Logical Backup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce and rehearse an encrypted logical backup of the live legacy `Users` rows without exposing plaintext, credentials, or persistent HANA backup objects.

**Architecture:** A no-route CF task reads exactly 11 legacy columns through its existing HDI binding, encrypts canonical JSON using an ephemeral public key, and validates reconstruction in a session-local HANA temporary table. A local verifier decrypts the envelope with a DPAPI-protected private key and compares safe count/hash evidence.

**Tech Stack:** Node.js 22, `hdb` 2.29.6, Node `crypto`, Windows DPAPI CurrentUser, Cloud Foundry task runtime.

## Global Constraints

- No `cf env`, service key, credential output, raw endpoint, plaintext row, full PII, JWT, cookie, or private key output.
- Exactly one no-route temporary app, one HDI binding, one backup task, and exact-name cleanup.
- Zero permanent database object, zero DML against business tables, zero CSV/`.hdbtabledata`, zero HDI make.
- Real migration remains blocked unless encrypted export, HANA temp restore, local decrypt, cleanup, and readiness all PASS.

---

### Task 1: Crypto and canonical backup contract

**Files:**
- Create: `scripts/btp/user-admin-logical-backup-contract.js`
- Create: `scripts/qa/test-user-admin-logical-backup.js`

**Interfaces:**
- Produces `canonicalizeRows(rows)`, `encryptBackup(rows, publicKey)`, `decryptBackup(envelope, privateKey)`, and exact `LEGACY_COLUMNS`.

- [ ] Write tests that reject missing/extra columns, unstable row order, invalid envelopes, modified authentication tags, and non-RSA keys.
- [ ] Run the test and require RED because the contract module is absent.
- [ ] Implement only deterministic canonicalization and RSA-OAEP/AES-GCM envelope encryption/decryption.
- [ ] Run the focused suite and require PASS.

### Task 2: Bound HANA backup and temporary restore rehearsal

**Files:**
- Create: `scripts/btp/run-user-admin-logical-backup.js`
- Modify: `scripts/qa/test-user-admin-logical-backup.js`

**Interfaces:**
- Consumes the crypto contract and one exact HDI binding from `VCAP_SERVICES`.
- Produces fixed safe metadata and one base64 ciphertext envelope.

- [ ] Add RED tests for ambiguous bindings, empty source, wrong column set, partial insert, hash mismatch, and forbidden log fields.
- [ ] Implement exact binding resolution and parameterized query for the 11 columns.
- [ ] Create a session-local temporary table, insert/read back all rows, compare canonical count/hash, and disconnect in `finally`.
- [ ] Emit only `IDTS_UA_BACKUP_META` and `IDTS_UA_BACKUP_ENVELOPE` markers.
- [ ] Run focused tests and syntax checks.

### Task 3: Local key custody and verifier

**Files:**
- Create: `scripts/btp/user-admin-logical-backup-key.ps1`
- Create: `scripts/btp/verify-user-admin-logical-backup.ps1`
- Modify: `scripts/qa/test-user-admin-logical-backup.js`

- [ ] Add RED static/behavior checks for RSA-3072, DPAPI CurrentUser, ACL restriction, no private key in arguments/logs, and exact envelope verification.
- [ ] Generate the ephemeral key in memory, write only the public key to generated staging, and write only a DPAPI blob to the private directory.
- [ ] Verify ciphertext by decrypting locally and emitting count/hash-prefix PASS evidence only.
- [ ] Require all tests PASS and secret scan PASS.

### Task 4: One live backup/rehearsal and cleanup

**Files:**
- Create generated staging under ignored `gen/` only.
- Update: `docs/pm/evidence/user-administration/ua-r3c-m3b-logical-backup.md`
- Update: `docs/pm/status/donhv.md`

- [ ] Freeze target, readiness, app collision, HDI service, source hashes, and private directory ACL.
- [ ] Create one exact temporary app, bind only HDI, stage at zero web instances, and run one exact task.
- [ ] Capture the ciphertext marker in memory and save it only to the ACL-restricted private directory.
- [ ] Run the local verifier and require equal nonzero row count and digest prefix.
- [ ] Delete the exact temporary app, prove binding/route/task absence, and rerun `npm run btp:demo:check`.
- [ ] Commit only generic scripts/tests and sanitized evidence; never commit generated keys or backup ciphertext.

### Task 5: Gate decision

- [ ] Run focused tests, agent rules, secret scan, QA-depth self-test, `git diff --check`, and final backup file/ACL/readback checks.
- [ ] Mark logical recovery `PASS` only if every acceptance condition in the design is freshly proven.
- [ ] If PASS, proceed to the separately reviewed schema-only real HDI migration; otherwise stop with exact cleanup and blocker evidence.
