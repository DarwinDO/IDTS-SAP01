/*
 * IDTS-110 candidate catalog generator.
 *
 * This file deliberately generates planning truth only. It never imports prior
 * PASS results: every row starts as NOT_RUN until NhanT executes it and DonHV
 * reviews case-specific evidence.
 */
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')
const OUTPUT = path.join(ROOT, 'docs', 'qa', 'idts-110-unit-test-catalog.json')
const BASELINE_SHA = 'bc0c47e522ae208384d4b23dda21535dcc683683'

const cases = []

const source = {
  auth: [{ file: 'srv/auth.js', symbol: 'login' }, { file: 'srv/auth.js', symbol: 'me' }],
  platformAuth: [{ file: 'srv/auth/platform-role.js', symbol: 'enforcePlatformRoleAlignment' }, { file: 'srv/auth.js', symbol: 'btpUserProfile' }],
  draft: [{ file: 'srv/bug-service/drafts.js', symbol: 'prepareDraftNew' }, { file: 'srv/bug-service/drafts.js', symbol: 'handleDraftSave' }],
  write: [{ file: 'srv/bug-service/bug-write.js', symbol: 'prepareBugWrite' }, { file: 'srv/bug-service/bug-write.js', symbol: 'validateRequiredBugFields' }],
  classification: [{ file: 'srv/bug-service/bug-write.js', symbol: 'deriveOrValidateComponentCategory' }, { file: 'srv/bug-service/bug-write.js', symbol: 'validateActiveCodeLists' }],
  assignment: [{ file: 'srv/bug-service/actions.js', symbol: 'assignToDeveloper' }, { file: 'srv/bug-service/bug-write.js', symbol: 'validateAssignee' }],
  assignmentRead: [{ file: 'srv/bug-service/read-models.js', symbol: 'buildAssignableDeveloperRows' }, { file: 'srv/bug-service/monitoring.js', symbol: 'buildDeveloperWorkloadRows' }],
  lifecycle: [{ file: 'srv/bug-service/actions.js', symbol: 'transitionBug' }, { file: 'srv/bug-service/bug-write.js', symbol: 'validateTransition' }],
  permissions: [{ file: 'srv/bug-service/permissions.js', symbol: 'enforceActionPermission' }, { file: 'srv/bug-service/permissions.js', symbol: 'enforceBugWritePermission' }],
  comments: [{ file: 'srv/bug-service/content.js', symbol: 'prepareCommentCreate' }, { file: 'srv/bug-service/actions.js', symbol: 'addComment' }],
  attachmentBackend: [{ file: 'srv/bug-service/content.js', symbol: 'prepareAttachmentWrite' }],
  attachmentUi: [{ file: 'app/bug-management-ui/webapp/ext/sections/BugCollaboration.js', symbol: 'MAX_ATTACHMENT_BYTES' }],
  attachmentStorage: [{ file: 'db/schema.cds', symbol: 'BugAttachments' }, { file: 'package.json', symbol: '@cap-js/attachments' }],
  history: [{ file: 'srv/bug-service/history.js', symbol: 'writeHistoryEvent' }, { file: 'srv/bug-service/history.js', symbol: 'recordBugChangeSideEffects' }],
  email: [{ file: 'srv/email/outbox.js', symbol: 'processEmailDeliveries' }, { file: 'srv/email/worker.js', symbol: 'processEmailOutboxBatch' }],
  monitoring: [{ file: 'srv/bug-service/monitoring.js', symbol: 'buildDeveloperWorkloadRows' }, { file: 'srv/bug-service/monitoring.js', symbol: 'isOverdueBug' }],
  aiProvider: [{ file: 'srv/ai/provider.js', symbol: 'SafeAiProvider' }, { file: 'srv/ai/safety.js', symbol: 'redactSensitiveText' }],
  similar: [{ file: 'srv/ai/duplicate-detection.js', symbol: 'suggestSimilarBugs' }, { file: 'srv/ai/duplicate-confirmation.js', symbol: 'confirmDuplicateSuggestion' }],
  aiClassification: [{ file: 'srv/ai/classification-suggestion.js', symbol: 'suggestClassification' }, { file: 'srv/ai/classification-apply.js', symbol: 'applyClassificationSuggestion' }],
  handoff: [{ file: 'srv/ai/bug-summary.js', symbol: 'summarizeBugHandoff' }],
  smartAssign: [{ file: 'srv/ai/assignment-explanation.js', symbol: 'explainSmartAssignment' }],
  aiReview: [{ file: 'srv/ai/review.js', symbol: 'reviewAiSuggestion' }, { file: 'srv/ai/metrics.js', symbol: 'readAiOperationalMetrics' }],
  guards: [{ file: 'srv/bug-service/guards.js', symbol: 'registerReadOnlyEntityGuards' }, { file: 'srv/ai/safety.js', symbol: 'containsUnsafeDiagnosticText' }]
}

function add ({
  caseId,
  domain,
  title,
  classification,
  priority = 'HIGH',
  testLevel = 'CAP_COMPONENT',
  environment = 'LOCAL',
  requirementIds = [],
  roles = ['N/A'],
  input,
  expectedResult,
  sourceTrace,
  coverage = [],
  evidence = null,
  notes = null
}) {
  const evidenceRequirements = evidence || evidenceFor(testLevel, coverage)
  cases.push({
    caseId,
    domain,
    title,
    objective: `Verify ${title.charAt(0).toLowerCase()}${title.slice(1)}.`,
    classification,
    priority,
    testLevel,
    environment,
    requirementIds,
    roles,
    coverage,
    preconditions: `Use an isolated ${domain.toLowerCase()} fixture at baseline ${BASELINE_SHA.slice(0, 12)}; capture the relevant before-state.`,
    input,
    steps: [
      'Prepare the stated precondition and capture the before-state.',
      `Execute only this branch using: ${input}`,
      'Assert the response, persisted state, side effects, and safe error boundary described below.',
      'Reload or read back state when persistence is part of the case.'
    ],
    expectedResult,
    sourceTrace,
    evidenceRequirements,
    execution: {
      status: 'NOT_RUN',
      executor: null,
      executedAt: null,
      baselineSha: null,
      deploySha: null,
      actualResult: null,
      evidenceIds: []
    },
    limitations: notes
  })
}

function evidenceFor (level, coverage) {
  const result = ['case-specific result image', 'sanitized case manifest']
  if (level === 'ODATA_CONTRACT' || level === 'BTP_INTEGRATION') result.push('sanitized HTTP request/response image')
  if (coverage.includes('PERSISTENCE')) result.push('before/after database image', 'reload/readback image')
  if (level === 'BTP_INTEGRATION') result.push('sanitized platform/provider evidence')
  return result
}

function req (...ids) { return ids }

