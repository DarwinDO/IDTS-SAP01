# IDTS-103 — Formalize Functional and Technical Specification tables

## Status

Blocked at merge gate — local artifacts are generated and verified; DonHV review and Ownership Knowledge Gate completion remain required before merge and Google Drive synchronization.

## Scope

- Functional Specification EN/VI v0.7.
- Technical Specification EN/VI v0.6.
- Shared bilingual catalogs for functions, requirements, screens, messages, processes, components, and implementation traces.
- Strict validators for table structure, source traceability, EN/VI parity, template fidelity, and message-catalog consistency.

## Completed

- Replaced raw prose/list dumps with formal template-styled tables in the required workbook tabs.
- Kept official sheet names, order, visibility, merged template headers, page setup, and template style signatures.
- Split combined functions and AI operations into stable one-record-per-row entries.
- Reused one canonical Message ID catalog across Functional and Technical Specifications.
- Localized visible Technical Specification VI content while preserving technical identifiers.
- Reduced rendered output from abnormal 28/59-page layouts to 12 pages per Functional workbook and 13 pages per Technical workbook by bounding print areas.

## Verification

- OfficeCLI 1.0.141 schema validation: PASS for all four workbooks.
- Specification validator: PASS.
- Source path/symbol trace: PASS.
- LibreOffice rendering and visual review: PASS for 50/50 pages.
- Quality/source/message/parity contract: PASS.
- Secret scan, agent rules, QA Depth 15/15, ownership gate 5/5, and AI DevKit 5/5: PASS.
- Ponytail simplicity review: `Lean already. Ship.`
- Draft PR #183 is mergeable, but `qa-depth-gate` correctly fails only because the DonHV Ownership Knowledge Gate is still In Progress.
- Drive update: not started; local approval is required first.

## Known limitations

- LibreOffice emits a harmless local environment warning about `<prefix>` while still generating all PDFs successfully.
- Human mentor review and approval remain Pending.
- Live OpenAI remains `DISABLED / NOT ACCEPTED`.

## Next handoff

Run the final repository/document gates, create the review PR, obtain DonHV local approval, then update the four existing Google Drive files in place and verify readback.
