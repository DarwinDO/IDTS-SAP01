'use strict'

process.env.CDS_TEST_FAKE = 'true'
process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'
process.env.CDS_PLUGIN_UI5_ACTIVE = 'false'

const Module = require('module')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return originalResolve.call(this, request, parent, isMain, options)
}

const cds = require('@sap/cds')
const cdsTest = require('@cap-js/cds-test')
const { SELECT } = cds.ql

async function main () {
  const test = cdsTest('serve', 'srv/service.cds', 'srv/auth.cds', '--in-memory?').in(process.cwd())
  await test

  const db = await cds.connect.to('db')
  const authBefore = (await db.run(SELECT.from('idts.cap.AuthSessions').columns('ID'))).length
  const authResponse = await fetch(`${test.url}/odata/v4/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'donhv@example.local', password: 7 })
  })
  const authBody = await authResponse.text()
  const authError = JSON.parse(authBody).error
  const authAfter = (await db.run(SELECT.from('idts.cap.AuthSessions').columns('ID'))).length

  const attachmentBefore = (await db.run(SELECT.from('idts.cap.Bugs.attachments').columns('ID'))).length
  const bugID = '90000000-0000-0000-0000-000000000001'
  const attachmentResponse = await fetch(`${test.url}/odata/v4/bug/Bugs(ID=${bugID},IsActiveEntity=true)/attachments`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fileName: 'anonymous-blocked.txt', mediaType: 'text/plain' })
  })
  const attachmentAfter = (await db.run(SELECT.from('idts.cap.Bugs.attachments').columns('ID'))).length
  const result = {
    auth: {
      status: authResponse.status,
      before: authBefore,
      after: authAfter,
      safeContractError: authError?.code === 'INVALID_LOGIN_REQUEST' && authError?.message === 'The sign-in request is invalid.',
      unsafeDetailExposed: /stack|srv[\\/]auth|node_modules|ASSERT_DATA_TYPE|String\(255\)|Value 7/i.test(authBody)
    },
    attachment: {
      status: attachmentResponse.status,
      before: attachmentBefore,
      after: attachmentAfter
    }
  }
  process.stdout.write(`IDTS110_RESULT ${JSON.stringify(result)}\n`)
  await cds.shutdown()

  if (result.auth.status !== 400 || result.auth.after !== result.auth.before || !result.auth.safeContractError || result.auth.unsafeDetailExposed ||
      ![401, 403].includes(result.attachment.status) || result.attachment.after !== result.attachment.before) process.exitCode = 1
}

main().catch(async error => {
  console.error(error.stack || error)
  try { await cds.shutdown() } catch {}
  process.exitCode = 1
})
