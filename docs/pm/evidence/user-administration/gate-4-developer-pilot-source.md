# Gate 4 Developer Responsibilities — Source Evidence

## Scope

- Base: `04643e12727290f2f35fd56e9c3d2a8df4cbcdbc`
- Branch: `feature/wp8-admin-developer-pilot-donhv`
- Gate: source review and selective User Administration UI hardening only
- Merge commit: `7bf7609ca070fae0d467c4964051eee0956828ad`
- Live controlled non-member Developer pilot: PASS on 2026-08-23

## Positive contract

- A complete Developer request can materialize one active Developer Profile and its responsibilities only after exact provider-role proof.
- Repeating local completion is idempotent and does not duplicate the User, profile or responsibility rows.
- Deactivating a responsibility removes the Developer from new assignment candidates; reactivating restores eligibility without duplicate rows.
- Existing Bugs retain their current assignee when responsibilities change.

## Negative and boundary contract

- Incomplete Developer profile data cannot complete locally or become `ACTIVE` after provider proof.
- The UI requires a reason, explicit preservation confirmation and a single in-flight save.
- The Gate 4 delta adds no entity, database field, public provider field, dependency or new service.
- No provider write, SAP user, Role Collection, email, HANA/HDI/data or BTP configuration mutation is part of source verification.

## TDD findings

- Smart Assign fixtures incorrectly used a Developer Profile ID where immutable identity requires the associated User ID; the test fixture was corrected without weakening production checks.
- A second fixture used a display name as the PM actor; it now uses the exact seeded PM User ID.
- The responsibility administration fixture now deploys the existing BugService projection before reading assignment candidates.
- The asynchronous UI probe now waits one event-loop turn before asserting the in-flight invocation count.

## Product hardening

- User Administration UI version advances from `1.0.9` to `1.0.10`.
- Manage Responsibilities states that existing Bugs keep their assignee and requires explicit confirmation before save.
- Save is disabled and the dialog is busy while the request is in flight, preventing duplicate submission.

## Tool and review notes

- OfficeCLI preflight: `1.0.144`. OfficeCLI does not semantically validate Markdown, so repository diff and text checks are authoritative for this evidence file.
- CAP/UI5/Fiori MCP tools were unavailable in this executor environment; the source gate uses the repository's CAP compile, UI lint/build and focused programmatic suites instead.
- Ponytail boundary: reuse the existing service/actions/entities and add no dependency or speculative abstraction.
- External mutation count during this source evidence phase: zero.

## Live rollout and acceptance

- GitHub PR #335 passed `qa-depth-gate` and merged into `dev` at `7bf7609ca070fae0d467c4964051eee0956828ad`.
- Selective UI artifact `idts-user-admin-ui-gate4-7bf7609.mtar` had SHA-256 `02E79B348DB92E9E03D43E2C01D014DECB4CFA276FF6A2802143DDC783F32AD4` and contained only the two reviewed HTML5 application ZIPs. User Administration content read back at version `1.0.10`.
- `sap.default` remained active and available for user logon. `Create Shadow Users on User Logon` changed from `false` to `true`, with exact post-update readback `true`, so future invited SAP ID users do not require manual shadow-user creation. No Role Collection or trust origin was added or removed.
- The controlled identity is recorded only as a non-member Developer; its raw email is intentionally excluded from repository evidence.
- After invitation and SAP identity verification, the request reached `ACTIVE`. Active Users readback proved business role `DEVELOPER`, identity link `Yes`, Developer readiness `Ready`, one active responsibility, no pending operation, availability `AVAILABLE`, workload limit `3`, and zero open Bugs assigned at activation.
- A fresh session after provider completion successfully opened IDTS Bug Management and displayed role `Developer`. This also proves the user needed a fresh token after the asynchronous role assignment; the verification page itself remained a static pending acknowledgement and did not auto-refresh.
- HANA Cloud was asleep during the acceptance window. The repository-supported `btp:demo:prepare` started it once, waited for readiness and restarted CAP once to clear stale pooled connections. Final readiness was CAP `1/1`, AppRouter `1/1`, liveness `200`, DB readiness `200`, anonymous protected API `401`, Web `200`, `DEMO READY`.

## Remaining limitation

- The identity-verification success page is a point-in-time acknowledgement. It does not poll provisioning or redirect automatically when the request becomes `ACTIVE`; users must start a fresh application session to receive the newly assigned role token.
