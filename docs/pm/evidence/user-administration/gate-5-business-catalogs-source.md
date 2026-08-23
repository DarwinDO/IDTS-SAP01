# Gate 5 Business Catalogs — Source Evidence

## Exact scope and baseline

- Base: `fd6870585d72ca63e55b744708960b417a2795b9` (`origin/dev`).
- Candidate before remediation: `346a1cfaca800f566b2a1ed102608a65537f7bdd`.
- Execution branch: `feature/wp8-admin-business-catalogs-gate5-luna-donhv`.
- Worktree: `C:\Users\LapHub\.codex\worktrees\3bca\IDTS-SAP01`.
- Scope: source, focused tests, knowledge mirrors, evidence and Draft PR preparation only.
- Explicitly out of scope: HDI simulate/make/migration, HANA/data/catalog mutation, deployment, BTP/XSUAA/IAS/IPS/provider/user/role/email/Jira/Drive mutation, merge, Ready transition, Gate 6, and formal runtime/manual acceptance.

## Coordinator findings and closure evidence

| Finding | Root-cause change | Fresh contract/evidence |
| --- | --- | --- |
| Major — OData V4 binding passed disallowed `$top` | `Main.controller.js` no longer passes `$top`; catalog and lookup reads use `requestContexts(0, Infinity)`. The service remains capped at 100 per request and UI5 follows pages. | `scripts/qa/test-user-admin-ui.js:380-489` asserts no `$top`, `Infinity`, 205 loaded rows, and a match at row 201. `mcp__ui5__get_api_reference` confirms `Infinity` retrieves all data. |
| Important — `submitBatch` hid inner PATCH/POST errors | CREATE waits on `Context.created()`; UPDATE collects every `Context.setProperty` promise, calls `submitBatch`, then awaits those promises before showing success/reloading. | `scripts/qa/test-user-admin-ui.js:427-489` simulates an inner 412 PATCH rejection while `submitBatch` resolves and asserts no success/reload. UI5 API references confirm `submitBatch` reports only batch-request failure while `created`/`setProperty` carry entity/PATCH failure. |
| Important — first-100-only local search | Complete-result reads replace the previous first-page request. Display search includes code, resolved Component Category name, and type. | 205-row fixture finds `MOD-201`; no `$top` binding parameter remains. |
| Important — omitted `componentType`/`categoryType` and value states | Edit fragment now renders both type fields for their catalog types, shows classification type in the table, and binds `valueState`/`valueStateText` for required code/name/parent fields. Controller writes localized field messages into `/edit/validation`. | `scripts/qa/test-user-admin-ui.js:223-233,451-459`; both locale key sets include type and field-message keys. |
| Important — immutable ID and explicit DELETE metadata | CREATE rejects only raw client `INSERT.entries[0].ID` with `CATALOG_ID_IMMUTABLE`; UPDATE rejects a raw `UPDATE.data.ID` even when it matches the route, while CAP-generated `req.data.ID` remains valid. Projections mark `ID @Core.Immutable` and `@Capabilities.DeleteRestrictions.Deletable: false`; the `before DELETE` handler remains defense in depth. | `scripts/qa/test-user-admin-catalogs.js:61-68,152-163,186-201,250-255`; CAP EDMX shows immutable keys and explicit Delete/Insert/Update restrictions. CAP framework denial is observed as `ENTITY_IS_NOT_CRUD` for direct raw DELETE. |
| Important — short/unlinked mirrors | Touched CAP/UI5 mirrors now contain IDTS flow explanations, exact source anchors, impact, cross-layer references, safe-edit rules, and equivalent English/Vietnamese depth. | `docs/knowledge/srv/user-admin/catalogs.js.md`, `srv/user-admin.cds.md`, `srv/user-admin.js.md`, `db/schema.cds.md`, and touched UI5 mirrors. |

## Source contract matrix

