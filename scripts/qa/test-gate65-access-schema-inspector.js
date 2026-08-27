'use strict'

const assert = require('node:assert/strict')
const { inspectAccessDeliveryState } = require('../btp/gate65-access-schema-inspector')

function dbWith ({ deliveryRows, deliveryError = null }) {
  const calls = []
  const values = [12, 34, 7]
  return {
    calls,
    async run (sql) {
      calls.push(sql)
      if (sql.includes('USERACCESSNOTIFICATIONDELIVERIES')) {
        if (deliveryError) throw deliveryError
        return [{ VALUE: deliveryRows }]
      }
      return [{ VALUE: values.shift() }]
    }
  }
}

;(async () => {
  const preDb = dbWith({ deliveryError: Object.assign(new Error('missing'), { code: 259 }) })
  assert.deepEqual(await inspectAccessDeliveryState(preDb, { phase: 'pre' }), {
    users: 12,
    auditEvents: 34,
    onboardingDeliveries: 7,
    accessDeliveries: null,
    accessDeliveryTableExists: false
  })

  const postDb = dbWith({ deliveryRows: 0 })
  assert.deepEqual(await inspectAccessDeliveryState(postDb, { phase: 'post' }), {
    users: 12,
    auditEvents: 34,
    onboardingDeliveries: 7,
    accessDeliveries: 0,
    accessDeliveryTableExists: true
  })

  await assert.rejects(
    inspectAccessDeliveryState(dbWith({ deliveryRows: 1 }), { phase: 'post' }),
    /must be empty/
  )
  await assert.rejects(
    inspectAccessDeliveryState(dbWith({ deliveryRows: 0 }), { phase: 'pre' }),
    /must be absent/
  )
  await assert.rejects(
    inspectAccessDeliveryState(dbWith({ deliveryError: Object.assign(new Error('denied'), { code: 10 }) }), { phase: 'pre' }),
    /inspection failed/
  )
  assert.equal(postDb.calls.every(sql => /^SELECT COUNT\(\*\)/.test(sql)), true)
  assert.equal(postDb.calls.some(sql => /\b(INSERT|UPDATE|DELETE|MERGE|CREATE|DROP|ALTER|TRUNCATE)\b/i.test(sql)), false)

  console.log('Gate 6.5 access schema inspector contract: PASS')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
