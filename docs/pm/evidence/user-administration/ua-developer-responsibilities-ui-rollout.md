# UA Developer Responsibilities — UI Content Rollout

Date: 2026-08-19
Owner: DonHV
Status: `EXACT HTML5 CONTENT PLAN / STANDING DONHV GO / STOP ON DRIFT`

- MTAR: generated clean R8c `idts-user-admin-ui-r8c.mtar`.
- SHA-256: `73e7b8732a0febad428d38b0bae7c40abd1d9b57c2e1c18994f15a9bacc9e27c`.
- Size: 41,380 bytes.
- Outer payload: exactly one application-content module data ZIP plus MTA metadata.
- Data ZIP: exactly one `user-administration-ui.zip`.
- Inner UI ZIP SHA-256: `74563ceaa1d6673d3e1bf21d606bf04e0c658d6c4f644a244aafce86e218c0e5`.
- Inner entries: 31 static files; cachebuster and Component-preload present; node_modules/unsafe paths absent.

The clean build's npm audit reported four High findings only in build-time UI development tooling. No dependencies or node_modules are packaged in the deployed static ZIP. Source lint, UI contract test and production UI build pass.

Deploy only MTA `idts-user-admin-ui-r3c`, whose descriptor contains one HTML5 build module, one application-content module and one existing HTML5 repo host reference. It contains no CAP, DB deployer, AppRouter, XSUAA, HANA or managed-service mutation.

After deploy require zero active MTA operations, unchanged CAP/AppRouter topology, `DEMO READY`, cachebuster-backed UI resources, and visible Developer profile controls in the PM + UserAdmin session. On deploy failure, read operation state before any retry; do not delete the HTML5 repo service.
