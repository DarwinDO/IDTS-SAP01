# IDTS-90 — Expand demo Developer accounts and responsibility coverage

## Status

Done — PR #165 merged and the narrow Shared QA UPSERT/read-model verification passed.

## Scope

- Keep the original four team users unchanged.
- Add ten synthetic `DEVELOPER` users, profiles and capability responsibilities.
- Cover AVAILABLE, BUSY and UNAVAILABLE examples plus varied workload limits.
- Preserve password hashes and existing Shared QA records.
- Use an idempotent narrow UPSERT; never use broad seed-loading `cds deploy` for Shared QA.

## Acceptance criteria

- [x] Local seed has 14 Users, 12 Developer users, 12 profiles and 30 responsibilities.
- [x] Every added profile has at least two responsibilities.
- [x] Repeated UPSERT does not duplicate rows or overwrite password hashes.
- [x] PR passes repository gates and merges into `dev`.
- [x] Narrow UPSERT is applied to Shared QA PostgreSQL.
- [x] Shared QA read models expose the expanded pool.

## Completion evidence

- PR #165 merged normally at `6d4e73b`; `qa-depth-gate` passed.
- PostgreSQL before/after totals: `4/2/2/8` → `14/12/12/30` for Users/Developer users/Profiles/Responsibilities.
- UPSERT result: 10 Users, 10 Profiles and 22 Responsibilities committed in one transaction.
- Foreign-key verification found zero orphan responsibilities.
- Authenticated OData smoke as PM returned 12 AssignableDevelopers and 12 DeveloperWorkloads.
- All ten synthetic names were visible; Backup Developer showed the expected `Unavailable` warning.
- Render web service stayed live on the existing IDTS-89 runtime commit. Auto-deploy remains off and pre-deploy remains `true`; no broad deploy was run.

## Security and boundaries

All added identities are synthetic under `example.local`. No role, schema, OData contract, automatic assignment behavior, real email or password is added. The deployment helper contains no credentials.

## Dependencies

Relates to IDTS-54, IDTS-56 and IDTS-89.
