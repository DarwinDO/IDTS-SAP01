# SAP490 Blueprint v0.4 visual-template remediation evidence — 2026-07-24

## Verdict

`DRIVE SYNCHRONIZATION RESTORED AND VERIFIED — EN unchanged; VI restored from the approved local artifact; mentor review and approval remain pending.`

This verdict covers the approved local candidates and their same-ID Google Drive synchronization. It does not claim mentor approval, UAT/sign-off, Final Project Report completion, or a Knowledge Gate result.

Knowledge Gate: `IN PROGRESS — handled in dedicated learning thread`.

## Safety and scope

- Isolated worktree: `E:\IDTS-SAP01-blueprint-v04`.
- Branch: `docs/doc-20260725-blueprint-v04-tables-donhv`.
- The dirty root worktree was not reset, checked out, cleaned, or overwritten.
- The official template was not edited: Git blob in worktree and `HEAD` is `8a5e10f381deabada20ac8913b973af83adacaa5`; SHA-256 is `67DB43CFA4092633A33A496C59BC2237ACF3AF9B8567B78D92DB96A283EE4419`.
- The two approved Blueprint files were updated in place at their existing Drive IDs: EN `1WDuPtIdTjyvopPVpsa1Ob90cXKsqkN5n`; VI `1pLFomBiPJvZkOYmzmUZwcSm1HDejyUrV`. No copy, delete, new file, parent change, MIME change, or permission change was used.
- Workshop, `app/`, `srv/`, `db/`, Jira state, and Git index were not changed.
- No stage, commit, push, merge, or PR was performed.

## Local candidates

| Language | Candidate | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| EN | `docs/sap490/generated/Blueprint_IDTS_SAP01_en_v0.4.docx` | 535,892 | `7C03B5F693CCF7F54B58170B32F08609E4F77785BC974C038F10071E43835CEA` |
| VI | `docs/sap490/generated/Blueprint_IDTS_SAP01_vi_v0.4.docx` | 537,293 | `92DB6BEAC1C21C4F61C5F00DDED4AFB3B6B8F57C1EF83B870729F24B00E8971D` |

Filename, cover, document properties, and current change-history row use v0.4 and date `2026-07-23`. The historical v0.3 row remains truthful.

## Template fidelity remediation

The generator still starts from a copy of the official template. It preserves:

- three sections, page setup, header/footer linkage, and official cover/control pages;
- 161 template styles and numbering definitions;
- eight core template tables;
- the main order `OVERVIEW → ORGANIZATIONAL STRUCTURE → BUSINESS PROCESS → REPORTS`;
- BP-01 through BP-13 and the approved EN/VI business content.

The ten approved content tables now clone the format signature of the core Reports table instead of using an independent style:

| Property | Verified value |
| --- | --- |
| Table style | `Normal Table` / `TableNormal` |
| Body font | inherited Arial 10 pt from template Normal style; no direct font/size override |
| Header fill | `#17365D` |
| Borders | single, size 4, auto color on all required edges |
| Paragraph formatting | cloned alignment, spacing, and 1.15 line spacing from the template prototype |
| Header behavior | repeated header row |
| Row behavior | non-splitting data rows |
| Titles | real `Heading 2` or `Heading 3` styles with outline hierarchy |

Column widths were adjusted without reducing font size. The capability-ID column is at least 1.05 in, capability-name at least 1.45 in, and entity-name at least 1.60 in. Long technical identifiers receive invisible break opportunities only after `/` or at CamelCase/entity boundaries, so `ApplicationComponents`, `DeveloperResponsibilities`, and `NotificationDeliveries` wrap as meaningful name parts instead of arbitrary letter fragments. The custom `Table Grid`, Arial 8.5 pt, `#1F4E79`, blue title formatting, and unused legacy shading helper were removed from the active generation path.

## Automated validation

Commands:

```text
python -m py_compile scripts/sap490/generate-blueprint-docx.py scripts/sap490/validate-blueprint-docx.py
python scripts/sap490/generate-blueprint-docx.py
python scripts/sap490/validate-blueprint-docx.py
```

