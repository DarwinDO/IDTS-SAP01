'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const YAML = require('yaml')

const root = path.resolve(__dirname, '../..')
const app = path.join(root, 'app/user-administration-ui')
const webapp = path.join(app, 'webapp')

const manifest = JSON.parse(fs.readFileSync(path.join(webapp, 'manifest.json'), 'utf8'))
assert.equal(manifest['sap.app'].id, 'idts.useradministrationui')
assert.equal(manifest['sap.app'].dataSources.mainService.uri, '/odata/v4/user-administration/')
assert.equal(manifest['sap.app'].dataSources.mainService.settings.odataVersion, '4.0')

const xsApp = JSON.parse(fs.readFileSync(path.join(app, 'xs-app.json'), 'utf8'))
const protectedRoutes = xsApp.routes.filter(route => route.authenticationType === 'xsuaa')
assert.equal(protectedRoutes.length, 2)
for (const route of protectedRoutes) {
  assert.equal(route.scope, '$XSAPPNAME.UserAdmin')
}
assert.ok(protectedRoutes.some(route => route.source === '^/odata/(.*)$' && route.destination === 'srv-api'))
assert.ok(protectedRoutes.some(route => route.source === '^(.*)$' && route.service === 'html5-apps-repo-rt'))

const mta = YAML.parse(fs.readFileSync(path.join(root, 'mta.yaml'), 'utf8'))
const uiModule = mta.modules.find(module => module.name === 'idts-sap01-user-admin-ui')
assert.equal(uiModule.type, 'html5')
assert.equal(uiModule.path, 'app/user-administration-ui')
assert.deepEqual(uiModule['build-parameters'].commands, ['npm ci --workspaces=false', 'npm run build'])
const contentModule = mta.modules.find(module => module.name === 'idts-sap01-app-content')
const contentRequirement = contentModule['build-parameters'].requires.find(requirement => requirement.name === 'idts-sap01-user-admin-ui')
assert.deepEqual(contentRequirement.artifacts, ['user-administration-ui.zip'])
assert.equal(contentRequirement['target-path'], 'app/')

const appPackage = JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf8'))
assert.equal(manifest['sap.app'].applicationVersion.version, appPackage.version, 'HTML5 manifest and package versions stay aligned')
assert.notEqual(appPackage.version, '1.0.0', 'changed HTML5 content must use a new application version')
assert.match(appPackage.scripts.build, /ui5 build preload/)
assert.match(appPackage.scripts.build, /--include-task generateCachebusterInfo/)
assert.equal(appPackage.devDependencies['ui5-task-zipper'], '^3.4.2')
assert.ok(fs.existsSync(path.join(app, 'package-lock.json')))

const ui5Config = YAML.parse(fs.readFileSync(path.join(app, 'ui5.yaml'), 'utf8'))
const zipperTask = ui5Config.builder.customTasks.find(task => task.name === 'ui5-task-zipper')
assert.equal(zipperTask.afterTask, 'generateCachebusterInfo', 'the deployable ZIP must be created after cache-buster metadata')

const indexHtml = fs.readFileSync(path.join(webapp, 'index.html'), 'utf8')
assert.match(indexHtml, /data-sap-ui-app-cache-buster="\.\/"/)

const view = fs.readFileSync(path.join(webapp, 'view/Main.view.xml'), 'utf8')
assert.match(view, /<SearchField/)
assert.match(view, /<Table/)
assert.match(view, /items="\{requests>\/items\}"/)
assert.match(view, /press="\.onOpenInvite"/)
assert.match(view, /press="\.onApproveProvisioning"/)
assert.match(view, /press="\.onOpenRoleChange"/)
assert.match(view, /press="\.onOpenRevoke"/)
assert.match(view, /press="\.onRetryAccessOperation"/)
assert.match(view, /press="\.onReconcileAccessOperation"/)
assert.match(view, /press="\.onOpenDeveloperProfile"/)
assert.doesNotMatch(view, /type="Password"|tokenHash|tokenNonce|identityIssuer/)

