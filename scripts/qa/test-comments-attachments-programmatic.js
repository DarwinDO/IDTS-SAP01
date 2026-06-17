'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const fs = require('fs')
const path = require('path')
const Module = require('module')
const _originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return _originalResolve.call(this, request, parent, isMain, options)
}

const cds = require('@sap/cds')

const BUG_ID = '90000000-0000-0000-0000-000000000001'
const TMP_DIR = path.join(process.cwd(), '.tmp')
const DB_FILE = path.join(TMP_DIR, 'qa-comments-attachments.sqlite')

function makeUser () {
  return new cds.User({ id: 'NhanT', roles: ['TESTER', 'authenticated-user'] })
}

async function dispatchCreate (srv, entity, data) {
  const req = new cds.Request({
    method: 'POST',
    event: 'CREATE',
    target: entity,
    query: INSERT.into(entity).entries(data),
    data,
    user: makeUser()
  })
  return srv.dispatch(req)
}

async function main () {
  fs.mkdirSync(TMP_DIR, { recursive: true })
  if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE)

  console.log('')
  console.log('==============================================')
  console.log(' IDTS Comments + Local File Persistence Programmatic QA')
  console.log(' ' + new Date().toISOString())
  console.log('==============================================')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: DB_FILE } })
  await cds.deploy(csn).to(db)
  const srv = await cds.serve('BugService').from(csn)

  const runId = Date.now()
  const commentText = `QA programmatic comment ${runId}`
  console.log('')
  console.log('SC-CA-P01 Add comment via bound action')
  const commentReq = new cds.Request({
    method: 'POST',
    event: 'addComment',
    target: srv.entities.Bugs,
    params: [{ ID: BUG_ID, IsActiveEntity: true }],
    data: { content: commentText },
    user: makeUser()
  })
  await srv.dispatch(commentReq)

  const commentRows = await cds.tx({ user: makeUser() }, tx =>
    tx.run(
      SELECT.from(srv.entities.Comments)
        .columns('ID', 'content', 'author_ID')
        .where({ bug_ID: BUG_ID, content: commentText })
    )
  )
  if (!commentRows.length) throw new Error('Programmatic comment verification failed.')
  console.log(`  PASS  comment row created: ${commentRows[0].ID}`)

  console.log('')
  console.log('SC-CA-P02 Re-open same SQLite file to prove persistence')
  if (typeof db.disconnect === 'function') await db.disconnect()

  const reopenedDb = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: DB_FILE } })
  const reopenedComments = await reopenedDb.run(
    SELECT.from('idts.cap.Comments').columns('ID').where({ bug_ID: BUG_ID, content: commentText })
  )
  if (!reopenedComments.length) throw new Error('Re-opened DB did not retain the comment row.')
  console.log('  PASS  comment row still exists after reconnecting to the same SQLite file')

  console.log('')
  console.log('SC-CA-P03 Attachment verification note')
  console.log('  INFO  Direct programmatic CREATE on draft composition children is intentionally rejected by CAP (DRAFT_MODIFICATION_ONLY_VIA_ROOT).')
  console.log('  INFO  Attachment upload/persistence/history is verified by scripts/qa/test-comments-attachments.ps1 against the real draft HTTP flow.')

  console.log('')
  console.log(`DB file: ${DB_FILE}`)
  console.log(`Comment marker: ${commentText}`)
  console.log('RESULT: PASS')
}

main().catch(err => {
  console.error('RESULT: FAIL')
  console.error(err.message)
  process.exit(1)
})
