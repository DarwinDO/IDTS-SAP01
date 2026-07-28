# IDTS-113 BTP Member Identity Onboarding Evidence

Date: 2026-07-28

Baseline Git SHA: `0a02bdabb91beb18dab9524daf01b37be98bf10b`

Cloud Foundry org/space: `f5648117trial / dev`

## Scope

This evidence covers the BTP identity and business-role alignment for SangVN,
DatDT and NhanT. Personal e-mail addresses are intentionally masked in this
tracked report. No password, token, service credential or private database
connection string is included.

## BTP provisioning

The three requested users exist under the subaccount's Default identity
provider.

| Member | Masked identity | BTP role collection | Result |
| --- | --- | --- | --- |
| SangVN | `sa***@fpt.edu.vn` | `IDTS_DEVELOPER` | PASS |
| DatDT | `da***@fpt.edu.vn` | `IDTS_DEVELOPER` | PASS |
| NhanT | `nh***@fpt.edu.vn` | `IDTS_TESTER` | PASS |

The BTP Cockpit readback showed two users in `IDTS_DEVELOPER` and one user in
`IDTS_TESTER` after each role collection was saved.

## HANA business-user alignment

Cloud Foundry task
`idts113-verify-platform-user-email-hashes-20260728` (sequence 25) read the
bound HANA database without printing personal e-mail values. It normalized each
stored e-mail to lowercase, compared its SHA-256 digest with the approved
target digest, and verified the existing business role.

| Member | E-mail digest matches approved identity | Database role | Active | Result |
| --- | --- | --- | ---: | --- |
| SangVN | Yes | `DEVELOPER` | 1 | PASS |
| DatDT | Yes | `DEVELOPER` | 1 | PASS |
| NhanT | Yes | `TESTER` | 1 | PASS |

The task returned `SUCCEEDED`. Because all three exact digest comparisons
already passed, no HANA `UPDATE` was executed. User IDs, roles and all existing
associations therefore remained unchanged.

## Authorization verification

`npm run qa:idts113:btp-auth` passed 12/12 checks, including:

- exactly one XSUAA business role must match the HANA `Users.role_code`;
- role mismatch is rejected with HTTP 403;
- missing or multiple business roles are rejected with HTTP 403;
- JWT identity candidates include standard subject and e-mail claims;
- production uses XSUAA while the Render integration profile remains custom
  auth;
- AppRouter and HTML5 application routes protect OData with XSUAA.

The currently available authenticated browser session was also read back as:

- User: DonHV;
- Business role: Project Manager;
- Session source: SAP BTP.

## Anonymous protection check

An anonymous request to the AppRouter application/OData route returned the
XSUAA login-bootstrap HTML (`Content-Type: text/html`) rather than application
content or OData metadata. A status-only assertion is not sufficient here
because this AppRouter login bootstrap itself returns HTTP 200.

## Remaining human sign-in check

The provisioning, role assignment, HANA identity alignment and backend
authorization rules are verified. A final interactive login for each member
still requires that member to authenticate with their own SAP identity. The
agent did not impersonate a member, inspect a saved password or manufacture a
live-user PASS.

After each member signs in once, verify:

1. the profile shows the expected member and role;
2. a Developer can access Developer flows but not Tester/PM-only actions;
3. the Tester can access Tester flows but not Developer/PM-only actions;
4. no HTTP 403 is caused by a BTP/HANA role mismatch.
