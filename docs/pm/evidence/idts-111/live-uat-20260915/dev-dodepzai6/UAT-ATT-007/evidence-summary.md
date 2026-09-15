# UAT-ATT-007 — unauthorized attachment deletion

## Verdict

**DOES_NOT_MEET_EXPECTED_RESULT — catalog expectation mismatch caused by draft isolation.**

The catalog requires an exact HTTP `403` for this unauthorized delete case. The confirmed one-time sequence could not reach the DELETE request: the draft-child preflight GET for `Bugs_attachments(ID=dd853abe-3284-4d6c-8ef1-0158cf9603cb,IsActiveEntity=false)` returned `404` in the authenticated `dodepzai6` Developer session. Consequently, no HTTP DELETE status was observed and the catalog’s exact `403` assertion is not met.

The security boundary is still effective. An earlier direct active attachment DELETE returned HTTP `405` with the current draft/SAVE boundary message, and the final readback shows the active attachment and its content/hash remain intact. No PASS claim is made for the catalog assertion.

Disposition code: `CATALOG_EXPECTATION_MISMATCH_DRAFT_ISOLATION`.

## Execution

- Executor: `NhanT (DonHV support)`.
- Actor: `dodepzai6`, `DEVELOPER`; authenticated in the SAP session.
- Target: `BUG-0026` (`39ed5ffc-867d-4abe-956f-e54ae68c5c10`), status `ASSIGNED`.
- Technical owner/current action owner: `DatDT`; the actor is not allowed to manage the attachment.
- Exactly one protected attempt was confirmed; no retry or alternate endpoint was used.
- Intended operation: DELETE the draft child `Bugs_attachments(ID=dd853abe-3284-4d6c-8ef1-0158cf9603cb,IsActiveEntity=false)`.
- Preflight result: GET `404`; `deleteSent=false`.

## Transport and boundary evidence

- Catalog expected: HTTP `403`.
- Confirmed attempt: draft-child preflight GET HTTP `404`; DELETE was not dispatched.
- Earlier supplemental attempt: direct active attachment DELETE HTTP `405`.
- Earlier response: `Attachment changes must be made in Edit mode and committed with Save.`

The active `Bugs.attachments` write contract intentionally rejects direct active writes with HTTP `405` and requires attachment changes through the Bug draft plus Save boundary. The exact catalog `403` cannot be observed through the isolated draft context supplied by this run.

## Cleanup and readback

The coordinator used the DatDT Edge session to choose **Discard Draft**. The UI returned to the active `BUG-0026` route with Edit available. A fresh active Bug GET returned HTTP `200` with `HasDraftEntity=false`; the attachment collection GET returned HTTP `200` with exactly one active attachment and no draft child.

- Attachment: `dd853abe-3284-4d6c-8ef1-0158cf9603cb` remains active.
- Filename: `idts-127-att007-controlled.txt`.
- MIME / size: `text/plain` / `36` bytes.
- Content: `IDTS-127 ATT-007 controlled fixture` followed by one newline.
- SHA-256: `3B115B4A49349F9A5C4EC9B2D70AA9525649E9D6A94594EC0E0B92CB9D20113E`.
- BUG-0026 remains `ASSIGNED`; the active row has `HasDraftEntity=false`.
- No attachment delete event or content/hash change was observed.

## Evidence files

- `delete-receipt.json` — sanitized machine-readable receipt for the confirmed draft-child attempt (`404`, no DELETE dispatch).
- `active-delete-405-receipt.json` — separately labeled earlier direct-active DELETE receipt (`405`).
- `final-readback.json` — machine-readable post-discard active Bug and attachment readback.
- `baseline-before.json` and `after-readback.json` — retained readbacks for the earlier direct-active attempt.
- `card/result.png` and `card/manifest.json` — generated trace summary and manifest; they are not runtime screenshots and do not replace the JSON evidence.

Source and catalog files were inspected as read-only references. No source, Drive, workbook, unrelated Bug, or additional runtime state was changed.
