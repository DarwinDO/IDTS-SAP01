# Gate 6.2 — User Administration State and Action Ownership Source Evidence

## Exact scope

- Base: `b2d56f95c65106b8e59583e4b8b0775d2c3588bf` (`origin/dev`).
- Branch: `fix/wp8-user-admin-state-action-ownership-donhv`.
- RED contract commit: `6d08833`.
- Product source commit: `d5e90b6`.
- Scope: User Administration SAPUI5 controller, XML fragments/view, locale bundles, focused UI contract and bilingual knowledge mirrors only.

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
- No backend/schema/public CAP contract, dependency, package version, lockfile, MTA or XSUAA change.

## Claim boundary

This is source-only evidence. It does not claim deployment, browser acceptance, runtime release, provider/user/role mutation, HANA/HDI mutation or email delivery.
