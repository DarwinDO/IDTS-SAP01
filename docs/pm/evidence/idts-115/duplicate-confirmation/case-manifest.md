# Duplicate Confirmation — PM acceptance

| Field | Value |
| --- | --- |
| Role | PM |
| Source Bug | `BUG-0019` |
| Candidate Bug | `BUG-0020` |
| Baseline | `ae209c8f82227e4dedca09247db96c0b47097d92` |
| Environment | SAP BTP Cloud Foundry through AppRouter/XSUAA |
| Result | PASS |

## Expected

1. Confirm Duplicate is disabled before candidate selection and accepted review.
2. Selecting a candidate or accepting a suggestion alone must not create a link.
3. Confirmation requires a deliberate user action.
4. Repeated confirmation must not create another link.
5. Status, assignee and next processor must not change.

## Actual

- `BUG-0020` appeared as the selected 100% duplicate candidate.
- Confirm remained disabled until the suggestion was accepted.
- The UI requested confirmation and reported that the duplicate link was created.
- HANA readback confirmed exactly the expected directed relationship:

```text
sourceBug_ID = 19567605-6e37-4524-9b40-e499fd625de9
targetBug_ID = 330480e8-299e-4540-a71e-ded3840d184c
relationType_code = DUPLICATE
createdAt = 2026-07-29T09:34:14.049Z
```

- The related embedding audit includes a Qwen `SUCCESS` row.

## Selected evidence

- `pm-bug-0019-confirmed-bug-0020.png`
- `../provider-readback/hana-ai-and-duplicate-readback.md`

The UUIDs identify controlled QA records and are not credentials.
