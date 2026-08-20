'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const source = fs.readFileSync(path.join(__dirname, '../btp/create-user-admin-invitation-ups.ps1'), 'utf8')

assert.match(source, /idts-user-admin-invitation-config/)
assert.match(source, /RandomNumberGenerator]::Create/)
assert.match(source, /\.GetBytes\(\$bytes\)/)
assert.match(source, /\.Dispose\(\)/)
assert.match(source, /RedirectStandardInput = \$true/)
assert.match(source, /\.Arguments = 'create-user-provided-service idts-user-admin-invitation-config/)
assert.doesNotMatch(source, /ArgumentList\.Add/)
assert.match(source, /invitationSigningKey,invitationBaseUrl/)
assert.match(source, /\[Array]::Clear/)
assert.match(source, /M3E_INVITATION_UPS=PASS;COUNT=1;BINDINGS=0/)
assert.doesNotMatch(source, /cf set-env|clientsecret|password|api[_-]?key/i)
assert.doesNotMatch(source, /Write-Output .*signingKey|Write-Output .*baseUrl/)

console.log('User Administration invitation UPS runner: PASS')
