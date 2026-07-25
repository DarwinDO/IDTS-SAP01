# IDTS-103 — Formalize Functional and Technical Specification tables

## Status

Ready for merge gate — local artifacts are generated, verified, and approved by DonHV; the existing IDTS-89/90 Knowledge Gate evidence records 90% PASS with Critical, Debug, and Teach-back PASS. PR #183 is awaiting a fresh QA Depth Gate run on the corrected declaration before merge and Google Drive synchronization.

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
- PR #183 is Ready and mergeable. Its body now references the genuine IDTS-89/90 Knowledge Gate PASS evidence; a fresh synchronize-triggered QA Depth Gate is required because rerunning the old GitHub Actions run reused its original PR-event payload.
- DonHV approved all four local workbooks on 2026-07-25.
- Drive update: not started; same-ID update/readback begins only after PR #183 merges.

## Known limitations

- LibreOffice emits a harmless local environment warning about `<prefix>` while still generating all PDFs successfully.
- Human mentor review and approval remain Pending.
- Live OpenAI remains `DISABLED / NOT ACCEPTED`.

## Next handoff

Push the evidence/status correction to trigger a fresh PR event, merge PR #183 after the required gate passes, then update the four existing Google Drive files in place and verify readback.
