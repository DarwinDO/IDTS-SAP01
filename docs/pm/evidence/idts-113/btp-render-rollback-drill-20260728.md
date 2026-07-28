# IDTS-113 BTP/Render rollback readiness drill — 2026-07-28

## Verdict

`PLATFORM ROLLBACK READY — DATA DELTA REVERSAL NOT REHEARSED`

The drill proves that the BTP target and retained Render baseline are both
reachable and enforce anonymous authorization boundaries. It does not prove
that post-cutover HANA changes are automatically synchronized back to
PostgreSQL.

## Frozen references

| Item | Evidence |
| --- | --- |
| BTP runtime source | Runtime fix merge `3504931d2689e4d56c0de3f5977342fc7cf57e4a` |
| Evidence baseline | `origin/dev` `0a02bdabb91beb18dab9524daf01b37be98bf10b` |
| BTP target | Cloud Foundry `dev` space; CAP and AppRouter started `1/1` |
| Render rollback deploy | `dep-d9i0r537uimc73as0be0`, commit `8009b2a6a72d73db28f190b3a0bcbb65b1ff4740`, status `live` |
| Rollback window | 2026-07-28 through at least 2026-08-04 |

No password, token, database URL, provider credential, private recipient or
service-key payload is included in this report.

## Fresh checks

| Check | Result |
| --- | --- |
| BTP CAP health | HTTP `200` |
| BTP AppRouter anonymous entry | HTTP `302` to the protected HTML5 application path |
| BTP CAP protected OData without token | HTTP `401` |
| Render AuthService metadata | HTTP `200` |
| Render login UI | HTTP `200` |
| Render application UI | HTTP `200` |
| Render protected OData without token | HTTP `401` |
| Render deploy inventory | Latest deploy is `live`; auto cutover was not triggered |

The fresh Render route checks completed in approximately 0.23–0.30 seconds.
An earlier first request in the same acceptance session required a cold-start
retry; the immediate retry returned HTTP `200`. Free-tier wake-up time must be
included in the rollback recovery estimate.

## What was deliberately not changed

- No traffic or custom-domain switch was performed.
- No Render deploy was triggered.
- No HANA or PostgreSQL row was created, updated or deleted.
- No S3 object or email delivery was created.
- No secret or identity value was read from service bindings.
- No HANA-to-PostgreSQL import was executed.

## Data continuity finding

The Render deploy predates the current BTP runtime, and PostgreSQL is not
continuously replicated from HANA. Therefore:

- Render can provide an operational previous baseline.
- It cannot be described as a hot standby.
- Any post-cutover HANA write must be inventoried and reconciled before a
  lossless rollback.
- DonHV must explicitly accept data loss if traffic is moved back without that
  reconciliation.

## Recovery-time interpretation

The read-only route drill demonstrates that infrastructure recovery can begin
immediately. The total rollback time is not only the HTTP wake-up time; it also
includes:

1. incident decision and write freeze;
2. HANA delta inventory/export;
3. reviewed PostgreSQL reconciliation when required;
4. identity/login and application smoke;
5. team communication.

Because step 2–3 depends on the volume and type of post-cutover changes, this
report does not claim a fixed lossless RTO.

## Follow-up

- Keep Render/PostgreSQL available through at least 2026-08-04.
- Use `docs/deployment/idts-113-btp-cutover-rollback.md` for an actual rollback.
- Do not mark the rollback acceptance fully complete until DonHV accepts the
  documented manual delta-reconciliation limitation or a reverse-migration
  rehearsal is executed.
