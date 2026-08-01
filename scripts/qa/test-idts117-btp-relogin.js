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

console.log('IDTS-117 BTP re-login checks passed: logout page, protected login bridge and HTML-response recovery are configured.')
