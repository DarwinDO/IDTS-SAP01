# Gate 3B Existing User Identity Link — Source Evidence

## English

### Scope and authority

- Human/coordinator: DonHV; source branch: `feature/wp8-existing-user-identity-link-donhv`.
- Frozen base: `44b89db5db22e2ea65d4a85d746f57ad3a8f840e` (`origin/dev` and `dev` at task start).
- Source implementation commits: `b14064b`, `c4a751c`, `9067497`, `be803f6`, `e0719fb`, `d3ca17f`, `2dde055`, `3a9c179`, `d5d60c9`, `ba94757`, `7b7e062`; documentation/evidence/status checkpoints: `566dcda`, `8bba402`.
- The frozen review of `44b89db..7b64909` found four Important and three Minor findings; `ba94757` and `7b7e062` remediate them in source/tests. The final exact head and one bounded independent re-review must be read back fresh after the remaining PM/evidence commit. No merge or Ready transition is implied by this artifact.
- Approved authority: `docs/superpowers/specs/2026-08-21-gate-3b-existing-user-identity-link-design.md` and `docs/superpowers/plans/2026-08-21-gate-3b-existing-user-identity-link-implementation.md`.

### Delivered source behavior

- Additive request model: nullable `linkTargetUser` association and `linkSourceEmailNormalized` snapshot; public action accepts only `userID` and `email`.
- Existing-user request/verification: server-owned active legacy TESTER/DEVELOPER target, signed invitation, exact target lock, immutable identity verification, version-2 `LINK_EXISTING` queue, and no PM re-approval.
- Broker: `LINK_EXISTING` performs one exact Role Collection readback and returns a safe no-op result. No assign, unassign, PATCH, or compensation path is available.
- CAP completion: exact same `Users.ID`; request/operation correlation IDs must match exactly; completion locks the explicit Users collision read before checking normalized email/hash ownership, then conditionally updates only email and the four immutable identity fields and finalizes request/operation/audit atomically. Profiles, responsibilities, Bugs, comments, notifications, history, display name, role, active flag, and password data are preserved.
- Assignment readiness: one exact matching `ACTIVE` identity request is required for new direct assignment and Smart Assign. Existing Bug assignees are not rewritten.
- Active Users: request rows are read/deduplicated through both `activeUser_ID` and private `linkTargetUser_ID`, so pending target-linked requests hide duplicate link eligibility.
- UI: safe server-owned `linkEligible` controls a localized dialog with a read-only current business role and explicit same-`Users.ID`/Profile/responsibilities/Bug/comment/history preservation copy; submit lowercases and sends only `userID` and email, reports queued status, and reloads Requests/Active Users.

### Schema/API delta

| Artifact | Exact delta |
| --- | --- |
| `db/schema.cds` | `UserOnboardingRequests.linkTargetUser : Association to Users` and nullable `linkSourceEmailNormalized : String(255)` |
| `srv/user-admin.cds` | `requestExistingUserIdentityLink(userID : UUID, email : String(255)) returns OnboardingResult` plus safe `linkEligible` Booleans in Active Users summary/details |
| Lifecycle state | Reuses `PROVISION_QUEUED -> PROVISIONING -> ACTIVE`; no new code-list row |

### Verification evidence

Passed source checks:

- `node --check` passed for every changed JavaScript source and focused test file.
- PowerShell XML parse passed for `ActiveUserDetails.fragment.xml` and `LinkExistingIdentity.fragment.xml`.
- Direct broker readback probe passed for exact `LINK_EXISTING` result and one `listRoleCollections` call; mismatch probe failed closed; direct worker mapping probe passed.
- Direct provider probes passed for exact readback, zero writes, and duplicate Role Collection rejection. Source assertions and focused fixtures cover exact correlation equality, cross-target same-email one-winner/one-blocked behavior, pending target-linked Active Users visibility, and the expanded preservation snapshot.
- `git diff --check` passed with only the known LF-to-CRLF working-copy warnings.
- `npm run qa:immutable-identity:programmatic`, `npm run qa:secret-scan`, `npm run qa:agent-rules`, `npm run qa:depth:self-test` (15/15), and `node scripts/qa/test-user-access-provisioning-contract.js` passed.
- Task 1 review fix/re-review: no Critical/Important findings; Task 2 replacement review: no findings; Task 3 review: no Critical/Important with deferred test-quality items triaged inline; Task 4 review: no Critical/Important with deferred test-quality items triaged inline.

Environment-blocked or not claimable as runtime PASS:

