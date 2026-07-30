# IDTS-115 SAP BTP Create Bug acceptance

## Result

`PASS — PM create/save/reload and HANA persistence`

| Field | Value |
| --- | --- |
| Baseline merge SHA | `4fa1eaa45a7e56c71ea628127ebf9172ef02c14e` |
| Role | PM |
| Test record | `BUG-0022` |
| Record ID | `8353befc-ca80-4733-85a0-c669d1cc09f8` |
| Test window | `2026-07-29 23:16–23:20 UTC+07` |
| Environment | SAP BTP Cloud Foundry / HANA Cloud |
| Cache control | New application URL with a unique `cb` query value |

## Expected result

- The user opens `Reproduction and Test Context` before editing its lazy fields.
- Steps, Actual Result and Expected Result accept the first edit.
- Application Component and Defect Category are selected through value help.
- The first `Create` action activates the draft successfully.
- The three reproduction fields remain after full navigation reload.
- CAP derives `componentCategory_ID` from the selected Application Component
  and Defect Category.
- No new `invalid segment: componentCategory_ID`, unread-property error, HTTP
  5xx or raw technical error appears during the controlled test window.

## Actual result

- `BUG-0022` was created on the first activation attempt.
- The active Bug shows status `PENDING_ASSIGNMENT`, priority `CRITICAL` and
  severity `BLOCKER`.
- All three reproduction values were visible after activation and again after
  a full navigation reload.
- Read-only HANA verification confirmed the same values and the derived
  component/category relationship:
  - Application Component: `40000000-0000-0000-0000-000000000001`
  - Defect Category: `50000000-0000-0000-0000-000000000001`
  - Derived Component Category: `60000000-0000-0000-0000-000000000001`
- The browser produced no new console entries after the controlled test
  baseline. SAP BTP web logs produced no error entry during `23:16–23:20`.

## Diagnosis of the earlier warning

The deployed `BugService.xml` was inspected through a read-only Cloud Foundry
task. The only `Common.ValueList` block that still references
`componentCategory_ID` targets `BugService.Bugs/assignee_ID`, where it is a
valid input for filtering assignable developers. The Defect Category value
help no longer writes `componentCategory_ID`.

The warning observed in the earlier same-tab run did not recur after loading a
fresh application model with a cache-busted URL. It is classified as stale
browser metadata from the rollout transition, not a remaining annotation
mapping in the deployed package.

## Evidence

| File | Purpose |
| --- | --- |
| `04-r3-cache-busted-before-create.png` | Lazy section opened and all three fields populated before Create |
| `05-r3-created-active-reproduction.png` | Active `BUG-0022` after the first successful Create |
| `06-r3-reload-persistence.png` | Values and create history still visible after reload |

The screenshots contain no password, API key, token, cookie, database URL or
raw provider payload.

## Limitations

- This case verifies the PM Create Bug path only.
- The deferred Tester/Developer role matrix remains required before IDTS-115
  can be closed.
- Known SAPUI5 flexibility/deprecation messages produced during application
  startup occurred before the controlled test baseline and are tracked as
  framework/environment noise, not as this case's product result.
