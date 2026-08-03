# IDTS-106 — English-only SAP490 and Vietnamese artifact retirement

- Owner: DonHV
- Support: NhanT
- Due: 2026-08-06
- Status: Done — PR #264 merged at `cd03aedde4fa2d3d146b54ec76d400e4de3f670b`; Jira closed with evidence comment `10882`
- Jira: https://dutassociation.atlassian.net/browse/IDTS-106

## Planned output

- Recursive Mentor Current VI inventory and EN counterpart check.
- Raw backup outside repo plus Drive metadata/hash manifest.
- Mentor Index/link cleanup.
- Drive Trash operation without emptying Trash.
- Pre-cleanup Git tag/archive manifest.
- EN-only generators/validators and current generated tree.

## Safety

Do not touch archive, templates, references, previous versions, POC or workshop. Do
not rewrite history or permanently delete Drive files.

## 2026-08-03 execution result

- Candidate report: `docs/pm/evidence/idts-106/english-only-audit-candidate-20260803.md`.
- Baseline: `fbea12cd996d8c1e13bd834fd6e054c8a37c32e6`; audit branch: `docs/idts-106-english-only-donhv`.
- Drive Mentor Current readback found 13 VI artifacts with 13 matching EN counterparts. The 13th family is `Test And Fix Bug`, nested under the `Test Report` folder and therefore missed by the first direct-child count. Repo generated tree retains 11 VI artifacts with 11 matching EN counterparts; BRD/SRS/FRS repo sources remain intentionally bilingual Markdown.
- Generator/validator references still include VI output and parity checks; remediation is proposed only, not applied.
- Stale PR #193 remains open; its branch is 168 commits behind and 1 commit ahead of `origin/dev`.
- DonHV personally acknowledged the briefing at merge SHA `3e78b495cb8feb56188cc446b827d47e040e1b98`; IDTS-107 Gate 2 was approved and PR #265 merged at `104cad4bd43a16483ea0cfd8e117f5ca36de2874`.
- Created and pushed archive tag `sap490-english-only-pre-cleanup-20260803`; the repo current tree retires 11 generated VI artifacts while preserving canonical/internal bilingual sources and Git history.
- Backed up all 13 Drive VI files outside the repo and verified SHA-256/Office ZIP integrity.
- Moved exactly 13 VI file IDs to Drive Trash; no folder was trashed and Trash was not emptied. Readback confirms the EN counterpart remains in every source family.
- Updated the same-ID Mentor Index to EN-only control, current versions and current briefing gate truth; no VI row/link remains.
- PR #264 passed the fresh `qa-depth-gate` and merged normally into `dev` at `cd03aedde4fa2d3d146b54ec76d400e4de3f670b`; Jira IDTS-106 was transitioned to Done after comment `10882` recorded the verified result.
- Evidence: `docs/pm/evidence/idts-106/drive-vi-pre-trash-manifest-20260803.md` and `docs/sap490/generated-vi-retirement-manifest-20260803.md`.
- Remaining: final repository gates, PR #264 Ready/merge, post-merge verification and Jira closure. SangVN, DatDT and NhanT still acknowledge IDTS-105 before approval of their own SAP490 packages.