- CAP/SQLite focused fixtures and provisioning/Active Users/Smart Assign suites stop because locked `@sap/cds` is not materialized.
- Broker runtime and UI contract scripts stop before assertions because locked `yaml` is not materialized.
- CAP EDMX/HANA compile remains blocked by unresolved `@cap-js/attachments`/`ManagedAttachments` in the locked environment.
- UI lint cannot find `eslint`; UI build cannot find `ui5`.
- UI5 MCP linter returned no textual findings/output; this is recorded as tool-output limitation, not a linter PASS.
- No live provider, BTP, HANA/HDI, email, invitation-delivery, user, identity, Role Collection, deployment, or browser acceptance was run.

### Security/privacy review

- Public/API/UI surfaces omit provider identifiers, identity claims, platform IDs, raw token/JWT/cookie/OTP material, endpoint/body details, credentials, operation leases, and full identity hashes; the dialog exposes only safe business role and preservation copy.
- Audit summaries are fixed safe text; target associations and operation/request links remain internal persistence relationships.
- `LINK_EXISTING` is explicitly zero-write at the provider boundary and the final local update is exact-target, role/source-email/null-tuple constrained.
- Duplicate email/hash, partial identity, wrong role, inactive target, stale source, PM target, replay, concurrent request/completion, cross-target same-email race, exact correlation drift, invalid email, duplicate provider readback, and ambiguous active-link cases are represented in focused source contracts; runtime execution remains dependency-blocked.
- The post-user-update fault-injection rollback proof remains a documented test-quality deferral because the locked CAP fixture has no supported fault-injection hook; the transaction boundary and preservation snapshot are source-visible.

### Mutation ledger

| Surface | Result |
| --- | --- |
| Git source/docs/branch | Authorized source-only changes and commits on the isolated feature branch |
| Provider/SAP user/Role Collection | No calls or mutation; only local source mocks/probes |
| CAP/HANA/HDI/database/data | No deployment, simulate/make, migration, seed, or live data mutation |
| Email/invitation | No real invitation or email sent; source-only delivery contract only |
| BTP/XSUAA/IAS/IPS/trust | No mutation |
| Jira/Drive/Google artifacts | No mutation |
| Merge/Ready/deploy/Gate 4/5 | Not performed |

### Next approval

Coordinator must review the new exact-head diff and bounded re-review result before any Draft PR is created. Runtime/live identity acceptance, any provider readback, deployment, merge, Ready transition, and Gate 4/5 require separate DonHV approval.

## Tiếng Việt

### Phạm vi và nguồn chuẩn

- Owner/coordinator: DonHV; branch source: `feature/wp8-existing-user-identity-link-donhv`.
- Base đóng băng: `44b89db5db22e2ea65d4a85d746f57ad3a8f840e` (`origin/dev` và `dev` tại thời điểm bắt đầu).
- Các commit source: `b14064b`, `c4a751c`, `9067497`, `be803f6`, `e0719fb`, `d3ca17f`, `2dde055`, `3a9c179`, `d5d60c9`.
- Review frozen trước đó trên `44b89db..7b64909` phát hiện 4 Important và 3 Minor; `ba94757` và `7b7e062` đã remediation ở source/test. Exact head cuối và một bounded re-review sẽ được đọc lại sau commit PM/evidence; artifact này không hàm ý merge hoặc Ready.
- Spec/plan được duyệt là nguồn chuẩn theo hai file trong `docs/superpowers/` nêu trên.

### Behavior source đã giao

Giữ nguyên `Users.ID` được chọn; link identity chỉ readback provider; CAP update cùng row, lock collision Users và bind exact correlation request/operation, giữ profile/responsibility/Bug/comment/notification/history; assignment mới và Smart Assign yêu cầu đúng một identity link `ACTIVE`; Active Users ẩn pending target-linked request; UI hiển thị role read-only, copy preservation đầy đủ, chỉ gửi `userID` và email lowercase, báo queued và reload an toàn.

### Kết quả verification và giới hạn

Syntax JS, XML parse, probe broker read-only/duplicate/zero-write, source assertions, immutable identity, secret scan, agent rules, QA-depth 15/15 và user-access contract đã pass. Fixture CAP/SQLite, broker/UI runtime, CAP compile, UI lint/build và provider/live acceptance không được claim PASS vì dependency locked (`@sap/cds`, `yaml`, `eslint`, `ui5`) thiếu hoặc CAP attachments không resolve. Không có mutation provider, user, identity, Role Collection, database/data, HANA/HDI, BTP, email, Jira, Drive, deploy, merge hoặc Gate 4/5.

### Approval tiếp theo

Coordinator review exact-head diff và bounded re-review trước khi quyết định Draft PR. Runtime/live identity acceptance, provider readback, deploy, merge, Ready và Gate 4/5 cần DonHV approval riêng.
