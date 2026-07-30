# IDTS-113 - BTP Developer role-collection remediation

Date: 2026-07-29

Executor: DonHV / Codex support

Status: CONFIGURATION PASS - MEMBER SIGN-IN PENDING

## Finding

A sanitized SAP BTP CLI readback compared the three IDTS role collections
against the XSUAA role templates deployed for the application.

| Role collection | Current role source | Assigned users | Result |
| --- | --- | ---: | --- |
| `IDTS_PM` | IDTS XSUAA `PM` | 1 | Correct |
| `IDTS_TESTER` | IDTS XSUAA `Tester` | 1 | Correct |
| `IDTS_DEVELOPER` | HTML5 Application Frontend Developer | 2 | Incorrect |

The two Developer member assignments are present. The defect is limited to the
role referenced by the collection: it grants an HTML5 frontend role rather than
the IDTS application `DEVELOPER` scope.

## Remediation boundary

- Preserve the existing `IDTS_DEVELOPER` collection name.
- Preserve both existing user assignments.
- Remove only the unrelated HTML5 role reference.
- Add the `Developer` role generated from the IDTS XSUAA role template.
- Do not change HANA users, application data, S3, Brevo, Render or runtime
  deployment.

## Acceptance evidence required

- BTP CLI reports the IDTS XSUAA `Developer` role reference.
- BTP CLI reports two retained, masked user assignments.
- `IDTS_PM` and `IDTS_TESTER` remain unchanged.
- A member-owned Developer sign-in confirms the live application role.

No credential, token, service key or full private identity is stored in this
evidence.

## Remediation result

The `IDTS_DEVELOPER` collection was edited in SAP BTP Cockpit without changing
its name or user assignments:

- Added the `Developer` role from the deployed IDTS XSUAA application.
- Removed the unrelated HTML5 Application Frontend Developer role.
- Preserved both existing Developer member assignments.

Sanitized BTP CLI readback after Save:

| Role collection | Stored role reference | Assigned users | Result |
| --- | --- | ---: | --- |
| `IDTS_PM` | IDTS XSUAA `PM` | 1 | PASS |
| `IDTS_TESTER` | IDTS XSUAA `Tester` | 1 | PASS |
| `IDTS_DEVELOPER` | IDTS XSUAA `Developer` | 2 | PASS |

The collection-level authorization defect is resolved. Final application-level
acceptance remains pending until a Developer member performs their own
interactive SAP Identity sign-in and the application confirms the live
`DEVELOPER` scope. The agent does not impersonate a member for this check.

## Verification

- SAP BTP Cockpit readback: one IDTS `Developer` role and two retained users.
- SAP BTP CLI role readback: PASS for `IDTS_PM`, `IDTS_TESTER` and
  `IDTS_DEVELOPER`.
- `npm run qa:idts113:btp-auth`: PASS, 12/12.
- `npm run qa:agent-rules`: PASS.
- `npm run qa:secret-scan`: PASS.
- `npm run qa:depth:self-test`: PASS, 15/15.
- `npx ai-devkit@latest lint --json`: PASS, 5/5.
- `git diff --check`: PASS; only existing line-ending warnings were reported.
- Jira audit trail: IDTS-113 comment `10726`.
