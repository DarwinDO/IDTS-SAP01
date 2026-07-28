# IDTS-113 — BTP HANA migration and retained integrations local verification

## Scope

This evidence covers the local migration/export implementation, AWS S3 and
Brevo private binding, SAP Job Scheduling Service contract, and deployable MTA
package. It does not claim HANA import, XSUAA role assignment, BTP browser
acceptance, live Brevo delivery, or final cutover.

## Frozen baseline

- Git baseline before this increment:
  `05a4dfb96c79fa1a6164a5e7054f8a39515a2cf9`.
- Verification timestamp: `2026-07-28T09:31:08.6988111Z`.
- MTA archive size: `33,955,890` bytes.
- MTA SHA-256:
  `1D63FFEF1DDB08709D9B3BBE095513BBA5023511438A74C1AE18FE4B157664A4`.
- The MTA archive and raw migration data are ignored and are not committed.

## Shared QA read-only export

- Source access: authenticated Render CLI, read-only SQL.
- Entity inventory: 32 explicit CAP persistence entities.
- Total rows: 679.
- Manifest SHA-256:
  `3B9BCC0A6E6B110B4D41F34A2CDE713B977CDFED51C0BAADA6B64A9EF7D99F97`.
- Key counts:
  - Users: 14.
  - DeveloperProfiles: 12.
  - Bugs: 17.
  - Comments: 16.
  - Attachments: 7.
  - HistoryEvents: 95.
  - HistoryLogs: 196.
  - Notifications: 51.
  - NotificationDeliveries: 51.
  - AiSuggestions: 71.
- Policy:
  - Preserve UUIDs and relationships.
  - Exclude `AuthSessions`.
  - Clear `Users.passwordHash`.
  - Convert historical unsent deliveries to `SKIPPED`.
  - Map lowercase PostgreSQL physical columns back to exact CDS element and
    managed-association key names before applying target policies.

No PostgreSQL data was changed. No credential, full user email, private
endpoint, attachment content, notification recipient list, or provider secret
is present in this evidence.

The regenerated archive passed a strict linked-model column audit with zero
unknown columns. All 14 migrated user rows contain `passwordHash: null`, none
contains the stale physical key `passwordhash`, and the import manifest dry-run
accepts all 32 entities and 679 rows.

## Private external-service binding

- Cloud Foundry service: `idts-sap01-external-services`.
- Type: user-provided service.
- Result: create succeeded.
- Content boundary: existing AWS S3 credentials plus nested retained Brevo
  email configuration.
- No OpenAI credential was added.
- Script output confirmed `secretsPrinted=false`.
- The temporary JSON credential file was removed after the CLI call.

## Verification results

| Gate | Result |
| --- | --- |
| HANA migration policy, column mapping and byte preservation | 8/8 PASS |
| BTP scheduler/S3 binding checks | 6/6 PASS |
| XSUAA/AppRouter regression | 11/11 PASS |
| Existing email outbox programmatic regression | PASS |
| CAP service compile | PASS |
| MTA build (`mbt 1.2.47`) | PASS |
| UI5 production build inside MTA | PASS |
| OfficeCLI documentation preflight | 1.0.142 PASS |
| `git diff --check` at evidence checkpoint | PASS |

The CAP compiler still emits the pre-existing attachment
`NonUpdateableProperties` annotation warning. Dependency audits still report
the advisories already tracked by the project security-review scope; no
automatic or force upgrade was performed.

## Failure and recovery evidence

- Parallel MBT/test execution produced a local dependency race. The incomplete
  run was rejected and all gates were rerun sequentially.
- Windows PowerShell 5.1 rejected `utf8NoBOM` and treated the expected
  user-provided-service probe stderr as a terminating error. The helper now
  uses the .NET UTF-8 writer and a list-based existence check.
- The first database export used only the integration profile and therefore
  lacked the private PostgreSQL connection fields. Render CLI then identified
  the current IP allow-list gap. The current `/32` was added while retaining
  all previous entries.
- The local private PostgreSQL password is stale. The implementation does not
  copy or rotate it; export uses the authenticated Render CLI instead.

## Remaining release gates

1. Merge this increment into `dev`.
2. Deploy the merged MTA.
3. Import the frozen archive into HANA with explicit `--execute`.
4. Verify entity counts, UUIDs, relationships and excluded auth data.
5. Configure and invoke the hourly Job Scheduler action.
6. Run XSUAA role matrix, S3, one new Brevo delivery and AI-disabled smoke.
7. Cut over the review URL and retain Render as rollback for seven days.
