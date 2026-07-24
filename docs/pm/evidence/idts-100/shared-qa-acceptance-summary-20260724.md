# IDTS-100 Shared QA acceptance summary — 2026-07-24

## Frozen environment

- Shared QA service: `idts-sap01-qa`.
- Redeploy ID: `dep-d9hmfko4n6ts73b5egsg`.
- Deployed commit: `c953cd7ad3683fc2a891ad3d09708f236f157902`.
- Deploy status after restart/redeploy: `live`.
- OpenAI live provider: disabled by project decision; it was not called or reported as live acceptance.

## Local-fast result

- CAP EDMX compilation: PASS.
- UI5 production build: PASS.
- Auth: 28/28 PASS.
- Active code-list and create authorization: 18/18 PASS.
- Smart assignment: 13/13 PASS.
- Fiori UX contract: 12/12 PASS.
- History wording check: 3/3 PASS.
- Comments/attachments programmatic persistence: PASS.
- Developer workload: 36/36 PASS.
- Expanded developer demo data: 12/12 PASS; expected 14 users, 12 developers, 12 profiles and 30 responsibilities.
- Exact workflow action audit: 11/11 exact action types PASS.
- Email outbox, local SMTP and Brevo API integration: PASS.
- AI acceptance: 6/6 local suites PASS; safety/no-mutation checks PASS.
- QA Depth Gate: 15/15 PASS; agent rules PASS; ownership gate 5/5 PASS; secret scan PASS.

## Shared QA AI result

- Authentication metadata and QA login: PASS.
- Anonymous AI action: correctly rejected with HTTP 401.
- Similar Bugs, Classification Suggestion, Handoff Summary and Smart Assignment Explanation: HTTP 200 with sanitized review-only responses.
- Provider state: `AI_DISABLED`, with deterministic safe fallback.
- Source bug status and assignee remained unchanged.
- Sanitized `AiSuggestions` audit rows were exposed for review.
- Result: 25/25 Shared QA AI smoke checks PASS; combined IDTS-72 acceptance 7/7 suites PASS.

## Shared QA attachment and persistence result

- Comments were hidden during Create while Evidence / Attachments remained enabled.
- Two safe text files were selected before Save, uploaded after Save and returned matching SHA-256 values.
- Unsupported and over-10-MB files were rejected before persistence.
- A controlled upload failure left the Bug saved and displayed a safe recovery message.
- Persistence marker: `BUG-0013` in `PENDING_ASSIGNMENT`.
- Before redeploy SHA-256:
  - evidence A: `3c35d95595ac7f395de38c94ce51330dcb8df36ac3af5373182dddddb606e14b`;
  - evidence B: `82a9c333284b792cff526add07df5ad4b5594aa120be718d86e076c23a8b832d`.
- After redeploy of the frozen commit, the Bug and both attachment metadata rows remained available; both downloads returned HTTP 200 with the same SHA-256 values.
- This proves PostgreSQL metadata persistence and S3 binary persistence across a Render redeploy.
- One attachment was then downloaded successfully, deleted with HTTP 204, and rejected with HTTP 404 on the next download attempt. The remaining attachment was retained on the clean mentor demo Bug.

## Shared QA multi-role lifecycle result

- A fresh PM/Tester/Developer harness created and activated a draft, then exercised assignment, review, progress, request-more-information, resubmission, rejection follow-up, resolution, retest, close, and reopen paths.
- Result: 40/40 assertions PASS on `BUG-0017` (`8716389e-687e-4da4-9363-db1beb355df5`).
- The run proved server-side role enforcement, status and assignee changes, next-processor recalculation, history records, exact action types, and notification creation.
- All 11 exact workflow command codes were present in the audit catalog. The final demo state is `ASSIGNED` so it can be reused during mentor review.
- Active Bugs are intentionally non-deletable through the public OData contract (HTTP 405). Disposable active UAT rows were therefore not removed through a bypass or direct database write; this is a disclosed cleanup limitation, not a functional failure.

## Shared QA browser AI result

- Similar Bugs is available in Bug Summary, Classification Suggestions in Classification, Handoff Summary in History, and Smart Assignment Explanation in Assignment.
- Fresh browser evidence confirms all four entry points and dialogs are visible, readable, and review-only.
- The source Bug status and assignee did not change after opening the AI review flows.
- Live OpenAI remains disabled. Results were deterministic safe fallback/mock behavior and must not be represented as live-provider acceptance.

## Shared QA Brevo result

- Ten new `NotificationDeliveries` rows for `BUG-0017` reached `SENT` with `attemptCount = 1`, `sentAt`, and provider message IDs.
- Brevo provider evidence includes request, delivered, and opened events for the fresh scenario, with recipient data redacted.
- No bounce/provider error was observed for the new deliveries.
- Direct named inbox/spam confirmation from all four humans was not available to the agent. One provider-level opened event proves at least one delivered message was opened, but it is not substituted for four human UAT signatures.

## Shared QA developer-data result

- `AssignableDevelopers`: HTTP 200, 12 rows.
- `DeveloperWorkloads`: HTTP 200, 12 rows.
- The first verification query returned HTTP 400 because the harness selected the nonexistent public field `displayName`; metadata confirmed the correct field is `developerName`, and the corrected query passed. This was a test-query issue, not a product defect.

## Final truthful acceptance state

- Automated/local and Shared QA functional acceptance supports 21 PASSED cases out of 27 planned.
- Six named human UAT cases remain `PREPARED`; agent role rehearsal is supporting evidence, not a fabricated SangVN/DatDT/NhanT/mentor sign-off.
- OpenAI live-provider acceptance is `NOT ACCEPTED — disabled by decision`; fallback/no-mutation checks pass.
- Mentor approval/signature and the separate Knowledge Gate remain pending.
