# IDTS-100 Integration Evidence Index

This index links the current mentor-review integration evidence. It contains no credentials, bearer tokens, private database URLs, AWS keys, SMTP/API keys, or full recipient lists.

| Integration / flow | Result | Evidence | Limitation |
| --- | --- | --- | --- |
| Render deployment | PASS | `baseline-20260724.md`; deployed commit `c953cd7` was restarted and returned live | Shared QA is educational/demo, not production approval |
| Authentication and protected OData | PASS | local-fast auth suite and Shared QA probes | Human account ownership is outside automated evidence |
| Multi-role Bug lifecycle | PASS, 40/40 | `shared-qa-lifecycle/shared-qa-lifecycle.json` | Active UAT Bugs cannot be deleted through public OData |
| PostgreSQL persistence | PASS | `shared-qa-acceptance-summary-20260724.md` | Long-term database migration decision remains open |
| AWS S3 attachment upload/download/hash/reload/delete | PASS | `shared-qa-attachments/` and `delete-verification-20260724.md` | Private bucket details are intentionally excluded |
| Brevo transactional delivery | PASS at provider/outbox level | `shared-qa-email-brevo-20260724.md` | Four named human inbox signatures remain pending |
| Similar Bugs review | PASS with safe fallback | `shared-qa-ai-browser/all-review-actions/` | Live OpenAI provider disabled / not accepted |
| Classification Suggestions review | PASS with safe fallback | `shared-qa-ai-browser/all-review-actions/` | Live OpenAI provider disabled / not accepted |
| Handoff Summary review | PASS with safe fallback | `shared-qa-ai-browser/all-review-actions/` | Live OpenAI provider disabled / not accepted |
| Smart Assignment Explanation | PASS with safe fallback | `shared-qa-ai-browser/assignment/` | Advisory only; no autonomous assignment |
| SAP490 test catalog | PASS for executed scope | 21 PASSED, 6 PREPARED in `docs/qa/test-catalog.json` | UAT and mentor sign-off are human-only |

## Review rule

The mentor pack may be described as **conditionally ready for mentor review**, not as fully accepted or production-ready. A provider mock/fallback PASS is not a live-provider PASS, and an agent role rehearsal is not a human UAT signature.
