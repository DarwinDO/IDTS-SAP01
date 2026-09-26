'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')

function read (relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

const packageJson = JSON.parse(read('package.json'))

assert.equal(
  packageJson.scripts['btp:login:sso'],
  'powershell -NoProfile -ExecutionPolicy Bypass -File scripts/btp/cf-login-sso-from-clipboard.ps1'
)
assert.equal(
  packageJson.scripts['dev:ai:preflight:btp'],
  'powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev/run-cds-watch-real-ai.ps1 -PreflightOnly'
)
assert.equal(
  packageJson.scripts['dev:ai:watch:btp'],
  'powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev/run-cds-watch-real-ai.ps1'
)

const ssoHelper = read('scripts/btp/cf-login-sso-from-clipboard.ps1')
assert.match(ssoHelper, /cf login --sso/i)
assert.match(ssoHelper, /Get-Clipboard/)
assert.match(ssoHelper, /Set-Clipboard -Value ['"]\s*['"]/)

const aiHelper = read('scripts/dev/run-cds-watch-real-ai.ps1')
assert.match(aiHelper, /Join-Path \$PSScriptRoot '\.\.\\\.\.'/)
assert.match(aiHelper, /Resolve-Path/)
assert.doesNotMatch(aiHelper, /E:\\IDTS-SAP01/i)
assert.match(aiHelper, /idts-sap01-ai-gateway/)
assert.match(aiHelper, /gatewayApiKey.*aiGatewayApiKey.*AI_GATEWAY_API_KEY/s)
assert.match(aiHelper, /IDTS_REAL_AI_WATCH=PREFLIGHT_READY/)
assert.match(aiHelper, /AI_REQUEST_SENT=false/)
assert.match(aiHelper, /Credential\s*: available in memory \(value hidden\)/)
assert.match(aiHelper, /npm run watch-bug-management-ui/)
assert.match(aiHelper, /finally\s*{/)
assert.match(aiHelper, /SetEnvironmentVariable\(\$entry\.Key, \$previous\[\$entry\.Key\], 'Process'\)/)
assert.match(aiHelper, /\$gatewayKey\s*=\s*\$null/)
assert.match(aiHelper, /\$runtimeConfig\.Clear\(\)/)
assert.doesNotMatch(aiHelper, /Write-(?:Output|Host)[^\n]*(?:gatewayApiKey|AI_GATEWAY_API_KEY|VCAP_SERVICES)/i)

console.log('BTP local helper checks passed: SSO and real-AI watch commands are portable and secret-safe.')
