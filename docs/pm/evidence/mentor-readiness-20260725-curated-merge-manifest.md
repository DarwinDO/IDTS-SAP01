# Mentor-readiness curated merge manifest — 2026-07-24

Owner: DonHV
Source branch: `docs/mentor-readiness-20260725-donhv`
Target: `dev`

## Included in the documentation PR

- BRD, SRS and FRS source Markdown plus verified EN/VI DOCX outputs.
- Current diagram source, rendered SVG/PNG assets, manifest, contact sheet and diagram pack.
- Current SAP490 generated Blueprint v0.3 and current review/test workbooks.
- Canonical test catalog and the generators/validators that reproduce the current artifacts.
- SAP490 synchronization guidance.
- Mentor-readiness, Blueprint and test-pack evidence required to review the deliverables.
- DonHV handover, current status, task board, risk/decision log and the relevant BA/SAP490 work packages.

## Excluded from the documentation PR

| Path or group | Reason |
| --- | --- |
| `tmp/` | Temporary LibreOffice, render, screenshot and inspection output; not a repository deliverable. |
| Blueprint v0.1 and the timestamped demo defect workbook | Superseded/legacy generated artifacts. |
| Three modified SAP490 template DOCX files | ZIP package bytes differ, but every OOXML/media part matches `HEAD`; committing them would create a false binary diff. |
| `docs/deployment/render-qa.md` and `docs/mcp-setup.md` | Unrelated deployment/tooling work; outside the mentor-documentation PR. |
| `docs/pm/evidence/idts-46/`, `docs/qa/uat-reports/idts-59-ui-ux-scan-report.md` | Unrelated task evidence. |
| `docs/pm/status/datdt.md` and `docs/pm/status/sangvn.md` | Member-owned status changes are outside DonHV's curated SAP490 merge. |
| Any local/private configuration, credentials, caches or scratch files | Security and repository hygiene. |

Excluded local changes are preserved in a named Git stash after the curated commit. They are not deleted or overwritten.

## Review rules

- The staged diff must match the included groups above.
- No runtime file under `app/`, `srv/` or `db/` is allowed in this PR.
- Office/schema/content/template/parity checks and repository quality gates must pass before merge.
- The PR must not bypass `qa-depth-gate` or branch protection.
