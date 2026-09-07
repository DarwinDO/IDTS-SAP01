# IDTS-110 v0.6 — Google Sheets compatibility acceptance checklist

## Purpose and boundary

This is a **manual preparation checklist**, not a Google Drive acceptance record. It
defines what DonHV must verify if the candidate workbook is deliberately opened in
Google Sheets. It authorizes neither upload nor replacement of a Drive file, Jira
update, result approval, nor any other external mutation.

The candidate remains a local, candidate-only artifact until DonHV explicitly
approves the external action and reads back the resulting Drive artifact.

## Frozen candidate binding

| Field | Frozen value |
| --- | --- |
| Candidate path | `docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.6_candidate.xlsx` |
| SHA-256 | `457BC346BD3C17D687E2AC77A33087C34B3A24F435916E8280F1903FFA266DCC` |
| Size | `25,649,942` bytes |
| Sheet order | `Cover`, `Histories`, `UT`, `Evidence` |
| Visible case total | 278 |
| Status totals | 265 Candidate PASS; 13 Blocked; 0 Mapping Only |
| Evidence images | 278 embedded images; 278 native OOXML two-cell anchors |
| Anchor behavior | every image is `twoCellAnchor editAs="twoCell"` — the Excel equivalent of “move and size with cells” |
| Links | 278 internal UT-to-Evidence links; 0 external Evidence hyperlinks |

The `twoCellAnchor` setting is the workbook-native, in-cell-equivalent placement
mechanism. Google Sheets must still be checked visually after import because its
conversion engine, not the source workbook, determines the imported rendering.

## Manual acceptance checklist

Before marking any item accepted, confirm the uploaded source file matches the frozen
SHA-256 and size above. Record the reviewer, timestamp, Drive file ID, exported-file
SHA-256, and any conversion limitation outside this repository.

| Check | Required observation | Pass condition |
| --- | --- | --- |
| Open and sheet order | Open the candidate in Google Sheets and inspect the sheet tabs. | `Cover`, `Histories`, `UT`, `Evidence` appear in this order. |
| Image visibility | Inspect all Evidence case blocks while scrolling, with focused spot checks for Cases 1, 139, and 278. | Every case has one visible, legible embedded card; no missing/broken image placeholder. |
| Row sizing and drift | Resize neither sheet nor image; scroll, reopen, and revisit the sampled blocks. | Each card remains within its own Evidence case block, is not clipped, and does not overlap another case. |
| One case / one card | Compare the first, middle, and last Evidence blocks and then complete the Evidence sweep. | Exactly one card is displayed per case block; no blank interleaving block and no duplicate card. |
| Internal UT navigation | From `UT`, follow links for Cases 1, 139, and 278; then return to `UT`. | Each link reaches its matching Evidence block in the same workbook. |
| Export-back fidelity | Download the Google Sheets result as `.xlsx`, then compare it with the frozen candidate and inspect the export. | Sheet order, 278 visible cards, expected case/status totals, internal navigation, and readable layout are retained; any changed hash is recorded as a Google conversion artifact, not silently accepted. |
| No invalid local or redirect links | Inspect hyperlinks in `UT` and `Evidence`, including the samples above. | No `file:` link, local path, malformed relative URL, or redirect-page URL is present; Evidence contains no external hyperlink. |
| Secret and PII review | Inspect visible workbook text and the exported workbook before sharing. | No credential, token, password value, private endpoint, full personal email, or unsanitized personal data appears. Generic test-description words alone are not secrets. |

## Required outcome record

If DonHV later authorizes the Drive step, create a separate acceptance record that
states `PASS`, `LIMITATION`, or `BLOCKED` for each row above and includes the exact
Drive file identifier, reviewer, timestamp, exported XLSX hash, and sanitized
screenshots where they materially prove layout or navigation. A failed or incomplete
check must remain visible; it must not be converted into a candidate PASS by a
workbook regeneration.

## Explicit stop boundary

This checklist performs no upload, Drive replacement, Drive sharing change, Jira
comment/update, result approval, branch push, merge, deployment, email, provider,
or runtime/data mutation. Each requires a later explicit DonHV approval.
