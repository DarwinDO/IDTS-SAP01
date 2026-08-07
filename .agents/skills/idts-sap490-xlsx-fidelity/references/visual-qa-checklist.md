# XLSX visual QA checklist

## Workbook shell

- [ ] Correct workbook and version.
- [ ] Correct sheet names, order, visibility, and active sheet.
- [ ] No added/removed blank tabs.
- [ ] Title and metadata blocks match the official reference.
- [ ] Gridline visibility matches the reference per sheet.

## Geometry

- [ ] Column widths and row heights match unless the exact deviation was approved.
- [ ] No global autofit or shrink-to-fit.
- [ ] Merges are unchanged except approved renderer-safe changes.
- [ ] Images/diagrams keep approved anchor, width, height, and aspect ratio.
- [ ] No clipped nodes, connectors, captions, text, or cell frames.

## Typography

- [ ] Font family, size, bold, italic, underline, and color match the role's reference style.
- [ ] Alignment, indentation, wrapping, and vertical alignment match.
- [ ] No substituted font or unexplained size reduction.
- [ ] Identifiers, dates, and numbers retain correct formats.

## Borders, fills, and grid leakage

- [ ] Required border colors are explicit ARGB, not automatic/theme-only.
- [ ] Header top/bottom borders exist on every physical cell in the span.
- [ ] Header left/right outer edges are present.
- [ ] Merged ranges render all required edges in Excel and PDF.
- [ ] Borderless body rows contain no accidental thin/hair borders.
- [ ] Formal white blocks use solid reference fill across their full visible width.
- [ ] No worksheet grid appears inside or beside a formal table region.
- [ ] No white overlay shape is hiding a broken grid.

## Content integrity

- [ ] No placeholder, TODO, stale version, obsolete environment, or unsupported claim.
- [ ] No `#REF!`, `#VALUE!`, `#NAME?`, `#DIV/0!`, `###`, or broken hyperlink.
- [ ] Long text is readable and not clipped.
- [ ] `N/A` is used only when no genuine equivalent exists.
- [ ] Technical identifiers and descriptions are in the template's intended fields.

## Print/PDF

- [ ] Print area, titles, orientation, margins, scaling, and page breaks are correct.
- [ ] No accidental blank pages.
- [ ] Repeating headers repeat where the reference does.
- [ ] All pages are readable at normal print scale.
- [ ] Excel and LibreOffice/PDF differences are documented.

## Approval/release

- [ ] Candidate filename and SHA-256 recorded.
- [ ] DonHV reviewed the exact candidate/ranges.
- [ ] Approved current file was not overwritten early.
- [ ] Drive same-ID update happens only after approval.
- [ ] Drive parent/MIME/permissions/ID preserved and read back.
