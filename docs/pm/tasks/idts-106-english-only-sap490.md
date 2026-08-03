# IDTS-106 — English-only SAP490 and Vietnamese artifact retirement

- Owner: DonHV
- Support: NhanT
- Due: 2026-07-28
- Status: Blocked by IDTS-105 acknowledgment
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

## 2026-08-03 read-only audit handoff

- Candidate report: `docs/pm/evidence/idts-106/english-only-audit-candidate-20260803.md`.
- Baseline: `fbea12cd996d8c1e13bd834fd6e054c8a37c32e6`; audit branch: `docs/idts-106-english-only-donhv`.
- Drive Mentor Current readback found 13 VI artifacts with 13 matching EN counterparts. The 13th family is `Test And Fix Bug`, nested under the `Test Report` folder and therefore missed by the first direct-child count. Repo generated tree retains 11 VI artifacts with 11 matching EN counterparts; BRD/SRS/FRS repo sources remain intentionally bilingual Markdown.
- Generator/validator references still include VI output and parity checks; remediation is proposed only, not applied.
- Stale PR #193 remains open; its branch is 168 commits behind and 1 commit ahead of `origin/dev`.
- Blocker: IDTS-105 human acknowledgments are incomplete. No Drive write/trash/delete/sync, approval, PASS, Jira transition, or member acknowledgment was performed.
