# UAT-ATT-007 setup — PASS

- Session: DatDT / Developer (credential values omitted).
- Controlled Bug: BUG-0026 (`39ed5ffc-867d-4abe-956f-e54ae68c5c10`), assigned to DatDT, status `ASSIGNED`.
- Supported flow: Fiori Edit → Attachments → select `idts-127-att007-controlled.txt` → Upload → Save/activate once.
- Active attachment ID: `dd853abe-3284-4d6c-8ef1-0158cf9603cb`.
- Metadata: `text/plain`, 36 bytes, created by DatDT (account identifier redacted), scan status `Unscanned`.
- Content readback: HTTP 200, exact body match, SHA-256 `3B115B4A49349F9A5C4EC9B2D70AA9525649E9D6A94594EC0E0B92CB9D20113E`.
- BUG-0026 readback: 1 active attachment, 4 history events, 2 notifications, 0 comments.
- Global observed counts: Bugs 26; HistoryEvents 234; Notifications 156; Comments 20; DuplicateLinks 3; NotificationDeliveries 119; AiSuggestions 103.
- UI history confirms `Added attachment idts-127-att007-controlled.txt.` by DatDT.
- No deletion attempted; no source, Drive, workbook, or unrelated Bug mutation performed.

Raw authenticated readback was sanitized before storage; credentials and account identifier are intentionally omitted.
