'use strict'

/*
 * Generates the EN-only IDTS-111 UAT planning catalog.
 * This is planning truth, not execution truth: every case remains PREPARED
 * until a named team member performs it and DonHV reviews its evidence.
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')
const OUTPUT = path.join(ROOT, 'docs', 'qa', 'idts-111-uat-catalog.json')
const BASELINE_SHA = '447da1dab80418847d806040e6b2060b0916cb63'

const trace = {
  auth: ['srv/auth.js', 'app/bug-management-ui/webapp/login-page.js'],
  draft: ['srv/bug-service/drafts.js', 'srv/bug-service/bug-write.js'],
  classification: ['srv/bug-service/bug-write.js', 'srv/ai/classification-suggestion.js'],
  assignment: ['srv/bug-service/actions.js', 'srv/bug-service/read-models.js', 'srv/ai/assignment-explanation.js'],
  lifecycle: ['srv/bug-service/actions.js', 'srv/bug-service/permissions.js'],
  collaboration: ['srv/bug-service/content.js', 'app/bug-management-ui/webapp/ext/sections/BugCollaboration.js'],
  history: ['srv/bug-service/history.js', 'srv/bug-service/history-read-models.js'],
  email: ['srv/email/outbox.js', 'srv/email/worker.js'],
  monitoring: ['srv/bug-service/monitoring.js', 'app/bug-management-ui/webapp/dashboard-page.js'],
  ai: ['srv/ai/provider.js', 'srv/ai/review.js'],
  similar: ['srv/ai/duplicate-detection.js', 'srv/ai/duplicate-confirmation.js'],
  aiClassification: ['srv/ai/classification-suggestion.js', 'srv/ai/classification-apply.js'],
  handoff: ['srv/ai/bug-summary.js'],
  metrics: ['srv/ai/metrics.js']
}

const cases = []
let visibleNumber = 0

function evidenceFor (kind) {
  const common = [
    'case-specific UI screenshot',
    'sanitized case manifest with role, timestamp, baseline/deploy SHA, expected and actual result'
  ]
  if (['AUTHORIZATION', 'NEGATIVE', 'INTEGRATION', 'RECOVERY'].includes(kind)) common.push('sanitized Network status or safe error screenshot')
  if (['PERSISTENCE', 'INTEGRATION'].includes(kind)) common.push('before/after and reload/readback screenshot')
  return common
}

function add ({ id, domain, journey, title, actor, owner, kind = 'POSITIVE', priority = 'HIGH', precondition, steps, expected, source, requirement = null, postcondition = 'Keep controlled QA data unless the case explicitly tests deletion.' }) {
  visibleNumber += 1
  cases.push({
    caseId: id,
    displayNumber: String(visibleNumber),
    language: 'EN',
    domain,
    journey,
    title,
    actorRole: actor,
    executionOwner: owner,
    classification: kind,
    priority,
    requirementReferences: requirement ? [requirement] : [],
    preconditions: precondition,
    testData: 'Use controlled SAP BTP QA data; do not use production or private personal data.',
    steps,
    expectedResult: expected,
    postcondition,
    sourceTrace: source.map(file => ({ file })),
    environment: 'SAP BTP AppRouter + XSUAA + SAP HANA Cloud; external provider checks only where stated.',
    evidenceRequirements: evidenceFor(kind),
    execution: {
      status: 'PREPARED',
      executor: null,
      executedAt: null,
      deploySha: null,
      actualResult: null,
      evidenceIds: [],
      reviewer: null,
      reviewedAt: null
    },
    limitation: null
  })
}

function simple (domain, journey, actor, owner, source, rows) {
  for (const row of rows) add({ domain, journey, actor, owner, source, ...row })
}

simple('Authentication', 'Sign in and session', 'TESTER', 'NhanT', trace.auth, [
  { id: 'UAT-AUTH-001', title: 'Tester signs in through XSUAA', precondition: 'Active Tester SAP identity is mapped to one active IDTS Tester.', steps: ['Open the AppRouter URL.', 'Complete SAP sign-in.', 'Open the profile menu.'], expected: 'The List Report opens and the profile identifies the mapped Tester without exposing token or session internals.' },
  { id: 'UAT-AUTH-002', title: 'Unmapped SAP identity is denied safely', kind: 'AUTHORIZATION', precondition: 'Use a valid SAP identity with no active IDTS mapping.', steps: ['Open the AppRouter URL.', 'Complete SAP sign-in.'], expected: 'Access is denied with a safe business message and no Bug data is shown.' },
  { id: 'UAT-AUTH-003', title: 'Role mismatch is denied safely', kind: 'AUTHORIZATION', precondition: 'Platform role and mapped IDTS role intentionally differ.', steps: ['Open the AppRouter URL.', 'Complete SAP sign-in.'], expected: 'HTTP 403 is handled safely; role internals and protected data are not exposed.' },
  { id: 'UAT-AUTH-004', title: 'Expired session redirects to sign-in', kind: 'RECOVERY', precondition: 'Tester session is expired.', steps: ['Reload a protected application route.', 'Complete sign-in again.'], expected: 'The user is redirected to SAP sign-in and can resume without a blank page or raw error.' },
  { id: 'UAT-AUTH-005', title: 'Logout ends the current session', kind: 'PERSISTENCE', precondition: 'Tester is signed in.', steps: ['Choose Logout.', 'Reopen a protected route.'], expected: 'The old session cannot access protected data and SAP sign-in is required again.' }
])

simple('Bug creation', 'Create and save Bug', 'TESTER', 'NhanT', trace.draft, [
  { id: 'UAT-BUG-001', title: 'Create a valid Bug without assignee', kind: 'PERSISTENCE', precondition: 'Tester is signed in and active code-list values exist.', steps: ['Choose Create Bug.', 'Enter all required values without an assignee.', 'Save.', 'Reload the Bug.'], expected: 'One active Bug is created as Pending Assignment; reporter and next processor are server-derived and values survive reload.' },
  { id: 'UAT-BUG-002', title: 'Create a valid Bug with assignee', kind: 'PERSISTENCE', precondition: 'A matching available Developer exists.', steps: ['Choose Create Bug.', 'Enter required values and choose the Developer.', 'Save and reload.'], expected: 'One active Assigned Bug is created with the selected assignee and Developer as next processor.' },
  { id: 'UAT-BUG-003', title: 'Required title prevents save', kind: 'NEGATIVE', precondition: 'New Bug draft is open.', steps: ['Leave Title empty.', 'Complete the other required values.', 'Choose Create.'], expected: 'Save is blocked with a field-targeted safe validation message; no active Bug is created.' },
  { id: 'UAT-BUG-004', title: 'Required description prevents save', kind: 'NEGATIVE', precondition: 'New Bug draft is open.', steps: ['Leave Description empty.', 'Complete the other required values.', 'Choose Create.'], expected: 'Save is blocked with a field-targeted safe validation message; no active Bug is created.' },
  { id: 'UAT-BUG-005', title: 'Invalid classification pair prevents save', kind: 'NEGATIVE', precondition: 'New Bug draft is open.', steps: ['Choose an Application Component and incompatible Defect Category.', 'Complete other required values.', 'Choose Create.'], expected: 'HTTP 400 is shown as a safe field message and no invalid active Bug is stored.' },
  { id: 'UAT-BUG-006', title: 'Draft preserves entered reproduction fields', kind: 'PERSISTENCE', precondition: 'New Bug draft is open.', steps: ['Enter Steps to Reproduce, Actual Result, and Expected Result.', 'Navigate between sections.', 'Save and reload.'], expected: 'All three values persist exactly once without a property-not-read error.' },
  { id: 'UAT-BUG-007', title: 'Discard new draft creates no active Bug', kind: 'NEGATIVE', precondition: 'New Bug draft contains unsaved values.', steps: ['Choose Discard Draft.', 'Confirm discard.', 'Search for the entered title.'], expected: 'No active Bug is created and the abandoned draft does not block later create/edit flows.' },
  { id: 'UAT-BUG-008', title: 'Edit an active Bug and save one field', kind: 'PERSISTENCE', precondition: 'An active editable Bug exists.', steps: ['Choose Edit.', 'Change only the title.', 'Save and reload.'], expected: 'Only the intended value changes; unrelated values remain unchanged and one grouped edit audit is visible.' },
  { id: 'UAT-BUG-009', title: 'Browser back and forward do not corrupt a draft', kind: 'RECOVERY', precondition: 'An edit draft is open.', steps: ['Change a noncritical field.', 'Use browser Back then Forward.', 'Return to the Bug.'], expected: 'The app recovers safely without blank page, cross-Bug draft leakage, or hidden save.' }
])

simple('Classification', 'Classify a Bug', 'TESTER', 'NhanT', trace.classification, [
  { id: 'UAT-CLS-001', title: 'Value helps return active classification values', precondition: 'New or edit draft is open.', steps: ['Open Application Component value help.', 'Open Defect Category value help.'], expected: 'Only active selectable values are shown and no invalid-segment warning appears.' },
  { id: 'UAT-CLS-002', title: 'Valid component and category derive the internal mapping', kind: 'PERSISTENCE', precondition: 'A known valid pair exists.', steps: ['Choose the valid pair.', 'Wait for draft update.', 'Open Assignment.'], expected: 'The mapping is derived by the backend and assignment candidates can be loaded.' },
  { id: 'UAT-CLS-003', title: 'Inactive code-list value is rejected', kind: 'NEGATIVE', precondition: 'An inactive classification value is available through a controlled direct request.', steps: ['Submit the inactive value.', 'Observe the response and reload.'], expected: 'The request is rejected safely and stored classification remains unchanged.' },
  { id: 'UAT-CLS-004', title: 'Classification remains unchanged after unrelated edit', kind: 'PERSISTENCE', precondition: 'Active Bug has valid classification.', steps: ['Edit only Description.', 'Save and reload.'], expected: 'All classification fields remain unchanged.' }
])

simple('Assignment', 'Assign or reassign Developer', 'PM', 'DonHV', trace.assignment, [
  { id: 'UAT-ASG-001', title: 'Assignable Developer list matches classification', precondition: 'Bug has a valid derived component category.', steps: ['Open Assignee value help.', 'Inspect candidate capability and availability.'], expected: 'Matching Developers are shown with capability, workload, availability, and safe advisory explanation.' },
  { id: 'UAT-ASG-002', title: 'Missing classification blocks assignment clearly', kind: 'NEGATIVE', precondition: 'Draft lacks Application Component or Defect Category.', steps: ['Open Assignee value help.'], expected: 'A precise business message requests the missing classification and no assignment occurs.' },
  { id: 'UAT-ASG-003', title: 'Invalid classification mapping blocks assignment clearly', kind: 'NEGATIVE', precondition: 'Draft contains a pair with no active mapping.', steps: ['Open Assignee value help.'], expected: 'A precise invalid-pair message appears; no generic load error or assignment occurs.' },
  { id: 'UAT-ASG-004', title: 'Assign an available responsible Developer', kind: 'PERSISTENCE', precondition: 'Bug is Pending Assignment and a matching available Developer exists.', steps: ['Choose the Developer.', 'Confirm Assign.', 'Reload the Bug.'], expected: 'Assignee, status, next processor, history, and notification reflect the confirmed assignment.' },
  { id: 'UAT-ASG-005', title: 'Unavailable Developer cannot be assigned', kind: 'NEGATIVE', precondition: 'Candidate is marked unavailable.', steps: ['Select the unavailable candidate.', 'Attempt Assign.'], expected: 'Backend blocks assignment; Bug state and history remain unchanged.' },
  { id: 'UAT-ASG-006', title: 'Unsuitable Developer cannot be assigned', kind: 'NEGATIVE', precondition: 'Candidate lacks responsibility for the Bug classification.', steps: ['Attempt direct assignment to the unsuitable Developer.'], expected: 'HTTP 400 is handled safely; assignee and workflow remain unchanged.' },
  { id: 'UAT-ASG-007', title: 'Reassign to another valid Developer', kind: 'PERSISTENCE', precondition: 'Bug is assigned and another matching available Developer exists.', steps: ['Edit the assignee.', 'Choose the new Developer.', 'Save and reload.'], expected: 'Assignee and next processor change to the new Developer and the audit records the reassignment.' },
  { id: 'UAT-ASG-008', title: 'Developer cannot reassign through a forbidden direct request', kind: 'AUTHORIZATION', actor: 'DEVELOPER', owner: 'SangVN', precondition: 'Developer is signed in.', steps: ['Attempt to change assignee through the protected request.'], expected: 'HTTP 403 is returned and assignment state does not change.' }
])

const lifecycleRows = [
  ['UAT-LIFE-001', 'Move assigned Bug to Pending Assignment', 'moveToPendingAssignment', 'Assigned', 'Pending Assignment', 'PM'],
  ['UAT-LIFE-002', 'Mark assigned Bug In Review', 'markInReview', 'Assigned', 'In Review', 'Tester'],
  ['UAT-LIFE-003', 'Request more information', 'requestMoreInformation', 'In Review', 'Need More Information', 'Tester'],
  ['UAT-LIFE-004', 'Resubmit Bug to Developer', 'resubmitToDeveloper', 'Need More Information', 'Assigned', 'Developer'],
  ['UAT-LIFE-005', 'Reject Bug with reason', 'rejectBug', 'In Review', 'Rejected', 'Tester'],
  ['UAT-LIFE-006', 'Start work on assigned Bug', 'startProgress', 'Assigned', 'In Progress', 'Developer'],
  ['UAT-LIFE-007', 'Resolve Bug in progress', 'resolveBug', 'In Progress', 'Resolved', 'Tester'],
  ['UAT-LIFE-008', 'Send resolved Bug to retest', 'sendToRetest', 'Resolved', 'Retest Required', 'Tester'],
  ['UAT-LIFE-009', 'Close Bug after retest', 'closeBug', 'Retest Required', 'Closed', 'PM'],
  ['UAT-LIFE-010', 'Reopen Bug for further work', 'reopenBug', 'Closed', 'Reopened', 'Developer']
]
for (const [id, title, action, from, to, nextRole] of lifecycleRows) add({ id, domain: 'Lifecycle', journey: 'Progress Bug status', actor: ['startProgress', 'resolveBug'].includes(action) ? 'DEVELOPER' : 'TESTER/PM', owner: action === 'startProgress' ? 'SangVN' : action === 'resolveBug' ? 'DatDT' : 'NhanT', kind: 'PERSISTENCE', precondition: `Controlled Bug is in ${from} and the actor is authorized.`, steps: [`Choose ${action}.`, 'Enter a reason when requested.', 'Confirm the action.', 'Reload the Bug.'], expected: `Status becomes ${to}; next processor role becomes ${nextRole}; exact action history and intended notification persist.`, source: trace.lifecycle })
simple('Lifecycle', 'Progress Bug status', 'DEVELOPER', 'DatDT', trace.lifecycle, [
  { id: 'UAT-LIFE-011', title: 'Invalid lifecycle transition is rejected', kind: 'NEGATIVE', precondition: 'Bug status does not allow the selected action.', steps: ['Attempt the invalid action through the protected request.', 'Reload the Bug.'], expected: 'HTTP 400 is handled safely; status, assignee, next processor, and history remain unchanged.' },
  { id: 'UAT-LIFE-012', title: 'Unauthorized lifecycle action is rejected', kind: 'AUTHORIZATION', precondition: 'Signed-in Developer does not own the Bug or action.', steps: ['Attempt the protected lifecycle action.', 'Reload the Bug.'], expected: 'HTTP 403 is returned and no workflow side effect is persisted.' },
  { id: 'UAT-LIFE-013', title: 'Repeated lifecycle action is idempotently rejected', kind: 'BOUNDARY', precondition: 'A lifecycle action has just completed.', steps: ['Submit the same action again.', 'Reload the Bug.'], expected: 'The second request is rejected safely and does not duplicate history or notification.' }
])

simple('Comments', 'Collaborate on a Bug', 'TESTER', 'NhanT', trace.collaboration, [
  { id: 'UAT-COM-001', title: 'Post a valid comment', kind: 'PERSISTENCE', precondition: 'Active Bug is open.', steps: ['Enter a clear comment.', 'Choose Post Comment.', 'Reload the Bug.'], expected: 'The sanitized comment, actor, role, and timestamp persist once.' },
  { id: 'UAT-COM-002', title: 'Empty comment is rejected', kind: 'NEGATIVE', precondition: 'Active Bug is open.', steps: ['Leave comment empty.', 'Choose Post Comment.'], expected: 'No comment is stored and a safe validation message is shown.' },
  { id: 'UAT-COM-003', title: 'Oversized comment is rejected', kind: 'BOUNDARY', precondition: 'Active Bug is open.', steps: ['Enter text beyond the supported limit.', 'Choose Post Comment.'], expected: 'The request is rejected safely and no truncated or partial comment is stored.' },
  { id: 'UAT-COM-004', title: 'Comment text is displayed as data, not executable markup', kind: 'SECURITY', precondition: 'Active Bug is open.', steps: ['Post controlled markup-like text.', 'Reload and inspect it.'], expected: 'The text is rendered safely and no script or HTML is executed.' }
])

simple('Attachments', 'Manage Bug evidence', 'TESTER', 'NhanT', trace.collaboration, [
  { id: 'UAT-ATT-001', title: 'Upload a supported attachment', kind: 'INTEGRATION', precondition: 'Active Bug is open and S3 is available.', steps: ['Choose Upload Evidence.', 'Select a supported file.', 'Wait for completion.', 'Reload.'], expected: 'Metadata persists in HANA, binary persists in S3, and the same attachment appears after reload.' },
  { id: 'UAT-ATT-002', title: 'Download preserves attachment bytes', kind: 'INTEGRATION', precondition: 'A controlled attachment exists.', steps: ['Download the attachment.', 'Compare its SHA-256 with the original.'], expected: 'Downloaded bytes match the original hash and filename/content type are safe.' },
  { id: 'UAT-ATT-003', title: 'Delete removes attachment access', kind: 'INTEGRATION', precondition: 'A controlled attachment exists.', steps: ['Delete the attachment.', 'Confirm.', 'Reload and attempt the old download.'], expected: 'UI entry, HANA metadata, and S3 object access are removed according to the supported delete contract.' },
  { id: 'UAT-ATT-004', title: 'Unsupported file type is rejected', kind: 'NEGATIVE', precondition: 'Active Bug is open.', steps: ['Select an unsupported file type.'], expected: 'Upload is blocked with a safe message and no metadata or object is created.' },
  { id: 'UAT-ATT-005', title: 'Oversized file is rejected', kind: 'BOUNDARY', precondition: 'Active Bug is open.', steps: ['Select a file larger than the allowed limit.'], expected: 'Upload is blocked before unsafe persistence and the Bug remains usable.' },
  { id: 'UAT-ATT-006', title: 'S3 failure does not create broken attachment metadata', kind: 'RECOVERY', precondition: 'Controlled test makes storage unavailable.', steps: ['Attempt upload.', 'Reload the Bug.'], expected: 'A safe error is shown and no downloadable orphan metadata is presented.' }
])

simple('Audit and notification', 'Verify side effects', 'PM', 'DonHV', trace.history.concat(trace.email), [
  { id: 'UAT-AUD-001', title: 'History shows exact action, actor and changes', kind: 'PERSISTENCE', precondition: 'A controlled lifecycle action has completed.', steps: ['Open History.', 'Expand the newest event.'], expected: 'Exact action type, actor, timestamp, summary, and changed fields match the performed action.' },
  { id: 'UAT-AUD-002', title: 'Failed workflow transaction leaves no partial history', kind: 'RECOVERY', precondition: 'Controlled invalid action is ready.', steps: ['Submit the invalid action.', 'Reload Bug and History.'], expected: 'Neither Bug state nor partial HistoryEvent/HistoryLog is persisted.' },
  { id: 'UAT-NOT-001', title: 'In-app notification reaches the intended processor', kind: 'PERSISTENCE', precondition: 'An action that notifies the next processor is ready.', steps: ['Perform the action.', 'Sign in as the intended recipient.', 'Open Notifications.'], expected: 'One safe notification with the correct Bug link and read state is visible only to the intended recipient.' },
  { id: 'UAT-NOT-002', title: 'Reading a notification persists after reload', kind: 'PERSISTENCE', precondition: 'Unread notification exists.', steps: ['Open or mark it read.', 'Reload Notifications.'], expected: 'Read state remains persisted and the unread counter is correct.' },
  { id: 'UAT-EMAIL-001', title: 'Email outbox delivery reaches SENT', kind: 'INTEGRATION', precondition: 'Brevo and Job Scheduler are available and an email-producing action is ready.', steps: ['Perform the action.', 'Wait for the worker.', 'Inspect sanitized delivery evidence and recipient inbox/spam.'], expected: 'Delivery progresses PENDING to SENT once; no secret or raw provider diagnostic is exposed.' },
  { id: 'UAT-EMAIL-002', title: 'Temporary email failure retries without rolling back Bug workflow', kind: 'RECOVERY', precondition: 'Controlled provider failure is available.', steps: ['Perform the workflow action.', 'Observe delivery retry state.', 'Reload the Bug.'], expected: 'Bug workflow remains committed; delivery records a bounded retry/failure state without duplicate business history.' }
])

simple('Monitoring', 'PM monitors work', 'PM', 'DonHV', trace.monitoring, [
  { id: 'UAT-MON-001', title: 'PM Dashboard shows role-scoped workload', precondition: 'PM is signed in and controlled Bugs exist.', steps: ['Open Dashboard.', 'Compare workload counts with the controlled data.'], expected: 'Counts and Developer workload reflect the current persisted state.' },
  { id: 'UAT-MON-002', title: 'Pending Assignment queue filters correctly', precondition: 'Pending and non-pending Bugs exist.', steps: ['Open Pending Assignment tab.'], expected: 'Only Bugs awaiting assignment are shown.' },
  { id: 'UAT-MON-003', title: 'Overdue queue uses due date correctly', kind: 'BOUNDARY', precondition: 'Past, today, future, and empty due dates exist.', steps: ['Open Overdue tab.', 'Compare the four boundary records.'], expected: 'Only genuinely overdue unresolved Bugs appear.' },
  { id: 'UAT-MON-004', title: 'Rejected follow-up and retest queues remain distinct', precondition: 'Rejected and Retest Required Bugs exist.', steps: ['Open each queue tab.'], expected: 'Each queue contains only its intended workflow state.' },
  { id: 'UAT-MON-005', title: 'Developer cannot access PM-only operational metrics', kind: 'AUTHORIZATION', actor: 'DEVELOPER', owner: 'DatDT', precondition: 'Developer is signed in.', steps: ['Attempt the PM metrics function directly.'], expected: 'HTTP 403 is returned and no operational metrics are disclosed.' }
])

simple('AI advisory', 'Review AI assistance', 'TESTER', 'NhanT', trace.ai, [
  { id: 'UAT-AI-001', title: 'Similar Bugs returns reviewable candidates or safe no-result', precondition: 'Active Bug has sufficient summary data.', steps: ['Choose Find Similar Bugs.', 'Inspect candidates and reasons.'], expected: 'The dialog shows grounded candidates with safe reasons, or a clear no-result state; it does not mutate the Bug.' , source: trace.similar },
  { id: 'UAT-AI-002', title: 'Confirm an accepted duplicate candidate', kind: 'PERSISTENCE', precondition: 'Accepted Similar Bugs suggestion and selected valid candidate exist.', steps: ['Choose Confirm Duplicate.', 'Confirm.', 'Reload.'], expected: 'One DuplicateLink persists; status, assignee, next processor, and lifecycle history do not change.', source: trace.similar },
  { id: 'UAT-AI-003', title: 'Developer cannot confirm duplicate', kind: 'AUTHORIZATION', actor: 'DEVELOPER', owner: 'DatDT', precondition: 'Developer has an accepted suggestion ID.', steps: ['Call confirmDuplicateSuggestion directly.'], expected: 'HTTP 403 is returned and no DuplicateLink is created.', source: trace.similar },
  { id: 'UAT-AI-004', title: 'Classification suggestion is grounded in active catalogs', precondition: 'Active Bug has sufficient classification context.', steps: ['Choose Review Classification Suggestions.', 'Inspect values, confidence, source label, and reason.'], expected: 'AI proposals use active catalog values; rules-based baselines are clearly labelled and no automatic apply occurs.', source: trace.aiClassification },
  { id: 'UAT-AI-005', title: 'Accept classification suggestion then apply it', kind: 'PERSISTENCE', precondition: 'Tester has a pending valid classification suggestion.', steps: ['Accept the suggestion.', 'Choose Apply Classification.', 'Confirm and reload.'], expected: 'Only allowlisted classification fields update; workflow ownership and lifecycle remain unchanged.', source: trace.aiClassification },
  { id: 'UAT-AI-006', title: 'Developer cannot apply classification', kind: 'AUTHORIZATION', actor: 'DEVELOPER', owner: 'DatDT', precondition: 'Developer has an accepted suggestion ID.', steps: ['Call applyClassificationSuggestion directly.'], expected: 'HTTP 403 is returned and Bug classification does not change.', source: trace.aiClassification },
  { id: 'UAT-AI-007', title: 'Handoff Summary is grounded in Bug comments and history', precondition: 'Active Bug has comments and lifecycle history.', steps: ['Choose Review Handoff Summary.', 'Compare overview, comments, events, missing data, and next action with stored records.'], expected: 'The advisory summary is concise and grounded; no invented comment/event or workflow mutation occurs.', source: trace.handoff },
  { id: 'UAT-AI-008', title: 'Handoff Summary handles sparse Bug data', kind: 'BOUNDARY', precondition: 'Active Bug intentionally lacks comments or history.', steps: ['Open Handoff Summary.'], expected: 'Missing information is stated explicitly and no content is invented.', source: trace.handoff },
  { id: 'UAT-AI-009', title: 'Smart Assign explanation supports manual choice only', precondition: 'Active Bug has valid classification and matching Developers.', steps: ['Open Smart Assign.', 'Inspect candidate capability, availability, workload, confidence, and explanation.', 'Cancel.'], expected: 'Explanations are grounded in candidate data and cancelling causes no assignment/history/notification mutation.', source: trace.assignment },
  { id: 'UAT-AI-010', title: 'AI review decision survives reload', kind: 'PERSISTENCE', precondition: 'A pending AI suggestion exists.', steps: ['Accept, Reject, or Ignore the suggestion.', 'Reload and reopen the dialog.'], expected: 'Review state, reviewer, and timestamp persist; the same decision cannot be applied twice.' },
  { id: 'UAT-AI-011', title: 'Rate-limited provider uses safe local fallback', kind: 'RECOVERY', precondition: 'Controlled provider rate limit or active cooldown is available.', steps: ['Open one AI feature.', 'Observe result and Network.', 'Avoid repeated retry.'], expected: 'Safe local output is identified clearly, no raw 429/provider diagnostic appears, and no unintended mutation occurs.' },
  { id: 'UAT-AI-012', title: 'Prompt-injection text is treated as Bug data', kind: 'SECURITY', precondition: 'Controlled Bug text contains an instruction-like phrase.', steps: ['Run each affected advisory flow.', 'Inspect output and side effects.'], expected: 'The phrase does not override system constraints, expose secrets, or trigger an action.' },
  { id: 'UAT-AI-013', title: 'PM reads sanitized AI operational metrics', actor: 'PM', owner: 'DonHV', precondition: 'PM is signed in and AI audit rows exist.', steps: ['Open AI Activity.', 'Compare aggregate counts with sanitized readback.'], expected: 'Metrics show capability-level counts and latency without prompt, response, raw error, endpoint, key, or private identity.', source: trace.metrics }
])

// Additional atomic role, boundary, and review branches found by the independent
// completeness audit. They remain separate so one PASS cannot conceal another failure.
simple('Role coverage', 'Cross-role business acceptance', 'PM', 'DonHV', trace.auth, [
  { id: 'UAT-ROLE-001', title: 'PM signs in and sees PM actions', precondition: 'Active PM SAP identity is mapped to one IDTS PM.', steps: ['Open AppRouter and sign in.', 'Open List Report and Dashboard.'], expected: 'PM-only monitoring and permitted business actions are visible without Developer-only ownership behavior.' },
  { id: 'UAT-ROLE-002', title: 'Developer signs in and sees owned work only', actor: 'DEVELOPER', owner: 'SangVN', precondition: 'Active Developer SAP identity is mapped to one IDTS Developer.', steps: ['Open AppRouter and sign in.', 'Open assigned and unassigned Bugs.'], expected: 'Developer can work only within backend ownership/role rules; hidden UI does not replace backend authorization.' }
])

simple('Bug creation', 'Create and save Bug', 'PM', 'DonHV', trace.draft, [
  { id: 'UAT-BUG-010', title: 'PM creates a valid Bug', kind: 'PERSISTENCE', precondition: 'PM is signed in and active code-list values exist.', steps: ['Choose Create Bug.', 'Enter required values.', 'Save and reload.'], expected: 'One active Bug is created with PM as authenticated reporter and server-derived workflow state.' },
  { id: 'UAT-BUG-011', title: 'Developer cannot create a new Bug', kind: 'AUTHORIZATION', actor: 'DEVELOPER', owner: 'DatDT', precondition: 'Developer is signed in.', steps: ['Attempt the NEW draft request.'], expected: 'HTTP 403 is returned and no draft or active Bug is created.' }
])

simple('Assignment', 'Assign or reassign Developer', 'PM', 'DonHV', trace.assignment, [
  { id: 'UAT-ASG-009', title: 'No matching Developer produces an explicit empty state', kind: 'BOUNDARY', precondition: 'Bug classification has no active matching Developer responsibility.', steps: ['Open Assignee value help.'], expected: 'An explicit no-candidate state is shown; no arbitrary Developer is selected and the Bug remains unassigned.' }
])

simple('Lifecycle', 'Progress Bug status', 'TESTER', 'NhanT', trace.lifecycle, [
  { id: 'UAT-LIFE-014', title: 'Required lifecycle reason prevents submission when empty', kind: 'NEGATIVE', precondition: 'A reason-required lifecycle action is available.', steps: ['Open the action.', 'Leave Reason empty.', 'Confirm.'], expected: 'The action is blocked with a field-targeted message and no status/history/notification change occurs.' },
  { id: 'UAT-LIFE-015', title: 'Rejected Bug correction can return to the intended processor', kind: 'PERSISTENCE', precondition: 'Rejected Bug contains the required correction information.', steps: ['Perform the supported correction/follow-up action.', 'Reload the Bug.'], expected: 'The documented follow-up state and next processor persist with one exact audit event.' }
])

simple('Attachments', 'Manage Bug evidence', 'DEVELOPER', 'DatDT', trace.collaboration, [
  { id: 'UAT-ATT-007', title: 'Unauthorized attachment deletion is rejected', kind: 'AUTHORIZATION', owner: 'SangVN', precondition: 'Attachment exists and Developer lacks delete permission for the context.', steps: ['Attempt the protected delete request.', 'Reload the Bug.'], expected: 'HTTP 403 is returned and both metadata and binary remain accessible to authorized users.' }
])

simple('Audit and notification', 'Inspect audit history', 'TESTER', 'NhanT', trace.history, [
  { id: 'UAT-AUD-003', title: 'History show-more loads older events in order', kind: 'PERSISTENCE', precondition: 'Bug has more history events than the initial display limit.', steps: ['Open History.', 'Choose Show More.', 'Compare ordering and event count.'], expected: 'Older events load once in chronological presentation order without duplicates or missing change details.' }
])

simple('AI advisory', 'Review AI assistance', 'TESTER', 'NhanT', trace.ai, [
  { id: 'UAT-AI-014', title: 'Reject AI suggestion persists without business mutation', kind: 'PERSISTENCE', precondition: 'Pending AI suggestion exists.', steps: ['Choose Reject.', 'Confirm and reload.'], expected: 'Review state becomes REJECTED once; Bug fields, workflow, duplicate links, history, and notifications remain unchanged.' },
  { id: 'UAT-AI-015', title: 'Ignore AI suggestion persists without business mutation', kind: 'PERSISTENCE', precondition: 'Pending AI suggestion exists.', steps: ['Choose Ignore.', 'Confirm and reload.'], expected: 'Review state becomes IGNORED once; Bug fields, workflow, duplicate links, history, and notifications remain unchanged.' },
  { id: 'UAT-AI-016', title: 'Stale accepted classification cannot overwrite newer Bug data', kind: 'NEGATIVE', precondition: 'An accepted suggestion exists and source classification has since changed.', steps: ['Attempt Apply Classification.', 'Reload the Bug.'], expected: 'The stale apply is rejected safely and the newer classification remains unchanged.', source: trace.aiClassification }
])

simple('Usability', 'Cross-cutting browser behavior', 'TESTER', 'NhanT', trace.draft, [
  { id: 'UAT-UX-001', title: 'Desktop layout remains readable at 100 percent zoom', precondition: 'List Report and Object Page are available.', steps: ['Review major screens and dialogs at 100% zoom.'], expected: 'No clipping, horizontal overflow, vertical word breaking, or unreachable action is present.' },
  { id: 'UAT-UX-002', title: 'Tablet layout keeps primary actions usable', precondition: 'Supported tablet viewport is available.', steps: ['Open List Report, Object Page, and AI dialogs.', 'Navigate all primary actions.'], expected: 'Responsive pop-ins/wrapping preserve labels, values, and actions.' },
  { id: 'UAT-UX-003', title: 'Keyboard and focus order support core flows', kind: 'BOUNDARY', precondition: 'Desktop browser is open.', steps: ['Use keyboard navigation through create, comment, and one dialog.', 'Close the dialog.'], expected: 'Focus order is logical, visible, and returns to the triggering control.' },
  { id: 'UAT-UX-004', title: 'Unexpected backend error is sanitized', kind: 'RECOVERY', precondition: 'Controlled safe server failure is available.', steps: ['Trigger the failure.', 'Inspect UI, Console, and Network status.'], expected: 'The UI shows a safe actionable message without SQL, stack trace, provider body, token, or private endpoint.' },
  { id: 'UAT-UX-005', title: 'Reload does not lose committed business state', kind: 'PERSISTENCE', precondition: 'A controlled action has just succeeded.', steps: ['Reload the page.', 'Reopen the affected section.'], expected: 'Committed state and audit remain present and no action is duplicated.' }
])

function validate () {
  const errors = []
  const ids = new Set()
  for (const testCase of cases) {
    if (ids.has(testCase.caseId)) errors.push(`duplicate caseId: ${testCase.caseId}`)
    ids.add(testCase.caseId)
    if (testCase.language !== 'EN') errors.push(`${testCase.caseId}: language must be EN`)
    if (testCase.execution.status !== 'PREPARED' || testCase.execution.actualResult) errors.push(`${testCase.caseId}: execution truth is not PREPARED`)
    if (!testCase.evidenceRequirements.some(item => /screenshot|image/i.test(item))) errors.push(`${testCase.caseId}: case-specific image missing`)
    if (!testCase.steps?.length || !testCase.expectedResult) errors.push(`${testCase.caseId}: incomplete action/expected result`)
    for (const item of testCase.sourceTrace) {
      if (!fs.existsSync(path.join(ROOT, item.file))) errors.push(`${testCase.caseId}: missing source ${item.file}`)
    }
    const serialized = JSON.stringify(testCase)
    if (/E:\\|<commit|<deploy|password|api[_ -]?key/i.test(serialized)) errors.push(`${testCase.caseId}: forbidden placeholder/private evidence text`)
  }
  if (errors.length) throw new Error(`IDTS-111 catalog validation failed:\n- ${errors.join('\n- ')}`)
}

validate()

const result = {
  schemaVersion: 1,
  catalog: 'IDTS-111 SAP490 UAT EN v0.3 candidate',
  baselineSha: BASELINE_SHA,
  generatedAt: '2026-08-02',
  owner: 'DonHV',
  approvalStatus: 'APPROVED_FOR_EXECUTION',
  executionTruth: { prepared: cases.length, executed: 0, passed: 0, failed: 0, blocked: 0 },
  policy: {
    enOnly: true,
    workbookGeneratedAfterExecution: true,
    perCaseImageRequired: true,
    agentCannotApproveOrExecuteForMember: true,
    mentorSignoff: 'PENDING'
  },
  cases
}

const json = `${JSON.stringify(result, null, 2)}\n`
if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8') : ''
  if (current !== json) {
    console.error(`OUTDATED: ${path.relative(ROOT, OUTPUT)}`)
    process.exit(1)
  }
  console.log(`PASS: ${cases.length} PREPARED UAT cases; source trace, EN-only and evidence policy valid.`)
} else {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  fs.writeFileSync(OUTPUT, json)
  console.log(`WROTE: ${path.relative(ROOT, OUTPUT)} (${cases.length} PREPARED cases, 0 executed)`)
}
