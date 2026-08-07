# IDTS-122 Six-Bug Clean Baseline — Post-reset Evidence

## Execution

- Package SHA-256: `c0aa8f6abf5c20fef4be368800b001a255f3f60e8cfaddd5841fa1395cfcb7d4`
- Initial full dry-run: `idts122-full-dry-1785935854433` — PASS for counts/references before temporal normalization.
- Intentional rollback rehearsal: `idts122-rehearse-1785937161416` — PASS; pre-state and after-rollback counts matched.
- Committed transaction: `idts122-six-bug-reset-1785937312048` — PASS with marker `IDTS-122-CLEAN-BASELINE-COMPLETE`.
- Independent postverify: `idts122-postverify-1785937453163` — PASS.

## Verified HANA post-state

| Entity | Count |
| --- | ---: |
| Users | 14 |
| DeveloperProfiles | 12 |
| Bugs | 6 |
| Comments | 10 |
| HistoryEvents | 24 |
| HistoryLogs | 46 |
| Attachments metadata | 0 |
| Notifications | 0 |
| NotificationDeliveries | 0 |
| DuplicateLinks | 0 |
| AiSuggestions | 0 |
| CAP outbox Messages | 0 |

Every configured BugService draft table and `DRAFT_DRAFTADMINISTRATIVEDATA` independently reported zero rows. All package references reported `missing = 0`; all four default-user role fingerprints remained active and valid.

## SAP BTP readiness

- CAP application: `1/1` — PASS.
- AppRouter: `1/1` — PASS.
- `/health`: HTTP `200`.
- `/ready`: HTTP `200`.
- Protected API without session: HTTP `401` as expected.
- Web entry: HTTP `200`.
- Result: `DEMO READY`.

No HDI deployment, broad `cds deploy`, seed load, or schema migration was run during this reset. No credential, private endpoint, user identifier, email address, or business row content is stored in this evidence.
