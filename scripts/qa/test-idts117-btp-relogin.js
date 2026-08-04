'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const root = path.resolve(__dirname, '../..')

function read (relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function readJson (relativePath) {
  return JSON.parse(read(relativePath))
}

const router = readJson('app/router/xs-app.json')
const logoutPage = router.logout?.logoutPage

assert.equal(router.logout?.logoutEndpoint, '/do/logout')
assert.equal(logoutPage, '/logged-out.html')

const publicLogoutRoute = router.routes.find(route => route.source === '^/logged-out\\.html$')
assert.ok(publicLogoutRoute, 'AppRouter must expose a dedicated logged-out page')
assert.equal(publicLogoutRoute.authenticationType, 'none')
assert.equal(publicLogoutRoute.localDir, 'resources')

const protectedLoginRoute = router.routes.find(route => route.source === '^/login\\.html$')
assert.ok(protectedLoginRoute, 'AppRouter must expose a protected XSUAA login bridge')
assert.equal(protectedLoginRoute.authenticationType, 'xsuaa')
assert.equal(protectedLoginRoute.localDir, 'resources')

const catchAllRouteIndex = router.routes.findIndex(route => route.source === '^(.*)$')
const logoutRouteIndex = router.routes.indexOf(publicLogoutRoute)
assert.ok(logoutRouteIndex >= 0 && logoutRouteIndex < catchAllRouteIndex)
const loginRouteIndex = router.routes.indexOf(protectedLoginRoute)
assert.ok(loginRouteIndex >= 0 && loginRouteIndex < catchAllRouteIndex)

const loggedOutHtml = read('app/router/resources/logged-out.html')
assert.match(loggedOutHtml, /You have signed out of IDTS\./)
assert.match(loggedOutHtml, /href="\/login\.html"/)
assert.doesNotMatch(loggedOutHtml, /odata\/v4\/auth\/login|password|sessionStorage/i)

const loginHtml = read('app/router/resources/login.html')
assert.match(loginHtml, /http-equiv="refresh"/i)
assert.match(loginHtml, /url=\/idtsbugmanagementui\/index\.html/i)
assert.doesNotMatch(loginHtml, /password|sessionStorage|localStorage/i)

const guard = read('app/bug-management-ui/webapp/auth-guard.js')
assert.match(guard, /window\.location\.replace\("\/do\/logout"\)/)
assert.match(guard, /content-type/i)
assert.match(guard, /window\.location\.replace\("\/login\.html"\)/)
assert.match(guard, /installXsuaaSessionMonitor/)
assert.match(guard, /XSUAA_RECOVERY_KEY/)
assert.match(guard, /status\s*===\s*401/)
assert.match(guard, /\/odata\/v4\//)
assert.match(guard, /window\.location\.reload\(\)/)
assert.match(guard, /sessionStorage\.removeItem\(XSUAA_RECOVERY_KEY\)/)
assert.match(guard, /originalFetch\.apply\(this, arguments\)/)
assert.match(guard, /loadBtpUser\(\)\.then[\s\S]*installXsuaaSessionMonitor\(\)/)

async function verifyXsuaaRecovery (transport) {
  const values = new Map([['idts_xsuaa_recovery', '1']])
  const calls = { reload: 0, fetch: 0 }

  class FakeXhr {
    constructor () { this.listeners = {} }
    open () {}
    send () {}
    addEventListener (name, listener) { this.listeners[name] = listener }
    complete (status) {
      this.status = status
      if (this.listeners.loadend) this.listeners.loadend()
    }
  }

  const sandbox = {
    AbortController,
    XMLHttpRequest: FakeXhr,
    Promise,
    console,
    setTimeout,
    clearTimeout,
    sessionStorage: {
      getItem: key => values.has(key) ? values.get(key) : null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: key => values.delete(key)
    },
    location: {
      pathname: '/idtsbugmanagementui/index.html',
      reload: () => { calls.reload += 1 },
      replace: () => {}
    },
    document: { readyState: 'complete' },
    fetch: async url => {
      calls.fetch += 1
      if (String(url).includes('/odata/v4/auth/me()')) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({ ID: 'user-1', role_code: 'PM' })
        }
      }
      return { ok: false, status: 401, headers: { get: () => 'application/json' } }
    }
  }
  sandbox.window = sandbox

  vm.runInNewContext(guard, sandbox)
  await sandbox.idtsAuthReady
  assert.equal(values.has('idts_xsuaa_recovery'), false, 'Successful AuthService.me must clear a stale recovery guard')

  if (transport === 'xhr') {
    const first = new sandbox.XMLHttpRequest()
    first.open('POST', '/odata/v4/bug/$batch')
    first.send()
    first.complete(401)
    first.complete(401)
  } else {
    await sandbox.fetch('/odata/v4/bug/readAiOperationalMetrics()')
    await sandbox.fetch('/odata/v4/bug/readAiOperationalMetrics()')
  }

  assert.equal(calls.reload, 1, transport + ' OData 401 must trigger exactly one top-level reload')
  assert.equal(values.get('idts_xsuaa_recovery'), '1')
}

// A database outage is an availability failure, not an authorization denial.
assert.match(guard, /AbortController/)
assert.match(guard, /error\.status === 403/)
assert.match(guard, /showServiceUnavailable/)
assert.match(guard, /IDTS is temporarily unavailable/)
assert.match(guard, /Retry/)

const server = read('server.js')
assert.match(server, /app\.get\('\/ready'/)
assert.match(server, /cds\.connect\.to\('db'\)/)
assert.match(server, /status\(503\)/)
assert.doesNotMatch(server, /res\.(?:send|json)\([^\n]*(?:error\.message|stack)/)

const demoReadiness = read('scripts/btp/prepare-demo.ps1')
assert.match(demoReadiness, /\[switch\]\$CheckOnly/)
assert.match(demoReadiness, /serviceStopped/)
assert.match(demoReadiness, /cf start/)
assert.match(demoReadiness, /\/ready/)
assert.match(demoReadiness, /UTF8Encoding\(\$false\)/)
assert.match(demoReadiness, /WriteAllText/)
assert.doesNotMatch(demoReadiness, /Set-Content[^\n]*-Encoding utf8/i)
assert.doesNotMatch(demoReadiness, /password|api[_-]?key|clientsecret/i)

const packageJson = readJson('package.json')
assert.match(packageJson.scripts['btp:demo:check'], /prepare-demo\.ps1 -CheckOnly/)
assert.match(packageJson.scripts['btp:demo:prepare'], /prepare-demo\.ps1/)

const runbook = read('docs/runbooks/btp-trial-demo-readiness.md')
assert.match(runbook, /HANA Cloud Free Tier/i)
assert.match(runbook, /30(?:–|-)45 minutes/i)
assert.match(runbook, /DB_PROBE_OK|database readiness/i)

Promise.resolve()
  .then(() => verifyXsuaaRecovery('xhr'))
  .then(() => verifyXsuaaRecovery('fetch'))
  .then(() => console.log('IDTS-117 checks passed: re-login, one-shot XHR/fetch recovery, DB readiness and demo preflight are configured.'))
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
