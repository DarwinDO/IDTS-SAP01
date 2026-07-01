# IDTS-32 Manual UAT Evidence

This folder stores SangVN manual browser UAT evidence for Jira `IDTS-32`.

## Evidence Files

| File | Scenario | Result |
| --- | --- | --- |
| `sangvn-dev-create-blocked-assignee-empty.png` | Developer account `sangvn` attempted to create a bug report. | `Assignee (Technical Owner)` stayed empty and submit was blocked with `Only Tester or PM users can create bug reports.` |
| `history-and-history-timeline-duplicate-ux.png` | Bug Object Page `BUG-0005` displayed both `History` and `History Timeline` at the same navigation level. | Manual UAT observation: the two history views can feel duplicated for end users; `History Timeline` is recommended as the primary user-facing view, while raw `History` should be kept only if needed for audit/debug/admin review. |
| `priority-severity-invalid-1-accepted.png` | Tester entered `1` into both required `Priority` and `Severity` fields during bug creation. | Manual UAT finding: invalid free-text values should be rejected because valid Priority/Severity values are fixed catalog codes, but the bug could still be created. |

## Jira References

- Jira issue: `IDTS-32`
- Jira comments: `10256`, `10257`, `10258`, `10260`, `10262`
