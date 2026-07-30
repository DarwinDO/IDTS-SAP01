# IDTS-113 SAP BTP authenticated and Job Scheduler smoke

Date: 2026-07-28
Environment: SAP BTP Cloud Foundry, `dev` space
Evidence status: PASS for the available Project Manager identity, CAP email
outbox, SAP Job Scheduling Service, Brevo transactional delivery and the bound
AWS S3 attachment adapter. The same deployed runtime also passed AI
disabled-provider/fallback smoke and HANA/S3 persistence readback after restart.

## Authenticated application

- AppRouter redirected through SAP BTP authentication and opened the protected
  Fiori application.
- The profile displayed `DonHV`, role `Project Manager`, and a session managed
  by SAP BTP.
- The Bug List Report loaded 17 Bugs from SAP HANA Cloud.
- PM queues were populated, including Pending Assignment, Rejected Follow-up,
  Retest Required, Overdue and PM Action Queue.
- Auth `me`, OData metadata, service root and list-report batch requests
  returned HTTP 200 after SAP HANA Cloud was running.

## Job Scheduling Service

- Service instance: `idts-sap01-jobscheduler`.
- Job: `IDTSEmailOutboxHourly`.
- The job remained active with one recurring hourly schedule.
- A temporary one-time schedule was created for the acceptance smoke.
- The fresh run completed with HTTP 200 and
  `sent=1`, `failed=0`, `skipped=0`.
- Cloud Foundry routing evidence recorded the scheduler calling
  `POST /odata/v4/bug/processEmailOutbox` and receiving HTTP 200.
- The temporary schedule was deleted after verification. The hourly production
  schedule remains active.

## Scope and remaining acceptance

- This evidence proves authentication and the PM path only. Tester and
  Developer browser sign-off requires separately approved SAP BTP identities;
  no additional user email is provisioned implicitly.
- A Cloud Foundry application-context smoke used the same bound
  `@cap-js/attachments` S3 adapter as the runtime. It uploaded a temporary
  99-byte text object, persisted HANA metadata, downloaded the object, matched
  SHA-256, confirmed object existence, then deleted both the S3 object and HANA
  metadata. Every readback reported PASS.
- A later settled Object Page snapshot displayed all four HANA-backed History
  events. After a full Object Page reload, the Notifications section displayed
  both expected Assigned/In App/Sent rows for DatDT. The earlier empty History
  and Notifications results were transient lazy-binding/timing states.
- The Chrome bridge captured the native attachment file chooser, but the
  plugin rejected `fileChooser.setFiles(...)` with `Not allowed`. No upload was
  attempted by CAP through the browser and no HANA/S3 state changed in that
  attempt. The storage adapter itself is now accepted by the independent
  application-context smoke; the full browser upload/download/delete flow
  remains pending Chrome upload permission.
- A second native-picker attempt on baseline
  `9e53434b4a5a600681ab27027f05906316179708` reproduced the same safe blocker.
  The enabled file input accepted the expected evidence MIME types, but the
  plugin again returned `Not allowed`; the settled UI remained empty. Detailed
  sanitized evidence is stored in
  `btp-native-attachment-picker-attempt-20260728.md`.
- The earlier HANA timeout occurred while the Free Tier database was stopped;
  after restart, the authenticated application and data reads succeeded.

## Email binding diagnosis

- The bound User-Provided Service is present under the expected instance name.
- CAP runtime normalized the requirement selector to
  `label: "objectstore"` while the actual service label is `user-provided`.
  The correct instance name therefore did not receive credentials.
- A safe application task confirmed that effective email configuration was
  disabled and missing host, username, password and sender address, without
  printing their values.
- The first BUG-0018 delivery was consequently stored as
  `SKIPPED / EMAIL_DISABLED`; it was not resent.
- The minimal remediation is to keep matching the exact service instance name
  and disable implicit label matching with `vcap.label=false`.
- A production build fixture confirmed that the generated server package keeps
  this selector and resolves a fake User-Provided Service into
  `credentials.email`.
- Local checks passed: CAP production build, email-outbox programmatic tests,
  SMTP integration, secret scan, agent rules, QA Depth Gate self-test and
  `git diff --check`.
- PR #201 merged normally into `dev` at commit
  `3504931d2689e4d56c0de3f5977342fc7cf57e4a`.
- A runtime-only rolling deployment used Node.js 22 and did not invoke the HDI
  deployer or alter HANA schema/data.
- The existing User-Provided Service was corrected without exposing values:
  `replyTo` now matches the configured sender, and a safe post-restart task
  reported email `ready=true` with no missing fields.
