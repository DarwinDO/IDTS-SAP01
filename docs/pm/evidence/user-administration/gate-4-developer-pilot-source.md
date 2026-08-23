# Gate 4 Developer Responsibilities — Source Evidence

## Scope

- Base: `04643e12727290f2f35fd56e9c3d2a8df4cbcdbc`
- Branch: `feature/wp8-admin-developer-pilot-donhv`
- Gate: source review and selective User Administration UI hardening only
- Live controlled non-member Developer pilot: pending after merge and rollout

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
