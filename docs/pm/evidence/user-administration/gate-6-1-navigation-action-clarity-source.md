# WP8 Gate 6.1 — User Administration Navigation and Action Clarity

## English

### Source-gate identity

- Date: 2026-08-25 (Asia/Bangkok)
- Human owner/coordinator: DonHV
- Executor branch: `fix/wp8-user-admin-navigation-action-ux-donhv`
- Frozen base: `3f3efc113a4ebd708d3f88a314941e51817eb843`
- Source commit: `66bb31fa4824511204893c52d4e39377df2e8fff` (`fix(wp8): clarify user administration navigation actions`)
- Scope: UI-only Gate 6.1. CAP, broker, schema, HANA, service bindings, provider/user/role data, package versions, dependencies, lockfiles, Jira, Drive, deployment, merge, Ready, and worktree removal were not authorized.

### Implemented contract

- Replaced both `sap-icon://skills` usages with the approved `sap-icon://activity-individual` Developer Responsibilities tab icon and `sap-icon://action-settings` Manage Responsibilities row-action icon.
- Preserved `sap-icon://edit` for Change Role, `sap-icon://decline` for Revoke, all existing visibility expressions, and all existing press handlers.
- Added native main `IconTabBar` properties `headerMode="Inline"`, `tabDensityMode="Compact"`, and `tabsOverflowMode="End"`.
- Added localized tooltips for all six top-level tabs and distinct row-action tooltip keys for Change business role, Manage Developer availability and responsibilities, and Revoke access.
- Added a Change Role-only informational strip directing profile-only availability, workload, or responsibility changes to Manage Responsibilities.

### TDD evidence

- RED: after locked dependency visibility was restored, `npm run qa:user-admin-ui:programmatic` failed at the new invalid-icon assertion while the old `sap-icon://skills` values and missing clarity contract were still present.
- GREEN: `npm run qa:user-admin-ui:programmatic` returned `IDTS User Administration UI contract: PASS`.

### Verification matrix

| Check | Result |
| --- | --- |
| `npm run qa:user-admin-ui:programmatic` | PASS |
| `npm run qa:user-onboarding:programmatic` | PASS |
| `npm run lint --prefix app/user-administration-ui` | PASS |
| `npm run build --prefix app/user-administration-ui` | PASS; UI5 1.148.0 build succeeded |
| `npm run qa:secret-scan` | PASS; no credential-like key patterns |
| `npm run qa:agent-rules` | PASS; 8 required rules |
| `npm run qa:depth:self-test` | PASS; 15/15 |
| `git diff --check origin/dev` | Exit 0; only non-blocking Windows LF-to-CRLF checkout warnings |
| `npm run qa:user-admin-operations:programmatic` | PASS after the dedicated test-only fixture correction merged through PR #341; production UI/CAP behavior remains unchanged |

### Scope and mutation proof

- `git diff --quiet origin/dev -- srv db package.json package-lock.json app/user-administration-ui/package.json app/user-administration-ui/package-lock.json` returned exit `0`.
- No CAP/backend, schema, package manifest, package-lock, controller, provider, user, role, HANA, HDI, service binding, Jira, Drive, deployment, merge, or Ready mutation occurred.
- Two local NTFS junctions expose the exact locked dependency trees from `E:\IDTS-SAP01` and are excluded from Git. No install, upgrade, audit fix, or lockfile write ran.
- UI5 MCP tools were not callable in this session. The installed `sap-ui5`, `sap-fiori-guidelines`, `karpathy-guidelines`, `ponytail`, TDD, and verification workflows were applied; local UI5 lint/build supplied the available tool evidence.
- Existing DonHV composite Ownership Knowledge Gate evidence is PASS (90%, critical/debug/teach-back PASS): `docs/pm/evidence/user-administration/knowledge-gate-donhv-composite-2026-08-20.md`.

### Handoff boundary

This is a source candidate only. The coordinator independently reviewed the product diff with zero findings. The pre-existing Operations/Audit date-fixture blocker was isolated, fixed test-only, verified, and merged separately through PR #341 before this branch was refreshed. PR #340 remains the one Gate 6.1 Draft PR. No runtime/browser acceptance, deployment, provider/data mutation, merge, Ready transition, or cleanup is claimed here.

## Tiếng Việt

### Nhận diện source gate

