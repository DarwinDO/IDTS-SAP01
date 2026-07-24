# SAP490 Blueprint official-template remediation evidence — 2026-07-23

## Verdict

`LOCAL REMEDIATION VERIFIED — template, schema, content truth, EN/VI parity and 37-page visual review PASS; pending DonHV review; DO NOT UPDATE DRIVE.`

This result applies only to the two local Blueprint candidates. It does not claim mentor approval, UAT/sign-off, Final Project Report completion, Drive synchronization, or a Knowledge Gate result.

Knowledge Gate: `IN PROGRESS — handled in dedicated learning thread`.

## Safety and scope

- Branch: `docs/mentor-readiness-20260725-donhv`.
- Initial pre-template backup: `E:\IDTS-SAP01-backups\blueprint-before-template-remediation-20260723-194833`.
- Pre-content-remediation backup: `E:\IDTS-SAP01-backups\blueprint-before-content-remediation-20260723-203949`.
- The backups contain the prior EN/VI Blueprints, generator and template state for recovery and comparison.
- Official template: `docs/sap490/templates/Deliverable_template/Blueprint_Template.docx`.
- The official template was restored to the exact `HEAD` blob. Git blob before/after verification: `8a5e10f381deabada20ac8913b973af83adacaa5`; SHA-256: `67DB43CFA4092633A33A496C59BC2237ACF3AF9B8567B78D92DB96A283EE4419`. It is clean in `git status`.
- No Google Drive file was changed. Existing Drive IDs remain untouched: EN `1WDuPtIdTjyvopPVpsa1Ob90cXKsqkN5n`; VI `1pLFomBiPJvZkOYmzmUZwcSm1HDejyUrV`.
- Workshop, runtime `app/`, `srv/`, `db/`, Blueprint template source, Jira learning/behavior state and Git index were not changed by this remediation.

## Local candidates

| Language | Candidate | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| EN | `docs/sap490/generated/Blueprint_IDTS_SAP01_en_v0.3.docx` | 381984 | `F290D4BF41305309E865FFD25A244C1CD5346DD5432E981FAFA893CEE6420AFC` |
| VI | `docs/sap490/generated/Blueprint_IDTS_SAP01_vi_v0.3.docx` | 382571 | `E6782B2C907A6D88C907D772C6EC4E12D6CF9CCE5033DC895C9439DE1BA0E708` |

Version `v0.3` is consistent in filenames, cover metadata, document properties and the current change-history row. Historical `v0.2` remains only as a truthful prior-version entry.

## Template fidelity and content mapping

Preserved from the official template:

- cover composition, official logo/branding, page size and margins;
- three section definitions and three header/footer pairs;
- header/footer placement and `Confidential` footer;
- 161 style definitions and complete numbering-ID sets;
- eight body-table contract, including the nested cover tables;
- main section order: `OVERVIEW`, `ORGANIZATIONAL STRUCTURE`, `BUSINESS PROCESS`, `REPORTS`;
- template colors, table borders, heading styles and document-control/signature layouts.

Replaced with IDTS content:

- project metadata, owner, date, version and change history;
- glossary and solution context;
- objectives, in/out scope, CAP/Fiori/AuthSessions/PostgreSQL/S3/outbox/AiSuggestions baseline;
- roles, responsibilities and RACI;
- lifecycle/ownership rules and BP-01 through BP-13 detailed process rows;
- operational reports, quality controls, traceability, acceptance status and known limitations;
- three IDTS diagrams: system context, resolve/retest/close/reopen, and developer review.

The generator now copies the official template first and opens the copy with `Document(output)`; it no longer creates a blank `Document()` output. Sample/OLE drawing content is removed only from the working copy before the IDTS diagrams are inserted.

Content-remediation corrections:

- BP-13 now matches runtime: the service records normalized `AiSuggestions` audit data in `PENDING`; it exposes no action/UI flow to persist `ACCEPTED`, `REJECTED` or `IGNORED`. The document no longer claims accept/reject/ignore/apply behavior or a stored reviewer outcome.
- Vietnamese ordinary prose, control/signature labels, captions and process descriptions were localized formally; required technical identifiers, entity names and status codes remain unchanged.
- Cover/change-history date is `2026-07-23`; the v0.2 history wording is `Consolidated`/`được tổng hợp`, not an unproven approval.
- Process descriptions were reduced from eight repeated labels to five compact checkpoints; report traceability shows concise process/status pairs. This reduced VI by one page without dropping BP rows or limitations.
- Unreachable `_legacy_build()` was removed; the official template-copy `build()` is the only generator entry path.

