# User Administration manual acceptance — DonHV — 2026-08-20

## Evidence boundary

- Executor and approver: DonHV.
- Environment: SAP BTP Trial shared demo runtime.
- Evidence source: five DonHV-provided browser screenshots captured after the bounded readiness recovery.
- Privacy: the raw screenshots contain a full user email and private runtime hostname, so they are not committed to Git. This record preserves the visible allowlisted claims, byte sizes, and SHA-256 digests without reproducing PII or private endpoints.
- No agent-generated browser action or product mutation is represented as DonHV evidence.

## UA-MANUAL-001 — authorization matrix

Result: **PASS**.

DonHV assigned the first two screenshots to this case.

1. The authorized PM + UserAdmin session renders the User Administration console. The controlled TESTER request is `ACTIVE`, User Administration capability is not enabled for that TESTER, and the PM-only edit/revoke actions are visible.
2. A fresh controlled TESTER session requests the same User Administration application and receives `Forbidden`; the administration console and its data are not rendered.

This proves the positive PM administration path and the negative TESTER authorization path at the browser boundary. UI visibility is treated only as supporting evidence; backend authorization remains covered by the programmatic role-matrix tests in PR #318.

## UA-MANUAL-002 — persistence and controlled TESTER access

Result: **PASS**.

DonHV assigned the remaining three screenshots to this case.

1. Reopening/reloading User Administration retains the controlled TESTER request as `ACTIVE` and keeps the same PM management actions available.
2. A second post-reload capture retains the same `ACTIVE` state, supporting persistence/readback rather than a transient success toast.
3. The controlled TESTER signs in to the main Bug Management UI, the Bug list renders, and the profile menu reports role `Tester`.

This proves post-reload User Administration state and positive business-application access for the controlled TESTER. It does not claim Developer-profile acceptance, revoke acceptance, or a broad production-readiness result.

## Attachment digest manifest

The digest order is the order supplied by DonHV in this acceptance message.

| Case | Image | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| UA-MANUAL-001 | 1 | 88,551 | `9a9aad265d9c31752ff3115b548ba3c44715452d826097f3f2a0a7be54d88fd0` |
| UA-MANUAL-001 | 2 | 41,849 | `4a9e1e24f651243bacf1d1cda47763d814ad6691eb63c22a3d22520c511ba326` |
| UA-MANUAL-002 | 3 | 85,202 | `1257a8fb9665a8eb4bb32c15e485637a53d3fb750e3339552f2f2a15d76a50c3` |
| UA-MANUAL-002 | 4 | 88,248 | `bbd5b8183c453ed77d09c4cf60d86e0c26f3486c3097bdee69b5c1dc6af4ae02` |
| UA-MANUAL-002 | 5 | 230,404 | `f21c24c3e8311c28c9f8e0054631114b1a5b3e466276493853f3a3b5de5668cb` |

## Overall result

`UA-MANUAL-001=PASS`

`UA-MANUAL-002=PASS`

The final DonHV-owned manual proof selected for PR #318 is complete for the stated PM positive, TESTER negative, reload persistence, and controlled TESTER application-access scope.
