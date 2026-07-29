# IDTS-114 — SAP BTP feature-level AI browser acceptance

## Baseline

- Merge SHA: `016a6067de1c3c7725b6f74f23b90ef6b8b5f7fa`
- BTP service: `idts-sap01-srv`
- BTP AppRouter: `idts-sap01-approuter`
- Test object: `BUG-0018`
- Primary structured model: `alibaba/qwen3.7-flash`
- Primary embedding model: `alibaba/qwen3-embedding-0.6b`
- Bounded structured fallback: `openai/gpt-5.4-nano`
- Bounded embedding fallback: `openai/text-embedding-3-small`

## Result matrix

| Capability | PM browser result | Persistence/no-mutation | Full acceptance |
| --- | --- | --- | --- |
| Similar Bugs | Candidates and review dialog displayed; one accepted | Accepted audit persisted; Bug unchanged; `DuplicateLinks` remained 0 | `PARTIAL`: later provider rate-limit fallback; no confirm-duplicate UI |
| Classification Suggestion | Five rows displayed; Accept/Reject/Ignore exercised | All three review states persisted; Bug unchanged | `PARTIAL`: Apply Classification UI missing |
| Handoff Summary | Summary and missing-context disclosure displayed | Review persisted; workflow/history/notification counts unchanged | `PASS` for PM review/no-mutation; provider-live structured success not claimed |
| Smart Assign Explanation | Candidate/capability/availability/workload explanation displayed | Review persisted; no assignment executed; Bug unchanged | `PASS` for PM review/no-mutation; other roles pending |
| Tester/Developer role matrix | Not executed | No identity impersonation | `BLOCKED` |
| Duplicate confirmation | No deployed UI entry point found | Backend-only capability not browser-accepted | `BLOCKED` |
| Operational metrics | No deployed UI entry point found | Backend-only capability not browser-accepted | `BLOCKED` |

## Safe readback

The final allowlisted BTP task readback for `BUG-0018` showed:

- `status_code = ASSIGNED`.
- Assignee and next processor unchanged.
- `modifiedAt = 2026-07-28T13:37:02.976`.
- `historyCount = 4`.
- `duplicateLinkCount = 0`.
- Classification Accept/Reject/Ignore audit rows persisted.
- Similar Bugs accepted audit row persisted.

## Provider and security observations

- One Similar Bugs embedding call succeeded with the Qwen embedding model.
- Later structured/embedding calls returned safe fallback after sanitized gateway `HTTP 429` evidence; Smart Assign also showed a sanitized gateway `HTTP 400` capability response.
- No HTTP 5xx was observed on the tested feature routes.
- No raw SQL, stack trace, token, cookie, provider diagnostic or secret was shown in the UI evidence.
- Live provider success is not claimed when the UI displayed fallback content.

## Verdict and next steps

`PARTIAL / NOT READY TO CLOSE`.

IDTS-114 remains In Progress. The next work must separately address the missing Apply Classification, Confirm Duplicate and Operational Metrics UI entry points, then rerun the role matrix with approved Tester/Developer SAP identities and repeat the affected provider cases. No runtime change was made in this acceptance branch.

Evidence is organized by flow in the sibling `case-manifest.md` files. Selected screenshots are sanitized and Git-trackable; raw browser/session artifacts are not included.
