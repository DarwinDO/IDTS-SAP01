# IDTS-115 Create Draft Binding — Local Browser Acceptance

- Baseline SHA: `652cdc3c14765f6ca17f3adb4234735ee89015a5`
- Environment: local CAP with SQLite
- Role: PM (`DonHV`)
- Executed: 2026-07-29 (Asia/Bangkok)
- Controlled record: `BUG-0005`
- Result: `PASS`

## Expected

1. Open the lazy `Reproduction and Test Context` section before entering data.
2. Enter Steps to Reproduce, Actual Result and Expected Result once.
3. Select catalog-backed fields through their value helps.
4. Create the Bug successfully on the first attempt.
5. Reload the active Bug and retain all three reproduction fields.
6. Do not produce a new `Must not change a property before it has been read`
   error or `componentCategory_ID` invalid-segment warning.

## Actual

- The draft was created successfully on the first attempt as `BUG-0005`.
- Steps, Actual and Expected remained present after a full navigation reload.
- The active database row contains the selected Application Component and
  Defect Category plus the backend-derived Component Category.
- Both OData `$batch` requests observed after reload returned HTTP 200.
- Browser console remained at the known 14-error local baseline; no new
  binding or invalid-segment error was added during the controlled flow.

## Classification

- Off-screen direct filling is a test-harness issue because Fiori Elements
  lazy-binds the section. The harness must open the section and wait for the
  field bindings before filling.
- The product correction is removal of the redundant Defect Category value
  help output mapping for backend-derived `componentCategory_ID`.
- CAP remains the source of truth for component-category derivation and
  validation.

## Evidence

- `01-draft-valid-before-create.png`
- `02-created-bug-0005.png`
- `03-reload-persistence-bug-0005.png`
- `network-and-database-readback.md`

## Regression proof

- With the removed `ValueListParameterOut` temporarily restored,
  `npm run qa:idts115:create-binding` failed on the targeted assertion.
- After restoring the fix, the same command passed all four checks.

## Known local baseline

The local preview already reports unrelated development-only errors for
missing Component preload, locale fallback and flexibility endpoints. They
were present before this controlled case and did not increase during it.
