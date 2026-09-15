# UAT-LIFE-012 — unauthorized Start Progress attempt

Result: PASS — the single `startProgress` request returned the expected HTTP 403 and the reloaded GET readback matched the baseline.

- Actor: `dodepzai6` — Developer; authenticated in the new Chrome Work tab.
- Target: BUG-0026 (`39ed5ffc-867d-4abe-956f-e54ae68c5c10`), status `ASSIGNED`; DatDT remains both technical assignee and current action owner.
- Baseline capability: `canStartProgress: false`.
- Baseline/readback counts: Bugs 1; Comments 0; HistoryEvents 3; HistoryLogs 7; Notifications 2; NotificationDeliveries 1.
- Mutation attempt: exactly one `POST` to `BugService.startProgress`; response 403, expected authorization message.
- Post-reload proof: status, owner fields, capability, and all counts match baseline; no unexpected mutation.
- The original Chrome Work tab was left untouched. The new tab was used for the test.
- A viewport screenshot was captured inline after reload. Full-page screenshot capture timed out; no screenshot or full-page card file has been written yet.

See `baseline-before.json`, `start-progress-post-receipt.json`, and `after-readback.json` for sanitized machine-readable evidence.
