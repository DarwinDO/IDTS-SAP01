# Technical Implementation — Candidate

Each function/action is separate and follows the required 14-part trace. `None`
means that the current implementation has no UI entry point or no mutation, not that
the field was omitted.

## Identity, dashboard and notifications

### TI-AUTH-01 — login

1. **Function name:** `AuthService.login`
2. **Purpose:** Authenticate an active user and issue a single raw bearer token in the local/custom-auth deployment profile.
3. **Actor/precondition:** Anonymous user; valid active account and password.
4. **UI trigger:** Sign In button or Enter on `login.html`.
5. **Frontend source:** `app/bug-management-ui/webapp/login-page.js::submitLogin`.
6. **HTTP/OData request:** `POST /odata/v4/auth/login` with email and password.
7. **Service contract:** `srv/auth.cds`, public `login(email,password) returns LoginResult`.
8. **CAP handler/helper:** `srv/auth.js::login`; password helpers in `srv/auth/passwords.js`.
9. **Validation/authorization:** Required credentials, active user, password hash verification; invalid account/password uses one non-enumerating message.
10. **Transaction:** CAP request transaction.
11. **Database/provider side effect:** Read `Users`; insert `AuthSessions` with token hash and expiry. Raw token is returned once and is not stored.
12. **Response/UI refresh:** Store token, safe user and expiry in `sessionStorage`; redirect to the protected app.
13. **Failure/rollback:** No session on validation/auth failure; 5xx detail maps to generic sign-in unavailable text.
14. **Test/evidence:** `npm run qa:auth:programmatic`; auth browser evidence where available.

### TI-AUTH-02 — me / profile display

1. **Function name:** `AuthService.me`
2. **Purpose:** Return the safe profile for the current authenticated session.
3. **Actor/precondition:** Authenticated Tester, Developer or PM with either a valid custom bearer session or an AppRouter/XSUAA identity.
4. **UI trigger:** Protected shell initialization and profile button rendering.
5. **Frontend source:** `auth-guard.js`; `ext/login/ProfileShell.js::currentUser/createProfileButton`.
6. **HTTP/OData request:** Protected identity resolution; `GET /odata/v4/auth/me` when explicitly requested.
7. **Service contract:** `srv/auth.cds`, `@requires: 'authenticated-user' function me() returns AuthUser`.
8. **CAP handler/helper:** `srv/auth.js::me`; dual-mode resolution in `srv/auth/custom-auth.js`; BTP role alignment in `srv/auth/platform-role.js`.
9. **Validation/authorization:** Custom bearer mode requires a valid active session/user. BTP mode requires exactly one supported XSUAA role that matches `Users.role_code`. The response excludes password/token hashes and session internals.
10. **Transaction:** Read-only request.
11. **Database/provider side effect:** Read user and, in custom mode, session only; no mutation.
12. **Response/UI refresh:** Show display name, email, role and formatted expiry in SAPUI5 profile popover.
13. **Failure/rollback:** Clear/redirect on invalid session; no business mutation.
14. **Test/evidence:** `npm run qa:auth:programmatic`; protected-shell/profile browser check.

### TI-AUTH-03 — logout

1. **Function name:** `AuthService.logout`
2. **Purpose:** End the current custom session or AppRouter/XSUAA browser session without changing business data.
3. **Actor/precondition:** Authenticated user in the active deployment profile.
4. **UI trigger:** Sign Out in the profile popover.
5. **Frontend source:** `ext/login/ProfileShell.js`; `ext/login/LoginController.js`; `auth-guard.js`.
6. **HTTP/OData request:** Custom mode uses `POST /odata/v4/auth/logout`; BTP mode uses AppRouter `/do/logout` and redirects to public `/logged-out.html`.
7. **Service contract:** `srv/auth.cds`, authenticated `logout() returns Boolean`.
8. **CAP handler/helper:** `srv/auth.js::logout`.
9. **Validation/authorization:** Auth middleware resolves the session; client never sends a user ID to choose which session to revoke.
10. **Transaction:** CAP request transaction.
11. **Database/provider side effect:** Custom mode revokes/deletes the matching AuthSession. BTP mode ends the platform session and does not mutate `AuthSessions`.
12. **Response/UI refresh:** Custom mode clears local token/user/expiry. BTP mode shows the signed-out page with a `Sign in with SAP BTP` link.
13. **Failure/rollback:** No Bug data is involved; local logout remains safe and no token is displayed.
14. **Test/evidence:** `npm run qa:auth:programmatic`; logout browser flow.

