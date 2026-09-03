# Gate 7 User Profile and Notification UX — Source Evidence

## Scope

This source candidate improves the native My Notifications hierarchy, carries an explicit display name through onboarding/provisioning, and adds an active PM + `UserAdmin`-only display-name correction action with optimistic concurrency and structured audit. It performs no deployment, HANA live mutation, provider call, email send, role change, identity relink, or automatic data cleanup.

## Login-email feasibility decision

The current XSUAA runtime maps authorization through an immutable `origin + issuer + user_uuid` identity. The reviewed broker contract `SAP_USER_MANAGEMENT_OPENAPI_69DC872E_V2` reads the BTP shadow user and changes only allowlisted Role Collection memberships through group PATCH operations. It does not administer the upstream SAP Universal ID or Identity Authentication login identifier. Consequently the source candidate deliberately contains no `Change login email` action and no provider user-email PATCH. Updating HANA email alone is prohibited because it would misrepresent the actual login state.

## TDD evidence

- Notification RED: native unread highlight and four-region row hierarchy were absent; GREEN: `qa:my-notifications:ui` passed.
- Invitation RED: CDS persistence/action and UI display-name binding were absent; GREEN: onboarding contract, UI contract, programmatic persistence, and broker provisioning checks passed.
- Active User RED: `updateActiveUserDisplayName` was absent; GREEN: UserAdmin success, unauthorized rejection, invalid input, stale-version rejection, email preservation, and structured audit passed.

## Fresh verification

- PASS: My Notifications UI/client shell; User Administration UI; onboarding; Active Users; user-access/provider broker; immutable identity; access notifications; notification model/service; Operations/Audit.
- PASS: CAP EDMX compile and HANA compile. The known unrelated attachment `NonUpdateableProperties` compiler warning remains.
- PASS: User Administration and Bug Management ESLint/build; SAPUI5 1.148.0.
- PASS: secret scan, agent rules 8/8, QA-depth self-test 8/8, AI DevKit lint 5/5, and `git diff --check`.
- Codex Security diff scan `05ed1775-a17e-4643-b4a3-4a0811a18ac5`: complete, 15 executable review items, 0 reportable findings. TAC status was unavailable because the connector was not connected. Measured scan usage was partial: 6,060,363 total tokens, including 6,030,464 cached input tokens; the workbench reported missing rollout coverage.
- The Operations/Audit suite initially failed because its supposedly future fixture expiry was `2026-09-01`, already past on the current date. The fixture default was moved to `2099-09-01`; the explicit expired case stays `2026-08-01`, and the fresh rerun passed.

## Stop boundary

The source branch may advance only after the full local verification and bounded security review are clean. Draft PR is the maximum remote state. Ready, merge, deploy, HDI migration, live provider/data/user mutation, and worktree cleanup are separate decisions.
