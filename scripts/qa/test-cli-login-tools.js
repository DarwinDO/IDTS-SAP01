'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '../..')
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

assert.equal(
  packageJson.scripts['btp:login:cf'],
  'powershell -NoProfile -ExecutionPolicy Bypass -File scripts/btp/cf-login-sso-from-clipboard.ps1'
)
assert.equal(
  packageJson.scripts['btp:login:cli'],
  'powershell -NoProfile -ExecutionPolicy Bypass -File scripts/btp/btp-login-browser-sso.ps1'
)

const cfScript = fs.readFileSync(
  path.join(root, 'scripts/btp/cf-login-sso-from-clipboard.ps1'),
  'utf8'
)
const btpScript = fs.readFileSync(
  path.join(root, 'scripts/btp/btp-login-browser-sso.ps1'),
  'utf8'
)

assert.match(cfScript, /Get-Clipboard -Raw/)
assert.match(cfScript, /Start-Process \$passcodeUrl/)
assert.ok(cfScript.includes("(?m)^API endpoint:\\s+(https://api\\.cf\\.[a-z0-9-]+\\.hana\\.ondemand\\.com)\\s*$"))
assert.match(cfScript, /\$passcode \| & cf login --sso \*> \$null/)
assert.match(cfScript, /& cf apps \*> \$null/)
assert.match(cfScript, /Set-Clipboard -Value ' '/)
assert.match(cfScript, /function Clear-SensitiveClipboard/)
assert.match(cfScript, /for \(\$attempt = 0; \$attempt -lt 5; \$attempt\+\+\)/)
assert.match(cfScript, /Get-Clipboard -Raw -ErrorAction SilentlyContinue/)
assert.match(cfScript, /throw 'CF clipboard cleanup failed'/)
assert.ok(
  cfScript.indexOf('$passcode = $null', cfScript.indexOf('} finally {')) <
    cfScript.indexOf('Clear-SensitiveClipboard', cfScript.indexOf('} finally {'))
)

assert.match(btpScript, /System\.Diagnostics\.ProcessStartInfo/)
assert.match(btpScript, /RedirectStandardInput\s*=\s*\$true/)
assert.match(btpScript, /RedirectStandardOutput\s*=\s*\$true/)
assert.match(btpScript, /RedirectStandardError\s*=\s*\$true/)
assert.match(btpScript, /UseShellExecute\s*=\s*\$false/)
assert.match(btpScript, /Arguments\s*=\s*'login --sso'/)
assert.match(btpScript, /StandardInput\.WriteLine\(\)/)
assert.match(btpScript, /& btp --format json list accounts\/subaccount \*> \$null/)
assert.match(btpScript, /BTP_LOGIN=PASS/)

for (const script of [cfScript, btpScript]) {
  assert.doesNotMatch(script, /--sso-passcode|--password|-p\s+\$(?:passcode|password)/i)
  assert.doesNotMatch(script, /Write-(?:Host|Output)[^\r\n]*\$(?:passcode|candidate|trimmed|token|password)/i)
  assert.doesNotMatch(script, /Set-Content|Add-Content|Out-File|Export-Clixml/i)
}

console.log('IDTS CLI login tools contract: PASS')
