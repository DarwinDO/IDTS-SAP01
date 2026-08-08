#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { randomUUID } = require('crypto')

const BASE_URL = String(process.env.IDTS_QA_BASE_URL || 'https://idts-sap01-qa.onrender.com').replace(/\/+$/, '')
const PM_EMAIL = process.env.IDTS_QA_EMAIL
const PASSWORD = process.env.IDTS_QA_PASSWORD
const EVIDENCE_DIR = process.env.IDTS_QA_EVIDENCE_DIR ||
  path.join(process.cwd(), 'docs', 'pm', 'evidence', 'idts-100', 'shared-qa-lifecycle')
const MARKER = `UAT-MENTOR-20260711-${Date.now()}`

const checks = []

function record (label, ok, detail = '') {
  checks.push({ label, ok, detail })
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` | ${detail}` : ''}`)
}

function expect (label, condition, detail = '') {
  record(label, Boolean(condition), detail)
  if (!condition) throw new Error(`${label}${detail ? `: ${detail}` : ''}`)
}

function safeDetail (value) {
  return String(value || '')
    .replace(/[\w.+-]+@[\w.-]+/g, '[email-redacted]')
    .replace(/Bearer\s+[\w.-]+/gi, 'Bearer [redacted]')
    .replace(/postgres(?:ql)?:\/\/\S+/gi, '[database-url-redacted]')
    .slice(0, 500)
}

async function request (method, requestPath, token, body, expected = [200]) {
  const response = await fetch(`${BASE_URL}${requestPath}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  })
  const text = await response.text()
  let parsed = null
  try { parsed = text ? JSON.parse(text) : null } catch { parsed = text }
  if (!expected.includes(response.status)) {
    throw new Error(`${method} ${requestPath} returned ${response.status}: ${safeDetail(text)}`)
  }
  return { status: response.status, body: parsed }
}

async function login (email) {
  const response = await request('POST', '/odata/v4/auth/login', null, { email, password: PASSWORD }, [200])
  const result = response.body?.value || response.body
  expect('Login returns a bearer token', Boolean(result?.token), `role=${result?.user?.role || result?.user?.role_code || 'unknown'}`)
  return result
}

async function readCollection (token, entity, query) {
  // CAP's OData parser expects URI spaces as `%20`; URLSearchParams emits `+`,
  // which is valid for form encoding but is rejected inside OData expressions.
  const encodedQuery = new URLSearchParams(query).toString().replace(/\+/g, '%20')
  const response = await request('GET', `/odata/v4/bug/${entity}?${encodedQuery}`, token, null, [200])
  return response.body?.value || []
}

async function callAction (token, bugID, action, body = {}, expected = [200]) {
  return request(
    'POST',
    `/odata/v4/bug/Bugs(ID=${bugID},IsActiveEntity=true)/BugService.${action}`,
    token,
    body,
    expected
  )
}

async function readBug (token, bugID) {
  const rows = await readCollection(token, 'Bugs', {
    '$select': 'ID,bugNumber,title,status_code,assignee_ID,nextProcessorUser_ID,nextProcessorRole_code',
    '$filter': `ID eq ${bugID} and IsActiveEntity eq true`,
    '$top': '1'
  })
  if (!rows[0]) throw new Error(`Bug ${bugID} could not be read after transition.`)
  return rows[0]
}

async function expectStatus (token, bugID, expectedStatus, label) {
  const bug = await readBug(token, bugID)
  expect(label, bug.status_code === expectedStatus, `actual=${bug.status_code} expected=${expectedStatus}`)
  return bug
}

