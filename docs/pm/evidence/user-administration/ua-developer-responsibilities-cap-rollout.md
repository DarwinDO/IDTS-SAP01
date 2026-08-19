# UA Developer Responsibilities — Selective CAP Rollout

Date: 2026-08-19
Owner: DonHV
Status: `EXACT SELECTIVE R8 PLAN / STANDING DONHV GO / STOP ON DRIFT`

## Artifact

- source HEAD: `ba879b889fcab9b99aaee443c8e2b31b68b6e348` plus migration evidence only after runtime source commit `314bf8d5b44f2a1934cce47dff1b4265b856c675`;
- generated CAP ZIP: `mta_archives/idts-ua-developer-cap-r8b.zip`;
- SHA-256: `8da1c00c60425ba34ca9ed91347e0c997998405f031562e3084df9c602323ac1`;
- 316,545 bytes; 94 files; 95 ZIP entries; Node `22.x`;
- source parity excluding intentional deployment lock update: zero differences;
- DB/HDI artifacts and private-key hits: zero;
- production install PASS; audit High/Critical zero. Six Moderate findings remain in pre-existing attachment-storage dependencies.

The generated lock advances the vulnerable transitive `fast-xml-parser` from 5.9.3 to 5.11.0 within existing semver constraints. It does not change root source dependencies, use `audit fix`, add overrides, or modify the repository root lock.

## Forward

Freeze exact main CAP state and previous droplet fingerprint `4955ca92d23c`, route count 1, binding count 7, requested/running 1/1. Then:

1. `cf create-package idts-sap01-srv -p <checksum-reviewed ZIP>` once.
2. Resolve the exact READY package owned by the exact app.
3. `cf stage-package idts-sap01-srv --package-guid <in-memory GUID>` once.
4. Resolve the exact STAGED build/droplet owned by that package/app.
5. `cf set-droplet idts-sap01-srv <in-memory GUID>` once.
6. `cf restart idts-sap01-srv` once.

No push, DB deployer, AppRouter, UI, route, binding, env, XSUAA, HANA, user, role or provider mutation is allowed.

## Acceptance and rollback

Require CAP STARTED 1/1, same one route and seven binding names, `/health` and `/ready` HTTP 200, protected anonymous API 401, AppRouter/Web 200, and focused User Administration metadata/action reachability.

If restart/readiness fails, read state once; do not re-stage. Rollback sets the exact prior droplet held in process memory and restarts CAP once. Main database schema remains additive and is not rolled back during CAP rollback.
