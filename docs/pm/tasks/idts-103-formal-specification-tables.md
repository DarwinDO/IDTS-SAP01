# IDTS-103 — Formalize Functional and Technical Specification tables

## Status

Done — PR #183 passed the fresh QA Depth Gate and merged normally into `dev` at `5092035015937d23e389c2f4c8336b1dccf81e26`. The four approved workbooks were updated in place at their existing Google Drive file IDs and verified by metadata, exact-byte readback, and representative Drive preview.

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
- PR #183 passed fresh GitHub Actions run `30154286241` and merged normally; no bypass was used.
- DonHV approved all four local workbooks on 2026-07-25.
- Drive update: PASS. Existing file IDs, parent folders, XLSX MIME type, and permissions were preserved; raw-byte readback matched the four approved local SHA-256 values.
- Drive preview: Functional EN displays 9/9 tabs; Technical VI displays 12/12 tabs, and the representative `Screen Layout` tab renders as a formal Vietnamese table without the prior raw prose trace.

## Known limitations

- LibreOffice emits a harmless local environment warning about `<prefix>` while still generating all PDFs successfully.
- Human mentor review and approval remain Pending.
- Live OpenAI remains `DISABLED / NOT ACCEPTED`.

## Next handoff

Use the synchronized Drive workbooks for mentor review. Mentor approval/signature and live OpenAI acceptance remain external pending gates and are not claimed by IDTS-103.

## 2026-07-26 follow-up — Technical Specification template fidelity

- Regenerated Technical Specification EN/VI as v0.7 from a fresh official-template copy.
- Restored the official inner layouts for Screen Layout, Screen Definition and Message Definition instead of retaining custom replacement tables.
- Corrected the Screen Definition Type/I/O mapping and moved deep code trace into Technical Implementation.
- Replaced stale historical screenshots with current Shared QA evidence.
- OfficeCLI 1.0.141, the full specification validator and final LibreOffice visual review pass locally.
- Evidence: `docs/pm/evidence/idts-103/technical-spec-template-fidelity-remediation-20260726.md`.
- Drive remains unchanged until this follow-up PR is merged.
