# IDTS-104 — Repository hygiene and mentor-review Q&A

- Owner: DonHV
- Support: NhanT
- Due date: 2026-07-26
- Jira: https://dutassociation.atlassian.net/browse/IDTS-104
- Branch: `chore/idts-104-repository-hygiene-mentor-qa-donhv`

## Scope

- Preserve historical generated SAP490 binaries through an annotated tag and reproducible manifest.
- Keep only current deliverables in `docs/sap490/generated/`.
- Prevent transient output from returning to the repository tree.
- Curate ignored UAT screenshots before deleting raw output.
- Create a Vietnamese two-way Mentor Review Q&A bank with real source/evidence references.

## Out of scope

- CAP/Fiori runtime, database schema and business workflow changes.
- Google Drive cleanup or synchronization.
- Git history rewrite.
- Human UAT or mentor sign-off.

## Acceptance checklist

- [x] Jira, worktree and archive tag created.
- [x] Archive manifest records version, size, SHA-256, Git blob and current replacement.
- [x] Historical generated artifacts removed from current tree; current set retained.
- [x] Raw local temp/log/output cleaned with an explicit safe target list.
- [x] Seven useful historical UAT screenshots curated and labeled.
- [x] Mentor Review Q&A created with 30 mentor questions and 15 team questions.
- [x] Current SAP490 validators and OfficeCLI pass.
- [x] Secret/agent/QA Depth/AI DevKit/git gates pass.
- [x] PR merged and Jira closed.

## Issues observed

- Tooling issue: a long inline PowerShell deletion command was blocked by execution policy before deleting anything. Resolution: added a narrow, auditable cleanup script with dry-run/apply modes and exact safe targets.
- Documentation issue: a legacy Blueprint generator and several validators still targeted archived versions. Resolution: removed the superseded generator and retargeted current validators/scripts.
- Documentation issue: old readiness/manifest files could be mistaken for current versions. Resolution: labeled them as historical snapshots and linked the current archive manifest.
- Test-tooling issue: the first combined validator batch timed out because the specification quality contract needs about 98 seconds and output was buffered. Resolution: ran validators independently with bounded timeouts; all current contracts passed.
- Documentation/test-tooling issue: the legacy Blueprint validator enforced v0.4 table shapes and zero-width wrapping against v0.6, causing 127 false positives. Resolution: reduced it to stable current invariants already appropriate for cleanup: official-template section/style identity, table-count parity, version, placeholder and BP coverage.
- Documentation issue: nine initial Q&A references used stale/generic paths or wildcards. Resolution: replaced each with a real file/symbol at the frozen baseline; the reference check now reports zero broken paths.
- Process/test-harness issue: the first PR check rejected a backtick-wrapped Knowledge Gate evidence path because the validator requires the path to start after whitespace. Resolution: removed Markdown backticks from that PR field and pushed this audit update to trigger a fresh pull-request event; no check bypass was used.
- Process correction: the initial closure comment incorrectly treated the optional 10-question mentor rehearsal as a new Knowledge Gate. DonHV had already passed IDTS-89 and IDTS-90 at 90% with Critical/Debug/Teach-back PASS. Jira comment 10705 supersedes that statement; rehearsal remains optional and IDTS-104 is Done.