### TI-AUTH-04 — SAP BTP XSUAA sign-in and role alignment

1. **Function name:** AppRouter/XSUAA sign-in and `assertPlatformRoleMatchesUser`
2. **Purpose:** Establish a BTP browser identity and reject ambiguous or mismatched platform/business roles before IDTS access.
3. **Actor/precondition:** Browser user deployed through the SAP BTP AppRouter; active XSUAA assignment and matching IDTS `Users` record.
4. **UI trigger:** Open the protected application or choose `Sign in with SAP BTP` after logout.
5. **Frontend source:** `app/router/resources/login.html`, `logged-out.html`; `app/bug-management-ui/webapp/auth-guard.js`.
6. **HTTP/OData request:** AppRouter authenticates protected routes and forwards the JWT to `/odata`; login redirect is handled by XSUAA.
7. **Service contract:** Protected application/OData routes in `app/router/xs-app.json`; CAP authenticated-user contracts.
8. **CAP handler/helper:** `srv/auth/platform-role.js::assertPlatformRoleMatchesUser`; dual-mode guard in `srv/auth/custom-auth.js`.
9. **Validation/authorization:** Require exactly one supported IDTS platform role and equality with `Users.role_code`; reject invalid assignment or mismatch with safe 403 messages.
10. **Transaction:** Read-only identity resolution before protected business handling.
11. **Database/provider side effect:** Read the internal user profile; no identity or business mutation.
12. **Response/UI refresh:** Continue to the protected Fiori app on success; show safe account-access or platform-starting guidance on failure.
13. **Failure/rollback:** Protected business handling does not start. Tokens, claims, private endpoints and stack details are not displayed or persisted.
14. **Test/evidence:** `npm run qa:idts117:btp-relogin`; BTP XSUAA/AppRouter browser evidence and source review.

### TI-PLATFORM-01 — HANA-backed readiness

1. **Function name:** `GET /ready`
2. **Purpose:** Distinguish an available CAP/HANA deployment from a stopped or unavailable database dependency.
3. **Actor/precondition:** Platform health probe or operator; CAP process is reachable.
4. **UI trigger:** None; platform/operations health check.
5. **Frontend source:** None.
6. **HTTP/OData request:** `GET /ready`.
7. **Service contract:** Express readiness endpoint registered by `server.js`.
8. **CAP handler/helper:** `server.js`; `cds.connect.to('db')`; read from `idts.cap.Users`.
9. **Validation/authorization:** Executes a bounded database read and returns only safe status categories.
10. **Transaction:** Read-only database request.
11. **Database/provider side effect:** Reads the bound HANA HDI container in BTP; no mutation.
12. **Response/UI refresh:** HTTP 200 with `UP/database: UP`, or HTTP 503 with `DOWN/database: DOWN`.
13. **Failure/rollback:** No business data changes; database exception detail is not returned to the caller.
14. **Test/evidence:** CAP compile; BTP/HANA deployment runbook and readiness/live evidence.

### TI-DASH-01 — role dashboard

1. **Function name:** `loadDashboard`
2. **Purpose:** Present role-specific KPI cards and attention items.
3. **Actor/precondition:** Signed-in Tester, Developer or PM.
4. **UI trigger:** Open/refresh `dashboard.html`.
5. **Frontend source:** `app/bug-management-ui/webapp/dashboard-page.js::loadDashboard/buildDashboardModel`.
6. **HTTP/OData request:** Parallel GETs for `/odata/v4/bug/Bugs?...` and `/odata/v4/bug/DeveloperWorkloads?...`.
7. **Service contract:** `BugService.Bugs`; read-only `BugService.DeveloperWorkloads`.
8. **CAP handler/helper:** Standard Bugs READ plus `srv/bug-service/monitoring.js::readDeveloperWorkloads`.
9. **Validation/authorization:** Bearer authentication; role shapes client presentation but does not grant backend write authority.
10. **Transaction:** Two read-only requests.
11. **Database/provider side effect:** Read Bugs and DeveloperProfiles; workload rows are computed in memory and not persisted.
12. **Response/UI refresh:** Replace JSONModel data with role-specific tiles, focus items and PM workload rows.
13. **Failure/rollback:** Show generic MessageStrip/Toast, clear dashboard collections and perform no mutation.
14. **Test/evidence:** `npm run qa:pm-monitoring:programmatic`; `npm run qa:pm-monitoring:http`; dashboard browser evidence.

