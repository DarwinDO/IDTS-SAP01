'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const script = fs.readFileSync(
  path.join(__dirname, '../btp/cf-login-sso-from-clipboard.ps1'),
  'utf8'
)

assert.match(script, /Get-Clipboard -Raw/)
assert.match(script, /\$passcode \| & cf login --sso \*> \$null/)
assert.match(script, /Set-Clipboard -Value ' '/)
assert.ok(script.includes("(?m)^API endpoint:\\s+(https://api\\.cf\\.[a-z0-9-]+\\.hana\\.ondemand\\.com)\\s*$"))
assert.match(script, /finally \{/)
assert.match(script, /CF_AUTHENTICATED_API=PASS/)
assert.doesNotMatch(script, /--sso-passcode|--password|-p\s+\$passcode/i)
assert.doesNotMatch(script, /Write-(?:Host|Output)[^\r\n]*\$(?:passcode|candidate|trimmed)/i)
assert.doesNotMatch(script, /Set-Content|Add-Content|Out-File|Export-Clixml/i)
assert.doesNotMatch(script, /Browser is opening|Click Copy|Do not paste/i)
assert.ok(script.indexOf('$passcode = $null', script.indexOf('} finally {')) < script.indexOf("Set-Clipboard -Value ' '", script.indexOf('} finally {')))

console.log('CF SSO clipboard helper contract: PASS')