Result: PASS.

- 3 sections and 18 tables per candidate: 8 preserved core tables plus 10 approved content tables.
- Added-table EN/VI shape and order parity: PASS.
- Added-table style, border, fill, paragraph, inherited-font, and title-heading signature: PASS.
- Minimum capability/entity column widths and permitted slash/CamelCase wrap opportunities: PASS.
- Semantic style/numbering parity with the template: PASS.
- BP-01 through BP-13, heading hierarchy, version, and placeholder checks: PASS.
- The new validator was first run against the pre-fix outputs and correctly failed with 1,844 detailed format findings, proving that it detects the reported regression.
- The final wrapping rule was also run red-first against the prior outputs: 131 findings, including the three undersized columns and missing permitted wrap points. Its initial Vietnamese error print exposed a CP1252 console crash; stdout is now forced to UTF-8 and the red rerun completed normally before regeneration.

## OfficeCLI

- Preflight: `officecli --version` → `1.0.140`.
- `officecli validate <candidate>` → `Validation passed: no errors found` for EN and VI.
- `officecli view <candidate> issues` → 23 advisories per file:
  - 20 empty spacer paragraphs inherited from the official template layout;
  - 3 first-line-indent suggestions.
- Both OfficeCLI residents were closed after inspection.

These advisories are not used as evidence of visual fidelity. OfficeCLI proves schema validity only; the content validator and rendered-page review provide the additional gates.

## PDF and visual review

- LibreOffice rendered both final DOCX files to non-empty PDFs. It emitted `Could not find platform independent libraries <prefix>` but conversion succeeded; this remains an environment warning, not a document defect.
- `pypdfium2 5.9.0` rendered 100% of pages to PNG.
- EN: 26/26 pages reviewed.
- VI: 25/25 pages reviewed.
- Contact sheets covered every page; dense new-table, lifecycle, core Process Description, Reports, verification, and limitation pages were reopened at full resolution.
- PASS: consistent dark-blue headers, Arial 10 pt body typography, single borders, true heading hierarchy, repeated headers, and non-splitting rows.
- PASS: no clipping, overlap, blank page, table overflow, one-character vertical wrapping, or arbitrary mid-word splitting in the audited capability/entity columns.
- The two independently reported pages were reopened at full resolution: EN page 8 now keeps `Capability ID` and `Classification` intact; VI page 10 breaks long entity names only at `/` or CamelCase/entity boundaries.
- Programmatic image check: zero blank pages; minimum rendered content margins were 87 px left, 63 px top, 48 px right, and 83 px bottom at review scale.
- EN/VI page counts differ because translated text flows differently; the validated table order, row/column shapes, BP IDs, and content structure remain aligned.

## Google Drive in-place synchronization

OfficeCLI preflight immediately before the Drive workflow returned `1.0.140`. Both local files existed and their fresh SHA-256 values matched the approved hashes before upload. Metadata preflight confirmed that the requested IDs were the current EN/VI Blueprint DOCX files in parent `1oKcBvd8TudJW0Gw51ANZioHHhmd9zAjo` (`SU26SAP01_GSU26SAP01_Blueprint`).

| Language | Drive ID | Name before | Name after | Bytes before | Bytes after | Modified before (UTC) | Modified after (UTC) |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
| EN | `1WDuPtIdTjyvopPVpsa1Ob90cXKsqkN5n` | `SU26SAP01_GSU26SAP01_Blueprint_EN_v0_2_20260722.docx` | `SU26SAP01_GSU26SAP01_Blueprint_EN_v0_4_20260723.docx` | 411,679 | 535,892 | `2026-07-23T01:54:10.417Z` | `2026-07-24T04:11:13.570Z` |
| VI | `1pLFomBiPJvZkOYmzmUZwcSm1HDejyUrV` | `SU26SAP01_GSU26SAP01_Blueprint_VI_v0_2_20260722.docx` | `SU26SAP01_GSU26SAP01_Blueprint_VI_v0_4_20260723.docx` | 412,550 | 537,293 | `2026-07-23T01:54:15.145Z` | `2026-07-24T04:11:27.783Z` |