### TI-MON-01 — DeveloperWorkloads

1. **Function name:** `BugService.DeveloperWorkloads READ`
2. **Purpose:** Return workload, overdue, current-action and status counts per developer.
3. **Actor/precondition:** Authenticated reader; PM is the intended full monitoring consumer.
4. **UI trigger:** Dashboard load, workload list and supported OData filters.
5. **Frontend source:** `dashboard-page.js::fetchOData`.
6. **HTTP/OData request:** `GET /odata/v4/bug/DeveloperWorkloads` with supported `$search/$filter/$orderby/$top/$skip/$select/$count`.
7. **Service contract:** `@readonly entity DeveloperWorkloads` in `srv/service.cds`.
8. **CAP handler/helper:** `srv/service.js` registration to `srv/bug-service/monitoring.js::readDeveloperWorkloads`.
9. **Validation/authorization:** Read-only contract; query operations are evaluated against computed rows.
10. **Transaction:** Read-only CAP transaction.
11. **Database/provider side effect:** Read DeveloperProfiles and Bugs; no persisted aggregate.
12. **Response/UI refresh:** Return filtered/projected rows; dashboard updates workload list and KPI context.
13. **Failure/rollback:** Generic dashboard unavailable state; no mutation to ownership or Bug data.
14. **Test/evidence:** `qa:pm-monitoring:programmatic`, `qa:pm-monitoring:http`, `qa:developer-workload:programmatic`.

### TI-NOTIFY-01 — in-app notification read

1. **Function name:** `BugService.Notifications READ`
2. **Purpose:** Show committed business-event notifications related to a Bug.
3. **Actor/precondition:** Authenticated user with access to the parent Bug/navigation.
4. **UI trigger:** Open the Notifications section on the Bug Object Page.
5. **Frontend source:** Fiori Elements metadata from `annotations/object-page.cds` and `annotations/history-notifications.cds`.
6. **HTTP/OData request:** Navigation read of `Bugs(...)/notifications` or `Notifications`.
7. **Service contract:** `Notifications` projection in `srv/service.cds`.
8. **CAP handler/helper:** Standard CAP READ; notification rows are written by history/action helpers.
9. **Validation/authorization:** Capability/navigation restrictions and authenticated Bug access.
10. **Transaction:** Read-only request.
11. **Database/provider side effect:** Read Notifications only.
12. **Response/UI refresh:** Fiori Elements refreshes the notification table through side-effect annotations after relevant actions.
13. **Failure/rollback:** Read failure does not change Bug or delivery state; standard safe OData handling.
14. **Test/evidence:** History/notification programmatic tests and Object Page notification screenshot.

### TI-NOTIFY-02 — email outbox worker

1. **Function name:** `startEmailWorker` / outbox delivery processing
2. **Purpose:** Deliver eligible email notifications after the Bug transaction commits.
3. **Actor/precondition:** Background worker; persisted NotificationDelivery is eligible and email configuration permits processing.
4. **UI trigger:** None; workflow events enqueue records, and the worker runs in the service process.
5. **Frontend source:** None.
6. **HTTP/OData request:** None for worker execution; provider call is SMTP or Brevo API according to private configuration.
7. **Service contract:** `NotificationDeliveries` projection exposes sanitized delivery status for observation.
8. **CAP handler/helper:** `srv/email/outbox.js`, `worker.js`, `sender.js`, `template.js`, `config.js`.
9. **Validation/authorization:** Enabled/ready config, recipient active/email validity, retry/lock eligibility and safe template data.
10. **Transaction:** Delivery-state transaction is independent of the already committed Bug workflow.
11. **Database/provider side effect:** Update NotificationDeliveries; send through configured provider. No credential is persisted in the row.
12. **Response/UI refresh:** No direct workflow dialog; delivery status remains observable.
13. **Failure/rollback:** Bug and in-app Notification remain committed; delivery becomes FAILED/SKIPPED or retryable with sanitized summary.
14. **Test/evidence:** `npm run qa:email-outbox:programmatic`; integration tests only when private provider configuration is explicitly enabled.

