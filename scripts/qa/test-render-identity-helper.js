'use strict'

const assert = require('node:assert/strict')
const { resolveTargets, updateQaEmails } = require('../render/update-qa-emails-from-env')
const { resolveTargets: resolvePasswordTargets } = require('../render/set-qa-passwords-from-env')

const privateFixture = {
  IDTS_QA_DONHV_EMAIL: ' Lead@Example.test ',
  IDTS_QA_SANGVN_EMAIL: 'developer-one@example.test',
  IDTS_QA_DATDT_EMAIL: 'developer-two@example.test',
  IDTS_QA_NHANT_EMAIL: 'tester@example.test'
}

async function main () {
  const targets = resolveTargets(privateFixture)
  assert.equal(targets.length, 4)
  assert.equal(targets[0].email, 'lead@example.test')
  assert.equal(new Set(targets.map(target => target.id)).size, 4)

  assert.throws(() => resolveTargets({}), /Missing required QA email variables/)
  assert.throws(() => resolveTargets({ ...privateFixture, IDTS_QA_DATDT_EMAIL: 'not-an-email' }), /Invalid email address/)
  assert.throws(() => resolveTargets({ ...privateFixture, IDTS_QA_DATDT_EMAIL: 'developer-one@example.test' }), /must be unique/)

  const passwordTargets = withTemporaryEnv({ IDTS_QA_SHARED_PASSWORD: 'private-test-value' }, resolvePasswordTargets)
  assert.equal(passwordTargets.length, 4)
  assert.ok(passwordTargets.every(target => target.id && !target.email))

  const successfulClient = fakeClient()
  const result = await updateQaEmails(successfulClient, targets)
  assert.equal(result.updatedUsers.length, 4)
  assert.deepEqual(successfulClient.commands.slice(0, 2), ['begin', 'select'])
  assert.equal(successfulClient.commands.at(-1), 'commit')
  assert.ok(!successfulClient.commands.includes('rollback'))

  const failingClient = fakeClient({ failOnUpdate: 2 })
  await assert.rejects(updateQaEmails(failingClient, targets), /controlled update failure/)
  assert.equal(failingClient.commands.at(-1), 'rollback')
  assert.ok(!failingClient.commands.includes('commit'))

  console.log('Render QA identity helper checks: PASS')
}

function fakeClient ({ failOnUpdate } = {}) {
  let updateCount = 0
  return {
    commands: [],
    async query (sql) {
      const normalized = sql.trim().toLowerCase()
      const command = normalized.split(/\s+/)[0]
      this.commands.push(command)
      if (normalized.startsWith('select id, displayname')) {
        return {
          rowCount: 4,
          rows: Array.from({ length: 4 }, (_, index) => ({
            id: `user-${index}`,
            displayname: `User ${index}`,
            role_code: index === 0 ? 'PM' : 'DEVELOPER',
            active: true,
            passwordhash: 'stored-hash'
          }))
        }
      }
      if (normalized.startsWith('select id')) return { rowCount: 0, rows: [] }
      if (normalized.startsWith('update idts_cap_users')) {
        updateCount += 1
        if (failOnUpdate === updateCount) throw new Error('controlled update failure')
        return { rowCount: 1, rows: [{ displayname: `User ${updateCount}`, role_code: 'DEVELOPER', active: true }] }
      }
      if (normalized.startsWith('update idts_cap_authsessions')) return { rowCount: 3, rows: [] }
      return { rowCount: 0, rows: [] }
    }
  }
}

function withTemporaryEnv (values, callback) {
  const previous = {}
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key]
    process.env[key] = value
  }
  try {
    return callback()
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

main().catch(error => {
  console.error(`Render QA identity helper checks: FAIL - ${error.message}`)
  process.exit(1)
})
