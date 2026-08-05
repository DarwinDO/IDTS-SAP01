'use strict'

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const {
  assertBugOpenForMutation,
  assertBugCreatePermission
} = require('../../srv/bug-service/permissions')
const {
  ensureRetestOwnerAction,
  resolveColumn
} = require('../db/migrate-idts122-retest-owner-hana')

const ROOT = path.resolve(__dirname, '..', '..')
const RESULTS = []

function request () {
  return {
    reject (code, message, target) {
      const error = new Error(message)
      error.code = code
      error.target = target
      throw error
    }
  }
}

function record (label, pass, detail = '') {
  RESULTS.push({ label, pass, detail })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label}${detail ? ` | ${detail}` : ''}`)
}

async function expectReject (label, action, code) {
  try {
    await action()
    record(label, false, 'request unexpectedly succeeded')
  } catch (error) {
    record(label, Number(error.code) === code, `code=${error.code || 'n/a'}`)
  }
}

async function main () {
  console.log('\n==============================================')
  console.log(' IDTS-122 Retest Ownership Regression')
  console.log('==============================================')

  record('closed mutation guard is exported', typeof assertBugOpenForMutation === 'function')

  if (typeof assertBugOpenForMutation === 'function') {
    await expectReject(
      'closed Bug rejects ordinary mutation',
      () => assertBugOpenForMutation(request(), { status_code: 'CLOSED' }),
      409
    )
    assertBugOpenForMutation(request(), { status_code: 'REOPENED' })
    record('reopened Bug permits ordinary mutation', true)
  }

  await expectReject(
    'PM cannot create Bug',
    () => assertBugCreatePermission(request(), { ID: 'pm', role_code: 'PM' }),
    403
  )

  const schema = fs.readFileSync(path.join(ROOT, 'db', 'schema.cds'), 'utf8')
  const service = fs.readFileSync(path.join(ROOT, 'srv', 'service.cds'), 'utf8')
  const runtime = fs.readFileSync(path.join(ROOT, 'srv', 'service.js'), 'utf8')
  const actions = fs.readFileSync(path.join(ROOT, 'srv', 'bug-service', 'actions.js'), 'utf8')
  const content = fs.readFileSync(path.join(ROOT, 'srv', 'bug-service', 'content.js'), 'utf8')
  const history = fs.readFileSync(path.join(ROOT, 'srv', 'bug-service', 'history.js'), 'utf8')
  const constants = fs.readFileSync(path.join(ROOT, 'srv', 'bug-service', 'constants.js'), 'utf8')
  const actionTypes = fs.readFileSync(path.join(ROOT, 'db', 'data', 'idts.cap-ActionTypes.csv'), 'utf8')
  const drafts = fs.readFileSync(path.join(ROOT, 'srv', 'bug-service', 'drafts.js'), 'utf8')
  const readModels = fs.readFileSync(path.join(ROOT, 'srv', 'bug-service', 'read-models.js'), 'utf8')
  const aiFiles = [
    'assignment-explanation.js',
    'bug-summary.js',
    'classification-apply.js',
    'classification-suggestion.js',
    'duplicate-confirmation.js',
    'duplicate-detection.js',
    'review.js'
  ].map(file => fs.readFileSync(path.join(ROOT, 'srv', 'ai', file), 'utf8'))
  const migration = fs.readFileSync(path.join(ROOT, 'scripts', 'db', 'migrate-idts122-retest-owner-hana.js'), 'utf8')
  const listActions = fs.readFileSync(path.join(ROOT, 'app', 'bug-management-ui', 'webapp', 'ext', 'actions', 'BugListActions.js'), 'utf8')
  const smartAssignment = fs.readFileSync(path.join(ROOT, 'app', 'bug-management-ui', 'webapp', 'ext', 'fragment', 'SmartAssignmentSection.fragment.xml'), 'utf8')
  const commentsFragment = fs.readFileSync(path.join(ROOT, 'app', 'bug-management-ui', 'webapp', 'ext', 'fragment', 'CommentsSection.fragment.xml'), 'utf8')
  const actionAnnotations = fs.readFileSync(path.join(ROOT, 'app', 'bug-management-ui', 'annotations', 'actions.cds'), 'utf8')
  const capabilityAnnotations = fs.readFileSync(path.join(ROOT, 'app', 'bug-management-ui', 'annotations', 'capabilities.cds'), 'utf8')

  record('Bugs has separate nullable retestOwner association', /retestOwner\s*:\s*Association\s+to\s+Users\s*;/.test(schema))
  record('service exposes PM retest-owner reassignment', /action\s+reassignRetestOwner\s*\(/.test(service))
  record('runtime registers retest-owner reassignment', /this\.on\(['"]reassignRetestOwner['"]/.test(runtime))
  record('closed active Bug cannot enter draft edit', /this\.before\(['"]EDIT['"],\s*Bugs,[\s\S]*assertBugOpenForMutation\(req, bug\)/.test(runtime))
  record('Bug DELETE has a backend guard', /this\.before\(['"]DELETE['"],\s*Bugs,[\s\S]*assertBugOpenForMutation\(req, bug\)/.test(runtime))
  record('Create Bug UI is Tester-only', /role_code\s*===\s*["']TESTER["']/.test(listActions) && !/role_code\s*===\s*["']PM["']/.test(listActions))
  record('closed bound comment is guarded', /async function addComment[\s\S]*assertBugOpenForMutation\(req, bug\)/.test(actions))
  record('closed lifecycle is guarded except reopen', /options\.actionType\s*!==\s*ACTION\.REOPEN_BUG[\s\S]*assertBugOpenForMutation/.test(actions))
  record('closed comment and attachment entity writes are guarded', (content.match(/assertBugOpenForMutation\(req, bug\)/g) || []).length >= 3 && /prepareCommentMutation/.test(runtime))
  record('closed draft patch and save are guarded', (drafts.match(/assertBugOpenForMutation\(req, (?:currentDraft|draft)\)/g) || []).length >= 2)
  record('closed collaboration capabilities are disabled', /row\.canAddComment\s*=\s*COMMENT_ROLES\.has\(actorRole\)\s*&&\s*!isClosed/.test(readModels))
  record('closed AI aggregate mutations are guarded', aiFiles.every(source => /assertBugOpenForMutation\(req,/.test(source)))
  record('closed assignment picker is disabled', /showValueHelp="\{=[^\"]*status_code[^\"]*CLOSED/.test(smartAssignment) && /enabled="\{=[^\"]*status_code[^\"]*CLOSED/.test(smartAssignment))
  record('comment controls use backend capability', (commentsFragment.match(/canAddComment/g) || []).length >= 2)
  record('standard Edit is hidden and attachment mutations are restricted', /UI\.UpdateHidden[\s\S]*canEdit/.test(actionAnnotations) && /NavigationRestrictions[\s\S]*canEdit/.test(capabilityAnnotations))
  record('HANA migration is dry-run by default', /const execute = process\.argv\.includes\(['"]--execute['"]\)/.test(migration) && /if \(!execute\)/.test(migration))
  record('HANA migration is additive and preserves existing owners', /ALTER TABLE[\s\S]*ADD/.test(migration) && /retestOwner[\s\S]*IS NULL/.test(migration) && !/DROP\s+(?:TABLE|COLUMN)/i.test(migration))
  record('HANA migration backfills active and draft targets with unresolved counts', /for \(const target of resolvedTargets\)[\s\S]*backfilledRowCount[\s\S]*unresolvedOwnerCount/.test(migration))
  record('HANA migration inserts the audit action type narrowly and idempotently', /ensureRetestOwnerAction/.test(migration) && /SELECT[\s\S]*INSERT INTO/.test(migration) && /REASSIGN_RETEST_OWNER/.test(migration))
  record('HANA migration resolves HDI physical column names before raw SQL', /async function resolveColumn/.test(migration) && /requireColumn\(db, table, ['"]reporter_ID['"]/.test(migration) && /physicalColumnName\s*=\s*columnName\.toUpperCase\(\)/.test(migration))
  const alterIndex = migration.indexOf('ALTER TABLE')
  const userColumnsIndex = migration.indexOf('const userColumns')
  const actionColumnsIndex = migration.indexOf('const actionColumns')
  record('HANA migration validates required columns before additive DDL', alterIndex >= 0 && userColumnsIndex >= 0 && actionColumnsIndex >= 0 && userColumnsIndex < alterIndex && actionColumnsIndex < alterIndex)
  record('HANA migration wraps code-list insert and backfill DML in one transaction', /db\.tx\(async tx =>[\s\S]*ensureRetestOwnerAction\(tx[\s\S]*UPDATE/.test(migration))
  record('HANA migration creates the unquoted-CDS-equivalent physical column', /ALTER TABLE[\s\S]*quoteIdentifier\(physicalColumnName\)[\s\S]*NVARCHAR\(36\)/.test(migration))
  record('HANA migration requires a single operator and documents sequential rerun', /Execute from one operator only/.test(migration) && /sequential rerun is safe/.test(migration))
  record('HANA migration executes when transported through node stdin', /const invokedFromStdin = process\.argv\[1\] === ['"]-['"]/.test(migration) && /require\.main === module \|\| invokedFromStdin/.test(migration))
  record('HANA migration exports main for explicit remote invocation', /module\.exports\s*=\s*\{[\s\S]*\bmain,/.test(migration))
  const stdinDryRun = spawnSync(process.execPath, ['-'], { input: migration, encoding: 'utf8' })
  record('stdin transport runs the helper instead of returning an empty success', stdinDryRun.status === 0 && /"mode": "dry-run"/.test(stdinDryRun.stdout))

  const resolvedPhysicalColumn = await resolveColumn({
    run: async () => [{ COLUMN_NAME: 'REPORTER_ID' }]
  }, 'IDTS_CAP_BUGS', 'reporter_ID')
  record('HANA column resolver returns the physical catalog name', resolvedPhysicalColumn === 'REPORTER_ID')

  const actionSql = []
  const actionInserted = await ensureRetestOwnerAction({
    async run (sql) {
      actionSql.push(sql)
      return actionSql.length === 1 ? [] : 1
    }
  }, 'IDTS_CAP_ACTIONTYPES', {
    code: 'CODE',
    name: 'NAME',
    descr: 'DESCR',
    sortOrder: 'SORTORDER',
    active: 'ACTIVE',
    criticality: 'CRITICALITY'
  })
  record('action migration SQL uses resolved HANA column names', actionInserted === true && actionSql.every(sql => !/"(?:code|name|descr|sortOrder|active|criticality)"/.test(sql)))
  record('retest reassignment has dedicated audit and notification', /REASSIGN_RETEST_OWNER/.test(constants) && /REASSIGN_RETEST_OWNER/.test(actionTypes) && /ACTION\.REASSIGN_RETEST_OWNER/.test(actions) && /writeNotificationRecord\(tx/.test(actions))
  record('retest-owner history displays user names', /case ['"]retestOwner['"]:[\s\S]*displayUserName/.test(history))

  const failures = RESULTS.filter(result => !result.pass)
  console.log(`\nChecks: ${RESULTS.length} | Passed: ${RESULTS.length - failures.length} | Failed: ${failures.length}`)
  if (failures.length) process.exitCode = 1
}

main().catch(error => {
  console.error(error?.stack || error)
  process.exitCode = 1
})