Post-update metadata readback confirmed the same IDs, parent, and DOCX MIME type. Raw downloads from those exact IDs were saved outside the repository and hashed:

| Language | Approved local SHA-256 | Same-ID raw readback SHA-256 | Result |
| --- | --- | --- | --- |
| EN | `7C03B5F693CCF7F54B58170B32F08609E4F77785BC974C038F10071E43835CEA` | `7C03B5F693CCF7F54B58170B32F08609E4F77785BC974C038F10071E43835CEA` | PASS |
| VI | `92DB6BEAC1C21C4F61C5F00DDED4AFB3B6B8F57C1EF83B870729F24B00E8971D` | `92DB6BEAC1C21C4F61C5F00DDED4AFB3B6B8F57C1EF83B870729F24B00E8971D` | PASS |

Google Drive preview opened both files. EN showed v0.4 and 26 pages; VI showed v0.4 and 25 pages. The previewed cover and representative tables were readable with no clipping, overflow, or missing text. `Capability ID` breaks only at its space and `Classification` remains intact. Google preview can still wrap some long technical entity identifiers across multiple lines in the narrow VI entity column; no characters are lost, and the raw readback proves the stored DOCX bytes are identical to the approved local artifact.

The first EN connector attempt encountered a transient HTTP 503 before Drive mutation; unchanged metadata was confirmed and the same-ID retry succeeded. The first raw-readback invocation incorrectly supplied an export MIME type and returned HTTP 400; retrying as a raw non-native DOCX download succeeded. Neither failed call changed Drive state.

### Post-sync VI mutation and restoration

The initial VI verification at `2026-07-24T04:11:27.783Z` was later invalidated by a new unattributed Drive revision. Fresh metadata preflight found the same ID/name/MIME/parent but `774,720` bytes at `2026-07-24T04:34:46.019Z`; the mutated file no longer matched the approved local artifact and independent evidence recorded 449 OfficeCLI schema/semantic errors plus Blueprint format-signature drift.

Only the VI file was restored. The approved 537,293-byte local DOCX was uploaded again through `files.update` to the same Drive ID, without parent, permission, copy, delete, or EN operations. Final VI evidence:

| Check | Result |
| --- | --- |
| Drive ID | `1pLFomBiPJvZkOYmzmUZwcSm1HDejyUrV` unchanged |
| Name | `SU26SAP01_GSU26SAP01_Blueprint_VI_v0_4_20260723.docx` unchanged |
| Parent | `1oKcBvd8TudJW0Gw51ANZioHHhmd9zAjo` unchanged |
| MIME | DOCX unchanged |
| Restored modified time | `2026-07-24T05:03:58.621Z` |
| Restored/readback size | 537,293 bytes |
| Raw readback SHA-256 | `92DB6BEAC1C21C4F61C5F00DDED4AFB3B6B8F57C1EF83B870729F24B00E8971D` — exact local match |
| OfficeCLI on raw readback | `Validation passed: no errors found`; 23 known template advisories |
| Blueprint validator | PASS: structure, style/numbering, format signature, EN/VI parity, hierarchy and version |

No Drive preview or Office/Google editing mode was opened after the restoration. The final evidence is metadata plus raw-byte readback, OfficeCLI and the Blueprint validator.

## Remaining limitations and handoff

- DonHV approved the local v0.4 candidates. EN remains verified and the later-mutated VI file has been restored and reverified at the same Drive ID. Mentor review and approval remain Pending.
- Mentor review and approval remain Pending.
- UAT remains Prepared and unsigned.
- Final Project Report remains a template/pending deliverable.
- Live-provider and broader-suite gaps remain explicitly labeled; SKIPPED/Pending are not treated as PASS.
- AI is disabled by default. `AiSuggestions` starts with review state `PENDING`; no accept/reject/ignore/apply persistence capability is claimed.
