'use strict'

const assert = require('assert')
const {
  buildGate,
  calculateInactiveDayQuestions,
  normalizeFlow
} = require('../learning/ownership-gate')

function main () {
  assert.strictEqual(calculateInactiveDayQuestions('2026-07-13', '2026-07-13'), 0)
  assert.strictEqual(calculateInactiveDayQuestions('2026-07-13', '2026-07-10'), 2)
  assert.strictEqual(calculateInactiveDayQuestions('2026-07-20', '2026-07-01'), 4)
  console.log('  PASS  inactivity count starts after the last ownership-code day and caps at four')

  const cappedGate = buildGate({ member: 'nhant', flow: 'qa', date: '2026-07-20', lastActivity: '2026-07-01' })
  assert.strictEqual(cappedGate.questionCount, 7)
  assert.strictEqual(cappedGate.questions.length, 7)
  console.log('  PASS  the first daily gate contains all seven questions at the inactivity cap')

  const gate = buildGate({ member: 'donhv', flow: 'authentication', date: '2026-07-13', lastActivity: '2026-07-10' })
  assert.strictEqual(gate.baseQuestions, 3)
  assert.strictEqual(gate.inactiveDayQuestions, 2)
  assert.strictEqual(gate.additionalFlowQuestions, 0)
  assert.strictEqual(gate.questions.length, 5)
  assert.deepStrictEqual(gate, buildGate({ member: 'donhv', flow: 'authentication', date: '2026-07-13', lastActivity: '2026-07-10' }))
  console.log('  PASS  same member, flow, and date produce one reproducible question set')

  const newFlowGate = buildGate({ member: 'datdt', flow: 'dashboard', date: '2026-07-13', additionalFlow: true })
  assert.strictEqual(newFlowGate.questions.length, 5)
  assert.strictEqual(newFlowGate.additionalFlowQuestions, 2)
  assert.strictEqual(normalizeFlow('dashboard/history'), 'dashboard')
  console.log('  PASS  a new flow adds two questions and accepts the documented alias')

  assert.throws(() => buildGate({ member: 'unknown', flow: 'ai', date: '2026-07-13' }), /Unknown member/)
  assert.throws(() => buildGate({ member: 'nhant', flow: 'unknown', date: '2026-07-13' }), /Unknown flow/)
  assert.throws(() => buildGate({ member: 'nhant', flow: 'qa', date: '2026-07-13', lastActivity: '2026-07-14' }), /cannot be after date/)
  console.log('  PASS  invalid member, flow, and future activity date are rejected safely')

  console.log('\nOwnership Gate runner: 5 PASS / 0 FAIL')
}

try {
  main()
} catch (error) {
  console.error('Ownership Gate runner: FAIL')
  console.error(error.stack || error)
  process.exitCode = 1
}
