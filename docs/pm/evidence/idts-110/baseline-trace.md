# IDTS-110 baseline and runtime trace

This trace explains why the candidate package contains more than one immutable SHA. The SHAs identify different evidence roles; they are not competing claims that every artifact was executed from one checkout.

| SHA | Role | Artifacts and validity |
| --- | --- | --- |
| `bc0c47e522ae208384d4b23dda21535dcc683683` | Frozen catalog source baseline | The approved 188-case English catalog was derived and reviewed against this source baseline. Its catalog statuses remain `NOT_RUN` until DonHV accepts results and updates the official workbook. |
| `56b4a4f3d92ef2f9558869caab4b393b07d8b5e7` | Evidence-curation baseline | The 188 case manifests and `local-primary-suite-results.json` were curated at this baseline. The 135 local-primary entries are suite-to-case mappings only, not atomic executions or PASS claims. |
| `7c02c56daa7f46661b4d2f778a7a0b2a77d88b8a` | Exact local execution baseline | `local-execution-results.json` records the exact atomic runner result: 38 PASS, 0 FAIL and 2 locally BLOCKED attachment-control cases. |
| `67b1bf86169e9696c9365ef4846b99ffae30d4e2` | Deployed generated-control runtime | Separate browser evidence closed `UT-ATT-007` and `UT-ATT-008` as candidate PASS against the deployed SAP-standard attachment control. The manifests preserve this deployed SHA and trace the current MIME/10 MB contracts to `db/schema.cds`. |
| `bee388348b1fd52bd8e24a99fb0b98c901afe3e3` | Previous reviewer exact head | A no-output rerun of the exact local runner reproduced 38 PASS / 0 FAIL / 2 local blockers, which reconcile with the two deployed-runtime supplements to the current 40 atomic candidate PASS total. QA-depth also passed at this reviewed head. |
| `f468aa7605e86025a6d7de3e3bea4b09b2234e48` | Repaired local-primary source baseline | The shared local-primary evidence and its 135 linked HYBRID_BTP manifests/cards were freshly regenerated against this exact source commit. The runner rejects implicit evidence provenance and source drift; all 135 entries remain mapping-only rather than atomic PASS claims. The other 53 case manifests retain their own historical local-execution or BTP evidence roles. |

## Reconciliation rule

- Current truth is **40 atomic candidate PASS / 135 mapping-only candidates / 0 FAIL / 13 BTP BLOCKED**.
- `UT-ATT-007/008` are counted once: their local exact-run records remain blocked, while their separate deployed-runtime supplements provide the candidate PASS evidence.
- The 13 BTP cases remain BLOCKED because Cloud Foundry CLI/authorized BTP readiness is unavailable. This is an environment/tooling blocker, not a product failure.
- A final-head gate rerun verifies package consistency and regression status; it does not rewrite historical evidence provenance.
- No official `Unit_Test_EN` workbook, Drive file, final PASS, member approval, or Jira Done transition is claimed by this trace.
