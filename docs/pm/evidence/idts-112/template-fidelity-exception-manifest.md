# IDTS-112 Template Fidelity Exception Manifest

## Baseline

- Artifact: `Technical_Specification_IDTS_SAP01_en_v0.8.xlsx`
- Git baseline: `9202adbf788fa52b309ebabc7560babfbc505dce`
- Official template SHA-256: `EA739AEBD4936C10999187882C63EAF1715A853C086DECC6C802F0A676F3AE46`
- Generated workbook SHA-256: `4EB60BE650B6247F5A8726B1F11E025BF2909009A737C0A968FBB2D786BDBA0F`

## Approved print-only exception

The generated workbook preserves all 12 official tabs, their order and
visibility, landscape orientation, paper size, margins, headers, footers,
styles, merged title blocks and core template regions. Generated record tables
are constrained to one printable page in width and unlimited pages in height:

```text
Zoom = false
FitToPagesWide = 1
FitToPagesTall = false
```

The populated print area and repeated title rows are set per tab. This is a
print-only exception required because retaining the template's 100% zoom on
the expanded 48-table/578-column dictionary and 145-message catalog produced
six blank PDF pages and fragmented wide tables. Fit-to-width produced a
continuous mentor-review PDF with no blank pages while leaving workbook
content and business meaning unchanged.

## Dependency and safety proof

- No tab, formula, validation, chart or business record depends on page scale.
- No data row is merged across records; only template-style column groups are
  merged within a single record.
- Two broken sheet-scoped names named `A` with `#REF!` targets were removed
  from `Scope` and `Assumptions`; they had no formula, validation or chart
  consumer.
- The exception does not change CAP/Fiori runtime, OData contracts, HANA
  schema or SAP BTP deployment.

## Verification

- OfficeCLI schema validation: PASS.
- Specification pack validator: PASS.
- Quality contract: PASS.
- PDF blank-page scan: PASS after applying the exception (`141` pages, `0` blank/short pages).
- Visual review: PASS for the full rendered page set; critical wide-table pages were also reviewed at higher detail.