const fragment = fs.readFileSync(path.join(webapp, 'fragment/InviteUser.fragment.xml'), 'utf8')
assert.match(fragment, /<Input[^>]+type="Email"/)
assert.match(fragment, /<Select/)
assert.match(fragment, /<CheckBox/)
assert.match(fragment, /press="\.onConfirmInvite"/)
assert.match(fragment, /invite>\/developerProfile\/responsibilities/)
assert.match(fragment, /press="\.onAddInviteResponsibility"/)
assert.match(fragment, /valueState="\{=/)
assert.match(fragment, /valueLiveUpdate="true"/)
assert.match(fragment, /!\$\{invite>\/submitting\}/)
assert.doesNotMatch(fragment, /Password|OTP|passkey|token/i)

const controller = fs.readFileSync(path.join(webapp, 'controller/Main.controller.js'), 'utf8')
assert.match(controller, /^sap\.ui\.define\(/)
assert.match(controller, /bindContext\("\/requestOnboarding\(\.\.\.\)"\)/)
assert.match(controller, /setParameter\("email"/)
assert.match(controller, /setParameter\("requestedRole"/)
assert.match(controller, /setParameter\("userAdminRequested"/)
assert.match(controller, /setParameter\("developerProfile"/)
assert.match(controller, /await oOperation\.invoke\("\$direct"\)/)
assert.match(controller, /bindContext\("\/searchOnboarding\(\.\.\.\)"\)/)
assert.match(controller, /"approveProvisioning"/)
assert.match(controller, /"requestRoleChange"/)
assert.match(controller, /"requestRevoke"/)
assert.match(controller, /"retryAccessOperation"/)
assert.match(controller, /"reconcileAccessOperation"/)
assert.match(controller, /readDeveloperProfile/)
assert.match(controller, /"updateDeveloperProfile"/)
assert.match(controller, /sapModules:\s*\[\{ ID: "", name: sAnySapModule \}, \.\.\.aModules\]/)
assert.match(controller, /_confirm\("retryConfirmation"\)/)
assert.match(controller, /_confirm\("reconcileConfirmation"\)/)
assert.match(controller, /bindContext\(`\/\$\{sAction\}\(\.\.\.\)`\)/)
assert.doesNotMatch(controller, /new Filter\("targetEmailNormalized"/)
assert.match(controller, /if \(sRole !== "PM"\)[\s\S]+setProperty\("\/userAdminRequested", false\)/)
assert.doesNotMatch(controller, /console\.|responseText|api[_-]?key|client[_-]?secret/i)

const manageFragment = fs.readFileSync(path.join(webapp, 'fragment/ManageAccess.fragment.xml'), 'utf8')
assert.match(manageFragment, /<Select/)
assert.match(manageFragment, /<CheckBox/)
assert.match(manageFragment, /<TextArea/)
assert.match(manageFragment, /valueLiveUpdate="true"/)
assert.match(manageFragment, /type="\{= \$\{access>\/mode\} === 'REVOKE' \? 'Negative' : 'Emphasized' \}"/)
assert.match(manageFragment, /press="\.onConfirmAccessChange"/)
assert.doesNotMatch(manageFragment, /stretchOnPhone=/)
assert.doesNotMatch(manageFragment, /Password|OTP|passkey|token/i)

const developerFragment = fs.readFileSync(path.join(webapp, 'fragment/ManageDeveloperProfile.fragment.xml'), 'utf8')
assert.match(developerFragment, /developer>\/developerProfile\/responsibilities/)
assert.match(developerFragment, /press="\.onConfirmDeveloperProfile"/)
assert.match(developerFragment, /press="\.onAddDeveloperResponsibility"/)
assert.doesNotMatch(developerFragment, /Password|OTP|passkey|token/i)

const controllerDefinition = loadController(controller)
assert.equal(typeof controllerDefinition.onConfirmInvite, 'function')
assert.equal(typeof controllerDefinition._loadRequests, 'function')
assert.equal(typeof controllerDefinition._loadInitialRequests, 'function')
assert.equal(typeof controllerDefinition.onAfterRendering, 'function')
assert.match(controller, /this\.getResourceBundle\(\)/)

async function verifyRuntimeBehavior () {
  let initialLoadCount = 0
  const initialLoadInstance = Object.assign(Object.create(controllerDefinition), {
    _loadInitialRequests: async () => { initialLoadCount += 1 },
    _initialRequestsStarted: false
  })
  initialLoadInstance.onAfterRendering()
  initialLoadInstance.onAfterRendering()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(initialLoadCount, 1, 'initial search starts once after the view is rendered')

  let loadQuery
  const directInitialLoadInstance = Object.assign(Object.create(controllerDefinition), {
    _loadRequests: async query => {
      loadQuery = query
    }
  })
  await directInitialLoadInstance._loadInitialRequests()
  assert.equal(loadQuery, '')

  let inviteData = {
    email: 'controlled.test@example.invalid',
    role: 'PM',
    userAdminRequested: true,
    emailValid: true,
    canSubmit: true,
    submitting: false
  }
  let actionInvocations = 0
  let releaseInvite
  const inviteDone = new Promise(resolve => { releaseInvite = resolve })
  const operation = {
    setParameter: () => operation,
    invoke: async () => {
      actionInvocations += 1
      await inviteDone
    }
  }
  const instance = Object.assign(Object.create(controllerDefinition), {
    getModel: name => {
      if (name === 'invite') {
        return {
          getData: () => inviteData,
          setData: data => { inviteData = data },
          setProperty: (key, value) => { inviteData[key.slice(1)] = value }
        }
      }
      if (name === 'view') return { setProperty: () => {} }
      if (name === 'requests') return { setProperty: () => {} }
      if (name === 'i18n') return { getResourceBundle: async () => ({ getText: key => key }) }
      throw new Error(`Unexpected model ${name}`)
    },
    getResourceBundle: async () => ({ getText: key => key }),
    getView: () => ({
      getModel: () => ({ bindContext: () => operation })
    }),
    byId: () => ({ getBinding: () => ({ refresh: () => {} }) }),
    _inviteDialog: { close: () => {} },
    _loadRequests: async () => {}
  })

  inviteData.email = ''
  inviteData.emailValid = false
  inviteData.canSubmit = false
  instance.onInviteFieldChange({ getParameter: name => name === 'value' ? 'new.user@example.invalid' : undefined })
  assert.equal(inviteData.email, 'new.user@example.invalid')
  assert.equal(inviteData.emailValid, true)
  assert.equal(inviteData.canSubmit, true)

  const first = instance.onConfirmInvite()
  const second = instance.onConfirmInvite()
  assert.equal(actionInvocations, 1)
  releaseInvite()
  await Promise.all([first, second])

  let searchParameter
  let searchInvocations = 0
  const searchOperation = {
    setParameter: (_name, value) => { searchParameter = value },
    invoke: async () => { searchInvocations += 1 },
    getBoundContext: () => ({ requestObject: async () => ({ value: [] }) })
  }
  instance._loadRequests = controllerDefinition._loadRequests
  instance.getView = () => ({ getModel: () => ({ bindContext: () => searchOperation }) })
  await instance._loadRequests('Mixed.Case@Example.Invalid')
  assert.equal(searchParameter, 'mixed.case@example.invalid')
  assert.equal(searchInvocations, 1)
}

function loadController (source) {
  let definition
  const BaseController = { extend: (_name, value) => { definition = value; return { prototype: value } } }
  const sandbox = {
    sap: {
      ui: {
        define: (_dependencies, factory) => factory(
          BaseController,
          { load: async () => ({}) },
          function JSONModel () {},
          { error: () => {}, warning: () => {} },
          { show: () => {} }
        )
      }
    }
  }
  vm.runInNewContext(source, sandbox, { filename: 'Main.controller.js' })
  return definition
}

for (const locale of ['i18n.properties', 'i18n_en.properties']) {
  const text = fs.readFileSync(path.join(webapp, 'i18n', locale), 'utf8')
  for (const key of ['appTitle', 'inviteUser', 'targetEmail', 'businessRole', 'userAdminCapability', 'sendInvitation', 'retryConfirmation', 'reconcileConfirmation', 'manageResponsibilities']) {
    assert.match(text, new RegExp(`^${key}=`, 'm'))
  }
}

verifyRuntimeBehavior().then(() => {
  console.log('IDTS User Administration UI contract: PASS')
}).catch(error => {
  process.nextTick(() => { throw error })
})