async function main () {
  if (!PM_EMAIL || !PASSWORD) throw new Error('Set private IDTS_QA_EMAIL and IDTS_QA_PASSWORD before running this test.')

  console.log('\n====================================================')
  console.log(' IDTS-100 Shared QA lifecycle acceptance')
  console.log(` Marker: ${MARKER}`)
  console.log('====================================================')

  const pm = await login(PM_EMAIL)
  const users = await readCollection(pm.token, 'Users', {
    '$select': 'ID,displayName,email,role_code,active',
    '$filter': 'active eq true',
    '$top': '100'
  })
  const testerUser = users.find(user => user.role_code === 'TESTER')
  const developerUser = users.find(user => user.role_code === 'DEVELOPER' && user.displayName === 'DatDT') ||
    users.find(user => user.role_code === 'DEVELOPER')
  expect('Role matrix contains an active Tester', testerUser?.email)
  expect('Role matrix contains an active Developer', developerUser?.email)

  const tester = await login(testerUser.email)
  const developer = await login(developerUser.email)

  const profiles = await readCollection(pm.token, 'DeveloperProfiles', {
    '$select': 'ID,user_ID,active',
    '$filter': `user_ID eq ${developerUser.ID} and active eq true`,
    '$top': '1'
  })
  expect('Developer has an active DeveloperProfile', profiles[0]?.ID)
  const developerProfileID = profiles[0].ID

  const categories = await readCollection(pm.token, 'ValidDefectCategories', {
    '$select': 'applicationComponentID,defectCategoryID,componentCategoryID',
    '$top': '1'
  })
  expect('At least one active component/category mapping exists', categories[0]?.componentCategoryID)
  const mapping = categories[0]

  const bugID = randomUUID()
  const createDraft = await request('POST', '/odata/v4/bug/Bugs', tester.token, {
    ID: bugID,
    title: `${MARKER} mentor demo lifecycle`,
    description: 'Agent-executed Shared QA acceptance record for mentor readiness.',
    stepsToReproduce: 'Create, assign, process, request information, retest, close, reopen and reassign.',
    actualResult: 'The lifecycle record is created for controlled acceptance verification.',
    expectedResult: 'Every transition is authorized, persisted and audited.',
    priority_code: 'HIGH',
    severity_code: 'MAJOR',
    environment_code: 'QAS',
    applicationComponent_ID: mapping.applicationComponentID,
    defectCategory_ID: mapping.defectCategoryID
  }, [201])
  expect('Tester creates a valid draft bug', createDraft.status === 201 && createDraft.body?.IsActiveEntity === false)
  const activate = await request(
    'POST',
    `/odata/v4/bug/Bugs(ID=${bugID},IsActiveEntity=false)/BugService.draftActivate`,
    tester.token,
    {},
    [201]
  )
  expect('Tester activates the draft through CAP SAVE', activate.status === 201 && activate.body?.IsActiveEntity === true)
  let bug = await expectStatus(pm.token, bugID, 'PENDING_ASSIGNMENT', 'No assignee derives Pending Assignment')
  expect('Pending Assignment has no assignee', !bug.assignee_ID)

  const roleNegative = await callAction(developer.token, bugID, 'assignToDeveloper', {
    assigneeID: developerProfileID,
    note: 'Developer must not self-assign through direct OData.'
  }, [403])
  expect('Developer direct assignment is denied', roleNegative.status === 403)

  await callAction(pm.token, bugID, 'assignToDeveloper', {
    assigneeID: developerProfileID,
    note: 'Assign for IDTS-100 mentor acceptance.'
  })
  bug = await expectStatus(pm.token, bugID, 'ASSIGNED', 'PM assigns the bug to Developer')
  expect('Assigned bug stores the selected assignee', bug.assignee_ID === developerProfileID)

  await callAction(developer.token, bugID, 'markInReview', {})
  await expectStatus(pm.token, bugID, 'IN_REVIEW', 'Assigned Developer marks the bug In Review')
  await callAction(developer.token, bugID, 'startProgress', {})
  await expectStatus(pm.token, bugID, 'IN_PROGRESS', 'Assigned Developer starts progress')

  const missingReason = await callAction(developer.token, bugID, 'requestMoreInformation', { reason: '   ' }, [400])
  expect('Request More Information rejects a blank reason', missingReason.status === 400)
  await callAction(developer.token, bugID, 'requestMoreInformation', { reason: 'Please provide a fresh reproduction note.' })
  await expectStatus(pm.token, bugID, 'NEED_MORE_INFORMATION', 'Developer requests more information')

  await callAction(tester.token, bugID, 'resubmitToDeveloper', { note: 'Fresh reproduction note was added for retest.' })
  await expectStatus(pm.token, bugID, 'ASSIGNED', 'Tester resubmits to the assigned Developer')
  await callAction(developer.token, bugID, 'startProgress', {})
  await callAction(developer.token, bugID, 'resolveBug', { note: 'Controlled acceptance fix completed.' })
  await expectStatus(pm.token, bugID, 'RESOLVED', 'Developer resolves the bug')

  await callAction(tester.token, bugID, 'sendToRetest', {})
  await expectStatus(pm.token, bugID, 'RETEST_REQUIRED', 'Tester sends the bug to Retest Required')
  await callAction(tester.token, bugID, 'closeBug', {})
  await expectStatus(pm.token, bugID, 'CLOSED', 'Tester closes the verified bug')
  await callAction(tester.token, bugID, 'reopenBug', { reason: 'Exercise the reopen branch before mentor demo.' })
  await expectStatus(pm.token, bugID, 'REOPENED', 'Tester reopens the bug for further work')
  await callAction(pm.token, bugID, 'assignToDeveloper', {
    assigneeID: developerProfileID,
    note: 'Return the reopened bug to the assigned Developer before rejection review.'
  })
  await expectStatus(pm.token, bugID, 'ASSIGNED', 'PM returns the reopened bug to Assigned')

  await callAction(developer.token, bugID, 'rejectBug', { reason: 'Exercise correction and reassignment follow-up.' })
  await expectStatus(pm.token, bugID, 'REJECTED', 'Assigned Developer rejects the bug with a reason')
  await callAction(pm.token, bugID, 'moveToPendingAssignment', {})
  bug = await expectStatus(pm.token, bugID, 'PENDING_ASSIGNMENT', 'PM moves rejected bug to Pending Assignment')
  expect('Move to Pending Assignment clears the assignee', !bug.assignee_ID)
  await callAction(pm.token, bugID, 'assignToDeveloper', {
    assigneeID: developerProfileID,
    note: 'Final clean assignment for mentor demonstration.'
  })
  bug = await expectStatus(pm.token, bugID, 'ASSIGNED', 'PM reassigns the corrected bug')

  const history = await readCollection(pm.token, 'HistoryEvents', {
    '$select': 'ID,actionType_code,summary,actor_ID,actorRole_code,createdAt',
    '$filter': `bug_ID eq ${bugID}`,
    '$orderby': 'createdAt asc',
    '$top': '100'
  })
  const expectedActionTypes = [
    'ASSIGN_TO_DEVELOPER', 'MARK_IN_REVIEW', 'START_PROGRESS',
    'REQUEST_MORE_INFORMATION', 'RESUBMIT_TO_DEVELOPER', 'RESOLVE_BUG',
    'SEND_TO_RETEST', 'CLOSE_BUG', 'REOPEN_BUG', 'REJECT_BUG',
    'MOVE_TO_PENDING_ASSIGNMENT'
  ]
  for (const actionType of expectedActionTypes) {
    expect(`History contains exact action type ${actionType}`, history.some(row => row.actionType_code === actionType))
  }

  const notifications = await readCollection(pm.token, 'Notifications', {
    '$select': 'ID,eventType_code,recipient_ID,deliveryStatus_code,createdAt',
    '$filter': `bug_ID eq ${bugID}`,
    '$orderby': 'createdAt desc',
    '$top': '100'
  })
  expect('Lifecycle creates in-app notification side effects', notifications.length > 0, `count=${notifications.length}`)

  const evidence = {
    generatedAt: new Date().toISOString(),
    environment: 'Render Shared QA',
    deployedCommitExpected: 'c953cd7ad3683fc2a891ad3d09708f236f157902',
    marker: MARKER,
    demoBug: {
      ID: bug.ID,
      bugNumber: bug.bugNumber,
      finalStatus: bug.status_code,
      assigneePresent: Boolean(bug.assignee_ID),
      nextProcessorRole: bug.nextProcessorRole_code || null
    },
    roleMatrix: ['PM', 'TESTER', 'DEVELOPER'],
    historyActionTypes: [...new Set(history.map(row => row.actionType_code))].sort(),
    notificationCount: notifications.length,
    checks
  }
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const evidencePath = path.join(EVIDENCE_DIR, 'shared-qa-lifecycle.json')
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2) + '\n')

  console.log(`\nEvidence written: ${evidencePath}`)
  console.log(`Demo bug: ${bug.bugNumber} (${bug.status_code})`)
  console.log(`TOTAL: ${checks.filter(item => item.ok).length} PASS / ${checks.length} checks`)
}

main().catch(error => {
  console.error(`FAIL: ${safeDetail(error.message)}`)
  process.exit(1)
})
