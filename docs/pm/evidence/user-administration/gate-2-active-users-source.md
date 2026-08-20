# Gate 2 Active Users — Source Evidence

## Outcome / Kết quả

Source implementation evidence for Gate 2 Active Users is prepared on the isolated branch `feature/wp8-admin-active-users-donhv`. This record covers the read-only CAP contract, deterministic aggregation, UI tab/details source, focused tests, security surface, and source QA. It does not claim browser acceptance, human approval, deployment, merge, or Gate 3 readiness.

Evidence source cho Gate 2 Active Users được chuẩn bị trên branch cô lập `feature/wp8-admin-active-users-donhv`. Record này bao phủ CAP contract chỉ đọc, aggregation deterministic, source UI tab/details, test focused, security surface và QA source. Record không claim browser acceptance, human approval, deploy, merge hoặc sẵn sàng Gate 3.

## Frozen source / Source đã freeze

- Required base: `96746fef148d6d6b9627ed1e8b9be5b28eb94e81`
- Implementation commits: `f04c90f` (read-model contract), `4563585` (backend aggregation), `c9a5e34` (Active Users UI), `c789b4f` (paging/default-state remediation), `ea4621e` (restored-tab/UI paging remediation)
- Source path: `C:\Users\LapHub\.codex\worktrees\e429\IDTS-SAP01`
- Human owner: DonHV
- Coordinator: independent exact-diff review; executor does not self-approve

- Base bắt buộc: `96746fef148d6d6b9627ed1e8b9be5b28eb94e81`
- Commit implementation: `f04c90f` (contract read model), `4563585` (backend aggregation), `c9a5e34` (UI Active Users), `c789b4f` (paging/default-state remediation), `ea4621e` (restored-tab/UI paging remediation)
- Source path: `C:\Users\LapHub\.codex\worktrees\e429\IDTS-SAP01`
- Human owner: DonHV
- Coordinator: review exact diff độc lập; executor không tự approve

## Scope and contract / Phạm vi và contract

- `srv/user-admin.cds` adds `ActiveUserSummary` and `ActiveUserDetails` plus `searchActiveUsers(query, includeNonActive, skip, top)` and `readActiveUserDetails(userID)`.
- The public result is one row per persisted IDTS user, not one row per invitation.
- Default search excludes only derived `REVOKED` rows; `SUSPENDED` and `INCOMPLETE` rows remain visible, and `includeNonActive=true` adds revoked rows.
- Explicit `skip/top` paging is applied after complete filtering and stable ordering; `top` is bounded to 100 and no OData entity nextLink is claimed.
- Details return counts and an allow-listed Developer profile summary, not request/audit rows.
- No entity, aspect, field, CSV, database, provider, or platform artifact was added or changed.

- `srv/user-admin.cds` thêm `ActiveUserSummary`, `ActiveUserDetails` và hai action `searchActiveUsers(query, includeNonActive, skip, top)`, `readActiveUserDetails(userID)`.
- Result public là một row cho mỗi user IDTS persisted, không phải một row cho mỗi invitation.
- Search mặc định chỉ loại row `REVOKED`; row `SUSPENDED` và `INCOMPLETE` vẫn hiển thị, còn `includeNonActive=true` thêm revoked.
- Paging explicit `skip/top` chạy sau filter và sort ổn định; `top` tối đa 100 và không claim OData entity nextLink.
- Details chỉ trả count và summary profile Developer được allow-list, không trả request/audit row.
- Không thêm hoặc đổi entity, aspect, field, CSV, database, provider hay platform artifact.

## Deterministic aggregation and security / Aggregation deterministic và security

- Explicit-column CQL reads the existing user, onboarding-request, latest-operation, Developer profile/responsibility, and detail-only count sources.
- User source rows are not truncated at 200 before aggregation; filtering and stable sorting happen before the bounded page slice.
- Current request selection is deterministic (`modifiedAt`, `createdAt`, `ID` descending); duplicate active requests fail closed as `INCOMPLETE`.
- Only the chosen request's `latestOperation_ID` is read, so a stale operation cannot replace the current safe result.
- List reads do not load audit rows or bug rows. Details load only bounded counts/profile impact when requested.
- Identity linkage is a boolean only. Forbidden identity/provider/credential/lease/body output fields are absent from the CDS contract and returned objects.
- `requireActiveUserAdministrator` remains the exact PM + `UserAdmin` plus active-internal-PM guard, and authorization runs before each action's first query.
- No module-level cache or external provider call exists.

