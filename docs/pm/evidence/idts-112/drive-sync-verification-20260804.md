# IDTS-112 Drive synchronization verification — 2026-08-04

## Baseline

- Artifact: `Technical_Specification_IDTS_SAP01_en_v0.8.xlsx`
- PR: https://github.com/DarwinDO/IDTS-SAP01/pull/285
- Merge SHA: `07c5f50851c56a0cbcf229e8b01744febf2a86f5`
- Official Drive file ID: `1nAmUQb3852G4-hxJ0BOK6OHGLDs6Kq1P`
- Official Drive name: `SU26SAP01_GSU26SAP01_Technical_Specification_EN_v0_8_20260804.xlsx`

## Same-ID update

- Update mode: in-place replacement of the official XLSX.
- Parent preserved: `1ZurfJj-whcezlM-9dgTZyTj_LRCaJ268`.
- MIME type preserved: Microsoft Excel Open XML workbook.
- Existing permissions preserved.
- Duplicate created: no.

## Readback verification

- Local SHA-256: `4EB60BE650B6247F5A8726B1F11E025BF2909009A737C0A968FBB2D786BDBA0F`.
- Drive raw-byte readback SHA-256: `4EB60BE650B6247F5A8726B1F11E025BF2909009A737C0A968FBB2D786BDBA0F`.
- Hash comparison: PASS.
- OfficeCLI `1.0.143` readback validation: PASS.

## Drive preview

The view-only Drive preview exposed all 12 official-template tabs:

1. Cover
2. Histories
3. Introduction
4. Scope
5. Assumptions
6. Functional Requirements
7. Technical Design
8. Development Standards
9. Screen Layout
10. Screen Definition
11. Message Definition
12. Technical Implementation

Critical-tab visual checks:

- Technical Design: formal template layout and the 48-table/578-column HANA statement were visible.
- Message Definition: the technical message catalog displayed its user-facing message, source, HTTP/status, target, role and rollback columns.
- Technical Implementation: the formal 14-part implementation structure was visible.

## Truth and limitations

- Unit Test: 38 accepted candidates, 2 held, 135 mapping-only and 13 blocked.
- UAT: 22 MEETS, 12 DOES_NOT_MEET and 23 BLOCKED.
- These states were preserved; blocked, held and mapping-only entries were not represented as PASS.
- No SAP runtime, OData contract, CDS model, HANA schema or business workflow was changed by IDTS-112.
