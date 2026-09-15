# UAT-BUG-010 — PM draft-create denial

**Verdict: PASS — the expected authorization denial was observed.**

DonHV / Project Manager was confirmed in Edge. The Bugs list exposes no Create/New action. Exactly one authenticated POST to `/odata/v4/bug/Bugs` returned **403**: `Only Tester users can create bug reports.` No retry was made.

Prepared request ID: `bab1d7da-907e-4032-8993-0d2986dfd890`
Endpoint: `POST /odata/v4/bug/Bugs`
Result: HTTP 403; post-reload marker active count 0, draft count 0, and UI search All Bugs (0).

Counts were unchanged before and after: Bugs 26, HistoryEvents 233, Notifications 156, NotificationDeliveries 119. BUG-0026 remains active and unchanged. Its unchanged PM draft was discarded first; the app confirmed `Draft discarded`, the active route and Edit action returned, and no draft lock remains.

The sanitized request and response are in [prepared-request.json](prepared-request.json) and [receipt.json](receipt.json); preflight and readback details are in [preflight.md](preflight.md). Full-page screenshots were captured inline in the task thread; the CUA API did not expose a local image-file export path.
