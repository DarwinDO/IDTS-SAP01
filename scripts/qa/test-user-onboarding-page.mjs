import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = path.resolve(import.meta.dirname, '../..')
const resources = path.join(root, 'app/router/resources/onboarding')
const modulePath = path.join(resources, 'onboarding-page.mjs')

const page = await import(pathToFileURL(modulePath).href)
const token = 'eyJpZCI6IjcxMDAwMDAwLTAwMDAtNDAwMC04MDAwLTAwMDAwMDAwMDAwMSJ9.controlledSignature123456789012345678'

assert.equal(page.invitationTokenFromHash(`#token=${token}`), token)
assert.equal(page.invitationTokenFromHash('#other=value'), null)
assert.equal(page.invitationTokenFromHash(`#token=${'a'.repeat(2049)}`), null)

const storage = new Map()
const calls = []
const continueResult = page.continueToSapLogin({
  hash: `#token=${token}`,
  pathname: '/onboarding/continue',
  search: '',
  storage: {
    setItem: (key, value) => storage.set(key, value)
  },
  replaceHistory: value => calls.push(['history', value]),
  navigate: value => calls.push(['navigate', value])
})
assert.equal(continueResult, true)
assert.equal(storage.get(page.STORAGE_KEY), token)
assert.deepEqual(calls, [
  ['history', '/onboarding/continue'],
  ['navigate', '/onboarding/authenticate']
])

const requestLog = []
const response = await page.verifyInvitation({
  token,
  fetchImpl: async (url, options) => {
    requestLog.push({ url, options })
    if (options.method === 'GET') {
      return {
        ok: true,
        headers: { get: name => name.toLowerCase() === 'x-csrf-token' ? 'controlled-csrf' : null }
      }
    }
    return {
      ok: true,
      json: async () => ({ status: 'IDENTITY_VERIFIED' })
    }
  }
})
assert.equal(response.status, 'IDENTITY_VERIFIED')
assert.equal(requestLog.length, 2)
assert.equal(requestLog[0].url, '/odata/v4/user-administration/')
assert.equal(requestLog[0].options.method, 'GET')
assert.equal(requestLog[0].options.headers['X-CSRF-Token'], 'Fetch')
assert.equal(requestLog[1].url, '/odata/v4/user-administration/verifySapIdentity')
assert.equal(requestLog[1].options.method, 'POST')
assert.equal(requestLog[1].options.headers['X-CSRF-Token'], 'controlled-csrf')
assert.deepEqual(JSON.parse(requestLog[1].options.body), { token })
assert.equal(requestLog[1].options.referrerPolicy, 'no-referrer')
assert.doesNotMatch(requestLog[1].url, /token|eyJ/)

assert.equal(page.safeErrorMessage({ status: 410 }), 'This invitation has expired. Ask an IDTS Project Manager to send a new invitation.')
assert.equal(page.safeErrorMessage({ status: 503 }), 'Identity verification is temporarily unavailable. Try again.')
assert.equal(page.safeErrorMessage({ status: 500, providerBody: 'private failure' }), 'Identity verification failed. Try again or contact an IDTS Project Manager.')

const router = JSON.parse(fs.readFileSync(path.join(root, 'app/router/xs-app.json'), 'utf8'))
const publicRoute = router.routes.find(route => route.source === '^/onboarding/continue$')
const protectedRoute = router.routes.find(route => route.source === '^/onboarding/authenticate$')
assert.equal(publicRoute?.authenticationType, 'none')
assert.equal(protectedRoute?.authenticationType, 'xsuaa')
assert.match(publicRoute?.cacheControl || '', /no-store/)
assert.match(protectedRoute?.cacheControl || '', /no-store/)

for (const name of ['continue.html', 'authenticate.html']) {
  const html = fs.readFileSync(path.join(resources, name), 'utf8')
  assert.match(html, /<meta name="referrer" content="no-referrer">/)
  assert.match(html, /<meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate">/)
  assert.doesNotMatch(html, /<input[^>]+type="password"/i)
  assert.doesNotMatch(html, /<script(?![^>]+src=)/i)
  assert.doesNotMatch(html, /token=|@gmail\.com|api[_-]?key/i)
}

console.log('IDTS onboarding callback page checks: PASS')
