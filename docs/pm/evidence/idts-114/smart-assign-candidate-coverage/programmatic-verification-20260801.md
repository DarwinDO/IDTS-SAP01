# IDTS-114 Smart Assign candidate coverage verification

Baseline: `ccf8f7c2fe1db25690f679b0d8b097b672f3e4d8`

## Finding

`buildAssignmentOutputSchema()` allowed `minItems: 1` while `maxItems` matched the number of eligible candidates. A structured provider response containing only one candidate reference was therefore valid, and the remaining UI rows used deterministic rules-based explanations.

The backend already protects identity mapping correctly: the provider receives temporary references such as `C1` and never receives Developer profile UUIDs. The correction only requires the provider array to contain the same number of rows as the candidate list.

## Red/green evidence

- Red: the new schema assertion failed with `1 !== 2` before the implementation change.
- Green: `npm run qa:idts69:programmatic` passed `13/13` after setting `minItems` to the candidate count.
- `npm run qa:idts56:programmatic`: `14/14` PASS.
- `npm run qa:idts71:programmatic`: `31/31` PASS.
- `npm run qa:idts114:programmatic`: `77/77` PASS.
- `npx cds compile srv --to edmx -s all`: PASS.
- `npm run qa:secret-scan`: PASS.
- `npm run qa:agent-rules`: PASS.
- `npm run qa:depth:self-test`: PASS.
- `npx ai-devkit@latest lint --json`: PASS.
- `git diff --check`: PASS.

## Safety and limits

- No OData or HANA schema change.
- No automatic assignment or candidate creation.
- Unknown, missing, or unsafe provider output still uses the existing deterministic fallback.
- Browser/BTP acceptance remains pending until this service-only change is merged and deployed.
- IDTS-114 remains In Progress because Tester/Developer role evidence is still outstanding.