## AI suggestion, review and operational traces

Provider acceptance status:

- Direct OpenAI live acceptance for this candidate remains
  `BLOCKED / NOT ACCEPTED`.
- The SAP BTP Vercel AI Gateway path has PM live positive evidence for
  Classification, Handoff, Similar Bugs and Smart Assign. Classification routes to
  an OpenAI model behind the Gateway; this does not accept the standalone
  `provider=openai` path.
- Tester/Developer interactive role coverage remains incomplete, so PM evidence is
  not generalized to every role or to final IDTS-114 acceptance.
- Deterministic/safe fallback and review controls must not be presented as proof of
  complete live-provider acceptance.

### TI-AI-01 — suggestSimilarBugs

1. **Function name:** `suggestSimilarBugs`
2. **Purpose:** Return grounded possible duplicate/similar Bug candidates for human review.
3. **Actor/precondition:** Authenticated authorized user; usable title/description or source Bug context.
4. **UI trigger:** Find Similar Bugs on the Bug Object Page.
5. **Frontend source:** `ext/actions/DuplicateReview.js::loadSuggestions/openDialog`.
6. **HTTP/OData request:** `POST /odata/v4/bug/suggestSimilarBugs`.
7. **Service contract:** Unbound action and `SimilarBugCandidate` return type in `srv/service.cds`.
8. **CAP handler/helper:** `srv/ai/duplicate-detection.js::suggestSimilarBugs`; safe provider and audit helpers.
9. **Validation/authorization:** Validate input/source Bug; redact/limit provider input; returned candidates come from accessible Bug data.
10. **Transaction:** Request transaction for audit persistence; no Bug workflow mutation.
11. **Database/provider side effect:** Read Bugs; persist a sanitized AiSuggestion audit row when applicable; call the configured safe route (mock, standalone provider or Vercel Gateway). In BTP, Similar Bugs uses the Qwen embedding route with only the documented embedding fallback.
12. **Response/UI refresh:** Populate Similar Bugs dialog with candidates, reasons, score and review controls.
13. **Failure/rollback:** Safe no-result/unavailable state; no DuplicateLink is created.
14. **Test/evidence:** `qa:idts66:programmatic`, `qa:idts74:programmatic`, `qa:idts74:browser`.

### TI-AI-02 — suggestClassification

1. **Function name:** `suggestClassification`
2. **Purpose:** Suggest allowlisted classification values for human review.
3. **Actor/precondition:** Authenticated authorized user; usable Bug text/source context.
4. **UI trigger:** Review Classification Suggestions.
5. **Frontend source:** `ext/actions/ClassificationReview.js::loadSuggestions/openDialog`.
6. **HTTP/OData request:** `POST /odata/v4/bug/suggestClassification`.
7. **Service contract:** Unbound action and ClassificationSuggestionCandidate type in `srv/service.cds`.
8. **CAP handler/helper:** `srv/ai/classification-suggestion.js::suggestClassification`; provider, safety and audit helpers.
9. **Validation/authorization:** Validate context; ground output against active catalogs; mark unsafe/low-confidence values for review.
10. **Transaction:** Request/audit transaction; no automatic Bug change.
11. **Database/provider side effect:** Read Bug/catalogs; persist sanitized AiSuggestion audit; call the configured safe route. In BTP, Classification uses `openai/gpt-5.4-nano` through Vercel Gateway and has no model-access fallback.
12. **Response/UI refresh:** Populate field/current/suggested/review rows.
13. **Failure/rollback:** Safe unavailable/no-suggestion state; classification remains unchanged.
14. **Test/evidence:** `qa:idts67:programmatic`, `qa:idts75:programmatic`, `qa:idts75:browser`.

### TI-AI-03 — summarizeBugHandoff

