# WP8 Gate 6 — Operations and Audit source evidence

## English

### Boundary and frozen source

- Owner/executor: DonHV / Gate 6 executor.
- Branch: `feature/wp8-admin-operations-audit-donhv`.
- Required base, `origin/dev`, local `dev`, and merge-base: `aae01e375a15d7664281b8cee35ac16727e696cf`.
- Scope: source, tests, knowledge mirrors, PM evidence, exact branch push, one Draft PR, GitHub QA readback, and one bounded independent source/security review.
- Stop boundary: no deploy, HANA/HDI make, provider/email retry, data mutation, user/role/XSUAA/IAS/IPS/trust mutation, Jira/Drive mutation, Ready, merge, Gate 7, or worktree removal.

### Product changes

- `srv/user-admin.cds` defines explicit safe delivery, access-operation, audit-event, readiness DTOs and the bounded `retryOnboardingDelivery` action. Persistence entities remain unexposed.
- `srv/user-admin/operations-audit.js` applies PM + UserAdmin authorization, default 25/max 100 paging, stable ordering, safe masked display, allowlisted summaries, 12-character SHA-256 correlation fingerprints, a fixed seven-day outcome-timestamp freshness window, and optimistic retry guards. Delivery list eligibility performs one bounded bulk parent-request read per page; it does not use N+1 lookups. Readiness uses delivery `sentAt`/`lastAttemptAt` and operation `completedAt`, not managed `modifiedAt`.
- Delivery retry/list eligibility accepts only exact `FAILED` transient rows whose parent invitation is still `INVITED` and unexpired, below the configured attempt ceiling and outside an active lock; it resets only retry-safe fields, preserves recipient/template/provider history and attempt count, appends audit in the same transaction, then reuses the existing post-commit immediate outbox kick.
- Readiness is fail-closed: recent `SENT` => `AVAILABLE`; otherwise recent `FAILED` => `UNAVAILABLE`; recent `PENDING`, other/no conclusive state => `UNKNOWN`; stale rows are ignored.
- Ambiguous access operations expose Reconcile only; permanent failures expose neither action. Operations UI has Delivery/Provisioning subtabs; Audit is separate. UI models load lazily, details are safe/read-only, and loading/empty/error/action states are explicit and bilingual.
- Delivery details expose the safe persisted `sentAt` and `lastAttemptAt` timestamps so an operator can distinguish a fresh outcome from legacy rows without inspecting raw logs, provider responses, or database data.
- Readiness accepts both CAP logical column names and SAP HANA uppercase result keys. The same fail-closed outcome rules therefore apply on SQLite source tests and the live HANA adapter without changing persisted data.
- Successful broker operations using the persisted safe code `ROLE_COLLECTIONS_VERIFIED` render an allowlisted success explanation instead of the generic unavailable fallback.
- No `db/schema.cds` change and no generated schema artifact change are part of this candidate.

### Source verification

The maintained explicit suites are authoritative; root `npm test` is not used because the repository has no authoritative root test script.

- `npm run qa:user-admin-operations:programmatic` — PASS.
- `npm run qa:user-onboarding:programmatic` — PASS.
- `npm run qa:user-access:programmatic` — PASS.
- `npm run qa:user-admin-ui:programmatic` — PASS.
- `node scripts/qa/test-email-immediate-kick.js` — PASS.
- Active-users, access-lifecycle, user-access, broker, immutable-identity, secret scan, agent rules, and QA-depth self-test — PASS.
- `npx cds compile srv -s all --to edmx` — PASS; known pre-existing attachment annotation warning only.
- `npx cds compile db/schema.cds --to hana` — PASS.
- `npm --prefix app/user-administration-ui run lint` — PASS.
- `npm --prefix app/user-administration-ui run build` — PASS.
- UI5 MCP linter — PASS with zero findings after explicit fragment `core:require` formatter imports.
- UI audit DatePicker parameters are normalized before OData invocation: date-only `from` => `T00:00:00.000Z`, `to` => `T23:59:59.999Z`, empty/invalid => `null`.
- UI readiness normalizes either a direct structured action result or a UI5 `{ value: structuredResult }` result into top-level `adminReadiness` fields; focused runtime assertions prove success clears `busy/error` and failure clears `busy` while retaining `error`.
- Delivery, Operation, and Audit detail dialogs now reuse native `sapUiSmallMarginTop` on every label after the first; the UI contract asserts all three fragments and adds no custom CSS/dependency.
- `git diff --check origin/dev` — PASS, exit 0; exact schema diff, generated-artifact diff, and untracked generated-artifact counts are all zero.

### Dependency visibility mutation ledger

Coordinator-approved workaround only; no package installation or dependency mutation occurred.

