# Gate 6.2 — User Administration State and Action Ownership Source Evidence

## Exact scope

- Base: `b2d56f95c65106b8e59583e4b8b0775d2c3588bf` (`origin/dev`).
- Branch: `fix/wp8-user-admin-state-action-ownership-donhv`.
- RED contract commit: `6d08833`.
- Product source commits: `d5e90b6` (initial UI ownership change) and `25bfe63` (independent-review remediation).
- Scope: User Administration SAPUI5 controller and XML, the details-only `ActiveUserDetails.accessRequestVersion` CAP DTO plus Active Users read-model mapping, focused backend/UI contracts, and bilingual knowledge mirrors. Database schema, mutating CAP actions, dependency/lockfile, MTA and XSUAA remain unchanged.

## Implemented contract

- `developerCatalogs` owns Developer-form value helps; `businessCatalogs` owns Business Catalog administration rows, filters, edit and impact state.
- Loading or failing either catalog area does not overwrite the other model.
- Five top-level areas are Access, Developers, Operations, Business Catalogs and Audit.
- Access contains Requests and Active Users. Developers contains Responsibilities and retains a child-tab boundary for the later Workload gate.
- Request rows retain only Approve, Retry, Reconcile and Cancel.
- Active User details owns Change Role, Suspend, Reactivate, Revoke and active-Developer Manage Responsibilities.
- Change Role does not read an existing Developer profile. Profile input exists only for a non-Developer to Developer transition; same-role submit is rejected before the OData action.

## TDD evidence

- RED: `npm run qa:user-admin-ui:programmatic` failed on the absent `developerCatalogs` model at commit `6d08833`.
- GREEN: focused UI contract passed after the minimal model/navigation/action changes.
- Runtime fixtures cover independent catalog loading, existing-Developer Change Role with zero profile reads, transition into Developer, transition out of Developer and same-role no-action behavior.

## Local dependency setup

- Root and UI `node_modules` are local NTFS junctions to the clean `E:\IDTS-SAP01` locked dependency trees after exact package-lock SHA parity.
- DonHV explicitly approved `npm rebuild better-sqlite3`; the exact locked package was rebuilt for Node 22.
- Package-lock SHA remained `688A9CDCDB41E32E3C012AF9033EC8BFF079E0DF5FB2B3B29CD074D588F6E455`; repository source and lockfiles were unchanged by the rebuild.

## Source verification

- `qa:user-admin-ui:programmatic`: PASS.
- `qa:user-onboarding:programmatic`: PASS.
- `qa:user-admin-active-users:programmatic`: PASS.
- `qa:user-access:programmatic`: PASS.
- User Administration UI lint/build: PASS.
- No database schema, dependency, package version, lockfile, MTA or XSUAA change. The only CAP contract delta is the details-only safe `ActiveUserDetails.accessRequestVersion` optimistic token; summary rows and provider/identity internals remain unchanged.

## Claim boundary

This is source-only evidence. It does not claim deployment, browser acceptance, runtime release, provider/user/role mutation, HANA/HDI mutation or email delivery.

## Independent review and remediation status

- **Finding — filtered-request action coupling**: the Active User lifecycle route previously depended on the filtered `requests>/items` model, so a user absent from the current request filter could lose its action token. The safe contract is a details-only `accessRequestVersion` from the server-selected request; the UI must build only a minimal optimistic snapshot from that DTO.
- **Finding — Developer action visibility**: the Manage Responsibilities button could be rendered for a non-active Developer. Its view visibility must require `accessState === 'ACTIVE'`, while the Developer workspace and Active User details remain the ownership boundary.
- **Finding — missing/stale mirrors**: `InviteUser.fragment.xml` had no knowledge mirror, and the Main view/controller/CDS/Active Users mirrors did not fully describe the independent catalog model, details-only version token, or ownership split; the old navigation block also described superseded request-row actions.
- **Remediation state**: focused RED/GREEN remediation is implemented: Active User details obtains the selected request version from the server DTO, the Developer Manage action is active-only, and the stale/missing mirrors are corrected. Focused and full local source checks are green; the independent review remains **OPEN** until the exact remediated head is re-read.

## Selective rollout and live acceptance — 2026-08-25

