# Knowledge: `srv/bug-service/status-metrics.js`

## Purpose

This module implements the PM-only Bug status aggregate used by the dashboard. It counts active Bugs in HANA through CAP CQN and joins the result to active status master data.

## Contract and safety

- Returns exactly ten current workflow statuses and excludes legacy `NEW`.
- Returns zero-count statuses so the dashboard layout remains stable.
- Uses a fixed allowlist, grouped `COUNT(ID)`, and no user/business payload.
- Does not write data, change the CDS persistence model, or require an HDI deployment.

## Debug path

Dashboard Network request → `srv/service.cds` `readBugStatusMetrics` → registration in `srv/service.js` → `readBugStatusMetrics()` here → `idts.cap.StatusValues` and `idts.cap.Bugs`.