- CQL explicit-column đọc nguồn hiện có: user, onboarding request, latest operation, profile/responsibility Developer và count chỉ có ở details.
- User source row không bị cắt ở 200 trước aggregation; filter và sort ổn định chạy trước page slice bounded.
- Chọn request hiện tại deterministic theo `modifiedAt`, `createdAt`, `ID` giảm dần; duplicate active fail closed thành `INCOMPLETE`.
- Chỉ đọc `latestOperation_ID` của request được chọn nên stale operation không thay safe result hiện tại.
- List không load audit row hoặc bug row. Details chỉ load count bounded/profile impact khi được yêu cầu.
- Link identity chỉ là boolean. Forbidden identity/provider/credential/lease/body field không có trong CDS contract và object trả về.
- `requireActiveUserAdministrator` giữ đúng guard PM + `UserAdmin` và internal PM active; authorization chạy trước query đầu tiên của mỗi action.
- Không có cache cấp module hoặc provider call.

## QA Depth evidence / Evidence QA Depth

### Positive

- Focused in-memory CAP fixture proves one active user with active plus historical invitation rows returns one summary row.
- Active User details return request count, audit count, Developer profile summary, and safe operation result/timestamp.
- UI contract proves the three tabs, separate `activeUsers` model, details fragment, i18n keys, and read-only details action.

### Negative

- Default list excludes revoked/non-active rows.
- PM without `UserAdmin`, Tester with `UserAdmin`, mixed-role principal, and inactive PM are denied with the existing authorization boundary.
- The details fragment contains no role-change, suspend, reactivate, revoke, or Developer-profile save action.

### Edge and boundary

- Search is case-insensitive and the CDS `String(255)` boundary rejects a 256-character query with HTTP 400 before product handler execution.
- Explicit `skip/top` page bounds reject negative skip and `top > 100` with HTTP 400.
- A 205-row synthetic fixture returns pages of 100, 100, 5, and 0 with stable boundaries and no duplicate user IDs; users are not lost because of an early source-row limit.
- Empty/incomplete identity state stays safe; duplicate active requests become `INCOMPLETE`.
- A stale operation fixture cannot replace the selected request's current safe result.
- Result ordering is stable and each page is bounded to at most 100 rows; callers advance with `skip`.

### Roles and authorization

The service action and the existing UI route are both protected. UI tab visibility is not authorization. The programmatic matrix uses synthetic `.invalid` fixture identities only; no real identity tuple, token, provider response, or credential is stored in this evidence.

Action service và UI route hiện đều được bảo vệ. Việc hiển thị tab không phải authorization. Ma trận programmatic chỉ dùng identity fixture `.invalid` tổng hợp; evidence không lưu identity tuple thật, token, provider response hay credential.

### Persistence and reload

Source checks prove request-local CAP reads, explicit page progression, and UI session-state preservation for the selected tab, search query, and revoked-user filter. The restored-tab behavior test proves initial Active Users loading is awaited and does not double-load after the tab event. A browser hard-reload and live persistence check is intentionally pending DonHV-owned manual acceptance; source tests are not presented as browser proof.

### UI/UX review

The source uses an `IconTabBar`, responsive tables with pop-in columns, friendly localized labels, semantic `ObjectStatus`, busy/no-data/error/retry states, explicit Load More paging, and a display-only details dialog. Restored `activeUsers`/`developerResponsibilities` session tabs load Active Users during initial request loading and share one guarded promise. UI5 MCP linter returned zero findings on the changed files; local lint and build are separate gates. No screenshot is included because this source gate contains no approved manual PII-safe visual evidence.

## Exact source commands / Command source chính xác

Observed before this evidence commit:

```text
npm run qa:user-admin-active-users:programmatic       PASS (205-row paging/default-state fixtures)
npm run qa:user-onboarding:programmatic               PASS
npm run qa:user-admin-ui:programmatic                 PASS (paging + restored-tab fixtures)
npm run qa:user-access:programmatic                   PASS
npx cds compile srv/user-admin.cds --to edmx          exit 0
npx cds compile db/schema.cds --to hana                exit 0
npm --prefix app/user-administration-ui run lint      PASS
npm --prefix app/user-administration-ui run build     exit 0
officecli --version                                   1.0.144
```

