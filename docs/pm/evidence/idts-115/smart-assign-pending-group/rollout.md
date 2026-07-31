# IDTS-115 Smart Assign pending-group rollout

Date: 2026-07-31

## Baseline

| Item | Value |
| --- | --- |
| Source PR | GitHub PR #241 |
| Merge SHA | `4a32c821127ae61685d7c2c909ac4b239db33696` |
| MTAR | `idts-sap01_1.0.0.mtar` |
| MTAR SHA-256 | `6245AF788E24C6ABAE817528787D9E625B4A2B693EC18727032F2237FF8BDD48` |
| BTP operation | `28dfa061-8c81-11f1-ad50-eeee0a8d3d75` |

## Deployment scope

- Deployed module: `idts-sap01-app-content`.
- Not deployed: `idts-sap01-db-deployer`.
- No broad `cds deploy`, HANA migration, seed reload or direct database write.
- The build was produced from the exact merge SHA.

## Runtime verification

| Check | Result |
| --- | --- |
| MTA operation | FINISHED |
| `idts-sap01-srv` | restarted after Trial auto-stop; `1/1 running` |
| `idts-sap01-approuter` | restarted after Trial auto-stop; `1/1 running` |
| Service health | HTTP 200 |
| Authenticated application | loaded as DonHV |

## Browser verification

Controlled case: existing edit draft for `BUG-0011`.

1. Reloaded the deployed application after restarting the Trial applications.
2. Opened the Assignee value help.
3. Smart Assign opened successfully.
4. Three candidate rows loaded: Backup Developer, CAP Developer 01 and SangVN.
5. The previous `Could not load assignable developers` popup was absent.
6. Cancelled the dialog without choosing Assign.

Result: PASS for the DonHV edit-draft reproduction. The same pending-group
helper is used by the new-draft path and focused programmatic coverage passes;
member-owned Tester/Developer role evidence remains pending.

## Known environment and tooling findings

- SAP BTP Trial stopped both applications after the content deployment. This
  produced route 404 / Edge `ERR_BLOCKED_BY_CLIENT` until both apps were
  started again; it was not an application crash.
- The browser console retained older SAPUI5 resource/flex warnings from before
  the successful reload. No Smart Assign load error occurred in the verified
  interaction.
- Clean packaging reported existing dependency audit findings. This fix adds no
  dependency and does not change the lockfile.