1. **Function name:** `summarizeBugHandoff`
2. **Purpose:** Produce a grounded handoff summary without adding a comment or changing history/status.
3. **Actor/precondition:** Authenticated Bug participant; valid sourceBugID and accessible Bug.
4. **UI trigger:** Review Handoff Summary.
5. **Frontend source:** `ext/actions/HandoffSummaryReview.js::loadSummary/openDialog`.
6. **HTTP/OData request:** `POST /odata/v4/bug/summarizeBugHandoff`.
7. **Service contract:** Unbound action returning `BugHandoffSummaryResult`.
8. **CAP handler/helper:** `srv/ai/bug-summary.js::summarizeBugHandoff`.
9. **Validation/authorization:** Validate source ID/access; use allowlisted Bug, comment and history context; redact/limit input.
10. **Transaction:** Read/audit transaction; no Bug mutation.
11. **Database/provider side effect:** Read Bug/comments/history; persist a sanitized, field-bounded AiSuggestion audit; call the configured safe route. In BTP, Handoff uses MiniMax with one documented Grok fallback only for eligible route denial, timeout, network or 5xx failure.
12. **Response/UI refresh:** Show summary, status, owner, missing information, recent events and next action.
13. **Failure/rollback:** Generic load failure or safe fallback; no comment/history/status is created.
14. **Test/evidence:** `qa:idts68:programmatic`, `qa:idts76:programmatic`, `qa:idts76:browser`.

### TI-AI-04 — explainSmartAssignment

1. **Function name:** `explainSmartAssignment`
2. **Purpose:** Explain fit, workload and availability for assignable developers without ranking or assigning automatically.
3. **Actor/precondition:** Tester/PM assignment context; Application Component and Defect Category selected; any application draft PATCH must finish before candidate read.
4. **UI trigger:** Open Smart Assign from a new or existing Bug draft.
5. **Frontend source:** `ext/actions/SmartAssignDeveloper.js::openAssigneePicker/openDialog`, `synchronizeAssignmentContext`, `flushPendingChanges`, `waitForAutoSubmit` and `loadAiExplanations`.
6. **HTTP/OData request:** `POST /odata/v4/bug/explainSmartAssignment`.
7. **Service contract:** Unbound action returning SmartAssignmentExplanationCandidate rows.
8. **CAP handler/helper:** `srv/ai/assignment-explanation.js::explainSmartAssignment`; assignable-developer read model and provider/audit helpers.
9. **Validation/authorization:** Scope pending-change checks to the application update group so unrelated UI5 `donotsubmit` value-help contexts do not block Smart Assign; refresh derived classification; use at most 10 authorized candidates and send temporary references (`C1`...) rather than developer UUIDs; require safe output covering every candidate; human choice remains required.
10. **Transaction:** Wait for the application draft PATCH (`$auto`) or submit a custom update group, then refresh before the read/audit request; assignment remains a separate action.
11. **Database/provider side effect:** Read responsibilities/workload/Bug; persist sanitized suggestion audit; call the configured safe route. In BTP, Smart Assign uses `zai/glm-4.7-flash` with bounded provider handling.
12. **Response/UI refresh:** Refresh authoritative classification, load assignable candidates, then add explanation, warnings, confidence and review status; unrelated UI5 pending groups do not block the dialog.
13. **Failure/rollback:** An application-group timeout, refresh failure or candidate-read failure maps to `smartAssignLoadFailed`; unsafe, incomplete or missing provider output maps to deterministic explanations. No assignment is applied; manual choice remains available.
14. **Test/evidence:** `qa:idts56:programmatic`, `qa:idts69:programmatic`, `qa:idts70:programmatic`, `qa:idts72:browser`, Smart Assign candidate-coverage/output-safety evidence and `docs/pm/evidence/idts-115/smart-assign-pending-group/rollout.md`.

### TI-AI-05 — acceptAiSuggestion