- **Authorization**: `srv/user-admin.js:87-89` injects the existing exact active PM + `UserAdmin` guard into `srv/user-admin/catalogs.js:59-70`; UI tab visibility never authorizes.
- **Catalog model**: `db/schema.cds:91-137` contains unique code/pair constraints and the additive append-only `CatalogAdministrationAuditEvents` table. No seed CSV or historical Bug row is rewritten.
- **Public OData shape**: `srv/user-admin.cds:236-293` exposes four bounded projections with safe fields, `modifiedAt @odata.etag`, immutable IDs and explicit capability restrictions.
- **Mutation safety**: `srv/user-admin/catalogs.js:72-187` normalizes/validates, locks updates, enforces ETags, blocks unsafe dependency deactivation and rejects client IDs.
- **Privacy**: `srv/user-admin/catalogs.js:189-225,291-342` records only safe audit summaries/result codes and returns impact counts only. No provider identifiers, credential, endpoint, raw request, Bug content or user identity claim is sent to the UI.
- **UI boundary**: `Main.view.xml:276-318`, `EditCatalogItem.fragment.xml:5-20`, and `CatalogImpact.fragment.xml:5-16` provide four subviews, responsive safe fields, value states, count-only impact review, and no Delete button.

## Fresh verification recorded for this source gate

- `officecli --version` → `1.0.144`.
- CAP MCP model probe after authorized dependency visibility junctions → catalog projections, `@odata.etag`, `@Core.Immutable`, and capability metadata returned; initial probe failure was dependency visibility only.
- `mcp__ui5__get_guidelines`, `get_project_info`, `get_api_reference`, and `run_ui5_linter` → SAPUI5 `1.148.0`; `requestContexts(0, Infinity)`, `Context.created()`, `Context.setProperty`, and batch semantics confirmed; supported JS/XML lint returned no findings. `.properties` patterns are not lintable by the MCP tool; local app lint covers them.
- `npm run qa:user-admin-catalogs:programmatic` → PASS.
- `npm run qa:user-admin-ui:programmatic` → PASS.
- `npm --prefix app/user-administration-ui run lint` → exit 0, zero warnings after bracket-notation cleanup.
- `npm --prefix app/user-administration-ui run build` → exit 0, SAPUI5 `1.148.0`, deployable build succeeded.
- `npx cds compile srv -s all --to edmx` → exit 0; pre-existing attachment vocabulary warning remains unrelated.
- `npx cds compile db/schema.cds --to hana` → exit 0; generated output contains the expected additive audit table/unique indexes.
- Baseline-focused suites before remediation also passed, proving the added contracts were meaningful RED tests rather than merely replaying existing coverage.

## Security/privacy and Ponytail boundary

- The security review scope is the exact `origin/dev...HEAD` diff plus remediation files; prior scan through `83a0c14` had zero reportable findings and a fresh exact-head diff scan remains required before PR handoff.
- No new dependency, endpoint, credential, provider call, raw identity, raw audit payload, or generic editor was added.
- Ponytail choice: reuse CAP CRUD/ETag/transactions, the existing authorization guard, native UI5 list/context APIs, existing update group, and existing test runners. No paging framework, repository abstraction, or new dependency was introduced.

## Mutation ledger

| Category | Action | Result |
| --- | --- | --- |
| Git | Created/switched execution branch at exact expected HEAD | `feature/wp8-admin-business-catalogs-gate5-luna-donhv` at initial `346a1cf...`; final SHA is updated at handoff. |
| Local dependency visibility | Created two validated NTFS junctions to the already locked `E:\IDTS-SAP01` root/app `node_modules` trees | Tooling-only; no install, upgrade, package/version or lockfile mutation. |
| Repository | Changed only Gate 5 source/tests/mirrors/evidence/PM status in this worktree | No reset, force cleanup, HDI/HANA/data/provider/user/role/deploy/Jira/Drive mutation. |
| External release | Push/Draft PR | Deferred until final security/depth/source gate passes; exactly one Draft PR allowed. |

## Approval boundary

This evidence supports source review and one Draft PR only. It does not claim runtime/manual acceptance, HANA migration, live catalog persistence, deployment, merge, or Gate 6 readiness. Any unresolved Critical/Major/Important finding is a NO-GO and must stop PR handoff.

## Tom tat tieng Viet

Gate 5 da dong pham vi source-only cho bon catalog Business Catalog. CAP giu authorization, uniqueness, ETag, parent/dependency validation, no-DELETE va audit append-only; UI5 dung `requestContexts(0, Infinity)` de search day du, cho phep sua `componentType`/`categoryType`, hien value state va doi promise PATCH/POST ben trong sau `submitBatch`. Khong co migration HDI, deploy, live catalog mutation, provider/user/role/Jira/Drive mutation hay merge. Runtime/manual acceptance va Gate 6 van la gate sau.
