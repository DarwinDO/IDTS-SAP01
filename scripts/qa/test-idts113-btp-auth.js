'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')

const root = path.resolve(__dirname, '../..')
const roleModule = require('../../srv/auth/platform-role')
const authTest = require('../../srv/auth').__test

let passed = 0

function check (name, test) {
  try {
    test()
    passed += 1
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}: ${error.message}`)
    process.exitCode = 1
  }
}

function read (relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function rejectRequest () {
  return {
    reject (status, message) {
      const error = new Error(message)
      error.status = status
      throw error
    }
  }
}

const originalKind = cds.env.requires.auth.kind
const originalImpl = cds.env.requires.auth.impl
cds.env.requires.auth.kind = 'xsuaa'
delete cds.env.requires.auth.impl

check('XSUAA descriptor has all business and technical role templates', () => {
  const descriptor = JSON.parse(read('xs-security.json'))
  assert.deepEqual(
    descriptor['role-templates'].map(role => role.name).sort(),
    ['Developer', 'OutboxProcessor', 'PM', 'Tester']
  )
  assert.deepEqual(
    descriptor.scopes.map(scope => scope.name).sort(),
    [
      '$XSAPPNAME.DEVELOPER',
      '$XSAPPNAME.OutboxProcessor',
      '$XSAPPNAME.PM',
      '$XSAPPNAME.TESTER'
    ]
  )
})

check('exactly one matching XSUAA role aligns with the IDTS database role', () => {
  const req = rejectRequest()
  req.user = { is: role => role === 'TESTER' }
  const user = { ID: 'user-1', role_code: 'TESTER' }
  assert.equal(roleModule.enforcePlatformRoleAlignment(req, user), user)
})

check('XSUAA and database role mismatch is rejected with 403', () => {
  const req = rejectRequest()
  req.user = { is: role => role === 'DEVELOPER' }
  assert.throws(
    () => roleModule.enforcePlatformRoleAlignment(req, { role_code: 'PM' }),
    error => error.status === 403 && /does not match/.test(error.message)
  )
})

check('missing or multiple XSUAA business roles are rejected with 403', () => {
  const noRole = rejectRequest()
  noRole.user = { is: () => false }
  assert.throws(
    () => roleModule.enforcePlatformRoleAlignment(noRole, { role_code: 'PM' }),
    error => error.status === 403
  )

  const manyRoles = rejectRequest()
  manyRoles.user = { is: role => role === 'PM' || role === 'TESTER' }
  assert.throws(
    () => roleModule.enforcePlatformRoleAlignment(manyRoles, { role_code: 'PM' }),
    error => error.status === 403
  )
})

check('JWT identity candidates include subject and standard email claims', () => {
  assert.deepEqual(
    authTest.requestUserCandidates({
      user: {
        id: 'subject-1',
        attr: {
          email: 'pm@example.test',
          user_name: 'pm-user'
        }
      }
    }),
    ['subject-1', 'pm@example.test', 'pm-user']
  )
})

check('production uses XSUAA while integration retains custom auth', () => {
  const pkg = JSON.parse(read('package.json'))
  const auth = pkg.cds.requires.auth
  assert.equal(auth['[production]'].kind, 'xsuaa')
  assert.equal(auth['[integration]'].kind, 'mocked')
  assert.equal(auth['[integration]'].impl, './srv/auth/custom-auth.js')
})

check('Render integration profile cannot be mistaken for an XSUAA runtime', () => {
  cds.env.requires.auth.impl = './srv/auth/custom-auth.js'
  assert.equal(roleModule.isXsuaaRuntime(), false)
  delete cds.env.requires.auth.impl
})

check('MTA contains CAP, HANA, AppRouter, HTML5 repository, XSUAA, and Destination modules', () => {
  const mta = read('mta.yaml')
  for (const expected of [
    'name: idts-sap01-srv',
    'name: idts-sap01-db-deployer',
    'name: idts-sap01-approuter',
    'name: idts-sap01-app-content',
    'service: xsuaa',
    'service: hana',
    'service: html5-apps-repo',
    'service: destination',
    'forwardAuthToken: true'
  ]) {
    assert.ok(mta.includes(expected), `missing ${expected}`)
  }
  assert.ok(!mta.includes('prepare-cap-poc-ui.js'))
})

check('HTML5 application and standalone AppRouter both protect OData with XSUAA', () => {
  const appRoutes = JSON.parse(read('app/bug-management-ui/xs-app.json'))
  const routerRoutes = JSON.parse(read('app/router/xs-app.json'))
  for (const config of [appRoutes, routerRoutes]) {
    const odata = config.routes.find(route => route.destination === 'srv-api')
    assert.equal(odata.authenticationType, 'xsuaa')
  }
  assert.equal(routerRoutes.welcomeFile, '/idtsbugmanagementui/index.html')
})

check('Fiori manifest declares the BTP HTML5 cloud service', () => {
  const manifest = JSON.parse(read('app/bug-management-ui/webapp/manifest.json'))
  assert.equal(manifest['sap.cloud'].service, 'idts.sap01')
})

check('browser startup waits for custom or XSUAA authentication before UI5 bootstrap', () => {
  const guard = read('app/bug-management-ui/webapp/auth-guard.js')
  const bootstrap = read('app/bug-management-ui/webapp/bootstrap-ui5.js')
  const index = read('app/bug-management-ui/webapp/index.html')
  assert.ok(guard.includes('/odata/v4/auth/me()'))
  assert.ok(guard.includes('/do/logout'))
  assert.ok(bootstrap.includes('window.idtsAuthReady'))
  assert.ok(index.indexOf('auth-guard.js') < index.indexOf('bootstrap-ui5.js'))
  assert.ok(!index.includes('id="sap-ui-bootstrap"'))
})

cds.env.requires.auth.kind = originalKind
if (originalImpl === undefined) delete cds.env.requires.auth.impl
else cds.env.requires.auth.impl = originalImpl

if (process.exitCode) {
  console.error(`IDTS-113 BTP auth checks failed after ${passed} passes.`)
} else {
  console.log(`IDTS-113 BTP auth checks passed: ${passed}/11.`)
}
