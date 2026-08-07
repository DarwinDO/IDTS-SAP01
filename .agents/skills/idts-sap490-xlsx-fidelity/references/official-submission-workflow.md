# OFFICIAL SUBMISSION workflow

## 1. Identify the authority

Find the matching artifact in the Google Drive `OFFICIAL SUBMISSION` folder. Record its Drive file ID, exact name, version, modified time, MIME type, size, and downloaded SHA-256. A similarly named workbook elsewhere on Drive is not authoritative.

Keep the local official template immutable. If the Drive artifact and template differ, stop and ask which one governs the current deliverable.

## 2. Capture a pre-edit contract

For every sheet, capture:

- name, index, visibility, selected/active state;
- used range and intended editable regions;
- merged ranges;
- row heights, hidden rows, column widths, hidden columns;
- fonts, fills, borders, alignments, wrapping, number formats, protection;
- formulas, named ranges, data validations, conditional formatting, hyperlinks;
- images/shapes/charts and their anchor/size;
- gridline visibility, freeze panes, page setup, margins, scale/fit, print area/titles, headers/footers, page breaks.

Store task-specific policy beside temporary evidence or the generator. Do not hardcode one workbook's ranges into this reusable skill.

## 3. Build a style map

Map semantic roles to real reference cells, for example:

| Role | Reference sheet/range | Must preserve |
| --- | --- | --- |
| Sheet title | exact reference range | font, fill, border, merge, alignment, height |
| Section header | exact reference range | hierarchy, frame, spacing |
| Object name | exact reference cell | font, indentation, number format |
| Description | exact reference cell | font, wrap, alignment |
| Diagram | exact reference anchor | width, height, aspect ratio, surrounding cells |
| Evidence link | exact reference cell | hyperlink style and target semantics |

Use the nearest semantic match. Do not copy a title style into a body table because it happens to look similar.

## 4. Author one bounded area

- Copy the official/template workbook to a candidate.
- Change one approved tab/range at a time.
- Preserve all cells outside the write scope byte-for-byte where practical and structurally otherwise.
- Save/close before OfficeCLI, LibreOffice, Excel preview, or upload reads the file.

## 5. Validate and render

Run:

1. OfficeCLI inspect/validate.
2. `audit_xlsx_fidelity.py` with a task-specific policy.
3. Formula/error scan for `#REF!`, `#VALUE!`, `#NAME?`, `#DIV/0!`, and visible `###`.
4. Excel/Desktop or user preview.
5. LibreOffice PDF export and page-by-page visual inspection.

Inspect changed ranges plus neighboring unchanged ranges. Formatting defects commonly begin one row/column outside the written block.

## 6. Approval and release

Give DonHV the exact candidate hash and visual evidence. Approval is range/candidate-specific. After approval and normal Git integration, update the existing Drive file ID, then read back metadata and content hash and preview it again.
