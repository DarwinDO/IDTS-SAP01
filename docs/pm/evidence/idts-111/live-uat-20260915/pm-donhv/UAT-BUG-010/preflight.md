# UAT-BUG-010 preflight

Status: completed. Exactly one authenticated Bug-creation POST was issued after the parent’s action-time confirmation.

## Live Edge evidence

- The Edge IDTS profile shows DonHV with the Project Manager role.
- The Bugs list is open with Editing Status set to All. The list action toolbar contains Open Dashboard and Open User Administration, with no visible Create/New action.
- All Bugs count before the test: 26.
- Before the POST, search for `IDTS-UAT-BUG-010-20260915-978STK` with Editing Status set to All returned All Bugs (0).
- The app header shows 37 unread notifications. This is an unread badge, not a total Notifications table count.

## Count baseline limits

The BUG-0026 detail page showed no History events and no Notifications for that Bug. These are per-Bug counts, not global entity totals. Global HistoryEvents, Notifications, and NotificationDeliveries totals are not exposed on the permitted UI surfaces. A single read-only Edge navigation to `/odata/v4/bug/Bugs?$top=0&$count=true` was blocked by Microsoft Edge with `ERR_BLOCKED_BY_CLIENT`; no alternate API path was tried.

## Result and readback

The single `POST /odata/v4/bug/Bugs` returned HTTP 403 with `Only Tester users can create bug reports.` The authenticated BTP session included an X-CSRF token; the token value was neither captured nor persisted. No retry was made.

After reloading the Bugs list, All Bugs remained 26 and the marker search with Editing Status = All returned All Bugs (0). Authenticated read-only count queries confirmed no active or draft marker record. Global counts were unchanged: Bugs 26, HistoryEvents 233, Notifications 156, NotificationDeliveries 119.

The BUG-0026 PM draft opened by this UAT was discarded first. The app showed `Draft discarded`; the route returned to `IsActiveEntity=true`, Edit was restored, and status/assignee/current owner/Updated At remained Assigned/DatDT/DatDT/Sep 15, 2026, 4:05:47 PM. No draft lock remained. History, Notifications, and Attachments for BUG-0026 remained empty.

## Expected boundary

The prepared request body and sanitized live response are in `prepared-request.json` and `receipt.json`. The UI Create action is hidden. The live response matched the expected permission boundary.