- A new BUG-0018 assignment produced a fresh delivery in `PENDING` with
  `attemptCount=0`.
- The one-time Job Scheduler run processed exactly that delivery. HANA
  readback then reported `SENT`, `attemptCount=1`, no error code, `sentAt`
  present and provider message ID present.
- Brevo MCP independently reported one `delivered` event at
  `2026-07-28T20:42:06+07:00` with subject
  `[IDTS] BUG-0018 - Assigned`. Recipient data was deliberately omitted.
- The one-time schedule was deleted after verification. The recurring hourly
  schedule remains active.

## AWS S3 attachment adapter

- Cloud Foundry task: `idts113-s3-smoke-210420` (task 17).
- Runtime context: the deployed `idts-sap01-srv` droplet with the production
  HANA and User-Provided Service bindings.
- Upload: PASS.
- HANA attachment metadata: PASS.
- Download and SHA-256 comparison: PASS.
- Object existence before delete: PASS.
- HANA metadata and S3 object absent after cleanup: PASS.
- The library emitted `File was not deleted from S3` despite AWS returning
  HTTP 204. The subsequent read-after-delete proved the object was absent, so
  this is recorded as a misleading library warning rather than a failed
  cleanup.

## AI disabled-provider and no-mutation smoke

- Similar Bugs opened a ranked candidate review dialog and returned HTTP 200
  from `suggestSimilarBugs`.
- Classification Suggestions opened with deterministic fallback content and
  clearly stated that AI assistance was disabled. The
  `suggestClassification` request returned HTTP 200.
- Handoff Summary opened with a stored-data-grounded fallback summary. The
  `summarizeBugHandoff` request returned HTTP 200.
- Smart Assign displayed workload/availability explanations and stated that
  the user must still choose the assignee. The `explainSmartAssignment`
  request reached the deployed CAP service.
- The dialogs were closed without submitting Accept, Reject, Ignore, Apply or
  assignment actions. BUG-0018 remained `Assigned`, Assignee remained `DatDT`
  and Current Action Owner remained `DatDT`.
- This is acceptance of the disabled-provider/fallback and no-mutation
  behavior only. OpenAI live-provider acceptance remains
  `NOT ACCEPTED — provider disabled`.
- Selected screenshots:
  - `btp-ai-similar-bugs-dialog-20260728.png`
  - `btp-ai-classification-dialog-20260728.png`
  - `btp-ai-handoff-dialog-20260728.png`
- The Smart Assign dialog contained personal email values. Its automated
  redaction timed out, so no unredacted screenshot was retained; the sanitized
  textual result and CAP request log are the evidence for that flow.

## Restart persistence

- The Cloud Foundry CAP application was restarted without changing the
  deployed droplet:
  - droplet GUID: `00badf81-c5a8-4643-91e9-a4240e2ac37e`;
  - droplet checksum:
    `b93bfd63f156a53d6ff68ca7b44f131d25e1c9cea18e461a879ba0ed19eb96d6`.
- Before restart, a temporary 76-byte attachment was written through the
  production-bound attachment adapter. HANA metadata and the S3 object were
  both present, with SHA-256
  `0BD05E3BA48891B6808B7CBE42F7513C0D8DB85665F4BA89ECEC3558DBD3BEA0`.
- After restart, the same HANA metadata and S3 object were read back with the
  same 76-byte length and SHA-256.
- The temporary attachment was then deleted. Final readback reported both
  `metadataExists=false` and `objectExists=false`.
- The authenticated Object Page reloaded successfully after restart:
  - BUG-0018 remained `Assigned` to `DatDT`;
  - History loaded all four expected events;
  - Notifications loaded both expected Assigned / In App / Sent rows.
- Screenshot:
  `btp-persistence-notifications-after-restart-20260728.png`.

## Job Scheduler post-restart state

- The Job Scheduling Service Dashboard remained authenticated.
- Job `IDTSEmailOutboxHourly` remained Active.
- The recurring schedule remained Active with one total/active schedule.
- The dashboard displayed a platform notice that
  `GET /scheduler/jobs` will require `page_size` from 2026-10-26. Repository
  search found no custom IDTS caller of that dashboard API, so no runtime
  remediation is currently required.

## Security

- No password, token, service key, database URL, API key or full binding
  environment is stored in this evidence.
- The temporary Job Scheduler schedule was removed after use.
- The temporary HANA attachment metadata and S3 object used for persistence
  verification were removed after readback.
