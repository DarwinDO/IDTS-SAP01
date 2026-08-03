# IDTS-116 — Comment auto-refresh browser acceptance

## Result

`PASS — committed comment appears immediately and persists after hard reload`

## Baseline

- Merge SHA: `37446970eabb0eedfcc15b9de2868449ed2bcc6f`.
- Deployed application version: `0.0.3`.
- Environment: SAP BTP AppRouter, CAP service and SAP HANA Cloud.
- Role: authenticated Project Manager.
- QA record: `BUG-0019`.
- Executor: DonHV.
- Timestamp: 2026-08-04, Asia/Bangkok.
- Jira evidence comment: `IDTS-116` comment `10935`.

## Controlled check

1. Entered marker `IDTS-116 auto-refresh verification 3744697` in the comment
   field.
2. Submitted the existing SAPUI5 OData V4 `addComment` action.
3. Observed toast `Comment posted.` without a refresh-warning message.
4. Observed the marker as the first comments-list item without reloading.
5. Performed a hard reload and waited for the independent comments read.
6. Observed the same marker again as the first item.

## Expected and actual

| Check | Expected | Actual | Result |
| --- | --- | --- | --- |
| Comment write | OData action commits once | Comment was committed once | PASS |
| Immediate UI | New row appears without page refresh | Marker appeared at the top immediately | PASS |
| Reload persistence | Committed row remains after reload | Marker reappeared after the comments read completed | PASS |
| Duplicate protection | Refresh must not replay the write | Only one marker row was present | PASS |
| Safe presentation | No token, cookie, credential or raw diagnostic | None appeared in captured evidence | PASS |

## Evidence

- `comment-visible-without-reload-3744697.png` — immediate feed update.
- `post-reload-page-loaded-3744697.png` — active QA record loaded after hard
  reload. The persisted marker was verified in the comments binding after its
  asynchronous read completed; this image is context evidence and does not by
  itself show the marker row.

## Interpretation and limitation

The earlier toast asking the user to refresh was not reproduced on application
version `0.0.3`; it came from an older browser bundle. The current generated
comments binding uses an independent read request and the controller refreshes
that binding after the successful action.

Immediately after hard reload, the asynchronous comments read can briefly show
the empty state before data arrives. The persisted comment then appears. This is
a minor loading-state observation, not a failed write or stale-refresh defect.
This evidence does not by itself prove a separate comment-history event unless
that behavior is confirmed as part of the current business contract.
