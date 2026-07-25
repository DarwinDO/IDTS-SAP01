# IDTS-101 — SAP490 Specifications Remediation Evidence

## Baseline

| Item | Value |
| --- | --- |
| Git baseline | `8009b2a6a72d73db28f190b3a0bcbb65b1ff4740` |
| Render deploy | `dep-d9i0r537uimc73as0be0` |
| Render state | `live`, commit matched Git baseline |
| Backup | `E:\IDTS-SAP01-backups\idts-101-sap490-specifications-before-20260725-092344` |
| OfficeCLI | `1.0.141` |

The backup path is local operational evidence and must not be copied to Jira or public artifacts.

## Accepted artifacts

| Artifact | Version | SHA-256 |
| --- | --- | --- |
| Blueprint EN | v0.5 | `D3FC241E1FD7836FC407E5AE34BA15BC2DE5BA67C73FBAB170E7D8ECE25C3BD0` |
| Blueprint VI | v0.5 | `704F496E1141A6AFDBC9EBC02E5B28D1319B3515FC7498B18FB57FE13200A47B` |
| Functional Specification EN | v0.5 | `24A8C6936E69F2C8EE194895FE5E875C4CD2B1CE44819E073E37FCAC400BBDC5` |
| Functional Specification VI | v0.5 | `82696BFE7B3497CC6C016F3227F1A1ADBC1C235560603A258C7190F385FB5CEF` |
| Technical Specification EN | v0.4 | `F9FB29F0A7127E2CC00F65E1C9E7D73CC0D662E659423B91502B36E9CD35862E` |
| Technical Specification VI | v0.4 | `F78A3525A64B483BD2B22BB5CDDACD7475B0A64B47DA3C22EC1C676C92E72219` |
| Configuration Note EN | v0.4 | `66FD23CA5414ECE292F625C959443540AFDCC0EB72D6B20079BDFAC7F26F9D8C` |
| Configuration Note VI | v0.4 | `A33989B629D56441F4E574E91059698CD1F6CBE1A9777D481D2AE684ADA3DDE5` |

## Template and content verification

- Functional Specification preserves all 9 official sheets.
- Technical Specification preserves all 12 official sheets.
- Configuration Note preserves all 5 official sheets and keeps sheets `4` and `5` hidden.
- Blueprint preserves 3 sections, official cover/header/footer, approval/control blocks, style catalog, core tables, and TOC field.
- Blueprint caches `NUMPAGES` as `26` for EN and `25` for VI so Google Drive preview agrees with the actual reviewed page count. The live `PAGE` and `NUMPAGES` field instructions remain intact.
- No prohibited SAP sample residue remains: `VBAK`, `VBAP`, `KNA1`, `KNVV`, `Sales Data`, `WS92400001`, Credit Memo Request, or screen `9000`.
- No `#REF!`, duplicate drawing IDs, stale `PENDING-only` AI wording, or missing required AI runtime symbols were detected.
- EN/VI outputs are generated from the same structured source and have matching functional coverage.
- No files under `app/`, `srv/`, or `db/` changed.

## Verification commands and results

| Verification | Result |
| --- | --- |
| `officecli --version` | PASS — `1.0.141` |
| `officecli validate <artifact> --json` | PASS — 8/8, zero schema errors |
| `python -m py_compile ...` | PASS |
| `python scripts/sap490/validate-specification-pack.py` | PASS |
| LibreOffice export to PDF | PASS — 8/8; warning `<prefix>` did not prevent output |
| PDF page/text scan | PASS — 105 pages, zero weak/blank pages |
| Contact-sheet visual review | PASS — 105/105 pages |

## Tooling limitations

- LibreOffice emits `Could not find platform independent libraries <prefix>` for DOCX conversion, but every PDF was created and reviewed successfully.
- The default Python runtime lacked PyMuPDF. The review used the bundled `pypdfium2`/Pillow runtime instead; no project dependency was added.
- Native Word TOC saving rewrote official style identifiers, so those files were rejected. The accepted Blueprint retains the official template and a real TOC field with reviewed cached entries.

## Drive synchronization

All eight files were replaced in place. Their existing file IDs, parent folders, Office MIME types, and five-entry sharing sets were preserved.

| Artifact | Drive ID | Parent | Size | Readback |
| --- | --- | --- | ---: | --- |
| Blueprint EN | `1WDuPtIdTjyvopPVpsa1Ob90cXKsqkN5n` | `1oKcBvd8TudJW0Gw51ANZioHHhmd9zAjo` | 387,517 | SHA-256 matches local |
| Blueprint VI | `1pLFomBiPJvZkOYmzmUZwcSm1HDejyUrV` | `1oKcBvd8TudJW0Gw51ANZioHHhmd9zAjo` | 389,056 | SHA-256 matches local |
| Functional Specification EN | `1VMVGhKXkLiJh-ME2WRtkQjc6VPW8SGuI` | `1F3bohptztIz1mntQC_r-2Xy7BU9iX-ud` | 1,732,345 | SHA-256 matches local |
| Functional Specification VI | `1s0EbohIdtIY_GxML-7PLDUd5GfImBOIp` | `1F3bohptztIz1mntQC_r-2Xy7BU9iX-ud` | 1,732,788 | SHA-256 matches local |
| Technical Specification EN | `1nAmUQb3852G4-hxJ0BOK6OHGLDs6Kq1P` | `1ZurfJj-whcezlM-9dgTZyTj_LRCaJ268` | 2,022,061 | SHA-256 matches local |
| Technical Specification VI | `1nwuWiW6-gjTVKmA_HuI_Un3075Kgf2fN` | `1ZurfJj-whcezlM-9dgTZyTj_LRCaJ268` | 2,021,963 | SHA-256 matches local |
| Configuration Note EN | `1np2rfeSEe-Cz4HI4cWU1s4P_SNqpEtv-` | `1Jo7yMiz0p6C9nPk8kSnvWueRsfs_qizO` | 522,284 | SHA-256 matches local |
| Configuration Note VI | `1ClD-QkoxLYyw5fAw5vHtPe34JsG1p3kh` | `1Jo7yMiz0p6C9nPk8kSnvWueRsfs_qizO` | 522,422 | SHA-256 matches local |

Google Drive preview was checked after a forced reload:

- EN reports `Page 1 of 26`, displays `Confidential 1/26`, and last-page navigation displays `Confidential 26/26`.
- VI reports `Page 1 of 25` and displays `Confidential 1/25`.
- LibreOffice/PDF verification displays the VI last page as `Confidential 25/25`.
- Neither refreshed Drive preview contains the stale `/46` footer value.
