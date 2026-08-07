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
  const { sanitizeLoginContractError } = require('../../srv/auth')
  const unrelated = { code: 'ASSERT_DATA_TYPE', target: 'password', message: 'original' }
  let forwarded
  sanitizeLoginContractError(unrelated, { method: 'POST', originalUrl: '/odata/v4/auth/logout' }, null, error => { forwarded = error })
  if (unrelated.code !== 'ASSERT_DATA_TYPE' || unrelated.message !== 'original') {
    throw new Error('The login sanitizer rewrote an unrelated AuthService event')
  }
  if (forwarded !== unrelated) throw new Error('The sanitizer did not forward an unrelated error')

  const test = cdsTest('serve', 'srv/service.cds', 'srv/auth.cds', '--in-memory?').in(process.cwd())
  await test

  const db = await cds.connect.to('db')
  const csn = await cds.load(['db/schema.cds', 'srv/service.cds', 'srv/auth.cds'])
  await cds.deploy(csn).to(db)
  const cases = [
    { name: 'password', payload: { email: 'user@example.invalid', password: 70039 }, sentinel: '70039' },
    { name: 'email', payload: { email: 39007, password: 'not-a-real-password' }, sentinel: '39007' }
  ]
  const results = []
  for (const current of cases) {
    const before = (await db.run(SELECT.from('idts.cap.AuthSessions').columns('ID'))).length
    const response = await fetch(`${test.url}/odata/v4/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(current.payload)
    })
    const body = await response.text()
    const error = JSON.parse(body).error
    const after = (await db.run(SELECT.from('idts.cap.AuthSessions').columns('ID'))).length
    const safe = error?.code === 'INVALID_LOGIN_REQUEST' &&
      error?.message === 'The sign-in request is invalid.' &&
      error?.target === undefined && error?.details === undefined && error?.path === undefined &&
      !new RegExp(`stack|srv[\\\\/]auth|node_modules|ASSERT_DATA_TYPE|String\\(255\\)|${current.sentinel}`, 'i').test(body)
    results.push({
      name: current.name,
      status: response.status,
      before,
      after,
      safe,
      publicError: { code: error?.code, message: error?.message, keys: Object.keys(error || {}).sort() }
    })
  }

  process.stdout.write(`IDTS39_RESULT ${JSON.stringify(results)}\n`)
  await cds.shutdown()

  if (results.some(result => result.status !== 400 || result.before !== result.after || !result.safe)) process.exitCode = 1
}

main().catch(async error => {
  console.error(error.stack || error)
  try { await cds.shutdown() } catch {}
  process.exitCode = 1
})
