'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const { shouldStartEmailWorker } = require('../../srv/email/worker')

let passed = 0
function test (name, fn) {
  fn()
  passed += 1
  console.log(`PASS: ${name}`)
}

test('Render/default mode keeps the polling worker', () => {
  const previous = process.env.IDTS_EMAIL_WORKER_MODE
  delete process.env.IDTS_EMAIL_WORKER_MODE
  assert.equal(shouldStartEmailWorker(), true)
  if (previous !== undefined) process.env.IDTS_EMAIL_WORKER_MODE = previous
})

test('BTP scheduler mode disables the polling worker', () => {
  const previous = process.env.IDTS_EMAIL_WORKER_MODE
  process.env.IDTS_EMAIL_WORKER_MODE = 'scheduler'
  assert.equal(shouldStartEmailWorker(), false)
  if (previous === undefined) delete process.env.IDTS_EMAIL_WORKER_MODE
  else process.env.IDTS_EMAIL_WORKER_MODE = previous
})

test('CAP action requires the OutboxProcessor scope', () => {
  const service = fs.readFileSync(path.join(__dirname, '../../srv/service.cds'), 'utf8')
  assert.match(service, /@\(requires: 'OutboxProcessor'\)\s*action processEmailOutbox/)
})

test('XSUAA grants only the outbox scope to the scheduler instance', () => {
  const security = JSON.parse(fs.readFileSync(path.join(__dirname, '../../xs-security.json'), 'utf8'))
  const scope = security.scopes.find(entry => entry.name === '$XSAPPNAME.OutboxProcessor')
  assert.deepEqual(scope['grant-as-authority-to-apps'], [
    '$XSSERVICENAME(idts-sap01-jobscheduler)'
  ])
})

test('MTA binds scheduler and the existing private external service', () => {
  const mta = fs.readFileSync(path.join(__dirname, '../../mta.yaml'), 'utf8')
  assert.match(mta, /IDTS_EMAIL_WORKER_MODE: scheduler/)
  assert.match(mta, /service: jobscheduler/)
  assert.match(mta, /service-name: idts-sap01-external-services/)
})

test('production attachments use the existing AWS S3 binding', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'))
  assert.equal(pkg.cds.requires.attachments['[production]'].kind, 's3')
  assert.equal(pkg.cds.requires.objectStore['[production]'].vcap.name, 'idts-sap01-external-services')
})

console.log(`IDTS-113 outbox scheduler checks: ${passed}/6 PASS`)
