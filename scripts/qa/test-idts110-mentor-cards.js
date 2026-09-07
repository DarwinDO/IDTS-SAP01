#!/usr/bin/env node

'use strict'

const assert = require('node:assert/strict')
const { loadModels } = require('./generate-idts110-mentor-cards')

const models = loadModels()
assert.equal(models.length, 278)
assert.deepEqual(models.map(model => model.mentorNumber), Array.from({ length: 278 }, (_, index) => index + 1))
assert.equal(new Set(models.map(model => model.caseKey)).size, 278)
const statuses = models.reduce((acc, model) => { const result = model.visibleText.match(/^Result: (.+)$/m)?.[1]; acc[result] = (acc[result] || 0) + 1; return acc }, {})
assert.deepEqual(statuses, { PASS: 265, BLOCKED: 13 })
for (const model of models) {
  assert.match(model.visibleText, new RegExp(`^Case ${model.mentorNumber}\\n`))
  assert.doesNotMatch(model.visibleText, /IDTS110-|\bUT-[A-Z0-9]+(?:-[A-Z0-9]+)*/)
  assert.doesNotMatch(model.visibleText, /Mapping Only|undefined|Bearer\s+\w+|\b[A-Za-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/)
  assert.doesNotMatch(model.html, /<script[\s>]/i)
}
const blocked = models.filter(model => /^Result: BLOCKED$/m.test(model.visibleText))
assert.equal(blocked.length, 13)
assert.ok(blocked.every(model => /missing|unavailable|Cloud Foundry|precondition/i.test(model.visibleText)))
console.log('IDTS-110 mentor-card generator contract: PASS (278-card bijection, truthful totals, sanitization)')