1. **Function name:** `acceptAiSuggestion`
2. **Purpose:** Record the human ACCEPTED decision only.
3. **Actor/precondition:** Tester, Developer or PM; accessible non-expired PENDING suggestion.
4. **UI trigger:** Accept in Similar Bugs, Classification, Handoff or Smart Assign review UI.
5. **Frontend source:** Feature action modules plus `ext/ai/AiSuggestionReview.js` and `AiReviewUi.js`.
6. **HTTP/OData request:** `POST /odata/v4/bug/acceptAiSuggestion` with suggestionID.
7. **Service contract:** Unbound action returning AiSuggestionReviewResult.
8. **CAP handler/helper:** `srv/ai/review.js::acceptAiSuggestion/reviewAiSuggestion`.
9. **Validation/authorization:** UUID, reviewer role, accessible target Bug, PENDING state and expiry.
10. **Transaction:** Conditional update in CAP request transaction prevents double review.
11. **Database/provider side effect:** Update AiSuggestions review state, reviewer and time only.
12. **Response/UI refresh:** Show Accepted/reviewer/time and disable repeat decisions.
13. **Failure/rollback:** 409 on stale/racing decision; no Bug, classification or duplicate mutation.
14. **Test/evidence:** `qa:idts91:programmatic`, `qa:idts92:programmatic`, IDTS-74/75 browser review evidence.

### TI-AI-06 — rejectAiSuggestion

1. **Function name:** `rejectAiSuggestion`
2. **Purpose:** Record the human REJECTED decision only.
3. **Actor/precondition:** Same reviewer/access/PENDING conditions as Accept.
4. **UI trigger:** Reject in a persisted suggestion review dialog.
5. **Frontend source:** Feature action modules and shared AI review helpers.
6. **HTTP/OData request:** `POST /odata/v4/bug/rejectAiSuggestion`.
7. **Service contract:** Unbound action returning AiSuggestionReviewResult.
8. **CAP handler/helper:** `srv/ai/review.js::rejectAiSuggestion/reviewAiSuggestion`.
9. **Validation/authorization:** UUID, role, Bug access, PENDING state, expiry.
10. **Transaction:** Conditional AiSuggestions update.
11. **Database/provider side effect:** Review metadata only.
12. **Response/UI refresh:** Show Rejected and disable repeat decisions.
13. **Failure/rollback:** No Bug mutation; stale/concurrent request returns safe 409.
14. **Test/evidence:** `qa:idts91:programmatic`, `qa:idts92:programmatic`, browser review evidence.

### TI-AI-07 — ignoreAiSuggestion

1. **Function name:** `ignoreAiSuggestion`
2. **Purpose:** Record the human IGNORED decision only.
3. **Actor/precondition:** Same reviewer/access/PENDING conditions as Accept.
4. **UI trigger:** Ignore in a persisted suggestion review dialog.
5. **Frontend source:** Feature action modules and shared AI review helpers.
6. **HTTP/OData request:** `POST /odata/v4/bug/ignoreAiSuggestion`.
7. **Service contract:** Unbound action returning AiSuggestionReviewResult.
8. **CAP handler/helper:** `srv/ai/review.js::ignoreAiSuggestion/reviewAiSuggestion`.
9. **Validation/authorization:** UUID, role, Bug access, PENDING state, expiry.
10. **Transaction:** Conditional AiSuggestions update.
11. **Database/provider side effect:** Review metadata only.
12. **Response/UI refresh:** Show Ignored and disable repeat decisions.
13. **Failure/rollback:** No Bug mutation; stale/concurrent request returns safe 409.
14. **Test/evidence:** `qa:idts91:programmatic`, `qa:idts92:programmatic`, browser review evidence.

### TI-AI-08 — applyClassificationSuggestion

1. **Function name:** `applyClassificationSuggestion`
2. **Purpose:** Explicitly apply allowlisted values from an accepted current classification suggestion.
3. **Actor/precondition:** Tester/PM; accepted current classification suggestion for an accessible Bug.
4. **UI trigger:** Apply Classification after the user accepts a persisted classification suggestion.
5. **Frontend source:** `app/bug-management-ui/webapp/ext/actions/ClassificationReview.js::confirmApply/applyClassification`.
6. **HTTP/OData request:** `POST /odata/v4/bug/applyClassificationSuggestion` with suggestionID.
7. **Service contract:** Unbound action returning Bugs.
8. **CAP handler/helper:** `srv/ai/classification-apply.js::applyClassificationSuggestion`; Bug write permission/history helpers.
9. **Validation/authorization:** Coordinator role, suggestion type/state/expiry, source snapshot, payload allow-list, active catalogs and ID/code consistency.
10. **Transaction:** Bug update and grouped history in one request transaction.
11. **Database/provider side effect:** Update permitted classification fields and HistoryEvents/HistoryLogs; status/assignee remain unchanged.
12. **Response/UI refresh:** Show confirmation, invoke Apply, refresh the bound Bug from backend and show `Classification updated.`; a post-commit refresh failure tells the user to reload.
13. **Failure/rollback:** Any invalid/stale value rolls back all Bug/history changes. UI uses separate safe text for apply failure versus refresh-after-success failure.
14. **Test/evidence:** `qa:idts93:programmatic`, `qa:idts115:programmatic`, `docs/pm/evidence/idts-115/classification-apply/`.

