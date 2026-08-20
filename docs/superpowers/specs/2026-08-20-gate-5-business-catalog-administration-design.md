# Gate 5 — Business Catalog Administration Design

## Goal

Allow PM + UserAdmin to maintain IDTS classification catalogs safely without editing CSV, HANA, or source files and without breaking historical Bugs or Developer Responsibilities.

## Catalog scope

- SAP Modules.
- Application Components.
- Defect Categories.
- Component Categories, the valid Application Component + Defect Category pair used for assignment.

`SAPModuleComponents` relationship administration is deferred unless a current user flow requires it; Gate 5 must not add a generic master-data platform.

## CAP model and concurrency

Reuse existing managed catalog entities. Do not add duplicate catalog tables. Expose dedicated service projections with PM + UserAdmin authorization and CAP-managed CRUD for CREATE/UPDATE only. DELETE is prohibited through service capabilities and handlers.

Use managed `modifiedAt` as the OData ETag for optimistic concurrency. A stale ETag returns conflict without a write. Add database uniqueness constraints only where the current model lacks protection for catalog code or pair uniqueness; such constraints require an additive HDI simulation/migration gate.

## Validation

- Codes are trimmed, normalized, length-bounded, and unique case-insensitively within their catalog.
- Required names are non-empty and length-bounded.
- Component Category pair is unique.
- New pairs require active Application Component and Defect Category.
- Reactivation requires all referenced parents active.
- Client cannot change immutable IDs.
- Historical referenced rows are never hard-deleted.

## Deactivation impact

Before deactivation, a read-only `catalogImpact` result provides allowlisted counts for:

- Bugs referencing the item.
- Active Developer Responsibilities referencing the item.
- Active Component Category children or parent relationships.

If deactivation would make active assignment/catalog data invalid, reject it until dependent active rows are resolved. Existing historical Bug display remains readable after permitted deactivation.

## UI design

Business Catalogs contains four subtabs. Each supports search, active/inactive filter, add, edit, activate/deactivate, impact preview, confirmation, and safe conflict/error messages. No hard-delete control exists.

## Audit

Append allowlisted catalog administration events containing actor, catalog type, target ID, action, result, timestamps, safe before/after display values, and reason for deactivation. Do not store raw request bodies or user/provider identity data.

## Verification

- PM + UserAdmin positive CRUD without DELETE.
- Negative role matrix.
- Case-insensitive duplicate rejection.
- Invalid/inactive parent rejection.
- Stale ETag conflict.
- Impact count accuracy.
- Deactivation guard and safe reactivation.
- Existing Bug and Developer Responsibility history remains readable.
- Value helps reflect active changes after reload.
- CAP/HANA compile and, if constraints change, additive simulation with zero destructive artifacts and no `.hdbtabledata` deployment.

## Rollout

Ship read-only explorer first. Mutation actions follow in the same gate only after read-only acceptance and exact schema review. Any constraint migration, CAP/UI deployment, or live catalog change requires separate approval and rollback evidence.

## Out of scope

No code-list hard delete, generic entity editor, schema browser, direct HANA access, SAP configuration administration, mass import, or automatic migration of affected Bugs.
