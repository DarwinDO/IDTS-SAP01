# Gate 5 Business Catalogs — Additive HDI Candidate Plan

## Generated comparison

- Baseline source: `fd6870585d72ca63e55b744708960b417a2795b9` from clean `E:\IDTS-SAP01`.
- Candidate source: Gate 5 worktree.
- Baseline generated files: 55.
- Candidate generated files: 60.
- Added: 5.
- Changed: 0.
- Removed: 0.
- `.hdbtabledata`: 0.
- Destructive-token hits (`drop|delete|truncate|alter`): 0.

## Exact additive allowlist

| Generated artifact | SHA-256 |
| --- | --- |
| `idts.cap.CatalogAdministrationAuditEvents.hdbtable` | `83ADD6805C03A5B8348737EAE739567A2E41C1AB7367F367ABBC763057B142C2` |
| `idts.cap.ApplicationComponents.catalogCode.hdbindex` | `16741531E6925D14031C19C50236783A0C0F2113E9AA7ACF0169FDFC84384263` |
| `idts.cap.ComponentCategories.catalogPair.hdbindex` | `272351CC08A63AAA01CF1A1E7D3CAA1AE5625C86D768EDD1BD36D97E9E1CD54E` |
| `idts.cap.DefectCategories.catalogCode.hdbindex` | `07473870D1BEE92118827CB0C00A563F7E0D20A708A3018133CBCB9134769E8A` |
| `idts.cap.SAPModules.catalogCode.hdbindex` | `1D858598C568E14A7B76235DCBB32C25AC5032DCD1A94DF495E0D095B4EAF004` |

The audit table contains only the documented ID/managed/actor/type/target/action/result/safe-summary/reason/correlation columns. The four indexes are unique and target only existing catalog code/pair columns.

## Not authorized

- Do not run `simulate-make`, HDI make, deployer, migration, table data, seed, DML, or catalog mutation under this source gate.
- A later gate must refresh live duplicate counts, recovery path, exact generated checksums, and warning-free simulation immediately before any approved migration.
- Any unrelated/changed/removed artifact, `.hdbtabledata`, destructive conversion, or duplicate live data is a hard stop.
