# User Administration responsive-table layout source evidence — 2026-09-03

## English

### Scope and baseline

- Branch: `codex/fix-user-admin-responsive-tables-donhv`.
- Exact base: `origin/dev` `9770a829c89ca52a3d1ae9d0985a8526278ab250`.
- Scope: User Administration XML layout, focused UI contracts, version-only HTML5 cache identity, matching knowledge mirrors and narrow PM evidence.
- Out of scope: controller, CAP service, authorization, paging/order, handlers, bindings, schema, dependency upgrades, deployment, BTP, HANA and Drive.

### Root cause and live reproduction

`sap.m.Table` uses fixed layout by default. Active Users declares `80rem` (`1280px`) of fixed columns and Developer Workload declares `75rem` (`1200px`), while the live table container at Edge zoom 100% measured `1187px`. The flexible User column therefore measured exactly `0px`. Sample Active Users rows were `707–957px` high and Developer Workload rows were `583–957px` high because name/email content wrapped vertically.

Developer Workload and other automatic-pop-in tables also left `contextualWidth` at its `Inherit` default. The UI5 breakpoints therefore followed the wider window instead of the narrower table container. The Workload dialog showed the same mismatch: Bug and Title were only `68px` each, one real row reached `146.97px`, and Actions had already moved to pop-in.

### Nine-table audit

| Table | Pre-fix evidence at 100% | Decision |
| --- | --- | --- |
| `onboardingTable` | Two flexible columns `177.5px`; rows `32–57px`. | Unchanged; no collapse. |
| `activeUsersTable` | User `0px`; fixed widths `80rem`; rows `707–957px`; no pop-in. | Add automatic/container-aware pop-in; keep User and Actions high. |
| `developerWorkloadTable` | User `0px`; fixed widths `75rem`; rows `583–957px`. | Add container-aware pop-in; keep Actions high. |
| `developerResponsibilitiesTable` | User `707px`; rows `52.59px`. | Unchanged; ample flexible space. |
| `deliveryOperationsTable` | Recipient and issue `109.5px`; rows `41px`; automatic pop-in still used inherited window width. | Add container-aware pop-in; keep Actions high. |
| `provisioningOperationsTable` | Flexible columns about `235px`; rows `41px`; automatic pop-in still used inherited window width. | Add container-aware pop-in; keep Actions high. |
| `administrationAuditTable` | Flexible columns `257px`; rows `41px`; automatic pop-in still used inherited window width. | Add container-aware pop-in; keep Actions high. |
| `businessCatalogsTable` | Name `538px`; rows `41–42px`. | Unchanged; no collapse. |
| `developerWorkloadBugsTable` | Bug/Title `68px`; row up to `146.97px`; Actions in pop-in. | Add container-aware pop-in; keep Bug, Title and Actions high. |

### Minimal native fix

- `activeUsersTable`: `autoPopinMode="true"`, `contextualWidth="Auto"`, User and Actions `importance="High"`.
- Existing automatic-pop-in tables in Developer Workload, Delivery, Provisioning, Audit and the Workload dialog: `contextualWidth="Auto"`; Actions remain high importance.
- No custom CSS, horizontal-scroll wrapper, `fixedLayout="false"`, controller change or width rewrite.
- User Administration HTML5 version advances from `1.0.18` to `1.0.19`; package, manifest and lockfile remain aligned and the dependency graph is unchanged.

### TDD and verification

- RED: UI contract failed because Active Users lacked `autoPopinMode`; Workload contract failed because `developerWorkloadTable` lacked `contextualWidth="Auto"`.
- GREEN: `npm run qa:user-admin-ui:programmatic` and `npm run qa:user-admin-workload:programmatic` pass.
- `npm run lint --prefix app/user-administration-ui`: PASS.
- `npm run build --prefix app/user-administration-ui`: PASS with SAPUI5 `1.148.0`.
- Repository-configured ESLint is the available UI lint. A separate `npx ui5 lint` probe is unavailable because this installed UI5 CLI reports `Unknown argument: lint`; no package was installed or upgraded.
- `npm run qa:user-admin-active-users:programmatic`: PASS.
- `npm run qa:user-admin-operations:programmatic`: baseline blocker. It fails at `scripts/qa/test-user-admin-operations-audit.js:752` because expected retry eligibility is false; the same failure reproduces on a clean detached exact-base worktree. No unrelated repair is included.

### Browser acceptance

A transient, non-persisted runtime application of the exact XML property changes was measured on the authenticated live UI and then reverted by reload:

- Active Users: User `0px → 291px`; rows `707–957px → 52.59px`; Actions remained in the main row.
- Developer Workload: User `0px → 291px`; rows `583–957px → 52.59px`; Actions remained in the main row.
- Workload dialog: Bug/Title `68px → 179.5px`; rows `68.59/146.97px → 53px`; `Open Bug` remained reachable.
- Live console after the candidate simulation: no warning/error entries.
- Local candidate UI at a narrow `931px` CSS viewport: Active Users User `290.94px`, Developer Workload User `242.94px`, and Actions remained present. At a wide `1584px` CSS viewport, Workload User was `240.58px` with additional metrics restored inline.
- Reload proved the live simulation was reverted: the deployed Active Users User column returned to the pre-fix `0px` state.

### Remaining limitation

The local candidate UI could not load real rows because local custom Bearer authentication returned expected `401` without a test session. Real post-deploy Edge zoom 100%/80% acceptance remains a separate rollout gate; this source gate does not claim deployment or live remediation.

## Tiếng Việt

### Phạm vi và baseline

- Branch `codex/fix-user-admin-responsive-tables-donhv`, base chính xác `origin/dev` `9770a829c89ca52a3d1ae9d0985a8526278ab250`.
- Chỉ sửa layout XML User Administration, focused contract, version cache HTML5, knowledge mirror và evidence hẹp.
- Không đổi controller, CAP/service, authorization, paging/order, handler, binding, schema, dependency, deploy, BTP, HANA hoặc Drive.

### Nguyên nhân và cách sửa

Active Users có `80rem` cột fixed và Developer Workload có `75rem`, trong khi container live ở zoom 100% chỉ `1187px`; cột User flexible bị ép về `0px` làm row cao hàng trăm pixel. Các table đã bật auto-popin vẫn để `contextualWidth="Inherit"`, nên breakpoint theo window rộng hơn thay vì container thật.

Fix native tối thiểu là bật `autoPopinMode` cho Active Users, dùng `contextualWidth="Auto"` cho sáu table đã xác nhận, và giữ cột identity/chính cùng Actions ở `importance="High"`. Ba table Access Requests, Developer Responsibilities và Business Catalogs không đổi vì đo live cho thấy flexible column vẫn rộng và row vẫn gọn. Không thêm CSS, scroll ngang, `fixedLayout="false"` hoặc logic controller.

### Kết quả đo candidate

- Active Users: User `0px → 291px`; row `707–957px → 52.59px`.
- Developer Workload: User `0px → 291px`; row `583–957px → 52.59px`.
- Workload dialog: Bug/Title `68px → 179.5px`; row tối đa `146.97px → 53px`.
- Viewport hẹp `931px`: User của Active Users `290.94px`, User của Workload `242.94px`, Actions vẫn hiện.
- Mô phỏng live đã reload để hoàn nguyên; chưa deploy. Acceptance Edge zoom 100%/80% thật sau deploy vẫn là gate riêng.
