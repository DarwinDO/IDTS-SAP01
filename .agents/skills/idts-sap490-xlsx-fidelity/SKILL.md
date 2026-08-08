---
name: idts-sap490-xlsx-fidelity
description: Create, edit, review, render, validate, and synchronize IDTS SAP490 XLSX deliverables while preserving the exact OFFICIAL SUBMISSION template. Use for every project-authored SAP490 workbook, generator, validator, Excel candidate, or Drive update where sheet structure, typography, borders, fills, merged cells, diagrams, print layout, or cross-render fidelity matters.
---

# IDTS SAP490 XLSX Fidelity

Treat the matching workbook in Google Drive `OFFICIAL SUBMISSION` as the visual and structural authority. Do not replace its design with a cleaner-looking custom layout. Add content only inside the template's intended regions and use a candidate-review-approval workflow.

## Mandatory source order

1. Current user instruction and explicit DonHV approvals.
2. Matching workbook in `OFFICIAL SUBMISSION`, identified by Drive file ID, name, version, modified time, and downloaded SHA-256.
3. The official local template under `docs/sap490/templates/`.
4. Current approved workbook and its structured generator source.
5. Repository business, technical, PM, and evidence sources.

Screenshots are review aids, not a substitute for inspecting the actual workbook. Never infer a style solely from a screenshot.

## Hard gates

1. Run `officecli --version` first and report the result.
2. Read `AGENTS.md`, `.agents/rules/documentation-knowledge-and-sap490.md`, the SAP490 mentor briefing, current project/PM context, and the relevant work package.
3. Confirm the executing member has acknowledged the briefing at the task baseline SHA.
4. Inventory the matching `OFFICIAL SUBMISSION` workbook before authoring. If Drive is unavailable and no verified local copy exists, stop and ask DonHV; do not guess.
5. Copy the template/reference to a new candidate. Never edit `docs/sap490/templates/`, the approved current workbook, or the Drive file in place during drafting.
6. Record a pre-edit contract: sheet order/state, used regions, merges, row heights, column widths, fonts, fills, borders, number formats, alignments, formulas, validations, hyperlinks, drawings, page setup, print areas/titles, headers/footers, and gridline visibility.
7. Run both OfficeCLI validation and issue inspection against the frozen reference. Record every pre-existing warning in a range-specific baseline issue register; never treat schema validation PASS as visual/template fidelity PASS or silently whitelist all warnings.
8. Create a candidate manifest from [candidate-manifest-template.md](references/candidate-manifest-template.md). It must bind the candidate to the exact reference hash, baseline SHA, approved tabs/ranges, source/evidence map, renderer versions, known baseline issues, and final candidate hash.
9. Present content/layout decisions to DonHV tab by tab. Do not continue past a rejected tab.
10. Validate structure, styles, formulas, and visual renders before requesting approval.
11. Replace the current local artifact or update the same Drive ID only after explicit DonHV approval of the exact candidate hash.

Read [official-submission-workflow.md](references/official-submission-workflow.md) before editing and [visual-qa-checklist.md](references/visual-qa-checklist.md) before requesting approval.

## Template-first authoring rules

- Preserve sheet names, order, visibility, title blocks, metadata blocks, section order, print setup, headers/footers, and official table regions.
- Build a style map per sheet and semantic range from the reference. Do not assume one font, size, border, or row height applies to every tab.
- Compare formatting semantically, not by raw style IDs alone. Style IDs or XML ordering may change after safe serialization; fonts, fills, borders, merges, dimensions, print behavior, drawings, and visible results may not drift without approval.
- Reuse reference styles by copying from the nearest semantically equivalent template cell/range. Create new styles only when no official equivalent exists and DonHV approves the deviation.
- Keep content inside the official section/table region. Do not place continuation rows outside the template frame or expose worksheet grid cells beside a formal block.
- Do not globally autofit, restyle, recolor, merge/unmerge, resize rows/columns, or change print scaling.
- Keep approved diagrams at their approved dimensions and anchors. Never enlarge a diagram merely to improve readability if it risks clipping nodes, connectors, cell boundaries, or print regions.
- Use visible numbering `1`, `1.1`, `1.2`; keep technical identifiers in their own fields when the template provides them.
- Keep project-authored SAP490 artifacts English-only unless the school template itself requires another language.
- Use `N/A` for classic SAP/ABAP artifacts that genuinely have no project equivalent. Do not invent a CAP equivalent merely to fill a row. Where a real equivalent exists, state it precisely and briefly.

## Border and grid discipline

Excel border rendering is per physical cell, not merely per semantic/merged range.

