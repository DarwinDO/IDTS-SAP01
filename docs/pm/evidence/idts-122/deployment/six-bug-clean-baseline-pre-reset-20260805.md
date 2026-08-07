# IDTS-122 Six-Bug Clean Baseline — Pre-reset Evidence

## Approved intent

- Replace the current inconsistent Bug-domain dataset with the verified six-Bug baseline.
- Preserve the current HANA Users and DeveloperProfiles.
- Preserve all current code lists and configuration.
- Do not run HDI deployment, `cds deploy`, seed loading, or schema migration.

## Package

- Package schema: `2`
- Package SHA-256: `c0aa8f6abf5c20fef4be368800b001a255f3f60e8cfaddd5841fa1395cfcb7d4`
- Source backup checksum: verified against the approved private backup before package generation.
- Source closure: six Bugs, ten Comments, twenty-four HistoryEvents, and forty-six HistoryLogs passed package-internal reference validation.

## Read-only HANA gates

- Corrected reference task: `idts122-refcheck-1785934007645` — PASS.
- Initial full runner dry-run task: `idts122-full-dry-1785935854433` — PASS for counts/references on the pre-normalization package.
- Final package execution path: `idts122-rehearse-1785937161416` — PASS with an intentional rollback after all inserts and postchecks.
- Reference groups: all reported `missing = 0`.
- Default users: four expected, zero missing, active roles verified.
- Current Users to preserve: `14`.
- Current DeveloperProfiles to preserve: `12`.

## Before counts

| Entity | Count |
| --- | ---: |
| Bugs | 4 |
| Comments | 29 |
| Attachments metadata | 13 |
| HistoryEvents | 142 |
| HistoryLogs | 263 |
| Notifications | 61 |
| NotificationDeliveries | 61 |
| DuplicateLinks | 2 |
| AiSuggestions | 260 |
| CAP outbox Messages | 0 |

The dry-run verified every configured BugService draft physical table. The final-package rehearsal then executed the complete delete/insert/postcheck path and proved rollback restored the original counts. Active and draft mutations had not yet been committed at this evidence point.

## Planned post-state

| Entity | Planned count |
| --- | ---: |
| Users | 14 — unchanged |
| DeveloperProfiles | 12 — unchanged |
| Bugs | 6 |
| Comments | 10 |
| HistoryEvents | 24 |
| HistoryLogs | 46 |
| Attachments metadata | 0 |
| Notifications / deliveries | 0 |
| DuplicateLinks | 0 |
| AiSuggestions | 0 |
| CAP outbox Messages | 0 |
| All BugService draft tables | 0 |

No credential, private endpoint, user identifier, email address, or business row content is stored in this evidence.
