# IDTS-116 Attachment Browser Acceptance — SangVN Support

## Scope

- Date: 2026-08-04.
- Runtime: SAP BTP QA through the IDTS AppRouter.
- Authorized role: Project Manager.
- Controlled record: `BUG-0019`.
- Controlled filename: `idts-116-attachment-acceptance-sangvn-20260804.txt`.
- Controlled size: 236 bytes.
- Expected and downloaded SHA-256: `303F802CED28A74E5E3F3363FE5BCDA6A109C801EF4EA5E2BB6BAD9E69ABE59E`.

The controlled text contained no credentials, tokens, private endpoints, or personal data. The screenshots are cropped before the `Created By` column and expose no email address.

## Result

The authorized browser flow passed:

1. The draft initially contained four existing attachments.
2. Uploading the controlled file and saving the parent Bug produced an active row.
3. Hard reload followed by opening the Attachments facet showed five active rows and the controlled filename.
4. Selecting the filename produced a real 236-byte browser download whose SHA-256 exactly matched the source file.
5. Edit mode selected only the controlled row; Delete was confirmed and the parent Bug was saved.
6. Final hard reload followed by opening the Attachments facet showed the four original rows and no controlled filename.

This evidence proves the scoped UI flow `upload → Save/activate → hard reload → download/hash → delete/Save → reload absence`. It does not independently prove HANA rows, S3 object deletion, malware scanning, or database/provider internals; DonHV retains those operator-evidence and closure decisions.

## Screenshot register

| No. | File | Evidence |
| ---: | --- | --- |
| 1 | `01-before-upload.png` | Draft Attachments count is four before the controlled upload. |
| 2 | `02-after-save-hard-reload.png` | Active Attachments count is five and the controlled SangVN filename is visible after Save and hard reload. |
| 3 | `03-deleted-in-draft.png` | Draft count is four after deleting only the controlled row. |
| 4 | `04-after-delete-save-hard-reload.png` | Active count remains four after Save and final hard reload; the controlled filename is absent. |

## Tooling note

The browser-control `download` event timed out because the content link used a transient new tab. The browser still wrote the file to its Downloads directory; native filesystem size and SHA-256 verification proved the downloaded bytes exactly matched the source. This is a browser-control instrumentation issue, not a product failure.

Jira handoff: IDTS-116 comment `10945`. No Jira transition, database/seed operation, PR merge, or final artifact upload was performed.