- A framed header must have explicit top and bottom borders on every physical cell in the span, plus left on the first cell and right on the last cell.
- Use explicit ARGB colors such as `FF000000`; do not use automatic, theme-only, or unspecified border colors for required black frames.
- If a merged range loses edges in Excel/preview, use the smallest renderer-safe adjustment approved by DonHV: retain the visual span, put text in the anchor, and apply borders to every physical cell. Do not silently unmerge unrelated regions.
- Formal body regions must use the reference fill. Where the template expects a clean white block, apply solid white fill across the whole visible band so ambient sheet gridlines cannot leak through.
- Do not add cell borders to simulate worksheet gridlines. Body rows that are meant to be borderless must have no visible border side.
- Do not hide a formatting defect by disabling gridlines globally unless the official sheet also has gridlines disabled.

Run the bundled policy validator for critical ranges:

```powershell
python .agents/skills/idts-sap490-xlsx-fidelity/scripts/audit_xlsx_fidelity.py validate `
  --reference <official-reference.xlsx> `
  --candidate <candidate.xlsx> `
  --policy <candidate-policy.json>
```

Use [policy-example.json](references/policy-example.json) as the starting point. The validator is a guardrail, not a replacement for visual review.

## Typography and spacing

- Inspect the actual reference font name, size, bold, italic, underline, color, alignment, wrapping, and indentation for each semantic range.
- Preserve official hierarchy: workbook title, section header, field label, table header, content, caption, and note.
- Do not substitute fonts because another renderer lacks them. Resolve the environment/font issue or report the limitation.
- Avoid clipped or shrunk text. Adjust content or an approved local row height before changing font size.
- Do not use `shrinkToFit` to conceal overflow unless the reference uses it in the same role.
- Preserve number/date formats and do not convert identifiers to scientific notation.
- Scan cells, hidden cells, comments, defined names, headers/footers, diagram text, and filenames for unauthorized Vietnamese submission content, mojibake, secrets, private endpoints, unreplaced tokens, and formula errors such as `#REF!`, `#DIV/0!`, `#VALUE!`, or `#NAME?`.

## Safe write strategy

1. Freeze the source SHA, reference hash, candidate path, and target tab/range.
2. Make one bounded tab/range change.
3. Save and close the workbook before another renderer reads it.
4. Run OfficeCLI validation and the policy validator.
5. Render the changed tab and inspect it at normal zoom and as PDF.
6. Compare against the OFFICIAL SUBMISSION reference side by side.
7. Give DonHV the candidate filename, hash, changed ranges, screenshots, and known limitations.
8. Continue only after approval; otherwise revert to the last approved candidate and revise the rejected range.

Do not batch-edit all tabs before the first review. A rejected range must not contaminate later approved work.
If the Drive reference changes after the candidate was frozen, invalidate the candidate and restart the structural/style comparison. Do not carry forward an approval tied to old bytes.

## Cross-render verification

Use at least two rendering paths before approval:

- Microsoft Excel/Desktop or the user's Excel preview for authoritative interactive appearance.
- LibreOffice export to PDF for print/page inspection.

Use OfficeCLI inspection/validation as the structural gate. If renderers disagree, classify the discrepancy, preserve the reference behavior in Excel, and show DonHV both outputs. Never claim PASS based on only the renderer that looks correct.

## Approval and Drive release

- Candidate filenames must contain a clear candidate/revision suffix. Do not overwrite the approved local artifact while it may be open or locked.
- Approval must identify the exact candidate filename/hash and reviewed tabs/ranges.
- After local merge, update the existing Drive file ID; do not create a duplicate unless DonHV explicitly requests a review copy.
- Preserve parent, MIME type, permissions, and file ID.
- Read back Drive metadata and bytes/hash, then preview the critical tabs again.
- Never delete/Trash/replace an official file without explicit approval.

## Stop conditions

Stop and ask DonHV immediately when:

- the matching OFFICIAL SUBMISSION reference is missing or ambiguous;
- two official references conflict;
- content does not fit without changing template geometry;
- a merge, border, image, formula, validation, or print change is needed outside the approved range;
- Excel and PDF renderers disagree materially;
- a source claim cannot be traced to current code, data, or evidence;
- a workbook is locked and safe candidate output cannot be created;
- Drive target identity or approval hash is uncertain.

## Forbidden shortcuts

- No blank/custom workbook replacing the official template.
- No global formatting cleanup.
- No style decisions based only on screenshots or memory.
- No hiding grid defects with broad white rectangles, shapes, or global gridline changes.
- No deleting template rows/sections because they are SAP-specific; use a precise equivalent or `N/A`.
- No fake evidence, fake PASS, stale runtime claims, or final approval by an agent.
- No direct Drive overwrite before local visual approval.
- No editing workbook internals while the file is open in another writer.
- No global AutoFilter, formula-first, font-normalization, or autofit rule may override the exact official workbook. Preserve such features only where the reference uses them or a range-specific approval allows them.

## Handoff

Report:

- OfficeCLI command/version/result.
- Reference Drive ID/name/hash and local candidate hash.
- Tabs/ranges changed.
- Structural/style validator result.
- Excel and PDF visual result.
- Any renderer difference or approved deviation.
- DonHV approval status.
- Whether current local artifact or Drive was changed.
- Skills/connectors/tools used and their limitations.