The final source gate also ran `qa:immutable-identity:programmatic`, `qa:secret-scan`, `qa:agent-rules`, `qa:depth:self-test`, a fresh CAP/HANA/UI run, and the UI5 MCP linter. All returned exit 0 / PASS; the single secret-scan rerun was needed because the parallel runner reported no exit code, while the command itself returned PASS. The fresh post-commit `git diff --check origin/dev...HEAD` returned exit 0, and the schema/data inventory returned `NONE`.

## MCP and skills / MCP và skill

- CAP MCP model search located `UserAdministrationService` and the existing service endpoint; CAP documentation search supplied custom-action/transaction/explicit-query guidance.
- UI5 MCP project/API/linter checks identified SAPUI5 `1.148.0` and returned zero findings after the fragment dependency fix. No UI5 upgrade was made.
- Fiori MCP read-only functionality discovery confirmed this is an existing custom SAPUI5 app; its required internal `tools/list` protocol was not exposed as a callable tool in this session, so no Fiori write operation was attempted.
- Used `superpowers:executing-plans`, `superpowers:test-driven-development`, `superpowers:verification-before-completion`, `karpathy-guidelines`, `ponytail`, `verify`, `sap-cap`, `sap-ui5`, `sap-fiori-guidelines`, `backend-testing`, `api-testing-patterns`, `integration-testing`, and `document-code`.
- OfficeCLI preflight ran successfully (`1.0.144`); it does not author Markdown, so the Markdown mirrors were edited with the repository patch workflow.

- CAP MCP tìm được `UserAdministrationService` và endpoint service hiện có; CAP documentation search cung cấp hướng dẫn custom action/transaction/query explicit.
- UI5 MCP kiểm tra project/API/linter và xác nhận SAPUI5 `1.148.0`; sau khi sửa dependency fragment, linter trả zero finding. Không upgrade UI5.
- Fiori MCP discovery read-only xác nhận đây là custom SAPUI5 app hiện có; protocol `tools/list` nội bộ bắt buộc không có callable tool trong session nên không gọi Fiori write operation.
- Đã dùng các skill nêu ở phần English.
- OfficeCLI preflight chạy thành công (`1.0.144`); OfficeCLI không author Markdown nên mirror Markdown được sửa bằng patch workflow của repo.

## Tooling limitations / Giới hạn tooling

The normal dependency install hit the existing `@googleworkspace/cli` postinstall network failure. A script-suppressed install was used only to verify the already locked runtime; npm's transient lock metadata rewrite was restored byte-for-byte, and the existing locked `better-sqlite3` native binding was rebuilt locally. No dependency declaration or lockfile change is part of this Gate 2 diff. These are local tooling conditions, not product failures.

## Platform and Git mutation ledger / Ledger mutation platform và Git

- Platform/BTP/CF/HANA/HDI/XSUAA/IAS/IPS/provider/user/role/session/catalog: **none**.
- Jira/Drive: **none**.
- Repository source: only the focused Gate 2 commits and documentation/evidence on the isolated feature branch.
- Merge, Ready transition, deployment, and Gate 3: **not performed**.

- Platform/BTP/CF/HANA/HDI/XSUAA/IAS/IPS/provider/user/role/session/catalog: **không có**.
- Jira/Drive: **không có**.
- Source repo: chỉ các commit Gate 2 focused và docs/evidence trên feature branch cô lập.
- Merge, chuyển Ready, deployment và Gate 3: **chưa thực hiện**.

## Known gaps / Khoảng trống đã biết

- DonHV-owned manual browser acceptance remains pending: authorized PM + UserAdmin list/details, Tester denial, duplicate-row observation, hard reload/filter persistence, and unchanged Bug Management UI content.
- No live provider inventory, provider mutation, database deployment, seed/import, or platform readback is part of this gate.
- Ownership Knowledge Gate remains human-owned; this executor does not self-claim DonHV learning approval.

- Manual browser acceptance do DonHV sở hữu vẫn pending: PM + UserAdmin list/details, Tester denial, quan sát duplicate row, hard reload/persistence filter và xác nhận Bug Management UI không đổi.
- Không có provider inventory live, provider mutation, database deployment, seed/import hay platform readback trong gate này.
- Ownership Knowledge Gate vẫn do human sở hữu; executor không tự claim DonHV đã approve học tập.