| Check / mutation | Evidence |
| --- | --- |
| Root source state | `E:\IDTS-SAP01` was clean on branch `dev`; root `dev`, `origin/dev`, and merge-base matched the frozen SHA above. |
| Lockfile parity | Root and target `package-lock.json` SHA-256: `688A9CDCDB41E32E3C012AF9033EC8BFF079E0DF5FB2B3B29CD074D588F6E455`. |
| Required source trees | Root trees contained `@sap/cds`, `@cap-js/attachments`, `yaml`, `@ui5/cli`; the exact UI app tree contained the required ESLint packages. |
| Target preflight | Target root `node_modules` and target `app/user-administration-ui/node_modules` were absent before creation. |
| Junction 1 | `C:\Users\LapHub\.codex\worktrees\adf5\IDTS-SAP01\node_modules` → `E:\IDTS-SAP01\node_modules`; readback type `Junction`. |
| Junction 2 | `C:\Users\LapHub\.codex\worktrees\adf5\IDTS-SAP01\app\user-administration-ui\node_modules` → `E:\IDTS-SAP01\app\user-administration-ui\node_modules`; readback type `Junction`. |
| Repository effect | Junctions are ignored/untracked filesystem visibility only; no manifest, version, lockfile, install, upgrade, audit-fix, source, platform, or data mutation. |

### Privacy/security checks

The safe contract tests assert absence of recipient/provider IDs, body/raw error fields, lock/lease/idempotency fields, provider/identity hashes, tokens and credentials from safe DTOs. They also cover stale/PENDING/FAILED/SENT readiness semantics, parent invitation expiry/non-INVITED list eligibility, mismatched access request/operation state, inclusive date filtering, and exact UI DateTimeOffset parameter normalization. UI source and detail fragments bind only safe fields. Raw fixture values exist only in memory to test that they do not cross the DTO boundary; no provider outage is manufactured and no provider is called.

### Remaining handoff

The single bounded independent source/security review found 0 Critical/Major and 2 Important findings; both were remediated in source and covered by fresh focused regressions. A subsequent coordinator exact-head review found 3 additional Important findings (list parent eligibility, fail-closed PENDING readiness semantics, and UI DateTimeOffset normalization); all three are now remediated and the full exact matrix is green on the working tree. The reviewer made no edits. The next exact head and CI readback will be reported after the remediation commit/push. The worktree is intentionally preserved for coordinator feedback.

### Coordinator UI readiness and detail spacing remediation

- The live symptom was a successful readiness action not populating indicator fields when UI5 exposed the response under `value`; the bounded fix unwraps only the structured result and keeps CAP/backend behavior unchanged.
- TDD RED was captured before the production change at the new spacing/readiness assertions. GREEN then passed `npm run qa:user-admin-ui:programmatic`; no deployment, provider, email, user, role, data, schema, dependency, or lockfile mutation occurred.

## Tiếng Việt

### Phạm vi và source frozen

- Owner/executor: DonHV / Gate 6 executor.
- Branch: `feature/wp8-admin-operations-audit-donhv`.
- Base bắt buộc, `origin/dev`, `dev` local và merge-base: `aae01e375a15d7664281b8cee35ac16727e696cf`.
- Chỉ làm source, test, knowledge mirror, PM evidence, push branch exact, một Draft PR, GitHub QA readback và một bounded independent source/security review.
- Không deploy, HANA/HDI make, retry provider/email, data mutation, user/role/XSUAA/IAS/IPS/trust mutation, Jira/Drive, Ready, merge, Gate 7 hoặc remove worktree.

### Tóm tắt thay đổi

Gate 6 thêm safe DTO/action cho delivery, access operation, audit và readiness; paging 25/100; order ổn định; mask display; correlation fingerprint 12 ký tự; readiness freshness bảy ngày và semantics fail-closed; retry onboarding delivery optimistic chỉ khi parent invitation còn hợp lệ, có ceiling, audit cùng transaction và existing outbox kick sau commit. UI tách Delivery/Provisioning và Audit, lazy model, detail an toàn, state loading/empty/error, normalize DateTimeOffset audit và copy song ngữ. Không thay đổi schema/generated artifact.

Hộp chi tiết Delivery hiển thị thêm hai timestamp an toàn đã persist là `sentAt` và `lastAttemptAt`. PM có thể phân biệt outcome mới với dữ liệu legacy mà không cần xem log thô, provider response hoặc dữ liệu database.

Readiness đọc được cả tên cột logic của CAP và key uppercase do SAP HANA trả về. Quy tắc outcome fail-closed vì vậy hoạt động giống nhau trên SQLite source test và HANA live mà không đổi dữ liệu persist.

Operation broker thành công có safe code persist `ROLE_COLLECTIONS_VERIFIED` được hiển thị bằng mô tả thành công allowlist thay vì fallback unavailable chung.

### Ledger workaround dependency

Chỉ dùng hai NTFS junction đã được coordinator cho phép sau khi kiểm tra root `E:\IDTS-SAP01` clean/exact, package-lock SHA parity `688A9CDCDB41E32E3C012AF9033EC8BFF079E0DF5FB2B3B29CD074D588F6E455`, tree dependency tồn tại và target path vắng. Junction chỉ để visibility trong local worktree, bị ignore/untracked, không install/upgrade/audit-fix và không đổi manifest/version/lockfile/source/platform/data.

### Handoff

Đây là evidence source-only. Một bounded independent source/security review duy nhất phát hiện 0 Critical/Major và 2 Important; cả hai đã được fix trong source và có focused regression mới. Sau đó coordinator exact-head review phát hiện thêm 3 Important (eligibility parent trên list, semantics PENDING readiness fail-closed và normalize DateTimeOffset UI); cả ba đã được fix và full exact matrix trên working tree đã PASS. Reviewer không sửa file. Head/CI readback mới sẽ báo sau khi commit/push remediation. Giữ nguyên worktree để coordinator review.