// Authentication and session boundaries.
add({ caseId: 'UT-AUTH-001', domain: 'Authentication', title: 'valid local login normalizes the email and creates one session', classification: 'POSITIVE', testLevel: 'CAP_COMPONENT', environment: 'LOCAL', requirementIds: req('SRS-FR-AUTH-001'), roles: ['TESTER', 'DEVELOPER', 'PM'], input: 'Call AuthService.login with a valid mixed-case, space-padded email and password.', expectedResult: 'The response returns one transient bearer token and a public active user; the persisted session contains only tokenHash.', sourceTrace: source.auth, coverage: ['POSITIVE', 'PERSISTENCE'] })
add({ caseId: 'UT-AUTH-002', domain: 'Authentication', title: 'missing email is rejected without creating a session', classification: 'NEGATIVE', requirementIds: req('SRS-FR-AUTH-001'), input: 'Call login without email.', expectedResult: 'HTTP 401 returns the generic invalid-credentials message and no AuthSession row is inserted.', sourceTrace: source.auth, coverage: ['NEGATIVE', 'PERSISTENCE'] })
add({ caseId: 'UT-AUTH-003', domain: 'Authentication', title: 'empty password is rejected without creating a session', classification: 'NEGATIVE', requirementIds: req('SRS-FR-AUTH-001'), input: 'Call login with an empty password.', expectedResult: 'HTTP 401 returns the generic invalid-credentials message and no AuthSession row is inserted.', sourceTrace: source.auth, coverage: ['NEGATIVE', 'PERSISTENCE'] })
add({ caseId: 'UT-AUTH-004', domain: 'Authentication', title: 'non-string password is rejected at the CDS type boundary', classification: 'BOUNDARY', testLevel: 'ODATA_CONTRACT', environment: 'LOCAL', requirementIds: req('SRS-FR-AUTH-001'), input: 'Call the AuthService.login OData endpoint with a non-string password value.', expectedResult: 'The malformed request is rejected by safe HTTP 400 validation without type internals or stack trace, and no AuthSession row is inserted. Wrong string credentials remain covered separately by the generic HTTP 401 boundary.', sourceTrace: [{ file: 'srv/auth.cds', symbol: 'login' }, { file: 'srv/auth.js', symbol: 'login' }], coverage: ['BOUNDARY', 'SANITIZATION', 'PERSISTENCE'] })
add({ caseId: 'UT-AUTH-005', domain: 'Authentication', title: 'unknown email and wrong password remain indistinguishable', classification: 'SECURITY', requirementIds: req('SRS-FR-AUTH-001'), input: 'Compare login for an unknown email with login for a known email and wrong password.', expectedResult: 'Both requests return the same safe HTTP 401 boundary and do not reveal account existence.', sourceTrace: source.auth, coverage: ['NEGATIVE', 'SANITIZATION'] })
add({ caseId: 'UT-AUTH-006', domain: 'Authentication', title: 'inactive local user cannot create a session', classification: 'ROLE', requirementIds: req('SRS-FR-AUTH-001'), input: 'Call login for an inactive seeded user.', expectedResult: 'HTTP 401 is returned and no session is persisted.', sourceTrace: source.auth, coverage: ['ROLE', 'PERSISTENCE'] })
add({ caseId: 'UT-AUTH-007', domain: 'Authentication', title: 'valid bearer token resolves the public current user', classification: 'POSITIVE', testLevel: 'ODATA_CONTRACT', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-AUTH-002'), roles: ['TESTER', 'DEVELOPER', 'PM'], input: 'Call AuthService.me with a valid local bearer token.', expectedResult: 'The public profile is returned without passwordHash, tokenHash, or private session data.', sourceTrace: source.auth, coverage: ['POSITIVE', 'SANITIZATION'] })
add({ caseId: 'UT-AUTH-008', domain: 'Authentication', title: 'expired bearer token is rejected', classification: 'NEGATIVE', testLevel: 'ODATA_CONTRACT', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-AUTH-002'), input: 'Call a protected endpoint with an expired session token.', expectedResult: 'HTTP 401 is returned and no protected Bug data is exposed.', sourceTrace: source.auth, coverage: ['NEGATIVE', 'ROLE'] })
add({ caseId: 'UT-AUTH-009', domain: 'Authentication', title: 'revoked bearer token is rejected', classification: 'NEGATIVE', testLevel: 'ODATA_CONTRACT', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-AUTH-002'), input: 'Call a protected endpoint with a revoked session token.', expectedResult: 'HTTP 401 is returned and the revoked session remains revoked.', sourceTrace: source.auth, coverage: ['NEGATIVE', 'PERSISTENCE'] })
add({ caseId: 'UT-AUTH-010', domain: 'Authentication', title: 'logout revokes the current session exactly once', classification: 'POSITIVE', testLevel: 'CAP_COMPONENT', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-AUTH-002'), input: 'Logout with a valid token and then reuse the same token.', expectedResult: 'Logout succeeds, the session is revoked, and subsequent use returns HTTP 401.', sourceTrace: [{ file: 'srv/auth.js', symbol: 'logout' }], coverage: ['POSITIVE', 'PERSISTENCE'] })
add({ caseId: 'UT-AUTH-011', domain: 'Authentication', title: 'custom login is disabled in XSUAA runtime', classification: 'ROLE', testLevel: 'BTP_INTEGRATION', environment: 'BTP_REQUIRED', requirementIds: req('SRS-FR-AUTH-001'), input: 'Call AuthService.login through AppRouter while XSUAA mode is active.', expectedResult: 'HTTP 405 directs the user to SAP BTP authentication and no local session is created.', sourceTrace: source.platformAuth, coverage: ['ROLE', 'PERSISTENCE'] })
add({ caseId: 'UT-AUTH-012', domain: 'Authentication', title: 'mapped XSUAA identity resolves one active IDTS user', classification: 'POSITIVE', testLevel: 'BTP_INTEGRATION', environment: 'BTP_REQUIRED', requirementIds: req('SRS-FR-AUTH-002'), roles: ['TESTER', 'DEVELOPER', 'PM'], input: 'Sign in through AppRouter with an identity mapped to one active IDTS user and one allowed role.', expectedResult: 'The mapped public profile and protected OData access are returned for the same role.', sourceTrace: source.platformAuth, coverage: ['POSITIVE', 'ROLE', 'PERSISTENCE'] })
for (const [id, title, input] of [
  ['013', 'unmapped XSUAA identity is denied safely', 'Sign in with a valid SAP identity that has no active IDTS mapping.'],
  ['014', 'XSUAA identity with multiple application roles is denied', 'Sign in with more than one IDTS application role.'],
  ['015', 'XSUAA role mismatch with the IDTS user is denied', 'Sign in when the platform role differs from the mapped IDTS role.']
]) add({ caseId: `UT-AUTH-${id}`, domain: 'Authentication', title, classification: 'ROLE', testLevel: 'BTP_INTEGRATION', environment: 'BTP_REQUIRED', requirementIds: req('SRS-FR-AUTH-002'), input, expectedResult: 'HTTP 403 is returned without identity internals, HANA diagnostics, or business mutation.', sourceTrace: source.platformAuth, coverage: ['ROLE', 'SANITIZATION'] })

// Draft, create, update, and required-field validation.
add({ caseId: 'UT-BUG-001', domain: 'Bug write', title: 'Tester creates a NEW draft with server-owned reporter', classification: 'POSITIVE', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-BUG-001'), roles: ['TESTER'], input: 'Create a NEW Bugs draft as Tester.', expectedResult: 'A draft is created and reporter_ID is derived from the authenticated Tester.', sourceTrace: source.draft, coverage: ['POSITIVE', 'ROLE', 'PERSISTENCE'] })
add({ caseId: 'UT-BUG-002', domain: 'Bug write', title: 'PM creates a NEW draft with server-owned reporter', classification: 'POSITIVE', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-BUG-001'), roles: ['PM'], input: 'Create a NEW Bugs draft as PM.', expectedResult: 'A draft is created and reporter_ID is derived from the authenticated PM.', sourceTrace: source.draft, coverage: ['POSITIVE', 'ROLE', 'PERSISTENCE'] })
add({ caseId: 'UT-BUG-003', domain: 'Bug write', title: 'Developer cannot create a NEW draft', classification: 'ROLE', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-BUG-001'), roles: ['DEVELOPER'], input: 'Create a NEW Bugs draft as Developer.', expectedResult: 'HTTP 403 is returned and no draft or active Bug is created.', sourceTrace: source.draft.concat(source.permissions), coverage: ['ROLE', 'PERSISTENCE'] })
add({ caseId: 'UT-BUG-004', domain: 'Bug write', title: 'PATCH preserves fields not included in a partial draft update', classification: 'POSITIVE', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-BUG-001'), input: 'PATCH only title on an existing draft.', expectedResult: 'The new title is merged with the old draft and unrelated fields remain unchanged.', sourceTrace: [{ file: 'srv/bug-service/drafts.js', symbol: 'prepareDraftPatch' }], coverage: ['POSITIVE', 'PERSISTENCE'] })
add({ caseId: 'UT-BUG-005', domain: 'Bug write', title: 'saving an unassigned draft creates Pending Assignment', classification: 'POSITIVE', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-BUG-001', 'SRS-FR-ASSIGN-003'), input: 'SAVE a complete draft with assignee_ID null.', expectedResult: 'The active Bug is PENDING_ASSIGNMENT, assignee remains null, and PM is the next processor.', sourceTrace: source.draft.concat(source.write), coverage: ['POSITIVE', 'PERSISTENCE'] })
add({ caseId: 'UT-BUG-006', domain: 'Bug write', title: 'saving a draft with a valid assignee creates Assigned', classification: 'POSITIVE', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-BUG-001', 'SRS-FR-ASSIGN-001'), input: 'SAVE a complete draft with a valid available responsible assignee.', expectedResult: 'The active Bug is ASSIGNED and the assigned Developer is the next processor.', sourceTrace: source.draft.concat(source.assignment), coverage: ['POSITIVE', 'PERSISTENCE'] })
add({ caseId: 'UT-BUG-007', domain: 'Bug write', title: 'direct CREATE replaces forged bug number and reporter', classification: 'SECURITY', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-BUG-001'), input: 'CREATE an active Bug while supplying client-owned bugNumber and reporter_ID values.', expectedResult: 'Server-generated bugNumber and authenticated reporter values replace the forged input.', sourceTrace: source.write, coverage: ['SANITIZATION', 'PERSISTENCE'] })
add({ caseId: 'UT-BUG-008', domain: 'Bug write', title: 'authorized partial UPDATE persists one grouped edit event', classification: 'POSITIVE', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-BUG-001', 'SRS-FR-AUDIT-001'), input: 'UPDATE title and severity without changing status or assignee.', expectedResult: 'Only submitted fields change and one EDIT history event contains both field logs.', sourceTrace: source.write.concat(source.history), coverage: ['POSITIVE', 'PERSISTENCE'] })
add({ caseId: 'UT-BUG-009', domain: 'Bug write', title: 'unauthorized Bug update is rejected before transition validation', classification: 'ROLE', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-STATUS-008'), input: 'PATCH a Bug as a role that lacks write permission.', expectedResult: 'HTTP 403 is returned before transition validation and no data or side effect changes.', sourceTrace: source.permissions.concat(source.write), coverage: ['ROLE', 'PERSISTENCE'] })
add({ caseId: 'UT-BUG-010', domain: 'Bug write', title: 'unknown Bug update target returns not found without side effects', classification: 'NEGATIVE', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-BUG-001'), input: 'UPDATE a syntactically valid Bug ID that does not exist.', expectedResult: 'HTTP 404 is returned and no history, notification, or delivery row is created.', sourceTrace: source.write.concat(source.history), coverage: ['NEGATIVE', 'PERSISTENCE'] })
add({ caseId: 'UT-BUG-011', domain: 'Bug write', title: 'illegal direct status update is rejected', classification: 'NEGATIVE', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-STATUS-008'), input: 'PATCH status_code to a transition that is not allowed from the stored status.', expectedResult: 'HTTP 400 is returned and status, history, and notification remain unchanged.', sourceTrace: source.write.concat(source.lifecycle), coverage: ['NEGATIVE', 'PERSISTENCE'] })

const requiredFields = [
  ['TITLE', 'title'], ['DESCRIPTION', 'description'], ['STEPS', 'stepsToReproduce'], ['ACTUAL', 'actualResult'], ['EXPECTED', 'expectedResult'],
  ['PRIORITY', 'priority_code'], ['SEVERITY', 'severity_code'], ['COMPONENT', 'applicationComponent_ID'], ['CATEGORY', 'defectCategory_ID']
]
for (const [suffix, field] of requiredFields) add({ caseId: `UT-VAL-${suffix}`, domain: 'Validation', title: `missing required field ${field} is rejected`, classification: 'NEGATIVE', requirementIds: req('SRS-FR-BUG-002'), input: `SAVE or CREATE a Bug with ${field} omitted.`, expectedResult: `HTTP 400 targets ${field}; no active write, history, notification, or delivery is committed.`, sourceTrace: source.write, coverage: ['NEGATIVE', 'PERSISTENCE'] })
add({ caseId: 'UT-VAL-REPORTER', domain: 'Validation', title: 'server-owned reporter derivation rejects an unresolved authenticated actor', classification: 'ROLE', roles: ['TESTER', 'PM'], requirementIds: req('SRS-FR-BUG-001'), input: 'SAVE or CREATE a Bug when the authenticated actor cannot be resolved to one active IDTS user.', expectedResult: 'The write is rejected safely before persistence; no Bug, history, notification, or delivery is committed. A client omission of reporter_ID remains valid when the authenticated actor resolves.', sourceTrace: source.write, coverage: ['ROLE', 'PERSISTENCE', 'SANITIZATION'] })
add({ caseId: 'UT-VAL-WHITESPACE', domain: 'Validation', title: 'whitespace-only required text is treated as missing', classification: 'BOUNDARY', requirementIds: req('SRS-FR-BUG-002'), input: 'Submit a required text field containing only spaces.', expectedResult: 'HTTP 400 targets the field and no active write occurs.', sourceTrace: source.write, coverage: ['BOUNDARY', 'PERSISTENCE'] })
for (const [suffix, title, input] of [
  ['CODE-UNKNOWN', 'unknown code-list value is rejected', 'Submit a code that does not exist in the target code list.'],
  ['CODE-INACTIVE', 'inactive code-list value is rejected', 'Submit a historical code-list row with isActive=false.'],
  ['CODE-SPACES', 'space-padded code-list value is rejected', 'Submit an otherwise valid code with leading or trailing spaces.'],
  ['CODE-EMPTY', 'empty code-list value is rejected', 'Submit an empty string for a required code-list field.'],
  ['CODE-TYPE', 'non-string code-list value is rejected', 'Submit a non-string value for a code-list field.']
]) add({ caseId: `UT-VAL-${suffix}`, domain: 'Validation', title, classification: 'NEGATIVE', requirementIds: req('SRS-FR-CLASS-003'), input, expectedResult: 'HTTP 400 identifies the invalid catalog reference and no business write occurs.', sourceTrace: source.classification, coverage: ['NEGATIVE', 'BOUNDARY', 'PERSISTENCE'] })
add({ caseId: 'UT-VAL-PAIR-VALID', domain: 'Classification', title: 'valid component and defect-category pair derives Component Category', classification: 'POSITIVE', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-CLASS-004'), input: 'Submit an active Application Component and Defect Category pair with an active bridge.', expectedResult: 'The matching componentCategory_ID is derived and persisted.', sourceTrace: source.classification, coverage: ['POSITIVE', 'PERSISTENCE'] })
add({ caseId: 'UT-VAL-PAIR-NOMAP', domain: 'Classification', title: 'component and defect-category pair without an active bridge is rejected', classification: 'NEGATIVE', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-CLASS-004'), input: 'Submit two active codes whose Component Category bridge does not exist or is inactive.', expectedResult: 'HTTP 400 targets classification and no stale derived value is retained.', sourceTrace: source.classification, coverage: ['NEGATIVE', 'PERSISTENCE'] })
add({ caseId: 'UT-VAL-PAIR-MISMATCH', domain: 'Classification', title: 'client-supplied mismatching Component Category is rejected', classification: 'NEGATIVE', requirementIds: req('SRS-FR-CLASS-004'), input: 'Submit componentCategory_ID different from the ID derived by the selected pair.', expectedResult: 'HTTP 400 is returned and no classification write occurs.', sourceTrace: source.classification, coverage: ['NEGATIVE', 'PERSISTENCE'] })
add({ caseId: 'UT-VAL-PAIR-CHANGE', domain: 'Classification', title: 'changing to another valid pair updates the derived Component Category atomically', classification: 'POSITIVE', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-CLASS-004'), input: 'PATCH both classification inputs from one valid pair to another.', expectedResult: 'The new derived componentCategory_ID is persisted with the pair in one transaction.', sourceTrace: source.classification, coverage: ['POSITIVE', 'PERSISTENCE'] })
add({ caseId: 'UT-VAL-PAIR-PARTIAL', domain: 'Classification', title: 'partial classification clears the stale derived Component Category', classification: 'BOUNDARY', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-CLASS-004'), input: 'PATCH only one classification input and leave the pair incomplete.', expectedResult: 'The stale componentCategory_ID is cleared and final Save remains blocked until the pair is valid.', sourceTrace: source.classification, coverage: ['BOUNDARY', 'PERSISTENCE'] })

// Assignment and assignable-developer read model.
const assignmentCases = [
  ['001', 'available responsible Developer can be assigned', 'POSITIVE', 'Assign an active, available Developer with a matching active responsibility.', 'The Bug becomes ASSIGNED; assignee and next processor persist with exact assignment history.', ['POSITIVE', 'PERSISTENCE']],
  ['002', 'PM can reassign to another valid Developer', 'ROLE', 'Reassign an active Bug as PM to another eligible Developer.', 'The new assignee is persisted and the exact reassignment audit identifies PM as actor.', ['ROLE', 'PERSISTENCE']],
  ['003', 'missing assignee ID is rejected', 'NEGATIVE', 'Call assignToDeveloper without assigneeID.', 'HTTP 400 targets assignee and no assignment side effect occurs.', ['NEGATIVE', 'PERSISTENCE']],
  ['004', 'unknown Developer profile is rejected', 'NEGATIVE', 'Assign a syntactically valid DeveloperProfile ID that does not exist.', 'HTTP 400 is returned and assignment state remains unchanged.', ['NEGATIVE', 'PERSISTENCE']],
  ['005', 'inactive Developer profile is rejected', 'NEGATIVE', 'Assign a DeveloperProfile whose user or profile is inactive.', 'HTTP 400 is returned and assignment state remains unchanged.', ['NEGATIVE', 'PERSISTENCE']],
  ['006', 'unavailable Developer is rejected', 'BOUNDARY', 'Assign a candidate whose availability status is UNAVAILABLE.', 'HTTP 400 is returned and no assignment/history/notification occurs.', ['BOUNDARY', 'PERSISTENCE']],
  ['007', 'missing active responsibility is rejected', 'NEGATIVE', 'Assign a Developer without an active responsibility for the derived Component Category.', 'HTTP 400 is returned and no mutation occurs.', ['NEGATIVE', 'PERSISTENCE']],
  ['008', 'conflicting SAP Module responsibility is rejected', 'NEGATIVE', 'Assign a Developer whose responsibility SAP Module conflicts with the Bug SAP Module.', 'HTTP 400 is returned and no mutation occurs.', ['NEGATIVE', 'PERSISTENCE']],
  ['009', 'module-neutral responsibility remains eligible', 'BOUNDARY', 'Assign a Developer with a matching category responsibility and no module restriction.', 'Assignment succeeds when the other eligibility rules pass.', ['BOUNDARY', 'PERSISTENCE']],
  ['010', 'Developer cannot assign or reassign a Bug', 'ROLE', 'Call assignToDeveloper as Developer.', 'HTTP 403 is returned and status, assignee, history, notification, and delivery remain unchanged.', ['ROLE', 'PERSISTENCE']],
  ['011', 'AssignableDevelopers excludes ineligible and inactive candidates', 'POSITIVE', 'Read AssignableDevelopers for one valid classification pair.', 'Only active profiles with matching responsibility are returned with safe workload fields.', ['POSITIVE', 'ROLE']]
]
for (const [id, title, classification, input, expectedResult, coverage] of assignmentCases) add({ caseId: `UT-ASN-${id}`, domain: 'Assignment', title, classification, environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-ASSIGN-001'), roles: classification === 'ROLE' ? ['DEVELOPER'] : ['TESTER', 'PM'], input, expectedResult, sourceTrace: id === '011' ? source.assignmentRead : source.assignment.concat(source.permissions), coverage })

// Each lifecycle action has separate success, role-denial, source-state, and required-input rows.
const lifecycleActions = [
  { action: 'assignToDeveloper', actionType: 'ASSIGN_TO_DEVELOPER', status: 'ASSIGNED', positiveInput: 'Tester or PM assigns a valid Developer.', requirement: 'SRS-FR-ASSIGN-001', validations: [['missing assigneeID', 'Call assignToDeveloper without assigneeID.', 'HTTP 400 targets assigneeID and no state changes.']] },
  { action: 'moveToPendingAssignment', actionType: 'MOVE_TO_PENDING_ASSIGNMENT', status: 'PENDING_ASSIGNMENT', positiveInput: 'Tester or PM clears the current assignee.', requirement: 'SRS-FR-ASSIGN-003', validations: [] },
  { action: 'markInReview', actionType: 'MARK_IN_REVIEW', status: 'IN_REVIEW', positiveInput: 'The assigned Developer marks the Bug in review.', requirement: 'SRS-FR-STATUS-001', validations: [['missing assigned Developer', 'Call markInReview on an eligible Bug without assignee_ID.', 'HTTP 400 targets assignee and no state changes.']] },
  { action: 'requestMoreInformation', actionType: 'REQUEST_MORE_INFORMATION', status: 'NEED_MORE_INFORMATION', positiveInput: 'The assigned Developer submits a nonblank reason.', requirement: 'SRS-FR-STATUS-002', validations: [['missing assigned Developer', 'Call requestMoreInformation on an eligible Bug without assignee_ID.', 'HTTP 400 targets assignee and no state changes.'], ['blank reason', 'Call requestMoreInformation with a blank reason.', 'HTTP 400 targets reason and no state changes.']] },
  { action: 'resubmitToDeveloper', actionType: 'RESUBMIT_TO_DEVELOPER', status: 'ASSIGNED', positiveInput: 'Tester or PM resubmits with a nonblank follow-up note.', requirement: 'SRS-FR-STATUS-004', validations: [['blank update summary', 'Call resubmitToDeveloper with a blank note.', 'HTTP 400 targets note and no state changes.'], ['missing assigned Developer', 'Call resubmitToDeveloper on an eligible Bug without assignee_ID.', 'HTTP 400 targets assignee and no state changes.']] },
  { action: 'rejectBug', actionType: 'REJECT_BUG', status: 'REJECTED', positiveInput: 'The assigned Developer submits a nonblank rejection reason.', requirement: 'SRS-FR-STATUS-003', validations: [['missing assigned Developer', 'Call rejectBug on an eligible Bug without assignee_ID.', 'HTTP 400 targets assignee and no state changes.'], ['blank rejection reason', 'Call rejectBug with a blank reason.', 'HTTP 400 targets reason and no state changes.']] },
  { action: 'startProgress', actionType: 'START_PROGRESS', status: 'IN_PROGRESS', positiveInput: 'The assigned Developer starts progress.', requirement: 'SRS-FR-STATUS-005', validations: [['missing assigned Developer', 'Call startProgress on an eligible Bug without assignee_ID.', 'HTTP 400 targets assignee and no state changes.']] },
  { action: 'resolveBug', actionType: 'RESOLVE_BUG', status: 'RESOLVED', positiveInput: 'The assigned Developer resolves with a nonblank note.', requirement: 'SRS-FR-STATUS-005', validations: [['missing assigned Developer', 'Call resolveBug on an eligible Bug without assignee_ID.', 'HTTP 400 targets assignee and no state changes.'], ['blank resolution note', 'Call resolveBug with a blank note.', 'HTTP 400 targets note and no state changes.']] },
  { action: 'sendToRetest', actionType: 'SEND_TO_RETEST', status: 'RETEST_REQUIRED', positiveInput: 'Tester or PM sends a resolved Bug to retest.', requirement: 'SRS-FR-STATUS-006', validations: [] },
  { action: 'closeBug', actionType: 'CLOSE_BUG', status: 'CLOSED', positiveInput: 'Tester or PM closes an eligible Bug.', requirement: 'SRS-FR-STATUS-007', validations: [] },
  { action: 'reopenBug', actionType: 'REOPEN_BUG', status: 'REOPENED', positiveInput: 'Tester or PM reopens with a nonblank reason.', requirement: 'SRS-FR-STATUS-007', validations: [['blank reopen reason', 'Call reopenBug with a blank reason.', 'HTTP 400 targets reason and no state changes.']] }
]
lifecycleActions.forEach(({ action, actionType, status, positiveInput, requirement, validations }, index) => {
  const base = String(index + 1).padStart(2, '0')
  const trace = [{ file: 'srv/service.js', symbol: action }, ...source.lifecycle, ...source.permissions]
  add({ caseId: `UT-LC-${base}A`, domain: 'Lifecycle', title: `${action} performs the allowed transition and exact audit`, classification: 'POSITIVE', environment: 'HYBRID_BTP', requirementIds: req(requirement, 'SRS-FR-AUDIT-001'), input: positiveInput, expectedResult: `Status becomes ${status}; exact ActionType ${actionType}, next processor, history, notification, and reload state match the contract.`, sourceTrace: trace, coverage: ['POSITIVE', 'PERSISTENCE'] })
  add({ caseId: `UT-LC-${base}B`, domain: 'Lifecycle', title: `${action} rejects an unauthorized actor`, classification: 'ROLE', environment: 'HYBRID_BTP', requirementIds: req(requirement), input: `Call ${action} as a role or Developer owner not permitted for the stored Bug.`, expectedResult: 'HTTP 403 is returned before mutation; Bug, history, notification, delivery, and comment counts remain unchanged.', sourceTrace: trace, coverage: ['ROLE', 'PERSISTENCE'] })
  add({ caseId: `UT-LC-${base}C`, domain: 'Lifecycle', title: `${action} rejects an illegal source status`, classification: 'NEGATIVE', environment: 'HYBRID_BTP', requirementIds: req(requirement, 'SRS-FR-STATUS-008'), input: `Call ${action} from one disallowed stored status while all required input is valid.`, expectedResult: 'HTTP 400 rejects the transition and the transaction produces no partial side effect.', sourceTrace: trace, coverage: ['NEGATIVE', 'BOUNDARY', 'PERSISTENCE'] })
  validations.forEach(([title, input, expectedResult], validationIndex) => {
    const suffix = String.fromCharCode('D'.charCodeAt(0) + validationIndex)
    add({ caseId: `UT-LC-${base}${suffix}`, domain: 'Lifecycle', title: `${action} rejects ${title}`, classification: 'NEGATIVE', environment: 'HYBRID_BTP', requirementIds: req(requirement), input, expectedResult, sourceTrace: trace, coverage: ['NEGATIVE', 'PERSISTENCE'] })
  })
})

// Comments, attachments, history, notification/email, and monitoring.
for (const [id, role] of [['001', 'TESTER'], ['002', 'DEVELOPER'], ['003', 'PM']]) add({ caseId: `UT-CMT-${id}`, domain: 'Comments', title: `${role} adds a nonblank comment with server-owned author`, classification: 'ROLE', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-COMMENT-001'), roles: [role], input: `Add a nonblank comment as ${role}.`, expectedResult: 'The comment persists with authenticated author and role, survives reload, and does not change Bug status.', sourceTrace: source.comments.concat(source.history), coverage: ['ROLE', 'PERSISTENCE'] })
add({ caseId: 'UT-CMT-004', domain: 'Comments', title: 'empty comment is rejected', classification: 'NEGATIVE', requirementIds: req('SRS-FR-COMMENT-001'), input: 'Submit an empty comment.', expectedResult: 'HTTP 400 targets content and no comment/history row is inserted.', sourceTrace: source.comments, coverage: ['NEGATIVE', 'PERSISTENCE'] })
add({ caseId: 'UT-CMT-005', domain: 'Comments', title: 'whitespace-only comment is rejected', classification: 'BOUNDARY', requirementIds: req('SRS-FR-COMMENT-001'), input: 'Submit a comment containing only whitespace.', expectedResult: 'HTTP 400 targets content and no comment/history row is inserted.', sourceTrace: source.comments, coverage: ['BOUNDARY', 'PERSISTENCE'] })
add({ caseId: 'UT-CMT-006', domain: 'Comments', title: 'forged comment author is replaced by the authenticated actor', classification: 'SECURITY', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-COMMENT-001'), input: 'Submit comment author_ID and authorRole_code for another user.', expectedResult: 'Server-owned actor values are persisted; impersonation data is not accepted.', sourceTrace: source.comments, coverage: ['SANITIZATION', 'PERSISTENCE'] })
add({ caseId: 'UT-CMT-007', domain: 'Comments', title: 'addComment action writes readable audit without lifecycle change', classification: 'POSITIVE', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-COMMENT-001', 'SRS-FR-COMMENT-002'), input: 'Call the bound addComment action with valid content.', expectedResult: 'One comment and one readable comment audit are committed while status and next processor remain unchanged.', sourceTrace: source.comments.concat(source.history), coverage: ['POSITIVE', 'PERSISTENCE'] })
add({ caseId: 'UT-CMT-008', domain: 'Comments', title: 'invalid comment actor role is rejected safely', classification: 'ROLE', requirementIds: req('SRS-FR-COMMENT-001'), input: 'Attempt a direct composition write with an invalid or inactive actor role.', expectedResult: 'HTTP 400/403 is returned and no comment row is inserted.', sourceTrace: source.comments, coverage: ['ROLE', 'PERSISTENCE'] })

const attachmentCases = [
  ['001', 'new-draft file remains client-pending until activation', 'POSITIVE', 'ODATA_CONTRACT', 'HYBRID_BTP', 'Select one allowed file on a root NEW draft, then save the Bug.', 'No binary is uploaded before SAVE; after activation metadata and binary are linked to the active Bug.', source.attachmentUi.concat(source.attachmentBackend), ['POSITIVE', 'PERSISTENCE']],
  ['002', 'allowed attachment persists metadata and bytes', 'POSITIVE', 'ODATA_CONTRACT', 'HYBRID_BTP', 'Upload an allowed file below the UI size limit to an active Bug.', 'Metadata and bytes persist with the recorded size and safe filename.', source.attachmentUi.concat(source.attachmentBackend), ['POSITIVE', 'PERSISTENCE']],
  ['003', 'S3 upload stores HANA metadata and one object', 'POSITIVE', 'BTP_INTEGRATION', 'BTP_REQUIRED', 'Upload through the production S3 binding.', 'HANA stores metadata, S3 stores one binary object, and no secret appears in the response.', source.attachmentBackend.concat(source.attachmentStorage), ['POSITIVE', 'PERSISTENCE']],
  ['004', 'download bytes match the uploaded SHA-256', 'POSITIVE', 'BTP_INTEGRATION', 'BTP_REQUIRED', 'Download a previously uploaded attachment and calculate SHA-256.', 'The downloaded hash matches the sanitized source evidence hash.', source.attachmentUi.concat(source.attachmentStorage), ['POSITIVE', 'PERSISTENCE']],
  ['005', 'attachment survives service restart and reload', 'PERSISTENCE', 'BTP_INTEGRATION', 'BTP_REQUIRED', 'Restart/redeploy the service, reload the Bug, and download the attachment.', 'Metadata and byte hash remain unchanged.', source.attachmentUi.concat(source.attachmentStorage), ['PERSISTENCE']],
  ['006', 'delete removes metadata and storage object', 'POSITIVE', 'BTP_INTEGRATION', 'BTP_REQUIRED', 'Delete an existing attachment.', 'Metadata and object are removed while unrelated Bug state remains unchanged.', source.attachmentBackend.concat(source.attachmentUi, source.attachmentStorage), ['POSITIVE', 'PERSISTENCE']],
  ['007', 'unsupported MIME is blocked by the UI allowlist', 'NEGATIVE', 'UI_COMPONENT', 'LOCAL', 'Select a MIME type outside the UI allowlist.', 'The UI rejects the selection before upload and shows the safe supported-type message.', source.attachmentUi, ['NEGATIVE']],
  ['008', 'file above ten megabytes is blocked by the UI limit', 'BOUNDARY', 'UI_COMPONENT', 'LOCAL', 'Select a payload larger than 10 MB.', 'The UI rejects the selection before upload and shows the safe 10 MB message.', source.attachmentUi, ['BOUNDARY']],
  ['009', 'unauthenticated attachment write is denied', 'ROLE', 'ODATA_CONTRACT', 'LOCAL', 'Upload without an authenticated IDTS role.', 'HTTP 401/403 is returned before storage access and existing attachment state is unchanged.', source.attachmentBackend, ['ROLE', 'PERSISTENCE']],
  ['010', 'storage upload failure does not leave orphan metadata', 'NEGATIVE', 'BTP_INTEGRATION', 'BTP_REQUIRED', 'Inject a controlled S3 upload failure after metadata preparation.', 'A safe error is returned and metadata/object state rolls back consistently.', source.attachmentBackend.concat(source.attachmentStorage), ['NEGATIVE', 'PERSISTENCE']],
  ['011', 'storage download failure does not mutate Bug workflow', 'NEGATIVE', 'BTP_INTEGRATION', 'BTP_REQUIRED', 'Inject a controlled S3 download failure.', 'A safe error is returned and Bug status/history/notification remain unchanged.', source.attachmentUi.concat(source.attachmentStorage), ['NEGATIVE', 'PERSISTENCE']],
  ['012', 'storage delete failure keeps a truthful attachment state', 'NEGATIVE', 'BTP_INTEGRATION', 'BTP_REQUIRED', 'Inject a controlled S3 delete failure.', 'The UI/API reports failure and does not falsely report deletion or mutate Bug workflow.', source.attachmentBackend.concat(source.attachmentUi, source.attachmentStorage), ['NEGATIVE', 'PERSISTENCE']]
]
for (const [id, title, classification, testLevel, environment, input, expectedResult, sourceTrace, coverage] of attachmentCases) add({ caseId: `UT-ATT-${id}`, domain: 'Attachments', title, classification, testLevel, environment, requirementIds: req('SRS-DATA-007'), roles: ['TESTER', 'DEVELOPER', 'PM'], input, expectedResult, sourceTrace, coverage })

const historyCases = [
  ['001', 'Bug creation writes one create event', 'Create a valid Bug.', 'One create HistoryEvent identifies the actor and readable summary.'],
  ['002', 'multi-field edit writes one event with one log per changed field', 'Update multiple important fields in one transaction.', 'One EDIT event contains one HistoryLog per changed field.'],
  ['003', 'all lifecycle actions retain exact one-to-one ActionType values', 'Execute each of the eleven lifecycle actions on eligible fixtures.', 'Each event stores the exact registered ActionType rather than inferred generic status text.'],
  ['004', 'history display enrichment remains stable after reload', 'Read and reload an event containing code, user, status, and attachment values.', 'Display labels and values are stable and ordered newest first.'],
  ['005', 'validation failure inserts no history', 'Force a validation rejection before a write.', 'No HistoryEvent or HistoryLog is inserted.'],
  ['006', 'authorization failure inserts no history', 'Force an authorization rejection before a write.', 'No HistoryEvent or HistoryLog is inserted.'],
  ['007', 'post-update side-effect failure rolls back the whole transaction', 'Inject a controlled history or notification failure after an attempted update.', 'Bug, history, comment, and notification changes roll back together.']
]
for (const [id, title, input, expectedResult] of historyCases) add({ caseId: `UT-HIS-${id}`, domain: 'History', title, classification: id <= '004' ? 'POSITIVE' : 'NEGATIVE', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-AUDIT-001'), input, expectedResult, sourceTrace: source.history, coverage: [id <= '004' ? 'POSITIVE' : 'NEGATIVE', 'PERSISTENCE'] })

const notificationCases = [
  ['001', 'eligible workflow event creates the correct in-app notification', 'CAP_COMPONENT', 'HYBRID_BTP', 'Trigger a status event with a valid next recipient.', 'One IN_APP/SENT notification identifies the correct recipient and event.'],
  ['002', 'rejected workflow action creates no notification or delivery', 'CAP_COMPONENT', 'HYBRID_BTP', 'Trigger an invalid lifecycle action.', 'No notification or email delivery row is inserted.'],
  ['003', 'valid email recipient creates one unique pending delivery', 'CAP_COMPONENT', 'HYBRID_BTP', 'Create a notification with email enabled and a valid recipient.', 'One EMAIL/PENDING delivery with a safe snapshot is persisted.'],
  ['004', 'disabled email marks delivery skipped without rolling back workflow', 'CAP_COMPONENT', 'HYBRID_BTP', 'Process notification while email delivery is disabled.', 'Delivery is SKIPPED with a safe reason and the Bug workflow remains committed.'],
  ['005', 'missing recipient email is skipped without provider call', 'CAP_COMPONENT', 'HYBRID_BTP', 'Process an active recipient with no email.', 'Delivery is SKIPPED and sendMail is not called.'],
  ['006', 'inactive recipient is skipped without provider call', 'CAP_COMPONENT', 'HYBRID_BTP', 'Process a notification for an inactive recipient.', 'Delivery is SKIPPED and sendMail is not called.'],
  ['007', 'worker claims and sends one eligible delivery', 'CAP_COMPONENT', 'HYBRID_BTP', 'Run one worker against an eligible PENDING delivery.', 'Lock and attempt count update atomically; final status is SENT and lock/error are cleared.'],
  ['008', 'provider failure records sanitized FAILED and bounded retry', 'CAP_COMPONENT', 'HYBRID_BTP', 'Inject a controlled provider failure on the first attempt.', 'Status is FAILED, diagnostic is sanitized, nextAttemptAt is bounded, and workflow remains committed.'],
  ['009', 'delivery before nextAttemptAt is not retried', 'CAP_COMPONENT', 'LOCAL', 'Evaluate a FAILED row whose nextAttemptAt is in the future through processEmailDeliveries.', 'The row is not claimed or sent.'],
  ['010', 'delivery at or after nextAttemptAt is retried', 'CAP_COMPONENT', 'LOCAL', 'Evaluate a FAILED row whose nextAttemptAt has elapsed through processEmailDeliveries.', 'The row becomes eligible and attempt count increments once.'],
  ['011', 'delivery at max attempts remains failed', 'CAP_COMPONENT', 'LOCAL', 'Evaluate a FAILED row whose attemptCount reached maxAttempts through processEmailDeliveries.', 'The row is not retried and remains FAILED.'],
  ['012', 'two workers cannot send the same delivery twice', 'CAP_COMPONENT', 'HYBRID_BTP', 'Start two controlled workers against the same eligible delivery.', 'Only one compare-and-set claim succeeds and exactly one provider send occurs; repeat on HANA for production-parity evidence.'],
  ['013', 'Job Scheduler invokes outbox with technical authorization', 'BTP_INTEGRATION', 'BTP_REQUIRED', 'Invoke processEmailOutbox through the bound Job Scheduler task.', 'The authorized batch runs and HANA/provider statuses agree without exposing credentials.']
]
for (const [id, title, testLevel, environment, input, expectedResult] of notificationCases) add({ caseId: `UT-NTF-${id}`, domain: 'Notifications and email', title, classification: id === '001' || id === '003' || id === '007' || id === '010' || id === '013' ? 'POSITIVE' : 'BOUNDARY', testLevel, environment, requirementIds: req('SRS-FR-NOTIF-001', 'SRS-FR-NOTIF-002', 'SRS-FR-DELIVERY-001'), input, expectedResult, sourceTrace: source.email.concat(source.history), coverage: [id === '001' || id === '003' || id === '007' || id === '010' || id === '013' ? 'POSITIVE' : 'BOUNDARY', 'PERSISTENCE'] })

const monitoringCases = [
  ['001', 'overdue flag respects due-date boundary and excludes Closed', 'Evaluate open/closed Bugs before, on, and after due date.', 'Only open Bugs past due are overdue.'],
  ['002', 'pending assignment count matches unassigned workflow rows', 'Aggregate seeded pending-assignment Bugs.', 'Count matches stored eligible rows.'],
  ['003', 'developer open-status counts match assigned Bugs', 'Aggregate open Bugs for each Developer.', 'Open counts match stored assignee/status data.'],
  ['004', 'workload threshold changes overload only above the configured limit', 'Evaluate below, equal, and above workload limits.', 'isOverloaded changes at the documented boundary only.'],
  ['005', 'current-action totals include only the correct next processor', 'Aggregate Bugs across next-processor roles and statuses.', 'Only rows currently requiring that Developer action are counted.'],
  ['006', 'search filter and order remain deterministic', 'Apply search, where, orderBy, and limit to the same workload rows.', 'The same stable filtered order is returned.'],
  ['007', 'non-PM cannot read AI operational metrics', 'Call readAiOperationalMetrics as Tester and Developer.', 'HTTP 403 is returned and no metric payload is exposed.']
]
for (const [id, title, input, expectedResult] of monitoringCases) add({ caseId: `UT-MON-${id}`, domain: 'Monitoring', title, classification: id === '007' ? 'ROLE' : 'BOUNDARY', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-PM-001', 'SRS-FR-PM-002', 'SRS-FR-PM-003'), roles: id === '007' ? ['TESTER', 'DEVELOPER'] : ['PM'], input, expectedResult, sourceTrace: id === '007' ? source.aiReview : source.monitoring, coverage: [id === '007' ? 'ROLE' : 'BOUNDARY', 'PERSISTENCE'] })

// AI provider, feature, review, apply, confirmation, and metrics truth.
const aiCases = [
  ['001', 'disabled provider returns AI_DISABLED without network access', 'NEGATIVE', 'PURE_UNIT', 'LOCAL', 'Call provider operations with AI disabled.', 'A stable AI_DISABLED result is returned and no provider/network/business mutation occurs.', source.aiProvider],
  ['002', 'deterministic structured mock maps a safe result', 'POSITIVE', 'PURE_UNIT', 'LOCAL', 'Call structured generation with controlled mock output.', 'The schema result is normalized and excluded secrets remain absent.', source.aiProvider],
  ['003', 'embedding dimension equals configured vector length', 'BOUNDARY', 'PURE_UNIT', 'LOCAL', 'Request a controlled embedding with configured dimension six.', 'Exactly six finite values and the embedding model alias are returned.', source.aiProvider],
  ['004', 'provider timeout returns safe retryable status', 'NEGATIVE', 'PURE_UNIT', 'LOCAL', 'Inject a controlled provider timeout.', 'AI_TIMEOUT is returned without raw stack, key, endpoint, or business input.', source.aiProvider],
  ['005', 'provider network failure returns safe retryable status', 'NEGATIVE', 'PURE_UNIT', 'LOCAL', 'Inject a controlled network failure.', 'A safe retryable provider status is returned without raw diagnostics.', source.aiProvider],
  ['006', 'malformed structured output falls back safely', 'NEGATIVE', 'PURE_UNIT', 'LOCAL', 'Return malformed structured provider output.', 'Validation rejects the payload and produces the documented safe fallback.', source.aiProvider],
  ['007', 'secret redactor removes representative credential patterns', 'SECURITY', 'PURE_UNIT', 'LOCAL', 'Pass synthetic key, token, email, DB URL, and private endpoint-shaped text.', 'Sensitive patterns are removed without retaining raw input.', source.aiProvider],
  ['008', 'Similar Bugs ranks grounded candidates without self-match', 'POSITIVE', 'CAP_COMPONENT', 'HYBRID_BTP', 'Suggest similar Bugs for a persisted source with eligible candidates.', 'Grounded candidates are ranked; source Bug is excluded; review audit is safe.', source.similar],
  ['009', 'Similar Bugs no-result path creates no duplicate link', 'NEGATIVE', 'CAP_COMPONENT', 'HYBRID_BTP', 'Use input with no candidate above the threshold.', 'An empty/safe result is returned and DuplicateLinks remains unchanged.', source.similar],
  ['010', 'Classification suggestions contain only active catalog values', 'POSITIVE', 'CAP_COMPONENT', 'HYBRID_BTP', 'Request classification for a Bug with adequate context.', 'Every suggested code maps to an active catalog row and audit remains review-only.', source.aiClassification],
  ['011', 'Classification sparse-data path does not invent codes', 'BOUNDARY', 'CAP_COMPONENT', 'HYBRID_BTP', 'Request classification with minimal title/description context.', 'Unsafe or ungrounded fields return no suggestion or rules-based baseline, not invented codes.', source.aiClassification],
  ['012', 'Handoff Summary grounds current state, comments, and history', 'POSITIVE', 'CAP_COMPONENT', 'HYBRID_BTP', 'Summarize a Bug with comments and lifecycle history.', 'Summary, comment summary, events, and next action are grounded in stored data.', source.handoff],
  ['013', 'Handoff comment prompt injection is treated as data', 'SECURITY', 'CAP_COMPONENT', 'HYBRID_BTP', 'Include instruction-like text inside a stored comment.', 'The comment is summarized as data and cannot override system constraints.', source.handoff],
  ['014', 'Smart Assign explanation uses backend-issued candidates only', 'POSITIVE', 'CAP_COMPONENT', 'HYBRID_BTP', 'Request explanations for the eligible candidate list.', 'Every explanation maps by safe candidate reference and no assignment occurs.', source.smartAssign],
  ['015', 'Smart Assign unknown provider candidate is ignored', 'SECURITY', 'CAP_COMPONENT', 'HYBRID_BTP', 'Return an explanation for a candidate not issued by the backend.', 'The unknown row is discarded and no Developer ID is accepted from AI.', source.smartAssign],
  ['016', 'Accept pending suggestion records one terminal review', 'POSITIVE', 'CAP_COMPONENT', 'HYBRID_BTP', 'Accept a PENDING suggestion as an allowed role.', 'Review state, reviewer, and time persist; Bug workflow remains unchanged.', source.aiReview],
  ['017', 'Reject pending suggestion records one terminal review', 'POSITIVE', 'CAP_COMPONENT', 'HYBRID_BTP', 'Reject a PENDING suggestion as an allowed role.', 'Review state, reviewer, and time persist; Bug workflow remains unchanged.', source.aiReview],
  ['018', 'Ignore pending suggestion records one terminal review', 'POSITIVE', 'CAP_COMPONENT', 'HYBRID_BTP', 'Ignore a PENDING suggestion as an allowed role.', 'Review state, reviewer, and time persist; Bug workflow remains unchanged.', source.aiReview],
  ['019A', 'repeated review of an ACCEPTED suggestion is rejected', 'NEGATIVE', 'CAP_COMPONENT', 'HYBRID_BTP', 'Review an already ACCEPTED suggestion again.', 'HTTP 409 is returned and original review/business state remains unchanged.', source.aiReview],
  ['019B', 'repeated review of a REJECTED suggestion is rejected', 'NEGATIVE', 'CAP_COMPONENT', 'HYBRID_BTP', 'Review an already REJECTED suggestion again.', 'HTTP 409 is returned and original review/business state remains unchanged.', source.aiReview],
  ['019C', 'repeated review of an IGNORED suggestion is rejected', 'NEGATIVE', 'CAP_COMPONENT', 'HYBRID_BTP', 'Review an already IGNORED suggestion again.', 'HTTP 409 is returned and original review/business state remains unchanged.', source.aiReview],
  ['020', 'expired suggestion review is rejected', 'BOUNDARY', 'CAP_COMPONENT', 'HYBRID_BTP', 'Review a suggestion after expiresAt.', 'HTTP 409 is returned and no state is changed.', source.aiReview],
  ['021', 'accepted current Classification suggestion applies allowlisted fields', 'POSITIVE', 'ODATA_CONTRACT', 'HYBRID_BTP', 'Apply one ACCEPTED, unexpired, non-stale classification suggestion as Tester or PM.', 'Only classification allowlist fields change atomically; status/assignee/next processor remain unchanged.', source.aiClassification],
  ['022', 'stale Classification suggestion cannot overwrite current Bug data', 'NEGATIVE', 'ODATA_CONTRACT', 'HYBRID_BTP', 'Change source classification after suggestion creation, then Apply.', 'HTTP 409 is returned and current classification remains unchanged.', source.aiClassification],
  ['023', 'accepted Similar Bugs candidate creates one grounded DuplicateLink', 'POSITIVE', 'ODATA_CONTRACT', 'HYBRID_BTP', 'Confirm one candidate stored in an ACCEPTED Similar Bugs suggestion as Tester or PM.', 'One normalized DuplicateLink is committed without lifecycle mutation.', source.similar],
  ['024', 'self duplicate candidate is rejected', 'NEGATIVE', 'ODATA_CONTRACT', 'HYBRID_BTP', 'Confirm the source Bug as its own duplicate.', 'HTTP 400 is returned and no DuplicateLink is created.', source.similar],
  ['025A', 'repeated forward duplicate link is idempotently rejected', 'BOUNDARY', 'ODATA_CONTRACT', 'HYBRID_BTP', 'Confirm a pair whose forward link already exists.', 'HTTP 409 or the documented idempotent boundary is returned with one stored link only.', source.similar],
  ['025B', 'reverse duplicate link is idempotently rejected', 'BOUNDARY', 'ODATA_CONTRACT', 'HYBRID_BTP', 'Confirm a pair whose reverse link already exists.', 'HTTP 409 or the documented idempotent boundary is returned with one stored link only.', source.similar],
  ['026', 'PM reads allowlisted operational metrics only', 'ROLE', 'ODATA_CONTRACT', 'HYBRID_BTP', 'Read 30-day metrics as PM through the OData function.', 'Only aggregate capability/status/latency/review counts are returned; prompt/response/error/secret fields are absent. Repeat on BTP for deployed-role confirmation.', source.aiReview],
  ['027', 'controlled provider rate limit preserves safe no-mutation fallback', 'BOUNDARY', 'CAP_COMPONENT', 'LOCAL', 'Inject a controlled HTTP 429 provider response.', 'The documented cooldown/fallback result is recorded without retry storm or business mutation; live quota behavior is acceptance evidence, not a prerequisite for this component case.', source.aiProvider]
]
for (const [id, title, classification, testLevel, environment, input, expectedResult, sourceTrace] of aiCases) add({ caseId: `UT-AI-${id}`, domain: 'AI', title, classification, testLevel, environment, requirementIds: req('SRS-FR-AI-002', 'SRS-FR-AI-003'), roles: testLevel === 'PURE_UNIT' ? ['N/A'] : ['TESTER', 'DEVELOPER', 'PM'], input, expectedResult, sourceTrace, coverage: [classification === 'ROLE' ? 'ROLE' : classification, 'SANITIZATION', ...(testLevel !== 'PURE_UNIT' ? ['PERSISTENCE'] : [])] })

const securityCases = [
  ['001', 'anonymous BugService request is rejected', 'Call protected BugService without authentication.', 'HTTP 401 returns no business data.'],
  ['002', 'Developer cannot process another Developer assigned Bug', 'Run a Developer-only lifecycle action on another Developer assignee.', 'HTTP 403 is returned and no mutation occurs.'],
  ['003', 'read-only code-list entity rejects client write', 'CREATE, UPDATE, or DELETE a projected code-list entity.', 'HTTP 405/403 is returned and the entity remains unchanged.'],
  ['004', 'audit entity rejects client write', 'CREATE, UPDATE, or DELETE HistoryEvents, HistoryLogs, AiSuggestions, or Notifications.', 'HTTP 405/403 is returned and the entity remains unchanged.'],
  ['005', 'public projections omit credential and lock fields', 'Read public Users, sessions, notifications, and AI projections.', 'passwordHash, tokenHash, lockToken, raw email body, prompt, and response are absent.'],
  ['006', 'database exception is sanitized at the public boundary', 'Inject a controlled database exception containing sensitive text.', 'Public error and persisted diagnostic omit SQL, credentials, endpoint, and stack.'],
  ['007', 'provider exception is sanitized at the public boundary', 'Inject a controlled provider exception containing sensitive text.', 'Public error and audit diagnostic contain only allowlisted stable tokens.'],
  ['008', 'failed operation leaves no cross-entity partial mutation', 'Force a failure during an operation that would touch Bug, history, notification, duplicate, classification, or attachment state.', 'The transaction leaves all affected business entities consistent with the before-state.']
]
for (const [id, title, input, expectedResult] of securityCases) add({ caseId: `UT-SEC-${id}`, domain: 'Security', title, classification: 'SECURITY', testLevel: id === '001' || id === '005' ? 'ODATA_CONTRACT' : 'CAP_COMPONENT', environment: 'HYBRID_BTP', requirementIds: req('SRS-FR-AUTH-002', 'SRS-FR-AI-003'), input, expectedResult, sourceTrace: source.guards.concat(source.permissions), coverage: ['ROLE', 'SANITIZATION', ...(id === '008' ? ['PERSISTENCE'] : [])] })

function validate () {
  const errors = []
  const ids = new Set()
  for (const item of cases) {
    if (ids.has(item.caseId)) errors.push(`duplicate caseId ${item.caseId}`)
    ids.add(item.caseId)
    if (item.execution.status !== 'NOT_RUN') errors.push(`${item.caseId} imports execution truth`)
    if (!item.sourceTrace.length) errors.push(`${item.caseId} has no source trace`)
    for (const trace of item.sourceTrace) {
      const absolute = path.join(ROOT, trace.file)
      if (!fs.existsSync(absolute)) errors.push(`${item.caseId} missing file ${trace.file}`)
      else if (!fs.readFileSync(absolute, 'utf8').includes(trace.symbol)) errors.push(`${item.caseId} missing symbol ${trace.symbol} in ${trace.file}`)
    }
  }
  if (errors.length) throw new Error(errors.join('\n'))
}

function summary () {
  const countBy = key => Object.fromEntries([...new Set(cases.map(item => item[key]))].sort().map(value => [value, cases.filter(item => item[key] === value).length]))
  return {
    totalCases: cases.length,
    byDomain: countBy('domain'),
    byTestLevel: countBy('testLevel'),
    byEnvironment: countBy('environment'),
    execution: { NOT_RUN: cases.length }
  }
}

validate()
const catalog = {
  schemaVersion: '1.0',
  project: 'IDTS-SAP01',
  jiraKey: 'IDTS-110',
  language: 'EN',
  owner: 'DonHV',
  executor: 'NhanT',
  status: 'APPROVED_FOR_EXECUTION',
  baselineSha: BASELINE_SHA,
  generatedAt: '2026-08-02',
  knowledgeGate: 'PASS — DonHV; do not reopen',
  purpose: 'Atomic condition-branch catalog for Unit Test EN v0.5 planning. Test level prevents component, contract, and BTP integration checks from being mislabeled as pure unit tests.',
  testLevelDefinitions: {
    PURE_UNIT: 'Isolated deterministic helper/module test without CAP persistence or network.',
    UI_COMPONENT: 'Client-side SAPUI5 behavior validated without claiming an equivalent backend rule.',
    CAP_COMPONENT: 'CAP handler/helper test with controlled transaction and local or hybrid persistence.',
    ODATA_CONTRACT: 'HTTP/OData contract test including status, payload, authorization, and side effects.',
    BTP_INTEGRATION: 'Acceptance that depends on deployed XSUAA, HANA, S3, Job Scheduler, Brevo, or live AI Gateway.'
  },
  environmentDefinitions: {
    LOCAL: 'Runs entirely on the local controlled test stack.',
    HYBRID_BTP: 'Runs locally first and is repeated on BTP/HANA for persistence or role evidence.',
    BTP_REQUIRED: 'Cannot be accepted locally because it depends on a bound SAP BTP or live external service.'
  },
  evidencePolicy: {
    perCase: true,
    imageRequired: true,
    selectedEvidenceMustBeTracked: true,
    forbidden: ['password', 'API key', 'bearer token', 'cookie', 'database URL', 'private endpoint', 'raw provider payload', 'full private email'],
    rule: 'Command-only, script-only, or shared screenshot-only evidence is not sufficient.'
  },
  summary: summary(),
  cases
}

const serialized = `${JSON.stringify(catalog, null, 2)}\n`
const normalizeLineEndings = value => value.replace(/\r\n/g, '\n')
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUTPUT) || normalizeLineEndings(fs.readFileSync(OUTPUT, 'utf8')) !== serialized) {
    console.error(`Catalog is stale: ${path.relative(ROOT, OUTPUT)}`)
    process.exit(1)
  }
  console.log(`IDTS-110 catalog valid: ${cases.length} NOT_RUN cases; source traces resolved.`)
} else {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  fs.writeFileSync(OUTPUT, serialized)
  console.log(`Wrote ${path.relative(ROOT, OUTPUT)} with ${cases.length} NOT_RUN cases.`)
}