## Structural and parity verification

The semantic package comparison passed for both candidates:

- 3 sections, 8 body tables, 48 body paragraphs, 161 styles and 3 IDTS images;
- page/section geometry identical to the template;
- section header/footer link configuration identical to the template; shared footer parts are intentionally reused where the template links them;
- style semantic signatures match across template/EN/VI; numbering counts remain 24 abstract definitions and 26 instances in all three documents;
- table shapes equal between EN and VI: rows `[4, 5, 5, 4, 1, 8, 14, 5]`, columns `[1, 6, 5, 5, 1, 3, 4, 3]`;
- 9 non-empty headings per language, correct hierarchy and no duplicate heading;
- BP-01 through BP-13 present once and in the same order in EN/VI;
- no blank glossary rows;
- no residual sample/authoring tokens in document/header/footer/core content: FPT sample text, sample names, `AAAA`, Customer Master Data, `SD-MD-01`, `TBD`, Lorem/TODO, template braces, Codex/ChatGPT/OpenAI.

## OfficeCLI and cross-renderer review

- Preflight: `officecli --version` -> `1.0.140`.
- `officecli validate <candidate>` -> `Validation passed: no errors found` for EN and VI.
- `officecli view <candidate> issues` -> 28 advisory items per file: 21 inherited layout spacer paragraphs and 7 generic first-line-indent suggestions. There are no schema, placeholder, clipping or content errors. The untouched template itself reports 25 advisories: 24 spacer paragraphs plus one unevaluated TOC field.
- A static renderer-safe contents list replaces the unevaluated template TOC field for the local review candidates.
- LibreOffice conversion completed with exit 0 and produced a 19-page EN PDF and an 18-page VI PDF. It emitted the known non-blocking environment warning `Could not find platform independent libraries <prefix>`.
- All 37 rendered pages were reviewed via full contact sheets, with full-resolution review of the process and report pages. The final layout has readable horizontal identifiers, repeated process headers, no vertical-character wrapping, no clipped/overlapping content, no orphan section heading and no blank page.
- The languages remain structurally and semantically parallel. VI uses one fewer report-continuation page because formal localization and shorter process prose fit more compactly; BP-01 through BP-13 and every limitation remain present.

## Commands and repository gates

- `python -m py_compile scripts/sap490/generate-blueprint-docx.py` -> exit 0.
- `python scripts/sap490/generate-blueprint-docx.py` -> regenerated both v0.3 candidates.
- Semantic structure/content/parity scan -> PASS for EN and VI after correcting two false test-harness assumptions about shared header/footer parts and optional style attributes; both corrections are logged in `docs/pm/status/donhv.md`.
- `git diff --check` -> exit 0; only existing LF-to-CRLF working-copy warnings were printed.
- `npx ai-devkit@latest lint --json` -> PASS, 5 OK / 0 missing / 0 warning / 0 required failure.
- `git diff -- app srv db` -> empty.
- `git status --short -- app srv db` -> empty.
- `git diff --cached --name-only` -> empty; nothing staged.

## Known limitations and next action

- Drive still contains the earlier Blueprint binaries. Update-in-place must wait for DonHV to review these local v0.3 candidates; this session did not call Drive tools.
- The local files remain `Draft for mentor review`; mentor approval/signature and UAT remain Pending.
- The static contents list has no dynamic page-number fields. This avoids cross-renderer TOC corruption; a live Word TOC may be restored only after controlled desktop-Word refresh and another visual gate.
- OfficeCLI advisory counts are retained rather than forcing layout changes that would break official-template fidelity.
- If DonHV approves, update the two existing Drive file IDs in place, keep their folder/name prefix policy, then perform metadata/content readback and Google Docs/Word viewer inspection before changing Mentor Index status.

## Skills and tools

- `idts-ba-docx-deliverables`: routed the SAP490 official-template and EN/VI deliverable constraints.
- `officecli-docx`: preserved DOCX package/template semantics while replacing only working-copy content.
- `officecli`: preflight, schema validation and issue inspection.
- `verify`: required fresh command, structural, content and visual evidence before the verdict.
- `karpathy-guidelines`: kept scope explicit and avoided runtime/Drive/Jira changes.
- `ponytail`: used the existing Python/python-docx generator and template rather than introducing a new framework.
- LibreOffice and `pypdfium2`: cross-renderer PDF conversion, page count and page-by-page raster review.
- No SAP MCP was used because the task changed documentation only and did not change CAP/Fiori runtime behavior.
