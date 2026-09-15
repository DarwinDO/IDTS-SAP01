# UAT-EMAIL-002 — BLOCKED

- Executor: `NhanT (DonHV support)`
- Case: `48`
- Catalog source: `origin/dev` at `64bb215bd1b5b7d83f4d4557e8433874b68e703b`
- Catalog baseline: `e019f7799fd30a419fafb048b41653d72a837083`
- Status: `BLOCKED`

## Approved catalog wording

**Title:** Temporary email failure retries without rolling back Bug workflow

**Precondition:** Controlled provider failure is available.

**Steps:**

1. Perform the workflow action.
2. Observe delivery retry state.
3. Reload the Bug.

**Expected result:** Bug workflow remains committed; delivery records a bounded retry/failure state without duplicate business history.

## Truthful blocker

The case was not executed. The approved scope does not provide an authorized isolated per-delivery provider-failure mechanism or a local full Bug workflow harness that can prove all of the required outcomes together: the Bug workflow commit, bounded delivery retry/failure state, reload/readback, and no duplicate business history.

Existing local email tests use an isolated SQLite/in-memory setup and exercise email/outbox functions. They do not invoke a real Bug workflow and do not prove the complete UAT assertion that no duplicate business history is created. Therefore those tests are not promoted as official UAT evidence.

DEC-064 prohibits outage simulation and live provider/data mutation. No BTP provider outage/configuration change, live provider call, database/data mutation, source/catalog/Drive/workbook change, or deployment was performed for this package.

## Evidence boundary

This folder contains only a sanitized manifest, this summary, and a generated `BLOCKED card result.png`. The PNG is a blocker summary card, not a runtime screenshot. No runtime screenshot, Network capture, workflow receipt, retry readback, or duplicate-history readback is claimed.

## Required next step

Approve and provide either:

- an isolated per-delivery failure mechanism that is safe for the target environment; or
- a local full Bug workflow harness with case-specific readback that exercises the same business assertion.

After that precondition exists, official UAT still requires case-specific runtime evidence for the workflow action, delivery retry/failure state, Bug reload/readback, and duplicate business-history check.

## Validation record

- `manifest.json`: JSON parse succeeded; `status` is `BLOCKED`; executor is exactly `NhanT (DonHV support)`.
- `BLOCKED card result.png`: valid PNG, `1600x1000`, nonblank.
- Card SHA-256: `F705FEE97E4F477A53071396FB103B1246C892EC59E3E51E6CE5DE0E70A7E5E3`.
- Sanitized text-artifact secret scan: PASS; no credential-like pattern found.
