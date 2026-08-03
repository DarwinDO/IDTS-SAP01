'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

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

console.log('IDTS-117 checks passed: re-login, availability error classification, DB readiness and demo preflight are configured.')
