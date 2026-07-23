# IDTS-90 — Expand demo Developer accounts and responsibility coverage

## Status

In Progress — implementation and local verification complete; PR/Shared QA UPSERT pending.

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
- [ ] PR passes repository gates and merges into `dev`.
- [ ] Narrow UPSERT is applied to Shared QA PostgreSQL.
- [ ] Shared QA read models expose the expanded pool.

## Security and boundaries

All added identities are synthetic under `example.local`. No role, schema, OData contract, automatic assignment behavior, real email or password is added. The deployment helper contains no credentials.

## Dependencies

Relates to IDTS-54, IDTS-56 and IDTS-89.