- Ngày: 25/08/2026 (Asia/Bangkok)
- Owner/coordinator: DonHV
- Branch executor: `fix/wp8-user-admin-navigation-action-ux-donhv`
- Base frozen: `3f3efc113a4ebd708d3f88a314941e51817eb843`
- Source commit: `66bb31f` (`fix(wp8): clarify user administration navigation actions`)
- Scope: Gate 6.1 chỉ UI. Không được phép đổi CAP, broker, schema, HANA, service binding, dữ liệu provider/user/role, package version, dependency, lockfile, Jira, Drive, deploy, merge, Ready hoặc remove worktree.

### Contract đã triển khai

- Thay cả hai usage `sap-icon://skills` bằng icon đã duyệt: tab Developer Responsibilities dùng `sap-icon://activity-individual`, row action Manage Responsibilities dùng `sap-icon://action-settings`.
- Giữ `sap-icon://edit` cho Change Role, `sap-icon://decline` cho Revoke, giữ nguyên mọi expression visibility và press handler hiện có.
- Thêm property native cho `IconTabBar` chính: `headerMode="Inline"`, `tabDensityMode="Compact"` và `tabsOverflowMode="End"`.
- Thêm tooltip đã localize cho cả sáu tab cấp cao và key tooltip riêng cho ba row action: đổi business role, quản lý availability và responsibility Developer, thu hồi quyền truy cập.
- Thêm informational strip chỉ hiện trong Change Role, hướng user sang Manage Responsibilities nếu chỉ đổi availability, workload hoặc responsibility.

### Bằng chứng TDD

- RED: sau khi khôi phục dependency visibility exact, `npm run qa:user-admin-ui:programmatic` fail tại assertion icon invalid mới khi source cũ vẫn còn `sap-icon://skills` và thiếu contract làm rõ.
- GREEN: `npm run qa:user-admin-ui:programmatic` trả `IDTS User Administration UI contract: PASS`.

### Ma trận verification

| Check | Kết quả |
| --- | --- |
| `npm run qa:user-admin-ui:programmatic` | PASS |
| `npm run qa:user-onboarding:programmatic` | PASS |
| `npm run lint --prefix app/user-administration-ui` | PASS |
| `npm run build --prefix app/user-administration-ui` | PASS; UI5 1.148.0 build thành công |
| `npm run qa:secret-scan` | PASS; không có pattern giống credential |
| `npm run qa:agent-rules` | PASS; đủ 8 rule bắt buộc |
| `npm run qa:depth:self-test` | PASS; 15/15 |
| `git diff --check origin/dev` | Exit 0; chỉ có warning LF-to-CRLF của Windows, không block |
| `npm run qa:user-admin-operations:programmatic` | PASS sau khi correction fixture test-only riêng được merge qua PR #341; không đổi behavior UI/CAP production |

### Proof scope và mutation

- `git diff --quiet origin/dev -- srv db package.json package-lock.json app/user-administration-ui/package.json app/user-administration-ui/package-lock.json` trả exit `0`.
- Không có mutation CAP/backend, schema, package manifest, package-lock, controller, provider, user, role, HANA, HDI, service binding, Jira, Drive, deployment, merge hoặc Ready.
- Hai NTFS junction local expose dependency tree exact locked từ `E:\IDTS-SAP01` và không được Git track. Không chạy install, upgrade, audit fix hoặc ghi lockfile.
- UI5 MCP không callable trong session này. Đã áp dụng workflow `sap-ui5`, `sap-fiori-guidelines`, `karpathy-guidelines`, `ponytail`, TDD và verification; local UI5 lint/build là evidence tool khả dụng.
- Evidence Ownership Knowledge Gate composite của DonHV là PASS (90%, critical/debug/teach-back PASS): `docs/pm/evidence/user-administration/knowledge-gate-donhv-composite-2026-08-20.md`.

### Boundary bàn giao

Đây chỉ là source candidate. Coordinator đã review độc lập product diff với zero findings. Blocker fixture date Operations/Audit có sẵn đã được tách riêng, fix test-only, verify và merge qua PR #341 trước khi refresh branch này. PR #340 vẫn là Draft PR duy nhất của Gate 6.1. Không claim runtime/browser acceptance, deployment, mutation provider/data, merge, Ready hoặc cleanup.
