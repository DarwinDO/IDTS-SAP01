'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const cdsSource = fs.readFileSync(path.join(root, 'srv/user-admin.cds'), 'utf8')

const required = [
  'type ActiveUserSummary',
  'type ActiveUserDetails',
  'action searchActiveUsers(',
  'action readActiveUserDetails('
]
for (const marker of required) assert.ok(cdsSource.includes(marker), marker)

const activeUserContract = cdsSource.slice(cdsSource.indexOf('type ActiveUserSummary'))
for (const forbidden of [
  'identityOrigin',
  'identityIssuer',
  'identitySubject',
  'identityKeyHash',
  'identityPlatformUserId'
]) {
  assert.equal(activeUserContract.includes(forbidden), false, forbidden)
}

console.log('IDTS Active Users contract: PASS')
