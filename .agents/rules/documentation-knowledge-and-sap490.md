---
name: idts-documentation-knowledge-and-sap490
description: Canonical documentation, knowledge mirrors, SAP490 template preservation, and Drive synchronization rules.
applies_to: markdown, DOCX, XLSX, PPTX, PDF, Google Drive, SAP490
priority: required
---

# Documentation, Knowledge, and SAP490

- Repository Markdown is canonical. Local DOCX/XLSX/PPTX are template-filled submission/review artifacts; Google Drive copies are for collaboration and review.
- Never edit `docs/sap490/templates/`. Copy a template to `docs/sap490/generated/` before filling it; preserve page setup, sheets, formulas, merged cells, styles, headers, footers, and cover pages.
- Keep English and Vietnamese project-authored deliverables separate unless a school field explicitly requires bilingual text.
- For DOCX/PPTX, render and inspect every final page/slide. For XLSX, inspect formulas, populated ranges, sheet structure, and visible layout. Check Vietnamese encoding explicitly.
- Use `idts-ba-docx-deliverables` for formal BA/SAP490 routing; use Documents, Spreadsheets, PDF, and Presentations workflows according to artifact type.
- Before Drive writes, find and read the target folder, use timestamped new review copies by default, never overwrite/delete mentor-review files without explicit approval, then read back the upload result.
- Do not commit Drive IDs, OAuth files, credentials, tokens, private endpoints, or local sync configuration.
