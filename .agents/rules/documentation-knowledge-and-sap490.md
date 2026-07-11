---
name: idts-documentation-knowledge-and-sap490
description: Canonical documentation, knowledge mirrors, SAP490 template preservation, and Drive synchronization rules.
applies_to: markdown, DOCX, XLSX, PPTX, PDF, Google Drive, SAP490
priority: required
---

# Documentation, Knowledge, and SAP490

- **Mandatory OfficeCLI gate:** every task that creates, reads, edits, reviews, moves, syncs, or deletes Markdown docs, DOCX/XLSX/PPTX/PDF, Google Docs/Sheets/Slides, Drive folders, or SAP490 artifacts must invoke OfficeCLI and report the command/result. Start with `officecli --version`; use `officecli help` instead of guessing syntax.
- **Office formats:** before work on a DOCX/XLSX/PPTX, load the matching OfficeCLI skill (`word`, `excel`, or `pptx`), inspect with `view issues` and/or `get`, and run `validate` after the final write. Flush with `save` or `close` before any non-OfficeCLI renderer, converter, uploader, or editor reads the file. Prefer OfficeCLI L1/L2 operations; use lower-level XML only when necessary.
- **Other formats and Drive:** OfficeCLI does not natively edit Markdown, PDF, Google-native documents, or Drive metadata. Still run the mandatory preflight and report the limitation; then use the matching native tool for the actual operation. Do not pretend that an OfficeCLI command changed an unsupported format.
- **Move/delete safety:** before moving or deleting a local Office file, run `dump` and `view issues`; keep the dump only in a temporary workspace unless the user asks for an audit artifact. Google Drive deletion still requires explicit user approval.
- Repository Markdown is canonical. Local DOCX/XLSX/PPTX are template-filled submission/review artifacts; Google Drive copies are for collaboration and review.
- Never edit `docs/sap490/templates/`. Copy a template to `docs/sap490/generated/` before filling it; preserve page setup, sheets, formulas, merged cells, styles, headers, footers, and cover pages.
- Keep English and Vietnamese project-authored deliverables separate unless a school field explicitly requires bilingual text.
- For DOCX/PPTX, render and inspect every final page/slide. For XLSX, inspect formulas, populated ranges, sheet structure, and visible layout. Check Vietnamese encoding explicitly.
- Use `idts-ba-docx-deliverables` for formal BA/SAP490 routing; use Documents, Spreadsheets, PDF, and Presentations workflows according to artifact type.
- Before Drive writes, find and read the target folder, use timestamped new review copies by default, never overwrite/delete mentor-review files without explicit approval, then read back the upload result.
- Do not commit Drive IDs, OAuth files, credentials, tokens, private endpoints, or local sync configuration.