### TI-AI-09 — confirmDuplicateSuggestion

1. **Function name:** `confirmDuplicateSuggestion`
2. **Purpose:** Explicitly create a duplicate/similar relationship from an accepted current suggestion.
3. **Actor/precondition:** Tester/PM; accepted Similar Bugs suggestion; candidate belongs to persisted candidate set.
4. **UI trigger:** Confirm Duplicate after the user accepts a persisted Similar Bugs suggestion and selects a candidate.
5. **Frontend source:** `app/bug-management-ui/webapp/ext/actions/DuplicateReview.js::confirmDuplicate` and the confirmation handler.
6. **HTTP/OData request:** `POST /odata/v4/bug/confirmDuplicateSuggestion` with suggestionID and candidateBugID.
7. **Service contract:** Unbound action returning DuplicateLinks.
8. **CAP handler/helper:** `srv/ai/duplicate-confirmation.js::confirmDuplicateSuggestion`.
9. **Validation/authorization:** Coordinator role, suggestion type/state/expiry, accessible source/candidate, no self-link, accepted candidate membership and active relation type.
10. **Transaction:** DuplicateLink insert in CAP request transaction with conflict handling.
11. **Database/provider side effect:** Insert one allowed DuplicateLink; no workflow status or assignment change.
12. **Response/UI refresh:** Show confirmation, create the link, refresh the Bug/duplicate association and show `Duplicate link to {0} created.`; a post-commit refresh failure instructs reload.
13. **Failure/rollback:** Invalid or racing duplicate returns 400/409 and creates no duplicate row. UI distinguishes confirm failure from refresh-after-success failure.
14. **Test/evidence:** `qa:idts95:programmatic`, `qa:idts115:programmatic`, `docs/pm/evidence/idts-115/duplicate-confirmation/`.

### TI-AI-10 — readAiOperationalMetrics

1. **Function name:** `readAiOperationalMetrics`
2. **Purpose:** Return PM-only aggregates for provider outcome, review state and latency.
3. **Actor/precondition:** PM; windowDays defaults to 30 and is capped at 90.
4. **UI trigger:** PM selects AI Activity on the role dashboard.
5. **Frontend source:** `app/bug-management-ui/webapp/dashboard-page.js::openAiActivity/aggregateAiMetrics`.
6. **HTTP/OData request:** `GET /odata/v4/bug/readAiOperationalMetrics(windowDays=...)`.
7. **Service contract:** `@requires: 'PM' function readAiOperationalMetrics` returning AiOperationalMetric rows.
8. **CAP handler/helper:** `srv/ai/metrics.js::readAiOperationalMetrics/aggregateAiOperationalMetrics`.
9. **Validation/authorization:** CAP PM requirement; normalize time window and sanitize feature/provider/model/status/latency values.
10. **Transaction:** Read-only request.
11. **Database/provider side effect:** Read allowlisted AiSuggestions metadata only; no mutation and no provider call.
12. **Response/UI refresh:** Open a PM-only 30-day AI Activity dialog, aggregate rows by capability and show requests, successes, unavailable/failed totals, latency and review decisions without exposing provider/model details.
13. **Failure/rollback:** Read failure performs no mutation and shows `AI activity is not available right now.` Raw prompts, responses and error details are never returned.
14. **Test/evidence:** `qa:idts97:programmatic`, `qa:idts115:programmatic`, `docs/pm/evidence/idts-115/operational-metrics/`.