- Gate 6.2 product PR `#343` and cache-identity PR `#344` are merged. Exact deployed `dev` merge SHA: `4469191ef939e4509e6f261b450257341fcc18d5`.
- User Administration HTML5 version advanced from deployed `1.0.11` to `1.0.12`. The package, lockfile root and UI5 manifest versions are equal; the focused contract failed before the bump and passed afterward.
- CAP artifact: `mta_archives/idts-gate62-cap-4469191.zip`, SHA-256 `F77C3CBE7475664651F216E0705EB85E446DE82B78FBEF0EBE7001D845C0510C`, 340,796 bytes, 101 entries, Node `22.x`, zero `node_modules`, zero HDI artifacts. The packaged `srv/user-admin/active-users.js` hash matches source and compiled CSN contains `accessRequestVersion`.
- Shared HTML5 artifact: `mta_archives/idts-user-admin-ui-g62-4469191.mtar`, SHA-256 `BCE31E1B1139C133FD81D432C64B37DD6C31386D23A3218604B39414ECB37EFF`, 304,592 bytes. Deep inspection found one application-content module and exactly two UI ZIPs: Bug Management `0.0.5` and User Administration `1.0.12`; no CAP, AppRouter, HDI, managed-service or `node_modules` payload.
- CAP rollout used one package upload. The first ownership filter stopped before staging because PowerShell parsed the UTC creation value incorrectly; readback proved the new READY package was unique and more than 22 hours newer than the preceding package. The same package was reused: stage `1`, owned set-droplet `1`, restart `1`, rollback `0`, final CAP `1/1`. No second upload occurred.
- Shared HTML5 content deployed once with retry count `0`. AppRouter was not redeployed. No HDI/schema/migration/seed, binding, environment, provider, SAP user, Role Collection, email, Jira or Drive mutation occurred.
- Fresh readiness after CAP and after UI returned `DEMO READY`: CAP/AppRouter `1/1`, liveness/readiness/Web `200`, anonymous protected API `401`.
- Browser diagnosis found the Edge profile initially retained the previous `sap-ui-cachebuster-info.json` mapping even though direct repository reads already returned manifest `1.0.12` and the new controller/preload. Acceptance temporarily disabled HTTP cache for the exact tab, reloaded once, then restored normal cache behavior; cookies and the authenticated session were not cleared.
- Authenticated PM acceptance passed on the fresh Gate 6.2 payload: filtering Access Requests to one address did not remove actions from another Active User; an active Developer details dialog exposed Change Role, Manage Responsibilities, Suspend and Revoke; same-role Change Role remained disabled and no action was submitted; an incomplete Developer exposed Link existing identity only and no Manage action; Developers and Access retained their independent child selection across reload/navigation; Developers and Business Catalogs both loaded without an alert.

## Final runtime verdict

Gate 6.2 selective CAP/UI rollout and bounded read-only PM browser acceptance are **PASS** for the reviewed dev POC boundary. No lifecycle, role, responsibility, provider or business-data action was submitted during acceptance.

## Dialog action-layout follow-up — 2026-08-25

- Frozen base: `b885335099d68a579bd1904e0e6825205b4a3cb2` (`origin/dev` at task start).
- Branch: `fix/wp8-gate62-dialog-actions-donhv`.
- TDD reproduced two exact regressions: the non-wrapping Active User details toolbar clipped the final lifecycle action in a narrow dialog, and the details dialog duplicated Manage Responsibilities already owned by the Developer Responsibilities table.
- The minimal UI fix uses one native wrapping `HBox`, native UI5 spacing classes, preserves Link Existing Identity plus Change Role/Suspend/Reactivate/Revoke handlers and visibility guards, and removes only the duplicate details Manage action. No controller, backend, authorization, schema or custom CSS changed.
- User Administration cache identity advanced from deployed `1.0.12` to `1.0.13`; package, lockfile root and UI5 manifest versions remain equal.
- Fresh source verification passed the User Administration UI, onboarding, Active Users, access lifecycle, Operations/Audit, user-access, broker and immutable-identity suites; secret scan, agent rules, QA Depth self-test, CAP EDMX/HANA compile, UI lint/build, XML parse and diff check also passed. CAP EDMX retains only the pre-existing attachment vocabulary warning.
- Runtime/browser acceptance remains separate until the exact merged `1.0.13` HTML5 artifact is checksum-reviewed and selectively deployed. No lifecycle or responsibility mutation is required for that visual acceptance.
